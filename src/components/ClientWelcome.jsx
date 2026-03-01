import React from 'react';
import { Modal } from './UI';
import { ClientDealDetail } from './ClientDealDetail';
import { ChevronRight, User, Phone } from 'lucide-react';

export function ClientWelcome({ client, clientData, onLogout, selectedDeal, onSelectDeal }) {
    const { deals, stages, transactions, manager } = clientData;

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6">
            <div className="w-full max-w-4xl bg-white rounded-[32px] p-6 sm:p-8 shadow-xl animate-in zoom-in duration-300">
                <div className="flex justify-between items-start mb-6 sm:mb-8">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-black">Здравствуйте, {client.name}!</h1>
                        <p className="text-slate-500 mt-1">Мы уже занимаемся и стараемся сделать ваш заказ максимально быстро.</p>
                    </div>
                    <button onClick={onLogout} className="text-red-500 font-bold uppercase text-[10px] hover:text-red-700 transition-colors shrink-0">Выход</button>
                </div>

                {manager && (
                    <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
                             <User className="text-blue-500"/>
                        </div>
                        <div>
                            <p className="font-bold text-sm text-slate-800">Ваш персональный менеджер</p>
                            <p className="font-semibold text-slate-600">{manager.name}</p>
                            {manager.phone && <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5"><Phone size={12}/> {manager.phone}</p>}
                        </div>
                    </div>
                )}

                <h2 className="text-lg sm:text-xl font-bold mb-4">Мои заказы</h2>
                <div className="space-y-4">
                    {deals.length > 0 ? deals.map(deal => (
                        <div key={deal.id} onClick={() => onSelectDeal(deal)} className="bg-gray-50 hover:bg-gray-100 p-4 sm:p-6 rounded-2xl cursor-pointer transition-all flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-lg text-gray-800">{deal.title}</h3>
                                <p className="text-sm text-gray-500">Бюджет: {Number(deal.value || 0).toLocaleString()} ₽</p>
                            </div>
                            <ChevronRight className="text-gray-400" />
                        </div>
                    )) : <p className="text-center text-gray-400 py-10">У вас пока нет заказов.</p>}
                </div>
            </div>

            {selectedDeal && (
                <Modal
                    title={selectedDeal.title}
                    onClose={() => onSelectDeal(null)}
                    width="max-w-3xl"
                >
                    <ClientDealDetail
                        deal={selectedDeal}
                        stages={stages}
                        transactions={transactions}
                    />
                </Modal>
            )}
        </div>
    );
}
