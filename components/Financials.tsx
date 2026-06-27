import React, { useState, useMemo, useEffect } from 'react';
import { Modal } from './Modal';
import { 
    BankAccount, 
    CreditCard, 
    FinancialTransaction, 
    CardInvoice, 
    User, 
    Client, 
    Squad,
    FinancialCategory,
    ConfirmOptions,
    StockItem,
    Asset,
    CashRegisterSession,
    CashMovement,
    Lead
} from '../types';
import { 
    Wallet, 
    CreditCard as CardIcon, 
    ArrowUpCircle, 
    ArrowDownCircle, 
    Plus, 
    Search, 
    Filter, 
    TrendingUp, 
    TrendingDown, 
    DollarSign, 
    Calendar,
    ChevronRight,
    MoreVertical,
    PieChart,
    Building2,
    Users,
    X,
    Edit2,
    Repeat,
    AlertCircle,
    CheckCircle2,
    FileText,
    History,
    Package,
    Box,
    Calculator,
    BarChart3,
    ArrowRightLeft,
    Download,
    Cpu,
    Monitor,
    Truck,
    Smartphone,
    Wrench,
    Trash2,
    Sparkles,
    AlertTriangle,
    PlusCircle,
    SlidersHorizontal,
    Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, Legend } from 'recharts';
import { 
    saveCreditCard, 
    deleteCreditCard, 
    saveBankAccount, 
    deleteBankAccount,
    saveFinancialCategory,
    deleteFinancialCategory,
    deleteFinancialTransaction
} from '../services/supabaseService';
import { analyzeFinancialHealth } from '../services/aiService';
import { CommissionDashboard } from './CommissionDashboard';

interface FinancialsProps {
    bankAccounts: BankAccount[];
    setBankAccounts: React.Dispatch<React.SetStateAction<BankAccount[]>>;
    creditCards: CreditCard[];
    setCreditCards: React.Dispatch<React.SetStateAction<CreditCard[]>>;
    transactions: FinancialTransaction[];
    setTransactions: React.Dispatch<React.SetStateAction<FinancialTransaction[]>>;
    cardInvoices: CardInvoice[];
    setCardInvoices: React.Dispatch<React.SetStateAction<CardInvoice[]>>;
    currentUser: User;
    users: User[];
    clients: Client[];
    squads: Squad[];
    leads: Lead[];
    openConfirm: (options: ConfirmOptions) => Promise<boolean>;
    selectedTransactionId?: string | null;
    onClearSelectedTransaction?: () => void;
    selectedInvoiceId?: string | null;
    onClearSelectedInvoice?: () => void;
    stock: StockItem[];
    setStock: React.Dispatch<React.SetStateAction<StockItem[]>>;
    assets: Asset[];
    setAssets: React.Dispatch<React.SetStateAction<Asset[]>>;
    cashSessions: CashRegisterSession[];
    setCashSessions: React.Dispatch<React.SetStateAction<CashRegisterSession[]>>;
    cashMovements: CashMovement[];
    setCashMovements: React.Dispatch<React.SetStateAction<CashMovement[]>>;
    categories: FinancialCategory[];
    setCategories: React.Dispatch<React.SetStateAction<FinancialCategory[]>>;
    onSaveTransaction?: (t: FinancialTransaction) => Promise<void>;
    onDeleteTransaction?: (id: string) => Promise<void>;
    onSaveStockItem?: (item: Partial<StockItem>) => Promise<void>;
    onDeleteStockItem?: (id: string) => Promise<void>;
    onSaveAsset?: (asset: Partial<Asset>) => Promise<void>;
    onDeleteAsset?: (id: string) => Promise<void>;
    onSaveUser?: (user: Partial<User>) => Promise<void>;
    initialTab?: TabType;
}

type TabType = 'DASHBOARD' | 'ACCOUNTS_RECEIVABLE' | 'ACCOUNTS_PAYABLE' | 'CASH_FLOW' | 'ASSETS' | 'STOCK' | 'COMMISSIONS' | 'ACCOUNTS_CARDS' | 'REPORTS' | 'COLLABORATORS_BANKS';

