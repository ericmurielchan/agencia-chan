
import React, { useState } from 'react';
import { User, SystemSettings } from '../types';
import { Mail, ArrowLeft, Lock, HelpCircle, Shield, CheckCircle2, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

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
      // 1. Tenta buscar o usuário no Supabase
      const { data: foundUser, error: supabaseError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email.toLowerCase())
        .single();

      if (supabaseError || !foundUser) {
        // Fallback para mock data se o Supabase falhar ou não encontrar (útil para desenvolvimento)
        const mockUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
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
      const mappedUser: User = {
        id: foundUser.id,
        name: foundUser.name,
        email: foundUser.email,
        role: foundUser.role,
        avatar: foundUser.avatar,
        squad: foundUser.squad_id,
        clientId: foundUser.client_id,
        hourlyRate: foundUser.hourly_rate,
        salary: foundUser.salary,
        hasSystemAccess: foundUser.has_system_access,
        preferences: foundUser.preferences
      };

      onLogin(mappedUser);
    } catch (err) {
      console.error('Erro no login:', err);
      setError('Ocorreu um erro ao tentar entrar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if(!resetEmail) return;

      const user = users.find(u => u.email.toLowerCase() === resetEmail.toLowerCase());
      
      // Simulando delay de rede do serviço de email
      setTimeout(() => {
          if (user) {
              // GERA UMA SENHA TEMPORÁRIA E ATUALIZA O OBJETO NA MEMÓRIA
              // Nota: Em um backend real (Node/PHP), isso enviaria um email via SMTP.
              // Como estamos rodando client-side na Hostinger sem backend, atualizamos o objeto localmente
              // e mostramos a senha na tela como se fosse o "email recebido".
              const newPass = Math.random().toString(36).slice(-8);
              user.password = newPass; // Atualiza a senha do usuário em memória para login
              setTempPassword(newPass);
              setResetSuccess(true);
          } else {
              setError('Email não encontrado na base de dados.');
          }
      }, 800);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4 relative overflow-hidden">
      
      {/* Background Decoration */}
      <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-slate-200 to-transparent -z-10"></div>
      
      <div className="bg-white p-8 md:p-10 rounded-3xl shadow-2xl w-full max-w-md border border-white/50 backdrop-blur-xl animate-pop relative z-10">
        
        {/* Logo Section */}
        <div className="flex justify-center mb-8">
           {systemSettings.logo ? (
               <img src={systemSettings.logo} alt="Logo" className="h-20 object-contain drop-shadow-sm" />
           ) : (
               <div 
                    className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-4xl font-bold shadow-lg transform rotate-3"
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
                    <h2 className="text-3xl font-extrabold text-slate-800">{systemSettings.agencyName}</h2>
                    <p className="text-slate-500 mt-2 text-sm">Bem-vindo de volta! Acesse sua conta.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Email Corporativo</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                        <input 
                          type="email" 
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 outline-none transition-all focus:ring-2 focus:ring-opacity-50 focus:border-transparent bg-slate-50 focus:bg-white"
                          style={{ '--tw-ring-color': systemSettings.primaryColor } as React.CSSProperties}
                          placeholder="seu@email.com"
                        />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Senha</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                        <input 
                          type="password" 
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 outline-none transition-all focus:ring-2 focus:ring-opacity-50 focus:border-transparent bg-slate-50 focus:bg-white"
                          style={{ '--tw-ring-color': systemSettings.primaryColor } as React.CSSProperties}
                          placeholder="••••••••"
                        />
                    </div>
                    <div className="flex justify-end mt-2">
                        <button 
                            type="button"
                            onClick={() => { setIsResetting(true); setError(''); }}
                            className="text-xs font-medium text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            Esqueceu a senha?
                        </button>
                    </div>
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex items-center gap-2 animate-pop">
                      <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                      {error}
                    </div>
                  )}

                  {/* FIX: Remove invalid CSS property 'shadowColor' */}
                  <button 
                    type="submit"
                    disabled={loading}
                    className="w-full text-white font-bold py-3.5 rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 text-sm tracking-wide flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    style={{ backgroundColor: systemSettings.primaryColor }}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin" size={18} />
                        AUTENTICANDO...
                      </>
                    ) : (
                      'ENTRAR NO SISTEMA'
                    )}
                  </button>
                </form>
            </>
        ) : (
            /* --- RESET PASSWORD FORM --- */
            <div className="animate-pop">
                {!resetSuccess ? (
                    <>
                        <button 
                            onClick={() => { setIsResetting(false); setError(''); }}
                            className="flex items-center gap-1 text-slate-400 hover:text-slate-600 text-sm mb-6 transition-colors"
                        >
                            <ArrowLeft size={16}/> Voltar para Login
                        </button>
                        
                        <div className="text-center mb-6">
                            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Lock size={24}/>
                            </div>
                            <h2 className="text-2xl font-bold text-slate-800">Recuperar Senha</h2>
                            <p className="text-slate-500 mt-2 text-sm px-4">Informe seu email para gerar uma nova senha de acesso.</p>
                        </div>

                        <form onSubmit={handleResetSubmit} className="space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Email Cadastrado</label>
                                <input 
                                  type="email" 
                                  required
                                  value={resetEmail}
                                  onChange={(e) => setResetEmail(e.target.value)}
                                  className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none transition-all focus:ring-2 focus:ring-opacity-50 focus:border-transparent bg-slate-50 focus:bg-white"
                                  style={{ '--tw-ring-color': systemSettings.primaryColor } as React.CSSProperties}
                                  placeholder="seu@email.com"
                                />
                            </div>

                            {error && (
                                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                                  {error}
                                </div>
                            )}

                            <button 
                                type="submit"
                                className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg text-sm tracking-wide"
                            >
                                GERAR NOVA SENHA
                            </button>
                        </form>
                    </>
                ) : (
                    /* --- RESET SUCCESS (SIMULAÇÃO DE EMAIL) --- */
                    <div className="text-center py-8 animate-pop">
                        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 size={32}/>
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Sucesso!</h3>
                        <p className="text-slate-500 text-sm mb-4">
                            Sua senha foi redefinida com sucesso.
                        </p>
                        
                        {/* Simulação Visual do Email para funcionar sem Backend */}
                        <div className="bg-slate-100 border border-slate-200 p-4 rounded-lg text-left mb-6 mx-auto max-w-xs relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>
                            <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Cópia do Email (Sistema Demo)</p>
                            <p className="text-sm text-slate-600">Olá! Sua nova senha temporária é:</p>
                            <p className="text-xl font-mono font-bold text-slate-800 my-2 tracking-wider bg-white p-2 text-center rounded border border-slate-200 select-all">{tempPassword}</p>
                            <p className="text-[10px] text-slate-400 mt-2">* Em produção, isso chegaria na sua caixa de entrada.</p>
                        </div>

                        <button 
                            onClick={() => { setIsResetting(false); setResetSuccess(false); setResetEmail(''); setPassword(''); }}
                            className="text-emerald-600 font-bold hover:underline text-sm"
                        >
                            Ir para Login
                        </button>
                    </div>
                )}
            </div>
        )}
      </div>

      {/* Footer Links */}
      <div className="mt-8 flex gap-6 text-xs font-medium text-slate-400 relative z-10">
          <button onClick={() => onNavigate && onNavigate('privacy')} className="hover:text-slate-600 transition-colors flex items-center gap-1.5">
              <Shield size={12}/> Políticas de Privacidade
          </button>
          <div className="w-px h-3 bg-slate-300 my-auto"></div>
          <button onClick={() => onNavigate && onNavigate('help')} className="hover:text-slate-600 transition-colors flex items-center gap-1.5">
              <HelpCircle size={12}/> Central de Ajuda
          </button>
      </div>

      <p className="mt-4 text-[10px] text-slate-300 relative z-10">
          &copy; {new Date().getFullYear()} {systemSettings.agencyName} OS. v1.0.0
      </p>
    </div>
  );
};
