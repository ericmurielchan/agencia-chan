import React, { useState, useMemo } from 'react';
import { 
    FinancialTransaction, 
    Lead, 
    CardInvoice, 
    User, 
    Client, 
    Squad,
    FinancialCategory
} from '../types';
import { 
    Download, 
    Filter, 
    Calendar, 
    Users, 
    Briefcase, 
    User as UserIcon,
    FileText,
    TrendingUp,
    TrendingDown,
    DollarSign,
    PieChart
} from 'lucide-react';
import { downloadCSV, formatCurrencyCSV } from '../utils/exportUtils';

interface FinancialReportsProps {
    transactions: FinancialTransaction[];
    leads: Lead[];
    cardInvoices: CardInvoice[];
    users: User[];
    clients: Client[];
    squads: Squad[];
    categories: FinancialCategory[];
}

type ReportType = 'SALES' | 'REVENUE' | 'EXPENSE' | 'INVOICES' | 'GENERAL';

export const FinancialReports: React.FC<FinancialReportsProps> = ({
    transactions,
    leads,
    cardInvoices,
    users,
    clients,
    squads,
    categories
}) => {
    const [reportType, setReportType] = useState<ReportType>('GENERAL');
    const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedSquadId, setSelectedSquadId] = useState<string>('all');
    const [selectedUserId, setSelectedUserId] = useState<string>('all');
    const [selectedClientId, setSelectedClientId] = useState<string>('all');

    // Filter Logic
    const filteredData = useMemo(() => {
        const start = new Date(startDate + 'T00:00:00').getTime();
        const end = new Date(endDate + 'T23:59:59').getTime();

        const filterEntity = (item: any) => {
            const date = item.date ? new Date(item.date + 'T00:00:00').getTime() : (item.timestamp || item.createdAt);
            const inDateRange = date >= start && date <= end;
            
            if (!inDateRange) return false;

            const squadMatch = selectedSquadId === 'all' || item.squadId === selectedSquadId;
            const clientMatch = selectedClientId === 'all' || item.clientId === selectedClientId;
            const userMatch = selectedUserId === 'all' || 
                             item.responsibleId === selectedUserId || 
                             item.userId === selectedUserId;

            return squadMatch && clientMatch && userMatch;
        };

        return {
            sales: leads.filter(l => l.status === 'WON' && filterEntity(l)),
            revenue: transactions.filter(t => t.type === 'INCOME' && filterEntity(t)),
            expense: transactions.filter(t => t.type === 'EXPENSE' && filterEntity(t)),
            invoices: cardInvoices.filter(i => {
                // Invoices are usually monthly, but let's assume month/year matches period
                const invDate = new Date(i.year, i.month - 1, 1).getTime();
                return invDate >= start && invDate <= end && (selectedClientId === 'all' || i.clientId === selectedClientId);
            })
        };
    }, [leads, transactions, cardInvoices, startDate, endDate, selectedSquadId, selectedUserId, selectedClientId]);

    const handleExport = () => {
        let data: any[] = [];
        let headers: string[] = [];
        let filename = '';

        switch (reportType) {
            case 'SALES':
                filename = 'Relatorio_Vendas';
                headers = ['Data', 'Empresa', 'Contato', 'Valor', 'Vendedor', 'Squad', 'Origem'];
                data = filteredData.sales.map(s => ({
                    'Data': new Date(s.updatedAt || Date.now()).toLocaleDateString(),
                    'Empresa': s.company,
                    'Contato': s.name,
                    'Valor': formatCurrencyCSV(s.value || 0),
                    'Vendedor': users.find(u => u.id === s.responsibleId)?.name || 'N/A',
                    'Squad': squads.find(sq => sq.id === s.squadId)?.name || 'N/A',
                    'Origem': s.source || 'N/A'
                }));
                break;
            case 'REVENUE':
                filename = 'Relatorio_Receitas';
                headers = ['Data', 'Descricao', 'Valor', 'Cliente', 'Categoria', 'Status'];
                data = filteredData.revenue.map(r => ({
                    'Data': new Date(r.date).toLocaleDateString(),
                    'Descricao': r.description,
                    'Valor': formatCurrencyCSV(r.amount),
                    'Cliente': clients.find(c => c.id === r.clientId)?.name || 'N/A',
                    'Categoria': categories.find(c => c.id === r.categoryId)?.name || r.categoryId || 'N/A',
                    'Status': r.status === 'PAID' ? 'Recebido' : 'Pendente'
                }));
                break;
            case 'EXPENSE':
                filename = 'Relatorio_Despesas';
                headers = ['Data', 'Descricao', 'Valor', 'Squad', 'Responsavel', 'Categoria', 'Status'];
                data = filteredData.expense.map(e => ({
                    'Data': new Date(e.date).toLocaleDateString(),
                    'Descricao': e.description,
                    'Valor': formatCurrencyCSV(e.amount),
                    'Squad': squads.find(s => s.id === e.squadId)?.name || 'N/A',
                    'Responsavel': users.find(u => u.id === e.responsibleId)?.name || 'N/A',
                    'Categoria': categories.find(c => c.id === e.categoryId)?.name || e.categoryId || 'N/A',
                    'Status': e.status === 'PAID' ? 'Pago' : 'Pendente'
                }));
                break;
            case 'INVOICES':
                filename = 'Relatorio_Faturas';
                headers = ['Mes/Ano', 'Cliente', 'Valor', 'Vencimento', 'Status'];
                data = filteredData.invoices.map(i => ({
                    'Mes/Ano': `${i.month}/${i.year}`,
                    'Cliente': clients.find(c => c.id === i.clientId)?.name || 'N/A',
                    'Valor': formatCurrencyCSV(i.amount),
                    'Vencimento': i.dueDate ? new Date(i.dueDate).toLocaleDateString() : 'N/A',
                    'Status': i.status === 'PAID' ? 'Paga' : 'Pendente'
                }));
                break;
            case 'GENERAL':
                filename = 'Relatorio_Financeiro_Geral';
                headers = ['Tipo', 'Data', 'Descricao', 'Valor', 'Entidade', 'Status'];
                const genData = [
                    ...filteredData.revenue.map(r => ({
                        'Tipo': 'Receita',
                        'Data': new Date(r.date || Date.now()).toLocaleDateString(),
                        'Descricao': r.description,
                        'Valor': formatCurrencyCSV(r.amount),
                        'Entidade': clients.find(c => c.id === r.clientId)?.name || 'Geral',
                        'Status': r.status
                    })),
                    ...filteredData.expense.map(e => ({
                        'Tipo': 'Despesa',
                        'Data': new Date(e.date || Date.now()).toLocaleDateString(),
                        'Descricao': e.description,
                        'Valor': formatCurrencyCSV(e.amount),
                        'Entidade': squads.find(s => s.id === e.squadId)?.name || 'Institucional',
                        'Status': e.status
                    }))
                ];
                data = genData.sort((a, b) => new Date(b.Data).getTime() - new Date(a.Data).getTime());
                break;
        }

        downloadCSV(data, filename, headers);
    };

    return (
        <div className="space-y-8">
            {/* Header com Filtros */}
            <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-premium">
                <div className="flex flex-col md:flex-row md:items-end gap-6">
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block flex items-center gap-2">
                                <Calendar size={12} /> Período Inicial
                            </label>
                            <input 
                                type="date" 
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                                className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl p-3 text-xs font-bold outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block flex items-center gap-2">
                                <Calendar size={12} /> Período Final
                            </label>
                            <input 
                                type="date" 
                                value={endDate}
                                onChange={e => setEndDate(e.target.value)}
                                className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl p-3 text-xs font-bold outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block flex items-center gap-2">
                                <Users size={12} /> Time / Squad
                            </label>
                            <select 
                                value={selectedSquadId}
                                onChange={e => setSelectedSquadId(e.target.value)}
                                className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl p-3 text-xs font-bold outline-none transition-all"
                            >
                                <option value="all">Todos os Times</option>
                                {squads.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block flex items-center gap-2">
                                <Briefcase size={12} /> Cliente
                            </label>
                            <select 
                                value={selectedClientId}
                                onChange={e => setSelectedClientId(e.target.value)}
                                className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl p-3 text-xs font-bold outline-none transition-all"
                            >
                                <option value="all">Todos os Clientes</option>
                                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between mt-8 pt-8 border-t border-slate-50 gap-4">
                    <div className="flex bg-slate-100 p-1 rounded-2xl">
                        {(['GENERAL', 'SALES', 'REVENUE', 'EXPENSE', 'INVOICES'] as const).map(type => (
                            <button
                                key={type}
                                onClick={() => setReportType(type)}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${reportType === type ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                {type === 'GENERAL' ? 'Geral' : type === 'SALES' ? 'Vendas' : type === 'REVENUE' ? 'Receitas' : type === 'EXPENSE' ? 'Despesas' : 'Faturas'}
                            </button>
                        ))}
                    </div>

                    <button 
                        onClick={handleExport}
                        className="flex items-center justify-center gap-3 px-8 py-4 bg-indigo-600 text-white rounded-[24px] text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 group"
                    >
                        <Download size={18} className="group-hover:translate-y-0.5 transition-transform" />
                        Baixar Relatório CSV
                    </button>
                </div>
            </div>

            {/* Sumários Visuals */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <SummaryCard 
                    title="Total em Vendas" 
                    value={filteredData.sales.reduce((acc, s) => acc + (s.value || 0), 0)} 
                    count={filteredData.sales.length}
                    icon={<TrendingUp size={20} />}
                    color="text-emerald-600"
                    bgColor="bg-emerald-50"
                />
                <SummaryCard 
                    title="Total Receitas" 
                    value={filteredData.revenue.reduce((acc, r) => acc + r.amount, 0)} 
                    count={filteredData.revenue.length}
                    icon={<DollarSign size={20} />}
                    color="text-blue-600"
                    bgColor="bg-blue-50"
                />
                <SummaryCard 
                    title="Total Despesas" 
                    value={filteredData.expense.reduce((acc, e) => acc + e.amount, 0)} 
                    count={filteredData.expense.length}
                    icon={<TrendingDown size={20} />}
                    color="text-red-600"
                    bgColor="bg-red-50"
                />
                <SummaryCard 
                    title="Total Faturas" 
                    value={filteredData.invoices.reduce((acc, i) => acc + i.amount, 0)} 
                    count={filteredData.invoices.length}
                    icon={<FileText size={20} />}
                    color="text-amber-600"
                    bgColor="bg-amber-50"
                />
            </div>

            {/* Preview da Tabela */}
            <div className="bg-white rounded-[40px] border border-slate-100 shadow-premium overflow-hidden">
                <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                    <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Preview dos Dados</h3>
                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {reportType === 'SALES' ? 'Vendas Ganhas' : 
                         reportType === 'REVENUE' ? 'Receitas Confirmadas' : 
                         reportType === 'EXPENSE' ? 'Despesas Registradas' : 
                         reportType === 'INVOICES' ? 'Faturas Emitidas' : 'Todos os Movimentos'}
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Data</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Descrição</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Entidade / Squad</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Valor</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {reportType === 'GENERAL' && [
                                ...filteredData.revenue.map(r => ({ ...r, displayType: 'INCOME' })),
                                ...filteredData.expense.map(e => ({ ...e, displayType: 'EXPENSE' }))
                            ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10).map((item: any) => (
                                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-8 py-5 text-[11px] font-bold text-slate-500">{new Date(item.date).toLocaleDateString()}</td>
                                    <td className="px-8 py-5">
                                        <p className="text-xs font-black text-slate-800">{item.description}</p>
                                        <p className="text-[9px] text-slate-400 font-bold uppercase">{item.displayType === 'INCOME' ? 'Receita' : 'Despesa'}</p>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-2">
                                            {item.clientId ? 
                                                <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black uppercase">{clients.find(c => c.id === item.clientId)?.name}</span> :
                                                <span className="px-2 py-1 bg-slate-50 text-slate-400 rounded-lg text-[9px] font-black uppercase">Institucional</span>
                                            }
                                        </div>
                                    </td>
                                    <td className={`px-8 py-5 text-sm font-black text-right ${item.displayType === 'INCOME' ? 'text-emerald-600' : 'text-red-600'}`}>
                                        {item.displayType === 'INCOME' ? '+' : '-'} R$ {item.amount.toLocaleString()}
                                    </td>
                                    <td className="px-8 py-5 text-center">
                                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${item.status === 'PAID' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                            {item.status === 'PAID' ? 'Pago' : 'Pendente'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {reportType === 'SALES' && filteredData.sales.slice(0, 10).map(s => (
                                <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-8 py-5 text-[11px] font-bold text-slate-500">{new Date(s.updatedAt || Date.now()).toLocaleDateString()}</td>
                                    <td className="px-8 py-5">
                                        <p className="text-xs font-black text-slate-800">{s.company}</p>
                                        <p className="text-[9px] text-slate-400 font-bold uppercase">{s.name}</p>
                                    </td>
                                    <td className="px-8 py-5 text-xs font-bold text-slate-500">
                                        {squads.find(sq => sq.id === s.squadId)?.name || 'N/A'}
                                    </td>
                                    <td className="px-8 py-5 text-sm font-black text-emerald-600 text-right">
                                        R$ {(s.value || 0).toLocaleString()}
                                    </td>
                                    <td className="px-8 py-5 text-center">
                                        <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest">Ganha</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {(reportType === 'GENERAL' ? filteredData.revenue.length + filteredData.expense.length : filteredData[reportType.toLowerCase() as keyof typeof filteredData].length) > 10 && (
                    <div className="p-4 bg-slate-50 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Mostrando apenas os 10 registros mais recentes no preview. Baixe o CSV para ver tudo.
                    </div>
                )}
            </div>
        </div>
    );
};

const SummaryCard = ({ title, value, count, icon, color, bgColor }: { title: string, value: number, count: number, icon: React.ReactNode, color: string, bgColor: string }) => (
    <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-premium">
        <div className="flex items-center gap-4 mb-6">
            <div className={`p-3 ${bgColor} ${color} rounded-2xl shadow-sm`}>
                {icon}
            </div>
            <div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{title}</h4>
                <p className="text-[9px] text-slate-300 font-bold uppercase tracking-wider">{count} Ocorrências</p>
            </div>
        </div>
        <p className={`text-2xl font-black ${color}`}>R$ {value.toLocaleString()}</p>
    </div>
);
