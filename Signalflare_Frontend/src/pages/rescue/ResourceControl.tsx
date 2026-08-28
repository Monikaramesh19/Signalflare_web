import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { ClipboardList, Plus, Trash2, Edit } from 'lucide-react';

export const ResourceControl: React.FC = () => {
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState(100);
  const [unit, setUnit] = useState('packets');

  const loadResources = async () => {
    try {
      const response = await api.get('/resources');
      setResources(response.data);
    } catch (err) {
      console.warn('Depot stocks query failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResources();
  }, []);

  const handleAddResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    try {
      await api.post('/resources', { name, quantity, unit });
      setName('');
      loadResources();
    } catch (err) {
      alert('Failed to register resource.');
    }
  };

  const handleDeleteResource = async (id: string) => {
    if (!window.confirm('Delete this resource item from stocks?')) return;
    try {
      await api.delete(`/resources/${id}`);
      loadResources();
    } catch (err) {
      alert('Failed to delete item.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-white">Resources Depot Stock</h1>
        <p className="text-xs text-slate-400">Monitor stock levels, distribute inventory logs across camps.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Register Item */}
        <div className="p-6 rounded-xl glass-panel border border-slate-800 space-y-4 h-fit">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Plus className="w-5 h-5 text-cyan-400" />
            Register Stock Item
          </h2>
          <form onSubmit={handleAddResource} className="space-y-3 text-xs">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase">Resource Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Drinking Water, Non-Perishable Food"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-xs text-slate-100"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase">Quantity</label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-xs text-slate-100"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase">Unit</label>
                <input
                  type="text"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="packets, units, kg"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-xs text-slate-100"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded cursor-pointer"
            >
              REGISTER STOCK
            </button>
          </form>
        </div>

        {/* Stock list */}
        <div className="lg:col-span-2 p-6 rounded-xl glass-panel border border-slate-800 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-cyan-400" />
            Depot Stock Levels
          </h2>

          {loading ? (
            <p className="text-xs text-slate-500 font-mono">Querying stocks...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse text-slate-300">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] uppercase font-bold text-slate-500 font-mono">
                    <th className="py-2.5">Resource</th>
                    <th className="py-2.5">Depot Camp Location</th>
                    <th className="py-2.5">Stock Quantity</th>
                    <th className="py-2.5 text-right">Delete</th>
                  </tr>
                </thead>
                <tbody>
                  {resources.map((item) => (
                    <tr key={item.id} className="border-b border-slate-900/60 hover:bg-slate-950/20">
                      <td className="py-3.5 font-bold text-white">{item.name}</td>
                      <td className="py-3.5 text-slate-400">{item.shelter?.name || 'Central Command Warehouse'}</td>
                      <td className="py-3.5 font-mono text-cyan-400 font-bold">
                        {item.quantity} {item.unit}
                      </td>
                      <td className="py-3.5 text-right">
                        <button
                          onClick={() => handleDeleteResource(item.id)}
                          className="p-1.5 text-slate-500 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
