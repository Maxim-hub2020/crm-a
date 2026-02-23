import React from 'react';
import { Search, Plus, User } from 'lucide-react';
import { Input } from './UI';

const ClientCard = ({ client, onSelect, userRole, manager }) => {
    return (
        <div 
            onClick={() => onSelect(client)} 
            className="bg-white rounded-3xl p-5 sm:p-6 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all cursor-pointer">
            <div className="flex items-center gap-5">
                <div className="bg-blue-100 text-blue-500 rounded-2xl p-4">
                    <User size={28}/>
                </div>
                <div>
                    <h3 className="font-bold text-lg sm:text-xl text-gray-800 truncate">{client.name}</h3>
                    <p className="text-sm text-gray-400 truncate">{client.email || 'Email не указан'}</p>
                </div>
            </div>
            {userRole === 'admin' && manager && (
                <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500">
                    Ответственный: <span className="font-semibold text-gray-600">{manager.name}</span>
                </div>
            )}
        </div>
    );
};

export function ClientsView({ clients, setEditingClient, managers, userRole, searchTerm, onSearchChange }) {
    const getManagerForClient = (managerId) => managers.find(m => m.id === managerId);

    return (
        <div>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-grow relative">
                     <Input 
                        value={searchTerm}
                        onChange={e => onSearchChange(e.target.value)} 
                        placeholder="Поиск по имени, email или телефону..."
                        className="pl-10"
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {clients.map(client => (
                    <ClientCard 
                        key={client.id} 
                        client={client} 
                        onSelect={setEditingClient}
                        userRole={userRole}
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
