import React from 'react';
import { User, ChevronRight } from 'lucide-react';

export const ClientRow = ({ client, onSelect, manager }) => {
    return (
        <div
            onClick={() => onSelect(client)}
            className="flex items-center bg-white rounded-2xl p-4 shadow hover:shadow-lg hover:bg-gray-50 transition-all cursor-pointer mb-3"
        >
            <div className="flex-grow grid grid-cols-3 md:grid-cols-4 items-center gap-4">
                {/* Name */}
                <div className="flex items-center gap-4 col-span-1">
                     <div className="bg-blue-100 text-blue-500 rounded-full p-2">
                        <User size={20}/>
                    </div>
                    <span className="font-semibold text-gray-800 truncate">{client.name}</span>
                </div>
                {/* Phone */}
                <div className="col-span-1">
                    <span className="text-gray-600 truncate">{client.phone || '—'}</span>
                </div>
                {/* Address */}
                <div className="col-span-1">
                    <span className="text-gray-600 truncate">{client.address || '—'}</span>
                </div>
                {/* Manager */}
                <div className="col-span-1 hidden md:block">
                    <span className="text-gray-600 truncate">{manager ? manager.name : 'Не назначен'}</span>
                </div>
            </div>
             <ChevronRight size={20} className="text-gray-400" />
        </div>
    );
};
