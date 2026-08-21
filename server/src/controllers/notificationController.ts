import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/db';

export const getNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return res.json(notifications);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

export const markNotificationRead = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update notification' });
  }
};
