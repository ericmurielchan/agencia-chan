
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
}

const ROLES: { value: Role; label: string }[] = [
    { value: 'ADMIN', label: 'Administrador (Total)' },
    { value: 'MANAGER', label: 'Gerente / Gestor' },
    { value: 'FINANCE', label: 'Financeiro' },
    { value: 'EMPLOYEE', label: 'Colaborador' },
    { value: 'FREELANCER', label: 'Comercial' },
];

export const TeamManagement: React.FC<TeamManagementProps> = ({ users, setUsers, squads, setSquads, openConfirm }) => {
  const INITIAL_USER_STATE: Partial<User> = { 
    name: '',
    email: '',
    role: 'EMPLOYEE', 
    avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=NewUser', 
    hasSystemAccess: false,
    password: ''
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Partial<User>>(INITIAL_USER_STATE);
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [isSquadModalOpen, setIsSquadModalOpen] = useState(false);
  const [editingSquad, setEditingSquad] = useState<Partial<Squad>>({ name: '', members: [] });

  const handleSaveUser = async () => {
      if (!editingUser.name || !editingUser.email) return;
      
      setIsSaving(true);
      try {
          const userToSave = {
              ...editingUser,
              id: editingUser.id || `user-${Date.now()}`,
              avatar: editingUser.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${editingUser.name}`,
              role: editingUser.role || 'EMPLOYEE',
              hasSystemAccess: !!editingUser.hasSystemAccess,
              password: editingUser.password || ''
          };

          const result = await saveUser(userToSave);
          
          if (result.success) {
              if (editingUser.id) {
                  setUsers(prev => prev.map(u => u.id === editingUser.id ? userToSave as User : u));
              } else {
                  setUsers(prev => [...prev, userToSave as User]);
              }
              setIsModalOpen(false);
          } else {
              alert('Erro ao salvar colaborador no banco de dados.');
          }
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
          const result = await deleteUser(id);
          if (result.success) {
              setUsers(users.filter(u => u.id !== id));
          } else {
              alert('Erro ao excluir colaborador do banco de dados.');
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
          
          const result = await saveSquad(squadToSave);
          if (result.success) {
              if (editingSquad.id) {
                  setSquads(prev => prev.map(s => s.id === editingSquad.id ? squadToSave as Squad : s));
              } else {
                  setSquads(prev => [...prev, squadToSave as Squad]);
              }
              setIsSquadModalOpen(false);
          } else {
              alert('Erro ao salvar squad no banco de dados.');
          }
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
              const result = await deleteSquad(id);
              if (result.success) {
                  setSquads(prev => prev.filter(s => s.id !== id));
                  // Opcional: Limpar referências locais de usuários se necessário, 
                  // mas o App recarregará os dados ou o usuário verá a mudança ao editar.
              } else {
                  alert('Erro ao excluir squad do banco de dados.');
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
          <button onClick={() => { setEditingUser(INITIAL_USER_STATE); setIsModalOpen(true) }} className="bg-pink-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"><Plus size={18}/> Novo Colaborador</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl border shadow-sm">
              <div className="p-4 border-b bg-slate-50 font-bold">Colaboradores</div>
              <div className="divide-y max-h-[500px] overflow-y-auto custom-scrollbar">
                  {users.map(user => (
                      <div key={user.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                          <div className="flex items-center gap-3">
                              <div className="relative">
                                  <img src={user.avatar} className="w-10 h-10 rounded-full border shadow-sm" />
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
                      </div>
                  ))}
              </div>
          </div>

          <div className="bg-white rounded-xl border shadow-sm p-4">
              <div className="flex justify-between mb-6 items-center"><h3 className="font-bold">Squads</h3><button onClick={()=>{setEditingSquad({name:'',members:[]});setIsSquadModalOpen(true)}} className="text-xs text-pink-600 font-bold">+ Criar Squad</button></div>
              <div className="space-y-4">
                  {squads.map(s => (
                      <div key={s.id} className="p-4 border rounded-xl bg-slate-50/50 flex justify-between items-center group">
                          <span className="font-bold">{s.name}</span>
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
                      </div>
                  ))}
              </div>
          </div>
      </div>

      {isModalOpen && (
          <Modal 
              isOpen={isModalOpen} 
              onClose={() => setIsModalOpen(false)}
              title={editingUser.id ? "Editar Colaborador" : "Novo Colaborador"}
              maxWidth="600px"
          >
              <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-400 uppercase">Nome Completo</label>
                          <div className="relative">
                              <UserIcon className="absolute left-3 top-3 text-slate-400" size={18}/>
                              <input className="w-full border p-3 pl-10 rounded-lg outline-none focus:ring-2 focus:ring-pink-100 focus:border-pink-500 transition-all" placeholder="Ex: João Silva" value={editingUser.name || ''} onChange={e => setEditingUser({...editingUser, name:e.target.value})}/>
                          </div>
                      </div>
                      <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-400 uppercase">E-mail</label>
                          <div className="relative">
                              <Mail className="absolute left-3 top-3 text-slate-400" size={18}/>
                              <input className="w-full border p-3 pl-10 rounded-lg outline-none focus:ring-2 focus:ring-pink-100 focus:border-pink-500 transition-all" placeholder="Ex: joao@empresa.com" value={editingUser.email || ''} onChange={e => setEditingUser({...editingUser, email:e.target.value})}/>
                          </div>
                      </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-400 uppercase">Nível de Hierarquia (Cargo)</label>
                          <div className="relative">
                              <Shield className="absolute left-3 top-3 text-slate-400" size={18}/>
                              <select 
                                className="w-full border p-3 pl-10 rounded-lg outline-none focus:ring-2 focus:ring-pink-100 focus:border-pink-500 transition-all appearance-none bg-white"
                                value={editingUser.role || 'EMPLOYEE'}
                                onChange={e => setEditingUser({...editingUser, role: e.target.value as Role})}
                              >
                                  {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                              </select>
                          </div>
                      </div>
                      <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-400 uppercase">Acesso ao Sistema</label>
                          <div className="flex items-center gap-3 p-3 border rounded-lg h-[50px]">
                              <input 
                                type="checkbox" 
                                id="hasAccess"
                                className="w-5 h-5 accent-pink-600 cursor-pointer"
                                checked={!!editingUser.hasSystemAccess}
                                onChange={e => setEditingUser({...editingUser, hasSystemAccess: e.target.checked})}
                              />
                              <label htmlFor="hasAccess" className="text-sm font-medium text-slate-700 cursor-pointer">Habilitar Login</label>
                          </div>
                      </div>
                  </div>

                  {editingUser.hasSystemAccess && (
                      <div className="space-y-1 animate-fade-in">
                          <label className="text-xs font-bold text-slate-400 uppercase">Senha de Acesso</label>
                          <div className="relative">
                              <Lock className="absolute left-3 top-3 text-slate-400" size={18}/>
                              <input 
                                type={showPassword ? "text" : "password"}
                                className="w-full border p-3 pl-10 pr-10 rounded-lg outline-none focus:ring-2 focus:ring-pink-100 focus:border-pink-500 transition-all" 
                                placeholder="Defina uma senha" 
                                value={editingUser.password || ''} 
                                onChange={e => setEditingUser({...editingUser, password: e.target.value})}
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
              </div>
          </Modal>
      )}

      {isSquadModalOpen && (
          <Modal 
              isOpen={isSquadModalOpen} 
              onClose={() => setIsSquadModalOpen(false)}
              title="Configurar Squad"
              maxWidth="512px"
          >
              <div className="space-y-6">
                  <input className="w-full border p-3 rounded-lg" placeholder="Nome da Squad" value={editingSquad.name || ''} onChange={e => setEditingSquad({...editingSquad, name:e.target.value})}/>
                  <div>
                      <label className="text-xs font-bold text-slate-400 uppercase">Membros</label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                          {users.filter(u=>u.role!=='CLIENT').map(u => (
                              <button key={u.id} onClick={()=>toggleSquadMember(u.id)} className={`p-2 border rounded-lg text-xs font-bold text-left transition-all ${editingSquad.members?.includes(u.id) ? 'bg-pink-50 border-pink-500 text-pink-600' : 'bg-white text-slate-600'}`}>{u.name}</button>
                          ))}
                      </div>
                  </div>
                  <button onClick={handleSaveSquad} className="w-full bg-slate-900 text-white py-3 rounded-lg font-bold">Salvar Squad</button>
              </div>
          </Modal>
      )}
    </div>
  );
};
