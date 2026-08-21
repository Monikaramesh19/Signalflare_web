import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/db';
import { emitToRole, emitToUser, emitToAll } from '../socket/socketHandler';

interface SyncItem {
  id: string;
  action: 'CREATE_SOS' | 'CREATE_RESOURCE_REQ' | 'SEND_MESSAGE';
  payload: any;
}

export const syncOfflineData = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { queue } = req.body; // Array of SyncItem
    if (!queue || !Array.isArray(queue)) {
      return res.status(400).json({ error: 'Sync queue must be an array' });
    }

    const results = [];

    for (const item of queue) {
      const { id: tempId, action, payload } = item;
      try {
        if (action === 'CREATE_SOS') {
          const sos = await prisma.sOSRequest.create({
            data: {
              victimId: userId,
              emergencyType: payload.emergencyType || 'OTHER',
              severity: payload.severity || 'MEDIUM',
              peopleCount: payload.peopleCount ? parseInt(payload.peopleCount) : 1,
              locationLat: parseFloat(payload.locationLat),
              locationLng: parseFloat(payload.locationLng),
              address: payload.address,
              message: payload.message,
              contactPhone: payload.contactPhone,
              status: 'CREATED',
            },
            include: { victim: { select: { id: true, name: true, phone: true } } },
          });

          // Upload photos if any
          if (payload.photo) {
            await prisma.emergencyPhoto.create({
              data: {
                sosRequestId: sos.id,
                photoUrl: payload.photo,
              },
            });
          }

          // Socket Broadcast
          emitToRole('RESCUE', 'sos:created', sos);
          emitToRole('VOLUNTEER', 'sos:created', sos);

          results.push({ tempId, status: 'SUCCESS', originalId: sos.id });
        } else if (action === 'CREATE_RESOURCE_REQ') {
          const reqItem = await prisma.resourceRequest.create({
            data: {
              victimId: userId,
              resourceName: payload.resourceName,
              quantity: parseInt(payload.quantity),
              locationLat: payload.locationLat ? parseFloat(payload.locationLat) : null,
              locationLng: payload.locationLng ? parseFloat(payload.locationLng) : null,
              address: payload.address,
              contactPhone: payload.contactPhone,
              status: 'PENDING',
            },
            include: { victim: { select: { id: true, name: true, phone: true } } },
          });

          emitToRole('RESCUE', 'request:created', reqItem);
          emitToRole('VOLUNTEER', 'request:created', reqItem);

          results.push({ tempId, status: 'SUCCESS', originalId: reqItem.id });
        } else if (action === 'SEND_MESSAGE') {
          const msg = await prisma.message.create({
            data: {
              senderId: userId,
              receiverId: payload.receiverId,
              content: payload.content,
            },
          });

          emitToUser(payload.receiverId, 'message:received', msg);

          results.push({ tempId, status: 'SUCCESS', originalId: msg.id });
        } else {
          results.push({ tempId, status: 'FAILED', error: 'Unknown sync action' });
        }
      } catch (err: any) {
        console.error(`Sync item error for ${action}:`, err);
        results.push({ tempId, status: 'FAILED', error: err.message });
      }
    }

    // Audit sync action
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'SYNC',
        details: `Synced ${queue.length} items. Success: ${results.filter((r) => r.status === 'SUCCESS').length}`,
        ipAddress: req.ip,
      },
    });

    emitToUser(userId, 'sync:completed', { results });
    return res.json({ success: true, results });
  } catch (err: any) {
    return res.status(500).json({ error: 'Sync pipeline crashed' });
  }
};

export const getSyncStatus = async (req: AuthRequest, res: Response) => {
  return res.json({
    status: 'ONLINE',
    time: new Date(),
  });
};
