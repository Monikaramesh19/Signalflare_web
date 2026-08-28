import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { adminDb } from '../config/firebase';
import { emitToAll, emitToUser } from '../socket/socketHandler';

export const getVolunteers = async (req: AuthRequest, res: Response) => {
  try {
    const snapshot = await adminDb.collection('volunteers').get();
    const volunteers = [];

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const userDoc = await adminDb.collection('users').doc(data.userId).get();
      volunteers.push({
        id: doc.id,
        ...data,
        user: userDoc.exists ? userDoc.data() : null
      });
    }

    return res.json(volunteers);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch volunteers' });
  }
};

export const updateVolunteer = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const volunteerRef = adminDb.collection('volunteers').doc(userId);
    const volunteerSnap = await volunteerRef.get();
    
    if (!volunteerSnap.exists) {
      return res.status(404).json({ error: 'Volunteer profile not found' });
    }

    const { status, skills, currentLat, currentLng } = req.body;

    const data: any = { updatedAt: new Date().toISOString() };
    if (status) data.status = status;
    if (skills) data.skills = skills;
    if (currentLat !== undefined) data.currentLat = parseFloat(currentLat);
    if (currentLng !== undefined) data.currentLng = parseFloat(currentLng);

    await volunteerRef.update(data);
    
    const updatedSnap = await volunteerRef.get();
    const updatedData = updatedSnap.data() as any;
    
    const userDoc = await adminDb.collection('users').doc(userId).get();
    
    const updated = {
      id: updatedSnap.id,
      ...updatedData,
      user: userDoc.exists ? userDoc.data() : null
    };

    emitToAll('volunteer:updated', updated);
    return res.json(updated);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update volunteer profile' });
  }
};

export const getVolunteerTasks = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const volunteerSnap = await adminDb.collection('volunteers').doc(userId).get();
    if (!volunteerSnap.exists) return res.status(404).json({ error: 'Volunteer profile not found' });
    const volunteerId = volunteerSnap.id;

    // Fetch SOS Tasks
    const sosTasksSnapshot = await adminDb.collection('sosRequests').where('volunteerId', '==', volunteerId).get();
    const sosTasks = [];
    for (const doc of sosTasksSnapshot.docs) {
      const data = doc.data() as any;
      const victimDoc = await adminDb.collection('users').doc(data.victimId).get();
      sosTasks.push({ id: doc.id, ...data, victim: victimDoc.exists ? victimDoc.data() : null });
    }

    // Fetch Resource Tasks
    const resourceTasksSnapshot = await adminDb.collection('resourceRequests').where('volunteerId', '==', volunteerId).get();
    const resourceTasks = [];
    for (const doc of resourceTasksSnapshot.docs) {
      const data = doc.data() as any;
      const victimDoc = await adminDb.collection('users').doc(data.victimId).get();
      resourceTasks.push({ id: doc.id, ...data, victim: victimDoc.exists ? victimDoc.data() : null });
    }

    return res.json({
      sos: sosTasks,
      resources: resourceTasks,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch volunteer tasks' });
  }
};

export const acceptRescueTask = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const volunteerSnap = await adminDb.collection('volunteers').doc(userId).get();
    if (!volunteerSnap.exists) return res.status(404).json({ error: 'Volunteer profile not found' });
    const volunteerId = volunteerSnap.id;

    const { id } = req.params; // request id (SOS or Resource Request)
    const { type } = req.body; // 'SOS' or 'RESOURCE'

    if (type === 'SOS') {
      const requestRef = adminDb.collection('sosRequests').doc(id);
      await requestRef.update({
        volunteerId,
        status: 'ASSIGNED',
        updatedAt: new Date().toISOString()
      });

      const updatedSnap = await requestRef.get();
      const updatedData = updatedSnap.data() as any;
      const victimDoc = await adminDb.collection('users').doc(updatedData.victimId).get();
      const updated = { id, ...updatedData, victim: victimDoc.exists ? victimDoc.data() : null };

      // Notification
      await adminDb.collection('notifications').add({
        userId: updatedData.victimId,
        title: 'Volunteer Assigned',
        message: `Volunteer ${req.user?.name} has accepted your SOS emergency request.`,
        type: 'SOS_UPDATE',
        createdAt: new Date().toISOString(),
        isRead: false
      });

      emitToAll('sos:updated', updated);
      emitToUser(updatedData.victimId, 'notification:new', {
        title: 'Volunteer Assigned',
        message: `Volunteer ${req.user?.name} has accepted your SOS emergency request.`,
      });

      return res.json(updated);
    } else {
      const requestRef = adminDb.collection('resourceRequests').doc(id);
      await requestRef.update({
        volunteerId,
        status: 'APPROVED',
        updatedAt: new Date().toISOString()
      });

      const updatedSnap = await requestRef.get();
      const updatedData = updatedSnap.data() as any;
      const victimDoc = await adminDb.collection('users').doc(updatedData.victimId).get();
      const updated = { id, ...updatedData, victim: victimDoc.exists ? victimDoc.data() : null };

      // Notification
      await adminDb.collection('notifications').add({
        userId: updatedData.victimId,
        title: 'Delivery Approved',
        message: `Volunteer ${req.user?.name} will deliver your requested supplies.`,
        type: 'RESOURCE_DELIVERED',
        createdAt: new Date().toISOString(),
        isRead: false
      });

      emitToAll('request:updated', updated);
      emitToUser(updatedData.victimId, 'notification:new', {
        title: 'Delivery Approved',
        message: `Volunteer ${req.user?.name} will deliver your requested supplies.`,
      });

      return res.json(updated);
    }
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to accept task' });
  }
};
