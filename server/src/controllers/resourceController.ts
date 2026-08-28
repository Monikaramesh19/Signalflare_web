import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { adminDb } from '../config/firebase';
import { emitToAll } from '../socket/socketHandler';

export const getResources = async (req: AuthRequest, res: Response) => {
  try {
    const snapshot = await adminDb.collection('resources').orderBy('name', 'asc').get();
    const resources = [];

    for (const doc of snapshot.docs) {
      const data = doc.data();
      let shelterData = null;
      if (data.shelterId) {
        const shelterDoc = await adminDb.collection('shelters').doc(data.shelterId).get();
        if (shelterDoc.exists) shelterData = { id: shelterDoc.id, ...shelterDoc.data() };
      }
      resources.push({
        id: doc.id,
        ...data,
        shelter: shelterData
      });
    }
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

    const resourceData = {
      name,
      description,
      quantity: parseInt(quantity),
      unit,
      locationLat: locationLat ? parseFloat(locationLat) : null,
      locationLng: locationLng ? parseFloat(locationLng) : null,
      shelterId: shelterId || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const docRef = await adminDb.collection('resources').add(resourceData);
    
    let shelterData = null;
    if (shelterId) {
      const shelterDoc = await adminDb.collection('shelters').doc(shelterId).get();
      if (shelterDoc.exists) shelterData = { id: shelterDoc.id, ...shelterDoc.data() };
    }

    const resource = {
      id: docRef.id,
      ...resourceData,
      shelter: shelterData
    };

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

    const data: any = { updatedAt: new Date().toISOString() };
    if (name) data.name = name;
    if (description !== undefined) data.description = description;
    if (quantity !== undefined) data.quantity = parseInt(quantity);
    if (unit) data.unit = unit;
    if (locationLat !== undefined) data.locationLat = parseFloat(locationLat);
    if (locationLng !== undefined) data.locationLng = parseFloat(locationLng);
    if (shelterId !== undefined) data.shelterId = shelterId || null;

    const docRef = adminDb.collection('resources').doc(id);
    await docRef.update(data);
    
    const updatedSnap = await docRef.get();
    const updatedData = updatedSnap.data() as any;

    let shelterData = null;
    if (updatedData.shelterId) {
      const shelterDoc = await adminDb.collection('shelters').doc(updatedData.shelterId).get();
      if (shelterDoc.exists) shelterData = { id: shelterDoc.id, ...shelterDoc.data() };
    }
    
    const updated = {
      id: updatedSnap.id,
      ...updatedData,
      shelter: shelterData
    };

    emitToAll('resource:updated', updated);
    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update resource' });
  }
};

export const deleteResource = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await adminDb.collection('resources').doc(id).delete();
    emitToAll('resource:updated', { id, deleted: true });
    return res.json({ success: true, message: 'Resource deleted' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete resource' });
  }
};
