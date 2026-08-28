import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { useNetwork } from '../../contexts/NetworkContext';
import { addToQueue, getQueue } from '../../offline/db';
import api from '../../services/api';
import { Flame, MessageSquare, Send, Clock, User, Phone, MapPin, CheckCircle, ShieldAlert } from 'lucide-react';

export const RequestDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { socket } = useSocket();
  const { isOnline } = useNetwork();
  const navigate = useNavigate();

  const [request, setRequest] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [responderId, setResponderId] = useState<string | null>(null);
  const [responderName, setResponderName] = useState<string>('Responder');

  const loadDetails = async () => {
    try {
      if (!isOnline) {
        // Fallback: search IndexedDB for offline matches
        const localSOS = await getQueue('sos_queue');
        const match = localSOS.find((x) => x.id === id);
        if (match) {
          setRequest({ ...match, status: 'CREATED (OFFLINE CACHED)' });
          setLoading(false);
          return;
        }
      }

      // Online: Fetch SOS first, then fallback to ResourceRequest
      try {
        const response = await api.get(`/sos/${id}`);
        setRequest(response.data);
        if (response.data.volunteer?.user?.id) {
          setResponderId(response.data.volunteer.user.id);
          setResponderName(response.data.volunteer.user.name);
        } else if (response.data.responderTeam?.id) {
          setResponderId(response.data.responderTeam.id);
          setResponderName(response.data.responderTeam.name);
        }
      } catch (err) {
        const response = await api.get(`/requests/${id}`);
        setRequest(response.data);
        if (response.data.volunteer?.user?.id) {
          setResponderId(response.data.volunteer.user.id);
          setResponderName(response.data.volunteer.user.name);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    if (!responderId || !isOnline) return;
    try {
      const response = await api.get(`/messages?contactId=${responderId}`);
      setMessages(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadDetails();
  }, [id, isOnline]);

  useEffect(() => {
    loadMessages();
  }, [responderId, isOnline]);

  // Socket.io updates configuration
  useEffect(() => {
    if (!socket || !responderId) return;

    // Join room specific to this chat
    socket.emit('join_room', `chat_${user?.id}_${responderId}`);

    const handleNewMessage = (msg: any) => {
      if (
        (msg.senderId === user?.id && msg.receiverId === responderId) ||
        (msg.senderId === responderId && msg.receiverId === user?.id)
      ) {
        setMessages((prev) => {
          // Prevent duplicates
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      }
    };

    const handleRequestUpdate = (updatedReq: any) => {
      if (updatedReq.id === id) {
        setRequest(updatedReq);
      }
    };

    socket.on('message:received', handleNewMessage);
    socket.on('request:updated', handleRequestUpdate);

    return () => {
      socket.emit('leave_room', `chat_${user?.id}_${responderId}`);
      socket.off('message:received', handleNewMessage);
      socket.off('request:updated', handleRequestUpdate);
    };
  }, [socket, responderId, user, id]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !responderId) return;

    const tempMsgId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString();
    const payload = {
      id: tempMsgId,
      receiverId: responderId,
      content: chatInput,
      createdAt: Date.now(),
    };

    if (isOnline) {
      try {
        const response = await api.post('/messages', payload);
        setMessages((prev) => [...prev, response.data]);
        setChatInput('');
      } catch (err) {
        console.error(err);
        saveOfflineMessage(payload);
      }
    } else {
      saveOfflineMessage(payload);
    }
  };

  const saveOfflineMessage = async (payload: any) => {
    try {
      await addToQueue('message_queue', payload);
      setMessages((prev) => [
        ...prev,
        {
          id: payload.id,
          senderId: user?.id,
          receiverId: payload.receiverId,
          content: `${payload.content} (Pending Sync)`,
          createdAt: payload.createdAt,
        },
      ]);
      setChatInput('');
    } catch (err) {
      alert('Failed to cache message locally');
    }
  };

  if (loading) {
    return <div className="py-8 text-center text-xs text-slate-500 font-mono">Loading request details...</div>;
  }

  if (!request) {
    return <div className="py-8 text-center text-xs text-red-500">Request not found.</div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Details Card */}
      <div className="lg:col-span-2 space-y-6">
        <div className="p-6 rounded-xl glass-panel border border-slate-800 space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 uppercase tracking-widest font-mono">
                {request.emergencyType ? 'SOS Beacon' : 'Supply Order'}
              </span>
              <h1 className="text-2xl font-black text-white mt-2">
                {request.emergencyType || request.resourceName}
              </h1>
              <p className="text-[10px] text-slate-500 font-mono mt-1">ID: {request.id}</p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20 uppercase tracking-wider animate-pulse">
              {request.status}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 bg-slate-950/40 rounded-lg border border-slate-900">
              <span className="text-slate-500 block uppercase font-bold text-[9px] tracking-wider mb-1">Coordinates</span>
              <div className="flex items-center gap-1 text-slate-300 font-mono">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                {request.locationLat.toFixed(5)}, {request.locationLng.toFixed(5)}
              </div>
            </div>
            <div className="p-3.5 bg-slate-950/40 rounded-lg border border-slate-900">
              <span className="text-slate-500 block uppercase font-bold text-[9px] tracking-wider mb-1">Severity / Priority</span>
              <span className="text-red-400 font-bold">{request.severity || 'HIGH'}</span>
            </div>
          </div>

          {request.message && (
            <div className="p-4 bg-slate-950/40 rounded-lg border border-slate-900 text-xs">
              <span className="text-slate-500 block uppercase font-bold text-[9px] tracking-wider mb-1.5">Distress Message</span>
              <p className="text-slate-300 leading-relaxed">{request.message}</p>
            </div>
          )}

          {request.photos && request.photos.length > 0 && (
            <div>
              <span className="text-slate-500 block uppercase font-bold text-[9px] tracking-wider mb-2">Photo Evidence</span>
              <div className="w-48 h-32 rounded-lg border border-slate-800 overflow-hidden">
                <img src={request.photos[0].photoUrl} className="w-full h-full object-cover" alt="SOS Evidence" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Responder chat window */}
      <div className="p-6 rounded-xl glass-panel border border-slate-800 flex flex-col justify-between max-h-[500px]">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-900 pb-3">
            <MessageSquare className="w-5 h-5 text-cyan-400" />
            Responder Chat
          </h2>

          {!responderId ? (
            <div className="py-24 text-center text-xs text-slate-600 font-mono">
              Waiting for dispatcher to assign a rescue team or volunteer...
            </div>
          ) : (
            <div className="space-y-4 pt-4 overflow-y-auto max-h-[300px]">
              <div className="p-3 rounded-lg bg-cyan-950/20 border border-cyan-500/20 text-[10px] text-cyan-300 flex items-center gap-2">
                <User className="w-4 h-4 text-cyan-400" />
                <span>Assigned: <strong>{responderName}</strong></span>
              </div>

              <div className="space-y-2">
                {messages.map((msg, idx) => {
                  const isMe = msg.senderId === user?.id;
                  return (
                    <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`p-2.5 rounded-lg text-xs max-w-[80%] ${
                          isMe
                            ? 'bg-cyan-600 text-white rounded-tr-none'
                            : 'bg-slate-900 text-slate-200 rounded-tl-none border border-slate-850'
                        }`}
                      >
                        <p>{msg.content}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Input box */}
        {responderId && (
          <form onSubmit={handleSendMessage} className="mt-4 flex gap-2 border-t border-slate-900 pt-4">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Send message to responder..."
              className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none"
            />
            <button
              type="submit"
              className="p-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
