
import React, { useState, useMemo } from 'react';
import { AgencyService, ServiceDelivery, TaskTemplate, User, ConfirmOptions } from '../types';
import { 
    Plus, Edit2, Trash2, ShoppingBag, CheckCircle, XCircle, X, 
    Layers, Clock, FileText, DollarSign, Tag, Info, 
    ChevronRight, Layout, ListChecks, MessageSquare, Eye,
    AlertCircle, Search, Filter, MoreHorizontal, ArrowRight
} from 'lucide-react';

interface ServiceCatalogProps {
    services: AgencyService[];
    setServices: React.Dispatch<React.SetStateAction<AgencyService[]>>;
    currentUser: User;
    openConfirm: (options: ConfirmOptions) => Promise<boolean>;
}

type ServiceTab = 'GENERAL' | 'DELIVERIES' | 'TASKS' | 'OBSERVATIONS' | 'VALUE';

export const ServiceCatalog: React.FC<ServiceCatalogProps> = ({ 
    services, 
    setServices, 
    currentUser,
    openConfirm 
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<ServiceTab>('GENERAL');
    const [editingService, setEditingService] = useState<Partial<AgencyService> | null>(null);
    const [isViewOnly, setIsViewOnly] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('ALL');

    const canManage = currentUser.role === 'ADMIN' || currentUser.role === 'MANAGER';
    const canDelete = currentUser.role === 'ADMIN';

    const categories = useMemo(() => {
        const cats = new Set(services.map(s => s.category));
        return ['ALL', ...Array.from(cats)];
    }, [services]);

    const filteredServices = services.filter(s => {
        const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             s.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory === 'ALL' || s.category === filterCategory;
        return matchesSearch && matchesCategory;
    });

    const handleOpenModal = (service?: AgencyService, viewOnly = false) => {
        if (service) {
            setEditingService({ ...service });
        } else {
            setEditingService({
                name: '',
                description: '',
                type: 'RECURRENT',
                category: 'Tráfego',
                status: 'ACTIVE',
                basePrice: 0,
                deliveries: [],
                taskTemplates: [],
                tags: [],
                observations: ''
            });
        }
        setIsViewOnly(viewOnly);
        setActiveTab('GENERAL');
        setIsModalOpen(true);
    };

    const handleSave = () => {
        if (!editingService?.name) return;

        const serviceToSave = {
            ...editingService,
            id: editingService.id || Math.random().toString(36).substring(2, 9),
            deliveries: editingService.deliveries || [],
            taskTemplates: editingService.taskTemplates || [],
            tags: editingService.tags || []
        } as AgencyService;

        if (editingService.id) {
            setServices(prev => prev.map(s => s.id === editingService.id ? serviceToSave : s));
        } else {
            setServices(prev => [...prev, serviceToSave]);
        }
        setIsModalOpen(false);
    };

    const handleDelete = async (id: string) => {
        const confirmed = await openConfirm({
            title: 'Excluir Serviço',
            message: 'Tem certeza que deseja excluir este serviço? Esta ação não pode ser desfeita.',
            confirmText: 'Excluir',
            type: 'danger'
        });

        if (confirmed) {
            setServices(prev => prev.filter(s => s.id !== id));
        }
    };

    const toggleStatus = (service: AgencyService) => {
        setServices(prev => prev.map(s => 
            s.id === service.id 
                ? { ...s, status: s.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' } 
                : s
        ));
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        <ShoppingBag className="text-pink-600" size={32} />
                        Produtos & Serviços
                    </h2>
                    <p className="text-slate-500 font-medium mt-1">Padronize suas entregas e organize o que sua agência vende.</p>
                </div>
                {canManage && (
                    <button 
                        onClick={() => handleOpenModal()}
                        className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-pink-200 transition-all hover:scale-105 active:scale-95"
                    >
                        <Plus size={18} strokeWidth={3} />
                        Novo Serviço
                    </button>
                )}
            </div>

            {/* Filters & Search */}
            <div className="bg-white p-4 rounded-[32px] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="text"
                        placeholder="Buscar serviços..."
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-transparent focus:border-pink-100 rounded-2xl text-sm font-bold outline-none transition-all"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setFilterCategory(cat)}
                            className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                                filterCategory === cat 
                                    ? 'bg-slate-800 text-white shadow-md' 
                                    : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                            }`}
                        >
                            {cat === 'ALL' ? 'Todos' : cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Services Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredServices.map(service => (
                    <div 
                        key={service.id} 
                        className={`group bg-white rounded-[40px] border-2 transition-all duration-300 hover:shadow-2xl hover:shadow-slate-200/50 flex flex-col ${
                            service.status === 'ACTIVE' ? 'border-slate-50' : 'border-slate-100 opacity-75'
                        }`}
                    >
                        <div className="p-8 flex-1">
                            <div className="flex justify-between items-start mb-6">
                                <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-[0.2em] ${
                                    service.type === 'RECURRENT' ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'
                                }`}>
                                    {service.type === 'RECURRENT' ? 'Recorrente' : 'Pontual'}
                                </div>
                                <div className={`w-2.5 h-2.5 rounded-full ${service.status === 'ACTIVE' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-300'}`}></div>
                            </div>

                            <h3 className="text-xl font-black text-slate-800 mb-2 group-hover:text-pink-600 transition-colors">{service.name}</h3>
                            <p className="text-slate-500 text-sm font-medium line-clamp-2 mb-6 leading-relaxed">{service.description}</p>

                            <div className="flex flex-wrap gap-2 mb-6">
                                <span className="px-3 py-1.5 bg-slate-50 text-slate-500 rounded-xl text-[9px] font-black uppercase tracking-widest border border-slate-100">
                                    {service.category}
                                </span>
                                {service.deliveries.length > 0 && (
                                    <span className="px-3 py-1.5 bg-pink-50 text-pink-600 rounded-xl text-[9px] font-black uppercase tracking-widest border border-pink-100 flex items-center gap-1.5">
                                        <ListChecks size={12} />
                                        {service.deliveries.length} Entregas
                                    </span>
                                )}
                            </div>

                            <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                                <div>
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Valor Base</p>
                                    <p className="text-lg font-black text-slate-800">R$ {service.basePrice.toLocaleString()}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => handleOpenModal(service, true)}
                                        className="p-3 bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-2xl transition-all"
                                        title="Visualizar"
                                    >
                                        <Eye size={18} />
                                    </button>
                                    {canManage && (
                                        <button 
                                            onClick={() => handleOpenModal(service)}
                                            className="p-3 bg-slate-50 text-slate-400 hover:bg-pink-50 hover:text-pink-600 rounded-2xl transition-all"
                                            title="Editar"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {canManage && (
                            <div className="px-8 py-4 bg-slate-50/50 rounded-b-[40px] border-t border-slate-50 flex justify-between items-center">
                                <button 
                                    onClick={() => toggleStatus(service)}
                                    className={`text-[9px] font-black uppercase tracking-widest transition-colors ${
                                        service.status === 'ACTIVE' ? 'text-slate-400 hover:text-red-500' : 'text-emerald-600 hover:text-emerald-700'
                                    }`}
                                >
                                    {service.status === 'ACTIVE' ? 'Desativar' : 'Ativar'}
                                </button>
                                {canDelete && (
                                    <button 
                                        onClick={() => handleDelete(service.id)}
                                        className="text-[9px] font-black uppercase tracking-widest text-slate-300 hover:text-red-500 transition-colors"
                                    >
                                        Excluir
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Service Modal */}
            {isModalOpen && editingService && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={() => setIsModalOpen(false)}>
                    <div 
                        className="bg-white rounded-[48px] w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col border border-white/20" 
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="p-8 md:p-10 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-pink-600 rounded-[24px] flex items-center justify-center text-white shadow-xl shadow-pink-200">
                                    <ShoppingBag size={28} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">
                                        {editingService.id ? (isViewOnly ? 'Visualizar Serviço' : 'Editar Serviço') : 'Novo Serviço'}
                                    </h3>
                                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Configuração de Produto & Entrega</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setIsModalOpen(false)}
                                className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:shadow-md transition-all"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                            {/* Sidebar Tabs */}
                            <div className="w-full md:w-64 bg-slate-50/50 border-r border-slate-50 p-6 space-y-2">
                                <button 
                                    onClick={() => setActiveTab('GENERAL')}
                                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                        activeTab === 'GENERAL' ? 'bg-white text-pink-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-400 hover:bg-white/50'
                                    }`}
                                >
                                    <Layout size={18} /> Dados Gerais
                                </button>
                                <button 
                                    onClick={() => setActiveTab('DELIVERIES')}
                                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                        activeTab === 'DELIVERIES' ? 'bg-white text-pink-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-400 hover:bg-white/50'
                                    }`}
                                >
                                    <ListChecks size={18} /> Entregas
                                </button>
                                <button 
                                    onClick={() => setActiveTab('TASKS')}
                                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                        activeTab === 'TASKS' ? 'bg-white text-pink-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-400 hover:bg-white/50'
                                    }`}
                                >
                                    <Clock size={18} /> Tarefas (Templates)
                                </button>
                                <button 
                                    onClick={() => setActiveTab('OBSERVATIONS')}
                                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                        activeTab === 'OBSERVATIONS' ? 'bg-white text-pink-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-400 hover:bg-white/50'
                                    }`}
                                >
                                    <MessageSquare size={18} /> Observações
                                </button>
                            </div>

                            {/* Tab Panels */}
                            <div className="flex-1 overflow-y-auto p-8 md:p-10 custom-scrollbar">
                                {activeTab === 'GENERAL' && (
                                    <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="col-span-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block ml-1">Nome do Serviço</label>
                                                <input 
                                                    disabled={isViewOnly}
                                                    className="w-full bg-slate-50 border-2 border-transparent focus:border-pink-100 rounded-2xl p-4 text-sm font-bold outline-none transition-all"
                                                    placeholder="Ex: Gestão de Tráfego Pago"
                                                    value={editingService.name || ''}
                                                    onChange={e => setEditingService({...editingService, name: e.target.value})}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block ml-1">Tipo</label>
                                                <select 
                                                    disabled={isViewOnly}
                                                    className="w-full bg-slate-50 border-2 border-transparent focus:border-pink-100 rounded-2xl p-4 text-sm font-bold outline-none transition-all appearance-none"
                                                    value={editingService.type}
                                                    onChange={e => setEditingService({...editingService, type: e.target.value as any})}
                                                >
                                                    <option value="RECURRENT">Serviço Recorrente</option>
                                                    <option value="ONEOFF">Serviço Pontual</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block ml-1">Categoria</label>
                                                <input 
                                                    disabled={isViewOnly}
                                                    className="w-full bg-slate-50 border-2 border-transparent focus:border-pink-100 rounded-2xl p-4 text-sm font-bold outline-none transition-all"
                                                    placeholder="Ex: Tráfego, Social Media..."
                                                    value={editingService.category || ''}
                                                    onChange={e => setEditingService({...editingService, category: e.target.value})}
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block ml-1">Descrição</label>
                                                <textarea 
                                                    disabled={isViewOnly}
                                                    className="w-full bg-slate-50 border-2 border-transparent focus:border-pink-100 rounded-2xl p-4 text-sm font-bold outline-none transition-all h-32 resize-none"
                                                    placeholder="Descreva o que está incluso neste serviço..."
                                                    value={editingService.description || ''}
                                                    onChange={e => setEditingService({...editingService, description: e.target.value})}
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block ml-1">Tags (separadas por vírgula)</label>
                                                <input 
                                                    disabled={isViewOnly}
                                                    className="w-full bg-slate-50 border-2 border-transparent focus:border-pink-100 rounded-2xl p-4 text-sm font-bold outline-none transition-all"
                                                    placeholder="Ex: ads, performance, meta"
                                                    value={editingService.tags?.join(', ') || ''}
                                                    onChange={e => setEditingService({...editingService, tags: e.target.value.split(',').map(t => t.trim())})}
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block ml-1">Valor Base (R$)</label>
                                                <div className="relative">
                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400">R$</span>
                                                    <input 
                                                        disabled={isViewOnly}
                                                        type="number"
                                                        className="w-full bg-slate-50 border-2 border-transparent focus:border-pink-100 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold outline-none transition-all"
                                                        placeholder="0,00"
                                                        value={editingService.basePrice || ''}
                                                        onChange={e => setEditingService({...editingService, basePrice: parseFloat(e.target.value)})}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'DELIVERIES' && (
                                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                        <div className="flex justify-between items-center">
                                            <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Estrutura de Entregas</h4>
                                            {!isViewOnly && (
                                                <button 
                                                    onClick={() => setEditingService({...editingService, deliveries: [...(editingService.deliveries || []), { id: Date.now().toString(), description: '', quantity: 1, frequency: 'MONTHLY' }]})}
                                                    className="text-[10px] font-black text-pink-600 uppercase tracking-widest hover:bg-pink-50 px-3 py-1.5 rounded-lg transition-all"
                                                >
                                                    + Adicionar Entrega
                                                </button>
                                            )}
                                        </div>

                                        <div className="space-y-4">
                                            {(editingService.deliveries || []).length === 0 ? (
                                                <div className="p-12 text-center bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-200">
                                                    <ListChecks size={32} className="mx-auto text-slate-300 mb-3" />
                                                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Nenhuma entrega definida</p>
                                                </div>
                                            ) : (
                                                (editingService.deliveries || []).map((delivery, idx) => (
                                                    <div key={delivery.id} className="bg-slate-50 p-6 rounded-[24px] border border-slate-100 relative group">
                                                        {!isViewOnly && (
                                                            <button 
                                                                onClick={() => setEditingService({...editingService, deliveries: editingService.deliveries?.filter(d => d.id !== delivery.id)})}
                                                                className="absolute top-4 right-4 p-1.5 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        )}
                                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                                            <div className="md:col-span-6">
                                                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 block ml-1">Descrição da Entrega</label>
                                                                <input 
                                                                    disabled={isViewOnly}
                                                                    className="w-full bg-white border-2 border-transparent focus:border-pink-200 rounded-xl p-3 text-sm font-bold outline-none transition-all"
                                                                    placeholder="Ex: Posts para Instagram"
                                                                    value={delivery.description}
                                                                    onChange={e => {
                                                                        const newDeliveries = [...(editingService.deliveries || [])];
                                                                        newDeliveries[idx].description = e.target.value;
                                                                        setEditingService({...editingService, deliveries: newDeliveries});
                                                                    }}
                                                                />
                                                            </div>
                                                            <div className="md:col-span-2">
                                                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 block ml-1">Qtd</label>
                                                                <input 
                                                                    disabled={isViewOnly}
                                                                    type="number"
                                                                    className="w-full bg-white border-2 border-transparent focus:border-pink-200 rounded-xl p-3 text-sm font-bold outline-none transition-all"
                                                                    value={delivery.quantity}
                                                                    onChange={e => {
                                                                        const newDeliveries = [...(editingService.deliveries || [])];
                                                                        newDeliveries[idx].quantity = parseInt(e.target.value);
                                                                        setEditingService({...editingService, deliveries: newDeliveries});
                                                                    }}
                                                                />
                                                            </div>
                                                            <div className="md:col-span-4">
                                                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 block ml-1">Frequência</label>
                                                                <select 
                                                                    disabled={isViewOnly}
                                                                    className="w-full bg-white border-2 border-transparent focus:border-pink-200 rounded-xl p-3 text-sm font-bold outline-none transition-all appearance-none"
                                                                    value={delivery.frequency}
                                                                    onChange={e => {
                                                                        const newDeliveries = [...(editingService.deliveries || [])];
                                                                        newDeliveries[idx].frequency = e.target.value as any;
                                                                        setEditingService({...editingService, deliveries: newDeliveries});
                                                                    }}
                                                                >
                                                                    <option value="WEEKLY">Semanal</option>
                                                                    <option value="MONTHLY">Mensal</option>
                                                                    <option value="ONEOFF">Pontual</option>
                                                                </select>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'TASKS' && (
                                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                        <div className="flex justify-between items-center">
                                            <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Templates de Tarefas</h4>
                                            {!isViewOnly && (
                                                <button 
                                                    onClick={() => setEditingService({...editingService, taskTemplates: [...(editingService.taskTemplates || []), { id: Date.now().toString(), title: '', priority: 'MEDIUM' }]})}
                                                    className="text-[10px] font-black text-pink-600 uppercase tracking-widest hover:bg-pink-50 px-3 py-1.5 rounded-lg transition-all"
                                                >
                                                    + Adicionar Template
                                                </button>
                                            )}
                                        </div>

                                        <div className="space-y-4">
                                            {(editingService.taskTemplates || []).length === 0 ? (
                                                <div className="p-12 text-center bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-200">
                                                    <Clock size={32} className="mx-auto text-slate-300 mb-3" />
                                                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Nenhum template definido</p>
                                                </div>
                                            ) : (
                                                (editingService.taskTemplates || []).map((template, idx) => (
                                                    <div key={template.id} className="bg-slate-50 p-6 rounded-[24px] border border-slate-100 relative group">
                                                        {!isViewOnly && (
                                                            <button 
                                                                onClick={() => setEditingService({...editingService, taskTemplates: editingService.taskTemplates?.filter(t => t.id !== template.id)})}
                                                                className="absolute top-4 right-4 p-1.5 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        )}
                                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                                            <div className="md:col-span-7">
                                                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 block ml-1">Título da Tarefa</label>
                                                                <input 
                                                                    disabled={isViewOnly}
                                                                    className="w-full bg-white border-2 border-transparent focus:border-pink-200 rounded-xl p-3 text-sm font-bold outline-none transition-all"
                                                                    placeholder="Ex: Criar briefing inicial"
                                                                    value={template.title}
                                                                    onChange={e => {
                                                                        const newTemplates = [...(editingService.taskTemplates || [])];
                                                                        newTemplates[idx].title = e.target.value;
                                                                        setEditingService({...editingService, taskTemplates: newTemplates});
                                                                    }}
                                                                />
                                                            </div>
                                                            <div className="md:col-span-5">
                                                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 block ml-1">Prioridade</label>
                                                                <select 
                                                                    disabled={isViewOnly}
                                                                    className="w-full bg-white border-2 border-transparent focus:border-pink-200 rounded-xl p-3 text-sm font-bold outline-none transition-all appearance-none"
                                                                    value={template.priority}
                                                                    onChange={e => {
                                                                        const newTemplates = [...(editingService.taskTemplates || [])];
                                                                        newTemplates[idx].priority = e.target.value as any;
                                                                        setEditingService({...editingService, taskTemplates: newTemplates});
                                                                    }}
                                                                >
                                                                    <option value="LOW">Baixa</option>
                                                                    <option value="MEDIUM">Média</option>
                                                                    <option value="HIGH">Alta</option>
                                                                </select>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'OBSERVATIONS' && (
                                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block ml-1">Observações Internas</label>
                                        <textarea 
                                            disabled={isViewOnly}
                                            className="w-full bg-slate-50 border-2 border-transparent focus:border-pink-100 rounded-[32px] p-6 text-sm font-bold outline-none transition-all h-64 resize-none"
                                            placeholder="Notas sobre como vender ou entregar este serviço..."
                                            value={editingService.observations || ''}
                                            onChange={e => setEditingService({...editingService, observations: e.target.value})}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Modal Footer */}
                        {!isViewOnly && (
                            <div className="p-8 md:p-10 border-t border-slate-50 flex justify-end gap-4 bg-slate-50/30">
                                <button 
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-all"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    onClick={handleSave}
                                    className="bg-slate-800 hover:bg-slate-900 text-white px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg transition-all hover:scale-105 active:scale-95"
                                >
                                    Salvar Serviço
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
