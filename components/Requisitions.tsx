
import React, { useState } from 'react';
import { Requisition, User, Notification, FinancialRecord } from '../types';
import { Plus, Check, X, FileText, AlertCircle, ShoppingBag, DollarSign, Clock, AlertTriangle, Phone, Calendar } from 'lucide-react';

interface RequisitionsProps {
  requisitions: Requisition[];
  setRequisitions: React.Dispatch<React.SetStateAction<Requisition[]>>;
  currentUser: User;
  users: User[];
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
  setTransactions: React.Dispatch<React.SetStateAction<FinancialRecord[]>>;
}

export const Requisitions: React.FC<RequisitionsProps> = ({ 
    requisitions, 
    setRequisitions, 
    currentUser, 
    users, 
    setNotifications,
    setTransactions 
}) => {
  // Estado para Criar Nova Requisição
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingReq, setEditingReq] = useState<Partial<Requisition>>({});
  
  // Estado para Filtros
  const [filter, setFilter] = useState<'ALL' | 'MY'>('ALL');
  
  // Estados para Processamento (Feedback Visual)
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  // Estados para Modal de Reprovação
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [selectedReqForReject, setSelectedReqForReject] = useState<Requisition | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // 1. Permissões
  // NOTA: Gerentes não aprovam mais financeiro, apenas ADMIN e FINANCEIRO.
  const canApprove = currentUser.role === 'ADMIN' || currentUser.role === 'FINANCE';
  const isClient = currentUser.role === 'CLIENT';

  // Filtragem
  const displayedRequisitions = requisitions.filter(req => {
      if (filter === 'MY') return req.requesterId === currentUser.id;
      // Se não for admin/financeiro, vê apenas as suas
      if (!canApprove) return req.requesterId === currentUser.id;
      return true;
  }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // --- Handlers (Simulando Backend) ---

  const handleSaveReq = () => {
      if (!editingReq.title || !editingReq.estimatedCost) {
          alert("Preencha título e valor.");
          return;
      }
      
      const newReq: Requisition = {
          id: Date.now().toString(),
          requesterId: currentUser.id,
          title: editingReq.title || '',
          description: editingReq.description || '',
          estimatedCost: editingReq.estimatedCost || 0,
          status: 'PENDING',
          date: new Date().toISOString().split('T')[0],
          category: editingReq.category || (isClient ? 'Reembolso' : 'Compra')
      };
      
      setRequisitions(prev => [newReq, ...prev]);
      setIsCreateModalOpen(false);
      setEditingReq({});
  };

  // Endpoint Simulado: POST /api/solicitacoes-financeiras/{id}/aprovar
  const handleApproveReq = (req: Requisition) => {
      // 1. Validar Permissão (Backend Guard)
      if (!canApprove) {
          alert("Erro 403: Sem permissão para aprovar.");
          return;
      }

      // 2. Validar Estado (Idempotência)
      if (req.status === 'APPROVED') {
          return; // Já aprovada, não faz nada
      }

      setProcessingId(req.id);

      // Simulando delay de rede (Loading)
      setTimeout(() => {
          const now = new Date().toISOString();

          // 3. Atualizar Status e Auditoria
          const updatedReq: Requisition = {
              ...req,
              status: 'APPROVED',
              approvedBy: currentUser.id,
              approvedAt: now,
              rejectedBy: undefined, // Limpa rejeições anteriores se houver reanálise
              rejectedAt: undefined,
              rejectedReason: undefined
          };

          setRequisitions(prev => prev.map(r => r.id === req.id ? updatedReq : r));

          // 4. Criar Registro Financeiro (APENAS SE FOR COMPRA/FINANCEIRO)
          // Se for "Reunião" ou "Atendimento", não cria despesa.
          const isServiceRequest = ['Reunião', 'Atendimento', 'Contato'].includes(req.category);
          
          if (!isServiceRequest && req.estimatedCost > 0) {
              const newExpense: FinancialRecord = {
                  id: `exp-${req.id}-${Date.now()}`,
                  description: `REQ Aprovada: ${req.title} (${req.category})`,
                  amount: req.estimatedCost,
                  type: 'EXPENSE',
                  status: 'PENDING', // Entra como "A Pagar"
                  dueDate: new Date().toISOString().split('T')[0], // Vence hoje por padrão ou config
                  category: req.category,
                  entity: users.find(u => u.id === req.requesterId)?.name || 'Colaborador Interno'
              };
              setTransactions(prev => [newExpense, ...prev]);
          }

          // 5. Notificar Solicitante
          const notif: Notification = {
              id: `notif-apr-${Date.now()}`,
              title: isServiceRequest ? 'Solicitação Agendada/Concluída' : 'Solicitação Aprovada',
              message: isServiceRequest 
                ? `Sua solicitação "${req.title}" foi confirmada pela equipe.`
                : `Sua solicitação "${req.title}" no valor de R$ ${req.estimatedCost.toLocaleString()} foi aprovada.`,
              type: 'SUCCESS',
              read: false,
              timestamp: Date.now(),
              targetUserId: req.requesterId, // Notifica quem pediu
              navToView: 'requisitions' // Navega para a central de solicitações
          };
          setNotifications(prev => [notif, ...prev]);

          setProcessingId(null);
      }, 800); // 800ms delay para feedback visual
  };

  // Setup para Reprovação (Abre Modal)
  const openRejectModal = (req: Requisition) => {
      setSelectedReqForReject(req);
      setRejectionReason('');
      setIsRejectModalOpen(true);
  };

  // Endpoint Simulado: POST /api/solicitacoes-financeiras/{id}/reprovar
  const confirmRejection = () => {
      if (!selectedReqForReject) return;
      
      // 1. Validar Motivo (Body required)
      if (!rejectionReason || rejectionReason.length < 3) {
          alert("O motivo da reprovação é obrigatório (mínimo 3 caracteres).");
          return;
      }

      // 2. Validar Permissão
      if (!canApprove) {
          alert("Erro 403: Sem permissão.");
          return;
      }

      const reqToReject = selectedReqForReject;
      setIsRejectModalOpen(false);
      setProcessingId(reqToReject.id);

      setTimeout(() => {
          const now = new Date().toISOString();

          // 3. Atualizar Status e Auditoria
          const updatedReq: Requisition = {
              ...reqToReject,
              status: 'REJECTED',
              rejectedBy: currentUser.id,
              rejectedAt: now,
              rejectedReason: rejectionReason,
              approvedBy: undefined,
              approvedAt: undefined
          };

          setRequisitions(prev => prev.map(r => r.id === reqToReject.id ? updatedReq : r));

          // 4. Notificar Solicitante com Motivo
          const notif: Notification = {
              id: `notif-rej-${Date.now()}`,
              title: 'Solicitação Recusada',
              message: `Sua solicitação "${reqToReject.title}" foi recusada. Motivo: ${rejectionReason}`,
              type: 'REJECTED',
              read: false,
              timestamp: Date.now(),
              targetUserId: reqToReject.requesterId,
              navToView: 'requisitions' // Navega para a central de solicitações
          };
          setNotifications(prev => [notif, ...prev]);

          setProcessingId(null);
          setSelectedReqForReject(null);
      }, 800);
  };

  const getCategoryIcon = (cat: string) => {
      switch(cat) {
          case 'Reunião': return <Calendar size={12}/>;
          case 'Atendimento': return <Phone size={12}/>;
          default: return <ShoppingBag size={12}/>;
      }
  };

  return (
    <div className="space-y-6 animate-pop">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Central de Solicitações</h2>
          <p className="text-slate-500">Gestão de compras, reembolsos e agendamentos.</p>
        </div>
        <div className="flex gap-2">
            {canApprove && (
                <div className="bg-slate-100 p-1 rounded-lg flex text-xs font-bold">
                    <button 
                        onClick={() => setFilter('ALL')}
                        className={`px-3 py-1.5 rounded transition-all ${filter === 'ALL' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Todas
                    </button>
                    <button 
                        onClick={() => setFilter('MY')}
                        className={`px-3 py-1.5 rounded transition-all ${filter === 'MY' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Minhas
                    </button>
                </div>
            )}
            <button 
                onClick={() => { setEditingReq({ category: isClient ? 'Outros' : 'Compra' }); setIsCreateModalOpen(true); }}
                className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors shadow-lg shadow-pink-500/20"
            >
                <Plus size={18} /> Nova Solicitação
            </button>
        </div>
      </div>

      {/* Grid de Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedRequisitions.length === 0 && (
              <div className="col-span-full p-12 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                  <FileText className="mx-auto text-slate-300 mb-2" size={48}/>
                  <p className="text-slate-500 font-medium">Nenhuma solicitação encontrada.</p>
              </div>
          )}
          
          {displayedRequisitions.map(req => {
              const requester = users.find(u => u.id === req.requesterId);
              const isProcessing = processingId === req.id;
              const isService = ['Reunião', 'Atendimento', 'Contato'].includes(req.category);
              
              return (
                <div key={req.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow relative">
                    {/* Overlay de Loading */}
                    {isProcessing && (
                        <div className="absolute inset-0 bg-white/80 z-20 flex items-center justify-center backdrop-blur-sm">
                            <div className="flex flex-col items-center gap-2">
                                <Clock className="animate-spin text-pink-600" size={32}/>
                                <span className="text-xs font-bold text-pink-600">Processando...</span>
                            </div>
                        </div>
                    )}

                    <div className="p-5 flex-1">
                        <div className="flex justify-between items-start mb-3">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${
                                req.status === 'PENDING' ? 'bg-orange-50 text-orange-700 border-orange-100' : 
                                req.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'
                            }`}>
                                {req.status === 'PENDING' ? 'Em Análise' : req.status === 'APPROVED' ? (isService ? 'Concluído' : 'Aprovada') : 'Recusada'}
                            </span>
                            <div className="flex items-center gap-1 text-xs text-slate-400">
                                <Clock size={12}/>
                                <span>{req.date.split('-').reverse().join('/')}</span>
                            </div>
                        </div>
                        
                        <h3 className="font-bold text-slate-800 text-lg mb-1 line-clamp-1">{req.title}</h3>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
                            <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200 flex items-center gap-1">{getCategoryIcon(req.category)} {req.category}</span>
                            {requester && (
                                <span className="flex items-center gap-1" title={requester.name}>
                                    • <img src={requester.avatar} className="w-4 h-4 rounded-full"/> <b>{requester.name.split(' ')[0]}</b>
                                </span>
                            )}
                        </div>

                        <p className="text-sm text-slate-600 mb-4 line-clamp-3 bg-slate-50 p-2 rounded-lg border border-slate-100 min-h-[60px]">
                            {req.description}
                        </p>

                        {/* Área de Rejeição / Motivo */}
                        {req.status === 'REJECTED' && req.rejectedReason && (
                            <div className="bg-red-50 p-3 rounded-lg border border-red-100 mb-4 animate-pop">
                                <p className="text-xs text-red-800 font-bold flex items-center gap-1 mb-1"><AlertCircle size={12}/> Motivo da Recusa:</p>
                                <p className="text-xs text-red-600 italic">"{req.rejectedReason}"</p>
                                {req.rejectedAt && <p className="text-[10px] text-red-400 mt-1 text-right">{new Date(req.rejectedAt).toLocaleString()}</p>}
                            </div>
                        )}
                        
                        {/* Área de Aprovação / Dados */}
                        {req.status === 'APPROVED' && req.approvedAt && (
                             <div className="bg-emerald-50 p-2 rounded border border-emerald-100 mb-4 text-center">
                                 <p className="text-[10px] text-emerald-600">{isService ? 'Confirmado' : 'Aprovado'} em {new Date(req.approvedAt).toLocaleDateString()}</p>
                             </div>
                        )}
                    </div>

                    <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                        <div>
                            {isService ? (
                                <p className="text-xs font-bold text-slate-500 uppercase">Solicitação de Serviço</p>
                            ) : (
                                <>
                                    <p className="text-[10px] text-slate-400 uppercase font-bold">Valor Solicitado</p>
                                    <p className="text-lg font-bold text-slate-800 flex items-center gap-1">
                                        <span className="text-slate-400 text-sm font-normal">R$</span> {req.estimatedCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </p>
                                </>
                            )}
                        </div>
                        
                        {/* Botões de Ação (Apenas para PENDENTE e Roles Permitidas) */}
                        {canApprove && req.status === 'PENDING' && (
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => handleApproveReq(req)} 
                                    className="px-3 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-lg transition-colors flex items-center gap-1 font-bold text-xs" 
                                    title={isService ? "Confirmar Agendamento" : "Aprovar e Lançar Despesa"}
                                >
                                    <Check size={16}/> {isService ? 'Confirmar' : 'Aprovar'}
                                </button>
                                <button 
                                    onClick={() => openRejectModal(req)} 
                                    className="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors flex items-center gap-1 font-bold text-xs" 
                                    title="Reprovar"
                                >
                                    <X size={16}/> {isService ? 'Recusar' : 'Reprovar'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
              );
          })}
      </div>

      {/* Modal de Nova Requisição */}
      {isCreateModalOpen && (
          <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center backdrop-blur-sm p-4" onClick={() => setIsCreateModalOpen(false)}>
              <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-2xl animate-pop" onClick={e => e.stopPropagation()}>
                  <h3 className="text-xl font-bold mb-4 text-slate-800 flex items-center gap-2">
                      <ShoppingBag className="text-pink-600"/>
                      Nova Solicitação
                  </h3>
                  <div className="space-y-4">
                      <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1">Tipo</label>
                          <select 
                             className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:border-pink-500 outline-none bg-white"
                             value={editingReq.category}
                             onChange={e => setEditingReq({...editingReq, category: e.target.value})}
                          >
                              {isClient ? (
                                  <>
                                    <option value="Reembolso">Reembolso</option>
                                    <option value="Outros">Outros</option>
                                  </>
                              ) : (
                                  <>
                                    <option value="Compra">Compra de Material</option>
                                    <option value="Reembolso">Reembolso</option>
                                    <option value="Vale">Vale / Adiantamento</option>
                                    <option value="Software">Software</option>
                                    <option value="Serviço">Serviço Terceiro</option>
                                  </>
                              )}
                          </select>
                      </div>

                      <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1">Título</label>
                          <input 
                            className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:border-pink-500 outline-none" 
                            placeholder={isClient ? "Ex: Reembolso Uber Reunião" : "Ex: Monitor Dell 24pol"} 
                            value={editingReq.title || ''} 
                            onChange={e => setEditingReq({...editingReq, title: e.target.value})} 
                          />
                      </div>

                      <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1">Justificativa</label>
                          <textarea 
                            className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:border-pink-500 outline-none resize-none" 
                            placeholder="Descreva a necessidade..." 
                            rows={3} 
                            value={editingReq.description || ''} 
                            onChange={e => setEditingReq({...editingReq, description: e.target.value})} 
                          />
                      </div>

                      <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1">Valor (R$)</label>
                          <input 
                            type="number" 
                            className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:border-pink-500 outline-none font-bold text-slate-700" 
                            placeholder="0.00" 
                            value={editingReq.estimatedCost || ''} 
                            onChange={e => setEditingReq({...editingReq, estimatedCost: parseFloat(e.target.value)})} 
                          />
                      </div>

                      <div className="pt-4 flex gap-3 border-t border-slate-100 mt-2">
                          <button onClick={() => setIsCreateModalOpen(false)} className="flex-1 py-2.5 text-slate-500 font-bold hover:bg-slate-100 rounded-lg text-sm transition-colors">Cancelar</button>
                          <button onClick={handleSaveReq} className="flex-1 py-2.5 bg-pink-600 text-white font-bold rounded-lg hover:bg-pink-700 text-sm shadow-md transition-colors">Enviar Pedido</button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Modal de Reprovação (Motivo Obrigatório) */}
      {isRejectModalOpen && selectedReqForReject && (
          <div className="fixed inset-0 bg-black/50 z-[110] flex items-center justify-center backdrop-blur-sm p-4" onClick={() => setIsRejectModalOpen(false)}>
              <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-2xl animate-pop border-t-4 border-red-500" onClick={e => e.stopPropagation()}>
                  <div className="flex items-start gap-3 mb-4">
                      <div className="p-2 bg-red-100 rounded-full text-red-600">
                          <AlertTriangle size={24} />
                      </div>
                      <div>
                          <h3 className="text-lg font-bold text-slate-800">Recusar Solicitação</h3>
                          <p className="text-sm text-slate-500">Informe o motivo para notificar o solicitante.</p>
                      </div>
                  </div>
                  
                  <div className="bg-slate-50 p-3 rounded mb-4 text-sm text-slate-600 border border-slate-200">
                      <span className="font-bold">Solicitação:</span> {selectedReqForReject.title}<br/>
                      {selectedReqForReject.estimatedCost > 0 && <><span className="font-bold">Valor:</span> R$ {selectedReqForReject.estimatedCost.toLocaleString()}</>}
                  </div>

                  <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-700 uppercase">Motivo da Recusa <span className="text-red-500">*</span></label>
                      <textarea 
                        className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:border-red-500 focus:ring-1 focus:ring-red-200 outline-none resize-none" 
                        placeholder="Ex: Valor acima do orçamento; Horário indisponível..." 
                        rows={3} 
                        value={rejectionReason} 
                        onChange={e => setRejectionReason(e.target.value)} 
                        autoFocus
                      />
                      {rejectionReason.length > 0 && rejectionReason.length < 3 && (
                          <p className="text-xs text-red-500">Mínimo de 3 caracteres.</p>
                      )}
                  </div>

                  <div className="pt-6 flex gap-3">
                      <button onClick={() => setIsRejectModalOpen(false)} className="flex-1 py-2.5 text-slate-500 font-bold hover:bg-slate-100 rounded-lg text-sm transition-colors">Voltar</button>
                      <button 
                        onClick={confirmRejection} 
                        className="flex-1 py-2.5 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 text-sm shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={rejectionReason.length < 3}
                      >
                          Confirmar Recusa
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
