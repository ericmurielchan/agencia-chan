import React, { useState } from 'react';
import { AgencyService } from '../types';
import { Plus, Edit2, Trash2, ShoppingBag, CheckCircle, XCircle } from 'lucide-react';

interface ServiceCatalogProps {
  services: AgencyService[];
  setServices: React.Dispatch<React.SetStateAction<AgencyService[]>>;
}

export const ServiceCatalog: React.FC<ServiceCatalogProps> = ({ services, setServices }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Partial<AgencyService>>({ active: true });

  const handleSave = () => {
    if (!editingService.name) return;
    
    if (editingService.id) {
        setServices(prev => prev.map(s => s.id === editingService.id ? { ...s, ...editingService } as AgencyService : s));
    } else {
        setServices(prev => [...prev, { ...editingService, id: Date.now().toString() } as AgencyService]);
    }
    setIsModalOpen(false);
    setEditingService({ active: true });
  };

  const handleDelete = (id: string) => {
      if(confirm('Tem certeza?')) {
          setServices(prev => prev.filter(s => s.id !== id));
      }
  };

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Catálogo de Serviços</h2>
          <p className="text-slate-500">Gerencie os produtos e serviços oferecidos pela agência</p>
        </div>
        <button onClick={() => { setEditingService({ active: true }); setIsModalOpen(true)}} className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors shadow-lg shadow-pink-500/20">
          <Plus size={18} /> Novo Serviço
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map(service => (
              <div key={service.id} className={`bg-white rounded-xl border shadow-sm p-6 relative group transition-all hover:shadow-md ${!service.active ? 'opacity-70 border-slate-100' : 'border-slate-200'}`}>
                  <div className="flex justify-between items-start mb-4">
                      <div className={`p-3 rounded-lg ${service.active ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                          <ShoppingBag size={24} />
                      </div>
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${service.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
                          {service.active ? 'Ativo' : 'Inativo'}
                      </span>
                  </div>
                  
                  <h3 className="text-lg font-bold text-slate-800 mb-2">{service.name}</h3>
                  <p className="text-sm text-slate-500 mb-4 h-10 line-clamp-2">{service.description}</p>
                  
                  <div className="flex justify-between items-end border-t border-slate-100 pt-4">
                      <div>
                          <p className="text-xs text-slate-400 font-bold uppercase">Preço Base</p>
                          <p className="text-xl font-bold text-slate-800">R$ {service.basePrice.toLocaleString()}</p>
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => { setEditingService(service); setIsModalOpen(true); }} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"><Edit2 size={16}/></button>
                          <button onClick={() => handleDelete(service.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 size={16}/></button>
                      </div>
                  </div>
              </div>
          ))}
      </div>

      {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] backdrop-blur-sm" onClick={() => setIsModalOpen(false)}>
              <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-2xl animate-pop" onClick={e => e.stopPropagation()}>
                  <h3 className="text-xl font-bold text-slate-800 mb-4">{editingService.id ? 'Editar Serviço' : 'Novo Serviço'}</h3>
                  
                  <div className="space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Serviço/Produto</label>
                          <input 
                            className="w-full border border-slate-200 rounded-lg p-2 text-sm"
                            placeholder="Ex: Gestão de Mídia Social"
                            value={editingService.name || ''}
                            onChange={e => setEditingService({...editingService, name: e.target.value})}
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Preço Base (R$)</label>
                          <input 
                            type="number"
                            className="w-full border border-slate-200 rounded-lg p-2 text-sm"
                            placeholder="0.00"
                            value={editingService.basePrice || ''}
                            onChange={e => setEditingService({...editingService, basePrice: parseFloat(e.target.value)})}
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
                          <textarea 
                            className="w-full border border-slate-200 rounded-lg p-2 text-sm resize-none"
                            placeholder="Detalhes do que está incluso..."
                            rows={3}
                            value={editingService.description || ''}
                            onChange={e => setEditingService({...editingService, description: e.target.value})}
                          />
                      </div>
                      <div className="flex items-center gap-2 pt-2">
                          <input 
                            type="checkbox" 
                            id="serviceActive"
                            checked={editingService.active}
                            onChange={e => setEditingService({...editingService, active: e.target.checked})}
                            className="w-4 h-4 text-pink-600 rounded border-gray-300 focus:ring-pink-500"
                          />
                          <label htmlFor="serviceActive" className="text-sm text-slate-700 font-medium">Serviço Ativo no Catálogo</label>
                      </div>
                  </div>

                  <div className="flex justify-end gap-2 mt-6">
                      <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg text-sm font-medium">Cancelar</button>
                      <button onClick={handleSave} className="px-6 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg text-sm font-bold shadow-md shadow-pink-500/20">Salvar</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};