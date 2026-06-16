
import React, { useState, useEffect, useRef } from 'react';
import { Modal } from './Modal';
import { Requisition, User, Notification, FinancialTransaction, Client, ConfirmOptions } from '../types';
import { Plus, Check, X, ShoppingBag, DollarSign, Clock, Calendar, AlertTriangle, User as UserIcon, Filter, Search, ChevronRight, ReceiptText, Building2, Trash2, Archive, Upload, FileText, XCircle, Loader2, Trash, Layout, List } from 'lucide-react';
import { deleteRequisition, archiveRequisition } from '../services/supabaseService';
import { uploadFile } from '../services/uploadService';

interface RequisitionsProps {
  requisitions: Requisition[];
  setRequisitions: React.Dispatch<React.SetStateAction<Requisition[]>>;
  currentUser: User;
  users: User[];
  addNotification: (data: any) => Promise<void>;
  openConfirm?: (options: ConfirmOptions) => Promise<boolean>;
  setTransactions: React.Dispatch<React.SetStateAction<FinancialTransaction[]>>;
  clients: Client[];
  onSaveRequisition?: (req: Partial<Requisition>) => Promise<void>;
}

export const Requisitions: React.FC<RequisitionsProps> = ({ 
    requisitions, 
    setRequisitions, 
    currentUser, 
    users, 
    addNotification,
    openConfirm,
    setTransactions,
    clients,
    onSaveRequisition
}) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [viewMode, setViewMode] = useState<'GRID' | 'LIST'>('GRID');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [selectedReqForReject, setSelectedReqForReject] = useState<Requisition | null>(null);
  const [selectedReq, setSelectedReq] = useState<Requisition | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [editingReq, setEditingReq] = useState<Partial<Requisition>>({});
  const [filter, setFilter] = useState<'ALL' | 'MY'>('ALL');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<'ALL' | 'TODAY' | 'WEEK' | 'MONTH' | 'CUSTOM'>('ALL');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachments, setAttachments] = useState<string[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (!isCreateModalOpen) {
      setValidationError(null);
    }
  }, [isCreateModalOpen]);

  const canApprove = currentUser.role === 'ADMIN' || currentUser.role === 'FINANCE';
  const isClient = currentUser.role === 'CLIENT';

  const canArchiveOrDelete = (req: Requisition) => {
    if (canApprove) return true;
    const isOwner = req.requesterId === currentUser.id;
    const isProcessed = req.status === 'APPROVED' || req.status === 'REJECTED';
    return isOwner && isProcessed;
  };

  const displayedRequisitions = requisitions.filter(req => {
      const matchesFilter = filter === 'ALL' ? (canApprove || req.requesterId === currentUser.id) : req.requesterId === currentUser.id;
      const matchesSearch = req.title.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Date filtering
      let matchesDate = true;
      const reqDate = new Date(req.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (dateFilter === 'TODAY') {
        matchesDate = reqDate.getTime() === today.getTime();
      } else if (dateFilter === 'WEEK') {
        const lastWeek = new Date(today);
        lastWeek.setDate(today.getDate() - 7);
        matchesDate = reqDate >= lastWeek;
      } else if (dateFilter === 'MONTH') {
        const lastMonth = new Date(today);
        lastMonth.setMonth(today.getMonth() - 1);
        matchesDate = reqDate >= lastMonth;
      } else if (dateFilter === 'CUSTOM' && customStartDate && customEndDate) {
        const start = new Date(customStartDate);
        const end = new Date(customEndDate);
        matchesDate = reqDate >= start && reqDate <= end;
      }

      return matchesFilter && matchesSearch && matchesDate && !req.archived;
  }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    const newAttachments = [...attachments];
    for (let i = 0; i < files.length; i++) {
        try {
            const url = await uploadFile(files[i], (progress) => {
                setUploadProgress(progress);
            });
            newAttachments.push(url);
        } catch (error) {
            console.error("Error uploading file:", error);
            alert(`Erro ao subir arquivo ${files[i].name}`);
        }
    }
    setAttachments(newAttachments);
    setIsUploading(false);
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveReq = async () => {
      setValidationError(null);
      if (!editingReq.title || !editingReq.title.trim()) {
          setValidationError('Por favor, preencha o título/descrição da solicitação.');
          return;
      }
      if (!editingReq.estimatedCost || editingReq.estimatedCost <= 0) {
          setValidationError('Por favor, defina um custo estimado maior que zero (R$ 0,00).');
          return;
      }

      const newReq: Requisition = {
          id: 'req-' + Date.now().toString(),
          requesterId: currentUser.id,
          title: editingReq.title || '',
          description: editingReq.description || '',
          estimatedCost: editingReq.estimatedCost || 0,
          clientId: editingReq.clientId,
          status: 'PENDING',
          date: new Date().toISOString().split('T')[0],
          category: editingReq.category || (isClient ? 'Reembolso' : 'Compra'),
          attachments: attachments
      };
      
      if (onSaveRequisition) {
          await onSaveRequisition(newReq);
      } else {
          setRequisitions(prev => [newReq, ...prev]);
      }

      // Envia notificações para o financeiro e administradores
      try {
          await addNotification({
              title: 'Nova Solicitação',
              message: `${currentUser.name} enviou uma nova solicitação: "${newReq.title}" no valor de R$ ${newReq.estimatedCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`,
              type: 'INFO',
              status: 'UNREAD',
              priority: 'MEDIUM',
              originModule: 'REQUISITIONS',
              targetRole: 'FINANCE',
              navToView: 'requisitions',
              metadata: { referenceId: newReq.id, action: 'CREATE' },
              timestamp: Date.now()
          });

          await addNotification({
              title: 'Nova Solicitação',
              message: `${currentUser.name} enviou uma nova solicitação: "${newReq.title}" no valor de R$ ${newReq.estimatedCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`,
              type: 'INFO',
              status: 'UNREAD',
              priority: 'MEDIUM',
              originModule: 'REQUISITIONS',
              targetRole: 'ADMIN',
              navToView: 'requisitions',
              metadata: { referenceId: newReq.id, action: 'CREATE' },
              timestamp: Date.now()
          });
      } catch (err) {
          console.error('Erro ao enviar notificações de criação:', err);
      }

      setIsCreateModalOpen(false);
      setEditingReq({});
      setAttachments([]);
  };

  const handleDeleteReq = async (id: string, reqContext?: Requisition) => {
    const req = reqContext || requisitions.find(r => r.id === id);
    if (!req) return;

    const allowed = canApprove || (req.requesterId === currentUser.id && (req.status === 'APPROVED' || req.status === 'REJECTED'));
    if (!allowed) {
      alert('Você não tem permissão para excluir esta solicitação (usuários comuns só podem excluir suas próprias solicitações após aprovação ou recusa).');
      return;
    }
    
    const confirmDelete = openConfirm 
      ? await openConfirm({
          title: 'Excluir Solicitação',
          description: 'Tem certeza que deseja excluir permanentemente esta solicitação? Esta ação não pode ser desfeita.',
          confirmText: 'Excluir',
          cancelText: 'Cancelar',
          variant: 'danger'
        })
      : window.confirm('Tem certeza que deseja excluir permanentemente esta solicitação?');

    if (!confirmDelete) return;
    
    setProcessingId(id);
    const res = await deleteRequisition(id);
    if (res.success) {
        setRequisitions(prev => prev.filter(r => r.id !== id));
        if (selectedReq?.id === id) setSelectedReq(null);
        
        await addNotification({
          title: 'Solicitação Excluída',
          message: `A solicitação foi removida permanentemente por ${currentUser.name}.`,
          type: 'INFO',
          status: 'UNREAD',
          priority: 'LOW',
          originModule: 'REQUISITIONS',
          timestamp: Date.now()
        });
    } else {
        alert('Erro ao excluir solicitação do banco de dados.');
    }
    setProcessingId(null);
  };

  const handleArchiveReq = async (id: string, reqContext?: Requisition) => {
    const req = reqContext || requisitions.find(r => r.id === id);
    if (!req) return;

    const allowed = canApprove || (req.requesterId === currentUser.id && (req.status === 'APPROVED' || req.status === 'REJECTED'));
    if (!allowed) {
      alert('Você não tem permissão para arquivar esta solicitação (usuários comuns só podem arquivar suas próprias solicitações após aprovação ou recusa).');
      return;
    }

    const confirmArchive = openConfirm 
      ? await openConfirm({
          title: 'Arquivar Solicitação',
          description: 'Deseja arquivar esta solicitação? Ela não será mais exibida na lista principal.',
          confirmText: 'Arquivar',
          cancelText: 'Cancelar',
          variant: 'info'
        })
      : true;

    if (!confirmArchive) return;

    setProcessingId(id);
    const res = await archiveRequisition(id);
    if (res.success) {
        setRequisitions(prev => prev.map(r => r.id === id ? { ...r, archived: true } : r));
        if (selectedReq?.id === id) setSelectedReq(null);

        await addNotification({
          title: 'Solicitação Arquivada',
          message: `A solicitação foi arquivada por ${currentUser.name}.`,
          type: 'INFO',
          status: 'UNREAD',
          priority: 'LOW',
          originModule: 'REQUISITIONS',
          timestamp: Date.now()
        });
    } else {
        alert('Erro ao arquivar solicitação no banco de dados.');
    }
    setProcessingId(null);
  };

  const handleApproveReq = async (req: Requisition) => {
      if (!canApprove || req.status === 'APPROVED') return;
      setProcessingId(req.id);
      
      const now = new Date().toISOString();
      const updatedReq: Requisition = { ...req, status: 'APPROVED', approvedBy: currentUser.id, approvedAt: now };
      
      if (onSaveRequisition) {
          await onSaveRequisition(updatedReq);
      } else {
          setRequisitions(prev => prev.map(r => r.id === req.id ? updatedReq : r));
      }

      if (selectedReq?.id === req.id) {
          setSelectedReq(updatedReq);
      }
      
      if (req.estimatedCost > 0) {
          const newExpense: FinancialTransaction = {
              id: `exp-${req.id}`,
              description: `REQ Aprovada: ${req.title}`,
              amount: req.estimatedCost,
              type: 'EXPENSE',
              status: 'PENDING',
              date: new Date().toISOString().split('T')[0],
              categoryId: req.category,
              responsibleId: req.requesterId,
              clientId: req.clientId,
              createdAt: Date.now()
          };
          setTransactions(prev => [newExpense, ...prev]);
      }

      // Envia notificação para o solicitante
      if (req.requesterId) {
          try {
              await addNotification({
                  title: 'Solicitação Aprovada',
                  message: `Sua solicitação de "${req.title}" foi aprovada por ${currentUser.name}.`,
                  type: 'SUCCESS',
                  status: 'UNREAD',
                  priority: 'MEDIUM',
                  originModule: 'REQUISITIONS',
                  targetUserId: req.requesterId,
                  navToView: 'requisitions',
                  metadata: { referenceId: req.id, action: 'APPROVED' },
                  timestamp: Date.now()
              });
          } catch (err) {
              console.error('Erro ao enviar notificação de aprovação:', err);
          }
      }

      // Envia notificação geral (broadcast para todos os gestores/financeiro poderem ver no sininho)
      try {
          await addNotification({
              title: 'Solicitação Aprovada',
              message: `A solicitação de "${req.title}" foi aprovada por ${currentUser.name}.`,
              type: 'SUCCESS',
              status: 'UNREAD',
              priority: 'MEDIUM',
              originModule: 'REQUISITIONS',
              navToView: 'requisitions',
              metadata: { referenceId: req.id, action: 'APPROVED' },
              timestamp: Date.now()
          });
      } catch (err) {
          console.error('Erro ao enviar notificação geral de aprovação:', err);
      }

      setProcessingId(null);
  };

  const handleRejectReq = async () => {
      if (!selectedReqForReject || !rejectionReason) return;
      const reqToReject = selectedReqForReject;
      setIsRejectModalOpen(false);
      setProcessingId(reqToReject.id);
      
      const updatedReq: Requisition = { ...reqToReject, status: 'REJECTED', rejectedBy: currentUser.id, rejectedAt: new Date().toISOString(), rejectedReason: rejectionReason };
      
      if (onSaveRequisition) {
          await onSaveRequisition(updatedReq);
      } else {
          setRequisitions(prev => prev.map(r => r.id === reqToReject.id ? updatedReq : r));
      }
      
      if (selectedReq?.id === reqToReject.id) {
          setSelectedReq(updatedReq);
      }

      // Envia notificação para o solicitante
      if (reqToReject.requesterId) {
          try {
              await addNotification({
                  title: 'Solicitação Recusada',
                  message: `Sua solicitação de "${reqToReject.title}" foi recusada por ${currentUser.name}. Motivo: ${rejectionReason}`,
                  type: 'REJECTED',
                  status: 'UNREAD',
                  priority: 'HIGH',
                  originModule: 'REQUISITIONS',
                  targetUserId: reqToReject.requesterId,
                  navToView: 'requisitions',
                  metadata: { referenceId: reqToReject.id, action: 'REJECTED', reason: rejectionReason },
                  timestamp: Date.now()
              });
          } catch (err) {
              console.error('Erro ao enviar notificação de recusa:', err);
          }
      }

      // Envia notificação geral (broadcast para todos os gestores/financeiro poderem ver no sininho)
      try {
          await addNotification({
              title: 'Solicitação Recusada',
              message: `A solicitação de "${reqToReject.title}" foi recusada por ${currentUser.name}. Motivo: ${rejectionReason}`,
              type: 'WARNING',
              status: 'UNREAD',
              priority: 'HIGH',
              originModule: 'REQUISITIONS',
              navToView: 'requisitions',
              metadata: { referenceId: reqToReject.id, action: 'REJECTED', reason: rejectionReason },
              timestamp: Date.now()
          });
      } catch (err) {
          console.error('Erro ao enviar notificação geral de recusa:', err);
      }
      
      setProcessingId(null);
      setSelectedReqForReject(null);
      setRejectionReason('');
  };

  return (
    <>
      <div className="flex flex-col h-full animate-pop">
        {/* HEADER INTEGRADO */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 md:p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1">
            <h2 className="text-2xl font-black tracking-tight text-slate-800 flex items-center gap-3">
              <ReceiptText className="text-pink-600" size={28}/> Solicitações & Reembolsos
            </h2>
            <p className="text-slate-500 text-sm font-medium">Controle de gastos extras e pedidos de insumos.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
               <button onClick={() => setFilter('ALL')} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === 'ALL' ? 'bg-white shadow-md text-pink-600' : 'text-slate-400 hover:text-slate-600'}`}>Geral</button>
               <button onClick={() => setFilter('MY')} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === 'MY' ? 'bg-white shadow-md text-pink-600' : 'text-slate-400 hover:text-slate-600'}`}>Minhas</button>
            </div>

            <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
               <button onClick={() => setDateFilter('ALL')} className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${dateFilter === 'ALL' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400'}`}>Tudo</button>
               <button onClick={() => setDateFilter('TODAY')} className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${dateFilter === 'TODAY' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400'}`}>Hoje</button>
               <button onClick={() => setDateFilter('WEEK')} className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${dateFilter === 'WEEK' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400'}`}>7 Dias</button>
               <button onClick={() => setDateFilter('MONTH')} className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${dateFilter === 'MONTH' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400'}`}>Mês</button>
               <button onClick={() => setDateFilter('CUSTOM')} className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${dateFilter === 'CUSTOM' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400'}`}>Personalizado</button>
            </div>

            {dateFilter === 'CUSTOM' && (
              <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2">
                <input type="date" value={customStartDate} onChange={e => setCustomStartDate(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[10px] font-bold outline-none focus:border-pink-300" />
                <span className="text-slate-300 text-[10px] font-black">ATÉ</span>
                <input type="date" value={customEndDate} onChange={e => setCustomEndDate(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[10px] font-bold outline-none focus:border-pink-300" />
              </div>
            )}
            
            <div className="h-10 w-px bg-slate-200 mx-1 hidden sm:block"></div>

            <div className="relative group flex-1 sm:flex-none min-w-[200px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-pink-500 transition-colors" size={16}/>
              <input 
                type="text" 
                placeholder="Buscar pedido..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-transparent focus:bg-white focus:border-pink-200 rounded-2xl text-xs font-bold outline-none transition-all shadow-inner"
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200 shrink-0">
               <button
                 onClick={() => setViewMode('GRID')}
                 className={`p-2 rounded-xl transition-all ${
                   viewMode === 'GRID' 
                     ? 'bg-white text-pink-600 shadow-sm ring-1 ring-slate-150' 
                     : 'text-slate-400 hover:text-slate-600'
                 }`}
                 title="Visualização em Grade"
               >
                 <Layout size={18} />
               </button>
               <button
                 onClick={() => setViewMode('LIST')}
                 className={`p-2 rounded-xl transition-all ${
                   viewMode === 'LIST' 
                     ? 'bg-white text-pink-600 shadow-sm ring-1 ring-slate-150' 
                     : 'text-slate-400 hover:text-slate-600'
                 }`}
                 title="Visualização em Lista"
               >
                 <List size={18} />
               </button>
            </div>

            <button 
              onClick={() => { setEditingReq({ category: isClient ? 'Outros' : 'Compra' }); setIsCreateModalOpen(true); }}
              className="px-6 py-3 bg-pink-600 hover:bg-pink-700 text-white font-black text-[10px] uppercase tracking-[0.15em] rounded-2xl transition-all shadow-xl shadow-pink-500/20 flex items-center gap-3 hover:scale-[1.03] active:scale-95 whitespace-nowrap"
            >
              <Plus size={18} strokeWidth={3}/> Nova Solicitação
            </button>
          </div>
        </div>
      </div>

      {/* LISTAGEM DE CARDS E LISTA */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-10">
        {viewMode === 'GRID' ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {displayedRequisitions.length === 0 ? (
              <div className="col-span-full py-24 text-center bg-white rounded-[32px] border-2 border-dashed border-slate-200 flex flex-col items-center">
                <div className="p-6 bg-slate-50 rounded-full mb-4">
                  <ShoppingBag className="text-slate-300" size={48}/>
                </div>
                <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Nenhum pedido registrado no período</p>
              </div>
            ) : (
              displayedRequisitions.map(req => {
                const requester = users.find(u => u.id === req.requesterId);
                const isProcessing = processingId === req.id;

                const leftBorderColor = 
                  req.status === 'APPROVED' ? 'border-l-emerald-500' : 
                  req.status === 'REJECTED' ? 'border-l-red-500' : 'border-l-amber-500';

                const iconBgColor = 
                  req.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100/50' : 
                  req.status === 'REJECTED' ? 'bg-red-50 text-red-600 border-red-100/50' : 
                  'bg-amber-50 text-amber-600 border-amber-100/50';

                return (
                  <div 
                    key={req.id} 
                    onClick={() => setSelectedReq(req)}
                    className={`group bg-white p-5 rounded-2xl border border-slate-100 border-l-4 ${leftBorderColor} hover:border-pink-200 hover:shadow-xl hover:shadow-slate-200/30 transition-all flex flex-col relative overflow-hidden cursor-pointer`}
                  >
                    {isProcessing && (
                      <div className="absolute inset-0 bg-white/80 z-20 flex items-center justify-center backdrop-blur-sm">
                        <Clock className="animate-spin text-pink-600" size={32}/>
                      </div>
                    )}
                    
                    {/* Top Section: Main Info & Price */}
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                      {/* Left: Category icon + texts */}
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border transition-colors ${iconBgColor}`}>
                          {req.category === 'Reembolso' ? <DollarSign size={20}/> : <ShoppingBag size={20}/>}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[9px] font-extrabold uppercase px-2.5 py-1 rounded-lg bg-slate-50 text-slate-500 border border-slate-100 tracking-wider">
                              {req.category}
                            </span>
                            <span className="text-slate-300">•</span>
                            <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1 uppercase tracking-tight">
                              <Calendar size={11} className="text-slate-300"/> 
                              {req.date.split('-').reverse().join('/')}
                            </span>
                          </div>
                          
                          <h4 className="font-extrabold text-slate-800 text-[15px] leading-tight mt-2 tracking-tight group-hover:text-pink-600 transition-colors">
                            {req.title}
                          </h4>

                          <div className="flex items-center gap-3 mt-3">
                            <div className="flex items-center gap-2 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-100">
                              {requester?.avatar ? (
                                <img src={requester.avatar} className="w-4.5 h-4.5 rounded-full object-cover border border-white" />
                              ) : (
                                <div className="w-4.5 h-4.5 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center text-[8px] font-black">{requester?.name?.charAt(0)}</div>
                              )}
                              <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-widest leading-none">
                                {requester?.name}
                              </span>
                            </div>

                            {req.attachments && req.attachments.length > 0 && (
                              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
                                <FileText size={11} />
                                <span className="text-[9px] font-extrabold uppercase tracking-widest leading-none">
                                  {req.attachments.length} {req.attachments.length === 1 ? 'Anexo' : 'Anexos'}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Price & Status */}
                      <div className="flex sm:flex-col items-end justify-between sm:justify-start gap-4 w-full sm:w-auto shrink-0 self-stretch sm:self-auto pt-1">
                        {/* Status Badge */}
                        <span className={`px-3.5 py-1 rounded-xl text-[9px] font-extrabold uppercase tracking-widest border shadow-sm flex items-center gap-1.5 ${
                          req.status === 'PENDING' ? 'bg-amber-50 text-amber-600 border-amber-200' : 
                          req.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            req.status === 'PENDING' ? 'bg-amber-500 animate-pulse' : 
                            req.status === 'APPROVED' ? 'bg-emerald-500' : 'bg-red-500'
                          }`} />
                          {req.status === 'PENDING' ? 'Aguardando' : req.status === 'APPROVED' ? 'Aprovado' : 'Recusado'}
                        </span>

                        {/* Price tag */}
                        <div className="text-right">
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Custo Estimado</p>
                          <p className="font-extrabold text-slate-800 text-base md:text-lg leading-none tracking-tight">
                            R$ {req.estimatedCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Bottom: Action Footer */}
                    {((canApprove && req.status === 'PENDING') || canArchiveOrDelete(req)) && (
                      <div className="border-t border-slate-50 mt-4 pt-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
                        <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider hidden sm:inline-block">
                          {canApprove && req.status === 'PENDING' ? 'Controles Administrativos' : 'Controles de Registro'}
                        </span>
                        <div className="flex items-center justify-end gap-2 w-full sm:w-auto">
                          {canApprove && req.status === 'PENDING' && (
                            <>
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleApproveReq(req); }} 
                                title="Aprovar Solicitação" 
                                className="px-3 py-2 bg-emerald-50 hover:bg-emerald-600 text-emerald-600 hover:text-white rounded-xl transition-all border border-emerald-100 hover:border-emerald-600 shadow-sm text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5"
                              >
                                <Check size={13} strokeWidth={3}/> Aprovar
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); setSelectedReqForReject(req); setIsRejectModalOpen(true); }} 
                                title="Recusar Solicitação" 
                                className="px-3 py-2 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white rounded-xl transition-all border border-red-100 hover:border-red-600 shadow-sm text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5"
                              >
                                <X size={13} strokeWidth={3}/> Recusar
                              </button>
                            </>
                          )}
                          {canArchiveOrDelete(req) && (
                            <>
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleArchiveReq(req.id, req); }} 
                                title="Arquivar Solicitação" 
                                className="p-2 bg-slate-50 hover:bg-slate-900 hover:text-white text-slate-400 rounded-xl transition-all border border-slate-200 hover:border-slate-900 shadow-sm flex items-center justify-center shrink-0"
                              >
                                <Archive size={14}/>
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleDeleteReq(req.id, req); }} 
                                title="Excluir Permanentemente" 
                                className="p-2 bg-red-50 hover:bg-red-600 hover:text-white text-red-400 rounded-xl transition-all border border-red-100 hover:border-red-600 shadow-sm flex items-center justify-center shrink-0"
                              >
                                <Trash2 size={14}/>
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-100 animate-in fade-in duration-300">
            <div className="hidden lg:grid grid-cols-12 gap-4 px-8 py-5 bg-slate-50/50 text-[10px] font-black uppercase tracking-widest text-slate-400">
              <div className="col-span-5">Solicitação / Categoria</div>
              <div className="col-span-2">Solicitante</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-1 text-right">Custo Est.</div>
              <div className="col-span-2 text-right">Ações</div>
            </div>
            {displayedRequisitions.length === 0 ? (
              <div className="p-16 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                Nenhuma solicitação cadastrada.
              </div>
            ) : (
              displayedRequisitions.map(req => {
                const requester = users.find(u => u.id === req.requesterId);
                const isProcessing = processingId === req.id;
                
                const leftBorderColor = 
                  req.status === 'APPROVED' ? 'border-l-emerald-500' : 
                  req.status === 'REJECTED' ? 'border-l-red-500' : 'border-l-amber-500';

                return (
                  <div 
                    key={req.id}
                    onClick={() => setSelectedReq(req)}
                    className={`lg:grid lg:grid-cols-12 gap-4 items-center px-8 py-4.5 hover:bg-slate-50/40 border-l-4 ${leftBorderColor} transition-colors cursor-pointer flex flex-col lg:flex-row text-center lg:text-left relative`}
                  >
                    {isProcessing && (
                      <div className="absolute inset-0 bg-white/80 z-20 flex items-center justify-center backdrop-blur-sm">
                        <Clock className="animate-spin text-pink-600" size={24}/>
                      </div>
                    )}

                    <div className="col-span-5 flex flex-col min-w-0 w-full">
                      <div className="flex items-center gap-3 justify-center lg:justify-start">
                        <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                          req.status === 'APPROVED' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' :
                          req.status === 'REJECTED' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]' :
                          'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]'
                        }`}></div>
                        <h4 className="text-sm font-black text-slate-800 tracking-tight truncate hover:text-pink-600 transition-colors">
                          {req.title}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2 mt-1 justify-center lg:justify-start pl-5.5 text-[10px] text-slate-400 font-bold select-none">
                        <span className="uppercase text-[9px] font-extrabold tracking-wider bg-slate-100 hover:bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-md">
                          {req.category}
                        </span>
                        <span>•</span>
                        <span>{req.date.split('-').reverse().join('/')}</span>
                        {req.attachments && req.attachments.length > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-emerald-600 font-extrabold">{req.attachments.length} {req.attachments.length === 1 ? 'Anexo' : 'Anexos'}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="col-span-2 mt-2 lg:mt-0 w-full">
                      <span className="lg:hidden text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-0.5">Solicitante</span>
                      <span className="text-slate-650 text-xs font-bold leading-none truncate flex items-center gap-1.5 justify-center lg:justify-start">
                        {requester?.avatar ? (
                          <img src={requester.avatar} className="w-5 h-5 rounded-full object-cover border border-slate-100" />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center text-[9px] font-black">{requester?.name?.charAt(0)}</div>
                        )}
                        {requester?.name || 'Sistema'}
                      </span>
                    </div>

                    <div className="col-span-2 mt-2 lg:mt-0 w-full">
                      <span className="lg:hidden text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-0.5">Status</span>
                      <div className="flex justify-center lg:justify-start">
                        <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-extrabold uppercase tracking-widest border ${
                          req.status === 'PENDING' ? 'bg-amber-50 text-amber-600 border-amber-200' : 
                          req.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'
                        }`}>
                          {req.status === 'PENDING' ? 'Aguardando' : req.status === 'APPROVED' ? 'Aprovado' : 'Recusado'}
                        </span>
                      </div>
                    </div>

                    <div className="col-span-1 text-center lg:text-right w-full mt-2 lg:mt-0">
                      <span className="lg:hidden text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-0.5">Custo Estimado</span>
                      <span className="text-sm font-black text-slate-800">
                        R$ {req.estimatedCost?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                      </span>
                    </div>

                    <div className="col-span-2 flex items-center justify-center lg:justify-end gap-1.5 w-full mt-4 lg:mt-0 shrink-0" onClick={e => e.stopPropagation()}>
                      {canApprove && req.status === 'PENDING' && (
                        <>
                          <button 
                            onClick={() => handleApproveReq(req)} 
                            title="Aprovar Solicitação" 
                            className="p-2 bg-emerald-50 hover:bg-emerald-600 text-emerald-600 hover:text-white rounded-xl transition-all border border-emerald-100 hover:border-emerald-600"
                          >
                            <Check size={14} strokeWidth={3}/>
                          </button>
                          <button 
                            onClick={() => { setSelectedReqForReject(req); setIsRejectModalOpen(true); }} 
                            title="Recusar Solicitação" 
                            className="p-2 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white rounded-xl transition-all border border-red-100 hover:border-red-600"
                          >
                            <X size={14} strokeWidth={3}/>
                          </button>
                        </>
                      )}
                      {canArchiveOrDelete(req) && (
                        <>
                          <button 
                            onClick={() => handleArchiveReq(req.id, req)} 
                            title="Arquivar Solicitação" 
                            className="p-2 bg-slate-50 hover:bg-slate-900 hover:text-white text-slate-400 rounded-xl transition-all border border-slate-200"
                          >
                            <Archive size={14}/>
                          </button>
                          <button 
                            onClick={() => handleDeleteReq(req.id, req)} 
                            title="Excluir Permanentemente" 
                            className="p-2 bg-red-50 hover:bg-red-600 hover:text-white text-red-400 rounded-xl transition-all border border-red-100"
                          >
                            <Trash2 size={14}/>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      </div>
      
      {/* MODAL CRIAR SOLICITAÇÃO */}
      {isCreateModalOpen && (
          <Modal 
              isOpen={isCreateModalOpen} 
              onClose={() => setIsCreateModalOpen(false)}
              maxWidth="448px"
              hideHeader={true}
              noPadding={true}
              scrollable={false}
          >
              <div className="bg-white rounded-[32px] w-full flex-1 min-h-0 shadow-2xl overflow-hidden flex flex-col">
                  <div className="p-6 border-b border-slate-50 bg-white flex items-center justify-between shrink-0">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-pink-50 text-pink-600 rounded-xl"><Plus size={20}/></div>
                        <h3 className="text-xl font-black text-slate-800 tracking-tight uppercase">Novo Pedido</h3>
                      </div>
                      <button onClick={() => setIsCreateModalOpen(false)} className="p-2 text-slate-300 hover:bg-slate-50 rounded-full transition-colors"><X size={20}/></button>
                  </div>
                  
                  <div className="p-8 space-y-5 overflow-y-auto custom-scrollbar flex-1 min-h-0">
                      {validationError && (
                          <div className="bg-red-50 text-red-600 border border-red-100 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
                              <AlertTriangle size={20} className="text-red-500 shrink-0" />
                              <span className="text-xs font-bold leading-normal">{validationError}</span>
                          </div>
                      )}
                      <div>
                          <label className="text-[9px] uppercase text-slate-400 font-black mb-2 block tracking-[0.2em] ml-1">Tipo de Solicitação</label>
                          <select 
                             className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-bold outline-none focus:bg-white focus:border-pink-500 transition-all cursor-pointer"
                             value={editingReq.category}
                             onChange={e => setEditingReq({...editingReq, category: e.target.value})}
                          >
                              {isClient ? (
                                  <>
                                    <option value="Reembolso">Reembolso</option>
                                    <option value="Outros">Outros Pedidos</option>
                                  </>
                              ) : (
                                  <>
                                    <option value="Compra">Insumos / Hardware</option>
                                    <option value="Reembolso">Reembolso de Despesa</option>
                                    <option value="Software">Assinatura / Software</option>
                                    <option value="Serviço">Terceirização / Comercial</option>
                                  </>
                              )}
                          </select>
                      </div>

                      <div>
                          <label className="text-[9px] uppercase text-slate-400 font-black mb-2 block tracking-[0.2em] ml-1">O que você precisa?</label>
                          <input 
                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-bold outline-none focus:bg-white focus:border-pink-500 transition-all"
                            placeholder="Ex: Licença mensal Adobe Cloud" 
                            value={editingReq.title || ''} 
                            onChange={e => setEditingReq({...editingReq, title: e.target.value})} 
                            autoFocus
                          />
                      </div>

                      <div>
                          <label className="text-[9px] uppercase text-slate-400 font-black mb-2 block tracking-[0.2em] ml-1">Justificativa</label>
                          <textarea 
                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-bold outline-none focus:bg-white focus:border-pink-500 transition-all resize-none"
                            placeholder="Descreva brevemente a necessidade..." 
                            rows={3} 
                            value={editingReq.description || ''} 
                            onChange={e => setEditingReq({...editingReq, description: e.target.value})} 
                          />
                      </div>

                      <div>
                          <label className="text-[9px] uppercase text-slate-400 font-black mb-2 block tracking-[0.2em] ml-1">Vincular a Cliente (Opcional)</label>
                          <select 
                             className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-bold outline-none focus:bg-white focus:border-pink-500 transition-all cursor-pointer"
                             value={editingReq.clientId || ''}
                             onChange={e => setEditingReq({...editingReq, clientId: e.target.value})}
                          >
                              <option value="">Sem Cliente</option>
                              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                      </div>

                      <div>
                          <label className="text-[9px] uppercase text-slate-400 font-black mb-2 block tracking-[0.2em] ml-1">Custo Estimado (R$)</label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400">R$</span>
                            <input 
                              type="number" 
                              className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 pl-12 text-2xl font-black outline-none focus:bg-white focus:border-pink-500 transition-all text-slate-800"
                              placeholder="0,00" 
                              value={editingReq.estimatedCost || ''} 
                              onChange={e => setEditingReq({...editingReq, estimatedCost: parseFloat(e.target.value)})} 
                            />
                          </div>
                      </div>

                      <div>
                          <label className="text-[9px] uppercase text-slate-400 font-black mb-2 block tracking-[0.2em] ml-1">Anexar Comprovante / Orçamento</label>
                          
                          {isUploading && (
                            <div className="mb-4 px-1">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[9px] font-black text-pink-600 uppercase tracking-widest">Subindo arquivo...</span>
                                <span className="text-[9px] font-black text-pink-600">{uploadProgress}%</span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-pink-500 transition-all duration-300 ease-out"
                                  style={{ width: `${uploadProgress}%` }}
                                />
                              </div>
                            </div>
                          )}

                          <div className="flex flex-wrap gap-3">
                              {attachments.map((file, idx) => (
                                  <div key={idx} className="relative w-20 h-20 bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 group animate-in zoom-in">
                                      {file && <img src={file} className="w-full h-full object-cover" alt="" />}
                                      <button 
                                          onClick={() => removeAttachment(idx)}
                                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                      >
                                          <X size={12} />
                                      </button>
                                  </div>
                              ))}
                              <button 
                                  onClick={() => fileInputRef.current?.click()}
                                  disabled={isUploading}
                                  className="w-20 h-20 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 hover:bg-white hover:border-pink-300 hover:text-pink-500 transition-all disabled:opacity-50"
                              >
                                  {isUploading ? <Loader2 className="animate-spin" size={20} /> : <Upload size={20} />}
                                  <span className="text-[8px] font-black uppercase mt-1">{isUploading ? 'Subindo' : 'Anexar'}</span>
                              </button>
                              <input 
                                  type="file" 
                                  ref={fileInputRef} 
                                  className="hidden" 
                                  multiple 
                                  accept="image/*" 
                                  onChange={handleFileUpload} 
                              />
                          </div>
                      </div>
                  </div>

                  <div className="p-6 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row justify-end gap-3 shrink-0">
                      <button onClick={() => setIsCreateModalOpen(false)} className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors">Cancelar</button>
                      <button onClick={handleSaveReq} className="px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-slate-200">Enviar para Análise</button>
                  </div>
              </div>
          </Modal>
      )}

      {/* MODAL DETALHES DA SOLICITAÇÃO */}
      {selectedReq && (
          <Modal 
              isOpen={!!selectedReq} 
              onClose={() => setSelectedReq(null)}
              maxWidth="640px"
              hideHeader={true}
              noPadding={true}
          >
              <div className="bg-white rounded-[32px] w-full flex-1 min-h-0 shadow-2xl overflow-hidden flex flex-col">
                  <div className={`p-8 border-b border-slate-50 relative ${
                    selectedReq.status === 'APPROVED' ? 'bg-emerald-50/50' : 
                    selectedReq.status === 'REJECTED' ? 'bg-red-50/50' : 'bg-amber-50/50'
                  }`}>
                      <button 
                        onClick={() => setSelectedReq(null)}
                        className="absolute right-6 top-6 p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-xl transition-all"
                      >
                        <X size={20} />
                      </button>

                      <div className="flex items-center gap-4 mb-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm border ${
                          selectedReq.status === 'APPROVED' ? 'bg-white text-emerald-600 border-emerald-100' : 
                          selectedReq.status === 'REJECTED' ? 'bg-white text-red-600 border-red-100' : 
                          'bg-white text-amber-600 border-amber-100'
                        }`}>
                          {selectedReq.category === 'Reembolso' ? <DollarSign size={24}/> : <ShoppingBag size={24}/>}
                        </div>
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{selectedReq.category}</span>
                          <h3 className="text-xl font-black text-slate-800 tracking-tight leading-tight">{selectedReq.title}</h3>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border shadow-sm ${
                            selectedReq.status === 'PENDING' ? 'bg-amber-50 text-amber-600 border-amber-200' : 
                            selectedReq.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'
                        }`}>
                            {selectedReq.status === 'PENDING' ? 'Aguardando Aprovação' : selectedReq.status === 'APPROVED' ? 'Solicitação Aprovada' : 'Solicitação Recusada'}
                        </span>
                        <span className="px-4 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 shadow-sm">
                          <Calendar size={12}/> {selectedReq.date.split('-').reverse().join('/')}
                        </span>
                      </div>
                  </div>

                  <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar flex-1">
                      <div>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Descrição / Justificativa</h4>
                        <p className="text-slate-600 text-sm font-medium leading-relaxed bg-slate-50 p-5 rounded-2xl border border-slate-100">
                          {selectedReq.description || 'Nenhuma descrição fornecida.'}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Custo Estimado</h4>
                          <p className="text-2xl font-black text-slate-800">R$ {selectedReq.estimatedCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        </div>
                        <div>
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Solicitante</h4>
                          <div className="flex items-center gap-3">
                            <img src={users.find(u => u.id === selectedReq.requesterId)?.avatar || undefined} className="w-8 h-8 rounded-full border border-slate-200" alt="" />
                            <span className="text-sm font-bold text-slate-700">{users.find(u => u.id === selectedReq.requesterId)?.name}</span>
                          </div>
                        </div>
                      </div>

                      {selectedReq.attachments && selectedReq.attachments.length > 0 && (
                        <div>
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Anexos ({selectedReq.attachments.length})</h4>
                          <div className="flex flex-wrap gap-3">
                            {selectedReq.attachments.map((file, idx) => (
                              <a 
                                key={idx} 
                                href={file} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="w-20 h-20 bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden hover:border-pink-300 transition-all group relative"
                              >
                                {file && <img src={file} className="w-full h-full object-cover" alt="" />}
                                <div className="absolute inset-0 bg-pink-600/0 group-hover:bg-pink-600/20 transition-all flex items-center justify-center">
                                  <ChevronRight size={20} className="text-white opacity-0 group-hover:opacity-100 transition-all" />
                                </div>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {(selectedReq.status === 'APPROVED' || selectedReq.status === 'REJECTED') && (
                        <div className={`p-6 rounded-2xl border ${selectedReq.status === 'APPROVED' ? 'bg-emerald-50/50 border-emerald-100' : 'bg-red-50/50 border-red-100'}`}>
                          <h4 className={`text-[9px] font-black uppercase tracking-widest mb-3 ${selectedReq.status === 'APPROVED' ? 'text-emerald-600' : 'text-red-600'}`}>
                            {selectedReq.status === 'APPROVED' ? 'Dados da Aprovação' : 'Dados da Recusa'}
                          </h4>
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <img src={users.find(u => u.id === (selectedReq.approvedBy || selectedReq.rejectedBy))?.avatar || undefined} className="w-6 h-6 rounded-full" alt="" />
                              <span className="text-xs font-bold text-slate-700">Por {users.find(u => u.id === (selectedReq.approvedBy || selectedReq.rejectedBy))?.name}</span>
                              <span className="text-[10px] text-slate-400 font-bold">• {new Date(selectedReq.approvedAt || selectedReq.rejectedAt || '').toLocaleString('pt-BR')}</span>
                            </div>
                            {selectedReq.rejectedReason && (
                              <div className="mt-2 p-3 bg-white/50 rounded-xl border border-red-100 text-xs font-bold text-red-700 italic">
                                "{selectedReq.rejectedReason}"
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                  </div>

                  <div className="p-8 bg-slate-50 border-t border-slate-100 flex flex-col gap-4">
                    {canApprove && selectedReq.status === 'PENDING' && (
                      <div className="flex gap-3">
                        <button 
                          onClick={() => handleApproveReq(selectedReq)}
                          disabled={!!processingId}
                          className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-emerald-200 flex items-center justify-center gap-2"
                        >
                          {processingId === selectedReq.id ? <Loader2 size={18} className="animate-spin"/> : <Check size={18}/>}
                          Aprovar Pedido
                        </button>
                        <button 
                          onClick={() => { setSelectedReqForReject(selectedReq); setIsRejectModalOpen(true); }}
                          className="flex-1 py-4 bg-white border-2 border-red-100 text-red-600 hover:bg-red-50 font-black text-[11px] uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-2"
                        >
                          <X size={18}/>
                          Negar Pedido
                        </button>
                      </div>
                    )}

                    {(canApprove || canArchiveOrDelete(selectedReq)) && (
                      <div className="flex items-center justify-between border-t border-slate-200 pt-4 mt-2">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                          {canApprove ? 'Ações Administrativas' : 'Minhas Ações'}
                        </p>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleArchiveReq(selectedReq.id, selectedReq)}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-500 hover:text-slate-900 hover:border-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm"
                          >
                            <Archive size={14}/> Arquivar
                          </button>
                          <button 
                            onClick={() => handleDeleteReq(selectedReq.id, selectedReq)}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-red-100 text-red-400 hover:text-white hover:bg-red-600 hover:border-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm"
                          >
                            <Trash2 size={14}/> Excluir
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
              </div>
          </Modal>
      )}

      {/* MODAL RECUSAR SOLICITAÇÃO */}
      {isRejectModalOpen && selectedReqForReject && (
          <Modal 
              isOpen={isRejectModalOpen} 
              onClose={() => setIsRejectModalOpen(false)}
              maxWidth="448px"
              hideHeader={true}
              noPadding={true}
              scrollable={false}
          >
              <div className="bg-white rounded-[32px] w-full flex-1 min-h-0 shadow-2xl overflow-hidden border-t-4 border-red-600 border-x border-b border-slate-100 flex flex-col">
                  <div className="p-6 border-b border-slate-50 bg-white flex items-center gap-4 shrink-0">
                      <div className="p-3 bg-red-50 text-red-600 rounded-2xl shadow-sm"><AlertTriangle size={24}/></div>
                      <h3 className="text-xl font-black text-slate-800 tracking-tight uppercase">Negar Pedido</h3>
                  </div>
                  
                  <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1 min-h-0">
                      <div className="p-4 bg-red-50 rounded-2xl border border-red-100 text-xs">
                        <p className="font-black text-red-800 uppercase text-[9px] tracking-widest mb-1.5">Item Solicitado:</p>
                        <p className="text-red-700 font-bold">{selectedReqForReject.title}</p>
                      </div>

                      <div>
                        <label className="text-[9px] uppercase text-slate-400 font-black mb-2 block tracking-[0.2em] ml-1">Motivo da Recusa <span className="text-red-500">*</span></label>
                        <textarea 
                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-bold outline-none focus:bg-white focus:border-red-500 transition-all border resize-none"
                            placeholder="Explique ao colaborador o motivo da decisão..." 
                            rows={3} 
                            value={rejectionReason} 
                            onChange={e => setRejectionReason(e.target.value)} 
                            autoFocus
                        />
                      </div>
                  </div>

                  <div className="p-6 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row justify-end gap-3 shrink-0">
                      <button onClick={() => setIsRejectModalOpen(false)} className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors">Voltar</button>
                      <button 
                        onClick={handleRejectReq} 
                        disabled={!rejectionReason}
                        className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-red-200 disabled:opacity-50"
                      >
                        Confirmar Recusa
                      </button>
                  </div>
              </div>
          </Modal>
      )}
    </>
  );
};
