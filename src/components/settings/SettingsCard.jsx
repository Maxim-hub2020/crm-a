import React from 'react';

export const SettingsCard = ({ title, icon, children }) => (
    <div className="glass-panel rounded-3xl border border-white/50 overflow-hidden shadow-sm mb-6">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/30 flex items-center gap-2 text-gray-900 font-semibold"><div className="text-indigo-600">{icon}</div><h3 className="truncate uppercase text-xs font-black tracking-widest">{title}</h3></div>
        <div className="p-4 sm:p-6">{children}</div>
    </div>
);
