import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { Activity } from 'lucide-react';

export const RescueAnalytics: React.FC = () => {
  const barData = [
    { name: 'Chennai', Evacuations: 45, Deliveries: 80 },
    { name: 'Madurai', Evacuations: 20, Deliveries: 45 },
    { name: 'Coimbatore', Evacuations: 15, Deliveries: 30 },
    { name: 'Kanchipuram', Evacuations: 28, Deliveries: 60 },
    { name: 'Tiruvallur', Evacuations: 35, Deliveries: 70 },
  ];

  const pieData = [
    { name: 'Critical Priority', value: 35, color: '#ef4444' },
    { name: 'High Priority', value: 45, color: '#f97316' },
    { name: 'Medium Priority', value: 20, color: '#eab308' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-white">Rescue Analytics</h1>
        <p className="text-xs text-slate-400">Review logistics performance, average response durations, and resource flows.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar chart */}
        <div className="p-6 rounded-xl glass-panel border border-slate-800 space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            Evacuation & Delivery Vector by District
          </h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} />
                <YAxis stroke="#94a3b8" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} />
                <Legend />
                <Bar dataKey="Evacuations" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Deliveries" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie chart */}
        <div className="p-6 rounded-xl glass-panel border border-slate-800 space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            Distress Case Severity Breakdown
          </h2>
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
