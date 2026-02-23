import React from 'react';
import { Droppable, Draggable, DragDropContext } from 'react-beautiful-dnd';
import { Plus, Search } from 'lucide-react';
import { Input } from './UI';

const DealItem = ({ deal, index, onClick, clientName, manager, userRole }) => {
    return (
        <Draggable draggableId={deal.id} index={index}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    onClick={() => onClick(deal)}
                    className={`bg-white rounded-2xl shadow-md p-4 mb-3 transition-all ${snapshot.isDragging ? 'shadow-xl scale-105' : 'hover:shadow-lg'} cursor-pointer`}>
                    <h4 className="font-bold text-sm text-gray-800">{deal.title}</h4>
                    <p className="text-xs text-gray-500 mt-1">{clientName || 'Клиент не назначен'}</p>
                    <div className="flex justify-between items-center mt-3">
                        <span className="text-xs font-bold text-blue-600">{Number(deal.value || 0).toLocaleString()} ₽</span>
                        {userRole === 'admin' && manager && (
                            <div className="w-6 h-6 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-[10px] font-bold" title={manager.name}>
                                {manager.name.charAt(0)}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </Draggable>
    );
};

const StageColumn = ({ stage, deals, onClickDeal, getClientName, managers, userRole, onAddDeal }) => {
    const stageValue = deals.reduce((sum, deal) => sum + (Number(deal.value) || 0), 0);

    return (
        <div className="bg-gray-100 rounded-3xl p-3 w-72 md:w-80 flex-shrink-0 flex flex-col">
            <div className="px-2 mb-4">
                <div className="flex items-baseline gap-2">
                    <h3 className="font-black text-sm uppercase tracking-wider text-gray-600">{stage.title}</h3>
                    <span className="font-semibold text-sm text-gray-500">{stageValue.toLocaleString()} ₽</span>
                </div>
            </div>
            <div className="flex-grow">
                <Droppable droppableId={stage.id}>
                    {(provided, snapshot) => (
                        <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={`min-h-[200px] transition-colors duration-300 rounded-2xl ${snapshot.isDraggingOver ? 'bg-blue-50' : ''}`}>
                            {deals.map((deal, index) => (
                                <DealItem
                                    key={deal.id}
                                    deal={deal}
                                    index={index}
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
            <div className="pt-3">
                 <button 
                    onClick={() => onAddDeal(stage.id)} 
                    className="w-full flex items-center justify-center gap-2 text-sm text-gray-500 font-semibold hover:bg-gray-200 hover:text-gray-700 p-2 rounded-xl transition-colors">
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
            <div className="flex-grow overflow-x-auto pb-4">
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
