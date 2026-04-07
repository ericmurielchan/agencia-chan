
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
    externalSearchTerm?: string;
}

export const CRMPipeline: React.FC<CRMPipelineProps> = ({ 
    leads, setLeads, stages, users, currentUser, onEditLead, onNewLead, onWinLead, onLoseLead, externalSearchTerm = ''
}) => {
    const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);

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

    const handleDrop = (e: React.DragEvent, stageId: string) => {
        e.preventDefault();
        const leadId = e.dataTransfer.getData('leadId');
        if (!leadId) return;

        setLeads(prev => prev.map(l => {
            if (l.id === leadId) {
                const updatedLead = { 
                    ...l, 
                    stageId, 
                    updatedAt: Date.now(),
                    history: [
                        ...l.history,
                        {
                            id: Date.now().toString(),
                            userId: currentUser.id,
                            action: `Mudou para etapa: ${stages.find(s => s.id === stageId)?.label}`,
                            timestamp: Date.now()
                        }
                    ]
                };
                
                // Special handling for WON/LOST if stages represent that
                if (stageId === 'WON') onWinLead(updatedLead);
                if (stageId === 'LOST') onLoseLead(updatedLead);
                
                return updatedLead;
            }
            return l;
        }));
        setDraggedLeadId(null);
    };

    return (
        <div className="h-full flex flex-col overflow-hidden">
            {/* PIPELINE BOARD */}
            <div className="flex-1 flex gap-4 sm:gap-6 overflow-x-auto pb-6 custom-scrollbar items-start min-h-0">
                {stages.map(stage => (
                    <div 
                        key={stage.id} 
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, stage.id)}
                        className={`flex-shrink-0 w-[280px] sm:w-80 flex flex-col rounded-[24px] sm:rounded-[32px] border border-slate-100 bg-slate-50/50 min-h-[500px] transition-all ${draggedLeadId ? 'ring-2 ring-indigo-500/5' : ''}`}
                    >
                        <div className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-100">
                            <div className="flex items-center gap-2 sm:gap-3">
                                <div className={`w-2 h-2 rounded-full ${stage.color.replace('bg-', 'bg-')}`} />
                                <h3 className="font-black text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-slate-600">{stage.label}</h3>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[9px] sm:text-[10px] bg-white px-2 py-0.5 rounded-full font-black text-slate-400 border border-slate-100">
                                    {filteredLeads.filter(l => l.stageId === stage.id).length}
                                </span>
                                <button 
                                    onClick={() => onNewLead(stage.id)}
                                    className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                                >
                                    <Plus size={14} />
                                </button>
                            </div>
                        </div>

                        <div className="p-2 sm:p-3 flex-1 space-y-2 sm:space-y-3 overflow-y-auto custom-scrollbar">
                            {filteredLeads.filter(l => l.stageId === stage.id).map(lead => (
                                <div 
                                    key={lead.id} 
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, lead.id)}
                                    onClick={() => onEditLead(lead)}
                                    className={`bg-white p-4 sm:p-5 rounded-[20px] sm:rounded-[24px] shadow-sm border-2 border-transparent hover:border-indigo-200 transition-all cursor-grab active:cursor-grabbing group ${draggedLeadId === lead.id ? 'opacity-50 grayscale' : ''}`}
                                >
                                    <div className="flex justify-between items-start mb-2 sm:mb-3">
                                        <h4 className="font-bold text-xs sm:text-[13px] text-slate-800 group-hover:text-indigo-600 transition-colors leading-tight flex-1 tracking-tight truncate">{lead.company}</h4>
                                        <div className="flex gap-0.5 text-amber-400">
                                            {[1,2,3].map(s => <Star key={s} size={10} fill={s <= (lead.rating || 0) ? "currentColor" : "none"} />)}
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-2 mb-3 sm:mb-4">
                                        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-slate-100 flex items-center justify-center text-[9px] sm:text-[10px] font-bold text-slate-500 overflow-hidden">
                                            {lead.responsibleId ? (
                                                <img src={users.find(u => u.id === lead.responsibleId)?.avatar} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <UserIcon size={10} className="sm:w-3 sm:h-3" />
                                            )}
                                        </div>
                                        <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium truncate">{lead.name}</span>
                                    </div>

                                    <div className="flex justify-between items-center pt-3 sm:pt-4 border-t border-slate-50">
                                        <div className="flex items-center gap-1 text-slate-800 font-black text-xs sm:text-sm">
                                            <span className="text-[9px] sm:text-[10px] text-slate-400 font-bold">R$</span>
                                            {lead.value.toLocaleString()}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {lead.temperature === 'HOT' && <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-red-500" title="Quente" />}
                                            {lead.temperature === 'WARM' && <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-orange-500" title="Morno" />}
                                            {lead.temperature === 'COLD' && <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-blue-500" title="Frio" />}
                                            <span className="text-[7px] sm:text-[8px] font-black uppercase text-slate-400 bg-slate-50 border border-slate-100 px-1.5 sm:px-2 py-0.5 rounded-full tracking-widest">
                                                {lead.source}
                                            </span>
                                        </div>
                                    </div>

                                    {/* ACTIONABLE INDICATORS ON CARD */}
                                    {(Date.now() - new Date(lead.lastContact).getTime() > 86400000 * 3) && (
                                        <div className="mt-2 sm:mt-3 flex items-center gap-1.5 text-[8px] sm:text-[9px] font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-lg">
                                            <AlertCircle size={10} />
                                            Sem contato há 3 dias
                                        </div>
                                    )}
                                </div>
                            ))}
                            
                            {filteredLeads.filter(l => l.stageId === stage.id).length === 0 && (
                                <div className="h-24 sm:h-32 rounded-[20px] sm:rounded-[24px] border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-300 text-[9px] sm:text-[10px] font-black uppercase tracking-widest">
                                    Vazio
                                </div>
                            )}
                        </div>

                        <div className="p-3 sm:p-4 border-t border-slate-100 bg-white/50 rounded-b-[24px] sm:rounded-b-[32px]">
                            <div className="flex justify-between items-center text-[9px] sm:text-[10px] font-black text-slate-400 uppercase">
                                <span>Total</span>
                                <span className="text-slate-800">R$ {filteredLeads.filter(l => l.stageId === stage.id).reduce((acc, l) => acc + l.value, 0).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
