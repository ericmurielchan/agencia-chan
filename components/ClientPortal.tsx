
import React, { useState, useMemo } from 'react';
import { Task, TaskStatus, User, Client, Squad, Comment, Notification, Requisition } from '../types';
import { 
    CheckCircle, Clock, FileText, Plus, X, Video, Image, Megaphone, 
    Layout, ChevronRight, ChevronLeft, Calendar, Paperclip, MoreHorizontal, Hourglass, 
    MessageSquare, User as UserIcon, Mail, Phone, ExternalLink, Shield, MessageCircle, Send
} from 'lucide-react';

interface ClientPortalProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  currentUser: User;
  users: User[];
  clients: Client[];
  squads: Squad[];
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
  setRequisitions: React.Dispatch<React.SetStateAction<Requisition[]>>;
  onNavigate: (view: string) => void;
}

type RequestType = 'SOCIAL' | 'VIDEO' | 'WEB' | 'CAMPAIGN' | 'OTHER';

const REQUEST_TYPES = [
    { id: 'CAMPAIGN', label: 'Campanha', icon: Megaphone, desc: 'Lançamento, Promoção, Evento' },
    { id: 'SOCIAL', label: 'Social Media', icon: Image, desc: 'Posts, Stories, Carrossel' },
    { id: 'VIDEO', label: 'Vídeo/Motion', icon: Video, desc: 'Reels, YouTube, Edição' },
    { id: 'WEB', label: 'Web/LP', icon: Layout, desc: 'Landing Page, Site, Email' },
    { id: 'OTHER', label: 'Outros', icon: FileText, desc: 'Textos, Planejamento, etc' },
];

const FORMAT_OPTIONS = [
    { id: '1:1', label: 'Quadrado (1:1)', icon: <div className="w-4 h-4 border-2 border-current rounded-sm aspect-square"/> },
    { id: '9:16', label: 'Stories/Reels (9:16)', icon: <div className="w-3 h-5 border-2 border-current rounded-sm"/> },
    { id: '4:5', label: 'Feed Retrato (4:5)', icon: <div className="w-3 h-4 border-2 border-current rounded-sm"/> },
    { id: '16:9', label: 'YouTube (16:9)', icon: <div className="w-5 h-3 border-2 border-current rounded-sm"/> },
];

