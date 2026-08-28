import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { MessageSquare, Send, Clock, User } from 'lucide-react';

export const ChatWindow: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');

  const loadActiveTasks = async () => {
    try {
      const response = await api.get('/volunteers/tasks');
      const sos = response.data.sos || [];
      setTasks(sos);
      if (sos.length > 0) {
        setSelectedTask(sos[0]);
      }
    } catch (err) {
      console.warn('Chat tasks fetch failed');
    }
  };

  const loadMessages = async () => {
    if (!selectedTask) return;
    try {
      const response = await api.get(`/messages?contactId=${selectedTask.victimId}`);
      setMessages(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadActiveTasks();
  }, []);

  useEffect(() => {
    loadMessages();
  }, [selectedTask]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !selectedTask) return;

    try {
      const response = await api.post('/messages', {
        receiverId: selectedTask.victimId,
        content: chatInput,
      });
      setMessages((prev) => [...prev, response.data]);
      setChatInput('');
    } catch (err) {
      alert('Failed to send chat message.');
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[500px]">
      {/* Sidebar List */}
      <div className="p-4 rounded-xl glass-panel border border-slate-800 space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-900 pb-2">
          <MessageSquare className="w-4 h-4 text-cyan-400" />
          Evacuation Chats
        </h2>
        {tasks.length === 0 ? (
          <p className="text-[10px] text-slate-500 font-mono py-4">No active rescue channels open.</p>
        ) : (
          <div className="space-y-2">
            {tasks.map((t) => (
              <div
                key={t.id}
                onClick={() => setSelectedTask(t)}
                className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                  selectedTask?.id === t.id
                    ? 'bg-cyan-950/20 border-cyan-500/30 text-white'
                    : 'bg-slate-950/20 border-slate-900 text-slate-400'
                }`}
              >
                <p className="text-xs font-bold">{t.victim?.name}</p>
                <p className="text-[9px] text-slate-500 font-mono mt-0.5">{t.emergencyType} rescue</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main chat window */}
      <div className="md:col-span-2 p-6 rounded-xl glass-panel border border-slate-800 flex flex-col justify-between h-full">
        {selectedTask ? (
          <>
            <div className="space-y-4 overflow-y-auto flex-1 pr-1">
              <div className="p-3 bg-cyan-950/20 border border-cyan-500/20 rounded-lg text-xs text-cyan-300">
                Channel open with <strong>{selectedTask.victim?.name}</strong>. Provide instructions on safety procedures.
              </div>

              <div className="space-y-2.5">
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

            <form onSubmit={handleSendMessage} className="mt-4 flex gap-2 border-t border-slate-900 pt-4">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type response details..."
                className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none"
              />
              <button type="submit" className="p-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg cursor-pointer">
                <Send className="w-4 h-4" />
              </button>
            </form>
          </>
        ) : (
          <div className="py-36 text-center text-xs text-slate-600 font-mono">
            No active chat channels. Select an assigned SOS rescue task.
          </div>
        )}
      </div>
    </div>
  );
};
