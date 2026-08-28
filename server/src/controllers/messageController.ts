import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { adminDb } from '../config/firebase';
import { emitToUser, emitToRoom } from '../socket/socketHandler';

export const getMessages = async (req: AuthRequest, res: Response) => {
  try {
    const myId = req.user?.id;
    const { contactId } = req.query; 

    if (!myId || !contactId) {
      return res.status(400).json({ error: 'Missing parameters' });
    }

    // Firestore doesn't support complex OR queries easily, so we run two queries and merge
    const sentSnapshot = await adminDb.collection('messages')
      .where('senderId', '==', myId)
      .where('receiverId', '==', contactId)
      .get();
      
    const receivedSnapshot = await adminDb.collection('messages')
      .where('senderId', '==', contactId)
      .where('receiverId', '==', myId)
      .get();

    const messages = [
      ...sentSnapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })),
      ...receivedSnapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }))
    ];

    // Sort by createdAt ascending
    messages.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    return res.json(messages);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch messages' });
  }
};

export const sendMessage = async (req: AuthRequest, res: Response) => {
  try {
    const senderId = req.user?.id;
    const { receiverId, content, tempId } = req.body; 

    if (!senderId || !receiverId || !content) {
      return res.status(400).json({ error: 'Missing message body' });
    }

    const msgData = {
      senderId,
      receiverId,
      content,
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    const msgRef = await adminDb.collection('messages').add(msgData);
    const msg = { id: msgRef.id, ...msgData };

    // Notify receiver
    emitToUser(receiverId, 'message:received', { ...msg, tempId });
    // Notify sender 
    emitToUser(senderId, 'message:received', { ...msg, tempId });

    // Join room chat emission fallback
    emitToRoom(`chat_${senderId}_${receiverId}`, 'message:received', msg);
    emitToRoom(`chat_${receiverId}_${senderId}`, 'message:received', msg);

    return res.status(201).json(msg);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to send message' });
  }
};
