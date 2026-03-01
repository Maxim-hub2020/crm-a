import React from 'react';
import { Search, User } from 'lucide-react';
import { Input } from './UI';
import { ClientRow } from './ClientRow';

export function ClientsView({ clients, setEditingClient, managers, searchTerm, onSearchChange }) {
    const getManagerForClient = (managerId) => managers.find(m => m.id === managerId);

    return (
        <div>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-grow relative">
                     <Input 
                        value={searchTerm}
                        onChange={e => onSearchChange(e.target.value)} 
                        placeholder="Поиск по имени, телефону или адресу..."
                        className="pl-10"
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
            </div>

            <div className="hidden md:grid grid-cols-4 gap-4 px-4 mb-2 text-sm font-bold text-gray-500">
                <div className="col-span-1">Имя</div>
                <div className="col-span-1">Телефон</div>
                <div className="col-span-1">Адрес</div>
                <div className="col-span-1">Ответственный</div>
            </div>

            <div>
                {clients.map(client => (
                    <ClientRow 
                        key={client.id} 
                        client={client} 
                        onSelect={setEditingClient}
                        manager={getManagerForClient(client.managerId)}
                    />
                ))}
            </div>

             {clients.length === 0 && (
                <div className="text-center text-gray-400 py-20">
                    <User size={48} className="mx-auto mb-4"/>
                    <h3 className="text-xl font-bold mb-2">Клиентов пока нет</h3>
                    <p>Нажмите "Новый клиент", чтобы добавить первого.</p>
                </div>
            )}
        </div>
    );
}
