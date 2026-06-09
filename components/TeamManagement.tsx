
import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { User, Squad, ConfirmOptions, Role } from '../types';
import { Plus, Trash2, Edit2, Shield, User as UserIcon, FileText, Lock, Key, X, CheckCircle, Users, Mail, Eye, EyeOff } from 'lucide-react';
import { saveUser, deleteUser, saveSquad, deleteSquad } from '../services/supabaseService';

interface TeamManagementProps {
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  squads: Squad[];
  setSquads: React.Dispatch<React.SetStateAction<Squad[]>>;
  openConfirm: (options: ConfirmOptions) => Promise<boolean>;
  currentUserRole?: Role;
  currentUserId?: string;
  onSaveUser?: (user: Partial<User>) => Promise<void>;
  onDeleteUser?: (id: string) => Promise<void>;
  onSaveSquad?: (squad: Partial<Squad>) => Promise<void>;
  onDeleteSquad?: (id: string) => Promise<void>;
}

const ROLES: { value: Role; label: string }[] = [
    { value: 'ADMIN', label: 'Administrador (Total)' },
    { value: 'MANAGER', label: 'Gerente / Gestor' },
    { value: 'FINANCE', label: 'Financeiro' },
    { value: 'EMPLOYEE', label: 'Colaborador' },
    { value: 'COMMERCIAL', label: 'Comercial' },
    { value: 'CLIENT', label: 'Cliente' },
    { value: 'FREELANCER', label: 'Freelancer' },
];

