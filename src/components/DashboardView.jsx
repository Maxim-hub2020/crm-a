import React, { useMemo } from 'react';
import { Layers, ListTodo, Calendar } from 'lucide-react';

export function DashboardView({ deals, tasks, stages, clients, managers, userRole, openDealModal }) {
    const getStageName = (id) => stages.find(s => s.id === id)?.name || 'Неизвестно';
    const getClientName = (id) => clients.find(c => c.id === id)?.name || 'Без клиента';
    const getManagerName = (id) => managers.find(m => m.id === id)?.name || 'Не назначен';

    const { stuckDeals, upcomingTasks } = useMemo(() => {
        const fiveDaysAgo = new Date();
        fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

        const stuck = deals.filter(deal => 
            deal.stageUpdatedAt && deal.stageUpdatedAt.toDate() < fiveDaysAgo
        );

        const now = new Date();
        const todayDate = now.setHours(0, 0, 0, 0);
        const sevenDaysFromNow = new Date(todayDate).setDate(new Date(todayDate).getDate() + 7);
        
        const upcoming = tasks.filter(task => {
            if(task.completed) return false;
            if(!task.deadline) return false;
            const taskDate = new Date(task.deadline).setHours(0, 0, 0, 0);
            return taskDate <= sevenDaysFromNow;
        }).sort((a,b) => new Date(a.deadline) - new Date(b.deadline));

        return { stuckDeals: stuck, upcomingTasks: upcoming };
    }, [deals, tasks]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
                <h2 className="text-xl font-black text-gray-800 mb-4 flex items-center gap-2"><Layers size={20} className="text-orange-500"/> Зависшие проекты</h2>
                <div className="bg-white rounded-[32px] shadow-lg p-4 space-y-3">
                    {stuckDeals.length > 0 ? stuckDeals.map(deal => (
                        <div key={deal.id} onClick={() => openDealModal(deal)} className="p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 cursor-pointer">
                            <h4 className="font-bold text-gray-800">{deal.title}</h4>
                            <p className="text-xs text-gray-500">Клиент: {getClientName(deal.clientId)}</p>
                            <p className="text-xs text-red-500 font-semibold">На этапе "{getStageName(deal.stageId)}" с {deal.stageUpdatedAt.toDate().toLocaleDateString('ru-RU')}</p>
                            {userRole === 'admin' && <p className="text-xs text-gray-400">Менеджер: {getManagerName(deal.managerId)}</p>}
                        </div>
                    )) : <p className="text-center p-8 text-gray-400">Нет проектов, требующих внимания.</p>}
                </div>
            </div>
            <div>
                 <h2 className="text-xl font-black text-gray-800 mb-4 flex items-center gap-2"><ListTodo size={20} className="text-blue-500"/> Ближайшие задачи</h2>
                 <div className="bg-white rounded-[32px] shadow-lg p-4 space-y-3">
                     {upcomingTasks.length > 0 ? upcomingTasks.map(task => (
                        <div key={task.id} className="p-4 bg-gray-50 rounded-2xl">
                            <p className="font-semibold text-gray-800">{task.text}</p>
                            {task.deadline && (
                                 <div className="text-xs text-amber-600 font-bold flex items-center gap-1.5 mt-1">
                                    <Calendar size={12}/> Срок: {new Date(task.deadline).toLocaleDateString('ru-RU')}
                                </div>
                            )}
                        </div>
                     )) : <p className="text-center p-8 text-gray-400">Нет задач на ближайшее время.</p>}
                </div>
            </div>
        </div>
    );
}
