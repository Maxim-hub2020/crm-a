import React, { useState } from 'react';
import { Input, PrimaryBtn } from '../UI';
import { Trash2, Users2 } from 'lucide-react';
import { SettingsCard } from './SettingsCard';

export function TeamManager({ managers, onAddManager, onDeleteManager }) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [phone, setPhone] = useState('');

    const handleAdd = (e) => {
        e.preventDefault();
        onAddManager({ name, email, password, phone });
        setName('');
        setEmail('');
        setPassword('');
        setPhone('');
    };

    return (
        <SettingsCard title="Команда" icon={<Users2 size={16} />}>
            <div className="space-y-3 mb-4">
                {managers.map(m => (
                    <div key={m.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                            <p className="font-semibold">{m.name}</p>
                            <p className="text-xs text-gray-500">{m.email}</p>
                            {m.phone && <p className="text-xs text-gray-500">{m.phone}</p>}
                        </div>
                        <button onClick={() => onDeleteManager(m)} className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button>
                    </div>
                ))}
            </div>
            <form onSubmit={handleAdd} className="space-y-3 border-t pt-4">
                <h4 className="font-bold text-sm">Добавить менеджера</h4>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Имя" required />
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" required />
                <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Телефон" />
                <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Пароль" required />
                <PrimaryBtn type="submit" className="w-full">Добавить</PrimaryBtn>
            </form>
        </SettingsCard>
    );
}
