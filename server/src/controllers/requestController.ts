import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/db';
import { emitToRole, emitToUser, emitToAll } from '../socket/socketHandler';

// General Emergency Request
export const createEmergencyRequest = async (req: AuthRequest, res: Response) => {
  try {
    const victimId = req.user?.id;
    if (!victimId) return res.status(401).json({ error: 'Unauthorized' });

    const { type, severity, locationLat, locationLng, address, description } = req.body;

    if (!type || !severity || locationLat === undefined || locationLng === undefined || !description) {
      return res.status(400).json({ error: 'Missing emergency request details' });
    }

    const request = await prisma.emergencyRequest.create({
      data: {
        victimId,
        type,
        severity,
        locationLat: parseFloat(locationLat),
        locationLng: parseFloat(locationLng),
        address,
        description,
        status: 'PENDING',
      },
      include: {
        victim: { select: { id: true, name: true, phone: true } },
      },
    });

    emitToRole('RESCUE', 'request:created', request);
    emitToRole('VOLUNTEER', 'request:created', request);

    return res.status(201).json(request);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to create emergency request' });
  }
};

export const getEmergencyRequests = async (req: AuthRequest, res: Response) => {
  try {
    const requests = await prisma.emergencyRequest.findMany({
      include: { victim: { select: { id: true, name: true, phone: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(requests);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch emergency requests' });
  }
};

// Resource Request
export const createResourceRequest = async (req: AuthRequest, res: Response) => {
  try {
    const victimId = req.user?.id;
    if (!victimId) return res.status(401).json({ error: 'Unauthorized' });

    const { resourceName, quantity, locationLat, locationLng, address, contactPhone } = req.body;

    if (!resourceName || !quantity) {
      return res.status(400).json({ error: 'Missing resource details' });
    }

    const request = await prisma.resourceRequest.create({
      data: {
        victimId,
        resourceName,
        quantity: parseInt(quantity),
        locationLat: locationLat ? parseFloat(locationLat) : null,
        locationLng: locationLng ? parseFloat(locationLng) : null,
        address,
        contactPhone,
        status: 'PENDING',
      },
      include: {
        victim: { select: { id: true, name: true, phone: true } },
      },
    });

    emitToRole('RESCUE', 'request:created', request);
    emitToRole('VOLUNTEER', 'request:created', request);

    return res.status(201).json(request);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to create resource request' });
  }
};

export const getResourceRequests = async (req: AuthRequest, res: Response) => {
  try {
    const requests = await prisma.resourceRequest.findMany({
      include: {
        victim: { select: { id: true, name: true, phone: true } },
        volunteer: { include: { user: { select: { name: true, phone: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(requests);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch resource requests' });
  }
};

export const getResourceRequestDetails = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const request = await prisma.resourceRequest.findUnique({
      where: { id },
      include: {
        victim: { select: { id: true, name: true, phone: true } },
        volunteer: { include: { user: { select: { name: true, phone: true } } } },
      },
    });
    if (!request) return res.status(404).json({ error: 'Resource request not found' });
    return res.json(request);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch resource request details' });
  }
};

export const updateResourceRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, volunteerId } = req.body;

    const request = await prisma.resourceRequest.findUnique({ where: { id } });
    if (!request) return res.status(404).json({ error: 'Resource request not found' });

    const updateData: any = {};
    if (status) updateData.status = status;
    if (volunteerId !== undefined) updateData.volunteerId = volunteerId;

    const updated = await prisma.resourceRequest.update({
      where: { id },
      data: updateData,
      include: {
        victim: { select: { id: true, name: true, phone: true } },
        volunteer: { include: { user: { select: { name: true, phone: true } } } },
      },
    });

    // Notify victim
    await prisma.notification.create({
      data: {
        userId: updated.victimId,
        title: 'Resource Request Update',
        message: `Your request for ${updated.resourceName} is now: ${updated.status}`,
        type: 'RESOURCE_DELIVERED',
      },
    });

    emitToAll('request:updated', updated);
    emitToUser(updated.victimId, 'notification:new', {
      title: 'Resource Request Update',
      message: `Your request for ${updated.resourceName} is now: ${updated.status}`,
    });

    return res.json(updated);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update resource request' });
  }
};
