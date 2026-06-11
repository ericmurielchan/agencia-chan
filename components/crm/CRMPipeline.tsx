
import React, { useState, useMemo } from 'react';
import { Lead, PipelineStage, User, ConfirmOptions, LossReason } from '../../types';
import { 
    GripVertical, Star, Phone, Mail, MessageSquare, 
    MoreVertical, Plus, Search, Filter, ArrowRight,
    TrendingUp, AlertCircle, CheckCircle2, XCircle,
    User as UserIcon, Calendar, DollarSign, Tag
} from 'lucide-react';

interface CRMPipelineProps {
    leads: Lead[];
    setLeads: React.Dispatch<React.SetStateAction<Lead[]>>;
    stages: PipelineStage[];
    users: User[];
    currentUser: User;
    onEditLead: (lead: Lead) => void;
    onNewLead: (stageId: string) => void;
    onWinLead: (lead: Lead) => void;
    onLoseLead: (lead: Lead) => void;
    onSaveLead?: (lead: Lead) => Promise<void>;
    externalSearchTerm?: string;
}

export const CRMPipeline: React.FC<CRMPipelineProps> = ({ 
    leads, setLeads, stages, users, currentUser, onEditLead, onNewLead, onWinLead, onLoseLead, onSaveLead, externalSearchTerm = ''
}) => {
    const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
    const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null);
    const [dragOverLeadId, setDragOverLeadId] = useState<string | null>(null);

    const filteredLeads = useMemo(() => {
        return leads.filter(l => 
            l.status === 'OPEN' && (
                l.company.toLowerCase().includes(externalSearchTerm.toLowerCase()) ||
                l.name.toLowerCase().includes(externalSearchTerm.toLowerCase())
            )
        );
    }, [leads, externalSearchTerm]);

    const handleDragStart = (e: React.DragEvent, leadId: string) => {
        setDraggedLeadId(leadId);
        e.dataTransfer.setData('leadId', leadId);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = async (e: React.DragEvent, stageId: string) => {
        e.preventDefault();
        setDragOverColumnId(null);
        setDragOverLeadId(null);
        const leadId = e.dataTransfer.getData('leadId') || draggedLeadId;
        if (!leadId) return;

        const leadToUpdate = leads.find(l => l.id === leadId);
        if (!leadToUpdate) return;

        const colLeads = leads
            .filter(l => l.stageId === stageId && l.id !== leadId && l.status === 'OPEN')
            .sort((a, b) => {
                const posA = a.position !== undefined ? a.position : (a.createdAt || 0);
                const posB = b.position !== undefined ? b.position : (b.createdAt || 0);
                return posA - posB;
            });

        let newPosition = 0;
        if (colLeads.length > 0) {
            const firstLeadPos = colLeads[0].position !== undefined ? colLeads[0].position : (colLeads[0].createdAt || 0);
            newPosition = firstLeadPos - 1000;
        } else {
            newPosition = Date.now();
        }

        const updatedLead = { 
            ...leadToUpdate, 
            stageId, 
            position: newPosition,
            updatedAt: Date.now(),
            history: [
                ...leadToUpdate.history,
                {
                    id: Date.now().toString(),
                    userId: currentUser.id,
                    action: `Mudou para etapa: ${stages.find(s => s.id === stageId)?.label}`,
                    timestamp: Date.now()
                }
            ]
        };

        // Optimistic state update in UI
        setLeads(prev => prev.map(l => l.id === leadId ? updatedLead : l));
        setDraggedLeadId(null);

        // Special handling for WON/LOST if stages represent that
        if (stageId === 'WON') onWinLead(updatedLead);
        if (stageId === 'LOST') onLoseLead(updatedLead);
        
        // Fully functional persistence call (external side-effect outside state updater)
        if (onSaveLead) {
            try {
                await onSaveLead(updatedLead);
            } catch (err) {
                console.error("Erro ao salvar mudança de etapa do lead:", err);
                // Rollback state in case of database sync failure
                setLeads(prev => prev.map(l => l.id === leadId ? leadToUpdate : l));
            }
        }
    };

    const handleDropOnLead = async (draggedId: string, targetId: string) => {
        setDragOverColumnId(null);
        setDragOverLeadId(null);
        
        const draggedLead = leads.find(l => l.id === draggedId);
        const targetLead = leads.find(l => l.id === targetId);
        if (!draggedLead || !targetLead) return;
        
        const targetStageId = targetLead.stageId;
        
        // Get all open leads in the target stage sorted, excluding the dragged lead itself
        const colLeads = leads
            .filter(l => l.stageId === targetStageId && l.id !== draggedId && l.status === 'OPEN')
            .sort((a, b) => {
                const posA = a.position !== undefined ? a.position : (a.createdAt || 0);
                const posB = b.position !== undefined ? b.position : (b.createdAt || 0);
                return posA - posB;
            });
            
        const targetIndex = colLeads.findIndex(l => l.id === targetId);
        
        let newPosition = 0;
        if (targetIndex === 0) {
            // If dropped on the first item, insert it before it
            const firstLeadPos = colLeads[0]?.position !== undefined ? colLeads[0].position : (colLeads[0]?.createdAt || 0);
            newPosition = firstLeadPos - 1000;
        } else {
            // Intercalate between the preceding item and the target item
            const prevLead = colLeads[targetIndex - 1];
            const prevLeadPos = prevLead.position !== undefined ? prevLead.position : (prevLead.createdAt || 0);
            const targetLeadPos = targetLead.position !== undefined ? targetLead.position : (targetLead.createdAt || 0);
            newPosition = prevLeadPos + (targetLeadPos - prevLeadPos) / 2;
        }
        
        const updatedLead = {
            ...draggedLead,
            stageId: targetStageId,
            position: newPosition,
            updatedAt: Date.now(),
            history: [
                ...draggedLead.history,
                {
                    id: Date.now().toString(),
                    userId: currentUser.id,
                    action: `Mudou para etapa (com ordenação): ${stages.find(s => s.id === targetStageId)?.label}`,
                    timestamp: Date.now()
                }
            ]
        };
        
        setLeads(prev => prev.map(l => l.id === draggedId ? updatedLead : l));
        setDraggedLeadId(null);
        
        if (targetStageId === 'WON') onWinLead(updatedLead);
        if (targetStageId === 'LOST') onLoseLead(updatedLead);
        
        if (onSaveLead) {
            try {
                await onSaveLead(updatedLead);
            } catch (err) {
                console.error("Erro ao salvar mudança de etapa do lead:", err);
                setLeads(prev => prev.map(l => l.id === draggedId ? draggedLead : l));
            }
        }
    };

    return (
        <div className="h-full flex flex-col overflow-hidden">
            {/* PIPELINE BOARD */}
            <div className="flex-1 flex gap-4 sm:gap-6 overflow-x-auto pb-6 custom-scrollbar items-start min-h-0">
                {stages.map(stage => {
                    const stageLeads = filteredLeads
                        .filter(l => l.stageId === stage.id)
                        .sort((a, b) => {
                            const posA = a.position !== undefined ? a.position : (a.createdAt || 0);
                            const posB = b.position !== undefined ? b.position : (b.createdAt || 0);
                            return posA - posB;
                        });

                    return (
                        <div 
                            key={stage.id} 
                            onDragOver={e => {
                                e.preventDefault();
                                if (dragOverColumnId !== stage.id) {
                                    setDragOverColumnId(stage.id);
                                }
                                if (dragOverLeadId !== null) {
                                    setDragOverLeadId(null);
                                }
                            }}
                            onDrop={(e) => handleDrop(e, stage.id)}
                            className={`flex-shrink-0 w-[280px] sm:w-80 flex flex-col rounded-[28px] sm:rounded-[32px] transition-all duration-200 border ${
                                draggedLeadId && dragOverColumnId === stage.id 
                                    ? 'bg-indigo-50/40 border-indigo-200 shadow-md scale-[1.01]' 
                                    : 'bg-slate-50/50 border-slate-100/50'
                            } min-h-[500px]`}
                        >
                            <div className="p-4 sm:p-5 flex items-center justify-between border-b border-transparent">
                                <div className="flex items-center gap-2 sm:gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                    <h3 className="font-extrabold text-[10px] sm:text-[11px] uppercase tracking-[0.1em] text-slate-700">{stage.label}</h3>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-5 h-5 flex items-center justify-center bg-slate-100 rounded-full font-black text-[10px] text-slate-500">
                                        {stageLeads.length}
                                    </span>
                                    <button 
                                        onClick={() => onNewLead(stage.id)}
                                        className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                                    >
                                        <Plus size={14} />
                                    </button>
                                </div>
                            </div>

                            <div className="p-3 sm:p-4 flex-1 space-y-3 sm:space-y-4 overflow-y-auto custom-scrollbar">
                                {/* Empty Column Drop Target Placeholder or Column Top Target Placeholder */}
                                {draggedLeadId && dragOverColumnId === stage.id && (dragOverLeadId === null || stageLeads.length === 0) && (
                                    <div className="border border-dashed border-indigo-300 bg-indigo-50/20 rounded-[24px] p-4 flex flex-col items-center justify-center text-indigo-500 gap-1 transition-all duration-200 animate-pulse select-none h-24">
                                        <span className="text-[10px] uppercase tracking-[0.2em] font-black">Mover para o topo</span>
                                    </div>
                                )}

                                {stageLeads.map(lead => {
                                    const isOverThisLead = draggedLeadId && dragOverLeadId === lead.id && draggedLeadId !== lead.id;

                                    return (
                                        <React.Fragment key={lead.id}>
                                            {isOverThisLead && (
                                                <div className="border border-dashed border-indigo-300 bg-indigo-50/20 rounded-[24px] p-4 flex flex-col items-center justify-center text-indigo-500 gap-1 transition-all duration-200 animate-pulse select-none h-24">
                                                    <span className="text-[10px] uppercase tracking-[0.2em] font-black">Posicionar aqui</span>
                                                </div>
                                            )}
                                            <div 
                                                draggable
                                                onDragStart={(e) => handleDragStart(e, lead.id)}
                                                onDragEnd={() => {
                                                    setDraggedLeadId(null);
                                                    setDragOverColumnId(null);
                                                    setDragOverLeadId(null);
                                                }}
                                                onClick={() => onEditLead(lead)}
                                                onDragOver={e => {
                                                    if (draggedLeadId === lead.id) return;
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    if (dragOverLeadId !== lead.id) {
                                                        setDragOverLeadId(lead.id);
                                                    }
                                                    if (dragOverColumnId !== stage.id) {
                                                        setDragOverColumnId(stage.id);
                                                    }
                                                }}
                                                onDrop={e => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    if (!draggedLeadId || draggedLeadId === lead.id) return;
                                                    handleDropOnLead(draggedLeadId, lead.id);
                                                }}
                                                className={`bg-white p-5 rounded-[26px] shadow-sm hover:shadow-md border border-slate-100 hover:border-slate-200 transition-all cursor-grab active:cursor-grabbing group ${draggedLeadId === lead.id ? 'opacity-55 scale-[0.98]' : ''}`}
                                            >
                                                <div className="flex justify-between items-start mb-2 sm:mb-3">
                                                    <h4 className="font-extrabold text-sm text-[#1e293b] group-hover:text-indigo-600 transition-colors leading-tight flex-1 tracking-tight truncate">
                                                        {lead.company || lead.name}
                                                    </h4>
                                                    <div className="flex gap-0.5 text-amber-400">
                                                        {[1,2,3].map(s => (
                                                            <Star 
                                                                key={s} 
                                                                size={10} 
                                                                className={s <= (lead.rating || 0) ? "fill-current text-amber-400" : "text-slate-200"} 
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                                
                                                <div className="flex items-center gap-2 mb-4 sm:mb-5">
                                                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 overflow-hidden">
                                                        {lead.responsibleId ? (
                                                            <img 
                                                                src={users.find(u => u.id === lead.responsibleId)?.avatar || 'https://via.placeholder.com/150'} 
                                                                alt="" 
                                                                referrerPolicy="no-referrer"
                                                                className="w-full h-full object-cover" 
                                                            />
                                                        ) : (
                                                            <UserIcon size={12} />
                                                        )}
                                                    </div>
                                                    <span className="text-[11px] text-slate-400 font-semibold truncate">
                                                        {users.find(u => u.id === lead.responsibleId)?.name?.toLowerCase() || 'sem responsável'}
                                                    </span>
                                                </div>

                                                <div className="flex justify-between items-center pt-3 sm:pt-4 border-t border-slate-50/80">
                                                    <div className="flex items-center gap-1.5 text-slate-800 font-extrabold text-xs sm:text-sm">
                                                        <span className="text-[10px] text-slate-400 font-bold">R$</span>
                                                        <span className="text-slate-800 font-black">{(lead.value || 0).toLocaleString('pt-BR')}</span>
                                                    </div>
                                                    
                                                    {/* Mini temperature bar structure matched perfectly to mockup */}
                                                    <div className="flex items-center gap-1 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-full">
                                                        {lead.temperature === 'HOT' && (
                                                            <>
                                                                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" title="Quente" />
                                                                <div className="flex gap-[1.5px]" title="Quente">
                                                                    <span className="w-1 h-1.5 rounded-sm bg-red-400" />
                                                                    <span className="w-1 h-1.5 rounded-sm bg-red-400" />
                                                                    <span className="w-1 h-1.5 rounded-sm bg-red-400" />
                                                                </div>
                                                            </>
                                                        )}
                                                        {lead.temperature === 'WARM' && (
                                                            <>
                                                                <span className="w-1.5 h-1.5 rounded-full bg-orange-400" title="Morno" />
                                                                <div className="flex gap-[1.5px]" title="Morno">
                                                                    <span className="w-1 h-1.5 rounded-sm bg-orange-400" />
                                                                    <span className="w-1 h-1.5 rounded-sm bg-orange-400" />
                                                                    <span className="w-1 h-1.5 rounded-sm bg-slate-200" />
                                                                </div>
                                                            </>
                                                        )}
                                                        {lead.temperature === 'COLD' && (
                                                            <>
                                                                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" title="Frio" />
                                                                <div className="flex gap-[1.5px]" title="Frio">
                                                                    <span className="w-1 h-1.5 rounded-sm bg-blue-400" />
                                                                    <span className="w-1 h-1.5 rounded-sm bg-slate-200" />
                                                                    <span className="w-1 h-1.5 rounded-sm bg-slate-200" />
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* ACTIONABLE INDICATORS ON CARD */}
                                                {(Date.now() - new Date(lead.lastContact).getTime() > 86400000 * 3) && (
                                                    <div className="mt-3 flex items-center gap-1.5 text-[8px] sm:text-[9px] font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-xl">
                                                        <AlertCircle size={10} />
                                                        Sem contato há 3 dias
                                                    </div>
                                                )}
                                            </div>
                                        </React.Fragment>
                                    );
                                })}
                                
                                {stageLeads.length === 0 && (
                                    <div className="h-32 rounded-[24px] border border-dashed border-slate-200/80 flex items-center justify-center text-slate-300 text-xs font-black uppercase tracking-[0.12em] bg-slate-50/10">
                                        Vazio
                                    </div>
                                )}
                            </div>

                            <div className="px-4 py-3 sm:px-5 sm:py-4 border-t border-slate-100/30 bg-transparent rounded-b-[24px] sm:rounded-b-[32px]">
                                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    <span>Total</span>
                                    <span className="text-slate-800 font-bold">R$ {(stageLeads.reduce((acc, l) => acc + (l.value || 0), 0)).toLocaleString('pt-BR')}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
