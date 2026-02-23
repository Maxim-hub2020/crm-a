import React, { useState } from 'react';
import { collection, addDoc, doc, deleteDoc } from 'firebase/firestore';
import { Input, PrimaryBtn } from '../UI';
import { Wallet, Trash2, Plus } from 'lucide-react';
import { SettingsCard } from './SettingsCard';
import { db, appId } from '../../firebase';

export function AccountsManager({ adminId, accounts }) {
    const [newAccountName, setNewAccountName] = useState('');

    const handleAddAccount = async () => {
        if (!newAccountName.trim() || !adminId) return;
        await addDoc(collection(db, 'artifacts', appId, 'users', adminId, 'accounts'), { name: newAccountName });
        setNewAccountName('');
    };

    const handleDeleteAccount = async (id) => {
        await deleteDoc(doc(db, 'artifacts', appId, 'users', adminId, 'accounts', id));
    };

    return (
       <SettingsCard title="Счета" icon={<Wallet size={16}/>}>
            <div className="space-y-2 mb-4">
                {accounts.map(a => (
                    <div key={a.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <span className="font-medium text-sm">{a.name}</span>
                        <button onClick={() => handleDeleteAccount(a.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                    </div>
                ))}
            </div>
            <div className="flex items-center gap-2 border-t pt-4">
                <Input value={newAccountName} onChange={e => setNewAccountName(e.target.value)} placeholder="Новый счет" />
                <PrimaryBtn onClick={handleAddAccount}><Plus size={16}/></PrimaryBtn>
            </div>
        </SettingsCard>
    );
}
