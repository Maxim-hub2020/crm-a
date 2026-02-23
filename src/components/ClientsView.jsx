import React from 'react';
import { Search } from 'lucide-react';
import { Input } from './UI';

export function ClientsView({ clients, setEditingClient, managers, userRole, searchTerm, onSearchChange }) {
     const getManagerName = (id) => managers.find(m => m.id === id)?.name || 'Не назначен';
     return (
        <div>
            <div className="mb-4 relative max-w-sm">
                 <Input 
                    value={searchTerm}
                    onChange={e => onSearchChange(e.target.value)} 
                    placeholder="Поиск..."
                    className="pl-10"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
            {/* Desktop Table */}
            <div className="hidden md:block bg-white rounded-[32px] shadow-lg overflow-hidden">
                <table className="min-w-full">
                    <thead className="bg-gray-50">
                         <tr>
                            <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-widest">Имя</th>
                            <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-widest">Контакты</th>
                            {userRole === 'admin' && <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-widest">Менеджер</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {clients.map(client => (
                            <tr 
                                key={client.id} 
                                onClick={() => setEditingClient(client)}
                                className="hover:bg-blue-50/30 cursor-pointer transition-colors"
                            >
                                <td className="px-6 py-4 whitespace-nowrap"><div className="font-bold text-sm text-gray-900">{client.name}</div></td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <div className="truncate">{client.email}</div>
                                    <div className="font-medium text-xs opacity-70">{client.phone}</div>
                                </td>
                                {userRole === 'admin' && <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getManagerName(client.managerId)}</td>}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
                 {clients.map(client => (
                    <div 
                        key={client.id} 
                        onClick={() => setEditingClient(client)}
                        className="bg-white rounded-3xl shadow-sm p-5 space-y-3 border border-transparent active:border-blue-200"
                    >
                         <div className="font-bold text-lg text-gray-900">{client.name}</div>
                         <div className="text-sm text-gray-600 space-y-1">
                            <p className="truncate opacity-70">{client.email || 'Нет email'}</p>
                            <p className="font-medium">{client.phone || 'Нет телефона'}</p>
                         </div>
                        {userRole === 'admin' && (
                             <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pt-2 border-t">Менеджер: {getManagerName(client.managerId)}</div>
                        )}
                    </div>
                 ))}
            </div>
        </div>
    );
}
