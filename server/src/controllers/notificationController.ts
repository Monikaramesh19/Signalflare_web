import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { adminDb } from '../config/firebase';

export const getNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const snapshot = await adminDb.collection('notifications')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();
      
    const notifications = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));

    return res.json(notifications);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

export const markNotificationRead = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const notifRef = adminDb.collection('notifications').doc(id);
    await notifRef.update({ isRead: true });
    
    const updatedSnap = await notifRef.get();
    const updated = { id: updatedSnap.id, ...updatedSnap.data() };

    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update notification' });
  }
};
