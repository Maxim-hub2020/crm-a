import React, { useState } from 'react';
import { collection, addDoc, doc, deleteDoc } from 'firebase/firestore';
import { Input, Select, PrimaryBtn } from '../UI';
import { Trash2, Tag, Plus } from 'lucide-react';
import { SettingsCard } from './SettingsCard';
import { db, appId } from '../../firebase';

export function CategoriesManager({ adminId, categories }) {
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryType, setNewCategoryType] = useState('expense');

    const handleAddCategory = async () => {
        if (!newCategoryName.trim() || !adminId) return;
        await addDoc(collection(db, 'artifacts', appId, 'users', adminId, 'categories'), { name: newCategoryName, type: newCategoryType });
        setNewCategoryName('');
    };

    const handleDeleteCategory = async (id) => {
        await deleteDoc(doc(db, 'artifacts', appId, 'users', adminId, 'categories', id));
    };

    return (
         <SettingsCard title="Категории финансов" icon={<Tag size={16}/>}>
            <div className="space-y-2 mb-4">
                {categories.map(c => (
                    <div key={c.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <span className={`font-medium text-sm ${c.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>{c.name}</span>
                        <button onClick={() => handleDeleteCategory(c.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                    </div>
                ))}
            </div>
            <div className="flex flex-col gap-2">
                <Input value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} placeholder="Новая категория" />
                <div className="flex gap-2">
                    <Select value={newCategoryType} onChange={e => setNewCategoryType(e.target.value)}>
                        <option value="expense">Расход</option>
                        <option value="income">Доход</option>
                    </Select>
                    <PrimaryBtn onClick={handleAddCategory}><Plus size={16}/></PrimaryBtn>
                </div>
            </div>
        </SettingsCard>
    );
}
