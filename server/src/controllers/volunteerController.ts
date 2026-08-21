import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/db';
import { emitToAll, emitToUser } from '../socket/socketHandler';

export const getVolunteers = async (req: AuthRequest, res: Response) => {
  try {
    const volunteers = await prisma.volunteer.findMany({
      include: {
        user: {
          select: { id: true, name: true, phone: true, email: true },
        },
      },
    });
    return res.json(volunteers);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch volunteers' });
  }
};

export const updateVolunteer = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const volunteer = await prisma.volunteer.findUnique({ where: { userId } });
    if (!volunteer) return res.status(404).json({ error: 'Volunteer profile not found' });

    const { status, skills, currentLat, currentLng } = req.body;

    const data: any = {};
    if (status) data.status = status;
    if (skills) data.skills = skills;
    if (currentLat !== undefined) data.currentLat = parseFloat(currentLat);
    if (currentLng !== undefined) data.currentLng = parseFloat(currentLng);

    const updated = await prisma.volunteer.update({
      where: { id: volunteer.id },
      data,
      include: {
        user: { select: { id: true, name: true, phone: true } },
      },
    });

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

    const volunteer = await prisma.volunteer.findUnique({ where: { userId } });
    if (!volunteer) return res.status(404).json({ error: 'Volunteer profile not found' });

    // Tasks are SOSRequests assigned to this volunteer or ResourceRequests assigned to this volunteer
    const sosTasks = await prisma.sOSRequest.findMany({
      where: { volunteerId: volunteer.id },
      include: { victim: { select: { name: true, phone: true } } },
    });

    const resourceTasks = await prisma.resourceRequest.findMany({
      where: { volunteerId: volunteer.id },
      include: { victim: { select: { name: true, phone: true } } },
    });

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

    const volunteer = await prisma.volunteer.findUnique({ where: { userId } });
    if (!volunteer) return res.status(404).json({ error: 'Volunteer profile not found' });

    const { id } = req.params; // request id (SOS or Resource Request)
    const { type } = req.body; // 'SOS' or 'RESOURCE'

    if (type === 'SOS') {
      const updated = await prisma.sOSRequest.update({
        where: { id },
        data: {
          volunteerId: volunteer.id,
          status: 'ASSIGNED',
        },
        include: { victim: { select: { id: true, name: true, phone: true } } },
      });

      // Notification
      await prisma.notification.create({
        data: {
          userId: updated.victimId,
          title: 'Volunteer Assigned',
          message: `Volunteer ${req.user?.name} has accepted your SOS emergency request.`,
          type: 'SOS_UPDATE',
        },
      });

      emitToAll('sos:updated', updated);
      emitToUser(updated.victimId, 'notification:new', {
        title: 'Volunteer Assigned',
        message: `Volunteer ${req.user?.name} has accepted your SOS emergency request.`,
      });

      return res.json(updated);
    } else {
      const updated = await prisma.resourceRequest.update({
        where: { id },
        data: {
          volunteerId: volunteer.id,
          status: 'APPROVED',
        },
        include: { victim: { select: { id: true, name: true, phone: true } } },
      });

      // Notification
      await prisma.notification.create({
        data: {
          userId: updated.victimId,
          title: 'Delivery Approved',
          message: `Volunteer ${req.user?.name} will deliver your requested supplies.`,
          type: 'RESOURCE_DELIVERED',
        },
      });

      emitToAll('request:updated', updated);
      emitToUser(updated.victimId, 'notification:new', {
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