export const ClientPortal: React.FC<ClientPortalProps> = ({ tasks, setTasks, currentUser, users, clients, squads, setNotifications, setRequisitions, onNavigate }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [viewFilter, setViewFilter] = useState<'ACTIVE' | 'HISTORY'>('ACTIVE');

  // Contact Modal State
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [contactType, setContactType] = useState<'CALL' | 'MEETING' | null>(null);
  const [contactReason, setContactReason] = useState('');
  const [contactPreference, setContactPreference] = useState<'PHONE' | 'WHATSAPP'>('WHATSAPP');

  // Form State
  const [reqType, setReqType] = useState<RequestType | null>(null);
  const [reqTitle, setReqTitle] = useState('');
  const [reqDesc, setReqDesc] = useState('');
  const [reqDate, setReqDate] = useState('');
  const [reqFormat, setReqFormat] = useState('');

  // Identifica o Cliente e Squad
  const myClientProfile = clients.find(c => c.id === currentUser.clientId);
  const mySquad = myClientProfile ? squads.find(s => s.id === myClientProfile.squadId) : null;
  
  // Encontra o Gerente da Squad (Account Manager)
  const accountManager = mySquad 
    ? users.find(u => u.role === 'MANAGER' && mySquad.members.includes(u.id)) || users.find(u => u.role === 'ADMIN') // Fallback para Admin
    : null;

  // Filtragem de Segurança: Apenas tarefas onde o usuário atual está atribuído (como criador/interessado) E é um request de cliente
  const myTasks = tasks.filter(t => 
    t.clientRequest && t.assigneeIds.includes(currentUser.id)
  );
  
  const activeTasks = myTasks.filter(t => t.status !== 'DONE' && !t.archived).sort((a,b) => b.id.localeCompare(a.id));
  const historyTasks = myTasks.filter(t => t.status === 'DONE' || t.archived).sort((a,b) => b.id.localeCompare(a.id));
  
  const pendingCount = activeTasks.filter(t => t.approvalStatus === 'PENDING').length;
  const inProgressCount = activeTasks.filter(t => t.status === 'IN_PROGRESS' || t.status === 'TODO').length;
  const reviewCount = activeTasks.filter(t => t.status === 'REVIEW').length;

  // Atividades Recentes (Feed de comentários e status)
  const recentActivities = useMemo(() => {
      const activities: { id: string, type: 'COMMENT' | 'STATUS', text: string, time: number, user?: User, taskTitle: string }[] = [];
      
      myTasks.forEach(task => {
          // Add Comments
          task.comments.forEach(c => {
              const u = users.find(user => user.id === c.userId);
              // Só mostra comentários de OUTRAS pessoas (agência)
              if (c.userId !== currentUser.id) {
                  activities.push({
                      id: c.id,
                      type: 'COMMENT',
                      text: c.text,
                      time: c.timestamp,
                      user: u,
                      taskTitle: task.title
                  });
              }
          });
      });

      return activities.sort((a,b) => b.time - a.time).slice(0, 5);
  }, [myTasks, users, currentUser.id]);

  const calculateProgress = (status: TaskStatus, approvalStatus?: string) => {
    if (approvalStatus === 'PENDING') return 5;
    if (approvalStatus === 'REJECTED') return 0;
    
    switch (status) {
        case 'BACKLOG': return 15;
        case 'TODO': return 25;
        case 'IN_PROGRESS': return 50;
        case 'REVIEW': return 85;
        case 'DONE': return 100;
        default: return 0;
    }
  };

  const getStatusLabel = (status: TaskStatus, approvalStatus?: string) => {
      if (approvalStatus === 'PENDING') return { text: 'Em Análise', color: 'bg-orange-50 text-orange-600 border-orange-100' };
      if (approvalStatus === 'REJECTED') return { text: 'Reprovado', color: 'bg-red-50 text-red-600 border-red-100' };

      switch (status) {
          case 'BACKLOG': return { text: 'Na Fila', color: 'bg-slate-100 text-slate-600 border-slate-200' };
          case 'TODO': return { text: 'Agendado', color: 'bg-blue-50 text-blue-600 border-blue-100' };
          case 'IN_PROGRESS': return { text: 'Produção', color: 'bg-indigo-50 text-indigo-600 border-indigo-100' };
          case 'REVIEW': return { text: 'Aprovação', color: 'bg-purple-50 text-purple-600 border-purple-100' };
          case 'DONE': return { text: 'Entregue', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' };
          default: return { text: status, color: 'bg-gray-100' };
      }
  };

  // --- Handlers para Contato ---
  const handleOpenContact = (type: 'CALL' | 'MEETING') => {
      setContactType(type);
      setContactReason('');
      setContactPreference('WHATSAPP');
      setContactModalOpen(true);
  };

  const handleSubmitContact = () => {
      if (!contactReason.trim()) {
          alert("Por favor, descreva o motivo.");
          return;
      }

      if (!accountManager) {
          alert("Gerente de conta não encontrado. Contate o administrador.");
          return;
      }

      const isMeeting = contactType === 'MEETING';
      const typeLabel = isMeeting ? 'Solicitação de Reunião' : 'Solicitação de Contato';
      const prefLabel = !isMeeting ? (contactPreference === 'WHATSAPP' ? 'via WhatsApp' : 'via Telefone') : '';
      
      // 1. Criar Notificação para o Gerente
      const newNotification: Notification = {
          id: Date.now().toString(),
          title: typeLabel,
          message: `Cliente ${currentUser.name} solicita: ${contactReason}. ${prefLabel}`,
          type: 'INFO',
          read: false,
          timestamp: Date.now(),
          targetUserId: accountManager.id,
          navToView: 'requisitions' // Navega para a central de solicitações
      };
      setNotifications(prev => [newNotification, ...prev]);

      // 2. Criar Registro na Central de Solicitações (Requisitions)
      // Definimos custo 0 pois é um serviço de atendimento/meeting
      const newReq: Requisition = {
          id: Date.now().toString(),
          requesterId: currentUser.id,
          title: isMeeting ? 'Agendamento de Reunião' : `Contato ${prefLabel}`,
          description: `Motivo: ${contactReason}. \nCliente: ${currentUser.name}`,
          estimatedCost: 0,
          status: 'PENDING',
          date: new Date().toISOString().split('T')[0],
          category: isMeeting ? 'Reunião' : 'Atendimento'
      };
      setRequisitions(prev => [newReq, ...prev]);

      alert("Solicitação enviada! Acompanhe o status na sua central.");
      setContactModalOpen(false);
  };

  // --- Handlers para Wizard ---
  const handleOpenWizard = () => {
      setReqType(null);
      setReqTitle('');
      setReqDesc('');
      setReqDate('');
      setReqFormat('');
      setCurrentStep(1);
      setIsModalOpen(true);
  };

  const handleSubmit = () => {
      if (!reqTitle || !reqType) return;

      const typeLabel = REQUEST_TYPES.find(r => r.id === reqType)?.label;
      const formatString = reqFormat ? ` [${reqFormat}]` : '';
      
      const newTask: Task = {
          id: Date.now().toString(),
          title: reqTitle,
          description: `[${typeLabel}${formatString}] ${reqDesc}`,
          status: 'BACKLOG',
          priority: 'MEDIUM',
          dueDate: reqDate || new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().split('T')[0],
          estimatedTime: 0,
          timeLogs: [],
          isTracking: false,
          clientRequest: true,
          approvalStatus: 'PENDING', 
          squadId: myClientProfile?.squadId || currentUser.squad || 'squad-1', 
          assigneeIds: [currentUser.id], 
          checklists: [],
          comments: [],
          history: [{
              id: Date.now().toString(),
              action: 'Solicitação criada pelo cliente',
              userId: currentUser.id,
              timestamp: Date.now()
          }],
          cover: { type: 'COLOR', value: '#ec4899' }
      };

      setTasks(prev => [newTask, ...prev]);
      setIsModalOpen(false);
  };

  const handleNextStep = () => {
      if(currentStep === 1) {
          if (!reqType) return;
          setCurrentStep(2);
      } else if (currentStep === 2) {
          if (!reqTitle) return alert("Por favor, dê um título para a solicitação.");
          
          const isFormatRequired = reqType === 'SOCIAL' || reqType === 'VIDEO';
          if (isFormatRequired && !reqFormat) return alert("Por favor, selecione o formato da peça.");
          
          setCurrentStep(3);
      }
  };

  // --- Wizard Step Renderers ---

  const renderStep1 = () => (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 animate-pop">
          {REQUEST_TYPES.map(type => (
              <button 
                key={type.id}
                onClick={() => { setReqType(type.id as RequestType); setCurrentStep(2); }}
                className="flex flex-col items-center justify-center p-6 border-2 border-slate-100 rounded-xl hover:border-pink-500 hover:bg-pink-50 transition-all group"
              >
                  <div className="p-3 bg-white rounded-full shadow-sm mb-3 group-hover:scale-110 transition-transform text-pink-600">
                      <type.icon size={28} strokeWidth={1.5} />
                  </div>
                  <h4 className="font-bold text-slate-700">{type.label}</h4>
                  <p className="text-xs text-slate-400 text-center mt-1">{type.desc}</p>
              </button>
          ))}
      </div>
  );

  const renderStep2 = () => {
      const showFormats = reqType === 'SOCIAL' || reqType === 'VIDEO';
      
      return (
        <div className="space-y-4 animate-pop">
            <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">O que precisamos criar?</label>
                <input 
                    className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:border-pink-500 outline-none"
                    placeholder="Ex: Banner para Black Friday"
                    value={reqTitle}
                    onChange={e => setReqTitle(e.target.value)}
                    autoFocus
                />
            </div>
            
            {showFormats && (
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Formato da Peça <span className="text-red-500">*</span></label>
                    <div className="grid grid-cols-2 gap-2">
                        {FORMAT_OPTIONS.map(fmt => (
                            <button
                                key={fmt.id}
                                onClick={() => setReqFormat(fmt.id)}
                                className={`flex items-center gap-2 p-3 rounded-lg border transition-all text-left ${reqFormat === fmt.id ? 'bg-pink-50 border-pink-500 text-pink-700 ring-1 ring-pink-500' : 'bg-white border-slate-200 text-slate-600 hover:border-pink-300'}`}
                            >
                                <div className={reqFormat === fmt.id ? 'text-pink-600' : 'text-slate-400'}>{fmt.icon}</div>
                                <span className="text-xs font-bold">{fmt.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
            
            <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Prazo Desejado</label>
                <input 
                    type="date"
                    className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:border-pink-500 outline-none"
                    value={reqDate}
                    onChange={e => setReqDate(e.target.value)}
                />
                <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1"><InfoIcon size={10}/> Faremos o possível para atender, sujeito à análise da squad.</p>
            </div>

            <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Briefing / Detalhes</label>
                <textarea 
                    className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:border-pink-500 outline-none h-32 resize-none"
                    placeholder="Descreva o objetivo, público-alvo, referências e textos necessários..."
                    value={reqDesc}
                    onChange={e => setReqDesc(e.target.value)}
                />
            </div>

            <div className="border-2 border-dashed border-slate-200 rounded-lg p-4 flex flex-col items-center justify-center text-slate-400 bg-slate-50 cursor-not-allowed">
                <Paperclip size={24} className="mb-2 opacity-50"/>
                <span className="text-xs">Anexos indisponíveis na versão demo</span>
            </div>
        </div>
      );
  };

  const renderStep3 = () => (
      <div className="animate-pop text-center space-y-6 py-4">
          <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto text-pink-600">
              <CheckCircle size={32} />
          </div>
          <div>
              <h3 className="text-xl font-bold text-slate-800">Tudo pronto?</h3>
              <p className="text-slate-500 text-sm max-w-xs mx-auto mt-2">Sua solicitação será enviada para a triagem da Squad e você será notificado sobre o progresso.</p>
          </div>
          
          <div className="bg-slate-50 p-4 rounded-xl text-left border border-slate-100 max-w-sm mx-auto">
              <p className="text-xs text-slate-400 uppercase font-bold mb-1">Resumo</p>
              <p className="font-bold text-slate-800">{reqTitle}</p>
              <p className="text-sm text-slate-600 mt-1 line-clamp-2">{reqDesc}</p>
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-200">
                  <span className="text-xs bg-white border px-2 py-1 rounded font-bold text-pink-600">
                      {REQUEST_TYPES.find(r => r.id === reqType)?.label}
                  </span>
                  {reqFormat && (
                      <span className="text-xs bg-white border px-2 py-1 rounded font-bold text-slate-600">
                          {reqFormat}
                      </span>
                  )}
                  <span className="text-xs text-slate-500 flex items-center gap-1 ml-auto">
                      <Calendar size={12}/> {reqDate ? new Date(reqDate).toLocaleDateString() : 'A definir'}
                  </span>
              </div>
          </div>
      </div>
  );

  return (
    <div className="space-y-8 animate-pop">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
                <h1 className="text-3xl font-bold mb-2">Olá, {currentUser.name.split(' ')[0]}!</h1>
                <p className="text-slate-300">Este é seu hub exclusivo. Acompanhe o progresso de suas demandas.</p>
            </div>
            <button 
                onClick={handleOpenWizard}
                className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-pink-600/30 flex items-center gap-2 transform hover:scale-105 active:scale-95"
            >
                <Plus size={20} /> Nova Solicitação
            </button>
        </div>
        
        {/* Background Decoration */}
        <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-white/5 to-transparent skew-x-12"></div>
        <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-pink-600/20 rounded-full blur-3xl"></div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Em Análise</p>
                  <p className="text-2xl font-bold text-slate-800">{pendingCount}</p>
              </div>
              <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                  <FileText size={20} />
              </div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Em Produção</p>
                  <p className="text-2xl font-bold text-indigo-600">{inProgressCount}</p>
              </div>
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Clock size={20} />
              </div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Para Aprovação</p>
                  <p className="text-2xl font-bold text-purple-600">{reviewCount}</p>
              </div>
              <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
                  <CheckCircle size={20} />
              </div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Entregues</p>
                  <p className="text-2xl font-bold text-emerald-600">{historyTasks.length}</p>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
                  <CheckCircle size={20} />
              </div>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Task List (2/3) */}
          <div className="lg:col-span-2 space-y-6">
             <div className="flex items-center gap-4 border-b border-slate-200 pb-2">
                <button 
                    onClick={() => setViewFilter('ACTIVE')}
                    className={`text-sm font-bold pb-2 transition-colors ${viewFilter === 'ACTIVE' ? 'text-pink-600 border-b-2 border-pink-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Solicitações Ativas
                </button>
                <button 
                    onClick={() => setViewFilter('HISTORY')}
                    className={`text-sm font-bold pb-2 transition-colors ${viewFilter === 'HISTORY' ? 'text-pink-600 border-b-2 border-pink-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Histórico
                </button>
            </div>
            
            <div className="grid gap-4">
                {(viewFilter === 'ACTIVE' ? activeTasks : historyTasks).length === 0 && (
                    <div className="p-12 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        <Hourglass size={32} className="mx-auto mb-2 opacity-50"/>
                        <p>Nenhuma solicitação encontrada nesta aba.</p>
                    </div>
                )}
                
                {(viewFilter === 'ACTIVE' ? activeTasks : historyTasks).map(task => {
                    const progress = calculateProgress(task.status as TaskStatus, task.approvalStatus);
                    const statusInfo = getStatusLabel(task.status as TaskStatus, task.approvalStatus);
                    
                    return (
                        <div key={task.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
                            <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="text-lg font-bold text-slate-800">{task.title}</h3>
                                        {task.priority === 'HIGH' && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" title="Alta Prioridade"></span>}
                                    </div>
                                    <p className="text-slate-500 text-sm line-clamp-1">{task.description}</p>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${statusInfo.color}`}>
                                        {statusInfo.text}
                                    </span>
                                    {task.dueDate && (
                                        <span className="text-xs font-medium text-slate-500 flex items-center gap-1 bg-slate-100 px-2 py-1 rounded">
                                            <Calendar size={12}/> {new Date(task.dueDate).toLocaleDateString()}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Progress Bar Visual */}
                            <div className="relative pt-2">
                                <div className="flex mb-2 items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    <span>Progresso</span>
                                    <span>{progress}%</span>
                                </div>
                                <div className="overflow-hidden h-2.5 mb-2 text-xs flex rounded-full bg-slate-100">
                                    <div 
                                        style={{ width: `${progress}%` }} 
                                        className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-1000 ease-out ${
                                            task.approvalStatus === 'REJECTED' ? 'bg-red-500' :
                                            task.status === 'DONE' ? 'bg-emerald-500' : 'bg-pink-500'
                                        }`}
                                    ></div>
                                </div>
                                
                                {/* Stepper Visual for Progress */}
                                <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-medium">
                                    <span className={progress >= 5 ? 'text-pink-600' : ''}>Solicitado</span>
                                    <span className={progress >= 15 ? 'text-pink-600' : ''}>Aprovado</span>
                                    <span className={progress >= 50 ? 'text-pink-600' : ''}>Produção</span>
                                    <span className={progress >= 85 ? 'text-pink-600' : ''}>Revisão</span>
                                    <span className={progress >= 100 ? 'text-emerald-600' : ''}>Entregue</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
          </div>

          {/* Right Sidebar (1/3) */}
          <div className="space-y-6">
              
              {/* Account Manager Card */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                  <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <Shield size={18} className="text-pink-600"/> Meu Gerente de Conta
                  </h3>
                  
                  {accountManager ? (
                      <div className="flex flex-col items-center text-center">
                           <img src={accountManager.avatar} className="w-20 h-20 rounded-full border-4 border-slate-50 mb-3" />
                           <h4 className="font-bold text-slate-800 text-lg">{accountManager.name}</h4>
                           <p className="text-sm text-slate-500 mb-4">{mySquad?.name || 'Squad Dedicada'}</p>
                           
                           <div className="w-full space-y-2">
                               <button 
                                    onClick={() => handleOpenContact('MEETING')}
                                    className="flex items-center justify-center gap-2 w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors"
                               >
                                   <Calendar size={16}/> Solicitar Reunião
                               </button>
                               <button 
                                    onClick={() => handleOpenContact('CALL')}
                                    className="flex items-center justify-center gap-2 w-full py-2 border border-slate-200 hover:border-pink-200 text-slate-600 rounded-lg text-sm font-medium transition-colors"
                               >
                                   <Phone size={16}/> Solicitar Ligação
                               </button>
                           </div>
                      </div>
                  ) : (
                      <div className="text-center py-6 text-slate-400 text-sm bg-slate-50 rounded-lg">
                          Equipe não atribuída.
                      </div>
                  )}
              </div>

              {/* Recent Activity Feed */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                  <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <MessageSquare size={18} className="text-pink-600"/> Atualizações Recentes
                  </h3>
                  
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                      {recentActivities.length === 0 && (
                          <p className="text-xs text-slate-400 italic text-center py-4">Sem novidades recentes.</p>
                      )}
                      
                      {recentActivities.map(activity => (
                          <div key={activity.id} className="flex gap-3 items-start border-b border-slate-50 pb-3 last:border-0">
                              {activity.user && (
                                  <img src={activity.user.avatar} className="w-8 h-8 rounded-full border border-slate-100 mt-1" />
                              )}
                              <div className="flex-1">
                                  <div className="flex justify-between items-start">
                                      <p className="text-xs font-bold text-slate-800">{activity.user?.name}</p>
                                      <span className="text-[10px] text-slate-400">{new Date(activity.time).toLocaleDateString([], {day: '2-digit', month: '2-digit'})}</span>
                                  </div>
                                  <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">"{activity.text}"</p>
                                  <p className="text-[10px] text-pink-500 font-medium mt-1 truncate">Em: {activity.taskTitle}</p>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
              
              {/* Quick Links */}
              <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-xl shadow-lg p-6 text-white">
                  <h3 className="font-bold mb-2">Precisa de Ajuda?</h3>
                  <p className="text-xs text-slate-300 mb-4">Acesse nossa base de conhecimento ou abra um chamado técnico.</p>
                  <button 
                    onClick={() => onNavigate('help')}
                    className="w-full bg-white/10 hover:bg-white/20 text-white py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 border border-white/10"
                  >
                      <ExternalLink size={14}/> Central de Ajuda
                  </button>
              </div>

          </div>
      </div>

      {/* REQUEST WIZARD MODAL */}
      {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center backdrop-blur-sm p-4" onClick={() => setIsModalOpen(false)}>
              <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                  
                  {/* Header */}
                  <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center">
                      <h3 className="font-bold text-slate-800">Nova Solicitação</h3>
                      <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
                  </div>

                  {/* Progress Steps */}
                  <div className="px-8 pt-6 pb-2">
                      <div className="flex items-center justify-between relative">
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-100 -z-10"></div>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${currentStep >= 1 ? 'bg-pink-600 text-white' : 'bg-slate-200 text-slate-500'}`}>1</div>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${currentStep >= 2 ? 'bg-pink-600 text-white' : 'bg-slate-200 text-slate-500'}`}>2</div>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${currentStep >= 3 ? 'bg-pink-600 text-white' : 'bg-slate-200 text-slate-500'}`}>3</div>
                      </div>
                      <div className="flex justify-between text-xs text-slate-500 mt-2 font-medium">
                          <span>Tipo</span>
                          <span>Detalhes</span>
                          <span>Revisão</span>
                      </div>
                  </div>

                  {/* Body */}
                  <div className="p-6 overflow-y-auto flex-1">
                      {currentStep === 1 && renderStep1()}
                      {currentStep === 2 && renderStep2()}
                      {currentStep === 3 && renderStep3()}
                  </div>

                  {/* Footer Navigation */}
                  <div className="p-4 border-t border-slate-100 flex justify-between bg-slate-50">
                      <button 
                        onClick={() => currentStep > 1 ? setCurrentStep(currentStep - 1) : setIsModalOpen(false)}
                        className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1"
                      >
                          {currentStep > 1 && <ChevronLeft size={16}/>}
                          {currentStep === 1 ? 'Cancelar' : 'Voltar'}
                      </button>
                      
                      {currentStep < 3 ? (
                          <button 
                            onClick={handleNextStep}
                            className="px-6 py-2 bg-slate-800 text-white font-bold rounded-lg hover:bg-slate-900 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={currentStep === 1 && !reqType}
                          >
                              Próximo <ChevronRight size={16}/>
                          </button>
                      ) : (
                          <button 
                            onClick={handleSubmit}
                            className="px-6 py-2 bg-pink-600 text-white font-bold rounded-lg hover:bg-pink-700 transition-colors shadow-lg shadow-pink-500/20 flex items-center gap-2"
                          >
                              Enviar Solicitação <CheckCircle size={16}/>
                          </button>
                      )}
                  </div>
              </div>
          </div>
      )}

      {/* CONTACT MODAL (CALL / MEETING) */}
      {contactModalOpen && (
          <div className="fixed inset-0 bg-black/60 z-[110] flex items-center justify-center backdrop-blur-sm p-4" onClick={() => setContactModalOpen(false)}>
              <div className="bg-white rounded-xl w-full max-w-md shadow-2xl animate-pop overflow-hidden" onClick={e => e.stopPropagation()}>
                  <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center">
                      <h3 className="font-bold text-slate-800 flex items-center gap-2">
                          {contactType === 'CALL' ? <Phone size={20} className="text-pink-600"/> : <Calendar size={20} className="text-pink-600"/>}
                          {contactType === 'CALL' ? 'Solicitar Ligação' : 'Agendar Reunião'}
                      </h3>
                      <button onClick={() => setContactModalOpen(false)}><X size={20} className="text-slate-400 hover:text-slate-600"/></button>
                  </div>
                  
                  <div className="p-6 space-y-4">
                      {contactType === 'CALL' && (
                          <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Preferência de Canal</label>
                              <div className="flex gap-2">
                                  <button 
                                    onClick={() => setContactPreference('WHATSAPP')}
                                    className={`flex-1 py-3 rounded-lg border flex items-center justify-center gap-2 transition-all ${contactPreference === 'WHATSAPP' ? 'bg-emerald-50 border-emerald-500 text-emerald-700 ring-1 ring-emerald-500 font-bold' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                  >
                                      <MessageCircle size={18} /> WhatsApp
                                  </button>
                                  <button 
                                    onClick={() => setContactPreference('PHONE')}
                                    className={`flex-1 py-3 rounded-lg border flex items-center justify-center gap-2 transition-all ${contactPreference === 'PHONE' ? 'bg-blue-50 border-blue-500 text-blue-700 ring-1 ring-blue-500 font-bold' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                  >
                                      <Phone size={18} /> Telefone
                                  </button>
                              </div>
                          </div>
                      )}

                      <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                              {contactType === 'CALL' ? 'Motivo da Ligação' : 'Pauta / Motivo'} <span className="text-red-500">*</span>
                          </label>
                          <textarea 
                              className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:border-pink-500 outline-none h-32 resize-none"
                              placeholder={contactType === 'CALL' ? "Sobre qual assunto deseja falar?" : "Quais pontos precisamos alinhar?"}
                              value={contactReason}
                              onChange={e => setContactReason(e.target.value)}
                              autoFocus
                          />
                      </div>

                      <button 
                        onClick={handleSubmitContact}
                        className="w-full bg-slate-800 text-white font-bold py-3 rounded-lg hover:bg-slate-900 transition-colors flex items-center justify-center gap-2"
                      >
                          <Send size={16}/> Enviar Solicitação
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

// Helper component for Icon
const InfoIcon = ({size}: {size: number}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
);
