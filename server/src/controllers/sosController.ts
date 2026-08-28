import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { adminDb } from '../config/firebase';
import { emitToRole, emitToUser, emitToRoom, emitToAll } from '../socket/socketHandler';

export const createSOS = async (req: AuthRequest, res: Response) => {
  try {
    const victimId = req.user?.id;
    if (!victimId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const {
      emergencyType,
      severity,
      peopleCount,
      locationLat,
      locationLng,
      address,
      message,
      contactPhone,
      photo,
    } = req.body;

    if (!emergencyType || !severity || locationLat === undefined || locationLng === undefined) {
      return res.status(400).json({ error: 'Missing required SOS details' });
    }

    const sosData = {
      victimId,
      emergencyType,
      severity,
      peopleCount: peopleCount ? parseInt(peopleCount) : 1,
      locationLat: parseFloat(locationLat),
      locationLng: parseFloat(locationLng),
      address: address || null,
      message: message || null,
      contactPhone: contactPhone || null,
      status: 'CREATED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const sosRef = await adminDb.collection('sosRequests').add(sosData);

    if (photo) {
      await adminDb.collection('emergencyPhotos').add({
        sosRequestId: sosRef.id,
        photoUrl: photo,
        createdAt: new Date().toISOString(),
      });
    }

    // Fetch victim details to include in the response
    const victimDoc = await adminDb.collection('users').doc(victimId).get();
    const victimData = victimDoc.exists ? victimDoc.data() : { id: victimId };
    
    // Construct final SOS object
    const finalSos = {
      id: sosRef.id,
      ...sosData,
      victim: victimData,
      photos: photo ? [{ photoUrl: photo }] : [],
    };

    // Create a system-wide notification
    await adminDb.collection('notifications').add({
      userId: victimId,
      title: 'SOS Broadcast Active',
      message: `Your SOS for ${emergencyType} emergency was successfully broadcasted.`,
      type: 'SOS_UPDATE',
      createdAt: new Date().toISOString(),
      isRead: false
    });

    // Emit Socket.IO Events
    emitToRole('RESCUE', 'sos:created', finalSos);
    emitToRole('VOLUNTEER', 'sos:created', finalSos);
    emitToUser(victimId, 'notification:new', {
      title: 'SOS Broadcast Active',
      message: `Your SOS for ${emergencyType} emergency was successfully broadcasted.`,
    });

    return res.status(201).json(finalSos);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Failed to create SOS request' });
  }
};

export const getSOSRequests = async (req: AuthRequest, res: Response) => {
  try {
    const snapshot = await adminDb.collection('sosRequests').orderBy('createdAt', 'desc').get();
    const requests = [];

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const victimDoc = await adminDb.collection('users').doc(data.victimId).get();
      requests.push({
        id: doc.id,
        ...data,
        victim: victimDoc.exists ? victimDoc.data() : null
      });
    }

    return res.json(requests);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch SOS requests' });
  }
};

export const getSOSDetails = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const doc = await adminDb.collection('sosRequests').doc(id).get();
    
    if (!doc.exists) {
      return res.status(404).json({ error: 'SOS request not found' });
    }
    
    const data = doc.data() as any;
    const victimDoc = await adminDb.collection('users').doc(data.victimId).get();
    
    const request = {
      id: doc.id,
      ...data,
      victim: victimDoc.exists ? victimDoc.data() : null
    };

    return res.json(request);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch SOS details' });
  }
};

export const updateSOSStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, volunteerId, responderTeamId } = req.body;

    const docRef = adminDb.collection('sosRequests').doc(id);
    const docSnap = await docRef.get();
    
    if (!docSnap.exists) {
      return res.status(404).json({ error: 'SOS request not found' });
    }

    const updateData: any = { updatedAt: new Date().toISOString() };
    if (status) updateData.status = status;
    if (volunteerId !== undefined) updateData.volunteerId = volunteerId;
    if (responderTeamId !== undefined) updateData.responderTeamId = responderTeamId;

    await docRef.update(updateData);
    
    const updatedSnap = await docRef.get();
    const updatedData = updatedSnap.data() as any;
    const updated = { id: updatedSnap.id, ...updatedData };

    // Notify victim
    await adminDb.collection('notifications').add({
      userId: updatedData.victimId,
      title: 'SOS Status Updated',
      message: `Your SOS status is now: ${status}`,
      type: 'SOS_UPDATE',
      createdAt: new Date().toISOString(),
      isRead: false
    });

    // Real-time broadcasts
    emitToAll('sos:updated', updated);
    emitToUser(updatedData.victimId, 'notification:new', {
      title: 'SOS Status Updated',
      message: `Your SOS status is now: ${status}`,
      sosId: id,
    });
    emitToRoom(id, 'request:updated', updated);

    return res.json(updated);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to update SOS request' });
  }
};

export const deleteSOSRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await adminDb.collection('sosRequests').doc(id).delete();
    emitToAll('sos:updated', { id, status: 'DELETED' });
    return res.json({ success: true, message: 'SOS request cancelled' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to delete SOS request' });
  }
};
