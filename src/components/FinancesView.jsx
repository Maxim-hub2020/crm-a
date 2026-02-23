import React, { useMemo } from 'react';
import { Search, Clock, Pencil, Trash2, UserCheck } from 'lucide-react';
import { Input, Select } from './UI';

export function FinancesView ({ transactions, accounts, categories, managers, userRole, onEditTransaction, onRequestDelete, searchTerm, onSearchChange, selectedAccount, onAccountChange }) {
    const getCategoryName = (id) => categories.find(c => c.id === id)?.name || <span className="text-gray-400">Без категории</span>;
    const getAccountName = (id) => accounts.find(a => a.id === id)?.name || <span className="text-gray-400">Без счета</span>;
    const getManagerName = (id) => managers.find(m => m.id === id)?.name || id;

    const { actualIncome, actualExpense, plannedExpense, actualBalance } = useMemo(() => {
        let actualIncome = 0;
        let actualExpense = 0;
        let plannedExpense = 0;

        transactions.forEach(t => {
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
    }, [transactions]);


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
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block bg-white rounded-[32px] shadow-lg overflow-x-auto">
                <table className="min-w-full">
                    <thead className="bg-gray-50">
                         <tr>
                            <th className="px-6 py-3 text-left text-xs font-black text-gray-500 uppercase tracking-widest">Дата</th>
                            <th className="px-6 py-3 text-left text-xs font-black text-gray-500 uppercase tracking-widest">Сумма</th>
                            <th className="px-6 py-3 text-left text-xs font-black text-gray-500 uppercase tracking-widest">Категория</th>
                            <th className="px-6 py-3 text-left text-xs font-black text-gray-500 uppercase tracking-widest">Счет</th>
                            <th className="px-6 py-3 text-left text-xs font-black text-gray-500 uppercase tracking-widest">Описание</th>
                            {userRole === 'admin' && <th className="px-6 py-3 text-left text-xs font-black text-gray-500 uppercase tracking-widest">Создал</th>}
                            <th className="px-6 py-3 text-left text-xs font-black text-gray-500 uppercase tracking-widest">Действия</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {transactions.map(t => (
                            <tr key={t.id} className={`hover:bg-gray-50/50 ${t.status === 'planned' ? 'opacity-60' : ''}`}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <div className="flex items-center gap-2">
                                        {t.status === 'planned' && <Clock size={14} className="text-blue-500" />}
                                        {new Date(t.date).toLocaleDateString('ru-RU')}
                                    </div>
                                </td>
                                <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                    {t.type === 'income' ? '+' : '-'} {t.amount.toLocaleString()} ₽
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{getCategoryName(t.categoryId)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{getAccountName(t.accountId)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 truncate max-w-xs">{t.description}</td>
                                {userRole === 'admin' && <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getManagerName(t.createdBy)}</td>}
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                   <div className="flex items-center gap-2">
                                     <button onClick={() => onEditTransaction(t)} className="p-1 hover:text-blue-600"><Pencil size={14}/></button>
                                     <button onClick={() => onRequestDelete(t.id, 'transaction', `Операция на ${t.amount} ₽`)} className="p-1 hover:text-red-600"><Trash2 size={14}/></button>
                                   </div>
                               </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {/* Mobile Cards */}
             <div className="md:hidden space-y-4">
                {transactions.map(t => (
                    <div key={t.id} className={`bg-white rounded-2xl shadow-lg p-4 space-y-2 ${t.status === 'planned' ? 'opacity-70' : ''}`}>
                        <div className="flex justify-between items-start">
                             <div className={`text-xl font-bold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>{t.type === 'income' ? '+' : '-'} {t.amount.toLocaleString()} ₽</div>
                             <div className="text-xs text-gray-500 flex items-center gap-1.5">
                                {t.status === 'planned' && <Clock size={12} className="text-blue-500" />}
                                {new Date(t.date).toLocaleDateString('ru-RU')}
                            </div>
                        </div>
                        <div className="text-sm text-gray-600 border-t pt-2 space-y-1">
                             <p className="truncate"><strong>Описание:</strong> {t.description || '-'}</p>
                             <p><strong>Категория:</strong> {getCategoryName(t.categoryId)}</p>
                             <p><strong>Счет:</strong> {getAccountName(t.accountId)}</p>
                              {userRole === 'admin' && <p><strong>Создал:</strong> {getManagerName(t.createdBy)}</p>}
                        </div>
                        <div className="flex justify-end gap-4 pt-2 border-t">
                            <button onClick={() => onEditTransaction(t)} className="text-blue-600 font-bold text-sm">Изменить</button>
                            <button onClick={() => onRequestDelete(t.id, 'transaction', `Операция на ${t.amount} ₽`)} className="text-red-500 font-bold text-sm">Удалить</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
