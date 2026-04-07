
import React, { useState, useMemo } from 'react';
import { 
  Task, 
  User, 
  Client, 
  Squad, 
  Notification, 
  ApprovalBatch,
  ApprovalStatus,
  ApprovalCategory
} from '../types';
import { 
  Plus, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  MessageSquare, 
  ChevronRight, 
  LayoutDashboard,
  FileText,
  Image as ImageIcon,
  Instagram,
  Send,
  ArrowRight,
  X,
  Search,
  Filter,
  ExternalLink,
  Download,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  TrendingUp,
  Video,
  Camera,
  MoreHorizontal
} from 'lucide-react';
import { initialApprovalBatches } from '../utils/mockData';

interface ClientPortalProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  currentUser: User;
  users: User[];
  clients: Client[];
  squads: Squad[];
  batches: ApprovalBatch[];
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
  onNavigate: (view: string) => void;
  setSelectedBatchId: (id: string | null) => void;
}

type WizardStep = 'CATEGORY' | 'DETAILS' | 'CONFIRMATION';

export const ClientPortal: React.FC<ClientPortalProps> = ({ 
  tasks, 
  setTasks, 
  currentUser, 
  users, 
  clients, 
  squads,
  batches,
  setNotifications,
  onNavigate,
  setSelectedBatchId
}) => {
  // --- STATE ---
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState<WizardStep>('CATEGORY');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Wizard Form State
  const [newRequest, setNewRequest] = useState({
    category: '' as ApprovalCategory | '',
    title: '',
    description: '',
    urgency: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH',
    deadline: ''
  });

  // --- DATA PROCESSING ---
  const myClient = clients.find(c => c.id === currentUser.clientId);
  
  // Filter tasks created by this client
  const myRequests = useMemo(() => {
    return tasks.filter(t => t.clientId === currentUser.clientId && t.clientRequest)
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [tasks, currentUser.clientId]);

  // Filter approval batches for this client
  const myApprovals = useMemo(() => {
    return batches.filter(b => b.clientId === currentUser.clientId && b.status === 'SENT')
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }, [batches, currentUser.clientId]);

  const stats = {
    pending: myApprovals.filter(b => b.status === 'SENT').length,
    inProduction: myRequests.filter(t => t.status !== 'DONE').length,
    completed: myRequests.filter(t => t.status === 'DONE').length
  };

  // --- HANDLERS ---
  const handleNextStep = () => {
    if (wizardStep === 'CATEGORY') {
      if (!newRequest.category) return;
      setWizardStep('DETAILS');
    } else if (wizardStep === 'DETAILS') {
      if (!newRequest.title || !newRequest.description) return;
      setWizardStep('CONFIRMATION');
    }
  };

  const handlePrevStep = () => {
    if (wizardStep === 'DETAILS') setWizardStep('CATEGORY');
    if (wizardStep === 'CONFIRMATION') setWizardStep('DETAILS');
  };

  const handleSubmitRequest = () => {
    const newTask: Task = {
      id: `req-${Date.now()}`,
      title: newRequest.title,
      description: `[${newRequest.category}] ${newRequest.description}`,
      status: 'BACKLOG',
      priority: newRequest.urgency,
      dueDate: newRequest.deadline || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      assigneeIds: [],
      clientId: currentUser.clientId,
      clientRequest: true,
      estimatedTime: 0,
      timeLogs: [],
      isTracking: false,
      checklists: [],
      comments: [],
      history: [{
        id: `h-${Date.now()}`,
        action: 'Solicitação criada pelo cliente',
        userId: currentUser.id,
        timestamp: Date.now()
      }],
      createdAt: Date.now()
    };

    setTasks(prev => [newTask, ...prev]);
    
    // Notify Managers/Admins
    setNotifications(prev => [
      {
        id: `n-${Date.now()}`,
        title: 'Nova Solicitação de Cliente',
        message: `${currentUser.name} criou uma nova solicitação: ${newRequest.title}`,
        type: 'INFO',
        priority: 'HIGH',
        status: 'UNREAD',
        originModule: 'CLIENTS',
        timestamp: Date.now(),
        navToView: 'kanban'
      },
      ...prev
    ]);

    setIsWizardOpen(false);
    resetWizard();
  };

  const resetWizard = () => {
    setWizardStep('CATEGORY');
    setNewRequest({
      category: '',
      title: '',
      description: '',
      urgency: 'MEDIUM',
      deadline: ''
    });
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'APPROVED':
      case 'COMPLETED':
      case 'DONE':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'REJECTED':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'ADJUSTMENT':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'SENT':
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'SOCIAL_MEDIA': return <Instagram size={16} />;
      case 'PDF': return <FileText size={16} />;
      case 'TRAFFIC': return <TrendingUp size={16} />;
      case 'VIDEO': return <Video size={16} />;
      case 'SHOOTING': return <Camera size={16} />;
      case 'OTHERS': return <MoreHorizontal size={16} />;
      default: return <ImageIcon size={16} />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Olá, {currentUser.name.split(' ')[0]} 👋
          </h1>
          <p className="text-slate-500 font-medium mt-1">
            Bem-vindo ao seu painel de controle da {myClient?.name || 'Agência'}.
          </p>
        </div>
        <button 
          onClick={() => setIsWizardOpen(true)}
          className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-2xl font-bold transition-all shadow-lg hover:shadow-slate-900/20 flex items-center gap-3 group"
        >
          <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
          NOVA SOLICITAÇÃO
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Em Produção</p>
            <p className="text-2xl font-black text-slate-900">{stats.inProduction}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertCircle size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Para Aprovar</p>
            <p className="text-2xl font-black text-slate-900">{stats.pending}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Concluídos</p>
            <p className="text-2xl font-black text-slate-900">{stats.completed}</p>
          </div>
        </div>
      </div>

      {/* Main Content Tabs/Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Requests List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <LayoutDashboard size={20} className="text-slate-400" />
              Minhas Solicitações
            </h2>
            <div className="flex items-center gap-2">
              <div className="relative hidden sm:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input 
                  type="text" 
                  placeholder="Buscar..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-slate-100 border-transparent focus:bg-white focus:border-slate-200 rounded-lg text-xs outline-none transition-all w-48"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {myRequests.length === 0 ? (
              <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center">
                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4 text-slate-300">
                  <FileText size={32} />
                </div>
                <h3 className="text-lg font-bold text-slate-700">Nenhuma solicitação ativa</h3>
                <p className="text-slate-500 text-sm mt-1 max-w-xs mx-auto">
                  Suas solicitações de novas peças ou serviços aparecerão aqui.
                </p>
                <button 
                  onClick={() => setIsWizardOpen(true)}
                  className="mt-6 text-slate-900 font-bold text-sm hover:underline"
                >
                  Criar minha primeira solicitação
                </button>
              </div>
            ) : (
              myRequests.map(request => (
                <div 
                  key={request.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 group-hover:bg-slate-100 transition-colors">
                      <FileText size={20} className="text-slate-400" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-slate-900 truncate">{request.title}</h4>
                      <div className="flex items-center gap-3 mt-1">
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${getStatusStyle(request.status)}`}>
                          {request.status === 'BACKLOG' ? 'Em Triagem' : request.status}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                          <Clock size={10} /> {new Date(request.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => onNavigate('kanban')}
                    className="p-2 text-slate-400 hover:text-slate-900 transition-colors"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Pending Approvals */}
        <div className="space-y-6">
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <CheckCircle2 size={20} className="text-slate-400" />
            Aguardando Aprovação
          </h2>

          <div className="space-y-4">
            {myApprovals.filter(b => b.status === 'SENT').length === 0 ? (
              <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-6 text-center">
                <p className="text-emerald-700 font-bold text-sm">Tudo em dia! ✨</p>
                <p className="text-emerald-600/70 text-xs mt-1">Você não tem peças pendentes de aprovação no momento.</p>
              </div>
            ) : (
              myApprovals.filter(b => b.status === 'SENT').map(batch => (
                <div 
                  key={batch.id}
                  onClick={() => {
                    setSelectedBatchId(batch.id);
                    onNavigate('approvals');
                  }}
                  className="bg-white p-5 rounded-2xl border-l-4 border-l-amber-500 border-y border-r border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-bold text-slate-900 group-hover:text-amber-600 transition-colors">{batch.title}</h4>
                    <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-1 rounded-lg uppercase">Pendente</span>
                  </div>
                  <div className="flex items-center gap-2 mb-4">
                    {batch.items.slice(0, 3).map((item, idx) => (
                      <div key={item.id} className="w-8 h-8 rounded-lg bg-slate-100 border border-white shadow-sm flex items-center justify-center overflow-hidden">
                        {item.category === 'SOCIAL_MEDIA' ? <Instagram size={12} className="text-slate-400" /> : <ImageIcon size={12} className="text-slate-400" />}
                      </div>
                    ))}
                    {batch.items.length > 3 && (
                      <div className="text-[10px] font-bold text-slate-400 ml-1">+{batch.items.length - 3} itens</div>
                    )}
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                    <span className="text-[10px] font-bold text-slate-400">{batch.items.length} itens para revisar</span>
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1">
                      Revisar <ArrowRight size={14} />
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Quick Support Card */}
          <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
            <h4 className="font-bold mb-2">Precisa de ajuda?</h4>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Fale diretamente com seu gerente de conta ou acesse nossa central de ajuda.
            </p>
            <button 
              onClick={() => onNavigate('help')}
              className="w-full py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold transition-all"
            >
              CENTRAL DE AJUDA
            </button>
          </div>
        </div>
      </div>

      {/* --- NEW REQUEST WIZARD MODAL --- */}
      {isWizardOpen && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 sm:p-6">
          {/* Overlay */}
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" 
            onClick={() => setIsWizardOpen(false)}
          />
          
          {/* Modal Content */}
          <div className="relative bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                  <Plus size={20} />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 tracking-tight">Nova Solicitação</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Passo {wizardStep === 'CATEGORY' ? '1' : wizardStep === 'DETAILS' ? '2' : '3'} de 3
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsWizardOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-900 transition-all"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
              
              {wizardStep === 'CATEGORY' && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                  <div className="text-center mb-8">
                    <h4 className="text-xl font-bold text-slate-900">O que você precisa hoje?</h4>
                    <p className="text-slate-500 text-sm mt-1">Selecione a categoria da sua solicitação.</p>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                      { id: 'SOCIAL_MEDIA', label: 'Social Media', icon: Instagram, color: 'text-pink-600', bg: 'bg-pink-50' },
                      { id: 'DESIGN', label: 'Design Geral', icon: ImageIcon, color: 'text-blue-600', bg: 'bg-blue-50' },
                      { id: 'PDF', label: 'PDF / Doc', icon: FileText, color: 'text-amber-600', bg: 'bg-amber-50' },
                      { id: 'TRAFFIC', label: 'Tráfego', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                      { id: 'VIDEO', label: 'Vídeo', icon: Video, color: 'text-purple-600', bg: 'bg-purple-50' },
                      { id: 'SHOOTING', label: 'Captação', icon: Camera, color: 'text-orange-600', bg: 'bg-orange-50' },
                      { id: 'OTHERS', label: 'Outros', icon: MoreHorizontal, color: 'text-slate-600', bg: 'bg-slate-50' }
                    ].map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => setNewRequest(prev => ({ ...prev, category: cat.id as ApprovalCategory }))}
                        className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center text-center gap-2 group
                          ${newRequest.category === cat.id 
                            ? 'border-slate-900 bg-slate-50 shadow-inner' 
                            : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'}
                        `}
                      >
                        <div className={`w-10 h-10 rounded-xl ${cat.bg} ${cat.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                          <cat.icon size={20} />
                        </div>
                        <span className="font-bold text-slate-900 text-[11px] leading-tight">{cat.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {wizardStep === 'DETAILS' && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Título da Solicitação</label>
                    <input 
                      type="text" 
                      placeholder="Ex: Post de Dia das Mães"
                      value={newRequest.title}
                      onChange={(e) => setNewRequest(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition-all font-medium text-slate-900"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Descrição / Briefing</label>
                    <textarea 
                      placeholder="Descreva detalhadamente o que você precisa..."
                      rows={4}
                      value={newRequest.description}
                      onChange={(e) => setNewRequest(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition-all font-medium text-slate-900 resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Urgência</label>
                      <select 
                        value={newRequest.urgency}
                        onChange={(e) => setNewRequest(prev => ({ ...prev, urgency: e.target.value as any }))}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-slate-900 outline-none transition-all font-medium text-slate-900 bg-white"
                      >
                        <option value="LOW">Baixa</option>
                        <option value="MEDIUM">Média</option>
                        <option value="HIGH">Alta / Urgente</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Prazo Desejado</label>
                      <input 
                        type="date" 
                        value={newRequest.deadline}
                        onChange={(e) => setNewRequest(prev => ({ ...prev, deadline: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-slate-900 outline-none transition-all font-medium text-slate-900"
                      />
                    </div>
                  </div>
                </div>
              )}

              {wizardStep === 'CONFIRMATION' && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300 text-center py-4">
                  <div className="w-20 h-20 bg-slate-900 text-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                    <Send size={32} />
                  </div>
                  <h4 className="text-2xl font-black text-slate-900">Tudo pronto?</h4>
                  <p className="text-slate-500 max-w-sm mx-auto">
                    Sua solicitação será enviada para nossa equipe de produção e você poderá acompanhar o status em tempo real.
                  </p>
                  
                  <div className="bg-slate-50 p-6 rounded-2xl text-left border border-slate-100 max-w-md mx-auto mt-8">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-slate-200 text-slate-600 rounded">
                        {newRequest.category}
                      </span>
                      {newRequest.urgency === 'HIGH' && (
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-red-100 text-red-600 rounded">
                          Urgente
                        </span>
                      )}
                    </div>
                    <h5 className="font-bold text-slate-900">{newRequest.title}</h5>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{newRequest.description}</p>
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
              <button 
                onClick={wizardStep === 'CATEGORY' ? () => setIsWizardOpen(false) : handlePrevStep}
                className="px-6 py-3 text-slate-500 font-bold hover:text-slate-900 transition-colors"
              >
                {wizardStep === 'CATEGORY' ? 'Cancelar' : 'Voltar'}
              </button>
              
              <button 
                onClick={wizardStep === 'CONFIRMATION' ? handleSubmitRequest : handleNextStep}
                disabled={
                  (wizardStep === 'CATEGORY' && !newRequest.category) ||
                  (wizardStep === 'DETAILS' && (!newRequest.title || !newRequest.description))
                }
                className={`px-10 py-3.5 rounded-xl font-bold transition-all shadow-lg flex items-center gap-2
                  ${((wizardStep === 'CATEGORY' && !newRequest.category) || (wizardStep === 'DETAILS' && (!newRequest.title || !newRequest.description)))
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                    : 'bg-slate-900 text-white hover:bg-slate-800 hover:shadow-slate-900/20'}
                `}
              >
                {wizardStep === 'CONFIRMATION' ? 'ENVIAR AGORA' : 'PRÓXIMO'}
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
