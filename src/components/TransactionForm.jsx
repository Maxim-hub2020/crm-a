import React, { useState, useEffect, useMemo } from 'react';
import { db, appId } from '../firebase';
import { doc, updateDoc, collection, addDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { Input, Select, PrimaryBtn, Label } from './UI';

export function TransactionForm({ onClose, adminId, categories, accounts, dealId, transaction: editingTransaction, managerDocId, userRole }) {
    const [formData, setFormData] = useState({
        amount: '',
        type: 'expense',
        categoryId: '',
        accountId: '',
        description: '',
        date: new Date().toISOString().slice(0, 10),
        status: 'actual',
    });

    useEffect(() => {
        if (editingTransaction) {
            setFormData({
                amount: editingTransaction.amount || '',
                type: editingTransaction.type || 'expense',
                categoryId: editingTransaction.categoryId || '',
                accountId: editingTransaction.accountId || (accounts.length > 0 ? accounts[0].id : ''),
                description: editingTransaction.description || '',
                date: editingTransaction.date || new Date().toISOString().slice(0, 10),
                status: editingTransaction.status || 'actual',
            });
        } else {
            setFormData(prev => ({
                ...prev,
                accountId: accounts.length > 0 ? accounts[0].id : ''
            }));
        }
    }, [editingTransaction, accounts]);
    
    const handleChange = (field, value) => setFormData(prev => ({...prev, [field]: value}));

    const handleSubmit = async (e) => {
        e.preventDefault();
        const { amount, type, date, accountId } = formData;
        if (!amount || !type || !date || !adminId || !accountId) {
            alert("Пожалуйста, заполните все обязательные поля, включая счет.");
            return;
        }

        if (editingTransaction?.id) {
             const creatorId = userRole === 'manager' ? managerDocId : (userRole === 'admin' ? 'admin' : null);
             const data = { ...formData, amount: Number(formData.amount), dealId: dealId || null, createdBy: creatorId };
             const transactionRef = doc(db, 'artifacts', appId, 'users', adminId, 'transactions', editingTransaction.id);
             await updateDoc(transactionRef, data);
             if (editingTransaction.dealId) {
                 const dealTransactionRef = doc(db, 'artifacts', appId, 'users', adminId, 'deals', editingTransaction.dealId, 'transactions', editingTransaction.id);
                 await updateDoc(dealTransactionRef, data);
             }
        } else {
            const creatorId = userRole === 'manager' ? managerDocId : (userRole === 'admin' ? 'admin' : null);
            const data = { ...formData, amount: Number(formData.amount), dealId: dealId || null, createdBy: creatorId, createdAt: serverTimestamp() };
            
            const collectionPath = dealId 
                ? collection(db, 'artifacts', appId, 'users', adminId, 'deals', dealId, 'transactions')
                : collection(db, 'artifacts', appId, 'users', adminId, 'transactions');
            const newDocRef = await addDoc(collectionPath, data);
            
            if (dealId) {
                 const mainCollectionRef = collection(db, 'artifacts', appId, 'users', adminId, 'transactions');
                 await setDoc(doc(mainCollectionRef, newDocRef.id), data);
            }
        }

        onClose();
    };
    
    const filteredCategories = useMemo(() => categories.filter(c => c.type === formData.type), [categories, formData.type]);
    
    useEffect(() => {
        // When type changes, if the current category is not in the new filtered list, reset it.
        if (!filteredCategories.some(c => c.id === formData.categoryId)) {
            handleChange('categoryId', filteredCategories[0]?.id || '');
        }
    }, [formData.type, filteredCategories]);

    const today = new Date().toISOString().slice(0, 10);

    return (
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <Input label="Сумма *" type="number" value={formData.amount} onChange={e => handleChange('amount', e.target.value)} required />
                <Input label="Дата *" type="date" value={formData.date} onChange={e => handleChange('date', e.target.value)} required min={today} />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <Select label="Тип" value={formData.type} onChange={e => handleChange('type', e.target.value)}>
                    <option value="expense">Расход</option>
                    <option value="income">Доход</option>
                </Select>
                 <Select label="Статус" value={formData.status} onChange={e => handleChange('status', e.target.value)}>
                    <option value="actual">Фактический</option>
                    <option value="planned">Плановый</option>
                </Select>
            </div>
            <Select label="Категория" value={formData.categoryId} onChange={e => handleChange('categoryId', e.target.value)}>
                <option value="">Без категории</option>
                {filteredCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)} 
            </Select>
            <Select label="Счет *" value={formData.accountId} onChange={e => handleChange('accountId', e.target.value)} required>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </Select>
            <div>
                <Label>Описание</Label>
                <textarea value={formData.description} onChange={e => handleChange('description', e.target.value)} className="w-full border border-gray-200 rounded-xl p-2.5 outline-none min-h-[100px]"></textarea>
            </div>
            <PrimaryBtn type="submit" className="w-full py-4 uppercase font-black text-xs tracking-widest">{editingTransaction ? 'Обновить' : 'Сохранить'}</PrimaryBtn>
        </form>
    );
}
