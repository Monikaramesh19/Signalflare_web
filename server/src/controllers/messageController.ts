import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/db';
import { emitToUser, emitToRoom } from '../socket/socketHandler';

export const getMessages = async (req: AuthRequest, res: Response) => {
  try {
    const myId = req.user?.id;
    const { contactId } = req.query; // other user

    if (!myId || !contactId) {
      return res.status(400).json({ error: 'Missing parameters' });
    }

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: myId, receiverId: contactId as string },
          { senderId: contactId as string, receiverId: myId },
        ],
      },
      orderBy: { createdAt: 'asc' },
    });

    return res.json(messages);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch messages' });
  }
};

export const sendMessage = async (req: AuthRequest, res: Response) => {
  try {
    const senderId = req.user?.id;
    const { receiverId, content, tempId } = req.body; // tempId is useful for offline tracking

    if (!senderId || !receiverId || !content) {
      return res.status(400).json({ error: 'Missing message body' });
    }

    const msg = await prisma.message.create({
      data: {
        senderId,
        receiverId,
        content,
      },
    });

    // Notify receiver
    emitToUser(receiverId, 'message:received', { ...msg, tempId });
    // Also notify sender (for multiple devices or sockets verification)
    emitToUser(senderId, 'message:received', { ...msg, tempId });

    // Join room chat emission fallback
    emitToRoom(`chat_${senderId}_${receiverId}`, 'message:received', msg);
    emitToRoom(`chat_${receiverId}_${senderId}`, 'message:received', msg);

    return res.status(201).json(msg);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to send message' });
  }
};
