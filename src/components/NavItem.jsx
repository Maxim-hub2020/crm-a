import React from 'react';
import * as Lucide from 'lucide-react';

export const NavItem = ({ icon, label, active, onClick, badge, isSidebarOpen }) => (
    <button onClick={onClick} className={`w-full flex items-center p-3 rounded-2xl transition-all duration-200 mb-1 ${active ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:bg-white/50 hover:text-gray-700'}`}>
        <div className="flex items-center justify-center w-6 h-6 shrink-0"><span className={active ? 'text-blue-600' : 'opacity-70'}>{icon}</span></div>
        <span className={`ml-3 font-medium text-sm whitespace-nowrap transition-all duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 md:group-hover/aside:opacity-100'}`}>{label}</span>
        {badge > 0 && <span className={`ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm transition-all duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 md:group-hover/aside:opacity-100'}`}>{badge}</span>}
    </button>
);
