import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { adminDb } from '../config/firebase';

export const getShelters = async (req: AuthRequest, res: Response) => {
  try {
    const snapshot = await adminDb.collection('shelters').orderBy('name', 'asc').get();
    const shelters = [];

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const resourcesSnapshot = await adminDb.collection('resources').where('shelterId', '==', doc.id).get();
      const resources = resourcesSnapshot.docs.map((r: any) => ({ id: r.id, ...r.data() }));
      
      shelters.push({
        id: doc.id,
        ...data,
        resources
      });
    }

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

    const shelterData = {
      name,
      capacity: parseInt(capacity),
      occupied: occupied ? parseInt(occupied) : 0,
      locationLat: parseFloat(locationLat),
      locationLng: parseFloat(locationLng),
      address,
      contactPhone,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const docRef = await adminDb.collection('shelters').add(shelterData);
    
    return res.status(201).json({ id: docRef.id, ...shelterData, resources: [] });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create shelter' });
  }
};

export const updateShelter = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, capacity, occupied, locationLat, locationLng, address, contactPhone } = req.body;

    const data: any = { updatedAt: new Date().toISOString() };
    if (name) data.name = name;
    if (capacity !== undefined) data.capacity = parseInt(capacity);
    if (occupied !== undefined) data.occupied = parseInt(occupied);
    if (locationLat !== undefined) data.locationLat = parseFloat(locationLat);
    if (locationLng !== undefined) data.locationLng = parseFloat(locationLng);
    if (address) data.address = address;
    if (contactPhone !== undefined) data.contactPhone = contactPhone;

    const docRef = adminDb.collection('shelters').doc(id);
    await docRef.update(data);
    
    const updatedSnap = await docRef.get();
    const updatedData = updatedSnap.data() as any;
    
    const resourcesSnapshot = await adminDb.collection('resources').where('shelterId', '==', id).get();
    const resources = resourcesSnapshot.docs.map((r: any) => ({ id: r.id, ...r.data() }));

    return res.json({ id: updatedSnap.id, ...updatedData, resources });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update shelter' });
  }
};
