import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { adminDb } from '../config/firebase';
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
    const existingQuery = await adminDb.collection('meshMessages').where('messageId', '==', messageId).limit(1).get();
    if (!existingQuery.empty) {
      return res.status(409).json({ error: 'Message already exists in system' });
    }

    const messageData = {
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
      deliveredAt: new Date().toISOString(),
      serverSyncedAt: new Date().toISOString(),
    };

    const msgRef = await adminDb.collection('meshMessages').add(messageData);
    const message = { id: msgRef.id, ...messageData };

    // Also sync to standard emergency logs if it's an SOS or medical request
    if (messageType === 'SOS' || messageType === 'MEDICAL_EMERGENCY') {
      const p = typeof payload === 'string' ? JSON.parse(payload) : payload;
      
      // Search or create user
      let userId = null;
      let userPhone = p.contactPhone || '9999999999';
      
      const userPhoneQuery = await adminDb.collection('users').where('phone', '==', userPhone).limit(1).get();
      if (!userPhoneQuery.empty) {
        userId = userPhoneQuery.docs[0].id;
      } else {
        const victimQuery = await adminDb.collection('users').where('role', '==', 'VICTIM').limit(1).get();
        if (!victimQuery.empty) {
          userId = victimQuery.docs[0].id;
          userPhone = victimQuery.docs[0].data().phone;
        }
      }

      if (userId) {
        await adminDb.collection('sosRequests').add({
          victimId: userId,
          emergencyType: messageType,
          severity: priority || 'HIGH',
          peopleCount: p.peopleCount ? parseInt(p.peopleCount) : 1,
          locationLat: parseFloat(latitude),
          locationLng: parseFloat(longitude),
          address: `Mesh Relay Target - Sender: ${senderDeviceId}`,
          message: p.message || 'Mesh distress beacon',
          contactPhone: userPhone,
          status: 'RECEIVED',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
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
    const { batch } = req.body; 
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
        const existingQuery = await adminDb.collection('meshMessages').where('messageId', '==', messageId).limit(1).get();
        if (!existingQuery.empty) {
          results.push({ messageId, status: 'EXISTS', originalId: existingQuery.docs[0].id });
          continue;
        }

        const messageData = {
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
          deliveredAt: new Date().toISOString(),
          serverSyncedAt: new Date().toISOString(),
        };

        const msgRef = await adminDb.collection('meshMessages').add(messageData);
        const msg = { id: msgRef.id, ...messageData };

        if (messageType === 'SOS' || messageType === 'MEDICAL_EMERGENCY') {
          const p = typeof payload === 'string' ? JSON.parse(payload) : payload;
          const victimQuery = await adminDb.collection('users').where('role', '==', 'VICTIM').limit(1).get();
          
          if (!victimQuery.empty) {
            const user = victimQuery.docs[0].data();
            const userId = victimQuery.docs[0].id;
            
            await adminDb.collection('sosRequests').add({
              victimId: userId,
              emergencyType: messageType,
              severity: priority || 'HIGH',
              peopleCount: p.peopleCount ? parseInt(p.peopleCount) : 1,
              locationLat: parseFloat(latitude),
              locationLng: parseFloat(longitude),
              address: `Mesh Relay - Sender: ${senderDeviceId}`,
              message: p.message || 'Mesh distress beacon',
              contactPhone: p.contactPhone || user.phone,
              status: 'RECEIVED',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
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

    const batch = adminDb.batch();
    
    // We have to query each to get the doc ref, since messageIds are a custom field
    for (const msgId of messageIds) {
      const q = await adminDb.collection('meshMessages').where('messageId', '==', msgId).get();
      q.forEach((doc: any) => {
        batch.update(doc.ref, {
          serverSyncedAt: new Date().toISOString(),
          status: 'SERVER_SYNCED'
        });
      });
    }

    await batch.commit();

    emitToAll('mesh:sync-completed', { messageIds });
    return res.json({ success: true, message: 'Messages acknowledged' });
  } catch (err) {
    return res.status(500).json({ error: 'Acknowledge failed' });
  }
};

export const getMeshStatus = async (req: AuthRequest, res: Response) => {
  try {
    const totalSnap = await adminDb.collection('meshMessages').count().get();
    const syncedSnap = await adminDb.collection('meshMessages').where('status', '==', 'SERVER_SYNCED').count().get();
    const deviceSnap = await adminDb.collection('meshDevices').count().get();

    const totalMessages = totalSnap.data().count;
    const syncedMessages = syncedSnap.data().count;

    return res.json({
      status: 'ACTIVE',
      devicesCount: deviceSnap.data().count,
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
    const doc = await adminDb.collection('meshMessages').doc(id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Message not found' });
    return res.json({ id: doc.id, ...doc.data() });
  } catch (err) {
    return res.status(500).json({ error: 'Query failed' });
  }
};
