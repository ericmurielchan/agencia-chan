
import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { User, Squad, ConfirmOptions } from '../types';
import { Plus, Trash2, Edit2, Shield, User as UserIcon, FileText, Lock, Key, X, CheckCircle, Users } from 'lucide-react';

interface TeamManagementProps {
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  squads: Squad[];
  setSquads: React.Dispatch<React.SetStateAction<Squad[]>>;
  openConfirm: (options: ConfirmOptions) => Promise<boolean>;
}

export const TeamManagement: React.FC<TeamManagementProps> = ({ users, setUsers, squads, setSquads, openConfirm }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Partial<User>>({ role: 'EMPLOYEE', avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=NewUser', hasSystemAccess: false });

  const [isSquadModalOpen, setIsSquadModalOpen] = useState(false);
  const [editingSquad, setEditingSquad] = useState<Partial<Squad>>({ name: '', members: [] });

  useEffect(() => {
    if(isModalOpen || isSquadModalOpen) {
        console.log("MODAL_OPEN", { screen: 'Equipes' });
    }
  }, [isModalOpen, isSquadModalOpen]);

  const handleSaveUser = () => {
      if (!editingUser.name || !editingUser.email) return;
      if (editingUser.id) setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, ...editingUser } as User : u));
      else setUsers(prev => [...prev, { ...editingUser, id: Date.now().toString() } as User]);
      setIsModalOpen(false);
  };

  const handleDeleteUser = async (id: string) => {
      const ok = await openConfirm({ title: "Excluir?", description: "Esta ação é permanente.", variant: "danger" });
      if (ok) setUsers(users.filter(u => u.id !== id));
  };

  const handleSaveSquad = () => {
      if (!editingSquad.name) return;
      if (editingSquad.id) setSquads(prev => prev.map(s => s.id === editingSquad.id ? { ...s, ...editingSquad } as Squad : s));
      else setSquads(prev => [...prev, { id: Date.now().toString(), name: editingSquad.name || '', members: editingSquad.members || [] }]);
      setIsSquadModalOpen(false);
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
          <button onClick={() => { setEditingUser({}); setIsModalOpen(true) }} className="bg-pink-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"><Plus size={18}/> Novo Colaborador</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl border shadow-sm">
              <div className="p-4 border-b bg-slate-50 font-bold">Colaboradores</div>
              <div className="divide-y max-h-[500px] overflow-y-auto custom-scrollbar">
                  {users.map(user => (
                      <div key={user.id} className="p-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                              <img src={user.avatar} className="w-10 h-10 rounded-full border" />
                              <span className="font-bold text-sm">{user.name}</span>
                          </div>
                          <div className="flex gap-2">
                              <button onClick={()=> {setEditingUser(user); setIsModalOpen(true)}} className="text-blue-500"><Edit2 size={16}/></button>
                              <button onClick={()=>handleDeleteUser(user.id)} className="text-red-500"><Trash2 size={16}/></button>
                          </div>
                      </div>
                  ))}
              </div>
          </div>

          <div className="bg-white rounded-xl border shadow-sm p-4">
              <div className="flex justify-between mb-6 items-center"><h3 className="font-bold">Squads</h3><button onClick={()=>{setEditingSquad({name:'',members:[]});setIsSquadModalOpen(true)}} className="text-xs text-pink-600 font-bold">+ Criar Squad</button></div>
              <div className="space-y-4">
                  {squads.map(s => (
                      <div key={s.id} className="p-4 border rounded-xl bg-slate-50/50 flex justify-between items-center">
                          <span className="font-bold">{s.name}</span>
                          <button onClick={()=>{setEditingSquad(s); setIsSquadModalOpen(true)}} className="text-blue-500"><Edit2 size={16}/></button>
                      </div>
                  ))}
              </div>
          </div>
      </div>

      {isModalOpen && (
          <Modal 
              isOpen={isModalOpen} 
              onClose={() => setIsModalOpen(false)}
              title="Colaborador"
              maxWidth="512px"
          >
              <div className="space-y-4">
                  <input className="w-full border p-3 rounded-lg" placeholder="Nome" value={editingUser.name || ''} onChange={e => setEditingUser({...editingUser, name:e.target.value})}/>
                  <input className="w-full border p-3 rounded-lg" placeholder="Email" value={editingUser.email || ''} onChange={e => setEditingUser({...editingUser, email:e.target.value})}/>
                  <button onClick={handleSaveUser} className="w-full bg-pink-600 text-white py-3 rounded-lg font-bold">Salvar</button>
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
