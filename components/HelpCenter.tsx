
import React, { useState } from 'react';
import { User, Role } from '../types';
import { ChevronDown, ChevronUp, BookOpen, Shield, Users, DollarSign, Layout, MonitorPlay, Search } from 'lucide-react';

interface HelpCenterProps {
    currentUser: User;
}

interface Tutorial {
    id: string;
    title: string;
    content: React.ReactNode;
    category: 'GERAL' | Role;
}

export const HelpCenter: React.FC<HelpCenterProps> = ({ currentUser }) => {
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<string>(currentUser.role === 'ADMIN' ? 'ALL' : currentUser.role);

    const toggleExpand = (id: string) => {
        setExpandedId(expandedId === id ? null : id);
    };

    const tutorials: Tutorial[] = [
        // GERAL
        {
            id: 'g1',
            category: 'GERAL',
            title: 'Como alterar minha senha ou foto?',
            content: 'Vá até o menu superior direito, clique no seu nome e selecione "Configurações". Na aba "Segurança" você pode alterar a senha e na aba "Perfil Geral" atualizar sua foto.'
        },
        {
            id: 'g2',
            category: 'GERAL',
            title: 'Notificações do Sistema',
            content: 'O ícone de sino no topo mostra alertas importantes. Você pode configurar para receber alertas por e-mail nas suas Configurações de Perfil.'
        },
        // ADMIN
        {
            id: 'a1',
            category: 'ADMIN',
            title: 'Gerenciando Permissões (RBAC)',
            content: 'No menu "Acessos (Admin)", você pode definir exatamente quais telas e quais ações (como Excluir ou Aprovar) cada cargo pode realizar. As alterações são aplicadas em tempo real.'
        },
        {
            id: 'a2',
            category: 'ADMIN',
            title: 'Configurações de Cores e Branding',
            content: 'Acesse "Config. Sistema" para alterar o logotipo da agência, a cor primária dos botões e a cor de fundo da barra lateral.'
        },
        // MANAGER
        {
            id: 'm1',
            category: 'MANAGER',
            title: 'Aprovando Solicitações de Clientes',
            content: 'Quando um cliente cria uma demanda, ela aparece no topo do Kanban como "Solicitação Pendente". Você deve revisar o briefing e clicar em "Aprovar" (move para o Backlog) ou "Rejeitar" (arquiva a tarefa).'
        },
        {
            id: 'm2',
            category: 'MANAGER',
            title: 'Gestão de Squads',
            content: 'Use o módulo "Equipes" para criar novas Squads e alocar membros. Isso define quem vê quais tarefas no Kanban.'
        },
        // EMPLOYEE
        {
            id: 'e1',
            category: 'EMPLOYEE',
            title: 'Usando o Kanban e Timer',
            content: 'Mova os cards entre as colunas para atualizar o status. Use o botão de "Play" no card da tarefa para iniciar o rastreamento de tempo (Time Tracking).'
        },
        {
            id: 'e2',
            category: 'EMPLOYEE',
            title: 'Solicitando Compras ou Reembolso',
            content: 'Acesse o menu "Solicitações" para pedir novos equipamentos ou reembolso de despesas. O status será atualizado pelo financeiro/admin.'
        },
        // CLIENT
        {
            id: 'c1',
            category: 'CLIENT',
            title: 'Como abrir um novo chamado?',
            content: 'No seu painel "Meus Pedidos", clique em "Nova Solicitação". Siga o passo a passo escolhendo o tipo (Social, Vídeo, etc) e preenchendo o briefing.'
        },
        {
            id: 'c2',
            category: 'CLIENT',
            title: 'Solicitar Reunião com Gerente',
            content: 'Na barra lateral direita do seu portal, há um card "Meu Gerente de Conta". Clique em "Solicitar Reunião" para enviar um pedido de agendamento.'
        },
        // FINANCE
        {
            id: 'f1',
            category: 'FINANCE',
            title: 'Lançamento de Contas a Pagar/Receber',
            content: 'No módulo Financeiro, use o botão "Lançamento". Você pode criar lançamentos únicos ou parcelados (recorrentes).'
        },
        {
            id: 'f2',
            category: 'FINANCE',
            title: 'Aprovando Requisições de Compra',
            content: 'Acesse "Solicitações". Itens marcados como "Compra" ou "Reembolso" pendentes devem ser analisados. Ao aprovar, o sistema sugere criar o lançamento de despesa automaticamente.'
        }
    ];

    // Filter Logic
    const availableCategories = currentUser.role === 'ADMIN' 
        ? ['ALL', 'ADMIN', 'MANAGER', 'EMPLOYEE', 'FINANCE', 'CLIENT'] 
        : ['GERAL', currentUser.role];

    const filteredTutorials = tutorials.filter(t => {
        const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              (typeof t.content === 'string' && t.content.toLowerCase().includes(searchTerm.toLowerCase()));
        
        const matchesTab = activeTab === 'ALL' ? true : (t.category === activeTab || (activeTab === currentUser.role && t.category === 'GERAL'));

        // Se não for admin, filtra estritamente pelo papel + geral
        const allowedRole = currentUser.role === 'ADMIN' ? true : (t.category === currentUser.role || t.category === 'GERAL');

        return matchesSearch && matchesTab && allowedRole;
    });

    const getIcon = (cat: string) => {
        switch(cat) {
            case 'ADMIN': return <Shield size={16}/>;
            case 'MANAGER': return <Users size={16}/>;
            case 'FINANCE': return <DollarSign size={16}/>;
            case 'CLIENT': return <Layout size={16}/>;
            case 'EMPLOYEE': return <MonitorPlay size={16}/>;
            default: return <BookOpen size={16}/>;
        }
    };

    const getLabel = (cat: string) => {
        switch(cat) {
            case 'ALL': return 'Todos os Manuais';
            case 'ADMIN': return 'Administrador';
            case 'MANAGER': return 'Gerência';
            case 'FINANCE': return 'Financeiro';
            case 'CLIENT': return 'Portal do Cliente';
            case 'EMPLOYEE': return 'Operacional';
            default: return 'Geral';
        }
    };

    return (
        <div className="max-w-4xl mx-auto animate-pop space-y-6">
            <div className="bg-indigo-600 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
                <div className="relative z-10">
                    <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                        <BookOpen size={32}/> Central de Ajuda
                    </h1>
                    <p className="text-indigo-100 max-w-xl text-lg">
                        Tutoriais, guias e respostas para você aproveitar ao máximo o sistema.
                    </p>
                    
                    <div className="mt-6 relative max-w-lg">
                        <input 
                            type="text" 
                            placeholder="O que você procura?" 
                            className="w-full pl-10 pr-4 py-3 rounded-xl text-slate-800 outline-none shadow-lg"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20}/>
                    </div>
                </div>
                <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-white/10 to-transparent skew-x-12"></div>
                <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-indigo-500/30 rounded-full blur-3xl"></div>
            </div>

            {/* Tabs (Only visible for Admin to switch contexts) */}
            {currentUser.role === 'ADMIN' && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                    {availableCategories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveTab(cat)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === cat ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-indigo-50 border border-slate-200'}`}
                        >
                            {cat !== 'ALL' && getIcon(cat)}
                            {getLabel(cat)}
                        </button>
                    ))}
                </div>
            )}

            <div className="space-y-4">
                {filteredTutorials.length === 0 && (
                    <div className="text-center p-12 bg-white rounded-xl border border-slate-200 border-dashed text-slate-400">
                        <BookOpen size={48} className="mx-auto mb-3 opacity-20"/>
                        <p>Nenhum tutorial encontrado para esta busca.</p>
                    </div>
                )}

                {filteredTutorials.map((tutorial) => (
                    <div 
                        key={tutorial.id} 
                        className={`bg-white rounded-xl border transition-all duration-300 overflow-hidden ${expandedId === tutorial.id ? 'border-indigo-200 shadow-md' : 'border-slate-200 hover:border-indigo-100 hover:shadow-sm'}`}
                    >
                        <button 
                            onClick={() => toggleExpand(tutorial.id)}
                            className="w-full flex justify-between items-center p-5 text-left outline-none"
                        >
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${expandedId === tutorial.id ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
                                    {getIcon(tutorial.category)}
                                </div>
                                <div>
                                    <h3 className={`font-bold text-lg ${expandedId === tutorial.id ? 'text-indigo-700' : 'text-slate-700'}`}>
                                        {tutorial.title}
                                    </h3>
                                    {currentUser.role === 'ADMIN' && (
                                        <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-50 px-1.5 rounded border border-slate-100">
                                            {getLabel(tutorial.category)}
                                        </span>
                                    )}
                                </div>
                            </div>
                            {expandedId === tutorial.id ? <ChevronUp className="text-indigo-400"/> : <ChevronDown className="text-slate-300"/>}
                        </button>
                        
                        {expandedId === tutorial.id && (
                            <div className="px-5 pb-5 pt-0 text-slate-600 leading-relaxed border-t border-indigo-50 bg-indigo-50/10">
                                <div className="mt-4 prose prose-sm max-w-none">
                                    {tutorial.content}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
