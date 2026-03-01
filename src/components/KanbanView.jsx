import { Droppable, Draggable, DragDropContext } from 'react-beautiful-dnd';
import { Plus, Search } from 'lucide-react';
import { Input } from './UI';

const getDaysIndicator = (stageName, days) => {
    const name = (stageName || '').toLowerCase();
    let colorClass = 'bg-gray-100 text-gray-800'; // Default

    if (name.includes('замер') || name.includes('кп')) {
        if (days <= 2) colorClass = 'bg-green-100 text-green-800';
        else if (days <= 4) colorClass = 'bg-yellow-100 text-yellow-800';
        else colorClass = 'bg-red-100 text-red-800';
    } else if (name.includes('проектирование')) {
        if (days <= 3) colorClass = 'bg-green-100 text-green-800';
        else if (days <= 5) colorClass = 'bg-yellow-100 text-yellow-800';
        else colorClass = 'bg-red-100 text-red-800';
    } else if (name.includes('производство')) {
        if (days <= 9) colorClass = 'bg-green-100 text-green-800';
        else if (days <= 12) colorClass = 'bg-yellow-100 text-yellow-800';
        else colorClass = 'bg-red-100 text-red-800';
    } else if (name.includes('монтаж')) {
        if (days <= 3) colorClass = 'bg-green-100 text-green-800';
        else if (days <= 5) colorClass = 'bg-yellow-100 text-yellow-800';
        else colorClass = 'bg-red-100 text-red-800';
    }
    
    return colorClass;
};

const DealItem = ({ deal, index, onClick, clientName, manager, userRole, stage }) => {
    const updatedAt = deal.stageUpdatedAt?.toDate() || deal.createdAt?.toDate();
    let diffDays = 0;
    if (updatedAt) {
        const now = new Date();
        // Set time to 00:00:00 to count full days
        now.setHours(0, 0, 0, 0);
        updatedAt.setHours(0, 0, 0, 0);
        const diffTime = Math.abs(now - updatedAt);
        diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    const indicatorColor = getDaysIndicator(stage.title, diffDays);

    return (
        <Draggable draggableId={deal.id} index={index}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    onClick={() => onClick(deal)}
                    className={`bg-white rounded-xl shadow-sm border border-slate-200/80 p-3 mb-2 transition-all ${snapshot.isDragging ? 'shadow-lg scale-105' : 'hover:shadow-md'} cursor-pointer`}>
                    <h4 className="font-semibold text-sm text-gray-800">{deal.title}</h4>
                    <p className="text-xs text-gray-500 mt-1">{clientName || 'Клиент не назначен'}</p>
                    <div className="flex justify-between items-center mt-3">
                        <span className="text-xs font-bold text-blue-600">{Number(deal.value || 0).toLocaleString()} ₽</span>
                        <div className="flex items-center gap-2">
                           <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${indicatorColor}`}>{diffDays} дн.</span>
                           {userRole === 'admin' && manager && (
                                <div className="w-6 h-6 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-[10px] font-bold" title={manager.name}>
                                    {manager.name.charAt(0)}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </Draggable>
    );
};

const StageColumn = ({ stage, deals, onClickDeal, getClientName, managers, userRole, onAddDeal }) => {
    const stageValue = deals.reduce((sum, deal) => sum + (Number(deal.value) || 0), 0);
    const stageDealsCount = deals.length;

    return (
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl w-72 md:w-80 flex-shrink-0 flex flex-col max-h-full border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between p-4 border-b border-slate-200/80 flex-shrink-0">
                <div className='flex items-center gap-2'>
                    <h3 className="font-bold text-sm text-slate-800 truncate pr-2">{stage.title || stage.name}</h3>
                    <span className='font-semibold text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-full'>{stageDealsCount}</span>
                </div>
                <span className="font-bold text-sm text-slate-600 whitespace-nowrap">{stageValue.toLocaleString()} ₽</span>
            </div>
            
            <div className="flex-grow overflow-y-auto p-2">
                <Droppable droppableId={stage.id}>
                    {(provided, snapshot) => (
                        <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={`min-h-[150px] rounded-lg transition-colors duration-300 ${snapshot.isDraggingOver ? 'bg-blue-50/50' : ''}`}>
                            {deals.map((deal, index) => (
                                <DealItem
                                    key={deal.id}
                                    deal={deal}
                                    index={index}
                                    stage={stage}
                                    onClick={onClickDeal}
                                    clientName={getClientName(deal.clientId)}
                                    manager={managers.find(m => m.id === deal.managerId)}
                                    userRole={userRole}
                                />
                            ))}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </div>

            <div className="p-2 border-t border-slate-200/80 flex-shrink-0">
                 <button 
                    onClick={() => onAddDeal(stage.id)} 
                    className="w-full flex items-center justify-center gap-2 text-sm text-slate-500 font-medium hover:bg-slate-100 hover:text-slate-700 p-2 rounded-lg transition-colors">
                    <Plus size={16}/>
                    Добавить проект
                </button>
            </div>
        </div>
    );
}

export function KanbanView({ stages, deals, clients, openDealModal, managers, userRole, onDragEnd, searchTerm, onSearchChange }) {
    const getClientName = (id) => clients.find(c => c.id === id)?.name;
    
    const dealsByStage = stages.reduce((acc, stage) => {
        acc[stage.id] = deals.filter(d => d.stageId === stage.id).sort((a,b) => a.stageUpdatedAt > b.stageUpdatedAt ? 1 : -1);
        return acc;
    }, {});

    return (
        <div className="h-full flex flex-col">
            <div className="px-1 pb-4 flex-shrink-0">
                <div className="relative max-w-xs">
                    <Input 
                        value={searchTerm}
                        onChange={e => onSearchChange(e.target.value)} 
                        placeholder="Поиск проектов..."
                        className="pl-10 w-full"
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
            </div>
            <div className="flex-grow overflow-x-auto pb-4 touch-pan-x">
                <DragDropContext onDragEnd={onDragEnd}>
                    <div className="flex space-x-4 h-full">
                        {stages.map(stage => (
                            <StageColumn 
                                key={stage.id} 
                                stage={stage} 
                                deals={dealsByStage[stage.id] || []} 
                                onClickDeal={openDealModal}
                                getClientName={getClientName}
                                managers={managers}
                                userRole={userRole}
                                onAddDeal={(stageId) => openDealModal(null, stageId)}
                            />
                        ))}
                    </div>
                </DragDropContext>
            </div>
        </div>
    );
}
