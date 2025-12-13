
import React, { useState } from 'react';
import { Lead, ColumnConfig, LeadTask } from '../types';
import { DollarSign, Plus, Star, CheckSquare, Calendar, Phone, Mail, MessageSquare, Trash2, Clock, User, Briefcase } from 'lucide-react';

interface CRMProps {
  leads: Lead[];
  setLeads: React.Dispatch<React.SetStateAction<Lead[]>>;
  columns: ColumnConfig[];
  setColumns: React.Dispatch<React.SetStateAction<ColumnConfig[]>>;
}

export const CRM: React.FC<CRMProps> = ({ leads, setLeads, columns }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Partial<Lead>>({ stage: 'NEW', rating: 0, tasks: [] });
  const [activeTab, setActiveTab] = useState<'DETAILS' | 'ACTIVITIES'>('DETAILS');

  // Drag and Drop State
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);

  // Task Form State
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskDate, setNewTaskDate] = useState('');
  const [newTaskType, setNewTaskType] = useState<'CALL' | 'EMAIL' | 'MEETING' | 'TASK'>('TASK');

  const handleSave = () => {
      if(!editingLead.company) return;
      if(editingLead.id) {
          setLeads(prev => prev.map(l => l.id === editingLead.id ? { ...l, ...editingLead } as Lead : l));
      } else {
          setLeads(prev => [...prev, { ...editingLead, id: Date.now().toString() } as Lead]);
      }
      setIsModalOpen(false);
      resetForm();
  };

  const resetForm = () => {
    setEditingLead({ stage: 'NEW', rating: 0, tasks: [] });
    setActiveTab('DETAILS');
  };

  const addTaskToLead = () => {
      if(!newTaskText) return;
      const newTask: LeadTask = { 
          id: Date.now().toString(), 
          text: newTaskText, 
          completed: false,
          dueDate: newTaskDate || new Date().toISOString().split('T')[0],
          type: newTaskType
      };
      setEditingLead({ ...editingLead, tasks: [newTask, ...(editingLead.tasks || [])] });
      setNewTaskText('');
      setNewTaskDate('');
  };

  const toggleTask = (taskId: string) => {
      const updatedTasks = editingLead.tasks?.map(t => t.id === taskId ? {...t, completed: !t.completed} : t);
      setEditingLead({...editingLead, tasks: updatedTasks});
  };

  const deleteTask = (taskId: string) => {
      const updatedTasks = editingLead.tasks?.filter(t => t.id !== taskId);
      setEditingLead({...editingLead, tasks: updatedTasks});
  };

  const getTaskIcon = (type: string) => {
      switch(type) {
          case 'CALL': return <Phone size={14} className="text-blue-500"/>;
          case 'EMAIL': return <Mail size={14} className="text-yellow-500"/>;
          case 'MEETING': return <User size={14} className="text-purple-500"/>;
          default: return <CheckSquare size={14} className="text-emerald-500"/>;
      }
  };

  // --- Drag and Drop Logic ---
  const handleDragStart = (e: React.DragEvent, leadId: string) => {
      setDraggedLeadId(leadId);
      e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetStage: string) => {
      e.preventDefault();
      if (!draggedLeadId) return;

      const lead = leads.find(l => l.id === draggedLeadId);
      if (lead && lead.stage !== targetStage) {
          setLeads(prev => prev.map(l => l.id === draggedLeadId ? { ...l, stage: targetStage } : l));
      }
      setDraggedLeadId(null);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Pipeline de Vendas</h2>
          <p className="text-slate-500">Gestão de oportunidades e previsão de fechamento</p>
        </div>
        <button onClick={() => { resetForm(); setIsModalOpen(true)}} className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors shadow-lg shadow-pink-500/20">
            <Plus size={18} /> Nova Oportunidade
        </button>
      </div>

      <div className="flex-1 flex gap-4 overflow-x-auto pb-4 hide-scrollbar">
          {columns.map(col => (
              <div 
                key={col.id} 
                className={`flex-shrink-0 w-80 flex flex-col rounded-xl border bg-opacity-50 transition-colors ${col.color} ${draggedLeadId ? 'border-dashed border-2 border-slate-400/50' : ''}`}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, col.id)}
              >
                  <div className="p-4 flex items-center justify-between border-b border-black/5">
                      <h3 className="font-semibold text-slate-700">{col.label}</h3>
                      <span className="text-xs bg-white px-2 py-0.5 rounded-full font-bold text-slate-500">
                          {leads.filter(l => l.stage === col.id).length}
                      </span>
                  </div>
                  <div className="p-3 flex-1 overflow-y-auto space-y-3 custom-scrollbar">
                      {leads.filter(l => l.stage === col.id).map(lead => (
                          <div 
                            key={lead.id} 
                            draggable
                            onDragStart={(e) => handleDragStart(e, lead.id)}
                            onClick={() => { setEditingLead(lead); setIsModalOpen(true) }} 
                            className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 hover:shadow-md transition-all cursor-grab active:cursor-grabbing group"
                          >
                                <h4 className="font-bold text-slate-800 group-hover:text-pink-600 transition-colors">{lead.company}</h4>
                                <p className="text-xs text-slate-500 mb-2">{lead.name}</p>
                                
                                <div className="flex items-center gap-1 text-amber-400 mb-2">
                                    {[1,2,3,4,5].map(s => <Star key={s} size={10} fill={s <= (lead.rating || 0) ? "currentColor" : "none"} />)}
                                </div>
                                
                                <div className="flex justify-between items-center pt-2 border-t border-slate-50">
                                    <p className="text-sm font-bold text-slate-800 flex items-center gap-1"><DollarSign size={12}/> {lead.value.toLocaleString()}</p>
                                    {lead.tasks && lead.tasks.filter(t => !t.completed).length > 0 && (
                                        <div className="text-[10px] text-red-500 bg-red-50 px-1.5 py-0.5 rounded flex items-center gap-1">
                                            <Clock size={10}/>
                                            {lead.tasks.filter(t => !t.completed).length} pendente(s)
                                        </div>
                                    )}
                                </div>
                          </div>
                      ))}
                  </div>
              </div>
          ))}
      </div>

      {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center backdrop-blur-sm p-4" onClick={() => setIsModalOpen(false)}>
              <div className="bg-white rounded-xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden animate-pop shadow-2xl" onClick={e => e.stopPropagation()}>
                  
                  {/* Header */}
                  <div className="p-6 border-b flex justify-between items-start bg-slate-50">
                      <div>
                          <div className="flex items-center gap-2 mb-1">
                             <Briefcase size={20} className="text-slate-400"/>
                             <input 
                                className="font-bold text-xl bg-transparent border-none outline-none focus:ring-2 focus:ring-pink-200 rounded px-1 text-slate-800"
                                placeholder="Nome da Empresa"
                                value={editingLead.company || ''}
                                onChange={e => setEditingLead({...editingLead, company: e.target.value})}
                             />
                          </div>
                          <div className="flex gap-4 text-sm text-slate-500 ml-7">
                              <span className="flex items-center gap-1"><User size={14}/> {editingLead.name || 'Sem contato'}</span>
                              <span className="flex items-center gap-1"><DollarSign size={14}/> R$ {editingLead.value || 0}</span>
                          </div>
                      </div>
                      <div className="flex items-center gap-2">
                          <select 
                            className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 outline-none focus:border-pink-500"
                            value={editingLead.stage}
                            onChange={e => setEditingLead({...editingLead, stage: e.target.value})}
                          >
                              {columns.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                          </select>
                          <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><Trash2 size={20}/></button>
                      </div>
                  </div>

                  <div className="flex flex-1 overflow-hidden">
                      {/* Sidebar / Tabs */}
                      <div className="w-48 bg-slate-50 border-r border-slate-200 p-4 space-y-2">
                          <button 
                            onClick={() => setActiveTab('DETAILS')}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'DETAILS' ? 'bg-white text-pink-600 shadow-sm' : 'text-slate-600 hover:bg-slate-200'}`}
                          >
                              Detalhes
                          </button>
                          <button 
                            onClick={() => setActiveTab('ACTIVITIES')}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex justify-between items-center ${activeTab === 'ACTIVITIES' ? 'bg-white text-pink-600 shadow-sm' : 'text-slate-600 hover:bg-slate-200'}`}
                          >
                              Atividades
                              {editingLead.tasks && editingLead.tasks.filter(t => !t.completed).length > 0 && (
                                  <span className="bg-red-500 text-white text-[10px] px-1.5 rounded-full">{editingLead.tasks.filter(t => !t.completed).length}</span>
                              )}
                          </button>
                      </div>

                      {/* Content Area */}
                      <div className="flex-1 overflow-y-auto p-8">
                          {activeTab === 'DETAILS' && (
                              <div className="space-y-6 max-w-lg">
                                  <div className="grid grid-cols-2 gap-4">
                                      <div>
                                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Contato Principal</label>
                                          <input className="w-full border border-slate-200 rounded p-2 text-sm" placeholder="Nome Completo" value={editingLead.name || ''} onChange={e => setEditingLead({...editingLead, name: e.target.value})} />
                                      </div>
                                      <div>
                                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Valor Estimado</label>
                                          <input className="w-full border border-slate-200 rounded p-2 text-sm" type="number" value={editingLead.value || ''} onChange={e => setEditingLead({...editingLead, value: parseFloat(e.target.value)})} />
                                      </div>
                                      <div>
                                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label>
                                          <input className="w-full border border-slate-200 rounded p-2 text-sm" value={editingLead.email || ''} onChange={e => setEditingLead({...editingLead, email: e.target.value})} />
                                      </div>
                                      <div>
                                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Telefone</label>
                                          <input className="w-full border border-slate-200 rounded p-2 text-sm" value={editingLead.phone || ''} onChange={e => setEditingLead({...editingLead, phone: e.target.value})} />
                                      </div>
                                      <div>
                                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Origem (Canal)</label>
                                          <select className="w-full border border-slate-200 rounded p-2 text-sm" value={editingLead.source} onChange={e => setEditingLead({...editingLead, source: e.target.value})}>
                                              <option value="">Selecione...</option>
                                              <option value="Instagram">Instagram</option>
                                              <option value="Linkedin">Linkedin</option>
                                              <option value="Google Ads">Google Ads</option>
                                              <option value="Indicação">Indicação</option>
                                          </select>
                                      </div>
                                      <div>
                                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Qualificação</label>
                                          <div className="flex gap-1 text-slate-300 pt-1">
                                              {[1,2,3,4,5].map(s => (
                                                  <button key={s} onClick={() => setEditingLead({...editingLead, rating: s})} className="hover:text-amber-400 transition-colors">
                                                      <Star size={24} fill={s <= (editingLead.rating || 0) ? "#fbbf24" : "none"} stroke={s <= (editingLead.rating || 0) ? "#fbbf24" : "currentColor"} />
                                                  </button>
                                              ))}
                                          </div>
                                      </div>
                                  </div>
                                  <div>
                                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Notas / Observações</label>
                                      <textarea 
                                        className="w-full border border-slate-200 rounded p-2 text-sm h-32 resize-none" 
                                        placeholder="Detalhes sobre a negociação..."
                                        value={editingLead.notes || ''}
                                        onChange={e => setEditingLead({...editingLead, notes: e.target.value})}
                                      />
                                  </div>
                              </div>
                          )}

                          {activeTab === 'ACTIVITIES' && (
                              <div className="space-y-6">
                                  {/* Add Task Form */}
                                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                      <h4 className="font-bold text-sm text-slate-700 mb-3">Agendar Atividade</h4>
                                      <div className="flex gap-2 mb-3">
                                          <button onClick={() => setNewTaskType('CALL')} className={`flex-1 flex items-center justify-center gap-2 p-2 rounded text-xs font-medium border ${newTaskType === 'CALL' ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-slate-200 text-slate-600'}`}><Phone size={14}/> Ligação</button>
                                          <button onClick={() => setNewTaskType('EMAIL')} className={`flex-1 flex items-center justify-center gap-2 p-2 rounded text-xs font-medium border ${newTaskType === 'EMAIL' ? 'bg-yellow-50 border-yellow-200 text-yellow-600' : 'bg-white border-slate-200 text-slate-600'}`}><Mail size={14}/> Email</button>
                                          <button onClick={() => setNewTaskType('MEETING')} className={`flex-1 flex items-center justify-center gap-2 p-2 rounded text-xs font-medium border ${newTaskType === 'MEETING' ? 'bg-purple-50 border-purple-200 text-purple-600' : 'bg-white border-slate-200 text-slate-600'}`}><User size={14}/> Reunião</button>
                                          <button onClick={() => setNewTaskType('TASK')} className={`flex-1 flex items-center justify-center gap-2 p-2 rounded text-xs font-medium border ${newTaskType === 'TASK' ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-white border-slate-200 text-slate-600'}`}><CheckSquare size={14}/> Tarefa</button>
                                      </div>
                                      <div className="flex gap-2">
                                          <input 
                                            className="flex-1 border border-slate-200 rounded p-2 text-sm" 
                                            placeholder="Descreva a atividade..." 
                                            value={newTaskText} 
                                            onChange={e => setNewTaskText(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && addTaskToLead()}
                                          />
                                          <input 
                                            type="date" 
                                            className="w-32 border border-slate-200 rounded p-2 text-sm" 
                                            value={newTaskDate}
                                            onChange={e => setNewTaskDate(e.target.value)}
                                          />
                                          <button onClick={addTaskToLead} className="bg-slate-800 text-white px-4 rounded font-medium text-sm hover:bg-slate-900">Adicionar</button>
                                      </div>
                                  </div>

                                  {/* Task List */}
                                  <div className="space-y-2">
                                      <h4 className="font-bold text-xs text-slate-500 uppercase">Planejado</h4>
                                      {(!editingLead.tasks || editingLead.tasks.filter(t => !t.completed).length === 0) && (
                                          <p className="text-sm text-slate-400 italic">Nenhuma atividade planejada.</p>
                                      )}
                                      {editingLead.tasks?.filter(t => !t.completed).map((task, idx) => (
                                          <div key={task.id} className="flex items-center gap-3 bg-white p-3 rounded border border-slate-100 hover:border-pink-200 group transition-colors">
                                              <button onClick={() => toggleTask(task.id)} className="text-slate-300 hover:text-emerald-500"><CheckSquare size={18}/></button>
                                              <div className="flex-1">
                                                  <div className="flex items-center gap-2 mb-1">
                                                      {getTaskIcon(task.type || 'TASK')}
                                                      <span className="text-sm font-medium text-slate-700">{task.text}</span>
                                                  </div>
                                                  <p className="text-xs text-slate-400 flex items-center gap-1"><Calendar size={10}/> {new Date(task.dueDate || '').toLocaleDateString()}</p>
                                              </div>
                                              <button onClick={() => deleteTask(task.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 size={16}/></button>
                                          </div>
                                      ))}
                                  </div>

                                  <div className="space-y-2 pt-4 border-t border-slate-100">
                                      <h4 className="font-bold text-xs text-slate-500 uppercase">Histórico / Concluído</h4>
                                       {editingLead.tasks?.filter(t => t.completed).map((task, idx) => (
                                          <div key={task.id} className="flex items-center gap-3 bg-slate-50 p-2 rounded opacity-70">
                                              <button onClick={() => toggleTask(task.id)} className="text-emerald-500"><CheckSquare size={18}/></button>
                                              <span className="text-sm text-slate-500 line-through flex-1">{task.text}</span>
                                          </div>
                                      ))}
                                  </div>
                              </div>
                          )}
                      </div>
                  </div>

                  <div className="p-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50">
                      <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded text-slate-600 hover:bg-slate-200 font-medium">Cancelar</button>
                      <button onClick={handleSave} className="px-6 py-2 rounded bg-pink-600 text-white font-bold hover:bg-pink-700 shadow-md">Salvar Oportunidade</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
