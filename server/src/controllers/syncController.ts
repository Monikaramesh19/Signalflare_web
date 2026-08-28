import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { adminDb } from '../config/firebase';
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

    const { queue } = req.body; 
    if (!queue || !Array.isArray(queue)) {
      return res.status(400).json({ error: 'Sync queue must be an array' });
    }

    const results = [];

    for (const item of queue) {
      const { id: tempId, action, payload } = item;
      try {
        if (action === 'CREATE_SOS') {
          const sosData = {
            victimId: userId,
            emergencyType: payload.emergencyType || 'OTHER',
            severity: payload.severity || 'MEDIUM',
            peopleCount: payload.peopleCount ? parseInt(payload.peopleCount) : 1,
            locationLat: parseFloat(payload.locationLat),
            locationLng: parseFloat(payload.locationLng),
            address: payload.address || null,
            message: payload.message || null,
            contactPhone: payload.contactPhone || null,
            status: 'CREATED',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          const docRef = await adminDb.collection('sosRequests').add(sosData);

          if (payload.photo) {
            await adminDb.collection('emergencyPhotos').add({
              sosRequestId: docRef.id,
              photoUrl: payload.photo,
              createdAt: new Date().toISOString(),
            });
          }

          const victimDoc = await adminDb.collection('users').doc(userId).get();
          const sos = { id: docRef.id, ...sosData, victim: victimDoc.exists ? victimDoc.data() : null };

          // Socket Broadcast
          emitToRole('RESCUE', 'sos:created', sos);
          emitToRole('VOLUNTEER', 'sos:created', sos);

          results.push({ tempId, status: 'SUCCESS', originalId: docRef.id });
        } else if (action === 'CREATE_RESOURCE_REQ') {
          const reqData = {
            victimId: userId,
            resourceName: payload.resourceName,
            quantity: parseInt(payload.quantity),
            locationLat: payload.locationLat ? parseFloat(payload.locationLat) : null,
            locationLng: payload.locationLng ? parseFloat(payload.locationLng) : null,
            address: payload.address || null,
            contactPhone: payload.contactPhone || null,
            status: 'PENDING',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          const docRef = await adminDb.collection('resourceRequests').add(reqData);

          const victimDoc = await adminDb.collection('users').doc(userId).get();
          const reqItem = { id: docRef.id, ...reqData, victim: victimDoc.exists ? victimDoc.data() : null };

          emitToRole('RESCUE', 'request:created', reqItem);
          emitToRole('VOLUNTEER', 'request:created', reqItem);

          results.push({ tempId, status: 'SUCCESS', originalId: docRef.id });
        } else if (action === 'SEND_MESSAGE') {
          const msgData = {
            senderId: userId,
            receiverId: payload.receiverId,
            content: payload.content,
            createdAt: new Date().toISOString(),
            isRead: false,
          };
          
          const docRef = await adminDb.collection('messages').add(msgData);
          const msg = { id: docRef.id, ...msgData };

          emitToUser(payload.receiverId, 'message:received', msg);

          results.push({ tempId, status: 'SUCCESS', originalId: docRef.id });
        } else {
          results.push({ tempId, status: 'FAILED', error: 'Unknown sync action' });
        }
      } catch (err: any) {
        console.error(`Sync item error for ${action}:`, err);
        results.push({ tempId, status: 'FAILED', error: err.message });
      }
    }

    // Audit sync action
    await adminDb.collection('auditLogs').add({
      userId,
      action: 'SYNC',
      details: `Synced ${queue.length} items. Success: ${results.filter((r) => r.status === 'SUCCESS').length}`,
      ipAddress: req.ip,
      createdAt: new Date().toISOString(),
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
