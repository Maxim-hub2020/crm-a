import React from 'react';
import { Hash, Copy } from 'lucide-react';
import { copyToClipboard } from '../../utils';
import { SettingsCard } from './SettingsCard';

export function CompanyIdCard({ companyCode }) {
    return (
        <SettingsCard title="Код компании" icon={<Hash size={16}/>}>
            <p className="text-sm mb-4">Этот код позволяет менеджерам и клиентам входить в вашу систему.</p>
            <div className="flex items-center gap-2 p-3 bg-gray-100 rounded-xl">
                <span className="text-lg font-mono flex-1 text-center select-all">{companyCode}</span>
                <button onClick={() => copyToClipboard(companyCode)} className="p-2 bg-blue-100 text-blue-600 hover:bg-blue-200 rounded-lg">
                    <Copy size={16}/>
                </button>
            </div>
        </SettingsCard>
    );
}
