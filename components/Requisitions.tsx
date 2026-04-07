
import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Requisition, User, Notification, FinancialTransaction, Client } from '../types';
import { Plus, Check, X, ShoppingBag, DollarSign, Clock, Calendar, AlertTriangle, User as UserIcon, Filter, Search, ChevronRight, ReceiptText, Building2 } from 'lucide-react';

interface RequisitionsProps {
  requisitions: Requisition[];
  setRequisitions: React.Dispatch<React.SetStateAction<Requisition[]>>;
  currentUser: User;
  users: User[];
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
  setTransactions: React.Dispatch<React.SetStateAction<FinancialTransaction[]>>;
  clients: Client[];
}

export const Requisitions: React.FC<RequisitionsProps> = ({ 
    requisitions, 
    setRequisitions, 
    currentUser, 
    users, 
    setNotifications,
    setTransactions,
    clients
}) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [selectedReqForReject, setSelectedReqForReject] = useState<Requisition | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [editingReq, setEditingReq] = useState<Partial<Requisition>>({});
  const [filter, setFilter] = useState<'ALL' | 'MY'>('ALL');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const canApprove = currentUser.role === 'ADMIN' || currentUser.role === 'FINANCE';
  const isClient = currentUser.role === 'CLIENT';

  const displayedRequisitions = requisitions.filter(req => {
      const matchesFilter = filter === 'ALL' ? (canApprove || req.requesterId === currentUser.id) : req.requesterId === currentUser.id;
      const matchesSearch = req.title.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesFilter && matchesSearch;
  }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleSaveReq = () => {
      if (!editingReq.title || !editingReq.estimatedCost) return;
      const newReq: Requisition = {
          id: Date.now().toString(),
          requesterId: currentUser.id,
          title: editingReq.title || '',
          description: editingReq.description || '',
          estimatedCost: editingReq.estimatedCost || 0,
          clientId: editingReq.clientId,
          status: 'PENDING',
          date: new Date().toISOString().split('T')[0],
          category: editingReq.category || (isClient ? 'Reembolso' : 'Compra')
      };
      setRequisitions(prev => [newReq, ...prev]);
      setIsCreateModalOpen(false);
      setEditingReq({});
  };

  const handleApproveReq = (req: Requisition) => {
      if (!canApprove || req.status === 'APPROVED') return;
      setProcessingId(req.id);
      setTimeout(() => {
          const now = new Date().toISOString();
          const updatedReq: Requisition = { ...req, status: 'APPROVED', approvedBy: currentUser.id, approvedAt: now };
          setRequisitions(prev => prev.map(r => r.id === req.id ? updatedReq : r));
          
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
          setProcessingId(null);
      }, 600);
  };

  const handleRejectReq = () => {
      if (!selectedReqForReject || !rejectionReason) return;
      const reqToReject = selectedReqForReject;
      setIsRejectModalOpen(false);
      setProcessingId(reqToReject.id);
      setTimeout(() => {
          const updatedReq: Requisition = { ...reqToReject, status: 'REJECTED', rejectedBy: currentUser.id, rejectedAt: new Date().toISOString(), rejectedReason: rejectionReason };
          setRequisitions(prev => prev.map(r => r.id === reqToReject.id ? updatedReq : r));
          setProcessingId(null);
          setSelectedReqForReject(null);
          setRejectionReason('');
      }, 600);
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

            <button 
              onClick={() => { setEditingReq({ category: isClient ? 'Outros' : 'Compra' }); setIsCreateModalOpen(true); }}
              className="px-6 py-3 bg-pink-600 hover:bg-pink-700 text-white font-black text-[10px] uppercase tracking-[0.15em] rounded-2xl transition-all shadow-xl shadow-pink-500/20 flex items-center gap-3 hover:scale-[1.03] active:scale-95 whitespace-nowrap"
            >
              <Plus size={18} strokeWidth={3}/> Nova Solicitação
            </button>
          </div>
        </div>
      </div>

      {/* LISTAGEM DE CARDS */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-10">
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

              return (
                <div key={req.id} className="group bg-white p-5 rounded-[28px] border border-slate-100 hover:border-pink-200 hover:shadow-2xl hover:shadow-slate-200/50 transition-all flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden">
                  {isProcessing && <div className="absolute inset-0 bg-white/80 z-20 flex items-center justify-center backdrop-blur-sm"><Clock className="animate-spin text-pink-600" size={32}/></div>}
                  
                  <div className="flex items-center gap-5 flex-1 min-w-0">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border transition-colors ${req.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : req.status === 'REJECTED' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>
                      {req.category === 'Reembolso' ? <DollarSign size={24}/> : <ShoppingBag size={24}/>}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200 tracking-widest">{req.category}</span>
                        <span className="text-[10px] text-slate-300 font-black">•</span>
                        <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1 uppercase tracking-tight"><Calendar size={12} className="text-slate-300"/> {req.date.split('-').reverse().join('/')}</span>
                      </div>
                      <h4 className="font-black text-slate-800 text-base truncate group-hover:text-pink-600 transition-colors tracking-tight">{req.title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <img src={requester?.avatar} className="w-5 h-5 rounded-full object-cover border border-slate-200" />
                        <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{requester?.name}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-6 bg-slate-50 md:bg-transparent p-4 md:p-0 rounded-2xl border border-slate-100 md:border-none">
                    <div className="text-left md:text-right">
                      <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest leading-none mb-1.5">Valor Total</p>
                      <p className="font-black text-slate-800 text-lg leading-none">R$ {req.estimatedCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>

                    <div className="flex items-center gap-3">
                       <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border shadow-sm ${
                          req.status === 'PENDING' ? 'bg-amber-50 text-amber-600 border-amber-200' : 
                          req.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'
                       }`}>
                         {req.status === 'PENDING' ? 'Aguardando' : req.status === 'APPROVED' ? 'Aprovado' : 'Recusado'}
                       </span>

                      {canApprove && req.status === 'PENDING' ? (
                        <div className="flex gap-2">
                          <button onClick={() => handleApproveReq(req)} title="Aprovar" className="p-2.5 bg-white hover:bg-emerald-600 hover:text-white text-emerald-600 rounded-xl transition-all border border-emerald-200 hover:border-emerald-600 shadow-sm"><Check size={18} strokeWidth={3}/></button>
                          <button onClick={() => { setSelectedReqForReject(req); setIsRejectModalOpen(true); }} title="Recusar" className="p-2.5 bg-white hover:bg-red-600 hover:text-white text-red-600 rounded-xl transition-all border border-red-200 hover:border-red-600 shadow-sm"><X size={18} strokeWidth={3}/></button>
                        </div>
                      ) : (
                        <button className="p-2.5 bg-slate-50 text-slate-300 rounded-xl border border-slate-100 cursor-default"><ChevronRight size={18}/></button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
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
              <div className="bg-white rounded-[32px] w-full h-full shadow-2xl overflow-hidden flex flex-col">
                  <div className="p-6 border-b border-slate-50 bg-white flex items-center justify-between shrink-0">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-pink-50 text-pink-600 rounded-xl"><Plus size={20}/></div>
                        <h3 className="text-xl font-black text-slate-800 tracking-tight uppercase">Novo Pedido</h3>
                      </div>
                      <button onClick={() => setIsCreateModalOpen(false)} className="p-2 text-slate-300 hover:bg-slate-50 rounded-full transition-colors"><X size={20}/></button>
                  </div>
                  
                  <div className="p-8 space-y-5 overflow-y-auto custom-scrollbar flex-1">
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
                                    <option value="Serviço">Terceirização / Freelancer</option>
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
                  </div>

                  <div className="p-6 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row justify-end gap-3 shrink-0">
                      <button onClick={() => setIsCreateModalOpen(false)} className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors">Cancelar</button>
                      <button onClick={handleSaveReq} className="px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-slate-200">Enviar para Análise</button>
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
              <div className="bg-white rounded-[32px] w-full h-full shadow-2xl overflow-hidden border-t-4 border-red-600 border-x border-b border-slate-100 flex flex-col">
                  <div className="p-6 border-b border-slate-50 bg-white flex items-center gap-4 shrink-0">
                      <div className="p-3 bg-red-50 text-red-600 rounded-2xl shadow-sm"><AlertTriangle size={24}/></div>
                      <h3 className="text-xl font-black text-slate-800 tracking-tight uppercase">Negar Pedido</h3>
                  </div>
                  
                  <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1">
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
