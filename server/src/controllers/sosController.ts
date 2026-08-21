import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/db';
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
      photo, // Optional base64 photo string
    } = req.body;

    if (!emergencyType || !severity || locationLat === undefined || locationLng === undefined) {
      return res.status(400).json({ error: 'Missing required SOS details' });
    }

    const sos = await prisma.sOSRequest.create({
      data: {
        victimId,
        emergencyType,
        severity, // 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'
        peopleCount: peopleCount ? parseInt(peopleCount) : 1,
        locationLat: parseFloat(locationLat),
        locationLng: parseFloat(locationLng),
        address,
        message,
        contactPhone,
        status: 'CREATED',
      },
      include: {
        victim: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
        photos: true,
      },
    });

    if (photo) {
      await prisma.emergencyPhoto.create({
        data: {
          sosRequestId: sos.id,
          photoUrl: photo,
        },
      });
    }

    // Refresh SOS with photos
    const finalSos = await prisma.sOSRequest.findUnique({
      where: { id: sos.id },
      include: {
        victim: { select: { id: true, name: true, phone: true, email: true } },
        photos: true,
      },
    });

    // Create a system-wide notification
    await prisma.notification.create({
      data: {
        userId: victimId,
        title: 'SOS Broadcast Active',
        message: `Your SOS for ${emergencyType} emergency was successfully broadcasted.`,
        type: 'SOS_UPDATE',
      },
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
    const requests = await prisma.sOSRequest.findMany({
      include: {
        victim: { select: { id: true, name: true, phone: true } },
        photos: true,
        responderTeam: true,
        volunteer: { include: { user: { select: { name: true, phone: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(requests);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch SOS requests' });
  }
};

export const getSOSDetails = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const request = await prisma.sOSRequest.findUnique({
      where: { id },
      include: {
        victim: { select: { id: true, name: true, phone: true, email: true } },
        photos: true,
        responderTeam: true,
        volunteer: { include: { user: { select: { name: true, phone: true } } } },
      },
    });

    if (!request) {
      return res.status(404).json({ error: 'SOS request not found' });
    }

    return res.json(request);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch SOS details' });
  }
};

export const updateSOSStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, volunteerId, responderTeamId } = req.body;

    const currentRequest = await prisma.sOSRequest.findUnique({ where: { id } });
    if (!currentRequest) {
      return res.status(404).json({ error: 'SOS request not found' });
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (volunteerId !== undefined) updateData.volunteerId = volunteerId;
    if (responderTeamId !== undefined) updateData.responderTeamId = responderTeamId;

    const updated = await prisma.sOSRequest.update({
      where: { id },
      data: updateData,
      include: {
        victim: { select: { id: true, name: true, phone: true } },
        photos: true,
        responderTeam: true,
        volunteer: { include: { user: { select: { name: true, phone: true } } } },
      },
    });

    // Notify victim
    await prisma.notification.create({
      data: {
        userId: updated.victimId,
        title: 'SOS Status Updated',
        message: `Your SOS status is now: ${status}`,
        type: 'SOS_UPDATE',
      },
    });

    // Real-time broadcasts
    emitToAll('sos:updated', updated);
    emitToUser(updated.victimId, 'notification:new', {
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
    await prisma.sOSRequest.delete({ where: { id } });
    emitToAll('sos:updated', { id, status: 'DELETED' });
    return res.json({ success: true, message: 'SOS request cancelled' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to delete SOS request' });
  }
};
