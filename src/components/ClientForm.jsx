import React, { useState } from 'react';
import { Input, PrimaryBtn } from './UI';
import { copyToClipboard } from '../utils';
import { Link, Trash2 } from 'lucide-react';

export function ClientForm({ client, onSave, onClose, userRole, managerDocId, onRequestDelete }) {
    const [formData, setFormData] = useState(client || { name: '', phone: '', address: '' });

    const handleChange = (field, value) => setFormData(prev => ({...prev, [field]: value}));
    
    const handleCopyLoginLink = () => {
        if (!formData.shortId) {
            alert("У этого клиента еще нет ссылки для входа. Сохраните клиента, чтобы сгенерировать ее.");
            return;
        }
        const appUrl = `${window.location.origin}`;
        const loginLink = `${appUrl}/?c=${formData.shortId}`;
        
        copyToClipboard(loginLink);
        alert('Ссылка для входа клиента скопирована в буфер обмена!');
    };

    const handleSave = () => {
        if (!formData.name || !formData.phone) return alert("Имя и телефон клиента - обязательные поля");

        const finalData = {
            ...formData,
            managerId: userRole === 'manager' ? managerDocId : (formData.managerId || null)
        };
        
        onSave(finalData);
    };

    return (
        <div className="p-6 sm:p-8 space-y-4">
            <Input label="Имя *" value={formData.name || ''} onChange={e => handleChange('name', e.target.value)} required />
            <Input label="Телефон *" value={formData.phone || ''} onChange={e => handleChange('phone', e.target.value)} required />
            <Input label="Адрес" value={formData.address || ''} onChange={e => handleChange('address', e.target.value)} />
            
            {client && (
                 <div className="pt-4 border-t">
                    <button 
                        onClick={handleCopyLoginLink}
                        className="w-full flex items-center justify-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium px-3 py-3 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                        <Link size={16} />
                        <span>Копировать ссылку для входа</span>
                    </button>
                </div>
            )}

            <div className="pt-6 space-y-3">
                <PrimaryBtn onClick={handleSave} className="w-full py-4 uppercase font-black text-xs tracking-widest">Сохранить</PrimaryBtn>
                {formData.id && (
                    <button 
                        onClick={() => onRequestDelete(formData.id, 'client', formData.name)}
                        className="w-full flex items-center justify-center gap-2 py-2 text-red-500 text-xs font-bold hover:bg-red-50 rounded-xl transition-colors uppercase tracking-widest"
                    >
                       <Trash2 size={14}/> <span>Удалить клиента</span>
                    </button>
                )}
            </div>
        </div>
    );
}
