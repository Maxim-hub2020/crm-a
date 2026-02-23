import React from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Search, UserCheck } from 'lucide-react';
import { Input } from './UI';

export function KanbanView({ stages, deals, clients, openDealModal, managers, userRole, onDragEnd, searchTerm, onSearchChange }) {
    const getClientName = (id) => clients.find(c => c.id === id)?.name || 'Без клиента';
    const getManagerName = (id) => managers.find(m => m.id === id)?.name || 'Не назначен';
    
    return (
        <div className="h-full flex flex-col">
             <div className="mb-4 relative">
                <Input 
                    value={searchTerm}
                    onChange={e => onSearchChange(e.target.value)} 
                    placeholder="Поиск..."
                    className="pl-10"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
            <DragDropContext onDragEnd={onDragEnd}>
                <div className="kanban-scroll flex-1 flex space-x-4 md:space-x-6 overflow-x-auto pb-6 items-start snap-x snap-mandatory md:snap-none">
                    {stages.map(stage => (
                        <Droppable key={stage.id} droppableId={stage.id}>
                            {(provided, snapshot) => (
                                <div
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    className={`flex-shrink-0 w-[90vw] sm:w-80 flex flex-col max-h-full bg-slate-200/20 rounded-3xl p-2 border border-slate-100 shadow-inner transition-colors snap-center ${snapshot.isDraggingOver ? 'bg-blue-50' : ''}`}
                                >
                                    <div className="flex justify-between items-center mb-3 px-4 pt-3 shrink-0">
                                        <h3 className="font-bold text-slate-900 text-[10px] uppercase tracking-widest opacity-40">{stage.name}</h3>
                                        <span className="text-slate-400 font-black text-[10px] bg-white px-2 py-0.5 rounded-full">{deals.filter(d=>d.stageId === stage.id).reduce((sum, d) => sum + Number(d.value || 0), 0).toLocaleString()} ₽</span>
                                    </div>
                                    <div className="flex-1 overflow-y-auto space-y-3 p-1 min-h-[150px] no-scrollbar">
                                        {deals.filter(d => d.stageId === stage.id).map((deal, index) => (
                                            <Draggable key={deal.id} draggableId={deal.id} index={index}>
                                                {(provided, snapshot) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                        onClick={() => openDealModal(deal)}
                                                        className={`bg-white p-4 sm:p-6 rounded-2xl sm:rounded-[28px] shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group ring-1 ring-black/[0.03] border border-transparent hover:border-blue-100 ${snapshot.isDragging ? 'shadow-lg scale-105' : ''}`}
                                                    >
                                                        <h4 className="font-bold sm:font-black text-slate-800 leading-tight mb-2 text-sm">{deal.title}</h4>
                                                        <div className="text-[10px] font-bold sm:font-black text-blue-500 uppercase tracking-widest mb-3 opacity-60">{getClientName(deal.clientId)}</div>
                                                        
                                                        {userRole === 'admin' && deal.managerId && (
                                                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                                                                <UserCheck size={12}/> {getManagerName(deal.managerId)}
                                                            </div>
                                                        )}
                                                        
                                                        <div className="font-bold sm:font-black text-slate-900 text-xs mt-3">{Number(deal.value||0).toLocaleString()} ₽</div>
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </div>
                                     <button onClick={() => openDealModal(null, stage.id)} className="w-full mt-2 py-5 rounded-[24px] border-2 border-dashed border-slate-200 text-slate-300 hover:border-blue-400 hover:text-blue-500 transition-all text-[10px] font-black uppercase">Добавить проект</button>
                                </div>
                            )}
                        </Droppable>
                    ))}
                </div>
            </DragDropContext>
        </div>
    );
}
