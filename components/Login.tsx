
import React, { useState } from 'react';
import { User, SystemSettings } from '../types';
import { Mail, ArrowLeft, Lock, HelpCircle, Shield, CheckCircle2, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { mapUser } from '../services/supabaseService';
import { initialUsers } from '../utils/mockData';

interface LoginProps {
  onLogin: (user: User) => void;
  users: User[];
  systemSettings: SystemSettings;
  onNavigate?: (view: string) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin, users, systemSettings, onNavigate }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Reset Password State
  const [isResetting, setIsResetting] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [tempPassword, setTempPassword] = useState(''); // Estado para simular email

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. Tenta buscar o usuário no Supabase (Tabela users)
      const { data: foundUser, error: supabaseError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email.toLowerCase())
        .single();

      if (supabaseError || !foundUser) {
        // 1.1 Tenta buscar nos acessos de sistema dos clientes (Tabela clients)
        const { data: clientsWithAccess } = await supabase
          .from('clients')
          .select('id, name, system_accesses')
          .not('system_accesses', 'is', null);
        
        if (clientsWithAccess) {
          for (const client of clientsWithAccess) {
            const accesses = client.system_accesses as any[];
            const access = accesses?.find(a => a.email?.toLowerCase() === email.toLowerCase());
            
            if (access) {
              if (password !== access.password) {
                setError('Senha incorreta.');
                setLoading(false);
                return;
              }
              
              const clientUser: User = {
                id: access.id || `client-${client.id}`,
                name: access.label || client.name,
                email: access.email,
                role: 'CLIENT',
                avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(access.label || client.name)}&backgroundColor=db2777`,
                clientId: client.id,
                hasSystemAccess: true,
                password: access.password,
                preferences: { theme: 'light', emailNotifications: true, systemNotifications: true, compactMode: false }
              };
              
              onLogin(clientUser);
              return;
            }
          }
        }

        // Fallback para mock data
        const mockUser = initialUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (mockUser) {
          if (password !== mockUser.password) {
            setError('Senha incorreta.');
            setLoading(false);
            return;
          }
          if (!mockUser.hasSystemAccess) {
            setError('Este usuário não tem permissão de acesso ao sistema.');
            setLoading(false);
            return;
          }
          onLogin(mockUser);
          return;
        }
        setError('Usuário não encontrado. Verifique o email.');
        setLoading(false);
        return;
      }

      // 2. Verifica a senha (no Supabase)
      if (password !== foundUser.password) {
        setError('Senha incorreta.');
        setLoading(false);
        return;
      }

      if (!foundUser.has_system_access) {
        setError('Este usuário não tem permissão de acesso ao sistema.');
        setLoading(false);
        return;
      }

      // Converte o formato do Supabase (snake_case) para o formato do App (camelCase)
      const mappedUser = mapUser(foundUser);

      onLogin(mappedUser);
    } catch (err) {
      console.error('Erro no login:', err);
      setError('Ocorreu um erro ao tentar entrar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if(!resetEmail) return;
      setLoading(true);
      setError('');

      try {
          // 1. Tenta encontrar na tabela 'users'
          const { data: user } = await supabase
              .from('users')
              .select('*')
              .eq('email', resetEmail.toLowerCase())
              .single();

          const newPass = Math.random().toString(36).slice(-8);

          if (user) {
              const { error: updateError } = await supabase
                  .from('users')
                  .update({ password: newPass })
                  .eq('id', user.id);
              
              if (updateError) throw updateError;
              
              setTempPassword(newPass);
              setResetSuccess(true);
          } else {
              // 2. Tenta encontrar nos acessos de clientes
              const { data: clients } = await supabase
                  .from('clients')
                  .select('id, system_accesses')
                  .not('system_accesses', 'is', null);
              
              let found = false;
              if (clients) {
                  for (const client of clients) {
                      const accesses = [...(client.system_accesses as any[] || [])];
                      const accessIdx = accesses.findIndex(a => a.email?.toLowerCase() === resetEmail.toLowerCase());
                      
                      if (accessIdx !== -1) {
                          accesses[accessIdx].password = newPass;
                          const { error: updateError } = await supabase
                              .from('clients')
                              .update({ system_accesses: accesses })
                              .eq('id', client.id);
                          
                          if (updateError) throw updateError;
                          
                          setTempPassword(newPass);
                          setResetSuccess(true);
                          found = true;
                          break;
                      }
                  }
              }

              if (!found) {
                  setError('Email não encontrado na base de dados.');
              }
          }
      } catch (err) {
          console.error('Erro ao resetar senha:', err);
          setError('Ocorreu um erro ao processar sua solicitação.');
      } finally {
          setLoading(false);
      }
  };

  const testUsers = [
      { email: 'eric.muriel@gmail.com', pass: '123', label: 'Admin' },
      { email: 'financeiro@chandigital.com.br', pass: '123', label: 'Financeiro' },
      { email: 'joao@techstart.io', pass: '123', label: 'Cliente' }
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4 relative overflow-hidden">
      
      {/* Background Decoration */}
      <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-slate-200 to-transparent -z-10"></div>
      
      <div className="bg-white p-8 md:p-10 rounded-[40px] shadow-2xl w-full max-w-md border border-white/50 backdrop-blur-xl animate-pop relative z-10">
        
        {/* Logo Section */}
        <div className="flex justify-center mb-8">
           {systemSettings.logo ? (
               <img src={systemSettings.logo} alt="Logo" className="h-20 object-contain drop-shadow-sm" />
           ) : (
               <div 
                    className="w-20 h-20 rounded-3xl flex items-center justify-center text-white text-4xl font-black shadow-lg transform rotate-3"
                    style={{ backgroundColor: systemSettings.primaryColor }}
               >
                   {systemSettings.agencyName.charAt(0)}
               </div>
           )}
        </div>

        {/* --- LOGIN FORM --- */}
        {!isResetting ? (
            <>
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-black text-slate-800 tracking-tighter">{systemSettings.agencyName}</h2>
                    <p className="text-slate-400 mt-2 text-sm font-medium uppercase tracking-widest text-[10px]">Acesso ao Sistema</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Email Corporativo</label>
                    <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18}/>
                        <input 
                          type="email" 
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-slate-50 outline-none transition-all focus:border-pink-200 bg-slate-50 focus:bg-white text-sm font-bold"
                          placeholder="seu@email.com"
                        />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Senha</label>
                    <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18}/>
                        <input 
                          type="password" 
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-slate-50 outline-none transition-all focus:border-pink-200 bg-slate-50 focus:bg-white text-sm font-bold"
                          placeholder="••••••••"
                        />
                    </div>
                    <div className="flex justify-end mt-2">
                        <button 
                            type="button"
                            onClick={() => { setIsResetting(true); setError(''); }}
                            className="text-[10px] font-black text-slate-400 hover:text-pink-600 uppercase tracking-widest transition-colors"
                        >
                            Esqueceu a senha?
                        </button>
                    </div>
                  </div>

                  {error && (
                    <div className="p-4 bg-red-50 text-red-600 text-xs font-bold rounded-2xl border border-red-100 flex items-center gap-3 animate-pop">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      {error}
                    </div>
                  )}

                  <button 
                    type="submit"
                    disabled={loading}
                    className="w-full text-white font-black py-4 rounded-2xl transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 active:scale-95 text-xs tracking-[0.2em] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed uppercase"
                    style={{ backgroundColor: systemSettings.primaryColor }}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin" size={18} />
                        Autenticando...
                      </>
                    ) : (
                      'Entrar no Sistema'
                    )}
                  </button>
                </form>

                <div className="mt-8 pt-8 border-t border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center mb-4">Contas de Teste</p>
                    <div className="grid grid-cols-3 gap-2">
                        {testUsers.map(u => (
                            <button 
                                key={u.email}
                                onClick={() => { setEmail(u.email); setPassword(u.pass); }}
                                className="px-2 py-2 bg-slate-50 hover:bg-pink-50 text-slate-500 hover:text-pink-600 rounded-xl text-[9px] font-black uppercase tracking-tighter transition-all border border-transparent hover:border-pink-100"
                            >
                                {u.label}
                            </button>
                        ))}
                    </div>
                </div>
            </>
        ) : (
            /* --- RESET PASSWORD FORM --- */
            <div className="animate-pop">
                <button 
                    onClick={() => { setIsResetting(false); setError(''); setResetSuccess(false); }}
                    className="flex items-center gap-2 text-slate-400 hover:text-slate-600 text-[10px] font-black uppercase tracking-widest mb-8 transition-colors"
                >
                    <ArrowLeft size={16}/> Voltar para Login
                </button>
                
                {!resetSuccess ? (
                    <>
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-pink-50 text-pink-600 rounded-[24px] flex items-center justify-center mx-auto mb-4 shadow-lg shadow-pink-100">
                                <Lock size={28}/>
                            </div>
                            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Recuperar Senha</h2>
                            <p className="text-slate-400 mt-2 text-sm font-medium">Informe seu email para gerar uma nova senha.</p>
                        </div>

                        <form onSubmit={handleResetSubmit} className="space-y-5">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Email Cadastrado</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18}/>
                                    <input 
                                      type="email" 
                                      required
                                      value={resetEmail}
                                      onChange={(e) => setResetEmail(e.target.value)}
                                      className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-slate-50 outline-none transition-all focus:border-pink-200 bg-slate-50 focus:bg-white text-sm font-bold"
                                      placeholder="seu@email.com"
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="p-4 bg-red-50 text-red-600 text-xs font-bold rounded-2xl border border-red-100 flex items-center gap-3">
                                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                                  {error}
                                </div>
                            )}

                            <button 
                                type="submit"
                                disabled={loading}
                                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-4 rounded-2xl transition-all shadow-xl text-xs tracking-[0.2em] uppercase flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 className="animate-spin" size={18}/> : 'Gerar Nova Senha'}
                            </button>
                        </form>
                    </>
                ) : (
                    /* --- RESET SUCCESS (SIMULAÇÃO DE EMAIL) --- */
                    <div className="text-center py-4 animate-pop">
                        <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-[32px] flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-100">
                            <CheckCircle2 size={40}/>
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">Sucesso!</h3>
                        <p className="text-slate-400 text-sm font-medium mb-8">
                            Sua senha foi redefinida no banco de dados.
                        </p>
                        
                        <div className="bg-slate-50 border-2 border-slate-100 p-6 rounded-[32px] text-left mb-8 mx-auto max-w-xs relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1.5 bg-emerald-500"></div>
                            <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest mb-3">Nova Senha Gerada</p>
                            <p className="text-xs text-slate-600 font-bold mb-4">Use a senha abaixo para acessar sua conta agora:</p>
                            <p className="text-2xl font-mono font-black text-slate-800 tracking-widest bg-white p-4 text-center rounded-2xl border-2 border-slate-100 select-all shadow-sm">{tempPassword}</p>
                            <p className="text-[9px] text-slate-400 mt-4 font-bold uppercase text-center">* Senha já atualizada no sistema.</p>
                        </div>

                        <button 
                            onClick={() => { setIsResetting(false); setResetSuccess(false); setResetEmail(''); setPassword(''); }}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 px-8 rounded-2xl transition-all shadow-lg text-xs tracking-[0.2em] uppercase"
                        >
                            Ir para Login
                        </button>
                    </div>
                )}
            </div>
        )}
      </div>

      {/* Footer Links */}
      <div className="mt-10 flex gap-8 text-[10px] font-black uppercase tracking-widest text-slate-400 relative z-10">
          <button onClick={() => onNavigate && onNavigate('privacy')} className="hover:text-pink-600 transition-colors flex items-center gap-2">
              <Shield size={14}/> Privacidade
          </button>
          <div className="w-1 h-1 bg-slate-300 rounded-full my-auto"></div>
          <button onClick={() => onNavigate && onNavigate('help')} className="hover:text-pink-600 transition-colors flex items-center gap-2">
              <HelpCircle size={14}/> Ajuda
          </button>
      </div>

      <p className="mt-6 text-[9px] font-black text-slate-300 relative z-10 uppercase tracking-[0.3em]">
          &copy; {new Date().getFullYear()} {systemSettings.agencyName} OS &bull; v1.2.0
      </p>
    </div>
  );
};
