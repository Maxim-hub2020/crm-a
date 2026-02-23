import React from 'react';
import { X } from 'lucide-react';

export const Label = ({children}) => <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">{children}</label>;

export const Input = ({ label, ...props }) => (<div className="space-y-1.5 w-full text-left">
    {label && <Label>{label}</Label>}
    <input {...props} className={`w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none text-sm ${props.className || ''}`} />
</div>);

export const Select = ({ label, children, ...props }) => (<div className="space-y-1.5 w-full text-left">
    {label && <Label>{label}</Label>}
    <select {...props} className={`w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none text-sm appearance-none ${props.className || ''}`}>{children}</select>
</div>);

export const PrimaryBtn = ({ children, onClick, className = "", ...props }) => (<button onClick={onClick} className={`btn-hover bg-gray-900 text-white px-5 py-2.5 rounded-full text-sm font-semibold shadow-lg hover:bg-black flex items-center justify-center gap-2 ${className}`} {...props}>{children}</button>);

export const Modal = ({ title, children, onClose, width = "max-w-md" }) => (
    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-md z-[150] flex items-center justify-center p-2 sm:p-4">
        <div className={`bg-white rounded-3xl sm:rounded-[32px] shadow-2xl w-full ${width} max-h-[95vh] flex flex-col overflow-hidden animate-in zoom-in duration-200`} onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center px-6 sm:px-8 py-4 border-b border-gray-100 shrink-0">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 truncate pr-4 uppercase tracking-tight">{title}</h2>
                <button onClick={onClose} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="overflow-y-auto flex-1 no-scrollbar">{children}</div>
        </div>
    </div>
);
