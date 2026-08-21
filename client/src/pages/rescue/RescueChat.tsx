import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { MessageSquare, Send, Clock } from 'lucide-react';

export const RescueChat: React.FC = () => {
  const [channels, setChannels] = useState<any[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');

  const loadChannels = async () => {
    try {
      const response = await api.get('/sos');
      // Filter those with volunteers or responder team assigned
      const assigned = response.data.filter((r: any) => r.volunteerId || r.responderTeamId);
      setChannels(assigned);
      if (assigned.length > 0) {
        setSelectedChannel(assigned[0]);
      }
    } catch (err) {
      console.warn('Channels load failed');
    }
  };

  const loadMessages = async () => {
    if (!selectedChannel) return;
    try {
      const response = await api.get(`/messages?contactId=${selectedChannel.victimId}`);
      setMessages(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadChannels();
  }, []);

  useEffect(() => {
    loadMessages();
  }, [selectedChannel]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !selectedChannel) return;

    try {
      const response = await api.post('/messages', {
        receiverId: selectedChannel.victimId,
        content: chatInput,
      });
      setMessages((prev) => [...prev, response.data]);
      setChatInput('');
    } catch (err) {
      alert('Failed to transmit message.');
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[500px]">
      {/* List */}
      <div className="p-4 rounded-xl glass-panel border border-slate-800 space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-900 pb-2">
          <MessageSquare className="w-4 h-4 text-cyan-400" />
          Active Rescue Chat Rooms
        </h2>
        {channels.length === 0 ? (
          <p className="text-[10px] text-slate-500 font-mono py-4">No active rescue coordination rooms.</p>
        ) : (
          <div className="space-y-2">
            {channels.map((ch) => (
              <div
                key={ch.id}
                onClick={() => setSelectedChannel(ch)}
                className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                  selectedChannel?.id === ch.id
                    ? 'bg-cyan-950/20 border-cyan-500/30 text-white'
                    : 'bg-slate-950/20 border-slate-900 text-slate-400'
                }`}
              >
                <p className="text-xs font-bold">{ch.victim?.name}</p>
                <p className="text-[9px] text-slate-500 font-mono mt-0.5">Assigned to: {ch.responderTeam?.name || 'Helper'}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Chat Box */}
      <div className="md:col-span-2 p-6 rounded-xl glass-panel border border-slate-800 flex flex-col justify-between h-full">
        {selectedChannel ? (
          <>
            <div className="space-y-4 overflow-y-auto flex-1 pr-1">
              <div className="p-3 bg-cyan-950/20 border border-cyan-500/20 rounded-lg text-xs text-cyan-300">
                Rescue Coordinator Bridge: messaging <strong>{selectedChannel.victim?.name}</strong>.
              </div>

              <div className="space-y-2">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.senderId === selectedChannel.victimId ? 'justify-start' : 'justify-end'}`}>
                    <div
                      className={`p-2.5 rounded-lg text-xs max-w-[80%] ${
                        msg.senderId !== selectedChannel.victimId
                          ? 'bg-cyan-600 text-white rounded-tr-none'
                          : 'bg-slate-900 text-slate-200 rounded-tl-none border border-slate-850'
                      }`}
                    >
                      <p>{msg.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <form onSubmit={handleSendMessage} className="mt-4 flex gap-2 border-t border-slate-900 pt-4">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Send instructions/updates..."
                className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none"
              />
              <button type="submit" className="p-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg cursor-pointer">
                <Send className="w-4 h-4" />
              </button>
            </form>
          </>
        ) : (
          <div className="py-36 text-center text-xs text-slate-600 font-mono">
            Select a live rescue room to open chat link.
          </div>
        )}
      </div>
    </div>
  );
};
