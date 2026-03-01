import React, { useMemo, useState } from 'react';
import { Search, Clock, Pencil, Trash2, ArrowUp, ArrowDown, ChevronsUpDown, Filter, X } from 'lucide-react';
import { Input, Select, SecondaryBtn } from './UI';

const SortableHeader = ({ children, sortKey, sortConfig, onSort }) => {
    const isCurrentKey = sortConfig.key === sortKey;
    const Icon = isCurrentKey ? (sortConfig.direction === 'asc' ? ArrowUp : ArrowDown) : ChevronsUpDown;
    
    return (
        <th onClick={() => onSort(sortKey)} className="px-6 py-3 text-left text-xs font-black text-gray-500 uppercase tracking-widest cursor-pointer hover:bg-gray-100 transition-colors">
            <div className="flex items-center gap-2">
                <span>{children}</span>
                <Icon size={14} />
            </div>
        </th>
    );
};


export function FinancesView ({ transactions, accounts, categories, managers, userRole, onEditTransaction, onRequestDelete, searchTerm, onSearchChange, selectedAccount, onAccountChange }) {
    const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false);
    
    const getCategoryName = (id) => categories.find(c => c.id === id)?.name || '';
    const getAccountName = (id) => accounts.find(a => a.id === id)?.name || '';
    const getManagerName = (id) => managers.find(m => m.id === id)?.name || id;

    const dateFilteredTransactions = useMemo(() => {
        if (!dateFrom && !dateTo) {
            return transactions;
        }

        let filtered = [...transactions];
        if (dateFrom) {
            const fromDate = new Date(dateFrom);
            fromDate.setHours(0, 0, 0, 0);
            filtered = filtered.filter(t => {
                const transactionDate = t.date?.toDate ? t.date.toDate() : new Date(t.date);
                return transactionDate >= fromDate;
            });
        }
        if (dateTo) {
            const toDate = new Date(dateTo);
            toDate.setHours(23, 59, 59, 999);
            filtered = filtered.filter(t => {
                const transactionDate = t.date?.toDate ? t.date.toDate() : new Date(t.date);
                return transactionDate <= toDate;
            });
        }

        return filtered;
    }, [transactions, dateFrom, dateTo]);

    const sortedTransactions = useMemo(() => {
        const sortableItems = [...dateFilteredTransactions];
        if (sortConfig.key) {
            sortableItems.sort((a, b) => {
                let aValue, bValue;

                switch(sortConfig.key) {
                    case 'category':
                        aValue = getCategoryName(a.categoryId);
                        bValue = getCategoryName(b.categoryId);
                        break;
                    case 'account':
                        aValue = getAccountName(a.accountId);
                        bValue = getAccountName(b.accountId);
                        break;
                     case 'createdBy':
                        aValue = getManagerName(a.createdBy);
                        bValue = getManagerName(b.createdBy);
                        break;
                    default:
                        aValue = a[sortConfig.key];
                        bValue = b[sortConfig.key];
                }
                
                if (sortConfig.key === 'date') {
                    const aDate = aValue?.toDate ? aValue.toDate() : new Date(aValue);
                    const bDate = bValue?.toDate ? bValue.toDate() : new Date(bValue);
                    return sortConfig.direction === 'asc' ? aDate - bDate : bDate - aDate;
                }
                if (typeof aValue === 'number' && typeof bValue === 'number') {
                    return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
                }
                if (typeof aValue === 'string' && typeof bValue === 'string') {
                    return sortConfig.direction === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
                }
                return 0;
            });
        }
        return sortableItems;
    }, [dateFilteredTransactions, sortConfig, categories, accounts, managers]);

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const { actualIncome, actualExpense, plannedExpense, actualBalance } = useMemo(() => {
        let actualIncome = 0;
        let actualExpense = 0;
        let plannedExpense = 0;

        dateFilteredTransactions.forEach(t => {
            if (t.status === 'planned') {
                if (t.type === 'expense') {
                    plannedExpense += t.amount;
                }
            } else { // actual
                if (t.type === 'income') {
                    actualIncome += t.amount;
                } else {
                    actualExpense += t.amount;
                }
            }
        });
        const actualBalance = actualIncome - actualExpense;
        return { actualIncome, actualExpense, plannedExpense, actualBalance };
    }, [dateFilteredTransactions]);
    
    const handleClearDates = () => {
        setDateFrom('');
        setDateTo('');
        setIsDatePopoverOpen(false);
    };
    
    const dateFilterText = useMemo(() => {
        if (dateFrom && dateTo) {
            return `${new Date(dateFrom).toLocaleDateString('ru-RU')} - ${new Date(dateTo).toLocaleDateString('ru-RU')}`;
        }
        if (dateFrom) {
            return `С ${new Date(dateFrom).toLocaleDateString('ru-RU')}`;
        }
        if (dateTo) {
            return `До ${new Date(dateTo).toLocaleDateString('ru-RU')}`;
        }
        return 'Период';
    }, [dateFrom, dateTo]);


    return (
        <div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="p-4 sm:p-6 bg-white rounded-3xl shadow-lg">
                    <div className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Доходы (факт)</div>
                    <div className="text-2xl sm:text-3xl font-black text-green-500">{actualIncome.toLocaleString()} ₽</div>
                </div>
                <div className="p-4 sm:p-6 bg-white rounded-3xl shadow-lg">
                    <div className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Расходы (факт)</div>
                    <div className="text-2xl sm:text-3xl font-black text-red-500">{actualExpense.toLocaleString()} ₽</div>
                </div>
                <div className="p-4 sm:p-6 bg-white rounded-3xl shadow-lg">
                    <div className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Баланс (факт)</div>
                    <div className="text-2xl sm:text-3xl font-black text-gray-800">{actualBalance.toLocaleString()} ₽</div>
                </div>
                 <div className="p-4 sm:p-6 bg-white rounded-3xl shadow-lg">
                    <div className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Расходы (план)</div>
                    <div className="text-2xl sm:text-3xl font-black text-blue-500">{plannedExpense.toLocaleString()} ₽</div>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <div className="flex-grow relative">
                    <Input 
                        value={searchTerm}
                        onChange={e => onSearchChange(e.target.value)} 
                        placeholder="Поиск..."
                        className="pl-10"
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
                <Select value={selectedAccount} onChange={e => onAccountChange(e.target.value)} className="sm:w-64">
                    <option value="all">Все счета</option>
                    {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </Select>
                 <div className="relative sm:w-64">
                    <button 
                        onClick={() => setIsDatePopoverOpen(!isDatePopoverOpen)} 
                        className="w-full h-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none text-sm text-left flex justify-between items-center"
                    >
                        <span className="truncate">{dateFilterText}</span>
                        <Filter size={16} className="text-gray-500 shrink-0 ml-2" />
                    </button>

                    {isDatePopoverOpen && (
                        <div 
                            className="absolute top-full mt-2 w-full sm:w-80 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 z-10 right-0 space-y-4"
                            onClick={e => e.stopPropagation()}
                        >
                             <div className="grid grid-cols-2 gap-2">
                                <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} label="Дата с" />
                                <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} label="Дата по" />
                             </div>
                             <SecondaryBtn onClick={handleClearDates} className="w-full !justify-center !text-red-500">
                                <X size={16}/>
                                <span>Очистить</span>
                             </SecondaryBtn>
                        </div>
                    )}
                </div>
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block bg-white rounded-[32px] shadow-lg overflow-x-auto">
                <table className="min-w-full">
                    <thead className="bg-gray-50">
                         <tr>
                            <SortableHeader sortKey="date" sortConfig={sortConfig} onSort={handleSort}>Дата</SortableHeader>
                            <SortableHeader sortKey="amount" sortConfig={sortConfig} onSort={handleSort}>Сумма</SortableHeader>
                            <SortableHeader sortKey="category" sortConfig={sortConfig} onSort={handleSort}>Категория</SortableHeader>
                            <SortableHeader sortKey="account" sortConfig={sortConfig} onSort={handleSort}>Счет</SortableHeader>
                            <SortableHeader sortKey="description" sortConfig={sortConfig} onSort={handleSort}>Описание</SortableHeader>
                            {userRole === 'admin' && <SortableHeader sortKey="createdBy" sortConfig={sortConfig} onSort={handleSort}>Создал</SortableHeader>}
                            <th className="px-6 py-3 text-left text-xs font-black text-gray-500 uppercase tracking-widest">Действия</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {sortedTransactions.map(t => {
                            return (
                                <tr key={t.id} className={`hover:bg-gray-50/50 transition-opacity ${t.status === 'planned' ? 'opacity-80' : ''}`}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <div className="flex items-center gap-2">
                                            {t.status === 'planned' && <Clock size={14} className="text-blue-500" />}
                                            {new Date(t.date?.toDate ? t.date.toDate() : t.date).toLocaleDateString('ru-RU')}
                                        </div>
                                    </td>
                                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                        {t.type === 'income' ? '+' : '-'} {t.amount.toLocaleString()} ₽
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{getCategoryName(t.categoryId) || <span className="text-gray-400">Без категории</span>}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{getAccountName(t.accountId) || <span className="text-gray-400">Без счета</span>}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 truncate max-w-xs">{t.description}</td>
                                    {userRole === 'admin' && <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getManagerName(t.createdBy)}</td>}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                       <div className="flex items-center gap-2">
                                            <button onClick={() => onEditTransaction(t)} className="p-1 hover:text-blue-600"><Pencil size={14}/></button>
                                            <button onClick={() => onRequestDelete(t.id, 'transaction', `Операция на ${t.amount} ₽`)} className="p-1 hover:text-red-600"><Trash2 size={14}/></button>
                                       </div>
                                   </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            {/* Mobile Cards */}
             <div className="md:hidden space-y-4">
                {sortedTransactions.map(t => {
                     return (
                        <div key={t.id} className={`bg-white rounded-2xl shadow-lg p-4 space-y-2 transition-opacity ${t.status === 'planned' ? 'opacity-80' : ''}`}>
                            <div className="flex justify-between items-start">
                                <div className={`text-xl font-bold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>{t.type === 'income' ? '+' : '-'} {t.amount.toLocaleString()} ₽</div>
                                <div className="text-xs text-gray-500 flex items-center gap-1.5">
                                    {t.status === 'planned' && <Clock size={12} className="text-blue-500" />}
                                    {new Date(t.date?.toDate ? t.date.toDate() : t.date).toLocaleDateString('ru-RU')}
                                </div>
                            </div>
                            <div className="text-sm text-gray-600 border-t pt-2 space-y-1">
                                <p className="truncate"><strong>Описание:</strong> {t.description || '-'}</p>
                                <p><strong>Категория:</strong> {getCategoryName(t.categoryId) || <span className="text-gray-400">Без категории</span>}</p>
                                <p><strong>Счет:</strong> {getAccountName(t.accountId) || <span className="text-gray-400">Без счета</span>}</p>
                                {userRole === 'admin' && <p><strong>Создал:</strong> {getManagerName(t.createdBy)}</p>}
                            </div>
                             <div className="flex justify-end items-center gap-4 pt-2 border-t">
                                <button onClick={() => onEditTransaction(t)} className="text-blue-600 font-bold text-sm">Изменить</button>
                                <button onClick={() => onRequestDelete(t.id, 'transaction', `Операция на ${t.amount} ₽`)} className="text-red-500 font-bold text-sm">Удалить</button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
