import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { adminDb } from '../config/firebase';
import { emitToAll, emitToUser } from '../socket/socketHandler';

export const getRescueTeams = async (req: AuthRequest, res: Response) => {
  try {
    const snapshot = await adminDb.collection('rescueTeams').get();
    const teams = [];

    for (const doc of snapshot.docs) {
      const teamData = doc.data();
      const membersSnap = await adminDb.collection('rescueTeamMembers').where('teamId', '==', doc.id).get();
      
      const members = [];
      for (const mDoc of membersSnap.docs) {
        const mData = mDoc.data() as any;
        const userDoc = await adminDb.collection('users').doc(mData.userId).get();
        members.push({
          id: mDoc.id,
          ...mData,
          user: userDoc.exists ? userDoc.data() : null
        });
      }

      teams.push({ id: doc.id, ...teamData, members });
    }
    return res.json(teams);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch rescue teams' });
  }
};

export const createRescueTeam = async (req: AuthRequest, res: Response) => {
  try {
    const { name, status, vehicleType, leaderId, memberIds } = req.body;

    if (!name || !status || !vehicleType) {
      return res.status(400).json({ error: 'Missing team fields' });
    }

    const teamData = {
      name,
      status,
      vehicleType,
      leaderId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const teamRef = await adminDb.collection('rescueTeams').add(teamData);

    const members = [];
    if (memberIds && Array.isArray(memberIds)) {
      const batch = adminDb.batch();
      for (const userId of memberIds) {
        const memberRef = adminDb.collection('rescueTeamMembers').doc();
        const mData = { teamId: teamRef.id, userId };
        batch.set(memberRef, mData);
        
        const userDoc = await adminDb.collection('users').doc(userId).get();
        members.push({ id: memberRef.id, ...mData, user: userDoc.exists ? userDoc.data() : null });
      }
      await batch.commit();
    }

    return res.status(201).json({ id: teamRef.id, ...teamData, members });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create rescue team' });
  }
};

export const assignRescueTeam = async (req: AuthRequest, res: Response) => {
  try {
    const { sosRequestId, teamId } = req.body;

    if (!sosRequestId || !teamId) {
      return res.status(400).json({ error: 'Missing parameters' });
    }

    const sosRef = adminDb.collection('sosRequests').doc(sosRequestId);
    await sosRef.update({
      responderTeamId: teamId,
      status: 'ASSIGNED',
      updatedAt: new Date().toISOString()
    });

    const sosSnap = await sosRef.get();
    const updatedSOSData = sosSnap.data() as any;

    const victimDoc = await adminDb.collection('users').doc(updatedSOSData.victimId).get();
    const teamDoc = await adminDb.collection('rescueTeams').doc(teamId).get();

    const updatedSOS = {
      id: sosSnap.id,
      ...updatedSOSData,
      victim: victimDoc.exists ? victimDoc.data() : null,
      responderTeam: teamDoc.exists ? { id: teamDoc.id, ...teamDoc.data() } : null
    };

    // Notify victim
    await adminDb.collection('notifications').add({
      userId: updatedSOSData.victimId,
      title: 'Rescue Team Dispatched',
      message: `Rescue team '${teamDoc.exists ? (teamDoc.data() as any).name : 'Unknown'}' has been assigned to your SOS.`,
      type: 'SOS_UPDATE',
      createdAt: new Date().toISOString(),
      isRead: false
    });

    emitToAll('sos:updated', updatedSOS);
    emitToUser(updatedSOSData.victimId, 'notification:new', {
      title: 'Rescue Team Dispatched',
      message: `Rescue team '${teamDoc.exists ? (teamDoc.data() as any).name : 'Unknown'}' has been assigned to your SOS.`,
    });

    return res.json(updatedSOS);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to assign rescue team' });
  }
};

export const getRescueOperations = async (req: AuthRequest, res: Response) => {
  try {
    const snapshot = await adminDb.collection('sosRequests')
      .where('status', 'in', ['ASSIGNED', 'RESPONDER_ON_WAY', 'RESCUE_IN_PROGRESS'])
      .get();

    const operations = [];

    for (const doc of snapshot.docs) {
      const data = doc.data() as any;
      const victimDoc = await adminDb.collection('users').doc(data.victimId).get();
      
      let teamData = null;
      if (data.responderTeamId) {
        const teamDoc = await adminDb.collection('rescueTeams').doc(data.responderTeamId).get();
        if (teamDoc.exists) {
          const tData = teamDoc.data();
          const membersSnap = await adminDb.collection('rescueTeamMembers').where('teamId', '==', teamDoc.id).get();
          const members = [];
          for (const mDoc of membersSnap.docs) {
            const mData = mDoc.data() as any;
            const uDoc = await adminDb.collection('users').doc(mData.userId).get();
            members.push({ id: mDoc.id, ...mData, user: uDoc.exists ? uDoc.data() : null });
          }
          teamData = { id: teamDoc.id, ...tData, members };
        }
      }

      operations.push({
        id: doc.id,
        ...data,
        victim: victimDoc.exists ? victimDoc.data() : null,
        responderTeam: teamData
      });
    }

    return res.json(operations);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch active rescue operations' });
  }
};
