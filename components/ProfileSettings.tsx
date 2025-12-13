
import React, { useState, useRef } from 'react';
import { User, UserPreferences } from '../types';
import { User as UserIcon, Lock, Bell, Moon, Sun, CreditCard, Save, RefreshCw, Upload, Mail } from 'lucide-react';

interface ProfileSettingsProps {
  currentUser: User;
  onUpdateUser: (updatedUser: User) => void;
}

export const ProfileSettings: React.FC<ProfileSettingsProps> = ({ currentUser, onUpdateUser }) => {
  const [activeTab, setActiveTab] = useState<'GENERAL' | 'SECURITY' | 'PREFERENCES' | 'FINANCIAL'>('GENERAL');
  
  // Local state for editing
  const [formData, setFormData] = useState(currentUser);
  
  // Security States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  
  const [successMsg, setSuccessMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    // Basic validation
    if (!formData.name || !formData.email) return;

    // Password Update Logic
    let updatedUser = { ...formData };
    
    if (newPassword) {
        // Validação da Senha Atual
        if (currentPassword !== currentUser.password) {
            setPasswordError('A senha atual está incorreta.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setPasswordError('As novas senhas não coincidem.');
            return;
        }
        if (newPassword.length < 3) {
            setPasswordError('A nova senha é muito curta.');
            return;
        }
        updatedUser.password = newPassword;
    }

    onUpdateUser(updatedUser);
    
    // Reset fields
    setNewPassword('');
    setConfirmPassword('');
    setCurrentPassword('');
    setPasswordError('');
    
    setSuccessMsg('Perfil atualizado com sucesso!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const togglePreference = (key: keyof UserPreferences) => {
      const currentPrefs = formData.preferences || {
          theme: 'light',
          emailNotifications: true,
          systemNotifications: true,
          compactMode: false
      };
      
      const newVal = key === 'theme' 
        ? (currentPrefs.theme === 'light' ? 'dark' : 'light') 
        : !currentPrefs[key];

      const updatedUser = {
          ...formData,
          preferences: {
              ...currentPrefs,
              [key]: newVal
          }
      };

      setFormData(updatedUser);
      // Atualiza imediatamente
      onUpdateUser(updatedUser);
      
      // Feedback visual simples
      if (key !== 'theme') {
          setSuccessMsg('Preferência atualizada.');
          setTimeout(() => setSuccessMsg(''), 2000);
      }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              setFormData({ ...formData, avatar: reader.result as string });
          };
          reader.readAsDataURL(file);
      }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
       <div className="flex justify-between items-end mb-4">
           <div>
               <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Minha Conta</h2>
               <p className="text-slate-500 dark:text-slate-400">Gerencie suas informações pessoais e preferências.</p>
           </div>
           {successMsg && (
               <div className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-lg text-sm font-bold animate-pop flex items-center gap-2">
                   <Save size={16}/> {successMsg}
               </div>
           )}
       </div>

       <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col md:flex-row min-h-[500px]">
           {/* Sidebar */}
           <div className="w-full md:w-64 bg-slate-50 dark:bg-slate-900 border-r border-slate-100 dark:border-slate-700 p-4 space-y-2">
               <button 
                onClick={() => setActiveTab('GENERAL')}
                className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${activeTab === 'GENERAL' ? 'bg-white dark:bg-slate-800 shadow text-pink-600 font-bold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
               >
                   <UserIcon size={18}/> Perfil Geral
               </button>
               <button 
                onClick={() => setActiveTab('SECURITY')}
                className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${activeTab === 'SECURITY' ? 'bg-white dark:bg-slate-800 shadow text-pink-600 font-bold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
               >
                   <Lock size={18}/> Segurança
               </button>
               <button 
                onClick={() => setActiveTab('PREFERENCES')}
                className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${activeTab === 'PREFERENCES' ? 'bg-white dark:bg-slate-800 shadow text-pink-600 font-bold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
               >
                   <Bell size={18}/> Preferências
               </button>
               {currentUser.role !== 'CLIENT' && (
                <button 
                    onClick={() => setActiveTab('FINANCIAL')}
                    className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${activeTab === 'FINANCIAL' ? 'bg-white dark:bg-slate-800 shadow text-pink-600 font-bold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                    <CreditCard size={18}/> Dados Bancários
                </button>
               )}
           </div>

           {/* Content */}
           <div className="flex-1 p-8 overflow-y-auto">
               
               {activeTab === 'GENERAL' && (
                   <div className="space-y-6 animate-pop">
                       <div className="flex items-center gap-6 mb-8">
                           <div className="relative group">
                                <img src={formData.avatar} alt="Avatar" className="w-24 h-24 rounded-full border-4 border-slate-100 dark:border-slate-700 object-cover" />
                                
                                <div className="absolute -bottom-2 -right-2 flex gap-1">
                                    <button 
                                        onClick={() => fileInputRef.current?.click()}
                                        className="p-2 bg-pink-600 text-white rounded-full hover:bg-pink-700 shadow-md transition-transform hover:scale-105"
                                        title="Fazer upload de foto"
                                    >
                                        <Upload size={14}/>
                                    </button>
                                    <button 
                                        onClick={() => setFormData({...formData, avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${Date.now()}`})}
                                        className="p-2 bg-slate-600 text-white rounded-full hover:bg-slate-700 shadow-md transition-transform hover:scale-105"
                                        title="Gerar avatar aleatório"
                                    >
                                        <RefreshCw size={14}/>
                                    </button>
                                </div>
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    className="hidden" 
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                />
                           </div>
                           <div>
                               <h3 className="text-lg font-bold text-slate-800 dark:text-white">{formData.name}</h3>
                               <span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded text-xs font-bold">{formData.role}</span>
                           </div>
                       </div>

                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div>
                               <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Nome Completo</label>
                               <input 
                                    className="w-full border border-slate-200 dark:border-slate-600 rounded-lg p-2.5 text-sm focus:border-pink-500 outline-none bg-white dark:bg-slate-700 dark:text-white"
                                    value={formData.name}
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                               />
                           </div>
                           <div>
                               <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Email</label>
                               <input 
                                    className="w-full border border-slate-200 dark:border-slate-600 rounded-lg p-2.5 text-sm bg-slate-50 dark:bg-slate-600 text-slate-500 dark:text-slate-400 cursor-not-allowed"
                                    value={formData.email}
                                    disabled
                                    title="O email não pode ser alterado."
                               />
                           </div>
                           <div>
                               <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Squad Principal</label>
                               <input 
                                    className="w-full border border-slate-200 dark:border-slate-600 rounded-lg p-2.5 text-sm bg-slate-50 dark:bg-slate-600 text-slate-500 dark:text-slate-400"
                                    value={formData.squad || 'Sem Squad'}
                                    disabled
                               />
                           </div>
                       </div>
                   </div>
               )}

               {activeTab === 'SECURITY' && (
                   <div className="space-y-6 animate-pop max-w-md">
                       <div>
                           <h3 className="font-bold text-slate-800 dark:text-white mb-1">Alterar Senha</h3>
                           <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Para sua segurança, confirme a senha atual antes de alterar.</p>
                       </div>
                       
                       <div className="space-y-4">
                           <div>
                               <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Senha Atual <span className="text-red-500">*</span></label>
                               <input 
                                    type="password"
                                    className="w-full border border-slate-200 dark:border-slate-600 rounded-lg p-2.5 text-sm focus:border-pink-500 outline-none bg-white dark:bg-slate-700 dark:text-white"
                                    value={currentPassword}
                                    onChange={e => setCurrentPassword(e.target.value)}
                                    placeholder="Digite sua senha atual"
                               />
                           </div>
                           <div className="pt-2 border-t border-slate-100 dark:border-slate-700"></div>
                           <div>
                               <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Nova Senha</label>
                               <input 
                                    type="password"
                                    className="w-full border border-slate-200 dark:border-slate-600 rounded-lg p-2.5 text-sm focus:border-pink-500 outline-none bg-white dark:bg-slate-700 dark:text-white"
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    placeholder="Mínimo 3 caracteres"
                                    disabled={!currentPassword}
                               />
                           </div>
                           <div>
                               <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Confirmar Nova Senha</label>
                               <input 
                                    type="password"
                                    className="w-full border border-slate-200 dark:border-slate-600 rounded-lg p-2.5 text-sm focus:border-pink-500 outline-none bg-white dark:bg-slate-700 dark:text-white"
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    placeholder="Repita a nova senha"
                                    disabled={!newPassword}
                               />
                           </div>
                           {passwordError && (
                               <p className="text-xs text-red-500 font-bold bg-red-50 dark:bg-red-900/20 p-2 rounded">{passwordError}</p>
                           )}
                       </div>
                   </div>
               )}

               {activeTab === 'PREFERENCES' && (
                   <div className="space-y-6 animate-pop">
                       <div>
                           <h3 className="font-bold text-slate-800 dark:text-white mb-1">Configurações do Sistema</h3>
                           <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Personalize sua experiência de uso.</p>
                       </div>

                       <div className="space-y-4">
                           <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                               <div className="flex items-center gap-3">
                                   <div className="p-2 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-lg">
                                       <Mail size={20}/>
                                   </div>
                                   <div>
                                       <p className="font-bold text-sm text-slate-800 dark:text-white">Notificações por Email</p>
                                       <p className="text-xs text-slate-500 dark:text-slate-400">Receber atualizações importantes.</p>
                                   </div>
                               </div>
                               <div 
                                    onClick={() => togglePreference('emailNotifications')}
                                    className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${formData.preferences?.emailNotifications ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                               >
                                   <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${formData.preferences?.emailNotifications ? 'translate-x-6' : 'translate-x-0'}`}></div>
                               </div>
                           </div>

                           <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                               <div className="flex items-center gap-3">
                                   <div className="p-2 bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300 rounded-lg">
                                       {formData.preferences?.theme === 'dark' ? <Moon size={20}/> : <Sun size={20}/>}
                                   </div>
                                   <div>
                                       <p className="font-bold text-sm text-slate-800 dark:text-white">Tema do Sistema</p>
                                       <p className="text-xs text-slate-500 dark:text-slate-400">Alternar entre modo claro e escuro.</p>
                                   </div>
                               </div>
                               <div 
                                    onClick={() => togglePreference('theme')}
                                    className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${formData.preferences?.theme === 'dark' ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'}`}
                               >
                                   <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${formData.preferences?.theme === 'dark' ? 'translate-x-6' : 'translate-x-0'}`}></div>
                               </div>
                           </div>
                       </div>
                   </div>
               )}

                {activeTab === 'FINANCIAL' && (
                   <div className="space-y-6 animate-pop max-w-lg">
                       <div>
                           <h3 className="font-bold text-slate-800 dark:text-white mb-1">Dados de Pagamento</h3>
                           <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Informações para processamento de folha e reembolsos.</p>
                       </div>
                       
                       <div>
                           <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Chave PIX ou Dados Bancários</label>
                           <textarea 
                                className="w-full border border-slate-200 dark:border-slate-600 rounded-lg p-2.5 text-sm focus:border-pink-500 outline-none h-32 resize-none bg-white dark:bg-slate-700 dark:text-white"
                                value={formData.bankDetails || ''}
                                onChange={e => setFormData({...formData, bankDetails: e.target.value})}
                                placeholder={'Banco: X\nAgência: Y\nConta: Z\nPIX: ...'}
                           />
                       </div>

                       <div className="grid grid-cols-2 gap-4">
                           <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Salário Base</label>
                                <input 
                                    className="w-full border border-slate-200 dark:border-slate-600 rounded-lg p-2.5 text-sm bg-slate-50 dark:bg-slate-600 text-slate-500 dark:text-slate-400"
                                    value={`R$ ${formData.salary?.toLocaleString() || '0,00'}`}
                                    disabled
                                />
                           </div>
                           <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Valor Hora</label>
                                <input 
                                    className="w-full border border-slate-200 dark:border-slate-600 rounded-lg p-2.5 text-sm bg-slate-50 dark:bg-slate-600 text-slate-500 dark:text-slate-400"
                                    value={`R$ ${formData.hourlyRate?.toLocaleString() || '0,00'}`}
                                    disabled
                                />
                           </div>
                       </div>
                   </div>
               )}

           </div>
       </div>
       
       <div className="flex justify-end pt-4">
           <button 
            onClick={handleSave}
            className="bg-pink-600 hover:bg-pink-700 text-white px-8 py-3 rounded-lg font-bold shadow-lg shadow-pink-500/20 transition-all flex items-center gap-2"
           >
               <Save size={20}/> Salvar Alterações
           </button>
       </div>
    </div>
  );
};
