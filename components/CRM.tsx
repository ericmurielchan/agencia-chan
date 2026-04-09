
import React, { useState, useMemo, useEffect } from 'react';
import { Modal } from './Modal';
import { Lead, ColumnConfig, LeadTask, ConfirmOptions, User } from '../types';
import { 
    DollarSign, Plus, Star, CheckSquare, Calendar, Phone, Mail, MessageSquare, 
    Trash2, Clock, User as UserIcon, Briefcase, AlertCircle, Save, X, Settings,
    GripHorizontal, Edit2, ArchiveRestore, Info, Tag, Search, Filter, Rocket
} from 'lucide-react';

interface CRMProps {
  leads: Lead[];
  setLeads: React.Dispatch<React.SetStateAction<Lead[]>>;
  columns: ColumnConfig[];
  setColumns: React.Dispatch<React.SetStateAction<ColumnConfig[]>>;
  openConfirm: (options: ConfirmOptions) => Promise<boolean>;
  leadSources: string[];
  setLeadSources: React.Dispatch<React.SetStateAction<string[]>>;
  currentUser: User;
}

export const CRM: React.FC<CRMProps> = ({ leads, setLeads, columns, setColumns, openConfirm, leadSources, setLeadSources, currentUser }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Partial<Lead>>({ stage: columns[0]?.id || 'NEW', rating: 0, tasks: [] });
  const [activeTab, setActiveTab] = useState<'DETAILS' | 'ACTIVITIES'>('DETAILS');
  const [showValidation, setShowValidation] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const [editingColumn, setEditingColumn] = useState<Partial<ColumnConfig> | null>(null);
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);

  const isAdmin = currentUser.role === 'ADMIN';
  const activeColumns = useMemo(() => columns.filter(c => !c.isArchived).sort((a,b) => a.order - b.order), [columns]);

  const totalValue = leads.reduce((acc, lead) => acc + (lead.value || 0), 0);

  const resetForm = () => {
    setEditingLead({ stage: activeColumns[0]?.id || 'NEW', rating: 0, tasks: [] });
    setActiveTab('DETAILS');
    setShowValidation(false);
  };

  const handleSave = () => {
      if (!editingLead.company || !editingLead.name || (!editingLead.value && editingLead.value !== 0)) {
          setShowValidation(true);
          return;
      }
      if(editingLead.id) setLeads(prev => prev.map(l => l.id === editingLead.id ? { ...l, ...editingLead } as Lead : l));
      else setLeads(prev => [...prev, { ...editingLead, id: Date.now().toString(), lastContact: new Date().toISOString() } as Lead]);
      setIsModalOpen(false);
      resetForm();
  };

  return (
    <div className="h-full flex flex-col overflow-hidden relative">
      {/* FLOATING ACTION BAR CRM */}
      <div className="sticky top-2 z-30 mb-6 mx-2">
        <div className="bg-white border border-slate-200 shadow-2xl shadow-slate-200/50 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4 pl-2">
            <div className="bg-indigo-600 p-2.5 rounded-xl text-white shadow-lg shadow-indigo-200">
              <Rocket size={20} />
            </div>
            <div className="hidden sm:block">
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-tighter leading-none">Pipeline</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">R$ {totalValue.toLocaleString()} total</p>
            </div>
            
            <div className="h-8 w-px bg-slate-200 mx-2 hidden md:block"></div>
            
            <div className="relative group">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <input 
                type="text" 
                placeholder="Buscar prospect..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 bg-slate-100/50 border border-transparent focus:bg-white focus:border-indigo-200 rounded-xl text-xs font-bold outline-none w-32 md:w-64 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && (
              <button 
                onClick={() => setIsSettingsOpen(true)} 
                className="p-2.5 bg-white text-slate-500 border border-slate-200 hover:bg-slate-50 rounded-xl transition-all shadow-sm"
                title="Configurações do CRM"
              >
                <Settings size={18}/>
              </button>
            )}

            <div className="w-px h-8 bg-slate-200 mx-1"></div>

            <button 
              onClick={() => { resetForm(); setIsModalOpen(true)}} 
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-200 transition-all transform hover:scale-[1.02] active:scale-95"
            >
              <Plus size={18} strokeWidth={3} />
              <span className="hidden md:inline">Novo Lead</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex gap-5 overflow-x-auto pb-6 px-2 hide-scrollbar items-start">
          {activeColumns.map(col => (
              <div key={col.id} className={`flex-shrink-0 w-84 flex flex-col rounded-[32px] border transition-all ${col.color} bg-opacity-30 shadow-premium`}>
                  <div className="p-6 flex items-center justify-between border-b border-black/5">
                      <div className="flex items-center gap-3">
                         <div className="w-2 h-2 rounded-full bg-slate-400 animate-pulse" />
                         <h3 className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-600">{col.label}</h3>
                      </div>
                      <span className="text-[10px] bg-white/90 px-2.5 py-1 rounded-full font-black text-slate-500 shadow-sm border border-white">
                          {leads.filter(l => l.stage === col.id && l.company.toLowerCase().includes(searchTerm.toLowerCase())).length}
                      </span>
                  </div>
                  <div className="p-4 flex-1 overflow-y-auto space-y-4 custom-scrollbar min-h-[200px]">
                      {leads.filter(l => l.stage === col.id && l.company.toLowerCase().includes(searchTerm.toLowerCase())).map(lead => (
                          <div 
                            key={lead.id} 
                            draggable
                            onClick={() => { setEditingLead(lead); setIsModalOpen(true) }} 
                            className="bg-white p-6 rounded-[28px] shadow-sm border-2 border-white hover:border-indigo-200 transition-all cursor-grab active:cursor-grabbing group hover:shadow-premium-hover"
                          >
                                <div className="flex justify-between items-start mb-3">
                                    <h4 className="font-bold text-[13px] text-slate-800 group-hover:text-indigo-600 transition-colors leading-tight flex-1 tracking-tight">{lead.company}</h4>
                                    <div className="flex gap-0.5 text-amber-400 transition-transform group-hover:scale-110">
                                        {[1,2,3].map(s => <Star key={s} size={10} fill={s <= (lead.rating || 0) ? "currentColor" : "none"} />)}
                                    </div>
                                </div>
                                <p className="text-[11px] text-slate-400 font-medium mb-4">{lead.name}</p>
                                <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                                    <div className="flex items-center gap-1 text-slate-800 font-black text-sm">
                                        <span className="text-[10px] text-slate-400 font-bold">R$</span>
                                        {lead.value.toLocaleString()}
                                    </div>
                                    {lead.source && (
                                        <span className="text-[8px] font-black uppercase text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-full tracking-widest">
                                            {lead.source}
                                        </span>
                                    )}
                                </div>
                          </div>
                      ))}
                  </div>
              </div>
          ))}

          {isAdmin && (
               <button 
                onClick={() => { setEditingColumn({ label: '', color: 'bg-slate-50 border-slate-200' }); setIsColumnModalOpen(true); }}
                className="flex-shrink-0 w-80 h-16 bg-white/50 border-2 border-dashed border-slate-300 rounded-2xl flex items-center justify-center gap-3 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:bg-white hover:text-slate-600 transition-all"
               >
                   <Plus size={18}/> Nova Etapa
               </button>
          )}
      </div>      {/* LEAD MODAL */}
      {isModalOpen && (
          <Modal 
              isOpen={isModalOpen} 
              onClose={() => setIsModalOpen(false)}
              maxWidth="576px"
              hideHeader={true}
              noPadding={true}
              scrollable={false}
          >
              <div className="flex flex-col flex-1 min-h-0">
                  <div className="p-6 border-b border-slate-50 flex justify-between items-start bg-slate-50 shrink-0">
                      <div className="flex-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block ml-1">Empresa Prospectada</label>
                          <input 
                            className="font-bold text-xl bg-transparent outline-none w-full text-slate-800 placeholder:text-slate-200"
                            placeholder="Nome da Empresa *"
                            value={editingLead.company || ''}
                            onChange={e => setEditingLead({...editingLead, company: e.target.value})}
                            autoFocus
                          />
                      </div>
                      <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-300 hover:bg-slate-100 rounded-full transition-colors"><X size={20}/></button>
                  </div>
                  <div className="flex flex-1 overflow-hidden">
                      <div className="w-40 bg-slate-50 border-r border-slate-100 p-4 space-y-2 shrink-0">
                          <button onClick={() => setActiveTab('DETAILS')} className={`w-full text-left px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'DETAILS' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:bg-white/50'}`}>Info</button>
                          <button onClick={() => setActiveTab('ACTIVITIES')} className={`w-full text-left px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'ACTIVITIES' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:bg-white/50'}`}>Notas</button>
                      </div>
                      <div className="flex-1 p-6 space-y-4 overflow-y-auto custom-scrollbar min-h-0">
                          {activeTab === 'DETAILS' && (
                              <div className="space-y-4">
                                  <div>
                                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Contato Principal</label>
                                      <input className="w-full bg-slate-50 border border-transparent focus:bg-white focus:border-indigo-500 rounded-xl p-3 text-sm font-bold outline-none" placeholder="Nome do Responsável *" value={editingLead.name || ''} onChange={e => setEditingLead({...editingLead, name: e.target.value})} />
                                  </div>
                                  <div>
                                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Valor Negócio (R$)</label>
                                      <input className="w-full bg-slate-50 border border-transparent focus:bg-white focus:border-indigo-500 rounded-xl p-3 text-lg font-black outline-none" type="number" placeholder="0.00 *" value={editingLead.value || ''} onChange={e => setEditingLead({...editingLead, value: parseFloat(e.target.value)})} />
                                  </div>
                              </div>
                          )}
                      </div>
                  </div>
                  <div className="p-6 border-t border-slate-50 flex justify-end gap-3 bg-slate-50 shrink-0">
                      <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:text-slate-600">Sair</button>
                      <button onClick={handleSave} className="h-10 px-6 rounded-xl bg-indigo-600 text-white font-bold text-xs uppercase tracking-widest shadow-lg shadow-indigo-600/10 hover:bg-indigo-700 transition-all flex items-center gap-2"><Save size={16}/> Salvar</button>
                  </div>
              </div>
          </Modal>
      )}

      {/* CRM SETTINGS MODAL */}
      {isSettingsOpen && (
          <Modal 
              isOpen={isSettingsOpen} 
              onClose={() => setIsSettingsOpen(false)}
              maxWidth="448px"
              hideHeader={true}
              noPadding={true}
              scrollable={false}
          >
              <div className="flex flex-col flex-1 min-h-0">
                  <div className="p-6 border-b border-slate-50 bg-slate-50 flex justify-between items-center shrink-0">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl"><Settings size={18}/></div>
                        <h3 className="font-bold text-slate-800 uppercase tracking-tight text-sm">Ajustes Pipeline</h3>
                      </div>
                      <button onClick={() => setIsSettingsOpen(false)} className="p-1.5 text-slate-300 hover:bg-slate-100 rounded-full transition-colors"><X size={18}/></button>
                  </div>
                  <div className="p-10 text-center space-y-4 overflow-y-auto custom-scrollbar flex-1 min-h-0">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Módulo de Configuração</p>
                    <p className="text-slate-500 text-sm">Personalize as etapas e origens dos seus negócios.</p>
                  </div>
                  <div className="p-6 bg-slate-50 border-t border-slate-100 shrink-0">
                    <button onClick={() => setIsSettingsOpen(false)} className="w-full h-11 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-widest">Fechar</button>
                  </div>
              </div>
          </Modal>
      )}
    </div>
  );
};
