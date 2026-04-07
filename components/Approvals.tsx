
import React, { useState, useMemo } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  MessageSquare, 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  ExternalLink, 
  MoreVertical, 
  ThumbsUp, 
  ThumbsDown, 
  RefreshCw,
  FileText,
  Image as ImageIcon,
  Instagram,
  Send,
  User as UserIcon,
  Calendar,
  Layers,
  Eye,
  Plus,
  TrendingUp,
  Video,
  Camera,
  MoreHorizontal,
  X,
  Upload
} from 'lucide-react';
import { 
  ApprovalBatch, 
  ApprovalItem, 
  ApprovalStatus, 
  ApprovalCategory, 
  ApprovalComment,
  User,
  Client,
  Notification,
  Squad
} from '../types';
import { convertDriveLink, fileToBase64 } from '../utils/fileUtils';

interface ApprovalsProps {
  currentUser: User;
  users: User[];
  clients: Client[];
  batches: ApprovalBatch[];
  setBatches: React.Dispatch<React.SetStateAction<ApprovalBatch[]>>;
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
  squads: Squad[];
  selectedBatchId: string | null;
  setSelectedBatchId: (id: string | null) => void;
  selectedItemId: string | null;
  setSelectedItemId: (id: string | null) => void;
}

export const Approvals: React.FC<ApprovalsProps> = ({ 
  currentUser, 
  users, 
  clients, 
  batches, 
  setBatches,
  setNotifications,
  squads,
  selectedBatchId,
  setSelectedBatchId,
  selectedItemId,
  setSelectedItemId
}) => {
  const [commentText, setCommentText] = useState('');
  const commentsEndRef = React.useRef<HTMLDivElement>(null);
  const [isNewBatchModalOpen, setIsNewBatchModalOpen] = useState(false);
  const [newBatchTitle, setNewBatchTitle] = useState('');
  const [newBatchClientId, setNewBatchClientId] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [newItem, setNewItem] = useState({
    title: '',
    category: 'SOCIAL_MEDIA' as ApprovalCategory,
    files: [''],
    caption: ''
  });

  React.useEffect(() => {
    if (selectedItemId && commentsEndRef.current) {
      commentsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedItemId]);

  const handleAddFileField = () => {
    setNewItem(prev => ({ ...prev, files: [...prev.files, ''] }));
  };

  const handleRemoveFileField = (index: number) => {
    setNewItem(prev => ({ ...prev, files: prev.files.filter((_, i) => i !== index) }));
  };

  const handleFileChange = (index: number, value: string) => {
    setNewItem(prev => {
      const newFiles = [...prev.files];
      newFiles[index] = value;
      return { ...prev, files: newFiles };
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles = [...newItem.files];
    
    for (let i = 0; i < files.length; i++) {
      try {
        const base64 = await fileToBase64(files[i]);
        // If the last field is empty, fill it. Otherwise, add a new field.
        const emptyIndex = newFiles.findIndex(f => !f);
        if (emptyIndex !== -1) {
          newFiles[emptyIndex] = base64;
        } else {
          newFiles.push(base64);
        }
      } catch (error) {
        console.error("Error uploading file:", error);
      }
    }

    setNewItem(prev => ({ ...prev, files: newFiles }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const displayBatches = useMemo(() => {
    let filtered = batches;
    
    if (currentUser.role === 'CLIENT') {
      filtered = batches.filter(b => b.clientId === currentUser.clientId);
      if (showHistory) {
        return filtered.filter(b => b.status === 'COMPLETED');
      } else {
        return filtered.filter(b => b.status === 'SENT');
      }
    } else if (currentUser.role === 'EMPLOYEE' || currentUser.role === 'FREELANCER') {
      // Visibility restricted to clients in the same squad
      filtered = batches.filter(b => {
        const client = clients.find(c => c.id === b.clientId);
        return client?.squadId === currentUser.squad;
      });
    }
    
    if (showHistory) {
      return filtered.filter(b => b.status === 'COMPLETED');
    } else {
      return filtered.filter(b => b.status !== 'COMPLETED');
    }
  }, [batches, currentUser.clientId, currentUser.role, currentUser.squad, clients, showHistory]);

  const selectedBatch = batches.find(b => b.id === selectedBatchId);
  const selectedItem = selectedBatch?.items.find(i => i.id === selectedItemId);

  const getClientName = (clientId: string) => {
    return clients.find(c => c.id === clientId)?.name || 'Cliente Desconhecido';
  };

  const handleCreateBatch = () => {
    if (!newBatchTitle || !newBatchClientId) return;

    const newBatch: ApprovalBatch = {
      id: `b-${Date.now()}`,
      title: newBatchTitle,
      clientId: newBatchClientId,
      status: 'OPEN',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      items: []
    };

    setBatches(prev => [newBatch, ...prev]);
    setIsNewBatchModalOpen(false);
    setNewBatchTitle('');
    setNewBatchClientId('');
    setSelectedBatchId(newBatch.id); // Go to the new batch immediately
  };

  const handleAddItem = () => {
    if (!selectedBatchId || !newItem.title) return;

    const approvalItem: ApprovalItem = {
      id: `i-${Date.now()}`,
      title: newItem.title,
      category: newItem.category,
      status: 'PENDING',
      files: newItem.files,
      caption: newItem.caption,
      comments: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    setBatches(prev => prev.map(b => {
      if (b.id !== selectedBatchId) return b;
      return {
        ...b,
        items: [...b.items, approvalItem],
        updatedAt: Date.now()
      };
    }));

    setIsAddItemModalOpen(false);
    setNewItem({
      title: '',
      category: 'SOCIAL_MEDIA',
      files: [''],
      caption: ''
    });
  };

  const handleSendBatch = (batchId: string) => {
    setBatches(prev => prev.map(b => {
      if (b.id !== batchId) return b;
      return { ...b, status: 'SENT', updatedAt: Date.now() };
    }));
  };

  const handleCompleteBatch = (batchId: string) => {
    setBatches(prev => prev.map(b => {
      if (b.id !== batchId) return b;
      return { ...b, status: 'COMPLETED', updatedAt: Date.now() };
    }));
    setSelectedBatchId(null);
  };

  // Group batches by client for non-client users
  const groupedBatches = useMemo(() => {
    if (currentUser.role === 'CLIENT') return null;
    const groups: Record<string, ApprovalBatch[]> = {};
    displayBatches.forEach(batch => {
      if (!groups[batch.clientId]) groups[batch.clientId] = [];
      groups[batch.clientId].push(batch);
    });
    return groups;
  }, [displayBatches, currentUser.role]);

  const getStatusBadge = (status: ApprovalStatus | string) => {
    switch (status) {
      case 'APPROVED':
      case 'COMPLETED':
        return <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-wider flex items-center gap-1"><CheckCircle2 size={10} /> Aprovado</span>;
      case 'REJECTED':
        return <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-black uppercase tracking-wider flex items-center gap-1"><AlertCircle size={10} /> Rejeitado</span>;
      case 'ADJUSTMENT':
        return <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-black uppercase tracking-wider flex items-center gap-1"><RefreshCw size={10} /> Ajustes</span>;
      case 'SENT':
        return <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-black uppercase tracking-wider flex items-center gap-1"><Send size={10} /> Enviado</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-wider flex items-center gap-1"><Clock size={10} /> Pendente</span>;
    }
  };

  const handleUpdateItemStatus = (batchId: string, itemId: string, status: ApprovalStatus) => {
    setBatches(prev => prev.map(batch => {
      if (batch.id !== batchId) return batch;
      return {
        ...batch,
        items: batch.items.map(item => {
          if (item.id !== itemId) return item;
          return { ...item, status, updatedAt: Date.now() };
        })
      };
    }));
  };

  const handleAddComment = (batchId: string, itemId: string, text: string, pageNumber?: number) => {
    const batch = batches.find(b => b.id === batchId);
    const item = batch?.items.find(i => i.id === itemId);
    if (!batch || !item) return;

    const newComment: ApprovalComment = {
      id: Math.random().toString(36).substr(2, 9),
      userId: currentUser.id,
      text,
      timestamp: Date.now(),
      pageNumber
    };

    setBatches(prev => prev.map(b => {
      if (b.id !== batchId) return b;
      return {
        ...b,
        items: b.items.map(i => {
          if (i.id !== itemId) return i;
          return {
            ...i,
            comments: [...i.comments, newComment],
            updatedAt: Date.now()
          };
        })
      };
    }));

    // Notification Logic
    const client = clients.find(c => c.id === batch.clientId);
    const squad = squads.find(s => s.id === client?.squadId);
    
    const clientUsers = users.filter(u => u.role === 'CLIENT' && u.clientId === batch.clientId);
    const squadMembers = users.filter(u => squad?.members.includes(u.id));
    const managers = users.filter(u => u.role === 'ADMIN' || u.role === 'MANAGER');

    let targetUsers: User[] = [];

    if (currentUser.role === 'CLIENT') {
      // Comentário do cliente -> notificar: responsável pela peça (squad), gerência
      targetUsers = [...squadMembers, ...managers];
    } else if (currentUser.role === 'EMPLOYEE' || currentUser.role === 'FREELANCER') {
      // Comentário da produção -> notificar: cliente, gerência
      targetUsers = [...clientUsers, ...managers];
    } else if (currentUser.role === 'ADMIN' || currentUser.role === 'MANAGER') {
      // Comentário da gerência -> notificar: cliente, responsável pela peça (squad)
      targetUsers = [...clientUsers, ...squadMembers];
    }

    // Filter out the author and duplicates
    const uniqueTargets = Array.from(new Set(targetUsers.map(u => u.id)))
      .filter(id => id !== currentUser.id)
      .map(id => users.find(u => u.id === id))
      .filter((u): u is User => !!u);

    const newNotifications: Notification[] = uniqueTargets.map(target => ({
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      title: 'Novo Comentário',
      message: `${currentUser.name} comentou em "${item.title}" (${client?.name})`,
      type: 'INFO',
      priority: 'MEDIUM',
      status: 'UNREAD',
      originModule: 'APPROVALS',
      timestamp: Date.now(),
      targetUserId: target.id,
      navToView: 'approvals',
      metadata: {
        batchId,
        itemId,
        action: 'COMMENT'
      }
    }));

    if (newNotifications.length > 0) {
      setNotifications(prev => [...newNotifications, ...prev]);
    }
  };

  if (selectedItem && selectedBatch) {
    return (
      <div className="flex flex-col h-full bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSelectedItemId(null)}
              className="p-2 hover:bg-slate-200 rounded-xl transition-colors text-slate-600"
            >
              <ChevronLeft size={20} />
            </button>
            <div>
              <h3 className="text-sm font-black text-slate-800 tracking-tight">{selectedItem.title}</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{selectedBatch.title} • {getClientName(selectedBatch.clientId)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(selectedItem.status)}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
          {/* Main Preview Area */}
          <div className="flex-1 bg-slate-100 overflow-y-auto p-4 md:p-8 flex items-center justify-center">
            {selectedItem.category === 'SOCIAL_MEDIA' && (
              <SocialMediaPreview item={selectedItem} />
            )}
            {selectedItem.category === 'DESIGN' && (
              <DesignPreview item={selectedItem} />
            )}
            {selectedItem.category === 'PDF' && (
              <PdfPreview item={selectedItem} onUpdateStatus={(status) => handleUpdateItemStatus(selectedBatch.id, selectedItem.id, status)} />
            )}
          </div>

          {/* Sidebar: Info & Comments */}
          <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l bg-white flex flex-col">
            <div className="p-6 border-b">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Ações</h4>
              <div className="grid grid-cols-2 gap-2">
                {(currentUser.role === 'ADMIN' || currentUser.role === 'MANAGER' || currentUser.role === 'CLIENT') && (
                  <>
                    <button 
                      onClick={() => handleUpdateItemStatus(selectedBatch.id, selectedItem.id, 'APPROVED')}
                      className={`flex items-center justify-center gap-2 py-3 rounded-2xl font-black text-[11px] uppercase tracking-wider transition-all ${selectedItem.status === 'APPROVED' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
                    >
                      <ThumbsUp size={14} /> Aprovar
                    </button>
                    <button 
                      onClick={() => handleUpdateItemStatus(selectedBatch.id, selectedItem.id, 'REJECTED')}
                      className={`flex items-center justify-center gap-2 py-3 rounded-2xl font-black text-[11px] uppercase tracking-wider transition-all ${selectedItem.status === 'REJECTED' ? 'bg-red-500 text-white shadow-lg shadow-red-200' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
                    >
                      <ThumbsDown size={14} /> Rejeitar
                    </button>
                  </>
                )}
                <button 
                  onClick={() => handleUpdateItemStatus(selectedBatch.id, selectedItem.id, 'ADJUSTMENT')}
                  className={`col-span-2 flex items-center justify-center gap-2 py-3 rounded-2xl font-black text-[11px] uppercase tracking-wider transition-all ${selectedItem.status === 'ADJUSTMENT' ? 'bg-amber-500 text-white shadow-lg shadow-amber-200' : 'bg-amber-50 text-amber-600 hover:bg-amber-100'}`}
                >
                  <RefreshCw size={14} /> Solicitar Ajustes
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Comentários</h4>
              <div className="space-y-4">
                {selectedItem.comments.length > 0 ? (
                  selectedItem.comments.map(comment => {
                    const user = users.find(u => u.id === comment.userId);
                    return (
                      <div key={comment.id} className="flex gap-3">
                        <img src={user?.avatar} className="w-8 h-8 rounded-xl object-cover shrink-0" alt="" />
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-baseline mb-1">
                            <span className="text-[11px] font-black text-slate-800">{user?.name}</span>
                            <span className="text-[9px] text-slate-400 font-bold">{new Date(comment.timestamp).toLocaleDateString()}</span>
                          </div>
                          <div className="bg-slate-50 p-3 rounded-2xl rounded-tl-none">
                            <p className="text-[11px] text-slate-600 leading-relaxed">{comment.text}</p>
                            {comment.pageNumber && (
                              <span className="inline-block mt-2 px-2 py-0.5 bg-slate-200 text-slate-600 text-[8px] font-black uppercase tracking-widest rounded-md">Pág. {comment.pageNumber}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8">
                    <MessageSquare size={24} className="mx-auto text-slate-200 mb-2" />
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Nenhum comentário</p>
                  </div>
                )}
                <div ref={commentsEndRef} />
              </div>
            </div>

            <div className="p-4 border-t bg-slate-50/50">
              <div className="relative">
                <textarea 
                  placeholder="Escreva um comentário..."
                  className="w-full bg-white border border-slate-200 rounded-2xl p-3 pr-12 text-[11px] font-medium focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none resize-none min-h-[80px]"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (commentText.trim()) {
                        handleAddComment(selectedBatch.id, selectedItem.id, commentText.trim());
                        setCommentText('');
                      }
                    }
                  }}
                />
                <button 
                  onClick={() => {
                    if (commentText.trim()) {
                      handleAddComment(selectedBatch.id, selectedItem.id, commentText.trim());
                      setCommentText('');
                    }
                  }}
                  className="absolute bottom-3 right-3 p-2 bg-pink-600 text-white rounded-xl hover:bg-pink-700 transition-colors"
                >
                  <Send size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (selectedBatch) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSelectedBatchId(null)}
              className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 shadow-sm hover:bg-slate-50 transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight">{selectedBatch.title}</h2>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{getClientName(selectedBatch.clientId)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {selectedBatch.status === 'OPEN' && currentUser.role !== 'CLIENT' && (
              <button 
                onClick={() => setIsAddItemModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-pink-50 text-pink-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-pink-100 transition-all"
              >
                <Plus size={14} /> Adicionar Item
              </button>
            )}
            {selectedBatch.status === 'OPEN' && selectedBatch.items.length > 0 && currentUser.role !== 'CLIENT' && (
              <button 
                onClick={() => handleSendBatch(selectedBatch.id)}
                className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-pink-700 transition-all shadow-lg shadow-pink-200"
              >
                <Send size={14} /> Enviar para Cliente
              </button>
            )}
            {selectedBatch.status === 'SENT' && currentUser.role !== 'CLIENT' && (
              <button 
                onClick={() => handleCompleteBatch(selectedBatch.id)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
              >
                <CheckCircle2 size={14} /> Finalizar Lote
              </button>
            )}
            {getStatusBadge(selectedBatch.status)}
            <button className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400">
              <MoreVertical size={20} />
            </button>
          </div>
        </div>

        {selectedBatch.items.length === 0 ? (
          <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[32px] p-20 text-center">
            <div className="w-20 h-20 bg-white rounded-3xl shadow-sm flex items-center justify-center mx-auto mb-6 text-slate-200">
              <Layers size={40} />
            </div>
            <h3 className="text-xl font-black text-slate-800 tracking-tight">Lote Vazio</h3>
            <p className="text-slate-500 font-medium mt-2 max-w-xs mx-auto">
              Este lote ainda não possui itens para aprovação. Adicione peças para enviar ao cliente.
            </p>
            {currentUser.role !== 'CLIENT' && (
              <button 
                onClick={() => setIsAddItemModalOpen(true)}
                className="mt-8 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl"
              >
                Adicionar Primeira Peça
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {selectedBatch.items.map(item => (
              <div 
                key={item.id}
                onClick={() => setSelectedItemId(item.id)}
                className="group bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-pink-100 transition-all cursor-pointer overflow-hidden flex flex-col"
              >
                <div className="aspect-square bg-slate-100 relative overflow-hidden">
                  <img 
                    src={item.files[0]} 
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                    <span className="text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                      <Eye size={14} /> Visualizar Detalhes
                    </span>
                  </div>
                  <div className="absolute top-3 left-3">
                    {item.category === 'SOCIAL_MEDIA' && <span className="p-2 bg-white/90 backdrop-blur rounded-xl text-pink-600 shadow-sm"><Instagram size={14} /></span>}
                    {item.category === 'DESIGN' && <span className="p-2 bg-white/90 backdrop-blur rounded-xl text-blue-600 shadow-sm"><ImageIcon size={14} /></span>}
                    {item.category === 'PDF' && <span className="p-2 bg-white/90 backdrop-blur rounded-xl text-red-600 shadow-sm"><FileText size={14} /></span>}
                    {item.category === 'TRAFFIC' && <span className="p-2 bg-white/90 backdrop-blur rounded-xl text-emerald-600 shadow-sm"><TrendingUp size={14} /></span>}
                    {item.category === 'VIDEO' && <span className="p-2 bg-white/90 backdrop-blur rounded-xl text-purple-600 shadow-sm"><Video size={14} /></span>}
                    {item.category === 'SHOOTING' && <span className="p-2 bg-white/90 backdrop-blur rounded-xl text-orange-600 shadow-sm"><Camera size={14} /></span>}
                    {item.category === 'OTHERS' && <span className="p-2 bg-white/90 backdrop-blur rounded-xl text-slate-600 shadow-sm"><MoreHorizontal size={14} /></span>}
                  </div>
                  <div className="absolute top-3 right-3">
                    {getStatusBadge(item.status)}
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="text-sm font-black text-slate-800 mb-1 truncate">{item.title}</h3>
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2">
                        {item.comments.slice(0, 3).map(c => {
                          const u = users.find(user => user.id === c.userId);
                          return <img key={c.id} src={u?.avatar} className="w-6 h-6 rounded-lg border-2 border-white object-cover" alt="" />;
                        })}
                      </div>
                      {item.comments.length > 0 && (
                        <span className="text-[10px] font-bold text-slate-400">+{item.comments.length}</span>
                      )}
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {new Date(item.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Item Modal */}
        {isAddItemModalOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
              <div className="p-8 overflow-y-auto custom-scrollbar">
                <h2 className="text-2xl font-black text-slate-800 tracking-tight mb-2">Adicionar Peça</h2>
                <p className="text-slate-500 text-sm mb-8 font-medium">Insira os detalhes da peça. Você pode adicionar múltiplos links para carrosséis.</p>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Título da Peça</label>
                      <input 
                        type="text" 
                        placeholder="Ex: Post 01 - Lançamento"
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-pink-500 outline-none transition-all"
                        value={newItem.title}
                        onChange={(e) => setNewItem(prev => ({ ...prev, title: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Categoria</label>
                      <select 
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-pink-500 outline-none transition-all"
                        value={newItem.category}
                        onChange={(e) => setNewItem(prev => ({ ...prev, category: e.target.value as ApprovalCategory }))}
                      >
                        <option value="SOCIAL_MEDIA">Social Media</option>
                        <option value="DESIGN">Design</option>
                        <option value="PDF">PDF / Documento</option>
                        <option value="TRAFFIC">Tráfego</option>
                        <option value="VIDEO">Vídeo</option>
                        <option value="SHOOTING">Captação</option>
                        <option value="OTHERS">Outros</option>
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Arquivos da Peça (Imagens/Vídeos)</label>
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                      >
                        <Upload size={14} /> Selecionar Arquivos
                      </button>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        multiple 
                        accept="image/*,video/*,application/pdf"
                        onChange={handleFileUpload}
                      />
                    </div>
                    
                    {newItem.files.length > 0 && newItem.files.some(f => f) ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {newItem.files.filter(f => f).map((file, idx) => (
                          <div key={idx} className="group relative aspect-square rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden">
                            <img src={file} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                            <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <button 
                                onClick={() => handleRemoveFileField(idx)}
                                className="p-2 bg-white text-red-600 rounded-full shadow-lg hover:scale-110 transition-transform"
                              >
                                <X size={16} />
                              </button>
                            </div>
                            <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/50 backdrop-blur text-white text-[8px] font-black rounded-md">
                              Slide {idx + 1}
                            </div>
                          </div>
                        ))}
                        <button 
                          onClick={() => fileInputRef.current?.click()}
                          className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-pink-300 hover:text-pink-500 hover:bg-pink-50 transition-all"
                        >
                          <Plus size={24} />
                          <span className="text-[10px] font-black uppercase tracking-widest">Adicionar</span>
                        </button>
                      </div>
                    ) : (
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="py-12 border-2 border-dashed border-slate-200 rounded-[32px] flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-slate-50 hover:border-slate-300 transition-all"
                      >
                        <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-slate-300">
                          <Upload size={32} />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-bold text-slate-700">Clique para fazer upload</p>
                          <p className="text-xs text-slate-400 mt-1">Suporta múltiplas imagens para carrossel</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {newItem.category === 'SOCIAL_MEDIA' && (
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Legenda Sugerida</label>
                      <textarea 
                        rows={4}
                        placeholder="Escreva a legenda que acompanhará o post..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-pink-500 outline-none transition-all resize-none"
                        value={newItem.caption}
                        onChange={(e) => setNewItem(prev => ({ ...prev, caption: e.target.value }))}
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 mt-10">
                  <button 
                    onClick={() => setIsAddItemModalOpen(false)}
                    className="py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleAddItem}
                    disabled={!newItem.title || newItem.files.every(f => !f)}
                    className="py-4 bg-pink-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-pink-700 transition-all shadow-lg shadow-pink-200 disabled:opacity-50"
                  >
                    Salvar Peça
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">Solicitações & Aprovações</h1>
          <p className="text-slate-500 font-medium mt-1">Gerencie e aprove entregas de forma organizada.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowHistory(!showHistory)}
            className={`flex items-center gap-2 px-5 py-3 border rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-sm ${showHistory ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
          >
            <Calendar size={16} /> {showHistory ? 'Ver Ativos' : 'Histórico'}
          </button>
          {(currentUser.role === 'ADMIN' || currentUser.role === 'MANAGER' || currentUser.role === 'EMPLOYEE' || currentUser.role === 'FREELANCER') && (
            <button 
              onClick={() => setIsNewBatchModalOpen(true)}
              className="flex items-center gap-2 px-5 py-3 bg-pink-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-pink-700 transition-all shadow-lg shadow-pink-200"
            >
              <Layers size={16} /> Novo Lote
            </button>
          )}
        </div>
      </div>

      <div className="space-y-12">
        {currentUser.role === 'CLIENT' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayBatches.map(batch => (
              <BatchCard key={batch.id} batch={batch} onClick={() => setSelectedBatchId(batch.id)} getStatusBadge={getStatusBadge} getClientName={getClientName} />
            ))}
          </div>
        ) : (
          (Object.entries(groupedBatches || {}) as [string, ApprovalBatch[]][]).map(([clientId, clientBatches]) => (
            <div key={clientId} className="space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black">
                  {getClientName(clientId).charAt(0)}
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-800 tracking-tight">{getClientName(clientId)}</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{clientBatches.length} lotes de aprovação</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {clientBatches.map(batch => (
                  <BatchCard key={batch.id} batch={batch} onClick={() => setSelectedBatchId(batch.id)} getStatusBadge={getStatusBadge} getClientName={getClientName} />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* New Batch Modal */}
      {isNewBatchModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8">
              <h2 className="text-2xl font-black text-slate-800 tracking-tight mb-2">Criar Novo Lote</h2>
              <p className="text-slate-500 text-sm mb-8 font-medium">Organize suas entregas em um novo lote de aprovação.</p>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Título do Lote</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Posts Abril - Semana 2"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all"
                    value={newBatchTitle}
                    onChange={(e) => setNewBatchTitle(e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Cliente</label>
                  <select 
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all"
                    value={newBatchClientId}
                    onChange={(e) => setNewBatchClientId(e.target.value)}
                  >
                    <option value="">Selecione um cliente</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>{client.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-10">
                <button 
                  onClick={() => setIsNewBatchModalOpen(false)}
                  className="py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleCreateBatch}
                  disabled={!newBatchTitle || !newBatchClientId}
                  className="py-4 bg-pink-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-pink-700 transition-all shadow-lg shadow-pink-200 disabled:opacity-50 disabled:shadow-none"
                >
                  Criar Lote
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const BatchCard: React.FC<{ 
  batch: ApprovalBatch, 
  onClick: () => void, 
  getStatusBadge: (status: string) => React.ReactNode,
  getClientName: (clientId: string) => string
}> = ({ batch, onClick, getStatusBadge, getClientName }) => {
  return (
    <div 
      onClick={onClick}
      className="group bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm hover:shadow-2xl hover:border-pink-100 transition-all cursor-pointer relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 p-6">
        <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-pink-50 group-hover:text-pink-500 transition-colors">
          <ChevronRight size={20} />
        </div>
      </div>

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          {getStatusBadge(batch.status)}
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">• {batch.items.length} itens</span>
        </div>
        <h3 className="text-lg font-black text-slate-800 tracking-tight group-hover:text-pink-600 transition-colors">{batch.title}</h3>
        <div className="flex items-center gap-2 mt-2">
          <div className="w-5 h-5 rounded-md bg-slate-100 flex items-center justify-center text-slate-400">
            <UserIcon size={12} />
          </div>
          <span className="text-xs font-bold text-slate-500">{getClientName(batch.clientId)}</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-6 border-t border-slate-50">
        <div className="flex -space-x-3">
          {batch.items.slice(0, 4).map((item, idx) => (
            <div key={item.id} className="w-10 h-10 rounded-2xl border-4 border-white overflow-hidden bg-slate-100 shadow-sm">
              <img src={item.files[0]} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
            </div>
          ))}
          {batch.items.length > 4 && (
            <div className="w-10 h-10 rounded-2xl border-4 border-white bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500 shadow-sm">
              +{batch.items.length - 4}
            </div>
          )}
        </div>
        <div className="text-right">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Última atualização</p>
          <p className="text-[11px] font-bold text-slate-600">{new Date(batch.updatedAt).toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
};

// --- Sub-components for Previews ---

const SocialMediaPreview: React.FC<{ item: ApprovalItem }> = ({ item }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  return (
    <div className="max-w-md w-full bg-white rounded-[32px] shadow-2xl overflow-hidden border border-slate-100">
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-slate-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 p-0.5">
            <div className="w-full h-full rounded-full border-2 border-white bg-slate-200 overflow-hidden">
              <img src="https://picsum.photos/seed/agency/100/100" alt="" />
            </div>
          </div>
          <span className="text-xs font-black text-slate-800">sua_agencia</span>
        </div>
        <MoreVertical size={16} className="text-slate-400" />
      </div>

      {/* Image / Carousel */}
      <div className="aspect-square bg-slate-100 relative group">
        <img 
          src={item.files[currentSlide]} 
          className="w-full h-full object-cover" 
          alt="" 
          referrerPolicy="no-referrer"
        />
        
        {item.files.length > 1 && (
          <>
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5">
              {item.files.map((_, idx) => (
                <div 
                  key={idx} 
                  className={`w-1.5 h-1.5 rounded-full transition-all ${idx === currentSlide ? 'bg-white w-4' : 'bg-white/50'}`}
                />
              ))}
            </div>
            <button 
              onClick={() => setCurrentSlide(prev => Math.max(0, prev - 1))}
              className={`absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 backdrop-blur flex items-center justify-center text-slate-800 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity ${currentSlide === 0 ? 'hidden' : ''}`}
            >
              <ChevronLeft size={16} />
            </button>
            <button 
              onClick={() => setCurrentSlide(prev => Math.min(item.files.length - 1, prev + 1))}
              className={`absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 backdrop-blur flex items-center justify-center text-slate-800 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity ${currentSlide === item.files.length - 1 ? 'hidden' : ''}`}
            >
              <ChevronRight size={16} />
            </button>
          </>
        )}
      </div>

      {/* Actions */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <ThumbsUp size={22} className="text-slate-800" />
          <MessageSquare size={22} className="text-slate-800" />
          <Send size={22} className="text-slate-800" />
        </div>
        <Download size={22} className="text-slate-800" />
      </div>

      {/* Caption */}
      <div className="px-4 pb-6">
        <p className="text-xs text-slate-800 leading-relaxed">
          <span className="font-black mr-2">sua_agencia</span>
          {item.caption || "Sem legenda definida."}
        </p>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-3">Ver todos os comentários</p>
      </div>
    </div>
  );
};

const DesignPreview: React.FC<{ item: ApprovalItem }> = ({ item }) => {
  return (
    <div className="max-w-4xl w-full space-y-4">
      <div className="bg-white p-2 rounded-[32px] shadow-2xl border border-slate-100 overflow-hidden">
        <img 
          src={item.files[0]} 
          className="w-full h-auto rounded-[24px]" 
          alt={item.title} 
          referrerPolicy="no-referrer"
        />
      </div>
      <div className="flex justify-center gap-4">
        <button className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl text-slate-600 font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">
          <Download size={16} /> Download Original
        </button>
        <button className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl text-slate-600 font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">
          <ExternalLink size={16} /> Abrir em nova aba
        </button>
      </div>
    </div>
  );
};

const PdfPreview: React.FC<{ item: ApprovalItem, onUpdateStatus: (status: ApprovalStatus) => void }> = ({ item, onUpdateStatus }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = item.pages?.length || 1;

  return (
    <div className="max-w-5xl w-full flex flex-col gap-6 h-full">
      {/* PDF Controls */}
      <div className="bg-white/80 backdrop-blur p-3 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className="p-2 hover:bg-slate-100 rounded-xl disabled:opacity-30 transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-xs font-black text-slate-700 w-16 text-center">
              {currentPage} / {totalPages}
            </span>
            <button 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              className="p-2 hover:bg-slate-100 rounded-xl disabled:opacity-30 transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
          <div className="h-6 w-px bg-slate-200" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Página {currentPage}: {item.pages?.[currentPage-1]?.status || 'PENDENTE'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-600">
            <Download size={18} />
          </button>
          <button className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-600">
            <ExternalLink size={18} />
          </button>
        </div>
      </div>

      {/* PDF Page View */}
      <div className="flex-1 bg-white rounded-[32px] shadow-2xl border border-slate-100 overflow-hidden relative flex items-center justify-center">
        {/* Mock PDF Page Content */}
        <div className="w-full h-full flex flex-col items-center justify-center p-12 text-center">
          <div className="w-full max-w-2xl aspect-[1/1.414] bg-slate-50 border border-slate-200 rounded-lg shadow-inner flex flex-col items-center justify-center p-8">
            <FileText size={64} className="text-slate-200 mb-4" />
            <h3 className="text-lg font-black text-slate-400 uppercase tracking-tight mb-2">Preview da Página {currentPage}</h3>
            <p className="text-xs text-slate-300 font-medium max-w-xs">O arquivo PDF real seria renderizado aqui usando uma biblioteca como react-pdf.</p>
            
            {/* Mock content for visualization */}
            <div className="mt-8 w-full space-y-3">
              <div className="h-4 bg-slate-100 rounded-full w-3/4 mx-auto" />
              <div className="h-4 bg-slate-100 rounded-full w-1/2 mx-auto" />
              <div className="h-4 bg-slate-100 rounded-full w-2/3 mx-auto" />
              <div className="h-32 bg-slate-100 rounded-2xl w-full mt-4" />
            </div>
          </div>
        </div>

        {/* Page Status Overlay */}
        <div className="absolute top-6 right-6">
          <div className={`px-4 py-2 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg ${
            item.pages?.[currentPage-1]?.status === 'APPROVED' ? 'bg-emerald-500 text-white' :
            item.pages?.[currentPage-1]?.status === 'REJECTED' ? 'bg-red-500 text-white' :
            'bg-white text-slate-600'
          }`}>
            Status: {item.pages?.[currentPage-1]?.status || 'PENDENTE'}
          </div>
        </div>
      </div>

      {/* Page Actions */}
      <div className="flex justify-center gap-4 pb-4">
        <button 
          onClick={() => onUpdateStatus('APPROVED')}
          className="flex items-center gap-2 px-8 py-4 bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-200"
        >
          <ThumbsUp size={16} /> Aprovar Página {currentPage}
        </button>
        <button 
          onClick={() => onUpdateStatus('REJECTED')}
          className="flex items-center gap-2 px-8 py-4 bg-red-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg shadow-red-200"
        >
          <ThumbsDown size={16} /> Rejeitar Página {currentPage}
        </button>
      </div>
    </div>
  );
};
