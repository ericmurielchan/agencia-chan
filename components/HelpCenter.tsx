
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
    keywords?: string;
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
            keywords: 'senha password foto avatar perfil segurança',
            content: (
                <div className="space-y-3">
                    <p>Para manter seu perfil atualizado e seguro:</p>
                    <ol className="list-decimal ml-5 space-y-1">
                        <li>Clique no seu nome/foto no canto superior direito da tela.</li>
                        <li>Selecione a opção <strong>"Configurações"</strong>.</li>
                        <li>Na aba <strong>"Perfil Geral"</strong>, você pode carregar uma nova foto clicando no ícone de câmera.</li>
                        <li>Na aba <strong>"Segurança"</strong>, insira sua senha atual e a nova senha desejada para atualizar seu acesso.</li>
                    </ol>
                </div>
            )
        },
        {
            id: 'g2',
            category: 'GERAL',
            title: 'Notificações e Alertas',
            keywords: 'notificação sino alerta email aviso',
            content: (
                <div className="space-y-3">
                    <p>O sistema mantém você informado sobre eventos importantes através do ícone de sino no topo:</p>
                    <ul className="list-disc ml-5 space-y-1">
                        <li><strong>Novas Tarefas:</strong> Quando alguém atribui uma tarefa a você.</li>
                        <li><strong>Prazos:</strong> Alertas de tarefas que estão próximas do vencimento.</li>
                        <li><strong>Aprovações:</strong> Notificações quando um lote de aprovação é concluído ou requer sua atenção.</li>
                        <li><strong>Financeiro:</strong> Alertas de faturas vencidas ou novos lançamentos.</li>
                    </ul>
                    <p className="text-sm italic">Dica: Você pode marcar todas como lidas clicando no botão "Limpar" dentro do menu de notificações.</p>
                </div>
            )
        },
        {
            id: 'g3',
            category: 'GERAL',
            title: 'Navegação e Atalhos',
            keywords: 'menu lateral dashboard navegação atalho',
            content: (
                <div className="space-y-3">
                    <p>A barra lateral esquerda é o seu centro de comando. Você pode recolhê-la para ganhar mais espaço de trabalho clicando no ícone de menu (hambúrguer) no topo.</p>
                    <p>O Dashboard principal oferece uma visão rápida de:</p>
                    <ul className="list-disc ml-5 space-y-1">
                        <li>Suas tarefas pendentes.</li>
                        <li>Próximas reuniões ou eventos.</li>
                        <li>Resumo de atividades recentes.</li>
                    </ul>
                </div>
            )
        },
        // ADMIN
        {
            id: 'a1',
            category: 'ADMIN',
            title: 'Controle de Acessos e Permissões (RBAC)',
            keywords: 'permissão acesso rbac cargo admin diretor',
            content: (
                <div className="space-y-3">
                    <p>O módulo de <strong>"Acessos"</strong> permite configurar a hierarquia e visibilidade do sistema:</p>
                    <ol className="list-decimal ml-5 space-y-1">
                        <li>Selecione o cargo (Admin, Gerente, etc.) que deseja configurar.</li>
                        <li>Ative ou desative módulos inteiros (ex: esconder Financeiro para Operacional).</li>
                        <li>Defina permissões granulares: <strong>Visualizar, Criar, Editar, Excluir e Aprovar</strong>.</li>
                        <li>Clique em "Salvar Configurações" para aplicar as mudanças instantaneamente a todos os usuários daquele cargo.</li>
                    </ol>
                </div>
            )
        },
        {
            id: 'a2',
            category: 'ADMIN',
            title: 'Personalização de Marca (Branding)',
            keywords: 'logo cor branding marca agência personalização',
            content: (
                <div className="space-y-3">
                    <p>Acesse <strong>"Config. Sistema"</strong> para deixar o sistema com a cara da sua agência:</p>
                    <ul className="list-disc ml-5 space-y-1">
                        <li><strong>Logotipo:</strong> Envie o logo para a barra lateral e para os relatórios PDF.</li>
                        <li><strong>Cores:</strong> Defina a cor primária (botões e destaques) e a cor da barra lateral.</li>
                        <li><strong>Nome da Agência:</strong> Atualize o nome que aparece nas comunicações e títulos de página.</li>
                    </ul>
                </div>
            )
        },
        {
            id: 'a3',
            category: 'ADMIN',
            title: 'Gestão de Clientes e Acessos Externos',
            keywords: 'cliente acesso login externo portal',
            content: (
                <div className="space-y-3">
                    <p>No módulo <strong>"Gestão de Clientes"</strong>, você pode criar contas de acesso para seus clientes:</p>
                    <ol className="list-decimal ml-5 space-y-1">
                        <li>Edite um cliente existente ou crie um novo.</li>
                        <li>Na seção "Acessos ao Sistema", clique em "Adicionar Acesso".</li>
                        <li>Defina o e-mail e uma senha inicial para o cliente.</li>
                        <li>O cliente poderá logar na mesma URL do sistema e verá apenas o <strong>Portal do Cliente</strong>.</li>
                    </ol>
                </div>
            )
        },
        // MANAGER
        {
            id: 'm1',
            category: 'MANAGER',
            title: 'Gestão de Leads e CRM',
            keywords: 'crm lead venda funil negociação histórico',
            content: (
                <div className="space-y-3">
                    <p>O CRM é dividido em funis de vendas. Para gerenciar leads:</p>
                    <ul className="list-disc ml-5 space-y-1">
                        <li>Arraste os cards entre as colunas para mudar o estágio da negociação.</li>
                        <li>Clique em um lead para ver o <strong>Histórico de Interações</strong>.</li>
                        <li>Agende tarefas (ligações, reuniões) com data e hora. O sistema notificará o responsável no horário marcado.</li>
                        <li>Converta leads ganhos em Clientes Ativos com um clique.</li>
                    </ul>
                </div>
            )
        },
        {
            id: 'm2',
            category: 'MANAGER',
            title: 'Aprovação de Lotes e Demandas',
            keywords: 'aprovação lote demanda cliente validação',
            content: (
                <div className="space-y-3">
                    <p>O módulo de <strong>"Aprovações"</strong> centraliza o que precisa de validação:</p>
                    <ol className="list-decimal ml-5 space-y-1">
                        <li>Crie um "Lote de Aprovação" selecionando os itens (artes, textos, vídeos).</li>
                        <li>Envie para o cliente ou para um diretor interno.</li>
                        <li>Acompanhe o status: Pendente, Aprovado ou Ajustes Solicitados.</li>
                        <li>Itens aprovados podem ser movidos automaticamente para a próxima etapa do Kanban.</li>
                    </ol>
                </div>
            )
        },
        {
            id: 'm3',
            category: 'MANAGER',
            title: 'Organização de Equipes (Squads)',
            keywords: 'equipe squad time membro organização',
            content: (
                <div className="space-y-3">
                    <p>Em <strong>"Equipes"</strong>, você organiza quem trabalha em quê:</p>
                    <ul className="list-disc ml-5 space-y-1">
                        <li>Crie Squads por especialidade (ex: Squad Social Media, Squad Performance).</li>
                        <li>Adicione membros às Squads.</li>
                        <li>Ao criar uma tarefa no Kanban, você pode atribuí-la a uma Squad inteira ou a um membro específico.</li>
                    </ul>
                </div>
            )
        },
        // EMPLOYEE
        {
            id: 'e1',
            category: 'EMPLOYEE',
            title: 'Operação no Kanban e Time Tracking',
            keywords: 'kanban tarefa timer tempo tracking checklist',
            content: (
                <div className="space-y-3">
                    <p>Sua rotina diária acontece no Kanban:</p>
                    <ul className="list-disc ml-5 space-y-1">
                        <li><strong>Play/Pause:</strong> Use o timer no card para registrar exatamente quanto tempo gasta em cada tarefa.</li>
                        <li><strong>Checklist:</strong> Dentro do card, siga as sub-tarefas para garantir a qualidade da entrega.</li>
                        <li><strong>Comentários:</strong> Use o chat interno da tarefa para tirar dúvidas com o gerente ou colegas.</li>
                        <li><strong>Anexos:</strong> Suba os arquivos finais diretamente na tarefa para aprovação.</li>
                    </ul>
                </div>
            )
        },
        {
            id: 'e2',
            category: 'EMPLOYEE',
            title: 'Produtos e Serviços',
            keywords: 'produto serviço catálogo escopo contrato',
            content: (
                <div className="space-y-3">
                    <p>Consulte o catálogo de <strong>"Produtos e Serviços"</strong> para entender o que foi vendido ao cliente:</p>
                    <ul className="list-disc ml-5 space-y-1">
                        <li>Veja a descrição detalhada de cada serviço.</li>
                        <li>Confira os entregáveis padrão de cada item.</li>
                        <li>Isso ajuda a manter o escopo do projeto alinhado com o contrato.</li>
                    </ul>
                </div>
            )
        },
        // FINANCE
        {
            id: 'f1',
            category: 'FINANCE',
            title: 'Gestão Financeira e Fluxo de Caixa',
            keywords: 'financeiro caixa transação receita despesa fatura',
            content: (
                <div className="space-y-3">
                    <p>Controle total das entradas e saídas:</p>
                    <ul className="list-disc ml-5 space-y-1">
                        <li><strong>Transações:</strong> Registre receitas e despesas. Use categorias para organizar os custos.</li>
                        <li><strong>Recorrência:</strong> Configure faturas mensais para clientes de fee mensal (Retainer).</li>
                        <li><strong>Conciliação:</strong> Marque como "Pago" assim que o valor cair na conta para atualizar o saldo real.</li>
                    </ul>
                </div>
            )
        },
        {
            id: 'f2',
            category: 'FINANCE',
            title: 'Relatórios e Dashboards Financeiros',
            keywords: 'relatório dashboard financeiro lucro venda churn',
            content: (
                <div className="space-y-3">
                    <p>Gere inteligência sobre os números da agência:</p>
                    <ul className="list-disc ml-5 space-y-1">
                        <li><strong>Períodos:</strong> Filtre por Hoje, 7 dias, 30 dias, 6 meses ou Personalizado.</li>
                        <li><strong>Tipos de Relatório:</strong> Receitas vs Despesas, Novas Vendas, Faturas por Período.</li>
                        <li><strong>Ativos:</strong> Acompanhe o saldo de ativos e ativos cancelados (Churn).</li>
                        <li><strong>Exportação:</strong> Use o botão de download para baixar os dados filtrados em CSV/Excel.</li>
                    </ul>
                </div>
            )
        },
        {
            id: 'f3',
            category: 'FINANCE',
            title: 'Gestão de Ativos e Estoque',
            keywords: 'ativo estoque equipamento inventário patrimônio',
            content: (
                <div className="space-y-3">
                    <p>Controle o patrimônio da agência:</p>
                    <ul className="list-disc ml-5 space-y-1">
                        <li>Cadastre equipamentos (Macbooks, Câmeras) como Ativos.</li>
                        <li>Gerencie o estoque de insumos (Papelaria, Brindes).</li>
                        <li>O sistema calcula a depreciação e valor total do inventário.</li>
                    </ul>
                </div>
            )
        },
        // CLIENT
        {
            id: 'c1',
            category: 'CLIENT',
            title: 'Portal do Cliente: Pedidos e Briefing',
            keywords: 'pedido briefing solicitação chamado cliente',
            content: (
                <div className="space-y-3">
                    <p>Como cliente, você tem autonomia para solicitar e acompanhar:</p>
                    <ol className="list-decimal ml-5 space-y-1">
                        <li>Clique em <strong>"Nova Solicitação"</strong> para abrir um pedido.</li>
                        <li>Preencha o briefing detalhadamente para evitar retrabalho.</li>
                        <li>Acompanhe o status em tempo real: "Em Produção", "Aguardando sua Aprovação", etc.</li>
                    </ol>
                </div>
            )
        },
        {
            id: 'c2',
            category: 'CLIENT',
            title: 'Aprovação de Materiais',
            keywords: 'aprovação material arte ajuste validação',
            content: (
                <div className="space-y-3">
                    <p>Quando a agência finaliza um material, você receberá uma notificação:</p>
                    <ul className="list-disc ml-5 space-y-1">
                        <li>Acesse a aba <strong>"Aprovações"</strong>.</li>
                        <li>Visualize o arquivo (imagem, vídeo ou documento).</li>
                        <li>Clique em <strong>"Aprovar"</strong> ou <strong>"Solicitar Ajuste"</strong> (escrevendo o que precisa mudar).</li>
                    </ul>
                </div>
            )
        },
        {
            id: 'c3',
            category: 'CLIENT',
            title: 'Financeiro e Faturas',
            keywords: 'fatura boleto pagamento pix financeiro cliente',
            content: (
                <div className="space-y-3">
                    <p>Mantenha seus pagamentos em dia:</p>
                    <ul className="list-disc ml-5 space-y-1">
                        <li>Veja todas as faturas emitidas para sua empresa.</li>
                        <li>Baixe boletos ou visualize dados para PIX/Transferência.</li>
                        <li>Confira o histórico de pagamentos realizados.</li>
                    </ul>
                </div>
            )
        }
    ];

    // Filter Logic
    const availableCategories = currentUser.role === 'ADMIN' 
        ? ['ALL', 'ADMIN', 'MANAGER', 'EMPLOYEE', 'FINANCE', 'CLIENT'] 
        : ['GERAL', currentUser.role];

    const filteredTutorials = tutorials.filter(t => {
        const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              (t.keywords && t.keywords.toLowerCase().includes(searchTerm.toLowerCase())) ||
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
