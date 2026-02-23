import React, { useState, useEffect } from 'react';
import { db, appId } from '../firebase';
import { collection, query, where, getDocs, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Input, Label, PrimaryBtn } from './UI';
import { generatePassword } from '../utils';

export function ClientForm({ client, onClose, adminId, managerDocId, userRole, onRequestDelete }) {
    const [formData, setFormData] = useState(client || { name: '', email: '', phone: '', loginName: '', loginPassword: '' });

    useEffect(() => {
        if (!client) {
            const newPassword = generatePassword();
            setFormData(prev => ({...prev, loginPassword: newPassword}));
        }
    }, [client]);

    const handleChange = (field, value) => setFormData(prev => ({...prev, [field]: value}));
    
    const handleSave = async () => {
        if (!formData.name || !adminId) return alert("Имя клиента - обязательное поле");

        const finalData = {
            ...formData,
            loginName: formData.loginName || formData.name,
            managerId: userRole === 'manager' ? managerDocId : (formData.managerId || null)
        };

        const clientCollection = collection(db, 'artifacts', appId, 'users', adminId, 'clients');
        
        try {
            const q = query(clientCollection, where("loginName", "==", finalData.loginName));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty && querySnapshot.docs.some(doc => doc.id !== formData.id)) {
                alert("Клиент с таким именем для входа уже существует. Пожалуйста, выберите другое.");
                return;
            }

            if (formData.id) {
                const clientRef = doc(clientCollection, formData.id);
                await updateDoc(clientRef, finalData);
            } else {
                await addDoc(clientCollection, { ...finalData, createdAt: serverTimestamp() });
            }
            onClose();
        } catch (e) {
            alert("Ошибка сохранения клиента: " + e.message);
        }
    };

    return (
        <div className="p-6 sm:p-8 space-y-4">
            <Input label="Имя *" value={formData.name || ''} onChange={e => handleChange('name', e.target.value)} />
            <Input label="Email" type="email" value={formData.email || ''} onChange={e => handleChange('email', e.target.value)} />
            <Input label="Телефон" value={formData.phone || ''} onChange={e => handleChange('phone', e.target.value)} />
            
            <div className="pt-4 border-t">
                <Label>Данные для входа клиента</Label>
                <div className="p-4 bg-gray-50 rounded-xl space-y-3">
                     <Input label="Имя для входа (логин)" value={formData.loginName || ''} onChange={e => handleChange('loginName', e.target.value)} placeholder="Можно оставить пустым, будет как Имя" />
                     <Input label="Пароль" value={formData.loginPassword || ''} onChange={e => handleChange('loginPassword', e.target.value)} />
                </div>
            </div>

            <div className="pt-6 space-y-3">
                <PrimaryBtn onClick={handleSave} className="w-full py-4 uppercase font-black text-xs tracking-widest">Сохранить</PrimaryBtn>
                {formData.id && (
                    <button 
                        onClick={() => onRequestDelete(formData.id, 'client', formData.name)}
                        className="w-full py-2 text-red-500 text-xs font-bold hover:bg-red-50 rounded-xl transition-colors uppercase tracking-widest"
                    >
                        Удалить клиента
                    </button>
                )}
            </div>
        </div>
    );
}
