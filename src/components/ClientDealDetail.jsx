import React from 'react';
import { Check, ChevronRight } from 'lucide-react';

export function ClientDealDetail({ deal, stages, transactions }) {
    const currentStageIdx = stages.findIndex(s => s.id === deal.stageId);
    const paidAmount = transactions.filter(t => t.dealId === deal.id && t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const remainingAmount = (deal.value || 0) - paidAmount;
    return (
        <div className="p-6 sm:p-8">
            <div className="space-y-6 mb-8 relative pl-6 border-l-2 border-slate-100 ml-3">
                {stages.map((s, i) => (
                    <div key={i} className="flex items-center gap-4 relative">
                        <div className={`absolute -left-[29px] w-6 h-6 rounded-full border-4 border-white shadow-sm flex items-center justify-center ${i <= currentStageIdx ? 'bg-blue-600' : 'bg-slate-200'}`}>
                            {i <= currentStageIdx && <Check size={12} className="text-white" />}
                        </div>
                        <div className={`text-sm font-medium ${i <= currentStageIdx ? 'text-slate-900 font-bold' : 'text-slate-400'}`}>{s.name}</div>
                    </div>
                ))}
            </div>
            <div className="bg-slate-50 p-6 rounded-2xl grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                <div><div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Оплачено</div><div className="text-xl font-black text-green-500">{paidAmount.toLocaleString()} ₽</div></div>
                <div><div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Остаток</div><div className="text-xl font-black text-red-500">{remainingAmount.toLocaleString()} ₽</div></div>
                <div><div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Всего</div><div className="text-xl font-black text-slate-800">{Number(deal.value || 0).toLocaleString()} ₽</div></div>
            </div>
        </div>
    );
}
