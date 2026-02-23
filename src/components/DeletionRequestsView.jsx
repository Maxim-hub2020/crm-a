import React from 'react';

export function DeletionRequestsView({ requests, onUpdateRequest, managers }) {
    const getManagerName = (id) => managers.find(m => m.id === id)?.name || id;
    const getRequestType = (type) => {
        switch(type) {
            case 'deal': return 'Проект';
            case 'transaction': return 'Операция';
            case 'client': return 'Клиент';
            default: return 'Объект';
        }
    }
    return (
        <div className="bg-white rounded-[32px] shadow-lg overflow-hidden">
             <table className="min-w-full hidden md:table">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-black text-gray-500 uppercase tracking-widest">Дата</th>
                        <th className="px-6 py-3 text-left text-xs font-black text-gray-500 uppercase tracking-widest">Тип</th>
                        <th className="px-6 py-3 text-left text-xs font-black text-gray-500 uppercase tracking-widest">Объект</th>
                        <th className="px-6 py-3 text-left text-xs font-black text-gray-500 uppercase tracking-widest">Запросил</th>
                        <th className="px-6 py-3 text-left text-xs font-black text-gray-500 uppercase tracking-widest">Действия</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {requests.filter(r => r.status === 'pending').map(req => (
                        <tr key={req.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">{new Date(req.createdAt?.toDate()).toLocaleString('ru-RU')}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-xs font-bold">{getRequestType(req.itemType)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900">{req.itemName}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">{getManagerName(req.requestedBy)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                                <button onClick={() => onUpdateRequest(req, 'approved')} className="px-3 py-1 text-xs font-bold text-white bg-green-500 rounded-full">Да</button>
                                <button onClick={() => onUpdateRequest(req, 'denied')} className="px-3 py-1 text-xs font-bold text-white bg-red-500 rounded-full">Нет</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {requests.filter(r => r.status === 'pending').length === 0 && <p className="text-center p-10 text-gray-400">Нет запросов.</p>}
        </div>
    );
}
