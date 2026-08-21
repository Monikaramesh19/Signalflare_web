import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/db';
import { emitToAll, emitToUser } from '../socket/socketHandler';

export const getRescueTeams = async (req: AuthRequest, res: Response) => {
  try {
    const teams = await prisma.rescueTeam.findMany({
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, phone: true } },
          },
        },
      },
    });
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

    const team = await prisma.rescueTeam.create({
      data: {
        name,
        status,
        vehicleType,
        leaderId,
      },
    });

    if (memberIds && Array.isArray(memberIds)) {
      const memberData = memberIds.map((userId: string) => ({
        teamId: team.id,
        userId,
      }));

      await prisma.rescueTeamMember.createMany({
        data: memberData,
      });
    }

    const finalTeam = await prisma.rescueTeam.findUnique({
      where: { id: team.id },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, phone: true } } },
        },
      },
    });

    return res.status(201).json(finalTeam);
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

    const updatedSOS = await prisma.sOSRequest.update({
      where: { id: sosRequestId },
      data: {
        responderTeamId: teamId,
        status: 'ASSIGNED',
      },
      include: {
        victim: { select: { id: true, name: true, phone: true } },
        responderTeam: true,
      },
    });

    // Notify victim
    await prisma.notification.create({
      data: {
        userId: updatedSOS.victimId,
        title: 'Rescue Team Dispatched',
        message: `Rescue team '${updatedSOS.responderTeam?.name}' has been assigned to your SOS.`,
        type: 'SOS_UPDATE',
      },
    });

    emitToAll('sos:updated', updatedSOS);
    emitToUser(updatedSOS.victimId, 'notification:new', {
      title: 'Rescue Team Dispatched',
      message: `Rescue team '${updatedSOS.responderTeam?.name}' has been assigned to your SOS.`,
    });

    return res.json(updatedSOS);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to assign rescue team' });
  }
};

export const getRescueOperations = async (req: AuthRequest, res: Response) => {
  try {
    const operations = await prisma.sOSRequest.findMany({
      where: {
        status: {
          in: ['ASSIGNED', 'RESPONDER_ON_WAY', 'RESCUE_IN_PROGRESS'],
        },
      },
      include: {
        victim: { select: { name: true, phone: true } },
        responderTeam: {
          include: {
            members: {
              include: { user: { select: { name: true, phone: true } } },
            },
          },
        },
      },
    });

    return res.json(operations);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch active rescue operations' });
  }
};
