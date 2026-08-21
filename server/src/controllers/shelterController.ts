import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/db';

export const getShelters = async (req: AuthRequest, res: Response) => {
  try {
    const shelters = await prisma.shelter.findMany({
      include: { resources: true },
      orderBy: { name: 'asc' },
    });
    return res.json(shelters);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch shelters' });
  }
};

export const createShelter = async (req: AuthRequest, res: Response) => {
  try {
    const { name, capacity, occupied, locationLat, locationLng, address, contactPhone } = req.body;

    if (!name || capacity === undefined || locationLat === undefined || locationLng === undefined || !address) {
      return res.status(400).json({ error: 'Missing shelter attributes' });
    }

    const shelter = await prisma.shelter.create({
      data: {
        name,
        capacity: parseInt(capacity),
        occupied: occupied ? parseInt(occupied) : 0,
        locationLat: parseFloat(locationLat),
        locationLng: parseFloat(locationLng),
        address,
        contactPhone,
      },
    });

    return res.status(201).json(shelter);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create shelter' });
  }
};

export const updateShelter = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, capacity, occupied, locationLat, locationLng, address, contactPhone } = req.body;

    const data: any = {};
    if (name) data.name = name;
    if (capacity !== undefined) data.capacity = parseInt(capacity);
    if (occupied !== undefined) data.occupied = parseInt(occupied);
    if (locationLat !== undefined) data.locationLat = parseFloat(locationLat);
    if (locationLng !== undefined) data.locationLng = parseFloat(locationLng);
    if (address) data.address = address;
    if (contactPhone !== undefined) data.contactPhone = contactPhone;

    const updated = await prisma.shelter.update({
      where: { id },
      data,
    });

    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update shelter' });
  }
};
