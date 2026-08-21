import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/db';
import { emitToAll } from '../socket/socketHandler';

export const getResources = async (req: AuthRequest, res: Response) => {
  try {
    const resources = await prisma.resource.findMany({
      include: { shelter: true },
      orderBy: { name: 'asc' },
    });
    return res.json(resources);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch resources' });
  }
};

export const createResource = async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, quantity, unit, locationLat, locationLng, shelterId } = req.body;
    if (!name || quantity === undefined || !unit) {
      return res.status(400).json({ error: 'Missing resource properties' });
    }

    const resource = await prisma.resource.create({
      data: {
        name,
        description,
        quantity: parseInt(quantity),
        unit,
        locationLat: locationLat ? parseFloat(locationLat) : null,
        locationLng: locationLng ? parseFloat(locationLng) : null,
        shelterId: shelterId || null,
      },
      include: { shelter: true },
    });

    emitToAll('resource:updated', resource);
    return res.status(201).json(resource);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to create resource' });
  }
};

export const updateResource = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, quantity, unit, locationLat, locationLng, shelterId } = req.body;

    const data: any = {};
    if (name) data.name = name;
    if (description !== undefined) data.description = description;
    if (quantity !== undefined) data.quantity = parseInt(quantity);
    if (unit) data.unit = unit;
    if (locationLat !== undefined) data.locationLat = parseFloat(locationLat);
    if (locationLng !== undefined) data.locationLng = parseFloat(locationLng);
    if (shelterId !== undefined) data.shelterId = shelterId || null;

    const updated = await prisma.resource.update({
      where: { id },
      data,
      include: { shelter: true },
    });

    emitToAll('resource:updated', updated);
    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update resource' });
  }
};

export const deleteResource = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.resource.delete({ where: { id } });
    emitToAll('resource:updated', { id, deleted: true });
    return res.json({ success: true, message: 'Resource deleted' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete resource' });
  }
};
