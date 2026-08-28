import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Users, User, ShieldAlert } from 'lucide-react';

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadUsers = async () => {
    try {
      const response = await api.get('/admin/users');
      setUsers(response.data);
    } catch (err) {
      console.warn('Directory database query failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-white">System User Directory</h1>
        <p className="text-xs text-slate-400 font-medium">Verify credentials, inspect authentication roles, manage profiles.</p>
      </div>

      <div className="p-6 rounded-xl glass-panel border border-slate-800 space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Users className="w-5 h-5 text-cyan-400" />
          Registered Users Catalog
        </h2>

        {loading ? (
          <p className="text-xs text-slate-500 font-mono">Querying directory database...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse text-slate-300">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] uppercase font-bold text-slate-500 font-mono">
                  <th className="py-2.5">User</th>
                  <th className="py-2.5">Email</th>
                  <th className="py-2.5">Phone</th>
                  <th className="py-2.5">Assigned Role</th>
                  <th className="py-2.5 text-right font-normal">Registration Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {users.map((item) => (
                  <tr key={item.id} className="border-b border-slate-900/60 hover:bg-slate-950/20">
                    <td className="py-3.5 font-bold text-white flex items-center gap-2">
                      <User className="w-4 h-4 text-cyan-400" />
                      {item.name}
                    </td>
                    <td className="py-3.5 text-slate-400 font-mono">{item.email}</td>
                    <td className="py-3.5 text-slate-400 font-mono">{item.phone}</td>
                    <td className="py-3.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                        {item.role}
                      </span>
                    </td>
                    <td className="py-3.5 text-right text-slate-550 font-mono">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
