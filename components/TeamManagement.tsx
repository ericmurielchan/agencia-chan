import React, { useState } from 'react';
import { User, Squad } from '../types';
import { Plus, Trash2, Edit2, Shield, User as UserIcon, FileText, Lock, Key, X, CheckCircle } from 'lucide-react';

interface TeamManagementProps {
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  squads: Squad[];
  setSquads: React.Dispatch<React.SetStateAction<Squad[]>>;
}

export const TeamManagement: React.FC<TeamManagementProps> = ({ users, setUsers, squads, setSquads }) => {
  // User Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Partial<User>>({ role: 'EMPLOYEE', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=NewUser', hasSystemAccess: false });

  // Squad Modal State
  const [isSquadModalOpen, setIsSquadModalOpen] = useState(false);
  const [editingSquad, setEditingSquad] = useState<Partial<Squad>>({ name: '', members: [] });

  // --- User Logic ---
  const handleSaveUser = () => {
      if (!editingUser.name || !editingUser.email) return;

      if (editingUser.id) {
          // Edit
          setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, ...editingUser } as User : u));
      } else {
          // Create
          setUsers(prev => [...prev, { ...editingUser, id: Date.now().toString() } as User]);
      }
      setIsModalOpen(false);
      setEditingUser({ role: 'EMPLOYEE', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + Date.now(), hasSystemAccess: false });
  };

  const handleDeleteUser = (id: string) => {
      if (confirm('Tem certeza que deseja remover este colaborador?')) {
          setUsers(users.filter(u => u.id !== id));
          // Remove from squads too
          setSquads(prev => prev.map(s => ({...s, members: s.members.filter(m => m !== id)})));
      }
  };

  // --- Squad Logic ---
  const handleSaveSquad = () => {
      if (!editingSquad.name) return;

      if (editingSquad.id) {
          // Edit existing
          setSquads(prev => prev.map(s => s.id === editingSquad.id ? { ...s, ...editingSquad } as Squad : s));
      } else {
          // Create new
          const newSquad: Squad = {
              id: Date.now().toString(),
              name: editingSquad.name,
              members: editingSquad.members || []
          };
          setSquads(prev => [...prev, newSquad]);
      }
      setIsSquadModalOpen(false);
      setEditingSquad({ name: '', members: [] });
  };

  const handleDeleteSquad = (id: string) => {
      if(confirm('Tem certeza que deseja excluir esta Squad?')) {
          setSquads(prev => prev.filter(s => s.id !== id));
      }
  };

  const toggleSquadMember = (userId: string) => {
      const currentMembers = editingSquad.members || [];
      if (currentMembers.includes(userId)) {
          setEditingSquad({ ...editingSquad, members: currentMembers.filter(id => id !== userId) });
      } else {
          setEditingSquad({ ...editingSquad, members: [...currentMembers, userId] });
      }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-800">Gestão de Colaboradores & Squads</h2>
          <button onClick={() => { setEditingUser({}); setIsModalOpen(true) }} className="bg-pink-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg shadow-pink-500/20 hover:bg-pink-700 transition-colors">
              <Plus size={18}/> Novo Colaborador
          </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Users List */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden h-fit">
              <div className="p-4 border-b border-slate-100 bg-slate-50 font-bold text-slate-700 flex justify-between items-center">
                  <span>Colaboradores</span>
                  <span className="text-xs bg-slate-200 px-2 py-1 rounded-full text-slate-600">{users.length}</span>
              </div>
              <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto custom-scrollbar">
                  {users.map(user => (
                      <div key={user.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                          <div className="flex items-center gap-3">
                              <img src={user.avatar} className="w-10 h-10 rounded-full border border-slate-200" />
                              <div>
                                  <p className="font-bold text-slate-800 flex items-center gap-2">
                                    {user.name}
                                    {user.hasSystemAccess && <Lock size={12} className="text-emerald-500" title="Acesso ao Sistema"/>}
                                  </p>
                                  <p className="text-xs text-slate-500">{user.email}</p>
                              </div>
                          </div>
                          <div className="flex items-center gap-2">
                              <span className="text-xs bg-slate-100 px-2 py-1 rounded font-bold text-slate-600">{user.role}</span>
                              <button onClick={() => { setEditingUser(user); setIsModalOpen(true); }} className="text-slate-400 hover:text-blue-500 p-1 rounded hover:bg-blue-50"><Edit2 size={16}/></button>
                              <button onClick={() => handleDeleteUser(user.id)} className="text-slate-400 hover:text-red-500 p-1 rounded hover:bg-red-50"><Trash2 size={16}/></button>
                          </div>
                      </div>
                  ))}
              </div>
          </div>

          {/* Squads List */}
          <div className="space-y-4">
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 h-full">
                  <div className="flex justify-between items-center mb-6">
                     <h3 className="font-bold text-slate-700">Squads Ativas</h3>
                     <button 
                        onClick={() => { setEditingSquad({ name: '', members: [] }); setIsSquadModalOpen(true); }}
                        className="text-xs bg-pink-50 text-pink-600 font-bold px-3 py-1.5 rounded hover:bg-pink-100 transition-colors flex items-center gap-1"
                     >
                         <Plus size={14}/> Criar Squad
                     </button>
                  </div>
                  <div className="space-y-4">
                      {squads.map(squad => (
                          <div key={squad.id} className="border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow bg-slate-50/50">
                              <div className="flex justify-between mb-3">
                                  <div>
                                      <h4 className="font-bold text-lg text-slate-800">{squad.name}</h4>
                                      <p className="text-xs text-slate-500">{squad.members.length} membros</p>
                                  </div>
                                  <div className="flex gap-1">
                                      <button onClick={() => { setEditingSquad(squad); setIsSquadModalOpen(true); }} className="text-slate-400 hover:text-blue-600 p-1.5 hover:bg-blue-50 rounded"><Edit2 size={16}/></button>
                                      <button onClick={() => handleDeleteSquad(squad.id)} className="text-slate-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded"><Trash2 size={16}/></button>
                                  </div>
                              </div>
                              <div className="flex -space-x-2 overflow-hidden py-1 pl-1">
                                  {squad.members.map(mid => {
                                      const u = users.find(user => user.id === mid);
                                      if(!u) return null;
                                      return <img key={u.id} src={u.avatar} className="w-8 h-8 rounded-full border-2 border-white ring-1 ring-slate-100" title={u.name} />;
                                  })}
                                  <button 
                                    onClick={() => { setEditingSquad(squad); setIsSquadModalOpen(true); }}
                                    className="w-8 h-8 rounded-full bg-white border border-dashed border-slate-300 flex items-center justify-center text-slate-400 hover:text-pink-600 hover:border-pink-300 text-xs shadow-sm z-10"
                                  >
                                      <Plus size={14}/>
                                  </button>
                              </div>
                          </div>
                      ))}
                      {squads.length === 0 && (
                          <div className="text-center p-8 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                              Nenhuma Squad criada.
                          </div>
                      )}
                  </div>
              </div>
          </div>
      </div>

      {/* --- USER MODAL --- */}
      {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}>
              <div className="bg-white p-6 rounded-xl w-full max-w-lg shadow-2xl animate-pop max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                  <h3 className="text-xl font-bold mb-4">{editingUser.id ? 'Editar Colaborador' : 'Cadastrar Colaborador'}</h3>
                  <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                          <input 
                            className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:border-pink-500 outline-none" 
                            placeholder="Nome Completo"
                            value={editingUser.name || ''}
                            onChange={e => setEditingUser({...editingUser, name: e.target.value})}
                          />
                          <input 
                            className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:border-pink-500 outline-none" 
                            placeholder="Email Corporativo"
                            value={editingUser.email || ''}
                            onChange={e => setEditingUser({...editingUser, email: e.target.value})}
                          />
                      </div>
                      <select 
                        className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:border-pink-500 outline-none"
                        value={editingUser.role}
                        onChange={e => setEditingUser({...editingUser, role: e.target.value as any})}
                      >
                          <option value="ADMIN">Administrador</option>
                          <option value="MANAGER">Gerente</option>
                          <option value="EMPLOYEE">Colaborador</option>
                          <option value="FREELANCER">Freelancer</option>
                      </select>
                      
                      {/* Acesso ao Sistema */}
                      <div className="bg-indigo-50 p-4 rounded border border-indigo-100">
                           <div className="flex items-center gap-2 mb-2">
                                <input 
                                    type="checkbox" 
                                    id="systemAccess"
                                    checked={editingUser.hasSystemAccess} 
                                    onChange={e => setEditingUser({...editingUser, hasSystemAccess: e.target.checked})} 
                                />
                                <label htmlFor="systemAccess" className="text-sm font-bold text-indigo-800 flex items-center gap-1">
                                    <Shield size={14}/> Conceder Acesso ao Sistema
                                </label>
                           </div>
                           {editingUser.hasSystemAccess && (
                               <div className="ml-5">
                                   <label className="text-xs text-indigo-600 block mb-1">Definir Senha de Acesso</label>
                                   <div className="flex items-center gap-2 bg-white rounded border border-indigo-200 p-1">
                                       <Key size={14} className="text-slate-400 ml-1"/>
                                       <input 
                                            type="text" 
                                            className="w-full text-sm outline-none"
                                            placeholder="Ex: 123mudar"
                                            value={editingUser.password || ''}
                                            onChange={e => setEditingUser({...editingUser, password: e.target.value})}
                                       />
                                   </div>
                               </div>
                           )}
                      </div>

                      {/* Dados Financeiros / RH */}
                      <div className="bg-slate-50 p-3 rounded border border-slate-100 space-y-3">
                          <h4 className="font-bold text-xs uppercase text-slate-500">Dados Contratuais</h4>
                          <div className="grid grid-cols-2 gap-3">
                              <input 
                                type="number"
                                className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:border-pink-500 outline-none" 
                                placeholder="Salário Mensal"
                                value={editingUser.salary || ''}
                                onChange={e => setEditingUser({...editingUser, salary: parseFloat(e.target.value)})}
                              />
                              <input 
                                type="date"
                                className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:border-pink-500 outline-none" 
                                placeholder="Admissão"
                                value={editingUser.admissionDate || ''}
                                onChange={e => setEditingUser({...editingUser, admissionDate: e.target.value})}
                              />
                          </div>
                          <textarea 
                             className="w-full border border-slate-200 rounded-lg p-2 text-sm resize-none focus:border-pink-500 outline-none"
                             placeholder="Dados Bancários"
                             rows={2}
                             value={editingUser.bankDetails || ''}
                             onChange={e => setEditingUser({...editingUser, bankDetails: e.target.value})}
                          />
                          <div>
                              <label className="text-xs font-bold text-slate-500 uppercase">Documentos (URLs)</label>
                              <div className="flex gap-2">
                                  <input 
                                    className="flex-1 border border-slate-200 rounded-lg p-2 text-sm focus:border-pink-500 outline-none"
                                    placeholder="Link do Documento (Enter para adicionar)"
                                    onKeyDown={(e) => {
                                        if(e.key === 'Enter') {
                                            const val = e.currentTarget.value;
                                            if(val) setEditingUser({...editingUser, documents: [...(editingUser.documents || []), val]});
                                            e.currentTarget.value = '';
                                        }
                                    }}
                                  />
                              </div>
                              <div className="flex flex-wrap gap-1 mt-1">
                                  {editingUser.documents?.map((doc, i) => (
                                      <span key={i} className="text-xs bg-white border px-2 py-1 rounded flex items-center gap-1">
                                          <FileText size={10}/> Doc {i+1}
                                          <button onClick={() => setEditingUser({...editingUser, documents: editingUser.documents?.filter((_, idx) => idx !== i)})}><X size={10} className="hover:text-red-500"/></button>
                                      </span>
                                  ))}
                              </div>
                          </div>
                      </div>

                      <button onClick={handleSaveUser} className="w-full bg-pink-600 hover:bg-pink-700 text-white font-bold py-2 rounded-lg mt-2 transition-colors">Salvar Colaborador</button>
                      <button onClick={() => setIsModalOpen(false)} className="w-full text-slate-500 py-2 text-sm hover:underline">Cancelar</button>
                  </div>
              </div>
          </div>
      )}

      {/* --- SQUAD MODAL --- */}
      {isSquadModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] backdrop-blur-sm" onClick={() => setIsSquadModalOpen(false)}>
              <div className="bg-white rounded-xl w-full max-w-md shadow-2xl animate-pop overflow-hidden" onClick={e => e.stopPropagation()}>
                  <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                      <h3 className="text-lg font-bold text-slate-800">{editingSquad.id ? 'Editar Squad' : 'Nova Squad'}</h3>
                      <button onClick={() => setIsSquadModalOpen(false)}><X size={20} className="text-slate-400 hover:text-slate-600"/></button>
                  </div>
                  
                  <div className="p-6 space-y-6">
                      <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1">Nome da Squad</label>
                          <input 
                            className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:border-pink-500 outline-none" 
                            placeholder="Ex: Squad Performance"
                            value={editingSquad.name || ''}
                            onChange={e => setEditingSquad({...editingSquad, name: e.target.value})}
                            autoFocus
                          />
                      </div>

                      <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">Selecionar Membros</label>
                          <div className="border border-slate-200 rounded-lg max-h-60 overflow-y-auto divide-y divide-slate-100">
                              {users.map(user => {
                                  const isSelected = editingSquad.members?.includes(user.id);
                                  // Verifica se usuário está em outra squad (para info visual)
                                  const otherSquad = squads.find(s => s.id !== editingSquad.id && s.members.includes(user.id));
                                  
                                  return (
                                      <div 
                                        key={user.id} 
                                        className={`flex items-center gap-3 p-2.5 cursor-pointer hover:bg-slate-50 transition-colors ${isSelected ? 'bg-pink-50' : ''}`}
                                        onClick={() => toggleSquadMember(user.id)}
                                      >
                                          <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-pink-600 border-pink-600' : 'border-slate-300 bg-white'}`}>
                                              {isSelected && <CheckCircle size={14} className="text-white"/>}
                                          </div>
                                          <img src={user.avatar} className="w-8 h-8 rounded-full" />
                                          <div className="flex-1">
                                              <p className={`text-sm ${isSelected ? 'font-bold text-slate-800' : 'text-slate-600'}`}>{user.name}</p>
                                              <p className="text-[10px] text-slate-400">{user.role}</p>
                                              {otherSquad && (
                                                  <p className="text-[10px] text-amber-600 flex items-center gap-1">
                                                      • Também em {otherSquad.name}
                                                  </p>
                                              )}
                                          </div>
                                      </div>
                                  );
                              })}
                          </div>
                          <p className="text-[10px] text-slate-400 mt-2">
                              * Colaboradores podem fazer parte de múltiplas squads.
                          </p>
                      </div>

                      <button onClick={handleSaveSquad} className="w-full bg-pink-600 hover:bg-pink-700 text-white font-bold py-2.5 rounded-lg transition-colors shadow-lg shadow-pink-500/20">
                          {editingSquad.id ? 'Salvar Alterações' : 'Criar Squad'}
                      </button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};