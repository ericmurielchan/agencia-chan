
import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { User, Squad, ConfirmOptions, Role, Task, Lead, Client } from '../types';
import { Plus, Trash2, Edit2, Shield, User as UserIcon, FileText, Lock, Key, X, CheckCircle, Users, Mail, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { saveUser, deleteUser, saveSquad, deleteSquad, saveTask, saveLead, saveClient } from '../services/supabaseService';

interface TeamManagementProps {
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  squads: Squad[];
  setSquads: React.Dispatch<React.SetStateAction<Squad[]>>;
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  leads: Lead[];
  setLeads: React.Dispatch<React.SetStateAction<Lead[]>>;
  clients: Client[];
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
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
    { value: 'COMMERCIAL_MANAGER', label: 'Gerente Comercial' },
    { value: 'FINANCE', label: 'Financeiro' },
    { value: 'EMPLOYEE', label: 'Colaborador' },
    { value: 'COMMERCIAL', label: 'Comercial' },
    { value: 'CLIENT', label: 'Cliente' },
    { value: 'FREELANCER', label: 'Freelancer' },
];

export const TeamManagement: React.FC<TeamManagementProps> = ({ 
    users, setUsers, squads, setSquads, 
    tasks = [], setTasks, leads = [], setLeads, clients = [], setClients,
    openConfirm, currentUserRole = 'ADMIN' as Role,
    currentUserId,
    onSaveUser, onDeleteUser, onSaveSquad, onDeleteSquad
}) => {
  const isCommercial = currentUserRole === 'COMMERCIAL';
  const isCommercialManager = currentUserRole === 'COMMERCIAL_MANAGER';
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

  const isEditingSelf = editingUser.id === currentUserId;
  const isTargetPeerOrSuperior = editingUser.role === 'ADMIN' || (editingUser.role === 'MANAGER' && !isEditingSelf) || (editingUser.role === 'COMMERCIAL_MANAGER' && !isEditingSelf);
  const isTargetReadOnly = isReadOnly || ((currentUserRole === 'MANAGER' || currentUserRole === 'COMMERCIAL_MANAGER') && isTargetPeerOrSuperior);

  // Filtrar cargos disponíveis
  const availableRoles = isCommercial 
    ? ROLES.filter(r => r.value === 'CLIENT')
    : isCommercialManager
      ? ROLES.filter(r => r.value === 'COMMERCIAL' || r.value === 'CLIENT')
      : ROLES;

  const [isSquadModalOpen, setIsSquadModalOpen] = useState(false);
  const [editingSquad, setEditingSquad] = useState<Partial<Squad>>({ name: '', members: [] });

  const [reassignModalOpen, setReassignModalOpen] = useState(false);
  const [userToReassign, setUserToReassign] = useState<User | null>(null);
  const [transferUserId, setTransferUserId] = useState<string>('');

  const canEditUser = (u: User) => {
      if (isReadOnly) return false;
      if (currentUserRole === 'MANAGER' || currentUserRole === 'COMMERCIAL_MANAGER') {
          // Pode editar a si mesmo, mas não outros gerentes ou administradores
          if (u.id === currentUserId) return true;
          if (u.role === 'ADMIN' || u.role === 'MANAGER' || u.role === 'COMMERCIAL_MANAGER') return false;
      }
      return true;
  };

  const canDeleteUser = (u: User) => {
      if (isReadOnly) return false;
      if (currentUserRole === 'MANAGER' || currentUserRole === 'COMMERCIAL_MANAGER') {
          // Gerente não pode excluir a si mesmo nem outros gerentes ou administradores
          if (u.role === 'ADMIN' || u.role === 'MANAGER' || u.role === 'COMMERCIAL_MANAGER') return false;
      }
      return true;
  };

  const handleSaveUser = async () => {
      if (!editingUser.name || !editingUser.email) return;

      if (isReadOnly) {
          alert('Você não possui permissão para criar ou editar colaboradores.');
          return;
      }

      if (currentUserRole === 'MANAGER' || currentUserRole === 'COMMERCIAL_MANAGER') {
          if (editingUser.id !== currentUserId) {
              if (editingUser.role === 'ADMIN' || editingUser.role === 'MANAGER' || editingUser.role === 'COMMERCIAL_MANAGER') {
                  alert('Você não possui permissão para criar ou definir colaboradores com nível de hierarquia igual ou superior ao seu.');
                  return;
              }
          } else {
              const originalUser = users.find(u => u.id === currentUserId);
              if (originalUser && editingUser.role !== originalUser.role) {
                  alert('Você não tem permissão para alterar o seu próprio nível de hierarquia.');
                  return;
              }
          }
      }
      
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
      if (isReadOnly) {
          alert('Você não possui permissão para excluir colaboradores.');
          return;
      }

      const targetUser = users.find(u => u.id === id);
      if ((currentUserRole === 'MANAGER' || currentUserRole === 'COMMERCIAL_MANAGER') && targetUser && (targetUser.role === 'ADMIN' || targetUser.role === 'MANAGER' || targetUser.role === 'COMMERCIAL_MANAGER')) {
          alert('Você não possui permissão para excluir colaboradores com nível de hierarquia igual ou superior ao seu.');
          return;
      }

      // Detect active tasks, leads, and clients
      const userTasks = tasks.filter(t => t.assigneeIds?.includes(id) && t.status !== 'DONE' && !t.archived);
      const userLeads = leads.filter(l => l.responsibleId === id && l.stageId !== 'WON' && l.stageId !== 'LOST');
      const userClients = clients.filter(c => c.responsibleId === id && c.status === 'ACTIVE');

      if (userTasks.length > 0 || userLeads.length > 0 || userClients.length > 0) {
          setUserToReassign(targetUser || null);
          setTransferUserId('');
          setReassignModalOpen(true);
          return;
      }

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

  const handleReassignAndDelete = async () => {
      if (!userToReassign) return;
      
      if (isReadOnly) {
          alert('Você não possui permissão para excluir ou reatribuir colaboradores.');
          return;
      }
      
      const targetUserId = userToReassign.id;
      setIsSaving(true);
      
      try {
          // 1. Reassign or Unassign tasks
          const userTasks = tasks.filter(t => t.assigneeIds?.includes(targetUserId));
          for (const task of userTasks) {
              const updatedAssignees = transferUserId 
                  ? (task.assigneeIds.includes(transferUserId) 
                      ? task.assigneeIds.filter(id => id !== targetUserId) 
                      : task.assigneeIds.map(id => id === targetUserId ? transferUserId : id))
                  : task.assigneeIds.filter(id => id !== targetUserId);
                  
              const updatedTask = { ...task, assigneeIds: updatedAssignees };
              await saveTask(updatedTask);
              if (setTasks) {
                  setTasks(prev => prev.map(t => t.id === task.id ? updatedTask : t));
              }
          }

          // 2. Reassign or Unassign leads
          const userLeads = leads.filter(l => l.responsibleId === targetUserId);
          for (const lead of userLeads) {
              const updatedLead = { ...lead, responsibleId: transferUserId || undefined };
              await saveLead(updatedLead);
              if (setLeads) {
                  setLeads(prev => prev.map(l => l.id === lead.id ? updatedLead : l));
              }
          }

          // 3. Reassign or Unassign clients
          const userClients = clients.filter(c => c.responsibleId === targetUserId);
          for (const client of userClients) {
              const updatedClient = { ...client, responsibleId: transferUserId || undefined };
              await saveClient(updatedClient);
              if (setClients) {
                  setClients(prev => prev.map(c => c.id === client.id ? updatedClient : c));
              }
          }

          // 3.5 Remove user from any squads they belong to (both in DB and local state)
          const userSquads = squads.filter(s => s.members?.includes(targetUserId));
          for (const squad of userSquads) {
              const updatedMembers = squad.members.filter(mId => mId !== targetUserId);
              const updatedSquad = { ...squad, members: updatedMembers };
              await saveSquad(updatedSquad);
              if (setSquads) {
                  setSquads(prev => prev.map(s => s.id === squad.id ? updatedSquad : s));
              }
          }

          // 4. Finally, delete the user from database
          if (onDeleteUser) {
              await onDeleteUser(targetUserId);
          } else {
              const result = await deleteUser(targetUserId);
              if (!result.success) {
                  console.error('Erro ao excluir colaborador do banco de dados:', result.error);
              }
          }
          
          // Force immediate update of local user list for instantaneous UI responsiveness
          setUsers(prev => prev.filter(u => u.id !== targetUserId));
          
          setReassignModalOpen(false);
          setUserToReassign(null);
          setTransferUserId('');
      } catch (err) {
          console.error("Erro ao reatribuir e excluir colaborador:", err);
          alert("Ocorreu um erro ao transferir as atribuições. Por favor, tente novamente.");
      } finally {
          setIsSaving(false);
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">Equipes & Squads</h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Gerencie colaboradores, permissões e squads da sua agência</p>
          </div>
          {!isReadOnly && (
              <button 
                  onClick={() => { setEditingUser(INITIAL_USER_STATE); setIsModalOpen(true) }} 
                  className="h-11 px-6 bg-pink-600 hover:bg-pink-700 text-white rounded-2xl flex items-center gap-2 text-xs font-black uppercase tracking-widest shadow-lg shadow-pink-500/20 transition-all transform hover:scale-[1.02] active:scale-95 whitespace-nowrap self-start md:self-auto"
              >
                  <Plus size={16}/> Novo Colaborador
              </button>
          )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white/60 backdrop-blur-xl rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm p-6">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">{isCommercial ? 'Acessos de Clientes' : 'Colaboradores'}</h3>
                {isCommercial && <span className="text-[9px] font-black uppercase tracking-widest bg-slate-100 text-slate-500 px-2.5 py-1 rounded-lg">Apenas Clientes</span>}
              </div>
              <div className="space-y-3 max-h-[520px] overflow-y-auto custom-scrollbar pr-1">
                  {displayedUsers.map(user => (
                      <div key={user.id} className="p-4 rounded-2xl border border-slate-50 hover:border-pink-200/50 hover:bg-pink-50/5 transition-all flex items-center justify-between group">
                          <div className="flex items-center gap-4">
                              <div className="relative">
                                  <img src={user.avatar || undefined} className="w-11 h-11 rounded-2xl border border-slate-200/50 shadow-sm object-cover" />
                                  {user.hasSystemAccess && (
                                      <div className="absolute -bottom-1 -right-1 bg-emerald-500 border-2 border-white w-5 h-5 rounded-full flex items-center justify-center shadow-sm" title="Acesso ao Sistema Habilitado">
                                          <CheckCircle size={11} className="text-white"/>
                                      </div>
                                  )}
                              </div>
                              <div className="flex flex-col">
                                  <span className="font-extrabold text-slate-800 text-sm">{user.name}</span>
                                  <div className="flex items-center gap-2.5 mt-1 flex-wrap">
                                      <span className="text-[9px] font-black bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg uppercase tracking-widest">
                                          {ROLES.find(r => r.value === user.role)?.label.split(' ')[0] || user.role}
                                      </span>
                                      <span className="text-[10px] text-slate-400 font-bold">{user.email}</span>
                                  </div>
                              </div>
                          </div>
                          {canEditUser(user) ? (
                              <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button 
                                    onClick={()=> {setEditingUser(user); setIsModalOpen(true)}} 
                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                    title="Editar"
                                  >
                                      <Edit2 size={15}/>
                                  </button>
                                  {canDeleteUser(user) && (
                                      <button 
                                        onClick={()=>handleDeleteUser(user.id)} 
                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                        title="Excluir"
                                      >
                                          <Trash2 size={15}/>
                                      </button>
                                  )}
                              </div>
                          ) : (
                              (user.id === currentUserId || ((currentUserRole === 'MANAGER' || currentUserRole === 'COMMERCIAL_MANAGER') && (user.role === 'ADMIN' || user.role === 'MANAGER' || user.role === 'COMMERCIAL_MANAGER'))) ? (
                                  <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button 
                                        onClick={()=> {setEditingUser(user); setIsModalOpen(true)}} 
                                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                                        title="Visualizar"
                                      >
                                          <Eye size={15}/>
                                      </button>
                                  </div>
                              ) : null
                          )}
                      </div>
                  ))}
              </div>
          </div>

          {!isCommercial && (
            <div className="bg-white/60 backdrop-blur-xl rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm p-6">
              <div className="flex justify-between mb-6 items-center">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Squads</h3>
                  {currentUserRole !== 'EMPLOYEE' && currentUserRole !== 'FREELANCER' && (
                      <button 
                          onClick={()=>{setEditingSquad({name:'',members:[]});setIsSquadModalOpen(true)}} 
                          className="text-[10px] font-black uppercase tracking-widest text-pink-600 hover:text-pink-800 transition-colors flex items-center gap-1.5"
                      >
                          <Plus size={14}/> Criar Squad
                      </button>
                  )}
              </div>
              <div className="space-y-3 max-h-[520px] overflow-y-auto custom-scrollbar pr-1">
                  {squads.map(s => {
                      const isMySquad = !!(currentUserId && s.members?.includes(currentUserId));
                      return (
                          <div 
                              key={s.id} 
                              className={`p-5 rounded-[24px] border flex justify-between items-center group transition-all ${
                                  isMySquad 
                                      ? 'bg-pink-50/10 border-pink-200 shadow-sm ring-1 ring-pink-100' 
                                      : 'bg-slate-50/30 border-slate-100/80 hover:border-pink-100/50 hover:bg-pink-50/5'
                              }`}
                          >
                              <div className="flex flex-col gap-2">
                                  <div className="flex items-center gap-2.5 flex-wrap">
                                      <span className="font-extrabold text-slate-800 text-sm tracking-tight">{s.name}</span>
                                      {isMySquad && (
                                          <span className="inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-wider bg-pink-100 text-pink-700 px-2.5 py-0.5 rounded-lg border border-pink-200/30 animate-pulse">
                                              <Users size={10} className="text-pink-600" /> Minha Squad
                                          </span>
                                      )}
                                  </div>

                                  {/* List of members avatars */}
                                  {s.members && s.members.length > 0 && (() => {
                                      const validMembers = s.members.filter(memberId => users.some(u => u.id === memberId));
                                      if (validMembers.length === 0) return null;
                                      return (
                                          <div className="flex items-center gap-3 mt-1">
                                              <div className="flex -space-x-2 overflow-hidden">
                                                  {validMembers.map(memberId => {
                                                      const member = users.find(u => u.id === memberId);
                                                      if (!member) return null;
                                                      return (
                                                          <img 
                                                              key={memberId}
                                                              className="inline-block h-6 w-6 rounded-xl ring-2 ring-white border border-slate-100 object-cover" 
                                                              src={member.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${member.name}`} 
                                                              alt={member.name}
                                                              title={member.name}
                                                          />
                                                      );
                                                  })}
                                              </div>
                                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                                  {validMembers.length} {validMembers.length === 1 ? 'membro' : 'membros'}
                                              </span>
                                          </div>
                                      );
                                  })()}
                              </div>

                              {!isReadOnly ? (
                                  <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button 
                                        onClick={()=>{setEditingSquad(s); setIsSquadModalOpen(true)}} 
                                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                        title="Editar"
                                      >
                                          <Edit2 size={15}/>
                                      </button>
                                      <button 
                                        onClick={()=>handleDeleteSquad(s.id)} 
                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                        title="Excluir"
                                      >
                                          <Trash2 size={15}/>
                                      </button>
                                  </div>
                              ) : (
                                  <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button 
                                        onClick={()=>{setEditingSquad(s); setIsSquadModalOpen(true)}} 
                                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                                        title="Visualizar"
                                      >
                                          <Eye size={15}/>
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
              title={isTargetReadOnly ? "Visualizar Colaborador" : (editingUser.id ? "Editar Colaborador" : "Novo Colaborador")}
              maxWidth="600px"
          >
              <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-400 uppercase">Nome Completo</label>
                          <div className="relative">
                              <UserIcon className="absolute left-3 top-3 text-slate-400" size={18}/>
                              <input className="w-full border p-3 pl-10 rounded-lg outline-none focus:ring-2 focus:ring-pink-100 focus:border-pink-500 transition-all disabled:opacity-75 disabled:bg-slate-50" placeholder="Ex: João Silva" value={editingUser.name || ''} onChange={e => setEditingUser({...editingUser, name:e.target.value})} disabled={isTargetReadOnly}/>
                          </div>
                      </div>
                      <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-400 uppercase">E-mail</label>
                          <div className="relative">
                              <Mail className="absolute left-3 top-3 text-slate-400" size={18}/>
                              <input className="w-full border p-3 pl-10 rounded-lg outline-none focus:ring-2 focus:ring-pink-100 focus:border-pink-500 transition-all disabled:opacity-75 disabled:bg-slate-50" placeholder="Ex: joao@empresa.com" value={editingUser.email || ''} onChange={e => setEditingUser({...editingUser, email:e.target.value})} disabled={isTargetReadOnly}/>
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
                                disabled={isTargetReadOnly || isCommercial || currentUserRole === 'MANAGER' || currentUserRole === 'COMMERCIAL_MANAGER'}
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
                                disabled={isTargetReadOnly}
                              />
                              <label htmlFor="hasAccess" className="text-sm font-medium text-slate-700 cursor-pointer">Habilitar Login</label>
                          </div>
                      </div>
                  </div>

                  {editingUser.hasSystemAccess && !isTargetReadOnly && (
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
                                disabled={isTargetReadOnly}
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

                  {(currentUserRole === 'ADMIN' || currentUserRole === 'FINANCE') && (
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

      {reassignModalOpen && userToReassign && (
          <Modal
              isOpen={reassignModalOpen}
              onClose={() => { if (!isSaving) { setReassignModalOpen(false); setUserToReassign(null); } }}
              title="Atribuições Ativas Encontradas"
              maxWidth="600px"
          >
              <div className="space-y-6 text-slate-700">
                  {/* Warning Header */}
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 text-amber-800 text-sm">
                      <AlertTriangle className="text-amber-600 flex-shrink-0" size={20} />
                      <div>
                          <strong className="block font-bold">Atenção!</strong>
                          O colaborador <strong className="font-bold">{userToReassign.name}</strong> possui tarefas ou responsabilidades ativas registradas no sistema. Para excluí-lo com segurança, decida o que fazer com suas atribuições pendentes.
                      </div>
                  </div>

                  {/* Summary of Assignments */}
                  <div className="space-y-3">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest text-left">Resumo de Atribuições:</h4>
                      
                      {/* Active Tasks List */}
                      {(() => {
                          const userTasks = tasks.filter(t => t.assigneeIds?.includes(userToReassign.id) && t.status !== 'DONE' && !t.archived);
                          if (userTasks.length === 0) return null;
                          return (
                              <div className="border border-slate-100 dark:border-slate-800 rounded-xl p-3 bg-slate-50 dark:bg-slate-900/40 text-xs text-left">
                                  <div className="font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between mb-2">
                                      <span>📋 Tarefas Ativas ({userTasks.length})</span>
                                  </div>
                                  <ul className="list-disc leading-relaxed pl-4 text-slate-600 dark:text-slate-400 max-h-24 overflow-y-auto w-full">
                                      {userTasks.map(t => (
                                          <li key={t.id} className="truncate">{t.title}</li>
                                      ))}
                                  </ul>
                              </div>
                          );
                      })()}

                      {/* Active Leads List */}
                      {(() => {
                          const userLeads = leads.filter(l => l.responsibleId === userToReassign.id && l.stageId !== 'WON' && l.stageId !== 'LOST');
                          if (userLeads.length === 0) return null;
                          return (
                              <div className="border border-slate-100 dark:border-slate-800 rounded-xl p-3 bg-slate-50 dark:bg-slate-900/40 text-xs text-left">
                                  <div className="font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between mb-2">
                                      <span>💼 Negócios / Leads Ativos ({userLeads.length})</span>
                                  </div>
                                  <ul className="list-disc leading-relaxed pl-4 text-slate-600 dark:text-slate-400 max-h-24 overflow-y-auto w-full">
                                      {userLeads.map(l => (
                                          <li key={l.id} className="truncate">{l.company} - {l.name}</li>
                                      ))}
                                  </ul>
                              </div>
                          );
                      })()}

                      {/* Active Clients List */}
                      {(() => {
                          const userClients = clients.filter(c => c.responsibleId === userToReassign.id && c.status === 'ACTIVE');
                          if (userClients.length === 0) return null;
                          return (
                              <div className="border border-slate-100 dark:border-slate-800 rounded-xl p-3 bg-slate-50 dark:bg-slate-900/40 text-xs text-left">
                                  <div className="font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between mb-2">
                                      <span>🏢 Clientes Sob Responsabilidade ({userClients.length})</span>
                                  </div>
                                  <ul className="list-disc leading-relaxed pl-4 text-slate-600 dark:text-slate-400 max-h-24 overflow-y-auto w-full">
                                      {userClients.map(c => (
                                          <li key={c.id} className="truncate">{c.name}</li>
                                      ))}
                                  </ul>
                              </div>
                          );
                      })()}
                  </div>

                  {/* Transfer Options Selector */}
                  <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-4 text-left">
                      <label className="text-xs font-bold text-slate-500 uppercase block">Transferir Atribuições para:</label>
                      <select 
                          className="w-full border p-3 rounded-lg outline-none focus:ring-2 focus:ring-pink-100 focus:border-pink-500 transition-all bg-white text-sm"
                          value={transferUserId}
                          onChange={e => setTransferUserId(e.target.value)}
                      >
                          <option value="">-- Ninguém (Apenas Desatribuir / Deixar sem responsável) --</option>
                          {users
                              .filter(u => u.id !== userToReassign.id && u.role !== 'CLIENT')
                              .map(u => (
                                  <option key={u.id} value={u.id}>{u.name} ({ROLES.find(r => r.value === u.role)?.label.split(' ')[0] || u.role})</option>
                              ))
                          }
                      </select>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-3 border-t border-slate-100 dark:border-slate-800 pt-4">
                      <button 
                          onClick={() => { setReassignModalOpen(false); setUserToReassign(null); }}
                          disabled={isSaving}
                          className="px-4 py-3 border rounded-lg text-sm font-semibold hover:bg-slate-55 shadow-sm text-slate-700 transition-all cursor-pointer"
                      >
                          Cancelar
                      </button>
                      <button 
                          onClick={handleReassignAndDelete}
                          disabled={isSaving}
                          className={`px-4 py-3 rounded-lg text-sm font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                              isSaving 
                                  ? 'bg-slate-400 cursor-not-allowed' 
                                  : transferUserId 
                                      ? 'bg-pink-600 hover:bg-pink-700 active:scale-95' 
                                      : 'bg-red-600 hover:bg-red-700 active:scale-95'
                          }`}
                      >
                          {isSaving ? 'Processando...' : (
                              <>
                                  <CheckCircle size={18}/>
                                  {transferUserId ? 'Transferir e Excluir' : 'Remover e Excluir'}
                              </>
                          )}
                      </button>
                  </div>
              </div>
          </Modal>
      )}
    </div>
  );
};
