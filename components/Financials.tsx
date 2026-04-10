
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
    CashMovement
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
    Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { initialCategories } from '../utils/mockData';
import { analyzeFinancialHealth } from '../services/aiService';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { saveCreditCard, deleteCreditCard, saveBankAccount, deleteBankAccount, saveFinancialTransaction, deleteFinancialTransaction, saveNotification } from '../services/supabaseService';

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
    openConfirm: (options: ConfirmOptions) => Promise<boolean>;
    selectedTransactionId?: string | null;
    onClearSelectedTransaction?: () => void;
    selectedInvoiceId?: string | null;
    onClearSelectedInvoice?: () => void;
    onSaveNotification?: (notif: Notification) => void;
    stock: StockItem[];
    setStock: React.Dispatch<React.SetStateAction<StockItem[]>>;
    assets: Asset[];
    setAssets: React.Dispatch<React.SetStateAction<Asset[]>>;
    cashSessions: CashRegisterSession[];
    setCashSessions: React.Dispatch<React.SetStateAction<CashRegisterSession[]>>;
    cashMovements: CashMovement[];
    setCashMovements: React.Dispatch<React.SetStateAction<CashMovement[]>>;
}

type TabType = 'DASHBOARD' | 'ACCOUNTS' | 'CARDS' | 'TRANSACTIONS' | 'INVOICES' | 'CASH_REGISTER' | 'STOCK' | 'ASSETS' | 'REPORTS';

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
    cashSessions,
    setCashSessions,
    cashMovements,
    setCashMovements,
    currentUser,
    users,
    clients,
    squads,
    openConfirm,
    selectedTransactionId,
    onClearSelectedTransaction,
    selectedInvoiceId,
    onClearSelectedInvoice,
    onSaveNotification
}) => {
    const [activeTab, setActiveTab] = useState<TabType>('DASHBOARD');
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');
    
    // Period Filter State
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => {
        const d = new Date();
        return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];
    });

    const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
    const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
    const [isCardModalOpen, setIsCardModalOpen] = useState(false);
    const [isStockModalOpen, setIsStockModalOpen] = useState(false);
    const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
    const [isCashMovementModalOpen, setIsCashMovementModalOpen] = useState(false);
    const [isAiAnalysisLoading, setIsAiAnalysisLoading] = useState(false);
    const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);

    const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
    const [editingCardId, setEditingCardId] = useState<string | null>(null);
    const [editingStockId, setEditingStockId] = useState<string | null>(null);
    const [editingAssetId, setEditingAssetId] = useState<string | null>(null);

    useEffect(() => {
        if (selectedTransactionId) {
            setActiveTab('TRANSACTIONS');
            // We could also set a search term or highlight it
            setSearchTerm(selectedTransactionId); 
            if (onClearSelectedTransaction) onClearSelectedTransaction();
        }
    }, [selectedTransactionId, onClearSelectedTransaction]);

    useEffect(() => {
        if (selectedInvoiceId) {
            setActiveTab('INVOICES');
            if (onClearSelectedInvoice) onClearSelectedInvoice();
        }
    }, [selectedInvoiceId, onClearSelectedInvoice]);
    
    // Form States
    const [newTransaction, setNewTransaction] = useState<Partial<FinancialTransaction & { isRecurring?: boolean; recurrenceMonths?: number }>>({
        type: 'EXPENSE',
        status: 'PAID',
        date: new Date().toISOString().split('T')[0],
        isRecurring: false,
        recurrenceMonths: 1
    });

    const [newAccount, setNewAccount] = useState<Partial<BankAccount>>({
        type: 'CHECKING',
        status: 'ACTIVE',
        balance: 0,
        color: '#3b82f6'
    });

    const [newCard, setNewCard] = useState<Partial<CreditCard>>({
        status: 'ACTIVE',
        limit: 0,
        availableLimit: 0,
        color: '#000000',
        brand: 'Visa'
    });

    const [newStockItem, setNewStockItem] = useState<Partial<StockItem>>({
        quantity: 0,
        minQuantity: 0,
        price: 0
    });

    const [newAsset, setNewAsset] = useState<Partial<Asset>>({
        category: 'HARDWARE',
        status: 'ACTIVE',
        purchaseValue: 0,
        currentValue: 0,
        purchaseDate: new Date().toISOString().split('T')[0]
    });

    const [newCashMovement, setNewCashMovement] = useState<Partial<CashMovement>>({
        type: 'IN',
        amount: 0,
        category: 'SALE'
    });

    // Access Control Filtering
    const filteredTransactions = useMemo(() => {
        let base = transactions;
        
        if (currentUser.role === 'MANAGER') {
            const userSquad = squads.find(s => s.members.includes(currentUser.id));
            base = transactions.filter(t => 
                t.responsibleId === currentUser.id || 
                (userSquad && t.squadId === userSquad.id)
            );
        } else if (currentUser.role === 'EMPLOYEE') {
            return []; // Should not have access anyway
        }

        if (searchTerm) {
            base = base.filter(t => 
                t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                clients.find(c => c.id === t.clientId)?.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (typeFilter !== 'ALL') {
            base = base.filter(t => t.type === typeFilter);
        }

        // Period Filter
        if (startDate && endDate) {
            base = base.filter(t => t.date >= startDate && t.date <= endDate);
        }

        return base.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [transactions, currentUser, squads, searchTerm, clients, typeFilter, startDate, endDate]);

    // Stats
    const stats = useMemo(() => {
        const totalBalance = bankAccounts.reduce((acc, curr) => acc + curr.balance, 0);
        
        const filteredTxs = transactions.filter(t => 
            t.status === 'PAID' && 
            t.date >= startDate && 
            t.date <= endDate
        );

        const monthlyIncome = filteredTxs
            .filter(t => t.type === 'INCOME')
            .reduce((acc, curr) => acc + curr.amount, 0);
            
        const monthlyExpense = filteredTxs
            .filter(t => t.type === 'EXPENSE')
            .reduce((acc, curr) => acc + curr.amount, 0);
            
        const cardDebt = creditCards.reduce((acc, curr) => acc + (curr.limit - curr.availableLimit), 0);

        return { totalBalance, monthlyIncome, monthlyExpense, cardDebt };
    }, [bankAccounts, transactions, creditCards, startDate, endDate]);

    const filteredInvoices = useMemo(() => {
        return cardInvoices
            .filter(inv => inv.dueDate >= startDate && inv.dueDate <= endDate)
            .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    }, [cardInvoices, startDate, endDate]);

    const currentCashSession = useMemo(() => {
        return cashSessions.find(s => s.status === 'OPEN');
    }, [cashSessions]);

    const sessionMovements = useMemo(() => {
        if (!currentCashSession) return [];
        return cashMovements.filter(m => m.sessionId === currentCashSession.id);
    }, [cashMovements, currentCashSession]);

    const handleAiAnalysis = async () => {
        setIsAiAnalysisLoading(true);
        try {
            const analysis = await analyzeFinancialHealth(transactions);
            setAiAnalysis(analysis);
        } catch (err) {
            console.error("Erro na análise da IA:", err);
        } finally {
            setIsAiAnalysisLoading(false);
        }
    };

    const handleOpenCashRegister = () => {
        const initialAmount = parseFloat(prompt('Informe o valor inicial do caixa:', '0') || '0');
        const newSession: CashRegisterSession = {
            id: `cs-${Date.now()}`,
            openedAt: new Date().toISOString(),
            openedBy: currentUser.id,
            initialAmount,
            status: 'OPEN'
        };
        setCashSessions(prev => [newSession, ...prev]);
    };

    const handleCloseCashRegister = async () => {
        if (!currentCashSession) return;
        
        const confirm = await openConfirm({
            title: 'Fechar Caixa',
            description: 'Tem certeza que deseja fechar o caixa agora?',
            variant: 'info'
        });

        if (confirm) {
            const finalAmount = sessionMovements.reduce((acc, m) => m.type === 'IN' ? acc + m.amount : acc - m.amount, currentCashSession.initialAmount);
            setCashSessions(prev => prev.map(s => s.id === currentCashSession.id ? {
                ...s,
                status: 'CLOSED',
                closedAt: new Date().toISOString(),
                closedBy: currentUser.id,
                finalAmount,
                expectedAmount: finalAmount
            } : s));
        }
    };

    const handleAddCashMovement = () => {
        if (!currentCashSession || !newCashMovement.amount || !newCashMovement.description) return;

        const movement: CashMovement = {
            id: `cm-${Date.now()}`,
            sessionId: currentCashSession.id,
            type: newCashMovement.type as 'IN' | 'OUT',
            amount: newCashMovement.amount,
            description: newCashMovement.description,
            timestamp: new Date().toISOString(),
            category: newCashMovement.category as any
        };

        setCashMovements(prev => [...prev, movement]);

        // Also create a financial transaction to reflect in the main ledger
        const transaction: FinancialTransaction = {
            id: `ft-cm-${Date.now()}`,
            description: `[CAIXA] ${movement.description}`,
            amount: movement.amount,
            type: movement.type === 'IN' ? 'INCOME' : 'EXPENSE',
            date: new Date().toISOString().split('T')[0],
            status: 'PAID',
            categoryId: movement.type === 'IN' ? 'cat1' : 'cat5', // Default categories
            responsibleId: currentUser.id,
            createdAt: Date.now()
        };
        setTransactions(prev => [transaction, ...prev]);

        setIsCashMovementModalOpen(false);
        setNewCashMovement({ type: 'IN', amount: 0, category: 'SALE' });
    };

    const handleAddStockItem = () => {
        if (!newStockItem.name || !newStockItem.quantity) return;

        if (editingStockId) {
            setStock(prev => prev.map(s => s.id === editingStockId ? { ...s, ...newStockItem } as StockItem : s));
        } else {
            const item: StockItem = {
                id: `st-${Date.now()}`,
                name: newStockItem.name,
                category: newStockItem.category || 'Geral',
                quantity: newStockItem.quantity,
                minQuantity: newStockItem.minQuantity || 0,
                unit: newStockItem.unit || 'un',
                price: newStockItem.price || 0,
                location: newStockItem.location
            };
            setStock(prev => [...prev, item]);
        }

        setIsStockModalOpen(false);
        setEditingStockId(null);
        setNewStockItem({ quantity: 0, minQuantity: 0, price: 0 });
    };

    const handleAddAsset = () => {
        if (!newAsset.name || !newAsset.purchaseValue) return;

        if (editingAssetId) {
            setAssets(prev => prev.map(a => a.id === editingAssetId ? { ...a, ...newAsset } as Asset : a));
        } else {
            const asset: Asset = {
                id: `as-${Date.now()}`,
                name: newAsset.name,
                category: newAsset.category as any,
                purchaseDate: newAsset.purchaseDate || new Date().toISOString().split('T')[0],
                purchaseValue: newAsset.purchaseValue,
                currentValue: newAsset.currentValue || newAsset.purchaseValue,
                status: newAsset.status as any,
                responsibleId: newAsset.responsibleId,
                serialNumber: newAsset.serialNumber,
                description: newAsset.description
            };
            setAssets(prev => [...prev, asset]);
        }

        setIsAssetModalOpen(false);
        setEditingAssetId(null);
        setNewAsset({ category: 'HARDWARE', status: 'ACTIVE', purchaseValue: 0, currentValue: 0, purchaseDate: new Date().toISOString().split('T')[0] });
    };

    const chartData = useMemo(() => {
        // Simple data for the AreaChart
        const days = 15;
        const data = [];
        const today = new Date();
        
        for (let i = days; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            
            const income = transactions
                .filter(t => t.date === dateStr && t.type === 'INCOME' && t.status === 'PAID')
                .reduce((acc, t) => acc + t.amount, 0);
            
            const expense = transactions
                .filter(t => t.date === dateStr && t.type === 'EXPENSE' && t.status === 'PAID')
                .reduce((acc, t) => acc + t.amount, 0);
            
            data.push({
                name: dateStr.split('-').reverse().slice(0, 2).join('/'),
                receita: income,
                despesa: expense
            });
        }
        return data;
    }, [transactions]);

    const handleAddTransaction = () => {
        if (!newTransaction.description || !newTransaction.amount) return;
        
        const recurrenceId = newTransaction.isRecurring ? `rec-${Date.now()}` : undefined;
        const months = newTransaction.isRecurring ? (newTransaction.recurrenceMonths || 1) : 1;
        
        const newTransactions: FinancialTransaction[] = [];
        const baseDate = new Date(newTransaction.date || new Date().toISOString().split('T')[0]);

        for (let i = 0; i < months; i++) {
            const txDate = new Date(baseDate);
            txDate.setMonth(baseDate.getMonth() + i);
            
            // Handle day overflow (e.g., Jan 31 -> Feb 28)
            if (txDate.getDate() !== baseDate.getDate()) {
                txDate.setDate(0);
            }

            const transaction: FinancialTransaction = {
                id: `${Date.now()}-${i}`,
                description: newTransaction.description,
                amount: newTransaction.amount,
                type: newTransaction.type as 'INCOME' | 'EXPENSE',
                date: txDate.toISOString().split('T')[0],
                status: i === 0 ? (newTransaction.status as 'PAID' | 'PENDING') : 'PENDING',
                categoryId: newTransaction.categoryId || 'cat1',
                bankAccountId: newTransaction.bankAccountId,
                creditCardId: newTransaction.creditCardId,
                clientId: newTransaction.clientId,
                squadId: newTransaction.squadId,
                responsibleId: currentUser.id,
                recurrenceId,
                createdAt: Date.now()
            };
            newTransactions.push(transaction);
        }

        setTransactions(prev => [...newTransactions, ...prev]);
        
        // Sync with Supabase
        newTransactions.forEach(tx => saveFinancialTransaction(tx));

        // Update Account Balance/Card Limit ONLY for the first transaction if PAID
        const firstTx = newTransactions[0];
        if (firstTx.status === 'PAID' && firstTx.bankAccountId) {
            setBankAccounts(prev => prev.map(acc => {
                if (acc.id === firstTx.bankAccountId) {
                    return {
                        ...acc,
                        balance: firstTx.type === 'INCOME' ? acc.balance + firstTx.amount : acc.balance - firstTx.amount
                    };
                }
                return acc;
            }));
        }

        if (firstTx.type === 'EXPENSE' && firstTx.creditCardId) {
            const currentMonth = firstTx.date.slice(0, 7); // YYYY-MM
            
            setCreditCards(prev => prev.map(card => {
                if (card.id === firstTx.creditCardId) {
                    return {
                        ...card,
                        availableLimit: card.availableLimit - firstTx.amount
                    };
                }
                return card;
            }));

            setCardInvoices(prev => {
                const invoiceIndex = prev.findIndex(inv => inv.creditCardId === firstTx.creditCardId && inv.month === currentMonth);
                if (invoiceIndex >= 0) {
                    const updatedInvoices = [...prev];
                    updatedInvoices[invoiceIndex] = {
                        ...updatedInvoices[invoiceIndex],
                        amount: updatedInvoices[invoiceIndex].amount + firstTx.amount
                    };
                    return updatedInvoices;
                } else {
                    const card = creditCards.find(c => c.id === firstTx.creditCardId);
                    const newInvoice: CardInvoice = {
                        id: `inv-${Date.now()}`,
                        creditCardId: firstTx.creditCardId!,
                        month: currentMonth,
                        amount: firstTx.amount,
                        status: 'OPEN',
                        dueDate: `${currentMonth}-${card?.dueDate.toString().padStart(2, '0') || '05'}`
                    };
                    return [...prev, newInvoice];
                }
            });
        }

        setIsTransactionModalOpen(false);
        setNewTransaction({ 
            type: 'EXPENSE', 
            status: 'PAID', 
            date: new Date().toISOString().split('T')[0],
            isRecurring: false,
            recurrenceMonths: 1
        });
    };

    const handleAddAccount = async () => {
        if (!newAccount.name || !newAccount.bankName) return;

        try {
            const accountToSave: BankAccount = {
                id: editingAccountId || Date.now().toString(),
                name: newAccount.name,
                type: newAccount.type as any,
                bankName: newAccount.bankName,
                balance: newAccount.balance || 0,
                color: newAccount.color || '#3b82f6',
                status: 'ACTIVE'
            };

            const result = await saveBankAccount(accountToSave);
            if (result.success) {
                if (editingAccountId) {
                    setBankAccounts(prev => prev.map(acc => acc.id === editingAccountId ? accountToSave : acc));
                } else {
                    setBankAccounts(prev => [...prev, accountToSave]);
                }
                setIsAccountModalOpen(false);
                setEditingAccountId(null);
                setNewAccount({ type: 'CHECKING', status: 'ACTIVE', balance: 0, color: '#3b82f6' });
            } else {
                alert('Erro ao salvar conta no banco de dados.');
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleDeleteAccount = async (id: string) => {
        const confirm = await openConfirm({
            title: 'Excluir Conta',
            description: 'Tem certeza que deseja excluir esta conta? Todas as transações associadas a ela podem ser impactadas.',
            variant: 'danger'
        });

        if (confirm) {
            try {
                const result = await deleteBankAccount(id);
                if (result.success) {
                    setBankAccounts(prev => prev.filter(acc => acc.id !== id));
                } else {
                    alert('Erro ao excluir conta do banco de dados.');
                }
            } catch (error) {
                console.error(error);
            }
        }
    };

    const handleAddCard = async () => {
        if (!newCard.name || !newCard.limit) return;

        try {
            const cardToSave: CreditCard = {
                id: editingCardId || Date.now().toString(),
                name: newCard.name,
                brand: newCard.brand || 'Visa',
                limit: newCard.limit,
                availableLimit: editingCardId ? (newCard.availableLimit ?? newCard.limit) : newCard.limit,
                closingDay: newCard.closingDay || 25,
                dueDate: newCard.dueDate || 5,
                color: newCard.color || '#000000',
                status: 'ACTIVE'
            };

            const result = await saveCreditCard(cardToSave);
            if (result.success) {
                if (editingCardId) {
                    setCreditCards(prev => prev.map(card => card.id === editingCardId ? cardToSave : card));
                } else {
                    setCreditCards(prev => [...prev, cardToSave]);
                }
                setIsCardModalOpen(false);
                setEditingCardId(null);
                setNewCard({ status: 'ACTIVE', limit: 0, availableLimit: 0, color: '#000000', brand: 'Visa' });
            } else {
                alert('Erro ao salvar cartão no banco de dados.');
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleDeleteCard = async (id: string) => {
        const confirm = await openConfirm({
            title: 'Excluir Cartão',
            description: 'Tem certeza que deseja excluir este cartão? Todas as faturas associadas a ele podem ser impactadas.',
            variant: 'danger'
        });

        if (confirm) {
            try {
                const result = await deleteCreditCard(id);
                if (result.success) {
                    setCreditCards(prev => prev.filter(c => c.id !== id));
                    // Opcional: Limpar faturas associadas se necessário
                } else {
                    alert('Erro ao excluir cartão do banco de dados.');
                }
            } catch (error) {
                console.error(error);
            }
        }
    };

    const startEditAccount = (acc: BankAccount) => {
        setEditingAccountId(acc.id);
        setNewAccount(acc);
        setIsAccountModalOpen(true);
    };

    const startEditCard = (card: CreditCard) => {
        setEditingCardId(card.id);
        setNewCard(card);
        setIsCardModalOpen(true);
    };

    const startEditStock = (item: StockItem) => {
        setEditingStockId(item.id);
        setNewStockItem(item);
        setIsStockModalOpen(true);
    };

    const startEditAsset = (asset: Asset) => {
        setEditingAssetId(asset.id);
        setNewAsset(asset);
        setIsAssetModalOpen(true);
    };

    const handleDeleteStock = async (id: string) => {
        const confirm = await openConfirm({
            title: 'Excluir Item de Estoque',
            description: 'Tem certeza que deseja excluir este item do estoque?',
            variant: 'danger'
        });
        if (confirm) {
            setStock(prev => prev.filter(s => s.id !== id));
        }
    };

    const handleDeleteAsset = async (id: string) => {
        const confirm = await openConfirm({
            title: 'Excluir Ativo',
            description: 'Tem certeza que deseja excluir este ativo?',
            variant: 'danger'
        });
        if (confirm) {
            setAssets(prev => prev.filter(a => a.id !== id));
        }
    };

    const toggleTransactionStatus = (tx: FinancialTransaction) => {
        const newStatus = tx.status === 'PAID' ? 'PENDING' : 'PAID';
        
        if (tx.bankAccountId) {
            setBankAccounts(prev => prev.map(acc => {
                if (acc.id === tx.bankAccountId) {
                    const amount = tx.type === 'INCOME' ? tx.amount : -tx.amount;
                    const diff = newStatus === 'PAID' ? amount : -amount;
                    return { ...acc, balance: acc.balance + diff };
                }
                return acc;
            }));
        }

        if (tx.type === 'EXPENSE' && tx.creditCardId) {
            const currentMonth = tx.date.slice(0, 7);
            setCreditCards(prev => prev.map(card => {
                if (card.id === tx.creditCardId) {
                    const diff = newStatus === 'PAID' ? -tx.amount : tx.amount;
                    return { ...card, availableLimit: card.availableLimit + diff };
                }
                return card;
            }));

            setCardInvoices(prev => {
                const invoiceIndex = prev.findIndex(inv => inv.creditCardId === tx.creditCardId && inv.month === currentMonth);
                if (invoiceIndex >= 0) {
                    const updatedInvoices = [...prev];
                    const diff = newStatus === 'PAID' ? tx.amount : -tx.amount;
                    updatedInvoices[invoiceIndex] = {
                        ...updatedInvoices[invoiceIndex],
                        amount: updatedInvoices[invoiceIndex].amount + diff
                    };
                    return updatedInvoices;
                }
                return prev;
            });
        }

        setTransactions(prev => prev.map(t => t.id === tx.id ? { ...t, status: newStatus } : t));
        
        // Sync with Supabase
        saveFinancialTransaction({ ...tx, status: newStatus });
    };

    const handleDeleteTransaction = async (tx: FinancialTransaction) => {
        const revertBalance = (t: FinancialTransaction) => {
            if (t.status !== 'PAID') return;
            
            if (t.bankAccountId) {
                setBankAccounts(prev => prev.map(acc => {
                    if (acc.id === t.bankAccountId) {
                        const amount = t.type === 'INCOME' ? t.amount : -t.amount;
                        return { ...acc, balance: acc.balance - amount };
                    }
                    return acc;
                }));
            }

            if (t.type === 'EXPENSE' && t.creditCardId) {
                const currentMonth = t.date.slice(0, 7);
                setCreditCards(prev => prev.map(card => {
                    if (card.id === t.creditCardId) {
                        return { ...card, availableLimit: card.availableLimit + t.amount };
                    }
                    return card;
                }));

                setCardInvoices(prev => {
                    const invoiceIndex = prev.findIndex(inv => inv.creditCardId === t.creditCardId && inv.month === currentMonth);
                    if (invoiceIndex >= 0) {
                        const updatedInvoices = [...prev];
                        updatedInvoices[invoiceIndex] = {
                            ...updatedInvoices[invoiceIndex],
                            amount: updatedInvoices[invoiceIndex].amount - t.amount
                        };
                        return updatedInvoices;
                    }
                    return prev;
                });
            }
        };

        if (tx.recurrenceId) {
            const deleteType = await openConfirm({
                title: 'Excluir Transação Recorrente',
                description: 'Esta transação faz parte de uma recorrência. O que você deseja excluir?',
                confirmText: 'Toda a Recorrência',
                cancelText: 'Apenas Esta',
                variant: 'danger'
            });

            if (deleteType === true) {
                // Delete all with same recurrenceId
                const toDelete = transactions.filter(t => t.recurrenceId === tx.recurrenceId);
                toDelete.forEach(revertBalance);
                setTransactions(prev => prev.filter(t => t.recurrenceId !== tx.recurrenceId));
                
                // Sync with Supabase
                toDelete.forEach(t => deleteFinancialTransaction(t.id));
            } else if (deleteType === false) {
                // Delete only this one
                revertBalance(tx);
                setTransactions(prev => prev.filter(t => t.id !== tx.id));
                
                // Sync with Supabase
                deleteFinancialTransaction(tx.id);
            }
        } else {
            const confirm = await openConfirm({
                title: 'Excluir Transação',
                description: 'Tem certeza que deseja excluir esta transação?',
                variant: 'danger'
            });
            if (confirm) {
                revertBalance(tx);
                setTransactions(prev => prev.filter(t => t.id !== tx.id));
                
                // Sync with Supabase
                deleteFinancialTransaction(tx.id);
            }
        }
    };

    return (
        <div className="flex flex-col h-full space-y-6 animate-pop">
            {/* Header with Tabs */}
            <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm p-4 md:p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-pink-50 text-pink-600 rounded-2xl">
                            <DollarSign size={28} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black tracking-tight text-slate-800">Financeiro</h2>
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Gestão de Fluxo de Caixa</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        {/* Period Filter UI */}
                        <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                            <div className="flex items-center gap-2 px-3 py-1.5">
                                <Calendar size={14} className="text-slate-400" />
                                <input 
                                    type="date" 
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="bg-transparent text-[10px] font-black uppercase tracking-widest text-slate-600 outline-none cursor-pointer"
                                />
                                <span className="text-slate-300 font-bold text-[10px]">ATÉ</span>
                                <input 
                                    type="date" 
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="bg-transparent text-[10px] font-black uppercase tracking-widest text-slate-600 outline-none cursor-pointer"
                                />
                            </div>
                        </div>

                                <div className="flex flex-wrap items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                                    {[
                                        { id: 'DASHBOARD', label: 'Resumo', icon: PieChart },
                                        { id: 'ACCOUNTS', label: 'Contas', icon: Wallet },
                                        { id: 'CARDS', label: 'Cartões', icon: CardIcon },
                                        { id: 'TRANSACTIONS', label: 'Transações', icon: History },
                                        { id: 'INVOICES', label: 'Faturas', icon: FileText },
                                        { id: 'CASH_REGISTER', label: 'Caixa', icon: Calculator },
                                        { id: 'STOCK', label: 'Estoque', icon: Package },
                                        { id: 'ASSETS', label: 'Ativos', icon: Box },
                                        { id: 'REPORTS', label: 'Relatórios', icon: BarChart3 },
                                    ].map(tab => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id as TabType)}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                                activeTab === tab.id 
                                                ? 'bg-white shadow-md text-pink-600' 
                                                : 'text-slate-400 hover:text-slate-600'
                                            }`}
                                        >
                                            <tab.icon size={14} />
                                            <span className="hidden sm:inline">{tab.label}</span>
                                        </button>
                                    ))}
                                </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <AnimatePresence mode="wait">
                    {activeTab === 'DASHBOARD' && (
                        <motion.div 
                            key="dashboard"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-6"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-premium relative overflow-hidden group">
                                    <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><Wallet size={80} className="text-blue-500" /></div>
                                    <p className="text-blue-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Saldo em Contas</p>
                                    <h3 className="text-3xl font-black text-slate-800 tracking-tighter">R$ {stats.totalBalance.toLocaleString('pt-BR')}</h3>
                                    <div className="mt-4 h-1 w-12 bg-blue-500 rounded-full opacity-20 group-hover:w-full transition-all duration-500" />
                                </div>

                                <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-premium relative overflow-hidden group">
                                    <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><TrendingUp size={80} className="text-emerald-500" /></div>
                                    <p className="text-emerald-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Receita no Período</p>
                                    <h3 className="text-3xl font-black text-emerald-600 tracking-tighter">R$ {stats.monthlyIncome.toLocaleString('pt-BR')}</h3>
                                    <div className="mt-4 h-1 w-12 bg-emerald-500 rounded-full opacity-20 group-hover:w-full transition-all duration-500" />
                                </div>

                                <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-premium relative overflow-hidden group">
                                    <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><TrendingDown size={80} className="text-red-500" /></div>
                                    <p className="text-red-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Despesa no Período</p>
                                    <h3 className="text-3xl font-black text-red-600 tracking-tighter">R$ {stats.monthlyExpense.toLocaleString('pt-BR')}</h3>
                                    <div className="mt-4 h-1 w-12 bg-red-500 rounded-full opacity-20 group-hover:w-full transition-all duration-500" />
                                </div>

                                <div className="bg-slate-900 p-6 rounded-[32px] border border-slate-800 shadow-xl relative overflow-hidden group text-white">
                                    <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><CardIcon size={80} className="text-pink-400" /></div>
                                    <p className="text-pink-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Dívida Cartões</p>
                                    <h3 className="text-3xl font-black tracking-tighter">R$ {stats.cardDebt.toLocaleString('pt-BR')}</h3>
                                    <div className="mt-4 h-1 w-12 bg-pink-400 rounded-full opacity-40 group-hover:w-full transition-all duration-500" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-premium">
                                    <div className="flex items-center justify-between mb-8">
                                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                            <Wallet size={18} className="text-blue-500" /> Contas Bancárias
                                        </h3>
                                        <button onClick={() => setActiveTab('ACCOUNTS')} className="text-[10px] font-black text-pink-600 uppercase tracking-widest hover:underline">Ver todas</button>
                                    </div>
                                    <div className="space-y-4">
                                        {bankAccounts.slice(0, 3).map(acc => (
                                            <div key={acc.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm" style={{ backgroundColor: acc.color }}>
                                                        <Building2 size={20} />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-slate-800">{acc.name}</p>
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase">{acc.bankName}</p>
                                                    </div>
                                                </div>
                                                <p className="text-sm font-black text-slate-700">R$ {acc.balance.toLocaleString('pt-BR')}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-premium">
                                    <div className="flex items-center justify-between mb-8">
                                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                            <History size={18} className="text-emerald-500" /> Últimas Transações
                                        </h3>
                                        <button onClick={() => setActiveTab('TRANSACTIONS')} className="text-[10px] font-black text-pink-600 uppercase tracking-widest hover:underline">Ver todas</button>
                                    </div>
                                    <div className="space-y-4">
                                        {filteredTransactions.slice(0, 5).map(tx => (
                                            <div key={tx.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-2xl transition-colors">
                                                <div className="flex items-center gap-4">
                                                    <button 
                                                        onClick={() => toggleTransactionStatus(tx)}
                                                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110 active:scale-90 ${
                                                            tx.status === 'PAID' 
                                                            ? (tx.type === 'INCOME' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600') 
                                                            : 'bg-amber-50 text-amber-600'
                                                        }`}
                                                        title={tx.status === 'PAID' ? 'Marcar como Pendente' : 'Marcar como Pago'}
                                                    >
                                                        {tx.status === 'PAID' ? (tx.type === 'INCOME' ? <TrendingUp size={16} /> : <TrendingDown size={16} />) : <AlertCircle size={16} />}
                                                    </button>
                                                    <div>
                                                        <p className="text-xs font-black text-slate-800 truncate max-w-[150px]">{tx.description}</p>
                                                        <p className="text-[9px] text-slate-400 font-bold uppercase">{tx.date.split('-').reverse().join('/')}</p>
                                                    </div>
                                                </div>
                                                <p className={`text-xs font-black ${tx.type === 'INCOME' ? 'text-emerald-600' : 'text-red-600'}`}>
                                                    {tx.type === 'INCOME' ? '+' : '-'} R$ {tx.amount.toLocaleString('pt-BR')}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'ACCOUNTS' && (
                        <motion.div 
                            key="accounts"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Suas Contas</h3>
                                <button 
                                    onClick={() => setIsAccountModalOpen(true)}
                                    className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
                                >
                                    <Plus size={16} /> Nova Conta
                                </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {bankAccounts.map(acc => (
                                    <div key={acc.id} className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-premium hover:shadow-premium-hover transition-all group">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg" style={{ backgroundColor: acc.color }}>
                                                <Building2 size={28} />
                                            </div>
                                            <div className="flex gap-2">
                                                <button 
                                                    onClick={() => startEditAccount(acc)}
                                                    className="p-2 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all"
                                                    title="Editar"
                                                >
                                                    <Edit2 size={14} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteAccount(acc.id)}
                                                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                                    title="Excluir"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                                <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${acc.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                                    {acc.status === 'ACTIVE' ? 'Ativa' : 'Inativa'}
                                                </span>
                                            </div>
                                        </div>
                                        <h4 className="text-xl font-black text-slate-800 mb-1">{acc.name}</h4>
                                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-6">{acc.bankName}</p>
                                        <div className="pt-6 border-t border-slate-50">
                                            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">Saldo Atual</p>
                                            <p className="text-2xl font-black text-slate-800">R$ {acc.balance.toLocaleString('pt-BR')}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'CARDS' && (
                        <motion.div 
                            key="cards"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Cartões de Crédito</h3>
                                <button 
                                    onClick={() => setIsCardModalOpen(true)}
                                    className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
                                >
                                    <Plus size={16} /> Novo Cartão
                                </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {creditCards.map(card => (
                                    <div key={card.id} className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-premium hover:shadow-premium-hover transition-all relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 opacity-50 group-hover:scale-110 transition-transform" />
                                        <div className="flex justify-between items-start mb-8 relative">
                                            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-md" style={{ backgroundColor: card.color }}>
                                                <CardIcon size={24} />
                                            </div>
                                            <div className="flex gap-3 items-start">
                                                <button 
                                                    onClick={() => startEditCard(card)}
                                                    className="p-2 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all"
                                                    title="Editar"
                                                >
                                                    <Edit2 size={14} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteCard(card.id)}
                                                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                                    title="Excluir"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                                <div className="text-right ml-2">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vencimento</p>
                                                    <p className="text-sm font-black text-slate-800">Dia {card.dueDate}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <h4 className="text-2xl font-black text-slate-800 mb-1">{card.name}</h4>
                                        <p className="text-xs font-bold text-slate-400 mb-8">{card.brand} •••• 4582</p>
                                        
                                        <div className="space-y-4">
                                            <div>
                                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2">
                                                    <span className="text-slate-400">Limite Utilizado</span>
                                                    <span className="text-slate-800">R$ {(card.limit - card.availableLimit).toLocaleString('pt-BR')}</span>
                                                </div>
                                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                                    <div 
                                                        className="h-full bg-pink-500 rounded-full transition-all duration-1000" 
                                                        style={{ width: `${((card.limit - card.availableLimit) / card.limit) * 100}%` }}
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex justify-between pt-4 border-t border-slate-50">
                                                <div>
                                                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">Disponível</p>
                                                    <p className="text-lg font-black text-emerald-600">R$ {card.availableLimit.toLocaleString('pt-BR')}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">Limite Total</p>
                                                    <p className="text-lg font-black text-slate-800">R$ {card.limit.toLocaleString('pt-BR')}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'TRANSACTIONS' && (
                        <motion.div 
                            key="transactions"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="relative flex-1">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                    <input 
                                        type="text" 
                                        placeholder="Buscar por descrição, cliente..." 
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-transparent focus:bg-white focus:border-pink-200 rounded-2xl text-sm font-bold outline-none transition-all"
                                    />
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
                                        {[
                                            { id: 'ALL', label: 'Todas' },
                                            { id: 'INCOME', label: 'Receitas' },
                                            { id: 'EXPENSE', label: 'Despesas' },
                                        ].map(type => (
                                            <button
                                                key={type.id}
                                                onClick={() => setTypeFilter(type.id as any)}
                                                className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                                                    typeFilter === type.id 
                                                    ? 'bg-white shadow-sm text-pink-600' 
                                                    : 'text-slate-400 hover:text-slate-600'
                                                }`}
                                            >
                                                {type.label}
                                            </button>
                                        ))}
                                    </div>
                                    <button 
                                        onClick={() => setIsTransactionModalOpen(true)}
                                        className="flex items-center gap-2 px-6 py-3 bg-pink-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-pink-700 transition-all shadow-xl shadow-pink-200"
                                    >
                                        <Plus size={16} /> Nova Transação
                                    </button>
                                </div>
                            </div>

                            <div className="bg-white rounded-[40px] border border-slate-100 shadow-premium overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50/50">
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Data</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Descrição</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Categoria</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Origem/Destino</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Valor</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {filteredTransactions.map(tx => {
                                                const category = initialCategories.find(c => c.id === tx.categoryId);
                                                const account = bankAccounts.find(a => a.id === tx.bankAccountId);
                                                const card = creditCards.find(c => c.id === tx.creditCardId);
                                                
                                                return (
                                                    <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors group">
                                                        <td className="px-6 py-4">
                                                            <p className="text-xs font-black text-slate-800">{tx.date.split('-').reverse().join('/')}</p>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-2">
                                                                <p className="text-xs font-black text-slate-800">{tx.description}</p>
                                                                {tx.recurrenceId && (
                                                                    <div className="p-1 bg-blue-50 text-blue-500 rounded-lg" title="Transação Recorrente">
                                                                        <Repeat size={10} />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            {tx.clientId && (
                                                                <p className="text-[9px] text-slate-400 font-bold uppercase mt-1 flex items-center gap-1">
                                                                    <Building2 size={10} /> {clients.find(c => c.id === tx.clientId)?.name}
                                                                </p>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border" style={{ color: category?.color, borderColor: category?.color + '40', backgroundColor: category?.color + '10' }}>
                                                                {category?.name}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-2">
                                                                {account ? (
                                                                    <>
                                                                        <Wallet size={12} className="text-slate-400" />
                                                                        <span className="text-[10px] font-bold text-slate-600">{account.name}</span>
                                                                    </>
                                                                ) : card ? (
                                                                    <>
                                                                        <CardIcon size={12} className="text-slate-400" />
                                                                        <span className="text-[10px] font-bold text-slate-600">{card.name}</span>
                                                                    </>
                                                                ) : (
                                                                    <span className="text-[10px] font-bold text-slate-300">N/A</span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <button 
                                                                onClick={() => toggleTransactionStatus(tx)}
                                                                className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 ${
                                                                    tx.status === 'PAID' 
                                                                    ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' 
                                                                    : 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                                                                }`}
                                                                title={tx.status === 'PAID' ? 'Marcar como Pendente' : 'Marcar como Pago'}
                                                            >
                                                                {tx.status === 'PAID' ? 'Pago' : 'Pendente'}
                                                            </button>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <div className="flex items-center justify-end gap-3">
                                                                <p className={`text-sm font-black ${tx.type === 'INCOME' ? 'text-emerald-600' : 'text-red-600'}`}>
                                                                    {tx.type === 'INCOME' ? '+' : '-'} R$ {tx.amount.toLocaleString('pt-BR')}
                                                                </p>
                                                                <button 
                                                                    onClick={() => handleDeleteTransaction(tx)}
                                                                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                                                >
                                                                    <X size={14} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'INVOICES' && (
                        <motion.div 
                            key="invoices"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {filteredInvoices.map(inv => {
                                    const card = creditCards.find(c => c.id === inv.creditCardId);
                                    return (
                                        <div key={inv.id} className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-premium flex items-center justify-between group">
                                            <div className="flex items-center gap-6">
                                                <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-pink-50 group-hover:text-pink-600 transition-colors">
                                                    <FileText size={32} />
                                                </div>
                                                <div>
                                                    <h4 className="text-lg font-black text-slate-800">{inv.month}</h4>
                                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{card?.name || 'Cartão Desconhecido'}</p>
                                                    <div className="flex items-center gap-3 mt-2">
                                                        <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                                                            inv.status === 'PAID' ? 'bg-emerald-50 text-emerald-600' : 
                                                            inv.status === 'OPEN' ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'
                                                        }`}>
                                                            {inv.status === 'PAID' ? 'Paga' : inv.status === 'OPEN' ? 'Aberta' : 'Vencida'}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400 font-bold">Vence em {inv.dueDate.split('-').reverse().join('/')}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Valor</p>
                                                <p className="text-xl font-black text-slate-800">R$ {inv.amount.toLocaleString('pt-BR')}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                                {filteredInvoices.length === 0 && (
                                    <div className="col-span-full py-20 text-center bg-white rounded-[40px] border border-slate-100">
                                        <FileText size={48} className="mx-auto text-slate-200 mb-4" />
                                        <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Nenhuma fatura encontrada para este período</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                    {activeTab === 'CASH_REGISTER' && (
                        <motion.div 
                            key="cash_register"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            {!currentCashSession ? (
                                <div className="bg-white p-12 rounded-[40px] border border-slate-100 shadow-premium text-center">
                                    <Calculator size={64} className="mx-auto text-slate-200 mb-6" />
                                    <h3 className="text-2xl font-black text-slate-800 mb-2">Caixa Fechado</h3>
                                    <p className="text-slate-400 font-bold mb-8">Abra o caixa para começar a registrar movimentações em dinheiro.</p>
                                    <button 
                                        onClick={handleOpenCashRegister}
                                        className="px-8 py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
                                    >
                                        Abrir Caixa Agora
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-premium">
                                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Valor Inicial</p>
                                            <h4 className="text-2xl font-black text-slate-800">R$ {currentCashSession.initialAmount.toLocaleString('pt-BR')}</h4>
                                        </div>
                                        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-premium">
                                            <p className="text-emerald-500 text-[10px] font-black uppercase tracking-widest mb-1">Entradas</p>
                                            <h4 className="text-2xl font-black text-emerald-600">R$ {sessionMovements.filter(m => m.type === 'IN').reduce((acc, m) => acc + m.amount, 0).toLocaleString('pt-BR')}</h4>
                                        </div>
                                        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-premium">
                                            <p className="text-red-500 text-[10px] font-black uppercase tracking-widest mb-1">Saídas</p>
                                            <h4 className="text-2xl font-black text-red-600">R$ {sessionMovements.filter(m => m.type === 'OUT').reduce((acc, m) => acc + m.amount, 0).toLocaleString('pt-BR')}</h4>
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-[40px] border border-slate-100 shadow-premium overflow-hidden">
                                        <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                                                <History size={18} className="text-pink-500" /> Movimentações do Dia
                                            </h3>
                                            <div className="flex gap-3">
                                                <button 
                                                    onClick={() => setIsCashMovementModalOpen(true)}
                                                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all"
                                                >
                                                    <Plus size={14} /> Nova Movimentação
                                                </button>
                                                <button 
                                                    onClick={handleCloseCashRegister}
                                                    className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-all"
                                                >
                                                    <X size={14} /> Fechar Caixa
                                                </button>
                                            </div>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left">
                                                <thead>
                                                    <tr className="bg-slate-50/50">
                                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Hora</th>
                                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Descrição</th>
                                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Categoria</th>
                                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Valor</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-50">
                                                    {sessionMovements.map(m => (
                                                        <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                                                            <td className="px-6 py-4 text-xs font-bold text-slate-500">{new Date(m.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</td>
                                                            <td className="px-6 py-4 text-xs font-black text-slate-800">{m.description}</td>
                                                            <td className="px-6 py-4">
                                                                <span className="px-2 py-1 bg-slate-100 text-slate-500 rounded-lg text-[9px] font-black uppercase tracking-widest">{m.category}</span>
                                                            </td>
                                                            <td className={`px-6 py-4 text-right text-xs font-black ${m.type === 'IN' ? 'text-emerald-600' : 'text-red-600'}`}>
                                                                {m.type === 'IN' ? '+' : '-'} R$ {m.amount.toLocaleString('pt-BR')}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {sessionMovements.length === 0 && (
                                                        <tr>
                                                            <td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-bold uppercase text-[10px] tracking-widest">Nenhuma movimentação registrada</td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {activeTab === 'STOCK' && (
                        <motion.div 
                            key="stock"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Controle de Estoque</h3>
                                <button 
                                    onClick={() => {
                                        setEditingStockId(null);
                                        setNewStockItem({ quantity: 0, minQuantity: 0, price: 0 });
                                        setIsStockModalOpen(true);
                                    }}
                                    className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
                                >
                                    <Plus size={16} /> Novo Item
                                </button>
                            </div>

                            <div className="bg-white rounded-[40px] border border-slate-100 shadow-premium overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-slate-50/50">
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Item</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Categoria</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Quantidade</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {stock.map(item => (
                                                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                                                    <td className="px-6 py-4">
                                                        <p className="text-xs font-black text-slate-800">{item.name}</p>
                                                        <p className="text-[9px] text-slate-400 font-bold uppercase">{item.location}</p>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="px-2 py-1 bg-slate-100 text-slate-500 rounded-lg text-[9px] font-black uppercase tracking-widest">{item.category}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <p className="text-xs font-black text-slate-800">{item.quantity} {item.unit}</p>
                                                        <p className="text-[9px] text-slate-400 font-bold uppercase">Mín: {item.minQuantity}</p>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {item.quantity <= item.minQuantity ? (
                                                            <span className="px-3 py-1 bg-red-50 text-red-600 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1 w-fit">
                                                                <AlertCircle size={10} /> Crítico
                                                            </span>
                                                        ) : (
                                                            <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1 w-fit">
                                                                <CheckCircle2 size={10} /> Ok
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button onClick={() => startEditStock(item)} className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all"><Edit2 size={14} /></button>
                                                            <button onClick={() => handleDeleteStock(item.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={14} /></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'ASSETS' && (
                        <motion.div 
                            key="assets"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Gestão de Ativos</h3>
                                <button 
                                    onClick={() => {
                                        setEditingAssetId(null);
                                        setNewAsset({ category: 'HARDWARE', status: 'ACTIVE', purchaseValue: 0, currentValue: 0, purchaseDate: new Date().toISOString().split('T')[0] });
                                        setIsAssetModalOpen(true);
                                    }}
                                    className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
                                >
                                    <Plus size={16} /> Novo Ativo
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {assets.map(asset => (
                                    <div key={asset.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-premium group relative overflow-hidden">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg ${
                                                asset.category === 'HARDWARE' ? 'bg-blue-500' : 
                                                asset.category === 'SOFTWARE' ? 'bg-purple-500' : 
                                                asset.category === 'VEHICLE' ? 'bg-orange-500' : 'bg-slate-500'
                                            }`}>
                                                {asset.category === 'HARDWARE' ? <Monitor size={24} /> : 
                                                 asset.category === 'SOFTWARE' ? <Cpu size={24} /> : 
                                                 asset.category === 'VEHICLE' ? <Truck size={24} /> : <Box size={24} />}
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => startEditAsset(asset)} className="p-2 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all"><Edit2 size={14} /></button>
                                                <button onClick={() => handleDeleteAsset(asset.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={14} /></button>
                                            </div>
                                        </div>
                                        <h4 className="text-lg font-black text-slate-800 mb-1">{asset.name}</h4>
                                        <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-4">{asset.serialNumber || 'Sem Serial'}</p>
                                        
                                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                                            <div>
                                                <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest mb-1">Valor Compra</p>
                                                <p className="text-xs font-black text-slate-800">R$ {asset.purchaseValue.toLocaleString('pt-BR')}</p>
                                            </div>
                                            <div>
                                                <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest mb-1">Status</p>
                                                <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${
                                                    asset.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' : 
                                                    asset.status === 'MAINTENANCE' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-400'
                                                }`}>
                                                    {asset.status === 'ACTIVE' ? 'Ativo' : asset.status === 'MAINTENANCE' ? 'Manutenção' : 'Baixado'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'REPORTS' && (
                        <motion.div 
                            key="reports"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="space-y-6"
                        >
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="lg:col-span-2 bg-white p-8 rounded-[40px] border border-slate-100 shadow-premium">
                                    <div className="flex items-center justify-between mb-8">
                                        <div>
                                            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Fluxo de Caixa</h3>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Receitas vs Despesas (Últimos 15 dias)</p>
                                        </div>
                                        <button className="p-2 text-slate-400 hover:text-pink-600 hover:bg-pink-50 rounded-xl transition-all">
                                            <Download size={18} />
                                        </button>
                                    </div>
                                    <div className="h-[300px] w-full">
                                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                                            <AreaChart data={chartData}>
                                                <defs>
                                                    <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                                    </linearGradient>
                                                    <linearGradient id="colorDespesa" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                <XAxis 
                                                    dataKey="name" 
                                                    axisLine={false} 
                                                    tickLine={false} 
                                                    tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                                                />
                                                <YAxis 
                                                    axisLine={false} 
                                                    tickLine={false} 
                                                    tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                                                    tickFormatter={(value) => `R$ ${value}`}
                                                />
                                                <Tooltip 
                                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                                />
                                                <Area type="monotone" dataKey="receita" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorReceita)" />
                                                <Area type="monotone" dataKey="despesa" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorDespesa)" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                <div className="bg-slate-900 p-8 rounded-[40px] border border-slate-800 shadow-xl text-white relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-8 opacity-10">
                                        <Cpu size={120} />
                                    </div>
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-3 mb-8">
                                            <div className="p-3 bg-pink-500 rounded-2xl shadow-lg shadow-pink-500/20">
                                                <BarChart3 size={24} />
                                            </div>
                                            <h3 className="text-lg font-black uppercase tracking-tight">IA Insights</h3>
                                        </div>
                                        
                                        <div className="space-y-6">
                                            {aiAnalysis ? (
                                                <div className="text-sm font-medium leading-relaxed text-slate-300">
                                                    {aiAnalysis.split('\n').map((line, i) => (
                                                        <p key={i} className="mb-2">{line}</p>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="py-12 text-center">
                                                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-6">Analise sua saúde financeira com inteligência artificial</p>
                                                    <button 
                                                        onClick={handleAiAnalysis}
                                                        disabled={isAiAnalysisLoading}
                                                        className="w-full py-4 bg-pink-600 hover:bg-pink-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-pink-600/20 disabled:opacity-50"
                                                    >
                                                        {isAiAnalysisLoading ? 'Analisando...' : 'Gerar Relatório IA'}
                                                    </button>
                                                </div>
                                            )}
                                            {aiAnalysis && (
                                                <button 
                                                    onClick={() => setAiAnalysis(null)}
                                                    className="text-[10px] font-black text-pink-400 uppercase tracking-widest hover:text-pink-300 transition-colors"
                                                >
                                                    Limpar Análise
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Stock Modal */}
            {isStockModalOpen && (
                <Modal 
                    isOpen={isStockModalOpen} 
                    onClose={() => { setIsStockModalOpen(false); setEditingStockId(null); }}
                    maxWidth="500px"
                    hideHeader={true}
                    noPadding={true}
                    scrollable={false}
                >
                    <div className="flex flex-col flex-1 min-h-0">
                        <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-white sticky top-0 z-20">
                            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">{editingStockId ? 'Editar Item' : 'Novo Item de Estoque'}</h3>
                            <button onClick={() => { setIsStockModalOpen(false); setEditingStockId(null); }} className="p-2 text-slate-300 hover:bg-slate-50 rounded-full transition-colors"><X size={20}/></button>
                        </div>
                        <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1 min-h-0">
                            <div>
                                <label className="text-[9px] uppercase text-slate-400 font-black mb-2 block tracking-widest ml-1">Nome do Item</label>
                                <input 
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-bold outline-none focus:bg-white focus:border-pink-500 transition-all"
                                    placeholder="Ex: Papel A4"
                                    value={newStockItem.name || ''}
                                    onChange={e => setNewStockItem({...newStockItem, name: e.target.value})}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[9px] uppercase text-slate-400 font-black mb-2 block tracking-widest ml-1">Categoria</label>
                                    <input 
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-bold outline-none focus:bg-white focus:border-pink-500 transition-all"
                                        placeholder="Ex: Escritório"
                                        value={newStockItem.category || ''}
                                        onChange={e => setNewStockItem({...newStockItem, category: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="text-[9px] uppercase text-slate-400 font-black mb-2 block tracking-widest ml-1">Unidade</label>
                                    <input 
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-bold outline-none focus:bg-white focus:border-pink-500 transition-all"
                                        placeholder="Ex: Pacote, kg, un"
                                        value={newStockItem.unit || ''}
                                        onChange={e => setNewStockItem({...newStockItem, unit: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[9px] uppercase text-slate-400 font-black mb-2 block tracking-widest ml-1">Quantidade Atual</label>
                                    <input 
                                        type="number"
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-bold outline-none focus:bg-white focus:border-pink-500 transition-all"
                                        value={newStockItem.quantity || ''}
                                        onChange={e => setNewStockItem({...newStockItem, quantity: parseInt(e.target.value)})}
                                    />
                                </div>
                                <div>
                                    <label className="text-[9px] uppercase text-slate-400 font-black mb-2 block tracking-widest ml-1">Quantidade Mínima</label>
                                    <input 
                                        type="number"
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-bold outline-none focus:bg-white focus:border-pink-500 transition-all"
                                        value={newStockItem.minQuantity || ''}
                                        onChange={e => setNewStockItem({...newStockItem, minQuantity: parseInt(e.target.value)})}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-[9px] uppercase text-slate-400 font-black mb-2 block tracking-widest ml-1">Localização</label>
                                <input 
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-bold outline-none focus:bg-white focus:border-pink-500 transition-all"
                                    placeholder="Ex: Prateleira A1"
                                    value={newStockItem.location || ''}
                                    onChange={e => setNewStockItem({...newStockItem, location: e.target.value})}
                                />
                            </div>
                        </div>
                        <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 sticky bottom-0 z-20">
                            <button onClick={() => { setIsStockModalOpen(false); setEditingStockId(null); }} className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors">Cancelar</button>
                            <button onClick={handleAddStockItem} className="px-8 py-3 bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-slate-200 hover:bg-slate-800">{editingStockId ? 'Salvar Alterações' : 'Adicionar ao Estoque'}</button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Asset Modal */}
            {isAssetModalOpen && (
                <Modal 
                    isOpen={isAssetModalOpen} 
                    onClose={() => { setIsAssetModalOpen(false); setEditingAssetId(null); }}
                    maxWidth="500px"
                    hideHeader={true}
                    noPadding={true}
                    scrollable={false}
                >
                    <div className="flex flex-col flex-1 min-h-0">
                        <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-white sticky top-0 z-20">
                            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">{editingAssetId ? 'Editar Ativo' : 'Novo Ativo'}</h3>
                            <button onClick={() => { setIsAssetModalOpen(false); setEditingAssetId(null); }} className="p-2 text-slate-300 hover:bg-slate-50 rounded-full transition-colors"><X size={20}/></button>
                        </div>
                        <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1 min-h-0">
                            <div>
                                <label className="text-[9px] uppercase text-slate-400 font-black mb-2 block tracking-widest ml-1">Nome do Ativo</label>
                                <input 
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-bold outline-none focus:bg-white focus:border-pink-500 transition-all"
                                    placeholder="Ex: MacBook Pro M3"
                                    value={newAsset.name || ''}
                                    onChange={e => setNewAsset({...newAsset, name: e.target.value})}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[9px] uppercase text-slate-400 font-black mb-2 block tracking-widest ml-1">Categoria</label>
                                    <select 
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-bold outline-none focus:bg-white focus:border-pink-500 transition-all"
                                        value={newAsset.category}
                                        onChange={e => setNewAsset({...newAsset, category: e.target.value as any})}
                                    >
                                        <option value="HARDWARE">Hardware</option>
                                        <option value="SOFTWARE">Software</option>
                                        <option value="FURNITURE">Móveis</option>
                                        <option value="VEHICLE">Veículo</option>
                                        <option value="OTHER">Outro</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[9px] uppercase text-slate-400 font-black mb-2 block tracking-widest ml-1">Status</label>
                                    <select 
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-bold outline-none focus:bg-white focus:border-pink-500 transition-all"
                                        value={newAsset.status}
                                        onChange={e => setNewAsset({...newAsset, status: e.target.value as any})}
                                    >
                                        <option value="ACTIVE">Ativo</option>
                                        <option value="MAINTENANCE">Manutenção</option>
                                        <option value="DISPOSED">Baixado</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[9px] uppercase text-slate-400 font-black mb-2 block tracking-widest ml-1">Data de Compra</label>
                                    <input 
                                        type="date"
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-bold outline-none focus:bg-white focus:border-pink-500 transition-all"
                                        value={newAsset.purchaseDate}
                                        onChange={e => setNewAsset({...newAsset, purchaseDate: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="text-[9px] uppercase text-slate-400 font-black mb-2 block tracking-widest ml-1">Valor de Compra</label>
                                    <input 
                                        type="number"
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-bold outline-none focus:bg-white focus:border-pink-500 transition-all"
                                        value={newAsset.purchaseValue || ''}
                                        onChange={e => setNewAsset({...newAsset, purchaseValue: parseFloat(e.target.value)})}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-[9px] uppercase text-slate-400 font-black mb-2 block tracking-widest ml-1">Responsável</label>
                                <select 
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-bold outline-none focus:bg-white focus:border-pink-500 transition-all"
                                    value={newAsset.responsibleId || ''}
                                    onChange={e => setNewAsset({...newAsset, responsibleId: e.target.value})}
                                >
                                    <option value="">Sem Responsável</option>
                                    {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 sticky bottom-0 z-20">
                            <button onClick={() => { setIsAssetModalOpen(false); setEditingAssetId(null); }} className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors">Cancelar</button>
                            <button onClick={handleAddAsset} className="px-8 py-3 bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-slate-200 hover:bg-slate-800">{editingAssetId ? 'Salvar Alterações' : 'Cadastrar Ativo'}</button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Cash Movement Modal */}
            {isCashMovementModalOpen && (
                <Modal 
                    isOpen={isCashMovementModalOpen} 
                    onClose={() => setIsCashMovementModalOpen(false)}
                    maxWidth="400px"
                    hideHeader={true}
                    noPadding={true}
                    scrollable={false}
                >
                    <div className="flex flex-col flex-1 min-h-0">
                        <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-white sticky top-0 z-20">
                            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Nova Movimentação</h3>
                            <button onClick={() => setIsCashMovementModalOpen(false)} className="p-2 text-slate-300 hover:bg-slate-50 rounded-full transition-colors"><X size={20}/></button>
                        </div>
                        <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1 min-h-0">
                            <div className="flex p-1 bg-slate-100 rounded-2xl">
                                <button 
                                    onClick={() => setNewCashMovement({...newCashMovement, type: 'IN'})}
                                    className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${newCashMovement.type === 'IN' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-400'}`}
                                >
                                    Entrada
                                </button>
                                <button 
                                    onClick={() => setNewCashMovement({...newCashMovement, type: 'OUT'})}
                                    className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${newCashMovement.type === 'OUT' ? 'bg-red-500 text-white shadow-lg' : 'text-slate-400'}`}
                                >
                                    Saída
                                </button>
                            </div>

                            <div>
                                <label className="text-[9px] uppercase text-slate-400 font-black mb-2 block tracking-widest ml-1">Valor (R$)</label>
                                <input 
                                    type="number" 
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-xl font-black outline-none focus:bg-white focus:border-pink-500 transition-all"
                                    placeholder="0,00"
                                    value={newCashMovement.amount || ''}
                                    onChange={e => setNewCashMovement({...newCashMovement, amount: parseFloat(e.target.value)})}
                                />
                            </div>

                            <div>
                                <label className="text-[9px] uppercase text-slate-400 font-black mb-2 block tracking-widest ml-1">Descrição</label>
                                <input 
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-bold outline-none focus:bg-white focus:border-pink-500 transition-all"
                                    placeholder="Ex: Venda de Café"
                                    value={newCashMovement.description || ''}
                                    onChange={e => setNewCashMovement({...newCashMovement, description: e.target.value})}
                                />
                            </div>

                            <div>
                                <label className="text-[9px] uppercase text-slate-400 font-black mb-2 block tracking-widest ml-1">Categoria</label>
                                <select 
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-bold outline-none focus:bg-white focus:border-pink-500 transition-all"
                                    value={newCashMovement.category}
                                    onChange={e => setNewCashMovement({...newCashMovement, category: e.target.value as any})}
                                >
                                    <option value="SALE">Venda</option>
                                    <option value="SUPPLY">Suprimento</option>
                                    <option value="WITHDRAWAL">Sangria / Retirada</option>
                                    <option value="EXPENSE">Despesa</option>
                                    <option value="OTHER">Outro</option>
                                </select>
                            </div>
                        </div>
                        <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 sticky bottom-0 z-20">
                            <button onClick={() => setIsCashMovementModalOpen(false)} className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors">Cancelar</button>
                            <button onClick={handleAddCashMovement} className="px-8 py-3 bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-slate-200 hover:bg-slate-800">Confirmar</button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Transaction Modal */}
            {isTransactionModalOpen && (
                <Modal 
                    isOpen={isTransactionModalOpen} 
                    onClose={() => setIsTransactionModalOpen(false)}
                    maxWidth="500px"
                    hideHeader={true}
                    noPadding={true}
                    scrollable={false}
                >
                    <div className="flex flex-col flex-1 min-h-0">
                        <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-white sticky top-0 z-20">
                            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Nova Transação</h3>
                            <button onClick={() => setIsTransactionModalOpen(false)} className="p-2 text-slate-300 hover:bg-slate-50 rounded-full transition-colors"><X size={20}/></button>
                        </div>
                        <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1 min-h-0">
                            <div className="flex p-1 bg-slate-100 rounded-2xl">
                                <button 
                                    onClick={() => setNewTransaction({...newTransaction, type: 'INCOME'})}
                                    className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${newTransaction.type === 'INCOME' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-400'}`}
                                >
                                    Receita
                                </button>
                                <button 
                                    onClick={() => setNewTransaction({...newTransaction, type: 'EXPENSE'})}
                                    className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${newTransaction.type === 'EXPENSE' ? 'bg-red-500 text-white shadow-lg' : 'text-slate-400'}`}
                                >
                                    Despesa
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[9px] uppercase text-slate-400 font-black mb-2 block tracking-widest ml-1">Valor (R$)</label>
                                    <input 
                                        type="number" 
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-xl font-black outline-none focus:bg-white focus:border-pink-500 transition-all"
                                        placeholder="0,00"
                                        value={newTransaction.amount || ''}
                                        onChange={e => setNewTransaction({...newTransaction, amount: parseFloat(e.target.value)})}
                                    />
                                </div>
                                <div>
                                    <label className="text-[9px] uppercase text-slate-400 font-black mb-2 block tracking-widest ml-1">Data</label>
                                    <input 
                                        type="date" 
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-bold outline-none focus:bg-white focus:border-pink-500 transition-all"
                                        value={newTransaction.date}
                                        onChange={e => setNewTransaction({...newTransaction, date: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-[9px] uppercase text-slate-400 font-black mb-2 block tracking-widest ml-1">Descrição</label>
                                <input 
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-bold outline-none focus:bg-white focus:border-pink-500 transition-all"
                                    placeholder="Ex: Pagamento Fornecedor X"
                                    value={newTransaction.description || ''}
                                    onChange={e => setNewTransaction({...newTransaction, description: e.target.value})}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[9px] uppercase text-slate-400 font-black mb-2 block tracking-widest ml-1">Categoria</label>
                                    <select 
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-bold outline-none focus:bg-white focus:border-pink-500 transition-all"
                                        value={newTransaction.categoryId}
                                        onChange={e => setNewTransaction({...newTransaction, categoryId: e.target.value})}
                                    >
                                        {initialCategories.filter(c => c.type === 'BOTH' || c.type === newTransaction.type).map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[9px] uppercase text-slate-400 font-black mb-2 block tracking-widest ml-1">Status</label>
                                    <select 
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-bold outline-none focus:bg-white focus:border-pink-500 transition-all"
                                        value={newTransaction.status}
                                        onChange={e => setNewTransaction({...newTransaction, status: e.target.value as any})}
                                    >
                                        <option value="PAID">Pago / Recebido</option>
                                        <option value="PENDING">Pendente</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-[9px] uppercase text-slate-400 font-black mb-2 block tracking-widest ml-1">
                                    {newTransaction.type === 'INCOME' ? 'Conta de Destino' : 'Forma de Pagamento'}
                                </label>
                                <select 
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-bold outline-none focus:bg-white focus:border-pink-500 transition-all"
                                    value={newTransaction.bankAccountId || newTransaction.creditCardId || ''}
                                    onChange={e => {
                                        const val = e.target.value;
                                        if (val.startsWith('ba-')) {
                                            setNewTransaction({...newTransaction, bankAccountId: val.replace('ba-', ''), creditCardId: undefined});
                                        } else if (val.startsWith('cc-')) {
                                            setNewTransaction({...newTransaction, creditCardId: val.replace('cc-', ''), bankAccountId: undefined});
                                        } else {
                                            setNewTransaction({...newTransaction, bankAccountId: undefined, creditCardId: undefined});
                                        }
                                    }}
                                >
                                    <option value="">Nenhum</option>
                                    <optgroup label="Contas Bancárias">
                                        {bankAccounts.map(acc => <option key={acc.id} value={`ba-${acc.id}`}>{acc.name}</option>)}
                                    </optgroup>
                                    {newTransaction.type === 'EXPENSE' && (
                                        <optgroup label="Cartões de Crédito">
                                            {creditCards.map(card => <option key={card.id} value={`cc-${card.id}`}>{card.name}</option>)}
                                        </optgroup>
                                    )}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[9px] uppercase text-slate-400 font-black mb-2 block tracking-widest ml-1">Cliente (Opcional)</label>
                                    <select 
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-bold outline-none focus:bg-white focus:border-pink-500 transition-all"
                                        value={newTransaction.clientId || ''}
                                        onChange={e => setNewTransaction({...newTransaction, clientId: e.target.value})}
                                    >
                                        <option value="">Sem Cliente</option>
                                        {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[9px] uppercase text-slate-400 font-black mb-2 block tracking-widest ml-1">Squad (Opcional)</label>
                                    <select 
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-bold outline-none focus:bg-white focus:border-pink-500 transition-all"
                                        value={newTransaction.squadId || ''}
                                        onChange={e => setNewTransaction({...newTransaction, squadId: e.target.value})}
                                    >
                                        <option value="">Sem Squad</option>
                                        {squads.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Recurrence Section */}
                            <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-100 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white rounded-xl text-blue-500 shadow-sm">
                                            <Repeat size={16} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Transação Recorrente</p>
                                            <p className="text-[9px] text-slate-400 font-bold uppercase">Repetir mensalmente</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setNewTransaction({...newTransaction, isRecurring: !newTransaction.isRecurring})}
                                        className={`w-12 h-6 rounded-full transition-all relative ${newTransaction.isRecurring ? 'bg-blue-500' : 'bg-slate-200'}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${newTransaction.isRecurring ? 'left-7' : 'left-1'}`} />
                                    </button>
                                </div>

                                {newTransaction.isRecurring && (
                                    <motion.div 
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        className="pt-4 border-t border-slate-200"
                                    >
                                        <label className="text-[9px] uppercase text-slate-400 font-black mb-2 block tracking-widest ml-1">Quantidade de meses</label>
                                        <div className="flex items-center gap-4">
                                            <input 
                                                type="range" 
                                                min="2" 
                                                max="24" 
                                                value={newTransaction.recurrenceMonths || 2}
                                                onChange={e => setNewTransaction({...newTransaction, recurrenceMonths: parseInt(e.target.value)})}
                                                className="flex-1 accent-blue-500"
                                            />
                                            <span className="w-12 text-center text-sm font-black text-slate-800 bg-white px-2 py-1 rounded-lg border border-slate-200">
                                                {newTransaction.recurrenceMonths || 2}
                                            </span>
                                        </div>
                                        <p className="text-[9px] text-slate-400 font-bold uppercase mt-2 italic">
                                            Serão criadas {newTransaction.recurrenceMonths || 2} transações idênticas.
                                        </p>
                                    </motion.div>
                                )}
                            </div>
                        </div>
                        <div className="p-8 bg-slate-50 border-t border-slate-100 sticky bottom-0 z-20 flex justify-end gap-3">
                            <button onClick={() => setIsTransactionModalOpen(false)} className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors">Cancelar</button>
                            <button onClick={handleAddTransaction} className="px-8 py-3 bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-slate-200 hover:bg-slate-800">Salvar Transação</button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Account Modal */}
            {isAccountModalOpen && (
                <Modal 
                    isOpen={isAccountModalOpen} 
                    onClose={() => {
                        setIsAccountModalOpen(false);
                        setEditingAccountId(null);
                    }}
                    maxWidth="500px"
                    hideHeader={true}
                    noPadding={true}
                    scrollable={false}
                >
                    <div className="flex flex-col flex-1 min-h-0">
                        <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-white sticky top-0 z-20">
                            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">{editingAccountId ? 'Editar Conta' : 'Nova Conta'}</h3>
                            <button onClick={() => { setIsAccountModalOpen(false); setEditingAccountId(null); }} className="p-2 text-slate-300 hover:bg-slate-50 rounded-full transition-colors"><X size={20}/></button>
                        </div>
                        <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1 min-h-0">
                            <div>
                                <label className="text-[9px] uppercase text-slate-400 font-black mb-2 block tracking-widest ml-1">Nome da Conta</label>
                                <input 
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-bold outline-none focus:bg-white focus:border-pink-500 transition-all"
                                    placeholder="Ex: Itaú Empresa"
                                    value={newAccount.name || ''}
                                    onChange={e => setNewAccount({...newAccount, name: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="text-[9px] uppercase text-slate-400 font-black mb-2 block tracking-widest ml-1">Banco / Instituição</label>
                                <input 
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-bold outline-none focus:bg-white focus:border-pink-500 transition-all"
                                    placeholder="Ex: Banco Itaú"
                                    value={newAccount.bankName || ''}
                                    onChange={e => setNewAccount({...newAccount, bankName: e.target.value})}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[9px] uppercase text-slate-400 font-black mb-2 block tracking-widest ml-1">Tipo</label>
                                    <select 
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-bold outline-none focus:bg-white focus:border-pink-500 transition-all"
                                        value={newAccount.type}
                                        onChange={e => setNewAccount({...newAccount, type: e.target.value as any})}
                                    >
                                        <option value="CHECKING">Corrente</option>
                                        <option value="SAVINGS">Poupança</option>
                                        <option value="CASH">Dinheiro</option>
                                        <option value="INVESTMENT">Investimento</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[9px] uppercase text-slate-400 font-black mb-2 block tracking-widest ml-1">Saldo Inicial</label>
                                    <input 
                                        type="number"
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-bold outline-none focus:bg-white focus:border-pink-500 transition-all"
                                        placeholder="0,00"
                                        value={newAccount.balance || ''}
                                        onChange={e => setNewAccount({...newAccount, balance: parseFloat(e.target.value)})}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-[9px] uppercase text-slate-400 font-black mb-2 block tracking-widest ml-1">Cor de Identificação</label>
                                <div className="flex gap-3">
                                    {['#3b82f6', '#ec6608', '#8a05be', '#10b981', '#ef4444', '#000000'].map(color => (
                                        <button 
                                            key={color}
                                            onClick={() => setNewAccount({...newAccount, color})}
                                            className={`w-10 h-10 rounded-xl border-4 transition-all ${newAccount.color === color ? 'border-pink-200 scale-110 shadow-lg' : 'border-transparent'}`}
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="p-8 bg-slate-50 border-t border-slate-100 sticky bottom-0 z-20 flex justify-end gap-3">
                            <button onClick={() => { setIsAccountModalOpen(false); setEditingAccountId(null); }} className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors">Cancelar</button>
                            <button onClick={handleAddAccount} className="px-8 py-3 bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-slate-200 hover:bg-slate-800">{editingAccountId ? 'Salvar Alterações' : 'Criar Conta'}</button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Card Modal */}
            {isCardModalOpen && (
                <Modal 
                    isOpen={isCardModalOpen} 
                    onClose={() => {
                        setIsCardModalOpen(false);
                        setEditingCardId(null);
                    }}
                    maxWidth="500px"
                    hideHeader={true}
                    noPadding={true}
                    scrollable={false}
                >
                    <div className="flex flex-col flex-1 min-h-0">
                        <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-white sticky top-0 z-20">
                            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">{editingCardId ? 'Editar Cartão' : 'Novo Cartão'}</h3>
                            <button onClick={() => { setIsCardModalOpen(false); setEditingCardId(null); }} className="p-2 text-slate-300 hover:bg-slate-50 rounded-full transition-colors"><X size={20}/></button>
                        </div>
                        <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1 min-h-0">
                            <div>
                                <label className="text-[9px] uppercase text-slate-400 font-black mb-2 block tracking-widest ml-1">Nome do Cartão</label>
                                <input 
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-bold outline-none focus:bg-white focus:border-pink-500 transition-all"
                                    placeholder="Ex: Visa Platinum Business"
                                    value={newCard.name || ''}
                                    onChange={e => setNewCard({...newCard, name: e.target.value})}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[9px] uppercase text-slate-400 font-black mb-2 block tracking-widest ml-1">Bandeira</label>
                                    <select 
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-bold outline-none focus:bg-white focus:border-pink-500 transition-all"
                                        value={newCard.brand}
                                        onChange={e => setNewCard({...newCard, brand: e.target.value})}
                                    >
                                        <option value="Visa">Visa</option>
                                        <option value="Mastercard">Mastercard</option>
                                        <option value="Amex">American Express</option>
                                        <option value="Elo">Elo</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[9px] uppercase text-slate-400 font-black mb-2 block tracking-widest ml-1">Limite Total</label>
                                    <input 
                                        type="number"
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-bold outline-none focus:bg-white focus:border-pink-500 transition-all"
                                        placeholder="0,00"
                                        value={newCard.limit || ''}
                                        onChange={e => setNewCard({...newCard, limit: parseFloat(e.target.value)})}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[9px] uppercase text-slate-400 font-black mb-2 block tracking-widest ml-1">Dia Fechamento</label>
                                    <input 
                                        type="number"
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-bold outline-none focus:bg-white focus:border-pink-500 transition-all"
                                        placeholder="25"
                                        value={newCard.closingDay || ''}
                                        onChange={e => setNewCard({...newCard, closingDay: parseInt(e.target.value)})}
                                    />
                                </div>
                                <div>
                                    <label className="text-[9px] uppercase text-slate-400 font-black mb-2 block tracking-widest ml-1">Dia Vencimento</label>
                                    <input 
                                        type="number"
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-bold outline-none focus:bg-white focus:border-pink-500 transition-all"
                                        placeholder="5"
                                        value={newCard.dueDate || ''}
                                        onChange={e => setNewCard({...newCard, dueDate: parseInt(e.target.value)})}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 sticky bottom-0 z-20">
                            <button onClick={() => { setIsCardModalOpen(false); setEditingCardId(null); }} className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors">Cancelar</button>
                            <button onClick={handleAddCard} className="px-8 py-3 bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-slate-200 hover:bg-slate-800">{editingCardId ? 'Salvar Alterações' : 'Criar Cartão'}</button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};
