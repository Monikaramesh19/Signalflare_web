import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { adminDb } from '../config/firebase';
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

    const requestData = {
      victimId,
      type,
      severity,
      locationLat: parseFloat(locationLat),
      locationLng: parseFloat(locationLng),
      address: address || null,
      description,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const reqRef = await adminDb.collection('emergencyRequests').add(requestData);

    const victimDoc = await adminDb.collection('users').doc(victimId).get();
    
    const request = {
      id: reqRef.id,
      ...requestData,
      victim: victimDoc.exists ? victimDoc.data() : null
    };

    emitToRole('RESCUE', 'request:created', request);
    emitToRole('VOLUNTEER', 'request:created', request);

    return res.status(201).json(request);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to create emergency request' });
  }
};

export const getEmergencyRequests = async (req: AuthRequest, res: Response) => {
  try {
    const snapshot = await adminDb.collection('emergencyRequests').orderBy('createdAt', 'desc').get();
    const requests = [];

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const victimDoc = await adminDb.collection('users').doc(data.victimId).get();
      requests.push({
        id: doc.id,
        ...data,
        victim: victimDoc.exists ? victimDoc.data() : null
      });
    }

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

    const requestData = {
      victimId,
      resourceName,
      quantity: parseInt(quantity),
      locationLat: locationLat ? parseFloat(locationLat) : null,
      locationLng: locationLng ? parseFloat(locationLng) : null,
      address: address || null,
      contactPhone: contactPhone || null,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const reqRef = await adminDb.collection('resourceRequests').add(requestData);

    const victimDoc = await adminDb.collection('users').doc(victimId).get();

    const request = {
      id: reqRef.id,
      ...requestData,
      victim: victimDoc.exists ? victimDoc.data() : null
    };

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
    const snapshot = await adminDb.collection('resourceRequests').orderBy('createdAt', 'desc').get();
    const requests = [];

    for (const doc of snapshot.docs) {
      const data = doc.data() as any;
      const victimDoc = await adminDb.collection('users').doc(data.victimId).get();
      
      let volunteerData = null;
      if (data.volunteerId) {
        const volDoc = await adminDb.collection('volunteers').doc(data.volunteerId).get();
        if (volDoc.exists) {
          const volInfo = volDoc.data() as any;
          const volUserDoc = await adminDb.collection('users').doc(volInfo.userId).get();
          volunteerData = { ...volInfo, user: volUserDoc.exists ? volUserDoc.data() : null };
        }
      }

      requests.push({
        id: doc.id,
        ...data,
        victim: victimDoc.exists ? victimDoc.data() : null,
        volunteer: volunteerData
      });
    }

    return res.json(requests);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch resource requests' });
  }
};

export const getResourceRequestDetails = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const doc = await adminDb.collection('resourceRequests').doc(id).get();
    
    if (!doc.exists) return res.status(404).json({ error: 'Resource request not found' });
    
    const data = doc.data() as any;
    const victimDoc = await adminDb.collection('users').doc(data.victimId).get();
    
    let volunteerData = null;
    if (data.volunteerId) {
      const volDoc = await adminDb.collection('volunteers').doc(data.volunteerId).get();
      if (volDoc.exists) {
        const volInfo = volDoc.data() as any;
        const volUserDoc = await adminDb.collection('users').doc(volInfo.userId).get();
        volunteerData = { ...volInfo, user: volUserDoc.exists ? volUserDoc.data() : null };
      }
    }

    const request = {
      id: doc.id,
      ...data,
      victim: victimDoc.exists ? victimDoc.data() : null,
      volunteer: volunteerData
    };

    return res.json(request);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch resource request details' });
  }
};

export const updateResourceRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, volunteerId } = req.body;

    const reqRef = adminDb.collection('resourceRequests').doc(id);
    const reqSnap = await reqRef.get();
    
    if (!reqSnap.exists) return res.status(404).json({ error: 'Resource request not found' });

    const updateData: any = { updatedAt: new Date().toISOString() };
    if (status) updateData.status = status;
    if (volunteerId !== undefined) updateData.volunteerId = volunteerId;

    await reqRef.update(updateData);
    
    const updatedSnap = await reqRef.get();
    const updatedData = updatedSnap.data() as any;
    
    const victimDoc = await adminDb.collection('users').doc(updatedData.victimId).get();
    
    let volunteerData = null;
    if (updatedData.volunteerId) {
      const volDoc = await adminDb.collection('volunteers').doc(updatedData.volunteerId).get();
      if (volDoc.exists) {
        const volInfo = volDoc.data() as any;
        const volUserDoc = await adminDb.collection('users').doc(volInfo.userId).get();
        volunteerData = { ...volInfo, user: volUserDoc.exists ? volUserDoc.data() : null };
      }
    }

    const updated = {
      id: updatedSnap.id,
      ...updatedData,
      victim: victimDoc.exists ? victimDoc.data() : null,
      volunteer: volunteerData
    };

    // Notify victim
    await adminDb.collection('notifications').add({
      userId: updatedData.victimId,
      title: 'Resource Request Update',
      message: `Your request for ${updatedData.resourceName} is now: ${updatedData.status}`,
      type: 'RESOURCE_DELIVERED',
      createdAt: new Date().toISOString(),
      isRead: false
    });

    emitToAll('request:updated', updated);
    emitToUser(updatedData.victimId, 'notification:new', {
      title: 'Resource Request Update',
      message: `Your request for ${updatedData.resourceName} is now: ${updatedData.status}`,
    });

    return res.json(updated);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update resource request' });
  }
};
