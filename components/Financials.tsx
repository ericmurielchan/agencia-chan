
import React, { useState, useMemo } from 'react';
import { FinancialRecord, Asset, StockItem, Requisition, User, Notification } from '../types';
import { initialStock, initialRequisitions } from '../utils/mockData';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar, Legend } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Wallet, ArrowUpRight, ArrowDownLeft, Package, Plus, Check, X, Trash2, ShoppingCart, FileText, AlertTriangle, Search, Filter, Clock, CheckCircle, Edit2, Calendar, Archive, Layout, RotateCcw, History } from 'lucide-react';

interface FinancialsProps {
  transactions: FinancialRecord[];
  setTransactions?: React.Dispatch<React.SetStateAction<FinancialRecord[]>>;
  assets: Asset[];
  setAssets?: React.Dispatch<React.SetStateAction<Asset[]>>;
  currentUser: User;
  users: User[];
  setNotifications?: React.Dispatch<React.SetStateAction<Notification[]>>;
}

type TabType = 'DASHBOARD' | 'TRANSACTIONS' | 'PAYABLES' | 'RECEIVABLES' | 'STOCK' | 'ASSETS';

export const Financials: React.FC<FinancialsProps> = ({ 
    transactions: propTransactions, 
    setTransactions: propSetTransactions,
    assets: propAssets,
    setAssets: propSetAssets,
    currentUser,
    users,
    setNotifications
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('DASHBOARD');
  
  // Filtros de Data
  const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  // Gestão de estado local/prop
  const [localTransactions, setLocalTransactions] = useState(propTransactions);
  const [localAssets, setLocalAssets] = useState(propAssets);
  
  const transactions = propSetTransactions ? propTransactions : localTransactions;
  const setTransactions = propSetTransactions || setLocalTransactions;
  const assets = propSetAssets ? propAssets : localAssets;
  const setAssets = propSetAssets || setLocalAssets;

  const [stock, setStock] = useState<StockItem[]>(initialStock);
  
  // Modo de visualização do Estoque (Ativo vs Histórico)
  const [showStockHistory, setShowStockHistory] = useState(false);

  // Busca
  const [searchTerm, setSearchTerm] = useState('');

  // Modais
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Partial<FinancialRecord>>({});
  const [isInstallment, setIsInstallment] = useState(false);
  const [installmentCount, setInstallmentCount] = useState(2);

  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [editingStock, setEditingStock] = useState<Partial<StockItem>>({});

  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Partial<Asset>>({});

  // --- Lógica de Filtro ---
  const filteredTransactions = useMemo(() => {
      return transactions.filter(t => {
          const tDate = new Date(t.dueDate);
          const sDate = new Date(startDate);
          const eDate = new Date(endDate);
          eDate.setHours(23, 59, 59);
          
          return tDate >= sDate && tDate <= eDate;
      }).sort((a,b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [transactions, startDate, endDate]);

  // --- Lógica Financeira ---
  const handleSaveTransaction = () => {
      if (!editingTx.description || !editingTx.amount || !editingTx.dueDate) return;

      const baseTx = {
          ...editingTx,
          status: editingTx.status || 'PENDING',
          category: editingTx.category || 'Outros',
          entity: editingTx.entity || 'Diversos',
          type: editingTx.type || 'EXPENSE'
      } as FinancialRecord;

      let newRecords: FinancialRecord[] = [];

      if (isInstallment && !editingTx.id) { 
          const groupId = Date.now().toString();
          const baseDate = new Date(baseTx.dueDate);

          for (let i = 0; i < installmentCount; i++) {
              const date = new Date(baseDate);
              date.setMonth(date.getMonth() + i);
              
              newRecords.push({
                  ...baseTx,
                  id: `${groupId}-${i}`,
                  description: `${baseTx.description} (${i+1}/${installmentCount})`,
                  dueDate: date.toISOString().split('T')[0],
                  installment: {
                      current: i + 1,
                      total: installmentCount,
                      groupId
                  }
              });
          }
      } else {
          newRecords.push({
              ...baseTx,
              id: editingTx.id || Date.now().toString()
          });
      }

      if (editingTx.id) {
          setTransactions(prev => prev.map(t => t.id === editingTx.id ? newRecords[0] : t));
      } else {
          setTransactions(prev => [...newRecords, ...prev]);
      }

      setIsTxModalOpen(false);
      setEditingTx({});
      setIsInstallment(false);
  };

  const deleteTransaction = (id: string) => {
      if (confirm("Tem certeza que deseja excluir permanentemente este lançamento?")) {
          setTransactions(prev => prev.filter(t => t.id !== id));
      }
  };

  const updateStatus = (id: string, status: 'PAID' | 'PENDING' | 'CANCELLED') => {
      setTransactions(prev => prev.map(t => t.id === id ? { 
          ...t, 
          status,
          paymentDate: status === 'PAID' ? new Date().toISOString().split('T')[0] : undefined
      } : t));
  };

  // --- Lógica de Estoque ---
  const handleSaveStock = () => {
      if(!editingStock.name) return;
      if(editingStock.id) {
          setStock(prev => prev.map(s => s.id === editingStock.id ? { ...s, ...editingStock } as StockItem : s));
      } else {
          setStock(prev => [...prev, { ...editingStock, id: Date.now().toString(), lastRestock: new Date().toISOString().split('T')[0] } as StockItem]);
      }
      setIsStockModalOpen(false);
  };

  const deleteStock = (id: string) => {
      const reason = prompt("Informe o motivo da exclusão para o histórico (Ex: Danificado, Obsoleto, Erro):");
      if (reason) {
          setStock(prev => prev.map(s => s.id === id ? { 
              ...s, 
              deletedAt: new Date().toISOString(),
              deletionReason: reason,
              deletedBy: currentUser.name
          } : s));
      }
  };

  const adjustStock = (id: string, delta: number) => {
      setStock(prev => prev.map(s => s.id === id ? { ...s, quantity: Math.max(0, (s.quantity || 0) + delta) } : s));
  };

  // --- Lógica de Ativos ---
  const handleSaveAsset = () => {
      if(!editingAsset.name) return;
      if(editingAsset.id) {
          setAssets(prev => prev.map(a => a.id === editingAsset.id ? { ...a, ...editingAsset } as Asset : a));
      } else {
          setAssets(prev => [...prev, { ...editingAsset, id: Date.now().toString() } as Asset]);
      }
      setIsAssetModalOpen(false);
  };

  const deleteAsset = (id: string) => {
      if (confirm("Excluir ativo?")) setAssets(prev => prev.filter(a => a.id !== id));
  };

  // --- Métricas e Gráficos ---
  const income = filteredTransactions.filter(t => t.type === 'INCOME' && t.status === 'PAID').reduce((acc, t) => acc + t.amount, 0);
  const expense = filteredTransactions.filter(t => t.type === 'EXPENSE' && t.status === 'PAID').reduce((acc, t) => acc + t.amount, 0);
  const balance = income - expense;
  
  const pendingIncome = filteredTransactions.filter(t => t.type === 'INCOME' && t.status === 'PENDING').reduce((acc, t) => acc + t.amount, 0);
  const pendingExpense = filteredTransactions.filter(t => t.type === 'EXPENSE' && (t.status === 'PENDING' || t.status === 'OVERDUE')).reduce((acc, t) => acc + t.amount, 0);

  // Dados para Gráfico Comparativo
  const chartData = useMemo(() => {
      const grouped: Record<string, { date: string, income: number, expense: number }> = {};
      
      filteredTransactions.forEach(t => {
           const key = t.dueDate.substring(5); // MM-DD
           if (!grouped[key]) grouped[key] = { date: key, income: 0, expense: 0 };
           
           if (t.type === 'INCOME') grouped[key].income += t.amount;
           else grouped[key].expense += t.amount;
      });

      return Object.values(grouped).sort((a,b) => a.date.localeCompare(b.date));
  }, [filteredTransactions]);

  // --- Renderers ---

  const renderDashboard = () => (
      <div className="space-y-6 animate-pop">
          {/* Filtro de Data */}
          <div className="flex flex-col md:flex-row gap-4 items-end bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Data Início</label>
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="border border-slate-300 rounded-lg p-2 text-sm text-slate-700 outline-none focus:border-blue-500"/>
              </div>
              <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Data Fim</label>
                  <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="border border-slate-300 rounded-lg p-2 text-sm text-slate-700 outline-none focus:border-blue-500"/>
              </div>
              <div className="flex-1 text-right">
                  <p className="text-xs text-slate-400">Analisando dados do período</p>
              </div>
          </div>

          {/* Cards KPI */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Saldo (Período)</p>
                  <div className="flex items-end justify-between mt-1">
                      <h3 className={`text-2xl font-bold ${balance >= 0 ? 'text-slate-800' : 'text-red-600'}`}>R$ {balance.toLocaleString()}</h3>
                      <div className={`p-2 rounded-full ${balance >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                          <Wallet size={20}/>
                      </div>
                  </div>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Receitas (Realizado)</p>
                  <div className="flex items-end justify-between mt-1">
                      <h3 className="text-2xl font-bold text-emerald-600">R$ {income.toLocaleString()}</h3>
                      <div className="p-2 rounded-full bg-emerald-50 text-emerald-600"><ArrowDownLeft size={20}/></div>
                  </div>
                  <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1"><Plus size={10}/> R$ {pendingIncome.toLocaleString()} previsto</p>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Despesas (Realizado)</p>
                  <div className="flex items-end justify-between mt-1">
                      <h3 className="text-2xl font-bold text-red-600">R$ {expense.toLocaleString()}</h3>
                      <div className="p-2 rounded-full bg-red-50 text-red-600"><ArrowUpRight size={20}/></div>
                  </div>
                  <p className="text-xs text-red-600 mt-2 flex items-center gap-1"><Clock size={10} /> R$ {pendingExpense.toLocaleString()} a pagar</p>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Estoque Ativo</p>
                  <div className="flex items-end justify-between mt-1">
                      <h3 className="text-2xl font-bold text-blue-600">{stock.filter(s => !s.deletedAt).length} Itens</h3>
                      <div className="p-2 rounded-full bg-blue-50 text-blue-600"><Package size={20}/></div>
                  </div>
                  <p className="text-xs text-orange-500 mt-2 flex items-center gap-1">
                      <AlertTriangle size={10}/> {stock.filter(s => !s.deletedAt && s.quantity <= s.minQuantity).length} itens baixos
                  </p>
              </div>
          </div>

          {/* Gráfico Comparativo */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-700 mb-6 flex items-center gap-2"><TrendingUp size={18}/> Comparativo Receita vs Despesa</h3>
              <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                          <XAxis dataKey="date" axisLine={false} tickLine={false} fontSize={12} stroke="#64748b" />
                          <YAxis axisLine={false} tickLine={false} fontSize={12} stroke="#64748b" />
                          <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}/>
                          <Legend />
                          <Bar name="Receitas" dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                          <Bar name="Despesas" dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20} />
                      </BarChart>
                  </ResponsiveContainer>
              </div>
          </div>
      </div>
  );

  const renderTransactions = (filter?: 'PENDING_PAY' | 'PENDING_REC') => {
      let filtered = filteredTransactions; 
      if (filter === 'PENDING_PAY') filtered = filtered.filter(t => t.type === 'EXPENSE' && (t.status === 'PENDING' || t.status === 'OVERDUE'));
      if (filter === 'PENDING_REC') filtered = filtered.filter(t => t.type === 'INCOME' && (t.status === 'PENDING' || t.status === 'OVERDUE'));
      if (searchTerm) filtered = filtered.filter(t => t.description.toLowerCase().includes(searchTerm.toLowerCase()));

      return (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-pop">
              <div className="flex justify-between p-6 border-b border-slate-100 bg-slate-50/50">
                  <div className="flex items-center gap-4">
                      <h3 className="font-bold text-lg text-slate-800">Lançamentos</h3>
                      <div className="relative">
                          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                          <input 
                            className="pl-9 pr-4 py-1.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-blue-400" 
                            placeholder="Buscar..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                          />
                      </div>
                  </div>
                  <div className="flex items-center gap-2">
                     <div className="text-xs text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-1">
                         <Calendar size={14}/> {new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}
                     </div>
                     <button onClick={() => { setEditingTx({}); setIsInstallment(false); setIsTxModalOpen(true); }} className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-slate-900 transition-colors">
                        <Plus size={16}/> Lançamento
                     </button>
                  </div>
              </div>
              <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                      <tr>
                          <th className="p-4">Descrição</th>
                          <th className="p-4">Vencimento</th>
                          <th className="p-4">Categoria/Entidade</th>
                          <th className="p-4">Status</th>
                          <th className="p-4 text-right">Valor</th>
                          <th className="p-4 text-center">Ações</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                      {filtered.map(t => (
                          <tr key={t.id} className="hover:bg-slate-50 transition-colors group">
                              <td className="p-4">
                                  <p className="font-medium text-slate-700">{t.description}</p>
                                  {t.installment && <span className="text-[10px] text-blue-600 bg-blue-50 px-1 rounded">Parcela {t.installment.current}/{t.installment.total}</span>}
                              </td>
                              <td className="p-4 text-slate-500">{t.dueDate.split('-').reverse().join('/')}</td>
                              <td className="p-4 text-slate-500">
                                  <p>{t.category}</p>
                                  <p className="text-xs">{t.entity}</p>
                              </td>
                              <td className="p-4">
                                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                                      t.status === 'PAID' ? 'bg-emerald-50 text-emerald-700' :
                                      t.status === 'OVERDUE' ? 'bg-red-50 text-red-700' : 
                                      t.status === 'CANCELLED' ? 'bg-slate-100 text-slate-500' : 'bg-yellow-50 text-yellow-700'
                                  }`}>
                                      {t.status === 'PAID' ? 'Pago' : t.status === 'PENDING' ? 'Pendente' : t.status === 'OVERDUE' ? 'Vencido' : 'Cancelado'}
                                  </span>
                              </td>
                              <td className={`p-4 text-right font-bold ${t.type === 'INCOME' ? 'text-emerald-600' : 'text-red-600'}`}>
                                  {t.type === 'EXPENSE' ? '-' : '+'} R$ {t.amount.toLocaleString()}
                              </td>
                              <td className="p-4 text-center flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  {t.status !== 'CANCELLED' ? (
                                    <>
                                        {t.status !== 'PAID' ? (
                                            <button onClick={() => updateStatus(t.id, 'PAID')} title="Marcar Pago" className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded"><Check size={16}/></button>
                                        ) : (
                                            <button onClick={() => updateStatus(t.id, 'PENDING')} title="Marcar Pendente" className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded"><Clock size={16}/></button>
                                        )}
                                        <button onClick={() => { setEditingTx(t); setIsTxModalOpen(true); }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Edit2 size={16}/></button>
                                        <button onClick={() => updateStatus(t.id, 'CANCELLED')} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded" title="Cancelar"><Archive size={16}/></button>
                                    </>
                                  ) : (
                                      <button onClick={() => updateStatus(t.id, 'PENDING')} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded flex items-center gap-1 text-xs" title="Desfazer Cancelamento">
                                          <RotateCcw size={16}/> Reverter
                                      </button>
                                  )}
                                  <button onClick={() => deleteTransaction(t.id)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 size={16}/></button>
                              </td>
                          </tr>
                      ))}
                      {filtered.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-slate-400">Nenhum registro encontrado no período.</td></tr>}
                  </tbody>
              </table>
          </div>
      );
  };

  const renderStock = () => {
      const displayStock = stock.filter(s => showStockHistory ? !!s.deletedAt : !s.deletedAt);

      return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-pop">
           <div className="flex justify-between p-6 border-b border-slate-100 bg-slate-50/50">
                  <div className="flex items-center gap-4">
                      <h3 className="font-bold text-lg text-slate-800">{showStockHistory ? 'Histórico de Exclusões' : 'Inventário e Estoque'}</h3>
                      <button 
                        onClick={() => setShowStockHistory(!showStockHistory)}
                        className={`text-xs px-3 py-1.5 rounded-lg flex items-center gap-2 border transition-colors ${showStockHistory ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 border-slate-300'}`}
                      >
                          <History size={14}/> {showStockHistory ? 'Ver Estoque Ativo' : 'Ver Histórico'}
                      </button>
                  </div>
                  {!showStockHistory && (
                    <button onClick={() => { setEditingStock({}); setIsStockModalOpen(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-blue-700 transition-colors">
                        <Plus size={16}/> Novo Item
                    </button>
                  )}
            </div>
            <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                      <tr>
                          <th className="p-4">Item</th>
                          <th className="p-4">Categoria</th>
                          <th className="p-4">Qtd. {showStockHistory ? 'Excluída' : 'Atual'}</th>
                          {showStockHistory ? (
                              <>
                                <th className="p-4">Motivo</th>
                                <th className="p-4">Data Exclusão</th>
                                <th className="p-4">Quem Excluiu</th>
                              </>
                          ) : (
                              <>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-right">Valor Unit.</th>
                                <th className="p-4 text-center">Ações</th>
                              </>
                          )}
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                      {displayStock.map(s => (
                          <tr key={s.id} className="hover:bg-slate-50 transition-colors group">
                              <td className="p-4 font-medium text-slate-700">{s.name}</td>
                              <td className="p-4"><span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600">{s.category}</span></td>
                              <td className="p-4">
                                  {!showStockHistory ? (
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => adjustStock(s.id, -1)} className="w-5 h-5 flex items-center justify-center bg-slate-200 rounded hover:bg-slate-300">-</button>
                                        <span className="font-bold w-6 text-center">{s.quantity}</span>
                                        <button onClick={() => adjustStock(s.id, 1)} className="w-5 h-5 flex items-center justify-center bg-slate-200 rounded hover:bg-slate-300">+</button>
                                    </div>
                                  ) : (
                                    <span className="text-slate-500">{s.quantity}</span>
                                  )}
                              </td>
                              
                              {showStockHistory ? (
                                  <>
                                    <td className="p-4"><span className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded font-bold">{s.deletionReason}</span></td>
                                    <td className="p-4 text-slate-500">{s.deletedAt ? new Date(s.deletedAt).toLocaleDateString() : '-'}</td>
                                    <td className="p-4 text-slate-500">{s.deletedBy || '-'}</td>
                                  </>
                              ) : (
                                  <>
                                    <td className="p-4">
                                        {s.quantity <= s.minQuantity ? 
                                            <span className="text-xs text-red-600 font-bold bg-red-50 px-2 py-1 rounded flex w-fit items-center gap-1"><AlertTriangle size={12}/> Repor</span> : 
                                            <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded flex w-fit items-center gap-1"><CheckCircle size={12}/> OK</span>
                                        }
                                    </td>
                                    <td className="p-4 text-right">R$ {s.unitPrice.toFixed(2)}</td>
                                    <td className="p-4 text-center flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => { setEditingStock(s); setIsStockModalOpen(true); }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Edit2 size={16}/></button>
                                        <button onClick={() => deleteStock(s.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16}/></button>
                                    </td>
                                  </>
                              )}
                          </tr>
                      ))}
                      {displayStock.length === 0 && (
                          <tr><td colSpan={showStockHistory ? 6 : 6} className="p-8 text-center text-slate-400">
                              {showStockHistory ? 'Nenhum item excluído no histórico.' : 'Estoque vazio.'}
                          </td></tr>
                      )}
                  </tbody>
            </table>
      </div>
      );
  };

  const renderAssets = () => (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-pop">
           <div className="flex justify-between p-6 border-b border-slate-100 bg-slate-50/50">
                  <h3 className="font-bold text-lg text-slate-800">Ativos Imobilizados</h3>
                  <button onClick={() => { setEditingAsset({}); setIsAssetModalOpen(true); }} className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-purple-700 transition-colors">
                      <Plus size={16}/> Novo Ativo
                  </button>
            </div>
            <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                      <tr>
                          <th className="p-4">Nome</th>
                          <th className="p-4">Tipo</th>
                          <th className="p-4">Data Compra</th>
                          <th className="p-4 text-right">Custo</th>
                          <th className="p-4 text-center">Ações</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                      {assets.map(a => (
                          <tr key={a.id} className="hover:bg-slate-50 transition-colors group">
                              <td className="p-4 font-medium text-slate-700">{a.name}</td>
                              <td className="p-4"><span className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded">{a.type}</span></td>
                              <td className="p-4 text-slate-500">{a.purchaseDate.split('-').reverse().join('/')}</td>
                              <td className="p-4 text-right font-bold text-slate-700">R$ {a.cost.toLocaleString()}</td>
                              <td className="p-4 text-center flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={() => { setEditingAsset(a); setIsAssetModalOpen(true); }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Edit2 size={16}/></button>
                                  <button onClick={() => deleteAsset(a.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16}/></button>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
      </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-1">
          <button onClick={() => setActiveTab('DASHBOARD')} className={`flex-1 px-3 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'DASHBOARD' ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:bg-slate-50'}`}>
              <TrendingUp size={16}/> Visão Geral
          </button>
          <button onClick={() => setActiveTab('TRANSACTIONS')} className={`flex-1 px-3 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'TRANSACTIONS' ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:bg-slate-50'}`}>
              <FileText size={16}/> Extrato
          </button>
          <button onClick={() => setActiveTab('PAYABLES')} className={`flex-1 px-3 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'PAYABLES' ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:bg-slate-50'}`}>
              <ArrowUpRight size={16}/> A Pagar
          </button>
          <button onClick={() => setActiveTab('RECEIVABLES')} className={`flex-1 px-3 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'RECEIVABLES' ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:bg-slate-50'}`}>
              <ArrowDownLeft size={16}/> A Receber
          </button>
          <button onClick={() => setActiveTab('STOCK')} className={`flex-1 px-3 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'STOCK' ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:bg-slate-50'}`}>
              <Package size={16}/> Estoque
          </button>
          <button onClick={() => setActiveTab('ASSETS')} className={`flex-1 px-3 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'ASSETS' ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:bg-slate-50'}`}>
              <Wallet size={16}/> Ativos
          </button>
      </div>

      <div className="min-h-[500px]">
          {activeTab === 'DASHBOARD' && renderDashboard()}
          {activeTab === 'TRANSACTIONS' && renderTransactions()}
          {activeTab === 'PAYABLES' && renderTransactions('PENDING_PAY')}
          {activeTab === 'RECEIVABLES' && renderTransactions('PENDING_REC')}
          {activeTab === 'STOCK' && renderStock()}
          {activeTab === 'ASSETS' && renderAssets()}
      </div>

      {isTxModalOpen && (
          <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center backdrop-blur-sm" onClick={() => setIsTxModalOpen(false)}>
              <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-2xl animate-pop" onClick={e => e.stopPropagation()}>
                  <h3 className="text-xl font-bold mb-4">{editingTx.id ? 'Editar Lançamento' : 'Novo Lançamento'}</h3>
                  <div className="space-y-4">
                      <div className="flex gap-2 mb-2">
                           <button onClick={() => setEditingTx({...editingTx, type: 'INCOME'})} className={`flex-1 py-2 rounded text-sm font-bold border ${editingTx.type === 'INCOME' ? 'bg-emerald-50 border-emerald-500 text-emerald-600' : 'border-slate-200 text-slate-500'}`}>Receita</button>
                           <button onClick={() => setEditingTx({...editingTx, type: 'EXPENSE'})} className={`flex-1 py-2 rounded text-sm font-bold border ${editingTx.type === 'EXPENSE' ? 'bg-red-50 border-red-500 text-red-600' : 'border-slate-200 text-slate-500'}`}>Despesa</button>
                      </div>
                      <input className="w-full border p-2 rounded text-sm" placeholder="Descrição" value={editingTx.description || ''} onChange={e => setEditingTx({...editingTx, description: e.target.value})} />
                      <div className="grid grid-cols-2 gap-3">
                          <input type="number" className="w-full border p-2 rounded text-sm" placeholder="Valor (R$)" value={editingTx.amount || ''} onChange={e => setEditingTx({...editingTx, amount: parseFloat(e.target.value)})} />
                          <input type="date" className="w-full border p-2 rounded text-sm" value={editingTx.dueDate || ''} onChange={e => setEditingTx({...editingTx, dueDate: e.target.value})} />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                          <input className="w-full border p-2 rounded text-sm" placeholder="Categoria" value={editingTx.category || ''} onChange={e => setEditingTx({...editingTx, category: e.target.value})} />
                          <input className="w-full border p-2 rounded text-sm" placeholder="Entidade/Cliente" value={editingTx.entity || ''} onChange={e => setEditingTx({...editingTx, entity: e.target.value})} />
                      </div>
                      
                      {!editingTx.id && (
                          <div className="bg-slate-50 p-3 rounded border border-slate-100">
                              <div className="flex items-center gap-2 mb-2">
                                  <input type="checkbox" checked={isInstallment} onChange={e => setIsInstallment(e.target.checked)} id="installCheck" />
                                  <label htmlFor="installCheck" className="text-sm text-slate-700">Lançamento Parcelado (Recorrente)</label>
                              </div>
                              {isInstallment && (
                                  <div className="flex items-center gap-2">
                                      <span className="text-xs text-slate-500">Repetir por:</span>
                                      <input type="number" className="w-16 border p-1 rounded text-sm" value={installmentCount} onChange={e => setInstallmentCount(parseInt(e.target.value))} min={2} />
                                      <span className="text-xs text-slate-500">meses</span>
                                  </div>
                              )}
                          </div>
                      )}

                      <button onClick={handleSaveTransaction} className="w-full bg-slate-800 text-white py-2 rounded font-bold hover:bg-slate-900">Salvar</button>
                  </div>
              </div>
          </div>
      )}

      {isStockModalOpen && (
          <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center backdrop-blur-sm" onClick={() => setIsStockModalOpen(false)}>
              <div className="bg-white rounded-xl w-full max-w-sm p-6 shadow-2xl animate-pop" onClick={e => e.stopPropagation()}>
                  <h3 className="text-xl font-bold mb-4">{editingStock.id ? 'Editar Item' : 'Novo Item'}</h3>
                  <div className="space-y-3">
                      <input className="w-full border p-2 rounded text-sm" placeholder="Nome do Item" value={editingStock.name || ''} onChange={e => setEditingStock({...editingStock, name: e.target.value})} />
                      <select className="w-full border p-2 rounded text-sm" value={editingStock.category} onChange={e => setEditingStock({...editingStock, category: e.target.value as any})}>
                          <option value="OFFICE">Escritório</option>
                          <option value="IT">TI / Hardware</option>
                          <option value="CLEANING">Limpeza</option>
                          <option value="MARKETING">Marketing / Brindes</option>
                      </select>
                      <div className="grid grid-cols-2 gap-3">
                          <div><label className="text-xs text-slate-500">Qtd Atual</label><input type="number" className="w-full border p-2 rounded text-sm" value={editingStock.quantity || ''} onChange={e => setEditingStock({...editingStock, quantity: parseInt(e.target.value)})} /></div>
                          <div><label className="text-xs text-slate-500">Qtd Mínima</label><input type="number" className="w-full border p-2 rounded text-sm" value={editingStock.minQuantity || ''} onChange={e => setEditingStock({...editingStock, minQuantity: parseInt(e.target.value)})} /></div>
                      </div>
                      <div><label className="text-xs text-slate-500">Valor Unitário</label><input type="number" className="w-full border p-2 rounded text-sm" value={editingStock.unitPrice || ''} onChange={e => setEditingStock({...editingStock, unitPrice: parseFloat(e.target.value)})} /></div>
                      <button onClick={handleSaveStock} className="w-full bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700">Salvar Item</button>
                  </div>
              </div>
          </div>
      )}

      {isAssetModalOpen && (
          <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center backdrop-blur-sm" onClick={() => setIsAssetModalOpen(false)}>
              <div className="bg-white rounded-xl w-full max-w-sm p-6 shadow-2xl animate-pop" onClick={e => e.stopPropagation()}>
                  <h3 className="text-xl font-bold mb-4">{editingAsset.id ? 'Editar Ativo' : 'Novo Ativo'}</h3>
                  <div className="space-y-3">
                      <input className="w-full border p-2 rounded text-sm" placeholder="Nome do Ativo" value={editingAsset.name || ''} onChange={e => setEditingAsset({...editingAsset, name: e.target.value})} />
                      <select className="w-full border p-2 rounded text-sm" value={editingAsset.type} onChange={e => setEditingAsset({...editingAsset, type: e.target.value as any})}>
                          <option value="HARDWARE">Hardware</option>
                          <option value="SOFTWARE">Software (Licença)</option>
                          <option value="OFFICE">Mobiliário</option>
                      </select>
                      <input type="date" className="w-full border p-2 rounded text-sm" value={editingAsset.purchaseDate || ''} onChange={e => setEditingAsset({...editingAsset, purchaseDate: e.target.value})} />
                      <input type="number" className="w-full border p-2 rounded text-sm" placeholder="Custo de Aquisição" value={editingAsset.cost || ''} onChange={e => setEditingAsset({...editingAsset, cost: parseFloat(e.target.value)})} />
                      <button onClick={handleSaveAsset} className="w-full bg-purple-600 text-white py-2 rounded font-bold hover:bg-purple-700">Salvar Ativo</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
