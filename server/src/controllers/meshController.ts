import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/db';
import { emitToAll, emitToUser, emitToRole } from '../socket/socketHandler';

export const publishMeshMessage = async (req: AuthRequest, res: Response) => {
  try {
    const {
      messageId,
      senderDeviceId,
      messageType,
      priority,
      latitude,
      longitude,
      payload,
      ttl,
      hopCount,
    } = req.body;

    if (!messageId || !senderDeviceId || !messageType || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: 'Missing mesh message attributes' });
    }

    // Check duplicate
    const existing = await prisma.meshMessage.findUnique({ where: { messageId } });
    if (existing) {
      return res.status(409).json({ error: 'Message already exists in system' });
    }

    const message = await prisma.meshMessage.create({
      data: {
        messageId,
        senderDeviceId,
        messageType,
        priority: priority || 'MEDIUM',
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        payload: typeof payload === 'string' ? payload : JSON.stringify(payload),
        status: 'DELIVERED_TO_RESCUE',
        hopCount: hopCount ? parseInt(hopCount) : 0,
        ttl: ttl ? parseInt(ttl) : 24,
        deliveredAt: new Date(),
        serverSyncedAt: new Date(),
      },
    });

    // Also sync to standard emergency logs if it's an SOS or medical request
    if (messageType === 'SOS' || messageType === 'MEDICAL_EMERGENCY') {
      const p = typeof payload === 'string' ? JSON.parse(payload) : payload;
      // Search or create user
      let user = await prisma.user.findFirst({ where: { phone: p.contactPhone || '9999999999' } });
      if (!user) {
        user = await prisma.user.findFirst({ where: { role: 'VICTIM' } }); // Fallback to first victim
      }

      if (user) {
        await prisma.sOSRequest.create({
          data: {
            victimId: user.id,
            emergencyType: messageType,
            severity: priority || 'HIGH',
            peopleCount: p.peopleCount ? parseInt(p.peopleCount) : 1,
            locationLat: parseFloat(latitude),
            locationLng: parseFloat(longitude),
            address: `Mesh Relay Target - Sender: ${senderDeviceId}`,
            message: p.message || 'Mesh distress beacon',
            contactPhone: p.contactPhone || user.phone,
            status: 'RECEIVED',
          },
        });
      }
    }

    emitToAll('mesh:message-received', message);
    emitToRole('RESCUE', 'mesh:message-delivered', message);

    return res.status(201).json(message);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to publish mesh message' });
  }
};

export const syncMeshBatch = async (req: AuthRequest, res: Response) => {
  try {
    const { batch } = req.body; // Array of mesh messages
    if (!batch || !Array.isArray(batch)) {
      return res.status(400).json({ error: 'Batch must be an array' });
    }

    const results = [];

    for (const item of batch) {
      const {
        messageId,
        senderDeviceId,
        messageType,
        priority,
        latitude,
        longitude,
        payload,
        ttl,
        hopCount,
      } = item;

      try {
        const existing = await prisma.meshMessage.findUnique({ where: { messageId } });
        if (existing) {
          results.push({ messageId, status: 'EXISTS', originalId: existing.id });
          continue;
        }

        const msg = await prisma.meshMessage.create({
          data: {
            messageId,
            senderDeviceId,
            messageType,
            priority: priority || 'MEDIUM',
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
            payload: typeof payload === 'string' ? payload : JSON.stringify(payload),
            status: 'SERVER_SYNCED',
            hopCount: hopCount ? parseInt(hopCount) + 1 : 1,
            ttl: ttl ? parseInt(ttl) : 24,
            deliveredAt: new Date(),
            serverSyncedAt: new Date(),
          },
        });

        // Duplicate relay logic to standard tables
        if (messageType === 'SOS' || messageType === 'MEDICAL_EMERGENCY') {
          const p = typeof payload === 'string' ? JSON.parse(payload) : payload;
          const user = await prisma.user.findFirst({ where: { role: 'VICTIM' } });
          if (user) {
            await prisma.sOSRequest.create({
              data: {
                victimId: user.id,
                emergencyType: messageType,
                severity: priority || 'HIGH',
                peopleCount: p.peopleCount ? parseInt(p.peopleCount) : 1,
                locationLat: parseFloat(latitude),
                locationLng: parseFloat(longitude),
                address: `Mesh Relay - Sender: ${senderDeviceId}`,
                message: p.message || 'Mesh distress beacon',
                contactPhone: p.contactPhone || user.phone,
                status: 'RECEIVED',
              },
            });
          }
        }

        emitToAll('mesh:message-received', msg);
        results.push({ messageId, status: 'SUCCESS', originalId: msg.id });
      } catch (err: any) {
        results.push({ messageId, status: 'FAILED', error: err.message });
      }
    }

    return res.json({ success: true, results });
  } catch (err: any) {
    return res.status(500).json({ error: 'Batch upload crashed' });
  }
};

export const acknowledgeMessages = async (req: AuthRequest, res: Response) => {
  try {
    const { messageIds } = req.body;
    if (!messageIds || !Array.isArray(messageIds)) {
      return res.status(400).json({ error: 'Message IDs list is required' });
    }

    await prisma.meshMessage.updateMany({
      where: { messageId: { in: messageIds } },
      data: {
        serverSyncedAt: new Date(),
        status: 'SERVER_SYNCED',
      },
    });

    emitToAll('mesh:sync-completed', { messageIds });
    return res.json({ success: true, message: 'Messages acknowledged' });
  } catch (err) {
    return res.status(500).json({ error: 'Acknowledge failed' });
  }
};

export const getMeshStatus = async (req: AuthRequest, res: Response) => {
  try {
    const totalMessages = await prisma.meshMessage.count();
    const syncedMessages = await prisma.meshMessage.count({
      where: { NOT: { serverSyncedAt: null } },
    });
    const deviceCount = await prisma.meshDevice.count();

    return res.json({
      status: 'ACTIVE',
      devicesCount: deviceCount,
      messages: {
        total: totalMessages,
        synced: syncedMessages,
        pending: totalMessages - syncedMessages,
      },
    });
  } catch (err) {
    return res.status(500).json({ error: 'Status check failed' });
  }
};

export const getMeshMessageDetails = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const message = await prisma.meshMessage.findUnique({ where: { id } });
    if (!message) return res.status(404).json({ error: 'Message not found' });
    return res.json(message);
  } catch (err) {
    return res.status(500).json({ error: 'Query failed' });
  }
};