export const Financials: React.FC<FinancialsProps> = ({
    bankAccounts,
    setBankAccounts,
    creditCards,
    setCreditCards,
    transactions,
    setTransactions,
    cardInvoices,
    setCardInvoices,
    stock,
    setStock,
    assets,
    setAssets,
    categories,
    setCategories,
    currentUser,
    users,
    clients,
    squads,
    leads,
    openConfirm,
    selectedTransactionId,
    onClearSelectedTransaction,
    selectedInvoiceId,
    onClearSelectedInvoice,
    onSaveTransaction,
    onDeleteTransaction,
    onSaveStockItem,
    onDeleteStockItem,
    onSaveAsset,
    onDeleteAsset,
    onSaveUser,
    initialTab
}) => {
    const [activeTab, setActiveTab] = useState<TabType>(initialTab || 'DASHBOARD');
    
    // Collaborator Banks Tab States
    const [bankSearch, setBankSearch] = useState('');
    const [bankRoleFilter, setBankRoleFilter] = useState('ALL');
    const [editingBankUser, setEditingBankUser] = useState<User | null>(null);
    const [bankDetailsInput, setBankDetailsInput] = useState('');
    const [salaryInput, setSalaryInput] = useState('');
    const [hourlyRateInput, setHourlyRateInput] = useState('');
    const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

    const handleCopyBankDetails = (userId: string, text: string) => {
        navigator.clipboard.writeText(text);
        setCopyFeedback(userId);
        setTimeout(() => setCopyFeedback(null), 2000);
    };
    
    // Core Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [datePreset, setDatePreset] = useState<'HOJE' | '7D' | '30D' | '90D' | 'FUTURE'>('30D');
    const [responsibleFilter, setResponsibleFilter] = useState('ALL');
    const [categoryFilter, setCategoryFilter] = useState('ALL');
    const [clientFilter, setClientFilter] = useState('ALL');

    // Reports Custom Filters (Inputs)
    const [reportType, setReportType] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');
    const [reportStatus, setReportStatus] = useState<'ALL' | 'PAID' | 'PENDING'>('ALL');
    const [reportBankAccountId, setReportBankAccountId] = useState('ALL');
    const [reportCreditCardId, setReportCreditCardId] = useState('ALL');
    const [reportCategoryId, setReportCategoryId] = useState('ALL');
    const [reportResponsibleId, setReportResponsibleId] = useState('ALL');
    const [reportClientId, setReportClientId] = useState('ALL');
    const [reportMinAmount, setReportMinAmount] = useState('');
    const [reportMaxAmount, setReportMaxAmount] = useState('');
    const [reportSearchTerm, setReportSearchTerm] = useState('');
    const [reportStartDate, setReportStartDate] = useState(() => {
        const d = new Date();
        const firstDay = new Date(d.getFullYear(), d.getMonth(), 1);
        return firstDay.toISOString().split('T')[0];
    });
    const [reportEndDate, setReportEndDate] = useState(() => {
        const d = new Date();
        const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0);
        return lastDay.toISOString().split('T')[0];
    });

    // Applied states for reports
    const [appliedReportFilters, setAppliedReportFilters] = useState({
        type: 'ALL',
        status: 'ALL',
        bankAccountId: 'ALL',
        creditCardId: 'ALL',
        categoryId: 'ALL',
        responsibleId: 'ALL',
        clientId: 'ALL',
        minAmount: '',
        maxAmount: '',
        searchTerm: '',
        startDate: (() => {
            const d = new Date();
            const firstDay = new Date(d.getFullYear(), d.getMonth(), 1);
            return firstDay.toISOString().split('T')[0];
        })(),
        endDate: (() => {
            const d = new Date();
            const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0);
            return lastDay.toISOString().split('T')[0];
        })()
    });

    const handleApplyReportFilters = () => {
        setAppliedReportFilters({
            type: reportType,
            status: reportStatus,
            bankAccountId: reportBankAccountId,
            creditCardId: reportCreditCardId,
            categoryId: reportCategoryId,
            responsibleId: reportResponsibleId,
            clientId: reportClientId,
            minAmount: reportMinAmount,
            maxAmount: reportMaxAmount,
            searchTerm: reportSearchTerm,
            startDate: reportStartDate,
            endDate: reportEndDate
        });
    };

    const handleClearReportFilters = () => {
        setReportType('ALL');
        setReportStatus('ALL');
        setReportBankAccountId('ALL');
        setReportCreditCardId('ALL');
        setReportCategoryId('ALL');
        setReportResponsibleId('ALL');
        setReportClientId('ALL');
        setReportMinAmount('');
        setReportMaxAmount('');
        setReportSearchTerm('');
        
        const d = new Date();
        const firstDay = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
        const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];
        setReportStartDate(firstDay);
        setReportEndDate(lastDay);

        setAppliedReportFilters({
            type: 'ALL',
            status: 'ALL',
            bankAccountId: 'ALL',
            creditCardId: 'ALL',
            categoryId: 'ALL',
            responsibleId: 'ALL',
            clientId: 'ALL',
            minAmount: '',
            maxAmount: '',
            searchTerm: '',
            startDate: firstDay,
            endDate: lastDay
        });
    };

    const handleExportToCSV = () => {
        if (reportTransactions.length === 0) {
            alert('Não há dados para exportar.');
            return;
        }

        // CSV columns with proper semicolon delimiter (common for Excel in BR)
        const headers = ['Data', 'Descricao', 'Tipo', 'Conta/Cartao', 'Categoria', 'Situacao', 'Valor (R$)'];
        const rows = reportTransactions.map(t => {
            const catObj = categories.find(c => c.id === t.categoryId);
            const bankObj = bankAccounts.find(b => b.id === t.bankAccountId);
            const cardObj = creditCards.find(c => c.id === t.creditCardId);
            
            const dateStr = t.date.split('-').reverse().join('/');
            const typeStr = t.type === 'INCOME' ? 'Receita' : 'Despesa';
            const sourceStr = bankObj ? bankObj.name : cardObj ? `${cardObj.name} (Cartão)` : 'Geral';
            const catStr = catObj?.name || 'Geral';
            const statusStr = t.status === 'PAID' ? 'LIQUIDADO' : 'PENDENTE';
            const amountStr = t.amount.toFixed(2).replace('.', ',');

            return [
                dateStr,
                `"${t.description.replace(/"/g, '""')}"`,
                typeStr,
                `"${sourceStr.replace(/"/g, '""')}"`,
                `"${catStr.replace(/"/g, '""')}"`,
                statusStr,
                amountStr
            ];
        });

        const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(e => e.join(';'))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `relatorio_financeiro_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Date Bounds
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        const firstDay = new Date(d.getFullYear(), d.getMonth(), 1);
        return firstDay.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => {
        const d = new Date();
        const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0);
        return lastDay.toISOString().split('T')[0];
    });

    // Handle Custom datePreset changes
    useEffect(() => {
        const today = new Date();
        let start = new Date();
        let end = new Date();

        switch (datePreset) {
            case 'HOJE':
                break;
            case '7D':
                start.setDate(today.getDate() - 7);
                break;
            case '30D':
                start.setDate(today.getDate() - 30);
                break;
            case '90D':
                start.setDate(today.getDate() - 90);
                break;
            case 'FUTURE':
                start = new Date();
                end.setDate(today.getDate() + 90); // Future 90 days forecast
                break;
        }
        setStartDate(start.toISOString().split('T')[0]);
        setEndDate(end.toISOString().split('T')[0]);
    }, [datePreset]);

    // Modals
    const [isTxModalOpen, setIsTxModalOpen] = useState(false);
    const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
    const [isAssetLossModalOpen, setIsAssetLossModalOpen] = useState(false);
    const [isStockModalOpen, setIsStockModalOpen] = useState(false);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
    const [isCardModalOpen, setIsCardModalOpen] = useState(false);

    // Editing selection
    const [editingTx, setEditingTx] = useState<Partial<FinancialTransaction> | null>(null);
    const [editingAsset, setEditingAsset] = useState<Partial<Asset> | null>(null);
    const [assetForLoss, setAssetForLoss] = useState<Asset | null>(null);
    const [lossJustificationText, setLossJustificationText] = useState('');
    const [editingStock, setEditingStock] = useState<Partial<StockItem> | null>(null);
    const [editingCategory, setEditingCategory] = useState<Partial<FinancialCategory> | null>(null);
    const [editingAccount, setEditingAccount] = useState<Partial<BankAccount> | null>(null);
    const [editingCard, setEditingCard] = useState<Partial<CreditCard> | null>(null);

    // Delete conflict resolution modal
    const [isConflictModalOpen, setIsConflictModalOpen] = useState(false);
    const [conflictType, setConflictType] = useState<'ACCOUNT' | 'CARD' | null>(null);
    const [conflictTargetId, setConflictTargetId] = useState<string>('');
    const [conflictTransactions, setConflictTransactions] = useState<FinancialTransaction[]>([]);
    const [selectedTxIds, setSelectedTxIds] = useState<Record<string, boolean>>({});
    const [isDeletingConflict, setIsDeletingConflict] = useState(false);

    // AI Analysis Cache
    const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
    const [isAiLoading, setIsAiLoading] = useState(false);

    // Clear direct selections from navigation
    useEffect(() => {
        if (selectedTransactionId) {
            setActiveTab('ACCOUNTS_RECEIVABLE');
            setSearchTerm(selectedTransactionId);
            if (onClearSelectedTransaction) onClearSelectedTransaction();
        }
    }, [selectedTransactionId, onClearSelectedTransaction]);

    useEffect(() => {
        if (selectedInvoiceId) {
            setActiveTab('CASH_FLOW');
            if (onClearSelectedInvoice) onClearSelectedInvoice();
        }
    }, [selectedInvoiceId, onClearSelectedInvoice]);

    // Prepopulate system with default categories if empty
    const ensureDefaultCategories = async () => {
        const defaults: Omit<FinancialCategory, 'id'>[] = [
            { name: 'Salários', type: 'EXPENSE', color: '#f43f5e' },
            { name: 'Freelancers', type: 'EXPENSE', color: '#f97316' },
            { name: 'Tráfego Pago', type: 'EXPENSE', color: '#3b82f6' },
            { name: 'Assinaturas', type: 'EXPENSE', color: '#a855f7' },
            { name: 'Impressões', type: 'EXPENSE', color: '#eab308' },
            { name: 'Equipamentos', type: 'EXPENSE', color: '#06b6d4' },
            { name: 'Impostos', type: 'EXPENSE', color: '#ec4899' },
            { name: 'Honorários de Clientes', type: 'INCOME', color: '#10b981' }
        ];

        const confirm = await openConfirm({
            title: 'Configurar Categorias Padrão',
            description: 'Deseja criar as categorias recomendadas (Salários, Freelancers, Tráfego Pago, Assinaturas, Impressões, Equipamentos, Impostos) no seu banco de dados financeiro?',
            variant: 'info'
        });

        if (confirm) {
            const list: FinancialCategory[] = [];
            for (const item of defaults) {
                // Check if already exists
                const existing = categories.find(c => c.name.toLowerCase() === item.name.toLowerCase());
                if (!existing) {
                    const id = `cat-${Math.random().toString(36).substring(2, 9)}`;
                    const newCat = { id, ...item };
                    await saveFinancialCategory(newCat);
                    list.push(newCat);
                } else {
                    list.push(existing);
                }
            }
            setCategories(prev => {
                const map = new Map(prev.map(c => [c.id, c]));
                list.forEach(c => map.set(c.id, c));
                return Array.from(map.values());
            });
        }
    };

    // Filtered lists
    const filteredTxs = useMemo(() => {
        return transactions.filter(t => {
            const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (clients.find(c => c.id === t.clientId)?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
            const matchesResponsible = responsibleFilter === 'ALL' || t.responsibleId === responsibleFilter;
            const matchesCategory = categoryFilter === 'ALL' || t.categoryId === categoryFilter;
            const matchesClient = clientFilter === 'ALL' || t.clientId === clientFilter;
            const matchesDate = datePreset === 'FUTURE' ? (t.date >= startDate) : (t.date >= startDate && t.date <= endDate);

            return matchesSearch && matchesResponsible && matchesCategory && matchesClient && matchesDate;
        }).sort((a, b) => b.date.localeCompare(a.date));
    }, [transactions, searchTerm, responsibleFilter, categoryFilter, clientFilter, startDate, endDate, datePreset, clients]);

    // Relatórios Memo
    const reportTransactions = useMemo(() => {
        return transactions.filter(t => {
            if (appliedReportFilters.type !== 'ALL' && t.type !== appliedReportFilters.type) return false;
            if (appliedReportFilters.status !== 'ALL' && t.status !== appliedReportFilters.status) return false;
            
            if (appliedReportFilters.bankAccountId !== 'ALL' && t.bankAccountId !== appliedReportFilters.bankAccountId) return false;
            if (appliedReportFilters.creditCardId !== 'ALL' && t.creditCardId !== appliedReportFilters.creditCardId) return false;
            if (appliedReportFilters.categoryId !== 'ALL' && t.categoryId !== appliedReportFilters.categoryId) return false;
            if (appliedReportFilters.responsibleId !== 'ALL' && t.responsibleId !== appliedReportFilters.responsibleId) return false;
            if (appliedReportFilters.clientId !== 'ALL' && t.clientId !== appliedReportFilters.clientId) return false;
            
            if (appliedReportFilters.startDate && t.date < appliedReportFilters.startDate) return false;
            if (appliedReportFilters.endDate && t.date > appliedReportFilters.endDate) return false;
            
            const minAmt = appliedReportFilters.minAmount ? parseFloat(appliedReportFilters.minAmount) : null;
            const maxAmt = appliedReportFilters.maxAmount ? parseFloat(appliedReportFilters.maxAmount) : null;
            if (minAmt !== null && t.amount < minAmt) return false;
            if (maxAmt !== null && t.amount > maxAmt) return false;
            
            if (appliedReportFilters.searchTerm) {
                const term = appliedReportFilters.searchTerm.toLowerCase();
                const descMatch = t.description.toLowerCase().includes(term);
                const clientMatch = (clients.find(c => c.id === t.clientId)?.name || '').toLowerCase().includes(term);
                if (!descMatch && !clientMatch) return false;
            }
            
            return true;
        }).sort((a, b) => b.date.localeCompare(a.date));
    }, [transactions, appliedReportFilters, clients]);

    // Relatórios Stats
    const reportStats = useMemo(() => {
        const income = reportTransactions.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + t.amount, 0);
        const expense = reportTransactions.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + t.amount, 0);
        const balance = income - expense;
        const totalCount = reportTransactions.length;
        const paidCount = reportTransactions.filter(t => t.status === 'PAID').length;
        const pendingCount = totalCount - paidCount;

        const categoryGroups: { [key: string]: number } = {};
        reportTransactions.forEach(t => {
            const cat = categories.find(c => c.id === t.categoryId)?.name || 'Geral';
            categoryGroups[cat] = (categoryGroups[cat] || 0) + t.amount;
        });
        const categoryData = Object.entries(categoryGroups).map(([name, val]) => ({ name, value: val })).sort((a,b)=> b.value - a.value);

        return { income, expense, balance, totalCount, paidCount, pendingCount, categoryData };
    }, [reportTransactions, categories]);

    // Derived Statistics
    const stats = useMemo(() => {
        const totalBalance = bankAccounts.reduce((sum, curr) => sum + curr.balance, 0);
        
        // Sum up from all transactions matching current filters
        const inPeriodPaidIncome = transactions
            .filter(t => t.type === 'INCOME' && t.status === 'PAID' && t.date >= startDate && t.date <= endDate)
            .reduce((sum, t) => sum + t.amount, 0);

        const inPeriodPaidExpense = transactions
            .filter(t => t.type === 'EXPENSE' && t.status === 'PAID' && t.date >= startDate && t.date <= endDate)
            .reduce((sum, t) => sum + t.amount, 0);

        const periodProfit = inPeriodPaidIncome - inPeriodPaidExpense;

        // Active vs Disposed Assets write-offs value
        const activeAssetsWorth = assets
            .filter(a => a.status === 'ACTIVE' || a.status === 'MAINTENANCE')
            .reduce((sum, a) => sum + (a.currentValue || 0), 0);

        const justifiedAssetLossesSum = assets
            .filter(a => a.status === 'DISPOSED')
            .reduce((sum, a) => sum + (a.purchaseValue || 0), 0);

        // MRR Calculation
        const recurringMRR = clients
            .filter(c => c.status === 'ACTIVE' && c.isRecurring && c.monthlyValue)
            .reduce((sum, c) => sum + (c.monthlyValue || 0), 0);

        return {
            totalBalance,
            inPeriodPaidIncome,
            inPeriodPaidExpense,
            periodProfit,
            activeAssetsWorth,
            justifiedAssetLossesSum,
            recurringMRR
        };
    }, [bankAccounts, transactions, assets, clients, startDate, endDate]);

    // Handle quick AI analysis request
    const handleTriggerAiAnalysis = async () => {
        setIsAiLoading(true);
        try {
            const briefResult = await analyzeFinancialHealth(transactions);
            setAiAnalysis(briefResult);
        } catch (err) {
            console.error(err);
            setAiAnalysis('Não foi possível obter a análise da inteligência artificial neste momento.');
        } finally {
            setIsAiLoading(false);
        }
    };

    // Recurrent clients integration calculations
    const recurrentClients = useMemo(() => {
        return clients.filter(c => c.status === 'ACTIVE' && c.isRecurring && (c.monthlyValue || 0) > 0);
    }, [clients]);

    // Future Projections Calculation (Requirement 3)
    const forecastTimeline = useMemo(() => {
        const months = 3;
        const timeline: { monthName: string, expectedIncome: number, expectedExpense: number, netPos: number }[] = [];
        const today = new Date();

        for (let i = 0; i < months; i++) {
            const d = new Date(today.getFullYear(), today.getMonth() + i, 15);
            const yyyymm = d.toISOString().substring(0, 7);
            const monthLabel = d.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });

            // Future pending ledger items in this month
            const ledgerIncome = transactions
                .filter(t => t.type === 'INCOME' && t.status === 'PENDING' && t.date.substring(0, 7) === yyyymm)
                .reduce((sum, t) => sum + t.amount, 0);

            const ledgerExpense = transactions
                .filter(t => t.type === 'EXPENSE' && t.status === 'PENDING' && t.date.substring(0, 7) === yyyymm)
                .reduce((sum, t) => sum + t.amount, 0);

            // Add client contract baseline recurring expectancies for this month (as secure projections)
            const contractMonthlyIncome = recurrentClients.reduce((sum, c) => sum + (c.monthlyValue || 0), 0);

            timeline.push({
                monthName: monthLabel.toUpperCase(),
                expectedIncome: ledgerIncome + contractMonthlyIncome,
                expectedExpense: ledgerExpense,
                netPos: (ledgerIncome + contractMonthlyIncome) - ledgerExpense
            });
        }
        return timeline;
    }, [transactions, recurrentClients]);

    // Ledger Transaction Save/Toggle utilities
    const handleSaveTransactionLocal = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingTx?.description || !editingTx?.amount || !editingTx?.categoryId) return;

        const txPayload: FinancialTransaction = {
            id: editingTx.id || `tx-${Date.now()}`,
            description: editingTx.description,
            amount: Number(editingTx.amount),
            type: editingTx.type || 'EXPENSE',
            date: editingTx.date || new Date().toISOString().split('T')[0],
            status: editingTx.status || 'PENDING',
            categoryId: editingTx.categoryId,
            bankAccountId: editingTx.bankAccountId || undefined,
            clientId: editingTx.clientId || undefined,
            responsibleId: editingTx.responsibleId || currentUser.id,
            createdAt: editingTx.createdAt || Date.now()
        };

        if (onSaveTransaction) {
            await onSaveTransaction(txPayload);
        } else {
            setTransactions(prev => [txPayload, ...prev.filter(x => x.id !== txPayload.id)]);
        }

        // Adjust Account balance if status switched to PAID inside this action modal
        if (txPayload.status === 'PAID' && txPayload.bankAccountId) {
            setBankAccounts(prev => prev.map(acc => {
                if (acc.id === txPayload.bankAccountId) {
                    const diff = txPayload.type === 'INCOME' ? txPayload.amount : -txPayload.amount;
                    const updated = { ...acc, balance: acc.balance + diff };
                    saveBankAccount(updated).catch(console.error);
                    return updated;
                }
                return acc;
            }));
        }

        setIsTxModalOpen(false);
        setEditingTx(null);
    };

    const handleToggleTxStatus = async (tx: FinancialTransaction) => {
        const nextStatus = tx.status === 'PAID' ? 'PENDING' : 'PAID';
        const updated: FinancialTransaction = { ...tx, status: nextStatus };

        if (onSaveTransaction) {
            await onSaveTransaction(updated);
        } else {
            setTransactions(prev => prev.map(t => t.id === tx.id ? updated : t));
        }

        // Adjust bank account balance on payment toggle
        if (tx.bankAccountId) {
            setBankAccounts(prev => prev.map(acc => {
                if (acc.id === tx.bankAccountId) {
                    const val = tx.type === 'INCOME' ? tx.amount : -tx.amount;
                    const factor = nextStatus === 'PAID' ? val : -val;
                    const updatedAcc = { ...acc, balance: acc.balance + factor };
                    saveBankAccount(updatedAcc).catch(console.error);
                    return updatedAcc;
                }
                return acc;
            }));
        }
    };

    const handleDeleteTxLocal = async (id: string) => {
        const confirm = await openConfirm({
            title: 'Excluir Transação',
            description: 'Tem certeza de que deseja expurgar permanentemente este registro financeiro?',
            variant: 'danger'
        });
        if (confirm) {
            const matched = transactions.find(t => t.id === id);
            if (matched && matched.status === 'PAID' && matched.bankAccountId) {
                // Revert account balance before deleting
                setBankAccounts(prev => prev.map(acc => {
                    if (acc.id === matched.bankAccountId) {
                        const amt = matched.type === 'INCOME' ? -matched.amount : matched.amount;
                        const updated = { ...acc, balance: acc.balance + amt };
                        saveBankAccount(updated).catch(console.error);
                        return updated;
                    }
                    return acc;
                }));
            }
            if (onDeleteTransaction) {
                await onDeleteTransaction(id);
            } else {
                setTransactions(prev => prev.filter(t => t.id !== id));
            }
        }
    };

    // Client Monthly Recurring Billing Trigger (Requirement 4)
    const handleLaunchClientMonthlyFee = async (client: Client) => {
        if (!client.monthlyValue) return;

        const confirm = await openConfirm({
            title: 'Lançar Faturamento Mensal',
            description: `Deseja registrar o faturamento de R$ ${client.monthlyValue.toLocaleString('pt-BR')} do cliente ${client.name} para a competência de hoje?`,
            variant: 'info'
        });

        if (confirm) {
            // Find appropriate Income Category
            const incCat = categories.find(c => c.type === 'INCOME' || c.type === 'BOTH') || categories[0];
            const matchedBankAccount = bankAccounts[0]; // pick first default account if available

            const billingTransaction: FinancialTransaction = {
                id: `billing-${client.id}-${Date.now()}`,
                description: `MENSALIDADE CONTRATUAL - ${client.name.toUpperCase()}`,
                amount: client.monthlyValue,
                type: 'INCOME',
                date: new Date().toISOString().split('T')[0],
                status: 'PENDING',
                categoryId: incCat?.id || 'cat-income-default',
                clientId: client.id,
                bankAccountId: matchedBankAccount?.id || undefined,
                responsibleId: client.responsibleId || currentUser.id,
                createdAt: Date.now()
            };

            if (onSaveTransaction) {
                await onSaveTransaction(billingTransaction);
            } else {
                setTransactions(prev => [billingTransaction, ...prev]);
            }
        }
    };

    // Editable Categories save/delete
    const handleSaveCategoryLocal = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingCategory?.name) return;

        const catPayload: FinancialCategory = {
            id: editingCategory.id || `cat-${Math.random().toString(36).substring(2, 9)}`,
            name: editingCategory.name,
            type: editingCategory.type || 'EXPENSE',
            color: editingCategory.color || '#64748b'
        };

        const res = await saveFinancialCategory(catPayload);
        if (res.success) {
            setCategories(prev => {
                const match = prev.find(x => x.id === catPayload.id);
                if (match) return prev.map(x => x.id === catPayload.id ? catPayload : x);
                return [...prev, catPayload];
            });
            setIsCategoryModalOpen(false);
            setEditingCategory(null);
        }
    };

    const handleDeleteCategoryLocal = async (id: string) => {
        const isProtected = ['cat1', 'cat2', 'cat3', 'cat4', 'cat5', 'cat6', 'cat7'].includes(id);
        if (isProtected) {
            alert('Esta categoria é do sistema original e protegida contra exclusão.');
            return;
        }

        const confirm = await openConfirm({
            title: 'Remover Categoria',
            description: 'Deseja excluir esta categoria? As transações vinculadas a ela não serão excluídas, mas ficarão sem categoria vinculada.',
            variant: 'danger'
        });

        if (confirm) {
            const res = await deleteFinancialCategory(id);
            if (res.success) {
                setCategories(prev => prev.filter(c => c.id !== id));
            }
        }
    };

    const handleSaveBankAccountLocal = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingAccount?.name || !editingAccount?.bankName) return;

        const accPayload: BankAccount = {
            id: editingAccount.id || `ba-${Math.random().toString(36).substring(2, 9)}`,
            name: editingAccount.name,
            bankName: editingAccount.bankName,
            type: editingAccount.type || 'CHECKING',
            balance: editingAccount.balance !== undefined ? Number(editingAccount.balance) : 0,
            color: editingAccount.color || '#10b981',
            status: editingAccount.status || 'ACTIVE'
        };

        const res = await saveBankAccount(accPayload);
        if (res.success) {
            setBankAccounts(prev => {
                const match = prev.find(x => x.id === accPayload.id);
                if (match) return prev.map(x => x.id === accPayload.id ? accPayload : x);
                return [...prev, accPayload];
            });
            setIsAccountModalOpen(false);
            setEditingAccount(null);
        } else {
            alert('Erro ao salvar conta bancária no banco de dados.');
        }
    };

    const handleDeleteBankAccountLocal = async (id: string) => {
        const linkedTxs = transactions.filter(t => t.bankAccountId === id);
        
        if (linkedTxs.length > 0) {
            // There are linked transactions - show the custom conflict resolution modal!
            const initialSelected: Record<string, boolean> = {};
            linkedTxs.forEach(t => {
                initialSelected[t.id] = false;
            });
            setConflictTransactions(linkedTxs);
            setSelectedTxIds(initialSelected);
            setConflictTargetId(id);
            setConflictType('ACCOUNT');
            setIsConflictModalOpen(true);
            return;
        }

        const confirm = await openConfirm({
            title: 'Excluir Conta Bancária',
            description: 'Deseja excluir esta conta bancária?',
            variant: 'danger'
        });

        if (confirm) {
            const res = await deleteBankAccount(id);
            if (res.success) {
                setBankAccounts(prev => prev.filter(c => c.id !== id));
            } else {
                alert('Erro ao excluir conta bancária do banco de dados.');
            }
        }
    };

    const handleSaveCreditCardLocal = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingCard?.name || !editingCard?.brand) return;

        const cardPayload: CreditCard = {
            id: editingCard.id || `cc-${Math.random().toString(36).substring(2, 9)}`,
            name: editingCard.name,
            brand: editingCard.brand,
            limit: editingCard.limit !== undefined ? Number(editingCard.limit) : 0,
            availableLimit: editingCard.availableLimit !== undefined ? Number(editingCard.availableLimit) : 0,
            closingDay: editingCard.closingDay || 10,
            dueDate: editingCard.dueDate || 20,
            color: editingCard.color || '#000000',
            status: editingCard.status || 'ACTIVE'
        };

        const res = await saveCreditCard(cardPayload);
        if (res.success) {
            setCreditCards(prev => {
                const match = prev.find(x => x.id === cardPayload.id);
                if (match) return prev.map(x => x.id === cardPayload.id ? cardPayload : x);
                return [...prev, cardPayload];
            });
            setIsCardModalOpen(false);
            setEditingCard(null);
        } else {
            alert('Erro ao salvar cartão no banco de dados.');
        }
    };

    const handleDeleteCreditCardLocal = async (id: string) => {
        const linkedTxs = transactions.filter(t => t.creditCardId === id);
        
        if (linkedTxs.length > 0) {
            // There are linked transactions - show the custom conflict resolution modal!
            const initialSelected: Record<string, boolean> = {};
            linkedTxs.forEach(t => {
                initialSelected[t.id] = false;
            });
            setConflictTransactions(linkedTxs);
            setSelectedTxIds(initialSelected);
            setConflictTargetId(id);
            setConflictType('CARD');
            setIsConflictModalOpen(true);
            return;
        }

        const confirm = await openConfirm({
            title: 'Excluir Cartão de Crédito',
            description: 'Deseja excluir este cartão de crédito?',
            variant: 'danger'
        });

        if (confirm) {
            const res = await deleteCreditCard(id);
            if (res.success) {
                setCreditCards(prev => prev.filter(c => c.id !== id));
            } else {
                alert('Erro ao excluir cartão do banco de dados.');
            }
        }
    };

    const handleResolveConflictAndDelete = async () => {
        const doubleConfirm = await openConfirm({
            title: 'Confirmar Exclusão Permanente',
            description: 'Tem certeza de que deseja excluir permanentemente todas as transações selecionadas e este item? Esta ação NÃO PODERÁ SER DESFEITA!',
            variant: 'danger'
        });

        if (!doubleConfirm) return;

        setIsDeletingConflict(true);
        try {
            const txIdsToDelete = Object.keys(selectedTxIds).filter(id => selectedTxIds[id]);

            let allTxDeleted = true;
            for (const txId of txIdsToDelete) {
                const res = await deleteFinancialTransaction(txId);
                if (!res.success) {
                    allTxDeleted = false;
                }
            }

            if (!allTxDeleted) {
                alert('Algumas transações não puderam ser excluídas. Por favor, tente novamente.');
                setIsDeletingConflict(false);
                return;
            }

            setTransactions(prev => prev.filter(t => !txIdsToDelete.includes(t.id)));

            if (conflictType === 'ACCOUNT') {
                const res = await deleteBankAccount(conflictTargetId);
                if (res.success) {
                    setBankAccounts(prev => prev.filter(c => c.id !== conflictTargetId));
                    setIsConflictModalOpen(false);
                } else {
                    alert('Erro ao excluir a conta bancária após a remoção das transações.');
                }
            } else if (conflictType === 'CARD') {
                const res = await deleteCreditCard(conflictTargetId);
                if (res.success) {
                    setCreditCards(prev => prev.filter(c => c.id !== conflictTargetId));
                    setIsConflictModalOpen(false);
                } else {
                    alert('Erro ao excluir o cartão de crédito após a remoção das transações.');
                }
            }
        } catch (err) {
            console.error('Erro na remoção em cascata:', err);
            alert('Encontrou-se um erro ao processar a exclusão permanente.');
        } finally {
            setIsDeletingConflict(false);
        }
    };

    // Assets Control with written loss justifications (Requirement 5)
    const handleSaveAssetLocal = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingAsset?.name || !editingAsset?.purchaseValue) return;

        const payload: Asset = {
            id: editingAsset.id || `as-${Date.now()}`,
            name: editingAsset.name,
            category: editingAsset.category || 'HARDWARE',
            purchaseDate: editingAsset.purchaseDate || new Date().toISOString().split('T')[0],
            purchaseValue: Number(editingAsset.purchaseValue),
            currentValue: Number(editingAsset.currentValue || editingAsset.purchaseValue),
            status: editingAsset.status || 'ACTIVE',
            location: editingAsset.location || '',
            responsibleId: editingAsset.responsibleId || undefined,
            serialNumber: editingAsset.serialNumber || '',
            description: editingAsset.description || '',
            lossJustification: editingAsset.lossJustification || undefined
        };

        if (onSaveAsset) {
            await onSaveAsset(payload);
        } else {
            setAssets(prev => [payload, ...prev.filter(x => x.id !== payload.id)]);
        }
        setIsAssetModalOpen(false);
        setEditingAsset(null);
    };

    // Trigger explicit asset loss justification write-off
    const handleInitiateAssetLoss = (asset: Asset) => {
        setAssetForLoss(asset);
        setLossJustificationText('');
        setIsAssetLossModalOpen(true);
    };

    const handleConfirmAssetLoss = async () => {
        if (!assetForLoss || !lossJustificationText.trim()) return;

        const updated: Asset = {
            ...assetForLoss,
            status: 'DISPOSED',
            currentValue: 0, // Valueless now
            lossJustification: lossJustificationText.trim()
        };

        if (onSaveAsset) {
            await onSaveAsset(updated);
        } else {
            setAssets(prev => prev.map(a => a.id === assetForLoss.id ? updated : a));
        }

        // Also optionally register a specific Expense transaction reflecting this loss
        const lossCat = categories.find(c => c.name.toLowerCase().includes('equipamento') || c.name.toLowerCase().includes('imposto')) || categories[0];
        const lossTransaction: FinancialTransaction = {
            id: `assetloss-${updated.id}-${Date.now()}`,
            description: `[PREJUÍZO ATIVO] BAIXA DE ${updated.name.toUpperCase()} - MOTIVO: ${lossJustificationText.toUpperCase()}`,
            amount: updated.purchaseValue,
            type: 'EXPENSE',
            date: new Date().toISOString().split('T')[0],
            status: 'PAID', // Book-keeper expense
            categoryId: lossCat?.id || 'loss-cat',
            responsibleId: currentUser.id,
            createdAt: Date.now()
        };

        if (onSaveTransaction) {
            await onSaveTransaction(lossTransaction);
        } else {
            setTransactions(prev => [lossTransaction, ...prev]);
        }

        setIsAssetLossModalOpen(false);
        setAssetForLoss(null);
    };

    // Inventory Controls (Requirement 6)
    const handleSaveStockLocal = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingStock?.name || editingStock.quantity === undefined) return;

        const payload: StockItem = {
            id: editingStock.id || `st-${Date.now()}`,
            name: editingStock.name,
            category: editingStock.category || 'Geral',
            quantity: Number(editingStock.quantity),
            minQuantity: Number(editingStock.minQuantity || 0),
            unit: editingStock.unit || 'un',
            price: Number(editingStock.price || 0),
            location: editingStock.location || ''
        };

        if (onSaveStockItem) {
            await onSaveStockItem(payload);
        } else {
            setStock(prev => [payload, ...prev.filter(x => x.id !== payload.id)]);
        }
        setIsStockModalOpen(false);
        setEditingStock(null);
    };

    const handleAdjustQuantity = async (item: StockItem, delta: number) => {
        const nextQty = Math.max(0, item.quantity + delta);
        const updated = { ...item, quantity: nextQty };

        if (onSaveStockItem) {
            await onSaveStockItem(updated);
        } else {
            setStock(prev => prev.map(s => s.id === item.id ? updated : s));
        }
    };

    return (
        <div className="flex flex-col h-full space-y-6 animate-pop">
            
            {/* Elegant Tabular & Preset Ribbon Header */}
            <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm p-6">
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-pink-50 text-pink-500 rounded-2xl">
                            <DollarSign size={28} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black tracking-tight text-slate-800">Financeiro</h2>
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Controle de Fluxo, Ativos & Metas</p>
                        </div>
                    </div>

                    {/* Navigation Subtabs */}
                    <div className="flex flex-wrap gap-2">
                        {[
                            { id: 'DASHBOARD', label: 'Resumo', icon: PieChart },
                            { id: 'ACCOUNTS_RECEIVABLE', label: 'A Receber', icon: ArrowUpCircle },
                            { id: 'ACCOUNTS_PAYABLE', label: 'A Pagar', icon: ArrowDownCircle },
                            { id: 'CASH_FLOW', label: 'Fluxo Diário', icon: History },
                            { id: 'ACCOUNTS_CARDS', label: 'Contas & Cartões', icon: Wallet },
                            { id: 'ASSETS', label: 'Ativos', icon: Box },
                            { id: 'STOCK', label: 'Estoque', icon: Package },
                            { id: 'COMMISSIONS', label: 'Comissões', icon: Calculator },
                            { id: 'COLLABORATORS_BANKS', label: 'Dados Bancários', icon: CardIcon },
                            { id: 'REPORTS', label: 'Relatórios', icon: FileText }
                        ].map(sub => (
                            <button
                                key={sub.id}
                                onClick={() => setActiveTab(sub.id as TabType)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-200 ${
                                    activeTab === sub.id 
                                        ? 'bg-slate-900 text-white shadow-lg' 
                                        : 'bg-white hover:bg-slate-50 text-slate-500 border border-slate-200'
                                }`}
                            >
                                <sub.icon size={13} />
                                {sub.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Subheader Filters Panel */}
                <div className="mt-6 pt-6 border-t border-slate-100 flex flex-wrap gap-4 items-center justify-between">
                    <div className="flex flex-wrap gap-3 items-center">
                        <div className="flex bg-slate-100 p-1 rounded-xl">
                            {[
                                { id: 'HOJE', text: 'Hoje' },
                                { id: '7D', text: '7 dias' },
                                { id: '30D', text: '30 dias' },
                                { id: '90D', text: '90 dias' },
                                { id: 'FUTURE', text: 'Prognóstico' }
                            ].map(pre => (
                                <button
                                    key={pre.id}
                                    onClick={() => setDatePreset(pre.id as any)}
                                    className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all ${
                                        datePreset === pre.id 
                                            ? 'bg-white text-slate-900 shadow-sm' 
                                            : 'text-slate-500 hover:text-slate-900'
                                    }`}
                                >
                                    {pre.text}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600">
                            <Calendar size={13} className="text-slate-400" />
                            <span>{startDate.split('-').reverse().join('/')} - {endDate.split('-').reverse().join('/')}</span>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-3 items-center w-full lg:w-auto">
                        <div className="relative flex-1 lg:flex-initial">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                            <input
                                type="text"
                                placeholder="Procurar transação ou cliente..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full lg:w-64 pl-9 pr-4 py-2 bg-slate-50 hover:bg-slate-100/50 border border-slate-200 focus:bg-white focus:ring-1 focus:ring-slate-400 focus:outline-none rounded-xl text-xs font-bold text-slate-700 transition"
                            />
                        </div>

                        <button
                            onClick={() => {
                                setEditingTx({
                                    type: activeTab === 'ACCOUNTS_PAYABLE' ? 'EXPENSE' : 'INCOME',
                                    status: 'PENDING',
                                    date: new Date().toISOString().split('T')[0],
                                    responsibleId: currentUser.id
                                });
                                setIsTxModalOpen(true);
                            }}
                            className="bg-pink-500 hover:bg-pink-600 text-white font-black text-[10px] uppercase tracking-wider py-2.5 px-4 rounded-xl flex items-center gap-2 shadow-lg shadow-pink-500/10 transition"
                        >
                            <Plus size={14} /> Nova Transação
                        </button>
                    </div>
                </div>
            </div>

            {/* Main view router */}
            <div className="flex-1 overflow-y-auto min-h-0">
                <AnimatePresence mode="wait">
                    
                    {/* 0. DASHBOARD Tab */}
                    {activeTab === 'DASHBOARD' && (
                        <motion.div
                            key="dashboard"
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="space-y-6"
                        >
                            {/* Key Performance Indicators Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-premium relative overflow-hidden group">
                                    <div className="absolute right-0 top-0 p-4 opacity-10 text-emerald-500"><Wallet size={64} /></div>
                                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Saldo total em caixa</p>
                                    <h3 className="text-2xl font-black text-slate-800 tracking-tight mt-1">R$ {(stats.totalBalance || 0).toLocaleString('pt-BR')}</h3>
                                    <p className="text-[10px] text-slate-400 mt-2 font-semibold">Consolidado contas correntes</p>
                                </div>

                                <div className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-premium relative overflow-hidden group">
                                    <div className="absolute right-0 top-0 p-4 opacity-10 text-blue-500"><TrendingUp size={64} /></div>
                                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Entradas Liquidada (Período)</p>
                                    <h3 className="text-2xl font-black text-emerald-600 tracking-tight mt-1">R$ {(stats.inPeriodPaidIncome || 0).toLocaleString('pt-BR')}</h3>
                                    <p className="text-[10px] text-emerald-500 mt-2 font-bold flex items-center gap-1">🟢 Total receitas pagas</p>
                                </div>

                                <div className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-premium relative overflow-hidden group">
                                    <div className="absolute right-0 top-0 p-4 opacity-10 text-red-500"><TrendingDown size={64} /></div>
                                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Saídas Liquidada (Período)</p>
                                    <h3 className="text-2xl font-black text-red-600 tracking-tight mt-1">R$ {(stats.inPeriodPaidExpense || 0).toLocaleString('pt-BR')}</h3>
                                    <p className="text-[10px] text-red-500 mt-2 font-bold flex items-center gap-1">🔴 Total despesas pagas</p>
                                </div>

                                <div className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-premium relative overflow-hidden group">
                                    <div className="absolute right-0 top-0 p-4 opacity-10 text-purple-500"><Building2 size={64} /></div>
                                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Margem Operacional (Período)</p>
                                    <h3 className={`text-2xl font-black tracking-tight mt-1 ${stats.periodProfit >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
                                        R$ {(stats.periodProfit || 0).toLocaleString('pt-BR')}
                                    </h3>
                                    <p className="text-[10px] text-slate-400 mt-2 font-semibold">Lucro líquido no intervalo</p>
                                </div>
                            </div>

                            {/* Secondary KPIs: MRR, Assets summary, Alerts */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                
                                {/* Chart Panel */}
                                <div className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-[36px] border border-slate-100 shadow-premium">
                                    <div className="flex items-center justify-between mb-6">
                                        <div>
                                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Evolução do Fluxo de Caixa</h3>
                                            <p className="text-slate-400 text-[10px] font-semibold">Entradas e saídas de recursos</p>
                                        </div>
                                    </div>
                                    <div className="h-64 w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={forecastTimeline}>
                                                <defs>
                                                    <linearGradient id="incomeCol" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                                    </linearGradient>
                                                    <linearGradient id="expenseCol" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                <XAxis dataKey="monthName" tick={{ fontSize: 9, fontWeight: 'bold' }} stroke="#cbd5e1" />
                                                <YAxis tick={{ fontSize: 9, fontWeight: 'bold' }} stroke="#cbd5e1" />
                                                <Tooltip />
                                                <Legend wrapperStyle={{ fontSize: 10, fontWeight: 'bold' }} />
                                                <Area type="monotone" name="Receita Projetada (Contratos + Pendentes)" dataKey="expectedIncome" stroke="#10b981" fillOpacity={1} fill="url(#incomeCol)" />
                                                <Area type="monotone" name="Saída Projetada (Pendentes)" dataKey="expectedExpense" stroke="#ef4444" fillOpacity={1} fill="url(#expenseCol)" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* MRR, Asset Prejuízo Accumulated & Action Box */}
                                <div className="space-y-6">
                                    <div className="bg-slate-900 text-white p-6 rounded-[32px] border border-slate-800 shadow-2xl relative overflow-hidden">
                                        <div className="absolute right-0 bottom-0 p-6 translate-x-4 translate-y-4 opacity-5 text-indigo-400"><TrendingUp size={128} /></div>
                                        <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest">Mensalidades Recorrentes Ativas (MRR)</p>
                                        <h4 className="text-3xl font-black text-indigo-400 tracking-tight mt-1">R$ {(stats?.recurringMRR ?? 0).toLocaleString('pt-BR')}</h4>
                                        <p className="text-[10px] text-slate-300 mt-2 leading-relaxed font-semibold">
                                            Valor garantido contratualmente com os {recurrentClients.length} clientes ativos sob assinatura.
                                        </p>
                                        <button
                                            onClick={() => setActiveTab('ACCOUNTS_RECEIVABLE')}
                                            className="mt-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-[9px] font-black uppercase tracking-wider py-2 px-4 rounded-xl transition"
                                        >
                                            Verificar Lista Recorrente
                                        </button>
                                    </div>

                                    <div className="bg-[#fffefe] p-6 rounded-[32px] border border-slate-100 shadow-premium relative overflow-hidden">
                                        <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest">Indice de Perda e Baixa de Ativos</p>
                                        <h4 className="text-2xl font-black text-rose-500 tracking-tight mt-1">R$ {(stats?.justifiedAssetLossesSum ?? 0).toLocaleString('pt-BR')}</h4>
                                        <p className="text-[10px] text-slate-500 mt-2 leading-relaxed font-semibold">
                                            Custo original total de ativos inutilizados ou descartados com justificativa escrita.
                                        </p>
                                        <button
                                            onClick={() => setActiveTab('ASSETS')}
                                            className="mt-4 bg-slate-50 hover:bg-slate-100 text-slate-600 text-[9px] font-black uppercase tracking-wider py-2 px-4 rounded-xl border border-slate-200 transition"
                                        >
                                            Auditar Prejuízos
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Inteligência Analítica desativada pelo usuário */}
                        </motion.div>
                    )}

                    {/* 1. ACCOUNTS_RECEIVABLE Tab (Contas a Receber) */}
                    {activeTab === 'ACCOUNTS_RECEIVABLE' && (
                        <motion.div
                            key="accounts_receivable"
                            initial={{ opacity: 0, x: 15 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0 }}
                            className="grid grid-cols-1 xl:grid-cols-3 gap-6"
                        >
                            {/* Receivables Table & Controls */}
                            <div className="xl:col-span-2 space-y-6">
                                <div className="bg-white rounded-[32px] border border-slate-100 shadow-premium overflow-hidden">
                                    <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                                        <div>
                                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Contas a Receber</h3>
                                            <p className="text-xs font-bold text-slate-800 mt-1">Fluxos de faturamento cadastrados</p>
                                        </div>
                                        <span className="bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                                            {filteredTxs.filter(t => t.type === 'INCOME').length} Registros
                                        </span>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse min-w-[650px]">
                                            <thead>
                                                <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                                    <th className="px-6 py-4">Data</th>
                                                    <th className="px-6 py-4">Descrição</th>
                                                    <th className="px-6 py-4">Faturamento</th>
                                                    <th className="px-6 py-4">Categoria</th>
                                                    <th className="px-6 py-4 text-center">Situação</th>
                                                    <th className="px-6 py-4 text-right">Ação</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50 text-xs font-medium text-slate-700">
                                                {filteredTxs.filter(t => t.type === 'INCOME').map(t => (
                                                    <tr key={t.id} className="hover:bg-slate-50/50 transition">
                                                        <td className="px-6 py-4 font-mono text-[11px] whitespace-nowrap">
                                                            {t.date.split('-').reverse().join('/')}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="font-bold text-slate-800">{t.description}</div>
                                                            {t.clientId && (
                                                                <div className="text-[10px] text-slate-400 font-semibold mt-0.5">
                                                                    Cliente: {clients.find(c => c.id === t.clientId)?.name || 'Desconhecido'}
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 font-black text-emerald-600 whitespace-nowrap">
                                                            R$ {(t?.amount ?? 0).toLocaleString('pt-BR')}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className="text-[10px] px-2.5 py-1 rounded-lg font-bold uppercase" style={{
                                                                backgroundColor: (categories.find(c => c.id === t.categoryId)?.color || '#94a3b8') + '15',
                                                                color: (categories.find(c => c.id === t.categoryId)?.color || '#475569')
                                                            }}>
                                                                {categories.find(c => c.id === t.categoryId)?.name || 'Geral'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <button
                                                                onClick={() => handleToggleTxStatus(t)}
                                                                className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider border leading-none transition ${
                                                                    t.status === 'PAID'
                                                                        ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100/50'
                                                                        : 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100/50'
                                                                }`}
                                                            >
                                                                {t.status === 'PAID' ? 'RECEBIDO 🟢' : 'A RECEBER 🟡'}
                                                            </button>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <div className="flex justify-end gap-1">
                                                                <button
                                                                    onClick={() => {
                                                                        setEditingTx(t);
                                                                        setIsTxModalOpen(true);
                                                                    }}
                                                                    className="p-1 px-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition"
                                                                >
                                                                    <Edit2 size={12} />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteTxLocal(t.id)}
                                                                    className="p-1 px-2 bg-slate-50 border border-transparent hover:border-red-100 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                                                                >
                                                                    <Trash2 size={12} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {filteredTxs.filter(t => t.type === 'INCOME').length === 0 && (
                                                    <tr>
                                                        <td colSpan={6} className="text-center py-10 font-semibold text-slate-400">
                                                            Nenhuma conta a receber localizada para os filtros definidos.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            {/* Requirement 4: Active Clients Monthly recurrence generator */}
                            <div className="space-y-6">
                                <div className="bg-[#fafbfc] border border-slate-200 rounded-[32px] p-6">
                                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2">Mensalistas Recorrentes (CRM)</h3>
                                    <p className="text-xs text-slate-400 leading-relaxed font-semibold mb-6">
                                        Identifique ativos comerciais com contratos fechados, de acordo com o módulo de CRM, e lance sua respectiva mensalidade em fluxo com apenas um clique.
                                    </p>

                                    <div className="space-y-3 max-h-[460px] overflow-y-auto">
                                        {recurrentClients.map(c => {
                                            // Check if already has any billing transaction on this calendar month
                                            const thisMonth = new Date().toISOString().substring(0, 7);
                                            const hasTriggeredThisMonth = transactions.some(t => t.clientId === c.id && t.date.substring(0, 7) === thisMonth);

                                            return (
                                                <div key={c.id} className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm flex items-center justify-between gap-3">
                                                    <div>
                                                        <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-black uppercase">
                                                            Contrato Ativo
                                                        </span>
                                                        <h4 className="text-xs font-black text-slate-800 mt-1 tracking-tight">{c.name}</h4>
                                                        <div className="text-[10px] text-slate-400 font-semibold mt-0.5">
                                                            Mensal: <strong className="text-emerald-500">R$ {(c.monthlyValue || 0).toLocaleString('pt-BR')}</strong>
                                                        </div>
                                                        {c.contractStartDate && (
                                                            <div className="text-[9px] text-slate-400 mt-0.5">Vencimento: dia {c.contractStartDate.split('-')[2] || '10'}</div>
                                                        )}
                                                    </div>

                                                    <button
                                                        onClick={() => handleLaunchClientMonthlyFee(c)}
                                                        disabled={hasTriggeredThisMonth}
                                                        className={`font-black text-[9px] uppercase tracking-wider py-2 px-3 rounded-lg border transition ${
                                                            hasTriggeredThisMonth
                                                                ? 'bg-slate-50 text-slate-400 border-slate-100 cursor-not-allowed'
                                                                : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm border-transparent'
                                                        }`}
                                                    >
                                                        {hasTriggeredThisMonth ? '✓ Gerado Mês' : 'Lançar'}
                                                    </button>
                                                </div>
                                            );
                                        })}
                                        {recurrentClients.length === 0 && (
                                            <div className="text-center py-8 font-semibold text-slate-400 text-xs">
                                                Nenhum cliente recorrente ativo cadastrado no CRM.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* 2. ACCOUNTS_PAYABLE Tab (Contas a Pagar) */}
                    {activeTab === 'ACCOUNTS_PAYABLE' && (
                        <motion.div
                            key="accounts_payable"
                            initial={{ opacity: 0, x: -15 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0 }}
                            className="grid grid-cols-1 xl:grid-cols-3 gap-6"
                        >
                            {/* Payables Ledger Table */}
                            <div className="xl:col-span-2 space-y-6">
                                <div className="bg-white rounded-[32px] border border-slate-100 shadow-premium overflow-hidden">
                                    <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                                        <div>
                                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Contas a Pagar</h3>
                                            <p className="text-xs font-bold text-slate-800 mt-1">Registros de saídas e despesas</p>
                                        </div>
                                        <span className="bg-rose-50 text-rose-600 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-rose-100">
                                            {filteredTxs.filter(t => t.type === 'EXPENSE').length} Contas
                                        </span>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse min-w-[650px]">
                                            <thead>
                                                <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                                    <th className="px-6 py-4">Vencimento</th>
                                                    <th className="px-6 py-4">Descrição</th>
                                                    <th className="px-6 py-4">Valor</th>
                                                    <th className="px-6 py-4">Categoria / Destino</th>
                                                    <th className="px-6 py-4 text-center">Esforço</th>
                                                    <th className="px-6 py-4 text-right">Ação</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50 text-xs font-medium text-slate-700">
                                                {filteredTxs.filter(t => t.type === 'EXPENSE').map(t => (
                                                    <tr key={t.id} className="hover:bg-slate-50/50 transition">
                                                        <td className="px-6 py-4 font-mono text-[11px] whitespace-nowrap">
                                                            {t.date.split('-').reverse().join('/')}
                                                        </td>
                                                        <td className="px-6 py-4 font-bold text-slate-800">
                                                            {t.description}
                                                            {t.bankAccountId && (
                                                                <div className="text-[10px] text-slate-400 font-semibold mt-0.5">
                                                                    Banco: {bankAccounts.find(ba => ba.id === t.bankAccountId)?.name || 'Conta Geral'}
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 font-black text-rose-600 whitespace-nowrap">
                                                            R$ {(t?.amount ?? 0).toLocaleString('pt-BR')}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className="text-[10px] px-2.5 py-1 rounded-lg font-bold uppercase" style={{
                                                                backgroundColor: (categories.find(c => c.id === t.categoryId)?.color || '#94a3b8') + '15',
                                                                color: (categories.find(c => c.id === t.categoryId)?.color || '#475569')
                                                            }}>
                                                                {categories.find(c => c.id === t.categoryId)?.name || 'Operacional'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <button
                                                                onClick={() => handleToggleTxStatus(t)}
                                                                className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider border leading-none transition ${
                                                                    t.status === 'PAID'
                                                                        ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100/50'
                                                                        : 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100/50'
                                                                }`}
                                                            >
                                                                {t.status === 'PAID' ? 'PAGO 🟢' : 'A PAGAR 🔴'}
                                                            </button>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <div className="flex justify-end gap-1">
                                                                <button
                                                                    onClick={() => {
                                                                        setEditingTx(t);
                                                                        setIsTxModalOpen(true);
                                                                    }}
                                                                    className="p-1 px-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition"
                                                                >
                                                                    <Edit2 size={12} />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteTxLocal(t.id)}
                                                                    className="p-1 px-2 bg-slate-50 border border-transparent hover:border-red-100 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                                                                >
                                                                    <Trash2 size={12} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {filteredTxs.filter(t => t.type === 'EXPENSE').length === 0 && (
                                                    <tr>
                                                        <td colSpan={6} className="text-center py-10 font-semibold text-slate-400">
                                                            Nenhuma despesa cadastrada nos parâmetros pesquisados.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            {/* Categorias Editáveis Segment (Salários, Freelancers, etc) */}
                            <div className="space-y-6">
                                <div className="bg-white border border-slate-200 shadow-sm rounded-[32px] p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">Gestão de Categorias</h3>
                                        <button
                                            onClick={() => ensureDefaultCategories()}
                                            className="text-[9px] font-black text-indigo-600 uppercase hover:underline"
                                        >
                                            Resetar Padrão
                                        </button>
                                    </div>
                                    <p className="text-xs text-slate-400 leading-relaxed font-semibold mb-6">
                                        Cria e edite categorias operacionais (como Salários, Assinaturas, Impostos) de acordo com o fluxo interno.
                                    </p>

                                    <div className="space-y-2.5 max-h-[365px] overflow-y-auto mb-4">
                                        {categories.map(cat => (
                                            <div key={cat.id} className="flex items-center justify-between p-3.5 bg-slate-50/50 rounded-xl border border-slate-100">
                                                <div className="flex items-center gap-2.5">
                                                    <span className="w-3 h-3 rounded-full shadow-sm shrink-0" style={{ backgroundColor: cat.color }} />
                                                    <span className="text-xs font-bold text-slate-700">{cat.name}</span>
                                                    <span className="text-[9px] font-black uppercase text-slate-400">
                                                        ({cat.type === 'EXPENSE' ? 'Saída' : cat.type === 'INCOME' ? 'Entrada' : 'Ambos'})
                                                    </span>
                                                </div>
                                                <div className="flex gap-1">
                                                    <button
                                                        onClick={() => {
                                                            setEditingCategory(cat);
                                                            setIsCategoryModalOpen(true);
                                                        }}
                                                        className="text-[10px] text-slate-400 hover:text-slate-700 font-bold px-1.5 py-0.5 rounded transition"
                                                    >
                                                        Editar
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteCategoryLocal(cat.id)}
                                                        className="text-[10px] text-slate-400 hover:text-rose-600 font-bold px-1.5 py-0.5 rounded transition"
                                                    >
                                                        Excluir
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <button
                                        onClick={() => {
                                            setEditingCategory({
                                                type: 'EXPENSE',
                                                color: '#10b981'
                                            });
                                            setIsCategoryModalOpen(true);
                                        }}
                                        className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 text-slate-600 text-xs font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition"
                                    >
                                        <Plus size={14} /> Novo Categoria
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* 3. CASH_FLOW Tab (Fluxo Diário / Forecast) */}
                    {activeTab === 'CASH_FLOW' && (
                        <motion.div
                            key="cash_flow"
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="bg-white rounded-[32px] border border-slate-100 shadow-premium p-6 sm:p-8 space-y-6"
                        >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
                                <div>
                                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Fluxo de Caixa Diário</h3>
                                    <p className="text-slate-400 text-[10px] font-semibold">Agrupamento consolidado das entradas e saídas físicas do caixa</p>
                                </div>
                                <span className="bg-slate-100 text-slate-700 font-mono text-[10px] font-bold py-1 px-3 rounded-full">
                                    Histórico agrupado por dia
                                </span>
                            </div>

                            {/* Aggregating transactions daily */}
                            {(() => {
                                const dailyMap: Record<string, { income: number; expense: number; items: FinancialTransaction[] }> = {};
                                filteredTxs.forEach(t => {
                                    if (!dailyMap[t.date]) {
                                        dailyMap[t.date] = { income: 0, expense: 0, items: [] };
                                    }
                                    if (t.status === 'PAID') {
                                        if (t.type === 'INCOME') dailyMap[t.date].income += t.amount;
                                        else dailyMap[t.date].expense += t.amount;
                                    }
                                    dailyMap[t.date].items.push(t);
                                });

                                const dailyDates = Object.keys(dailyMap).sort((a, b) => b.localeCompare(a));

                                if (dailyDates.length === 0) {
                                    return (
                                        <div className="text-center py-16 text-slate-400 font-semibold">
                                            Nenhum movimento registrado no período selecionado.
                                        </div>
                                    );
                                }

                                return (
                                    <div className="space-y-6">
                                        {dailyDates.map(date => {
                                            const dayData = dailyMap[date];
                                            const dLabel = new Date(date + 'T00:00:00').toLocaleDateString('pt-BR', {
                                                weekday: 'long',
                                                day: 'numeric',
                                                month: 'long'
                                            });

                                            return (
                                                <div key={date} className="border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
                                                    <div className="bg-slate-50/70 p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                                        <span className="text-xs font-black text-slate-700 capitalize flex items-center gap-2">
                                                            <Calendar size={13} className="text-slate-400" /> {dLabel} ({date.split('-').reverse().join('/')})
                                                        </span>
                                                        <div className="flex gap-4 text-[11px] font-bold">
                                                            <span className="text-emerald-600">Entrada: R$ {dayData.income.toLocaleString('pt-BR')}</span>
                                                            <span className="text-rose-600">Saída: R$ {dayData.expense.toLocaleString('pt-BR')}</span>
                                                        </div>
                                                    </div>

                                                    <div className="divide-y divide-slate-100 bg-white">
                                                        {dayData.items.map(it => (
                                                            <div key={it.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-medium hover:bg-slate-50/50 transition">
                                                                <div className="space-y-1">
                                                                    <div className="font-bold text-slate-800 flex items-center gap-2">
                                                                        {it.type === 'INCOME' ? '🟢' : '🔴'} {it.description}
                                                                    </div>
                                                                    <div className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">
                                                                        Categoria: {categories.find(c => c.id === it.categoryId)?.name || 'Geral'} | 
                                                                        Resp: {users.find(u => u.id === it.responsibleId)?.name || 'Admin'}
                                                                    </div>
                                                                </div>

                                                                <div className="flex items-center gap-6 justify-between sm:justify-end">
                                                                    <div className={`font-black text-sm ${it.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                                        {it.type === 'INCOME' ? '+' : '-'} R$ {it.amount.toLocaleString('pt-BR')}
                                                                    </div>
                                                                    <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-xl leading-none border ${
                                                                        it.status === 'PAID'
                                                                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                                            : 'bg-amber-50 text-amber-600 border-amber-100'
                                                                    }`}>
                                                                        {it.status === 'PAID' ? 'Liquidado' : 'Aberto'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })()}
                        </motion.div>
                    )}

                    {/* 4. ASSETS Tab (Controle de Ativos com Baixa Justificada) */}
                    {activeTab === 'ASSETS' && (
                        <motion.div
                            key="assets"
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="space-y-6"
                        >
                            <div className="bg-white rounded-[32px] border border-slate-100 p-6 sm:p-8 shadow-premium flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="space-y-1">
                                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Controle e Ativos da Agência</h3>
                                    <p className="text-slate-400 text-[10px] font-semibold">Hardware, licenças de software, mobiliário e veículos operacionais</p>
                                </div>
                                <div className="flex gap-3">
                                    <div className="bg-rose-50 text-rose-700 px-4 py-2.5 rounded-2xl border border-rose-100 text-[10px] font-black uppercase tracking-wider">
                                        Prejuízo Unidades Baixadas: R$ {(stats?.justifiedAssetLossesSum ?? 0).toLocaleString('pt-BR')}
                                    </div>
                                    <button
                                        onClick={() => {
                                            setEditingAsset({
                                                category: 'HARDWARE',
                                                status: 'ACTIVE',
                                                purchaseDate: new Date().toISOString().split('T')[0],
                                                purchaseValue: 0,
                                                currentValue: 0
                                            });
                                            setIsAssetModalOpen(true);
                                        }}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-wider py-2.5 px-4 rounded-xl flex items-center gap-2 shadow-md transition"
                                    >
                                        <Plus size={14} /> Novo Ativo
                                    </button>
                                </div>
                            </div>

                            {/* Assets Listing Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {assets.map(a => (
                                    <div key={a.id} className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-premium flex flex-col justify-between space-y-4">
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-xl leading-none border ${
                                                    a.category === 'HARDWARE' ? 'bg-cyan-50 text-cyan-700 border-cyan-100' :
                                                    a.category === 'SOFTWARE' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                                                    'bg-amber-50 text-amber-700 border-amber-100'
                                                }`}>
                                                    {a.category}
                                                </span>

                                                <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-xl leading-none border ${
                                                    a.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                    a.status === 'MAINTENANCE' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                                                    'bg-rose-50 text-rose-700 border-rose-100' // DISPOSED
                                                }`}>
                                                    {a.status === 'DISPOSED' ? 'BAIXADO/PREJUÍZO' : a.status}
                                                </span>
                                            </div>

                                            <div>
                                                <h4 className="text-sm font-black text-slate-800 tracking-tight">{a.name}</h4>
                                                {a.serialNumber && <p className="text-[10px] text-slate-400 font-mono mt-0.5">S/N: {a.serialNumber}</p>}
                                            </div>

                                            <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-2xl text-[11px] font-bold text-slate-600">
                                                <div>
                                                    <span className="text-[9px] text-slate-400 block font-semibold leading-none">Compra:</span>
                                                    R$ {a.purchaseValue.toLocaleString('pt-BR')}
                                                </div>
                                                <div>
                                                    <span className="text-[9px] text-slate-400 block font-semibold leading-none">Atual:</span>
                                                    R$ {a.status === 'DISPOSED' ? '0' : (a.currentValue || 0).toLocaleString('pt-BR')}
                                                </div>
                                            </div>

                                            {/* Detailed write-off written justifications status display (Requirement 5) */}
                                            {a.status === 'DISPOSED' && a.lossJustification && (
                                                <div className="bg-red-50/50 p-3.5 rounded-2xl border border-red-100 text-[10px] text-red-700 leading-relaxed font-bold">
                                                    💔 JUSTIFICATIVA DO PREJUÍZO:<br />
                                                    <span className="text-slate-600 font-medium italic">"{a.lossJustification}"</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex gap-2 pt-2 border-t border-slate-50 justify-between items-center">
                                            {a.status !== 'DISPOSED' ? (
                                                <button
                                                    onClick={() => handleInitiateAssetLoss(a)}
                                                    className="text-[10px] bg-red-50 hover:bg-red-100 text-red-600 border border-red-150 font-black uppercase tracking-wider px-3 py-2 rounded-xl transition"
                                                >
                                                    Dar Baixa (Prejuízo)
                                                </button>
                                            ) : (
                                                <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Unidade Baixada</span>
                                            )}

                                            <div className="flex gap-1">
                                                {a.status !== 'DISPOSED' && (
                                                    <button
                                                        onClick={() => {
                                                            setEditingAsset(a);
                                                            setIsAssetModalOpen(true);
                                                        }}
                                                        className="p-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-500 transition"
                                                    >
                                                        <Edit2 size={12} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={async () => {
                                                        const confirm = await openConfirm({
                                                            title: 'Excluir Ativo',
                                                            description: 'Tem certeza que deseja deletar este cadastro de Ativo?',
                                                            variant: 'danger'
                                                        });
                                                        if (confirm) {
                                                            if (onDeleteAsset) await onDeleteAsset(a.id);
                                                            else setAssets(prev => prev.filter(x => x.id !== a.id));
                                                        }
                                                    }}
                                                    className="p-2 text-slate-400 hover:text-red-500 transition"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* 5. STOCK Tab (Inventário / Estoque) */}
                    {activeTab === 'STOCK' && (
                        <motion.div
                            key="stock"
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="bg-white rounded-[32px] border border-slate-100 shadow-premium p-6 sm:p-8 space-y-6"
                        >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
                                <div>
                                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Estoque e Insumos Físicos</h3>
                                    <p className="text-slate-400 text-[10px] font-semibold">Gerencie suprimentos, itens de escritório e brindes promocionais</p>
                                </div>
                                <button
                                    onClick={() => {
                                        setEditingStock({
                                            quantity: 0,
                                            minQuantity: 1,
                                            price: 0,
                                            unit: 'un'
                                        });
                                        setIsStockModalOpen(true);
                                    }}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-wider py-2.5 px-4 rounded-xl flex items-center gap-2 shadow-md transition"
                                >
                                    <Plus size={14} /> Novo Item
                                </button>
                            </div>

                            {/* Inventory Table (Requirement 6) */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse min-w-[700px]">
                                    <thead>
                                        <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                            <th className="px-6 py-4">Item</th>
                                            <th className="px-6 py-4">Categoria</th>
                                            <th className="px-6 py-4">Preço Unitário</th>
                                            <th className="px-6 py-4 text-center">Quantidade Atual / Mínima</th>
                                            <th className="px-6 py-4 text-center">Controles rápidos</th>
                                            <th className="px-6 py-4 text-right">Ação</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                                        {stock.map(item => {
                                            const isLow = item.quantity <= item.minQuantity;

                                            return (
                                                <tr key={item.id} className="hover:bg-slate-50/20 transition">
                                                    <td className="px-6 py-4">
                                                        <div className="font-bold text-slate-800">{item.name}</div>
                                                        {item.location && <div className="text-[10px] text-slate-400 font-medium">Local: {item.location}</div>}
                                                    </td>
                                                    <td className="px-6 py-4 font-normal text-slate-600">{item.category}</td>
                                                    <td className="px-6 py-4 text-slate-800 font-bold">R$ {item.price.toLocaleString('pt-BR')}</td>
                                                    <td className="px-6 py-4 text-center">
                                                        <div className="flex flex-col items-center">
                                                            <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase ${
                                                                isLow 
                                                                    ? 'bg-rose-50 text-rose-600 border border-rose-100 animate-pulse' 
                                                                    : 'bg-slate-100 text-slate-700'
                                                            }`}>
                                                                {item.quantity} {item.unit} / Mín: {item.minQuantity} {item.unit}
                                                            </span>
                                                            {isLow && (
                                                                <span className="text-[9px] text-rose-500 font-black uppercase tracking-widest mt-1 flex items-center gap-1">
                                                                    ⚠️ Compra Urgente
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex justify-center gap-2">
                                                            <button
                                                                onClick={() => handleAdjustQuantity(item, -1)}
                                                                className="w-7 h-7 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-lg flex items-center justify-center font-bold text-slate-600 transition"
                                                            >
                                                                -
                                                            </button>
                                                            <button
                                                                onClick={() => handleAdjustQuantity(item, 1)}
                                                                className="w-7 h-7 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-lg flex items-center justify-center font-bold text-slate-600 transition"
                                                            >
                                                                +
                                                            </button>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex justify-end gap-1">
                                                            <button
                                                                onClick={() => {
                                                                    setEditingStock(item);
                                                                    setIsStockModalOpen(true);
                                                                }}
                                                                className="p-1 px-2 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-lg transition"
                                                            >
                                                                Editar
                                                            </button>
                                                            <button
                                                                onClick={async () => {
                                                                    const confirm = await openConfirm({
                                                                        title: 'Remover suprimento',
                                                                        description: `Tem certeza que deseja apagar o registro de estoque ${item.name}?`,
                                                                        variant: 'danger'
                                                                    });
                                                                    if (confirm) {
                                                                        if (onDeleteStockItem) await onDeleteStockItem(item.id);
                                                                        else setStock(prev => prev.filter(x => x.id !== item.id));
                                                                    }
                                                                }}
                                                                className="p-1 px-2 text-slate-400 hover:text-red-500 rounded-lg transition"
                                                            >
                                                                <Trash2 size={12} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {stock.length === 0 && (
                                            <tr>
                                                <td colSpan={6} className="text-center py-10 font-semibold text-slate-400">
                                                    Nenhum insumo de estoque cadastrado.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>
                    )}

                    {/* 6. COMMISSIONS Tab (Requirement 7) */}
                    {activeTab === 'COMMISSIONS' && (
                        <motion.div
                            key="commissions"
                            initial={{ opacity: 0, x: 15 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0 }}
                        >
                            {/* Renders commission module seamlessly */}
                            <CommissionDashboard 
                                users={users}
                                leads={leads}
                                bankAccounts={bankAccounts}
                                categories={categories}
                                currentUser={currentUser}
                                startDate={startDate}
                                endDate={endDate}
                                onSaveTransaction={onSaveTransaction}
                                setTransactions={setTransactions}
                                setBankAccounts={setBankAccounts}
                            />
                        </motion.div>
                    )}

                    {/* 7.5. COLLABORATORS_BANKS Tab */}
                    {activeTab === 'COLLABORATORS_BANKS' && (
                        <motion.div
                            key="collaborators_banks"
                            initial={{ opacity: 0, x: 15 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0 }}
                            className="space-y-6 text-left"
                        >
                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] text-slate-450 font-extrabold uppercase tracking-wider mb-1">Membros da Equipe</p>
                                        <h3 className="text-2xl font-black text-slate-800">
                                            {users.filter(u => u.role !== 'CLIENT').length}
                                        </h3>
                                    </div>
                                    <div className="bg-slate-50 p-3.5 rounded-2xl text-slate-700">
                                        <Users size={18} />
                                    </div>
                                </div>

                                <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] text-slate-450 font-extrabold uppercase tracking-wider mb-1">Com Chave PIX / Código de Banco</p>
                                        <h3 className="text-2xl font-black text-emerald-600">
                                            {users.filter(u => u.role !== 'CLIENT' && u.bankDetails?.trim()).length}
                                        </h3>
                                    </div>
                                    <div className="bg-emerald-50/50 p-3.5 rounded-2xl text-emerald-600">
                                        <CheckCircle2 size={18} />
                                    </div>
                                </div>

                                <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] text-slate-450 font-extrabold uppercase tracking-wider mb-1">Dados Bancários Pendentes</p>
                                        <h3 className="text-2xl font-black text-amber-600">
                                            {users.filter(u => u.role !== 'CLIENT' && !u.bankDetails?.trim()).length}
                                        </h3>
                                    </div>
                                    <div className="bg-amber-50/50 p-3.5 rounded-2xl text-amber-600">
                                        <AlertTriangle size={18} />
                                    </div>
                                </div>
                            </div>

                            {/* Filter and Search Panel */}
                            <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                                <div className="relative w-full md:w-96">
                                    <Search className="absolute left-4 top-3.5 text-slate-400" size={16} />
                                    <input 
                                        type="text"
                                        placeholder="Buscar por nome ou e-mail..."
                                        className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl py-3 pl-11 pr-4 text-sm outline-none focus:bg-white focus:border-slate-900 transition-all font-semibold text-slate-800"
                                        value={bankSearch}
                                        onChange={e => setBankSearch(e.target.value)}
                                    />
                                </div>

                                <div className="flex gap-2 items-center w-full md:w-auto">
                                    <span className="text-[10px] text-slate-400 font-bold uppercase whitespace-nowrap">Filtrar Cargo:</span>
                                    <select
                                        className="bg-slate-50 border border-slate-200/80 rounded-2xl py-2.5 px-4 text-xs font-bold text-slate-700 outline-none focus:border-slate-900 focus:bg-white transition-all w-full md:w-48 appearance-none"
                                        value={bankRoleFilter}
                                        onChange={e => setBankRoleFilter(e.target.value)}
                                    >
                                        <option value="ALL">Todos os Cargos</option>
                                        <option value="EMPLOYEE">Colaborador</option>
                                        <option value="FREELANCER">Freelancer</option>
                                        <option value="FINANCE">Financeiro</option>
                                        <option value="COMMERCIAL">Comercial</option>
                                        <option value="MANAGER">Gerente</option>
                                        <option value="ADMIN">Administrador</option>
                                    </select>
                                </div>
                            </div>

                            {/* Main List Table */}
                            <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-slate-100 bg-slate-50/50">
                                                <th className="p-5 text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Membro da Equipe</th>
                                                <th className="p-5 text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Cargo</th>
                                                <th className="p-5 text-[10px] font-extrabold uppercase text-slate-400 tracking-wider text-right">Contrato (Base)</th>
                                                <th className="p-5 text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Dados Bancários / PIX</th>
                                                <th className="p-5 text-[10px] font-extrabold uppercase text-slate-400 tracking-wider text-right">Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 text-sm">
                                            {(() => {
                                                const filtered = users
                                                    .filter(u => u.role !== 'CLIENT')
                                                    .filter(u => {
                                                        const matchSearch = u.name.toLowerCase().includes(bankSearch.toLowerCase()) || 
                                                                            u.email.toLowerCase().includes(bankSearch.toLowerCase());
                                                        const matchRole = bankRoleFilter === 'ALL' || u.role === bankRoleFilter;
                                                        return matchSearch && matchRole;
                                                    });

                                                if (filtered.length === 0) {
                                                    return (
                                                        <tr>
                                                            <td colSpan={5} className="p-8 text-center text-slate-400 font-bold">
                                                                Nenhum colaborador ou freelancer encontrado com estes filtros.
                                                            </td>
                                                        </tr>
                                                    );
                                                }

                                                return filtered.map(u => {
                                                    const cleanBankDetails = u.bankDetails?.trim() || '';
                                                    const isCopied = copyFeedback === u.id;
                                                    
                                                    return (
                                                        <tr key={u.id} className="hover:bg-slate-50/40 transition-colors">
                                                            {/* User Info */}
                                                            <td className="p-5">
                                                                <div className="flex items-center gap-3">
                                                                    <img 
                                                                        src={u.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${u.name}`} 
                                                                        className="w-10 h-10 rounded-full border border-slate-100 bg-slate-50" 
                                                                        onError={e => {
                                                                            (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${u.name}`;
                                                                        }}
                                                                    />
                                                                    <div className="flex flex-col">
                                                                        <span className="font-extrabold text-slate-800 text-sm leading-tight">{u.name}</span>
                                                                        <span className="text-[11px] text-slate-450 font-medium">{u.email}</span>
                                                                    </div>
                                                                </div>
                                                            </td>

                                                            {/* Cargo */}
                                                            <td className="p-5">
                                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider ${
                                                                    u.role === 'ADMIN' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                                                                    u.role === 'MANAGER' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                                                    u.role === 'COMMERCIAL_MANAGER' ? 'bg-orange-50 text-orange-700 border border-orange-100' :
                                                                    u.role === 'FINANCE' ? 'bg-teal-50 text-teal-700 border border-teal-100' :
                                                                    u.role === 'FREELANCER' ? 'bg-purple-50 text-purple-700 border border-purple-100' :
                                                                    u.role === 'COMMERCIAL' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                                                                    'bg-slate-100 text-slate-600'
                                                                }`}>
                                                                    {u.role === 'ADMIN' ? 'Admin' :
                                                                     u.role === 'MANAGER' ? 'Gerente' :
                                                                     u.role === 'COMMERCIAL_MANAGER' ? 'Gerente Comercial' :
                                                                     u.role === 'FINANCE' ? 'Financeiro' :
                                                                     u.role === 'EMPLOYEE' ? 'Colaborador' :
                                                                     u.role === 'FREELANCER' ? 'Freelancer' :
                                                                     u.role === 'COMMERCIAL' ? 'Comercial' : u.role}
                                                                </span>
                                                            </td>

                                                            {/* Pagamentos */}
                                                            <td className="p-5 text-right font-semibold">
                                                                <div className="flex flex-col text-slate-700 text-xs">
                                                                    {u.salary ? (
                                                                        <span>Salário: <strong className="text-slate-900 font-extrabold">R$ {u.salary.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></span>
                                                                    ) : null}
                                                                    {u.hourlyRate ? (
                                                                        <span>Valor Hora: <strong className="text-slate-900 font-black">R$ {u.hourlyRate.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></span>
                                                                    ) : null}
                                                                    {!u.salary && !u.hourlyRate && (
                                                                        <span className="text-slate-400 italic font-medium">Não definido</span>
                                                                    )}
                                                                </div>
                                                            </td>

                                                            {/* Dados Bancarios / PIX */}
                                                            <td className="p-5">
                                                                {cleanBankDetails ? (
                                                                    <div className="flex items-center gap-2 max-w-sm">
                                                                        <div className="bg-slate-50 border border-slate-150 text-slate-600 rounded-xl p-2.5 font-mono text-xs whitespace-pre-line leading-normal shadow-inner line-clamp-1 max-h-[38px] overflow-hidden flex-1 select-all relative">
                                                                            {cleanBankDetails}
                                                                        </div>
                                                                        <button
                                                                            onClick={() => handleCopyBankDetails(u.id, cleanBankDetails)}
                                                                            className={`p-2.5 rounded-xl border flex items-center justify-center transition-all duration-200 cursor-pointer ${
                                                                                isCopied
                                                                                    ? 'bg-emerald-50 border-emerald-300 text-emerald-600 scale-105'
                                                                                    : 'bg-white hover:bg-slate-50 text-slate-500 border-slate-200 hover:text-slate-800'
                                                                            }`}
                                                                            title={isCopied ? "Copiado!" : "Copiar dados bancários"}
                                                                        >
                                                                            {isCopied ? <Check size={14} /> : <FileText size={14} />}
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <span className="inline-flex items-center gap-1.5 text-xs text-amber-500 font-bold bg-amber-50/50 px-3 py-1 rounded-full border border-amber-100/60 animate-pulse">
                                                                        <AlertTriangle size={12} /> Dados Pendentes
                                                                    </span>
                                                                )}
                                                            </td>

                                                            {/* Actions */}
                                                            <td className="p-5 text-right">
                                                                <button
                                                                    onClick={() => {
                                                                        setEditingBankUser(u);
                                                                        setBankDetailsInput(u.bankDetails || '');
                                                                        setSalaryInput(u.salary ? u.salary.toString() : '');
                                                                        setHourlyRateInput(u.hourlyRate ? u.hourlyRate.toString() : '');
                                                                    }}
                                                                    className="bg-white hover:bg-slate-100 text-slate-700 font-extrabold text-[10px] uppercase tracking-wider py-2 px-4 rounded-xl border border-slate-200 shadow-sm transition-all duration-200 cursor-pointer"
                                                                >
                                                                    Editar Info
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                });
                                            })()}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* 8. REPORTS Tab */}
                    {activeTab === 'REPORTS' && (
                        <motion.div
                            key="reports"
                            initial={{ opacity: 0, x: 15 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0 }}
                            className="space-y-6"
                        >
                            {/* Filtros Customizados do Relatório */}
                            <div className="bg-white p-6 sm:p-8 rounded-[32px] border border-slate-200 shadow-sm space-y-6">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div>
                                         <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Filtros Avançados de Relatório</h3>
                                         <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Configure os parâmetros e clique em "Aplicar Filtros" para atualizar as estatísticas</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[9px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 px-3 py-1.5 rounded-xl border border-amber-100 flex items-center gap-1.5 animate-pulse">
                                            <SlidersHorizontal size={10} /> Filtro manual ativo
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {/* Busca por termo */}
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                                            <Search size={10} /> Busca Textual
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Buscar termo..."
                                            value={reportSearchTerm}
                                            onChange={e => setReportSearchTerm(e.target.value)}
                                            className="w-full text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:bg-white outline-none transition"
                                        />
                                    </div>

                                    {/* Data Inicial */}
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                                            <Calendar size={10} /> Período De
                                        </label>
                                        <input
                                            type="date"
                                            value={reportStartDate}
                                            onChange={e => setReportStartDate(e.target.value)}
                                            className="w-full text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:bg-white outline-none transition cursor-pointer"
                                        />
                                    </div>

                                    {/* Data Final */}
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                                            <Calendar size={10} /> Período Até
                                        </label>
                                        <input
                                            type="date"
                                            value={reportEndDate}
                                            onChange={e => setReportEndDate(e.target.value)}
                                            className="w-full text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:bg-white outline-none transition cursor-pointer"
                                        />
                                    </div>

                                    {/* Tipo */}
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">Tipo de Lançamento</label>
                                        <select
                                            value={reportType}
                                            onChange={e => setReportType(e.target.value as any)}
                                            className="w-full text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:bg-white outline-none transition cursor-pointer"
                                        >
                                            <option value="ALL">Todos os Tipos</option>
                                            <option value="INCOME">Receitas (Entradas)</option>
                                            <option value="EXPENSE">Despesas (Saídas)</option>
                                        </select>
                                    </div>

                                    {/* Situação */}
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">Situação</label>
                                        <select
                                            value={reportStatus}
                                            onChange={e => setReportStatus(e.target.value as any)}
                                            className="w-full text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:bg-white outline-none transition cursor-pointer"
                                        >
                                            <option value="ALL">Todas as Situações</option>
                                            <option value="PAID">Conciliado / Pago 🟢</option>
                                            <option value="PENDING">Pendente 🟡</option>
                                        </select>
                                    </div>

                                    {/* Conta Bancária */}
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">Conta Bancária</label>
                                        <select
                                            value={reportBankAccountId}
                                            onChange={e => setReportBankAccountId(e.target.value)}
                                            className="w-full text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:bg-white outline-none transition cursor-pointer"
                                        >
                                            <option value="ALL">Todas as Contas</option>
                                            {bankAccounts.map(b => (
                                                <option key={b.id} value={b.id}>{b.name} ({b.bankName})</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Cartão de Crédito */}
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">Cartão de Crédito</label>
                                        <select
                                            value={reportCreditCardId}
                                            onChange={e => setReportCreditCardId(e.target.value)}
                                            className="w-full text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:bg-white outline-none transition cursor-pointer"
                                        >
                                            <option value="ALL">Todos / Nenhum Cartão</option>
                                            {creditCards.map(c => (
                                                <option key={c.id} value={c.id}>{c.name} ({c.brand})</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Categoria */}
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">Categoria Financeira</label>
                                        <select
                                            value={reportCategoryId}
                                            onChange={e => setReportCategoryId(e.target.value)}
                                            className="w-full text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:bg-white outline-none transition cursor-pointer"
                                        >
                                            <option value="ALL">Todas as Categorias</option>
                                            {categories.map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Pessoa Responsável */}
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">Membro Responsável</label>
                                        <select
                                            value={reportResponsibleId}
                                            onChange={e => setReportResponsibleId(e.target.value)}
                                            className="w-full text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:bg-white outline-none transition cursor-pointer"
                                        >
                                            <option value="ALL">Membros no Time</option>
                                            {users.map(u => (
                                                <option key={u.id} value={u.id}>{u.name || u.email}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Cliente */}
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">Cliente Relacionado</label>
                                        <select
                                            value={reportClientId}
                                            onChange={e => setReportClientId(e.target.value)}
                                            className="w-full text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:bg-white outline-none transition cursor-pointer"
                                        >
                                            <option value="ALL">Todos os Clientes</option>
                                            {clients.map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Faixa de Valor */}
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">Mín. (R$)</label>
                                            <input
                                                type="number"
                                                placeholder="0"
                                                value={reportMinAmount}
                                                onChange={e => setReportMinAmount(e.target.value)}
                                                className="w-full text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:bg-white outline-none transition"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">Máx. (R$)</label>
                                            <input
                                                type="number"
                                                placeholder="999k"
                                                value={reportMaxAmount}
                                                onChange={e => setReportMaxAmount(e.target.value)}
                                                className="w-full text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:bg-white outline-none transition"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Botoes de Acao do Relatorio */}
                                <div className="pt-6 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <button
                                        onClick={handleClearReportFilters}
                                        className="text-rose-500 hover:text-rose-700 font-bold text-[10px] uppercase tracking-wider px-4 py-3 rounded-xl border border-rose-100 hover:bg-rose-50 transition flex items-center justify-center gap-1.5 cursor-pointer self-start md:self-auto"
                                    >
                                        <X size={12} /> Limpar Filtros
                                    </button>

                                    <div className="flex flex-wrap items-center gap-2.5">
                                        <button
                                            onClick={handleExportToCSV}
                                            className="text-emerald-600 hover:text-white font-bold text-[10px] uppercase tracking-wider px-4 py-3 rounded-xl border border-emerald-100 hover:bg-emerald-600 transition flex items-center justify-center gap-1.5 cursor-pointer"
                                        >
                                            <Download size={12} /> Baixar CSV
                                        </button>

                                        <button
                                            onClick={() => window.print()}
                                            className="text-slate-600 hover:text-white font-bold text-[10px] uppercase tracking-wider px-4 py-3 rounded-xl border border-slate-200 hover:bg-slate-800 transition flex items-center justify-center gap-1.5 cursor-pointer"
                                        >
                                            <FileText size={12} /> Baixar PDF / Imprimir
                                        </button>

                                        <button
                                            onClick={handleApplyReportFilters}
                                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10.5px] uppercase tracking-wider px-5 py-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                                        >
                                            <Check size={13} /> Aplicar Filtros & Gerar
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Resumo Consolidado do Filtro */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-slate-800">
                                <div className="bg-white p-6 rounded-[28px] border border-slate-200 shadow-sm flex items-center justify-between">
                                    <div>
                                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider">Total Entradas (Receitas)</p>
                                        <h3 className="text-2xl font-black mt-1 text-emerald-600">R$ {reportStats.income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
                                    </div>
                                    <div className="bg-emerald-50 text-emerald-600 p-3 rounded-2xl"><ArrowUpCircle size={20} /></div>
                                </div>

                                <div className="bg-white p-6 rounded-[28px] border border-slate-200 shadow-sm flex items-center justify-between">
                                    <div>
                                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider">Total Saídas (Despesas)</p>
                                        <h3 className="text-2xl font-black mt-1 text-rose-600">R$ {reportStats.expense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
                                    </div>
                                    <div className="bg-rose-50 text-rose-600 p-3 rounded-2xl"><ArrowDownCircle size={20} /></div>
                                </div>

                                <div className="bg-white p-6 rounded-[28px] border border-slate-200 shadow-sm flex items-center justify-between">
                                    <div>
                                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider">Resultado Líquido</p>
                                        <h3 className={`text-2xl font-black mt-1 ${reportStats.balance >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                                            R$ {reportStats.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </h3>
                                    </div>
                                    <div className={`p-3 rounded-2xl ${reportStats.balance >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}><Wallet size={20} /></div>
                                </div>

                                <div className="bg-slate-900 p-6 rounded-[28px] border border-slate-800 shadow-sm flex items-center justify-between text-white">
                                    <div>
                                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider">Lançamentos Filtrados</p>
                                        <h3 className="text-2xl font-black mt-1">{reportStats.totalCount} registros</h3>
                                        <p className="text-[9px] text-slate-400 font-semibold">{reportStats.paidCount} pagos • {reportStats.pendingCount} pendentes</p>
                                    </div>
                                    <div className="bg-slate-800 text-white p-3 rounded-2xl"><FileText size={20} /></div>
                                </div>
                            </div>

                            {/* Charts & Graphs Panel */}
                            {reportStats.totalCount > 0 && (
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    {/* Gráfico do Relatório */}
                                    <div className="lg:col-span-2 bg-white p-6 rounded-[32px] border border-slate-100 shadow-premium">
                                        <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6">Comparativo de Distribuição por Categoria</h4>
                                        <div className="h-64">
                                            {reportStats.categoryData.length > 0 ? (
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart data={reportStats.categoryData} layout="vertical">
                                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                                        <XAxis type="number" fontSize={10} stroke="#94a3b8" />
                                                        <YAxis dataKey="name" type="category" width={100} fontSize={9} stroke="#94a3b8" />
                                                        <Tooltip formatter={(value: any) => `R$ ${value.toLocaleString('pt-BR')}`} />
                                                        <Bar dataKey="value" name="Volume Total">
                                                            {reportStats.categoryData.map((entry, index) => (
                                                                <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#10b981' : '#f59e0b'} />
                                                            ))}
                                                        </Bar>
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            ) : (
                                                <div className="flex h-full items-center justify-center text-xs text-slate-400">Nenhum dado agregado disponível.</div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Breakdown Info */}
                                    <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm flex flex-col justify-between">
                                        <div className="space-y-4">
                                            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Maiores Concentrações</h4>
                                            <div className="space-y-3">
                                                {reportStats.categoryData.slice(0, 5).map((cat, idx) => (
                                                    <div key={idx} className="flex justify-between items-center text-xs border-b border-slate-50 pb-2">
                                                        <span className="font-bold text-slate-600">{cat.name}</span>
                                                        <span className="font-black text-slate-800">R$ {cat.value.toLocaleString('pt-BR')}</span>
                                                    </div>
                                                ))}
                                                {reportStats.categoryData.length === 0 && (
                                                    <div className="text-xs text-slate-400 py-10 text-center">Nenhum dado por categoria.</div>
                                                )}
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => window.print()}
                                            className="w-full mt-4 bg-slate-900 hover:bg-slate-850 text-white font-black text-[10px] uppercase tracking-wider py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer"
                                        >
                                            <Download size={14} /> Imprimir / Salvar PDF
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Tabela de Resultados do Relatório */}
                            <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
                                <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div>
                                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Lançamentos Filtrados</h3>
                                        <p className="text-xs font-bold text-slate-800 mt-1">Registros correspondentes aos seus critérios</p>
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse min-w-[750px]">
                                        <thead>
                                            <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                                <th className="px-6 py-4">Data</th>
                                                <th className="px-6 py-4">Descrição</th>
                                                <th className="px-6 py-4">Tipo</th>
                                                <th className="px-6 py-4">Conta / Cartão</th>
                                                <th className="px-6 py-4">Categoria</th>
                                                <th className="px-6 py-4">Situação</th>
                                                <th className="px-6 py-4 text-right">Valor</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50 text-xs font-medium text-slate-700">
                                            {reportTransactions.map(t => {
                                                const catObj = categories.find(c => c.id === t.categoryId);
                                                const bankObj = bankAccounts.find(b => b.id === t.bankAccountId);
                                                const cardObj = creditCards.find(c => c.id === t.creditCardId);
                                                return (
                                                    <tr key={t.id} className="hover:bg-slate-50/40 transition">
                                                        <td className="px-6 py-4 font-mono text-[11px] whitespace-nowrap">
                                                            {t.date.split('-').reverse().join('/')}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="font-bold text-slate-800">{t.description}</div>
                                                            {t.clientId && (
                                                                <div className="text-[10px] text-slate-400 font-semibold mt-0.5">
                                                                    Cliente: {clients.find(c => c.id === t.clientId)?.name || 'Desconhecido'}
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            {t.type === 'INCOME' ? (
                                                                <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider">
                                                                    Receita 🟢
                                                                </span>
                                                            ) : (
                                                                <span className="bg-rose-50 text-rose-700 border border-rose-100 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider">
                                                                    Despesa 🔴
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 text-slate-500 font-bold whitespace-nowrap">
                                                            {bankObj ? bankObj.name : cardObj ? `${cardObj.name} (Cartão)` : 'Geral'}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className="text-[10px] px-2.5 py-1 rounded-lg font-bold uppercase" style={{
                                                                backgroundColor: (catObj?.color || '#94a3b8') + '15',
                                                                color: (catObj?.color || '#475569')
                                                            }}>
                                                                {catObj?.name || 'Geral'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className={`px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider border leading-none ${
                                                                t.status === 'PAID'
                                                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                                                                    : 'bg-amber-50 text-amber-600 border-amber-200'
                                                            }`}>
                                                                {t.status === 'PAID' ? 'LIQUIDADO' : 'PENDENTE'}
                                                            </span>
                                                        </td>
                                                        <td className={`px-6 py-4 text-right font-black whitespace-nowrap text-sm ${t.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                            {t.type === 'INCOME' ? '+' : '-'} R$ {(t?.amount ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                            {reportTransactions.length === 0 && (
                                                <tr>
                                                    <td colSpan={7} className="text-center py-12 text-slate-400 font-semibold">
                                                        Nenhuma transação corresponde aos filtros informados.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* 7. ACCOUNTS_CARDS Tab */}
                    {activeTab === 'ACCOUNTS_CARDS' && (
                        <motion.div
                            key="accounts_cards"
                            initial={{ opacity: 0, x: 15 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0 }}
                            className="space-y-8"
                        >
                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                                <div className="bg-[#0f172a] text-white p-6 rounded-[28px] border border-slate-800 shadow-xl flex items-center justify-between">
                                    <div>
                                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider">Saldo Total em Contas</p>
                                        <h3 className="text-3xl font-black mt-1">R$ {bankAccounts?.reduce((sum, b) => sum + (b?.status === 'ACTIVE' ? (b?.balance ?? 0) : 0), 0)?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) ?? '0,00'}</h3>
                                        <p className="text-[10px] text-slate-400 mt-2 font-medium">Consolidado de todas as contas corporativas ativas</p>
                                    </div>
                                    <div className="bg-slate-800 p-4 rounded-2xl text-emerald-400"><Wallet size={24} /></div>
                                </div>

                                <div className="bg-[#e0531c] text-white p-6 rounded-[28px] border border-[#c44312] shadow-xl flex items-center justify-between">
                                    <div>
                                        <p className="text-white/80 text-[10px] font-black uppercase tracking-wider">Limite Total de Cartões</p>
                                        <h3 className="text-3xl font-black mt-1">R$ {creditCards?.reduce((sum, c) => sum + (c?.status === 'ACTIVE' ? (c?.limit ?? 0) : 0), 0)?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) ?? '0,00'}</h3>
                                        <p className="text-[10px] text-white/90 mt-2 font-medium">Limite consolidado ativo disponível para despesas</p>
                                    </div>
                                    <div className="bg-white/10 p-4 rounded-2xl text-white"><CardIcon size={24} /></div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                                {/* Left Side: Bank Accounts */}
                                <div className="bg-white p-6 sm:p-8 rounded-[36px] border border-slate-100 shadow-premium space-y-6">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Contas Bancárias</h3>
                                            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Controle e conciliação de saldo</p>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setEditingAccount({
                                                    name: '',
                                                    bankName: '',
                                                    type: 'CHECKING',
                                                    balance: 0,
                                                    color: '#10b981',
                                                    status: 'ACTIVE'
                                                });
                                                setIsAccountModalOpen(true);
                                            }}
                                            className="bg-slate-950 hover:bg-slate-900 text-white font-extrabold text-[10px] uppercase tracking-wider px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                                        >
                                            <Plus size={14} /> Nova Conta
                                        </button>
                                    </div>

                                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                                        {bankAccounts.length === 0 ? (
                                            <p className="text-xs text-slate-400 text-center py-12 font-medium">Nenhuma conta cadastrada.</p>
                                        ) : (
                                            bankAccounts.map(account => (
                                                <div 
                                                    key={account.id} 
                                                    className="p-5 rounded-[22px] border border-slate-100 shadow-sm hover:shadow-md transition-all flex justify-between items-center relative overflow-hidden"
                                                >
                                                    {/* Color stripe */}
                                                    <div className="absolute left-0 top-0 bottom-0 w-2" style={{ backgroundColor: account.color || '#cbd5e1' }} />
                                                    
                                                    <div className="pl-3 space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="font-bold text-slate-800 text-sm">{account.name}</h4>
                                                            <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${account.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-100 text-slate-500'}`}>
                                                                {account.status === 'ACTIVE' ? 'Ativa' : 'Inativa'}
                                                            </span>
                                                        </div>
                                                        <div className="flex gap-2 text-[10px] text-slate-500 font-semibold items-center">
                                                            <span>{account.bankName}</span>
                                                            <span>•</span>
                                                            <span className="uppercase text-[9px] font-black tracking-wider text-slate-400">
                                                                {account.type === 'CHECKING' ? 'Conta Corrente' : account.type === 'SAVINGS' ? 'Poupança' : account.type === 'CASH' ? 'Dinheiro/Caixa' : 'Investimento'}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-4">
                                                        <div className="text-right">
                                                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Saldo Atual</p>
                                                            <p className="text-base font-black text-slate-800">
                                                                R$ {(account?.balance ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                            </p>
                                                        </div>
                                                        <div className="flex gap-1.5">
                                                            <button 
                                                                onClick={() => {
                                                                    setEditingAccount(account);
                                                                    setIsAccountModalOpen(true);
                                                                }}
                                                                className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-50 rounded-xl transition cursor-pointer"
                                                            >
                                                                <Edit2 size={13} />
                                                            </button>
                                                            <button 
                                                                onClick={() => handleDeleteBankAccountLocal(account.id)}
                                                                className="p-2 text-red-400 hover:text-red-650 hover:bg-red-50 rounded-xl transition cursor-pointer"
                                                            >
                                                                <Trash2 size={13} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* Right Side: Credit / Debit Cards */}
                                <div className="bg-white p-6 sm:p-8 rounded-[36px] border border-slate-100 shadow-premium space-y-6">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Cartões de Crédito e Débito</h3>
                                            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Limites de gastos corporativos</p>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setEditingCard({
                                                    name: '',
                                                    brand: 'Visa',
                                                    limit: 10000,
                                                    availableLimit: 10000,
                                                    closingDay: 10,
                                                    dueDate: 20,
                                                    color: '#0f172a',
                                                    status: 'ACTIVE'
                                                });
                                                setIsCardModalOpen(true);
                                            }}
                                            className="bg-slate-950 hover:bg-slate-900 text-white font-extrabold text-[10px] uppercase tracking-wider px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                                        >
                                            <Plus size={14} /> Novo Cartão
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-1">
                                        {creditCards.length === 0 ? (
                                            <div className="md:col-span-2 text-center py-12">
                                                <p className="text-xs text-slate-400 font-medium">Nenhum cartão cadastrado.</p>
                                            </div>
                                        ) : (
                                            creditCards.map(card => {
                                                const isDebit = card.limit === 0;
                                                return (
                                                    <div 
                                                        key={card.id} 
                                                        className="relative p-5 rounded-[24px] text-slate-100 flex flex-col justify-between h-52 shadow-lg transition-transform hover:scale-[1.02]"
                                                        style={{ background: `linear-gradient(135deg, ${card.color || '#1e3a8a'}df, ${card.color || '#1e3a8a'}ff)` }}
                                                    >
                                                        {/* Chip effect & brand logo */}
                                                        <div className="flex justify-between items-start">
                                                            <div className="space-y-1">
                                                                <h4 className="text-xs font-black uppercase tracking-wider text-white/90">{card.name}</h4>
                                                                <p className="text-[10px] text-white/75 font-semibold uppercase">{card.brand}</p>
                                                            </div>
                                                            <div className="flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded-lg text-[8px] font-black tracking-wider uppercase border border-white/5">
                                                                {isDebit ? 'DÉBITO' : 'CRÉDITO'}
                                                            </div>
                                                        </div>

                                                        {/* Card Body Numbers */}
                                                        <div>
                                                            <p className="text-xs font-mono tracking-widest text-slate-200">
                                                                ••••   ••••   ••••   {card.id.length > 4 ? card.id.substring(card.id.length - 4) : '2489'}
                                                            </p>
                                                        </div>

                                                        {/* Limits and Bottom actions */}
                                                        <div className="border-t border-white/10 pt-3 mt-1 flex justify-between items-end">
                                                            <div className="space-y-0.5">
                                                                {isDebit ? (
                                                                    <>
                                                                        <span className="text-[8px] uppercase font-black text-white/50 tracking-wider">Limite Associado</span>
                                                                        <p className="text-xs font-bold text-white">Saldo em Conta</p>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <span className="text-[8px] uppercase font-black text-white/50 tracking-wider">Disponível / Limite</span>
                                                                        <p className="text-xs font-bold text-white">
                                                                            R$ {(card?.availableLimit ?? 0).toLocaleString('pt-BR')} <span className="text-white/50 font-normal">/ {(card?.limit ?? 0).toLocaleString('pt-BR')}</span>
                                                                        </p>
                                                                    </>
                                                                )}
                                                                <div className="flex gap-2 text-[8px] text-white/60 font-semibold uppercase tracking-wider mt-0.5">
                                                                    <span>Fech: {card.closingDay}</span>
                                                                    <span>Venc: {card.dueDate}</span>
                                                                </div>
                                                            </div>

                                                            <div className="flex gap-1.5 bg-black/15 p-1 rounded-xl border border-white/5 shrink-0">
                                                                <button 
                                                                    onClick={() => {
                                                                        setEditingCard(card);
                                                                        setIsCardModalOpen(true);
                                                                    }}
                                                                    className="p-1.5 hover:bg-white/10 rounded-lg text-white/80 hover:text-white transition cursor-pointer"
                                                                >
                                                                    <Edit2 size={11} />
                                                                </button>
                                                                <button 
                                                                    onClick={() => handleDeleteCreditCardLocal(card.id)}
                                                                    className="p-1.5 hover:bg-red-500/10 rounded-lg text-red-350 hover:text-red-200 transition cursor-pointer"
                                                                >
                                                                    <Trash2 size={11} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                </AnimatePresence>
            </div>

            {/* Modal for creating/editing transactions */}
            {isTxModalOpen && editingTx && (
                <Modal
                    isOpen={isTxModalOpen}
                    onClose={() => { setIsTxModalOpen(false); setEditingTx(null); }}
                    title={editingTx.id ? 'Alterar Movimentação Financeira' : 'Adicionar Movimentação Financeira'}
                    maxWidth="500px"
                >
                    <form onSubmit={handleSaveTransactionLocal} className="space-y-4 p-1 text-slate-800 font-semibold text-xs">
                        <div>
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">Descrição</label>
                            <input
                                type="text"
                                required
                                value={editingTx.description || ''}
                                onChange={e => setEditingTx({ ...editingTx, description: e.target.value })}
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:bg-white rounded-xl outline-none transition"
                                placeholder="E.g., Pagamento de Imposto Federal simples"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">Valor (R$)</label>
                                <input
                                    type="number"
                                    required
                                    min="0.01"
                                    step="0.01"
                                    value={editingTx.amount || ''}
                                    onChange={e => setEditingTx({ ...editingTx, amount: Number(e.target.value) })}
                                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none transition"
                                />
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">Data</label>
                                <input
                                    type="date"
                                    required
                                    value={editingTx.date || ''}
                                    onChange={e => setEditingTx({ ...editingTx, date: e.target.value })}
                                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none transition"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">Opereta</label>
                                <select
                                    value={editingTx.type || 'EXPENSE'}
                                    onChange={e => setEditingTx({ ...editingTx, type: e.target.value as any })}
                                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none transition"
                                >
                                    <option value="EXPENSE">🔴 Saída (Despesa)</option>
                                    <option value="INCOME">🟢 Entrada (Receita)</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">Categoria</label>
                                <select
                                    required
                                    value={editingTx.categoryId || ''}
                                    onChange={e => setEditingTx({ ...editingTx, categoryId: e.target.value })}
                                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none transition"
                                >
                                    <option value="">Selecione categoria</option>
                                    {categories.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">Banco / Destino</label>
                                <select
                                    value={editingTx.bankAccountId || ''}
                                    onChange={e => setEditingTx({ ...editingTx, bankAccountId: e.target.value || undefined })}
                                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none transition"
                                >
                                    <option value="">Nenhum / Dinheiro vivo</option>
                                    {bankAccounts?.map(ba => (
                                        <option key={ba.id} value={ba.id}>{ba.name} (Saldo R$ {(ba?.balance ?? 0).toLocaleString('pt-BR')})</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">Situação de pagamento</label>
                                <select
                                    value={editingTx.status || 'PENDING'}
                                    onChange={e => setEditingTx({ ...editingTx, status: e.target.value as any })}
                                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none transition"
                                >
                                    <option value="PENDING">Aberto / Agendado</option>
                                    <option value="PAID">Liquidado / Pago</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">Cliente Vinculado</label>
                            <select
                                value={editingTx.clientId || ''}
                                onChange={e => setEditingTx({ ...editingTx, clientId: e.target.value || undefined })}
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none transition"
                            >
                                <option value="">Sem vínculo comercial</option>
                                {clients.map(cl => (
                                    <option key={cl.id} value={cl.id}>{cl.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="pt-4 flex gap-2 justify-end">
                            <button
                                type="button"
                                onClick={() => { setIsTxModalOpen(false); setEditingTx(null); }}
                                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-500 font-black text-[10px] uppercase tracking-wider"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="px-5 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-xl font-black text-[10px] uppercase tracking-wider shadow-lg shadow-pink-500/10"
                            >
                                Confirmar Lançamento
                            </button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* Modal for creating/editing categories */}
            {isCategoryModalOpen && editingCategory && (
                <Modal
                    isOpen={isCategoryModalOpen}
                    onClose={() => { setIsCategoryModalOpen(false); setEditingCategory(null); }}
                    title={editingCategory.id ? 'Editar Categoria' : 'Nova Categoria'}
                    maxWidth="400px"
                >
                    <form onSubmit={handleSaveCategoryLocal} className="space-y-4 p-1 text-slate-800 font-semibold text-xs animate-fade-in">
                        <div>
                            <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Nome</label>
                            <input
                                type="text"
                                required
                                value={editingCategory.name || ''}
                                onChange={e => setEditingCategory({ ...editingCategory, name: e.target.value })}
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                                placeholder="E.g., Freelancers"
                            />
                        </div>

                        <div>
                            <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Tipo de vínculo</label>
                            <select
                                value={editingCategory.type || 'EXPENSE'}
                                onChange={e => setEditingCategory({ ...editingCategory, type: e.target.value as any })}
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                            >
                                <option value="EXPENSE">Despesa (Débito)</option>
                                <option value="INCOME">Receita (Crédito)</option>
                                <option value="BOTH">Ambos</option>
                            </select>
                        </div>

                        <div>
                            <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Cor Visual</label>
                            <input
                                type="color"
                                value={editingCategory.color || '#64748b'}
                                onChange={e => setEditingCategory({ ...editingCategory, color: e.target.value })}
                                className="w-full h-10 p-1 bg-slate-50 border border-slate-200 rounded-xl outline-none cursor-pointer"
                            />
                        </div>

                        <div className="pt-4 flex gap-2 justify-end">
                            <button
                                type="button"
                                onClick={() => { setIsCategoryModalOpen(false); setEditingCategory(null); }}
                                className="px-4 py-2 bg-slate-100 rounded-xl text-slate-500 font-black text-[10px] uppercase tracking-wider"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-[10px] uppercase tracking-wider"
                            >
                                Salvar Categoria
                            </button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* Modal for creating/editing Assets */}
            {isAssetModalOpen && editingAsset && (
                <Modal
                    isOpen={isAssetModalOpen}
                    onClose={() => { setIsAssetModalOpen(false); setEditingAsset(null); }}
                    title={editingAsset.id ? 'Editar Ativo' : 'Novo Ativo'}
                    maxWidth="450px"
                >
                    <form onSubmit={handleSaveAssetLocal} className="space-y-4 p-1 text-slate-800 font-semibold text-xs">
                        <div>
                            <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Nome do Ativo</label>
                            <input
                                type="text"
                                required
                                value={editingAsset.name || ''}
                                onChange={e => setEditingAsset({ ...editingAsset, name: e.target.value })}
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                                placeholder="MacBook Pro M2 - Desenvolvedor"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Categoria</label>
                                <select
                                    value={editingAsset.category || 'HARDWARE'}
                                    onChange={e => setEditingAsset({ ...editingAsset, category: e.target.value as any })}
                                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                                >
                                    <option value="HARDWARE">💻 Hardware</option>
                                    <option value="SOFTWARE">🔌 Software / Licenças</option>
                                    <option value="FURNITURE">🪑 Mobiliário</option>
                                    <option value="VEHICLE">🚗 Veículos</option>
                                    <option value="OTHER">📦 Outros</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Situação física</label>
                                <select
                                    value={editingAsset.status || 'ACTIVE'}
                                    onChange={e => setEditingAsset({ ...editingAsset, status: e.target.value as any })}
                                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                                >
                                    <option value="ACTIVE">Ativo / Operante</option>
                                    <option value="MAINTENANCE">Manutenção / Reparo</option>
                                    <option value="DISPOSED">Baixado / Fora de uso</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Valor Original (R$)</label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    value={editingAsset.purchaseValue || ''}
                                    onChange={e => setEditingAsset({ ...editingAsset, purchaseValue: Number(e.target.value) })}
                                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Data Gasto</label>
                                <input
                                    type="date"
                                    value={editingAsset.purchaseDate || ''}
                                    onChange={e => setEditingAsset({ ...editingAsset, purchaseDate: e.target.value })}
                                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">S/N de Licença</label>
                                <input
                                    type="text"
                                    value={editingAsset.serialNumber || ''}
                                    onChange={e => setEditingAsset({ ...editingAsset, serialNumber: e.target.value })}
                                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                                    placeholder="Ex: C02DFHGJKD"
                                />
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Localização física</label>
                                <input
                                    type="text"
                                    value={editingAsset.location || ''}
                                    onChange={e => setEditingAsset({ ...editingAsset, location: e.target.value })}
                                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                                    placeholder="Prateleira A / Remoto"
                                />
                            </div>
                        </div>

                        {editingAsset.status === 'DISPOSED' && (
                            <div>
                                <label className="text-[9px] font-black text-rose-500 uppercase block mb-1">Justificativa da Perda / Baixa</label>
                                <textarea
                                    value={editingAsset.lossJustification || ''}
                                    onChange={e => setEditingAsset({ ...editingAsset, lossJustification: e.target.value })}
                                    className="w-full p-2.5 bg-rose-50/50 border border-rose-200 hover:border-rose-300 focus:bg-white rounded-xl outline-none"
                                    rows={2}
                                    placeholder="Escreva a justificativa de descarte do ativo."
                                />
                            </div>
                        )}

                        <div className="pt-4 flex gap-2 justify-end">
                            <button
                                type="button"
                                onClick={() => { setIsAssetModalOpen(false); setEditingAsset(null); }}
                                className="px-4 py-2 bg-slate-100 rounded-xl text-slate-500 font-black text-[10px] uppercase tracking-wider"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-wider shadow-md"
                            >
                                Salvar Ativo
                            </button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* Requirement 5 Asset Loss Justification explicit modal */}
            {isAssetLossModalOpen && assetForLoss && (
                <Modal
                    isOpen={isAssetLossModalOpen}
                    onClose={() => { setIsAssetLossModalOpen(false); setAssetForLoss(null); }}
                    title="Justificativa de Prejuízo de Ativo"
                    maxWidth="450px"
                >
                    <div className="space-y-4 text-slate-800 font-semibold text-xs leading-relaxed p-1">
                        <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 flex items-start gap-3">
                            <AlertTriangle className="text-rose-500 shrink-0 mt-0.5" size={18} />
                            <div>
                                <h4 className="font-black text-rose-700">Atenção ao registrar descarte</h4>
                                <p className="text-[10px] text-slate-600 mt-1">
                                    Ao confirmar a baixa, este ativo ({assetForLoss.name}) terá seu valor atual reduzido a zero, e seu prejuízo de aquisição será computado no consolidado financeiro do sistema.
                                </p>
                            </div>
                        </div>

                        <div>
                            <label className="text-[9px] font-black text-slate-400 uppercase block mb-1.5">Escreva o motivo detalhado do descarte ou prejuízo:</label>
                            <textarea
                                required
                                value={lossJustificationText}
                                onChange={e => setLossJustificationText(e.target.value)}
                                className="w-full p-3 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:bg-white rounded-xl outline-none"
                                rows={3}
                                placeholder="E.g., Derramamento de café na placa mãe sem possibilidade de conserto."
                            />
                        </div>

                        <div className="pt-4 flex gap-2 justify-end">
                            <button
                                type="button"
                                onClick={() => { setIsAssetLossModalOpen(false); setAssetForLoss(null); }}
                                className="px-4 py-2 bg-slate-100 rounded-xl text-slate-500 font-black text-[10px] uppercase tracking-wider"
                            >
                                Voltar
                            </button>
                            <button
                                type="button"
                                disabled={!lossJustificationText.trim()}
                                onClick={handleConfirmAssetLoss}
                                className="px-5 py-2 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white rounded-xl font-black text-[10px] uppercase tracking-wider shadow-lg shadow-rose-500/10"
                            >
                                Confirmar Baixa com Justificativa
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Modal for creating/editing Inventory items (Stock) */}
            {isStockModalOpen && editingStock && (
                <Modal
                    isOpen={isStockModalOpen}
                    onClose={() => { setIsStockModalOpen(false); setEditingStock(null); }}
                    title={editingStock.id ? 'Alterar Insumo' : 'Novo Insumo em Estoque'}
                    maxWidth="400px"
                >
                    <form onSubmit={handleSaveStockLocal} className="space-y-4 p-1 text-slate-800 font-semibold text-xs">
                        <div>
                            <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Nome do Item</label>
                            <input
                                type="text"
                                required
                                value={editingStock.name || ''}
                                onChange={e => setEditingStock({ ...editingStock, name: e.target.value })}
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                                placeholder="Caneca Personalizada Agência"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Categoria</label>
                                <input
                                    type="text"
                                    value={editingStock.category || ''}
                                    onChange={e => setEditingStock({ ...editingStock, category: e.target.value })}
                                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                                    placeholder="Marketing / Papelaria"
                                />
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Unidade (E.g. un, cx)</label>
                                <input
                                    type="text"
                                    value={editingStock.unit || ''}
                                    onChange={e => setEditingStock({ ...editingStock, unit: e.target.value })}
                                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Quantidade atual</label>
                                <input
                                    type="number"
                                    min="0"
                                    required
                                    value={editingStock.quantity === undefined ? '' : editingStock.quantity}
                                    onChange={e => setEditingStock({ ...editingStock, quantity: Number(e.target.value) })}
                                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Quantidade Mínima</label>
                                <input
                                    type="number"
                                    min="0"
                                    required
                                    value={editingStock.minQuantity === undefined ? '' : editingStock.minQuantity}
                                    onChange={e => setEditingStock({ ...editingStock, minQuantity: Number(e.target.value) })}
                                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Preço unitário (R$)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    required
                                    value={editingStock.price || ''}
                                    onChange={e => setEditingStock({ ...editingStock, price: Number(e.target.value) })}
                                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Localização no depósito</label>
                                <input
                                    type="text"
                                    value={editingStock.location || ''}
                                    onChange={e => setEditingStock({ ...editingStock, location: e.target.value })}
                                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                                    placeholder="Armário 2 / Prato"
                                />
                            </div>
                        </div>

                        <div className="pt-4 flex gap-2 justify-end">
                            <button
                                type="button"
                                onClick={() => { setIsStockModalOpen(false); setEditingStock(null); }}
                                className="px-4 py-2 bg-slate-100 rounded-xl text-slate-500 font-black text-[10px] uppercase tracking-wider"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-[10px] uppercase tracking-wider shadow-md"
                            >
                                Salvar Estoque
                            </button>
                        </div>
                    </form>
                </Modal>
            )}

            {editingBankUser && (
                <Modal
                    isOpen={!!editingBankUser}
                    onClose={() => setEditingBankUser(null)}
                    title={`Editar Informações Financeiras`}
                    maxWidth="500px"
                >
                    <div className="space-y-6 text-left">
                        <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 animate-fade-in">
                            <img 
                                src={editingBankUser.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${editingBankUser.name}`} 
                                className="w-10 h-10 rounded-full border border-slate-100 bg-white" 
                                onError={e => {
                                    (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${editingBankUser.name}`;
                                }}
                            />
                            <div className="flex flex-col">
                                <span className="font-extrabold text-slate-800 dark:text-white text-sm leading-tight">{editingBankUser.name}</span>
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">
                                    {editingBankUser.role === 'ADMIN' ? 'Administrador' :
                                     editingBankUser.role === 'MANAGER' ? 'Gerente' :
                                     editingBankUser.role === 'COMMERCIAL_MANAGER' ? 'Gerente Comercial' :
                                     editingBankUser.role === 'FINANCE' ? 'Financeiro' :
                                     editingBankUser.role === 'EMPLOYEE' ? 'Colaborador' :
                                     editingBankUser.role === 'FREELANCER' ? 'Freelancer' :
                                     editingBankUser.role === 'COMMERCIAL' ? 'Comercial' : editingBankUser.role}                                    
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase">Salário Base (R$)</label>
                                <input 
                                    type="number"
                                    placeholder="Ex: 5000"
                                    className="w-full border border-slate-200 dark:border-slate-700 p-3 rounded-2xl text-sm bg-white dark:bg-slate-800 dark:text-white outline-none focus:border-slate-900 transition-all font-semibold"
                                    value={salaryInput}
                                    onChange={e => setSalaryInput(e.target.value)}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase">Valor Hora (R$)</label>
                                <input 
                                    type="number"
                                    placeholder="Ex: 50"
                                    className="w-full border border-slate-200 dark:border-slate-700 p-3 rounded-2xl text-sm bg-white dark:bg-slate-800 dark:text-white outline-none focus:border-slate-900 transition-all font-semibold"
                                    value={hourlyRateInput}
                                    onChange={e => setHourlyRateInput(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase">Dados Bancários / Chave PIX</label>
                            <textarea 
                                placeholder="Banco, conta, agência, chave PIX, etc."
                                className="w-full border border-slate-200 dark:border-slate-700 p-3 rounded-2xl text-sm bg-white dark:bg-slate-800 dark:text-white outline-none h-32 resize-none focus:border-slate-900 transition-all font-semibold"
                                value={bankDetailsInput}
                                onChange={e => setBankDetailsInput(e.target.value)}
                            />
                        </div>

                        <button
                            onClick={async () => {
                                if (!onSaveUser) {
                                    alert('Ação de salvamento indisponível.');
                                    return;
                                }
                                const updatedUser = {
                                    ...editingBankUser,
                                    salary: salaryInput ? parseFloat(salaryInput) : undefined,
                                    hourlyRate: hourlyRateInput ? parseFloat(hourlyRateInput) : undefined,
                                    bankDetails: bankDetailsInput.trim() || undefined
                                };
                                await onSaveUser(updatedUser);
                                setEditingBankUser(null);
                            }}
                            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs uppercase tracking-widest py-4 rounded-2xl shadow-lg transition-all"
                        >
                            Salvar Alterações
                        </button>
                    </div>
                </Modal>
            )}

            {isConflictModalOpen && (
                <Modal
                    isOpen={isConflictModalOpen}
                    onClose={() => { setIsConflictModalOpen(false); setConflictType(null); }}
                    title={conflictType === 'ACCOUNT' ? 'Exclusão Restrita - Conta Bancária' : 'Exclusão Restrita - Cartão de Crédito'}
                    maxWidth="600px"
                >
                    <div className="space-y-4 p-1 text-slate-800 font-semibold text-xs leading-relaxed text-left animate-fade-in">
                        <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex items-start gap-3">
                            <AlertTriangle size={20} className="text-amber-500 shrink-0 mt-0.5" />
                            <div>
                                <h4 className="font-extrabold text-amber-800 text-sm">Transações Vinculadas Detectadas!</h4>
                                <p className="text-[11px] text-amber-700 mt-1">
                                    Não é possível excluir esta {conflictType === 'ACCOUNT' ? 'conta bancária' : 'carteira de cartão'} porque existem transações ou movimentações financeiras vinculadas a ela no banco de dados.
                                </p>
                                <p className="text-[11.5px] text-amber-800 mt-2 font-bold">
                                    Para prosseguir com a exclusão total, você deve primeiro excluir as transações associadas listadas abaixo.
                                </p>
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">Transações Vinculadas ({conflictTransactions.length})</span>
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input 
                                        type="checkbox"
                                        className="rounded border-slate-300 text-pink-600 focus:ring-pink-500 h-3.5 w-3.5"
                                        checked={conflictTransactions.length > 0 && conflictTransactions.every(t => selectedTxIds[t.id])}
                                        onChange={(e) => {
                                            const checked = e.target.checked;
                                            const updated: Record<string, boolean> = {};
                                            conflictTransactions.forEach(t => {
                                                updated[t.id] = checked;
                                            });
                                            setSelectedTxIds(updated);
                                        }}
                                    />
                                    <span className="text-[10px] uppercase font-black tracking-wider text-slate-600">Marcar todas</span>
                                </label>
                            </div>

                            <div className="border border-slate-100 rounded-2xl max-h-[220px] overflow-y-auto divide-y divide-slate-50">
                                {conflictTransactions.map(t => (
                                    <div key={t.id} className="p-3 flex items-center justify-between hover:bg-slate-50/50 transition">
                                        <div className="flex items-center gap-3">
                                            <input 
                                                type="checkbox"
                                                className="rounded border-slate-300 text-pink-600 focus:ring-pink-500 h-3.5 w-3.5"
                                                checked={!!selectedTxIds[t.id]}
                                                onChange={(e) => {
                                                    setSelectedTxIds(prev => ({
                                                        ...prev,
                                                        [t.id]: e.target.checked
                                                    }));
                                                }}
                                            />
                                            <div>
                                                <p className="font-extrabold text-slate-700 text-xs">{t.description}</p>
                                                <p className="text-[10px] text-slate-400 font-bold">{t.date.split('-').reverse().join('/')}</p>
                                            </div>
                                        </div>
                                        <span className={`font-black text-xs ${t.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                            {t.type === 'INCOME' ? '+' : '-'} R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="pt-4 flex gap-2 justify-end border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => { setIsConflictModalOpen(false); setConflictType(null); }}
                                className="px-4 py-2.5 bg-slate-100 rounded-xl text-slate-500 font-black text-[10px] uppercase tracking-wider"
                                disabled={isDeletingConflict}
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={handleResolveConflictAndDelete}
                                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black text-[10px] uppercase tracking-wider shadow-md disabled:opacity-50 flex items-center gap-2"
                                disabled={isDeletingConflict || !Object.values(selectedTxIds).some(v => v)}
                            >
                                {isDeletingConflict ? 'Excluindo...' : 'Excluir permanentemente'}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

        </div>
    );
};
