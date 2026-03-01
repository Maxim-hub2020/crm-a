import React, { useState, useMemo } from 'react';
import { Pencil, Trash2, UserCheck } from 'lucide-react';
import { PrimaryBtn, Modal } from './UI';
import { TransactionForm } from './TransactionForm';

export function DealFinances({ adminId, dealId, transactions = [], categories, accounts, managers, userRole, onRequestDelete, managerDocId }) {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState(null);

    const dealTransactions = useMemo(() => 
        transactions
            .filter(t => t.dealId === dealId)
            .sort((a, b) => {
                const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
                const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
                return dateB - dateA;
            })
    , [transactions, dealId]);

    const getManagerName = (id) => managers.find(m => m.id === id)?.name || id;

    const handleEdit = (tx) => {
        setEditingTransaction(tx);
        setIsFormOpen(true);
    }
    
    const handleCloseForm = () => {
        setIsFormOpen(false);
        setEditingTransaction(null);
    }

    return (
         <div className="p-1 h-full flex flex-col">
            <div className="flex-1 overflow-y-auto no-scrollbar pr-2 min-h-[100px]">
                {dealTransactions.length > 0 ? dealTransactions.map(t => (
                    <div key={t.id} className="p-3 rounded-lg hover:bg-gray-50 flex justify-between items-center group">
                        <div>
                            <p className={`font-bold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>{t.amount.toLocaleString()} ₽</p>
                            <p className="text-xs text-gray-500">{new Date(t.date?.toDate ? t.date.toDate() : t.date).toLocaleDateString('ru-RU')}</p>
                        </div>
                        <div className="flex-1 px-4 min-w-0">
                            <p className="text-sm text-gray-600 truncate">{t.description}</p>
                             {t.status === 'planned' && <span className="text-xs font-bold text-blue-500 bg-blue-100 px-2 py-0.5 rounded-full">Плановый</span>}
                            {userRole === 'admin' && t.createdBy && (
                                <p className="text-xs text-gray-400 flex items-center gap-1 mt-1"><UserCheck size={12}/> {getManagerName(t.createdBy)}</p>
                            )}
                        </div>
                         <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button onClick={() => handleEdit(t)} className="p-1 hover:text-blue-600"><Pencil size={14}/></button>
                             <button onClick={() => onRequestDelete(t.id, 'transaction', `Операция на ${t.amount} ₽`)} className="p-1 hover:text-red-600"><Trash2 size={14}/></button>
                        </div>
                    </div>
                )) : <p className="text-sm text-center text-gray-400 pt-10">Финансовых операций не найдено.</p>}
            </div>
            <div className="mt-4 pt-2 border-t">
                <PrimaryBtn onClick={() => handleEdit(null)} className="w-full">Добавить операцию</PrimaryBtn>
            </div>
            {isFormOpen && <Modal title={editingTransaction ? "Редактировать операцию" : "Новая операция"} onClose={handleCloseForm}><TransactionForm onClose={handleCloseForm} {...{adminId, categories, accounts, dealId, transaction: editingTransaction, managerDocId, userRole}} /></Modal>}
        </div>
    )
}