export const TeamManagement: React.FC<TeamManagementProps> = ({ 
    users, setUsers, squads, setSquads, openConfirm, currentUserRole = 'ADMIN' as Role,
    currentUserId,
    onSaveUser, onDeleteUser, onSaveSquad, onDeleteSquad
}) => {
  const isCommercial = currentUserRole === 'COMMERCIAL';
  const isReadOnly = currentUserRole === 'EMPLOYEE' || currentUserRole === 'FREELANCER' || currentUserRole === 'CLIENT';
  
  // Filtrar usuários para Comercial: Ver apenas CLIENTS
  const displayedUsers = isCommercial 
    ? users.filter(u => u.role === 'CLIENT')
    : users;

  const INITIAL_USER_STATE: Partial<User> = { 
    name: '',
    email: '',
    role: isCommercial ? 'CLIENT' : 'EMPLOYEE', 
    avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=NewUser', 
    hasSystemAccess: isCommercial, // Clientes geralmente precisam de acesso se criados aqui
    password: ''
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Partial<User>>(INITIAL_USER_STATE);
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Filtrar cargos disponíveis
  const availableRoles = isCommercial 
    ? ROLES.filter(r => r.value === 'CLIENT')
    : ROLES;

  const [isSquadModalOpen, setIsSquadModalOpen] = useState(false);
  const [editingSquad, setEditingSquad] = useState<Partial<Squad>>({ name: '', members: [] });

  const handleSaveUser = async () => {
      if (!editingUser.name || !editingUser.email) return;
      
      setIsSaving(true);
      try {
          const userToSave = {
              ...editingUser,
              id: editingUser.id || (typeof window !== 'undefined' && window.crypto && typeof window.crypto.randomUUID === 'function' 
                  ? window.crypto.randomUUID() 
                  : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                      const r = Math.random() * 16 | 0;
                      const v = c === 'x' ? r : (r & 0x3 | 0x8);
                      return v.toString(16);
                    })),
              avatar: editingUser.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${editingUser.name}`,
              role: editingUser.role || 'EMPLOYEE',
              hasSystemAccess: !!editingUser.hasSystemAccess,
              password: editingUser.password || ''
          };

          if (onSaveUser) {
              await onSaveUser(userToSave);
          } else {
              const result = await saveUser(userToSave);
              if (result.success) {
                  if (editingUser.id) {
                      setUsers(prev => prev.map(u => u.id === editingUser.id ? userToSave as User : u));
                  } else {
                      setUsers(prev => [...prev, userToSave as User]);
                  }
              } else {
                  alert('Erro ao salvar colaborador no banco de dados.');
                  return;
              }
          }
          setIsModalOpen(false);
      } catch (error) {
          console.error(error);
      } finally {
          setIsSaving(false);
      }
  };

  const handleDeleteUser = async (id: string) => {
      const ok = await openConfirm({ 
          title: "Excluir Colaborador?", 
          description: "Esta ação removerá o acesso e os dados deste usuário permanentemente.", 
          variant: "danger" 
      });
      
      if (ok) {
          if (onDeleteUser) {
              await onDeleteUser(id);
          } else {
              const result = await deleteUser(id);
              if (result.success) {
                  setUsers(users.filter(u => u.id !== id));
              } else {
                  alert('Erro ao excluir colaborador do banco de dados.');
              }
          }
      }
  };

  const handleSaveSquad = async () => {
      if (!editingSquad.name) return;
      
      try {
          const squadToSave = {
              ...editingSquad,
              id: editingSquad.id || `squad-${Date.now()}`,
              members: editingSquad.members || []
          };
          
          if (onSaveSquad) {
              await onSaveSquad(squadToSave);
          } else {
              const result = await saveSquad(squadToSave);
              if (result.success) {
                  if (editingSquad.id) {
                      setSquads(prev => prev.map(s => s.id === editingSquad.id ? squadToSave as Squad : s));
                  } else {
                      setSquads(prev => [...prev, squadToSave as Squad]);
                  }
              } else {
                  alert('Erro ao salvar squad no banco de dados.');
                  return;
              }
          }
          setIsSquadModalOpen(false);
      } catch (error) {
          console.error(error);
      }
  };

  const handleDeleteSquad = async (id: string) => {
      const ok = await openConfirm({ 
          title: "Excluir Squad?", 
          description: "Atenção: A exclusão de uma squad removerá o vínculo de todos os colaboradores, tarefas e clientes associados a ela. Esta ação não pode ser desfeita.", 
          variant: "danger" 
      });
      
      if (ok) {
          try {
              if (onDeleteSquad) {
                  await onDeleteSquad(id);
              } else {
                  const result = await deleteSquad(id);
                  if (result.success) {
                      setSquads(prev => prev.filter(s => s.id !== id));
                  } else {
                      alert('Erro ao excluir squad do banco de dados.');
                  }
              }
          } catch (error) {
              console.error(error);
          }
      }
  };

  const toggleSquadMember = (userId: string) => {
      const current = editingSquad.members || [];
      const newMembers = current.includes(userId) ? current.filter(id => id !== userId) : [...current, userId];
      setEditingSquad({ ...editingSquad, members: newMembers });
  };

  return (
    <div className="space-y-8 animate-pop">
      <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-800">Equipes & Squads</h2>
          {!isReadOnly && (
              <button onClick={() => { setEditingUser(INITIAL_USER_STATE); setIsModalOpen(true) }} className="bg-pink-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow hover:bg-pink-700 active:scale-95 transition-all"><Plus size={18}/> Novo Colaborador</button>
          )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl border shadow-sm">
              <div className="p-4 border-b bg-slate-50 font-bold flex items-center justify-between">
                <span>{isCommercial ? 'Acessos de Clientes' : 'Colaboradores'}</span>
                {isCommercial && <span className="text-[10px] text-slate-400 font-normal">Apenas perfis de clientes</span>}
              </div>
              <div className="divide-y max-h-[500px] overflow-y-auto custom-scrollbar">
                  {displayedUsers.map(user => (
                      <div key={user.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                          <div className="flex items-center gap-3">
                              <div className="relative">
                                  <img src={user.avatar || undefined} className="w-10 h-10 rounded-full border shadow-sm" />
                                  {user.hasSystemAccess && (
                                      <div className="absolute -bottom-1 -right-1 bg-emerald-500 border-2 border-white w-4 h-4 rounded-full flex items-center justify-center" title="Acesso ao Sistema Habilitado">
                                          <CheckCircle size={10} className="text-white"/>
                                      </div>
                                  )}
                              </div>
                              <div className="flex flex-col">
                                  <span className="font-bold text-sm text-slate-800">{user.name}</span>
                                  <div className="flex items-center gap-2">
                                      <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                                          {ROLES.find(r => r.value === user.role)?.label.split(' ')[0] || user.role}
                                      </span>
                                      <span className="text-[10px] text-slate-400">{user.email}</span>
                                  </div>
                              </div>
                          </div>
                          {!isReadOnly ? (
                              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button 
                                    onClick={()=> {setEditingUser(user); setIsModalOpen(true)}} 
                                    className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="Editar"
                                  >
                                      <Edit2 size={16}/>
                                  </button>
                                  <button 
                                    onClick={()=>handleDeleteUser(user.id)} 
                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Excluir"
                                  >
                                      <Trash2 size={16}/>
                                  </button>
                              </div>
                          ) : (
                              user.id === currentUserId ? (
                                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button 
                                        onClick={()=> {setEditingUser(user); setIsModalOpen(true)}} 
                                        className="p-2 text-slate-500 hover:bg-slate-50 rounded-lg transition-colors"
                                        title="Visualizar"
                                      >
                                          <Eye size={16}/>
                                      </button>
                                  </div>
                              ) : null
                          )}
                      </div>
                  ))}
              </div>
          </div>

          {!isCommercial && (
            <div className="bg-white rounded-xl border shadow-sm p-4">
              <div className="flex justify-between mb-6 items-center">
                  <h3 className="font-bold">Squads</h3>
                  {currentUserRole !== 'EMPLOYEE' && (
                      <button onClick={()=>{setEditingSquad({name:'',members:[]});setIsSquadModalOpen(true)}} className="text-xs text-pink-600 font-bold hover:text-pink-800 transition-colors">+ Criar Squad</button>
                  )}
              </div>
              <div className="space-y-4">
                  {squads.map(s => {
                      const isMySquad = !!(currentUserId && s.members?.includes(currentUserId));
                      return (
                          <div 
                              key={s.id} 
                              className={`p-4 border rounded-xl flex justify-between items-center group transition-all ${
                                  isMySquad 
                                      ? 'bg-pink-50/30 border-pink-300 shadow-sm ring-1 ring-pink-200' 
                                      : 'bg-slate-50/50 border-slate-200'
                              }`}
                          >
                              <div className="flex flex-col gap-1.5">
                                  <div className="flex items-center gap-2 flex-wrap">
                                      <span className="font-bold text-slate-800">{s.name}</span>
                                      {isMySquad && (
                                          <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider bg-pink-100 text-pink-700 px-2 py-0.5 rounded border border-pink-200 animate-pulse">
                                              <Users size={10} className="text-pink-600" /> Minha Squad
                                          </span>
                                      )}
                                  </div>

                                  {/* List of members avatars */}
                                  {s.members && s.members.length > 0 && (
                                      <div className="flex items-center gap-2 mt-1">
                                          <div className="flex -space-x-1.5 overflow-hidden">
                                              {s.members.map(memberId => {
                                                  const member = users.find(u => u.id === memberId);
                                                  if (!member) return null;
                                                  return (
                                                      <img 
                                                          key={memberId}
                                                          className="inline-block h-6 w-6 rounded-full ring-2 ring-white border border-slate-100 object-cover" 
                                                          src={member.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${member.name}`} 
                                                          alt={member.name}
                                                          title={member.name}
                                                      />
                                                  );
                                              })}
                                          </div>
                                          <span className="text-[10px] text-slate-400 font-semibold">
                                              {s.members.length} {s.members.length === 1 ? 'membro' : 'membros'}
                                          </span>
                                      </div>
                                  )}
                              </div>

                              {!isReadOnly ? (
                                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button 
                                        onClick={()=>{setEditingSquad(s); setIsSquadModalOpen(true)}} 
                                        className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                        title="Editar"
                                      >
                                          <Edit2 size={16}/>
                                      </button>
                                      <button 
                                        onClick={()=>handleDeleteSquad(s.id)} 
                                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Excluir"
                                      >
                                          <Trash2 size={16}/>
                                      </button>
                                  </div>
                              ) : (
                                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button 
                                        onClick={()=>{setEditingSquad(s); setIsSquadModalOpen(true)}} 
                                        className="p-2 text-slate-500 hover:bg-slate-50 rounded-lg transition-colors"
                                        title="Visualizar"
                                      >
                                          <Eye size={16}/>
                                      </button>
                                  </div>
                              )}
                          </div>
                      );
                  })}
              </div>
            </div>
          )}
      </div>

      {isModalOpen && (
          <Modal 
              isOpen={isModalOpen} 
              onClose={() => setIsModalOpen(false)}
              title={isReadOnly ? "Visualizar Colaborador" : (editingUser.id ? "Editar Colaborador" : "Novo Colaborador")}
              maxWidth="600px"
          >
              <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-400 uppercase">Nome Completo</label>
                          <div className="relative">
                              <UserIcon className="absolute left-3 top-3 text-slate-400" size={18}/>
                              <input className="w-full border p-3 pl-10 rounded-lg outline-none focus:ring-2 focus:ring-pink-100 focus:border-pink-500 transition-all disabled:opacity-75 disabled:bg-slate-50" placeholder="Ex: João Silva" value={editingUser.name || ''} onChange={e => setEditingUser({...editingUser, name:e.target.value})} disabled={isReadOnly}/>
                          </div>
                      </div>
                      <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-400 uppercase">E-mail</label>
                          <div className="relative">
                              <Mail className="absolute left-3 top-3 text-slate-400" size={18}/>
                              <input className="w-full border p-3 pl-10 rounded-lg outline-none focus:ring-2 focus:ring-pink-100 focus:border-pink-500 transition-all disabled:opacity-75 disabled:bg-slate-50" placeholder="Ex: joao@empresa.com" value={editingUser.email || ''} onChange={e => setEditingUser({...editingUser, email:e.target.value})} disabled={isReadOnly}/>
                          </div>
                      </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-400 uppercase">Nível de Hierarquia (Cargo)</label>
                          <div className="relative">
                              <Shield className="absolute left-3 top-3 text-slate-400" size={18}/>
                              <select 
                                className="w-full border p-3 pl-10 rounded-lg outline-none focus:ring-2 focus:ring-pink-100 focus:border-pink-500 transition-all appearance-none bg-white disabled:opacity-75 disabled:bg-slate-50"
                                value={editingUser.role || 'EMPLOYEE'}
                                onChange={e => setEditingUser({...editingUser, role: e.target.value as Role})}
                                disabled={isReadOnly || isCommercial}
                              >
                                  {availableRoles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                              </select>
                          </div>
                      </div>
                      <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-400 uppercase">Acesso ao Sistema</label>
                          <div className="flex items-center gap-3 p-3 border rounded-lg h-[50px] disabled:opacity-75 disabled:bg-slate-50">
                              <input 
                                type="checkbox" 
                                id="hasAccess"
                                className="w-5 h-5 accent-pink-600 cursor-pointer disabled:opacity-75"
                                checked={!!editingUser.hasSystemAccess}
                                onChange={e => setEditingUser({...editingUser, hasSystemAccess: e.target.checked})}
                                disabled={isReadOnly}
                              />
                              <label htmlFor="hasAccess" className="text-sm font-medium text-slate-700 cursor-pointer">Habilitar Login</label>
                          </div>
                      </div>
                  </div>

                  {editingUser.hasSystemAccess && !isReadOnly && (
                      <div className="space-y-1 animate-fade-in">
                          <label className="text-xs font-bold text-slate-400 uppercase">Senha de Acesso</label>
                          <div className="relative">
                              <Lock className="absolute left-3 top-3 text-slate-400" size={18}/>
                              <input 
                                type={showPassword ? "text" : "password"}
                                className="w-full border p-3 pl-10 pr-10 rounded-lg outline-none focus:ring-2 focus:ring-pink-100 focus:border-pink-500 transition-all disabled:opacity-75 disabled:bg-slate-50" 
                                placeholder="Defina uma senha" 
                                value={editingUser.password || ''} 
                                onChange={e => setEditingUser({...editingUser, password: e.target.value})}
                                disabled={isReadOnly}
                              />
                              <button 
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition-colors"
                              >
                                  {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                              </button>
                          </div>
                          <p className="text-[10px] text-slate-400">Esta senha será usada pelo colaborador para acessar a plataforma.</p>
                      </div>
                  )}

                  {(currentUserRole === 'ADMIN' || currentUserRole === 'FINANCE' || currentUserRole === 'MANAGER') && (
                      <div className="space-y-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 animate-fade-in text-left">
                          <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                              <FileText size={16} className="text-pink-600" />
                              Informações Financeiras & Pagamento
                          </h4>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-1">
                                  <label className="text-xs font-bold text-slate-400 uppercase">Salário Base (R$)</label>
                                  <input 
                                      type="number" 
                                      className="w-full border p-2.5 rounded-lg text-sm bg-white dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-pink-100 focus:border-pink-500 transition-all outline-none" 
                                      placeholder="Ex: 5000" 
                                      value={editingUser.salary || ''} 
                                      onChange={e => setEditingUser({...editingUser, salary: parseFloat(e.target.value) || undefined})}
                                  />
                              </div>
                              <div className="space-y-1">
                                  <label className="text-xs font-bold text-slate-400 uppercase">Valor Hora (R$)</label>
                                  <input 
                                      type="number" 
                                      className="w-full border p-2.5 rounded-lg text-sm bg-white dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-pink-100 focus:border-pink-500 transition-all outline-none" 
                                      placeholder="Ex: 50" 
                                      value={editingUser.hourlyRate || ''} 
                                      onChange={e => setEditingUser({...editingUser, hourlyRate: parseFloat(e.target.value) || undefined})}
                                  />
                              </div>
                          </div>

                          <div className="space-y-1">
                              <label className="text-xs font-bold text-slate-400 uppercase">Dados Bancários / Chave PIX</label>
                              <textarea 
                                  className="w-full border p-2.5 rounded-lg text-sm bg-white dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-pink-100 focus:border-pink-500 transition-all outline-none h-20 resize-none" 
                                  placeholder="Banco, Agência, Conta ou Chave PIX" 
                                  value={editingUser.bankDetails || ''} 
                                  onChange={e => setEditingUser({...editingUser, bankDetails: e.target.value})}
                              />
                          </div>
                      </div>
                  )}

                  {isReadOnly ? (
                      <button 
                        onClick={() => setIsModalOpen(false)} 
                        className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2"
                      >
                          Fechar
                      </button>
                  ) : (
                      <button 
                        onClick={handleSaveUser} 
                        disabled={isSaving}
                        className={`w-full py-4 rounded-lg font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 ${isSaving ? 'bg-slate-400' : 'bg-pink-600 hover:bg-pink-700 active:scale-95'}`}
                      >
                          {isSaving ? 'Salvando...' : (
                              <>
                                  <CheckCircle size={20}/>
                                  {editingUser.id ? 'Atualizar Colaborador' : 'Criar Colaborador'}
                              </>
                          )}
                      </button>
                  )}
              </div>
          </Modal>
      )}

       {isSquadModalOpen && (
          <Modal 
              isOpen={isSquadModalOpen} 
              onClose={() => setIsSquadModalOpen(false)}
              title={isReadOnly ? "Visualizar Squad" : "Configurar Squad"}
              maxWidth="512px"
          >
              <div className="space-y-6">
                  <input className="w-full border p-3 rounded-lg disabled:opacity-75 disabled:bg-slate-50" placeholder="Nome da Squad" value={editingSquad.name || ''} onChange={e => setEditingSquad({...editingSquad, name:e.target.value})} disabled={isReadOnly}/>
                  <div>
                      <label className="text-xs font-bold text-slate-400 uppercase">Membros</label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                          {users.filter(u=>u.role!=='CLIENT').map(u => (
                              <button key={u.id} onClick={()=> !isReadOnly && toggleSquadMember(u.id)} className={`p-2 border rounded-lg text-xs font-bold text-left transition-all ${editingSquad.members?.includes(u.id) ? 'bg-pink-50 border-pink-500 text-pink-600' : 'bg-white text-slate-600'} ${isReadOnly ? 'cursor-default' : ''}`}>{u.name}</button>
                          ))}
                      </div>
                  </div>
                  {isReadOnly ? (
                      <button onClick={() => setIsSquadModalOpen(false)} className="w-full bg-slate-950 hover:bg-slate-900 text-white py-3 rounded-lg font-bold">Fechar</button>
                  ) : (
                      <button onClick={handleSaveSquad} className="w-full bg-slate-900 text-white py-3 rounded-lg font-bold">Salvar Squad</button>
                  )}
              </div>
          </Modal>
      )}
    </div>
  );
};
