import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { collection, writeBatch, doc } from 'firebase/firestore';
import { Input, PrimaryBtn } from '../UI';
import { GripVertical, Trash2, Layers, Plus } from 'lucide-react';
import { SettingsCard } from './SettingsCard';
import { db, appId } from '../../firebase';

export function StagesManager({ adminId, stages, setStages }) {
    const [newStageName, setNewStageName] = useState('');

    const onDragEnd = (result) => {
        if (!result.destination) return;
        const items = Array.from(stages);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);
        
        const batch = writeBatch(db);
        items.forEach((stage, index) => {
            const stageRef = doc(db, 'artifacts', appId, 'users', adminId, 'stages', stage.id);
            batch.update(stageRef, { order: index });
        });
        batch.commit();
        setStages(items);
    };

    const addStage = async () => {
        if (!newStageName.trim() || !adminId) return;
        const batch = writeBatch(db);
        const newStageRef = doc(collection(db, 'artifacts', appId, 'users', adminId, 'stages'));
        batch.set(newStageRef, { name: newStageName, order: stages.length });
        await batch.commit();
        setNewStageName('');
    };

    const deleteStage = async (stageId) => {
        // Super dangerous, need to reassign deals first. Implement later.
        console.log("Deletion not implemented yet. ID: ", stageId)
        // await deleteDoc(doc(db, 'stages', stageId));
    };

    return (
        <SettingsCard title="Этапы проектов" icon={<Layers size={16}/>}>
            <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="stages">
                    {(provided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2 mb-4">
                            {stages.map((stage, index) => (
                                <Draggable key={stage.id} draggableId={stage.id} index={index}>
                                    {(provided) => (
                                        <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                            <div className="flex items-center gap-2">
                                                <GripVertical size={16} className="text-gray-400"/>
                                                <span className="font-medium text-sm">{stage.name}</span>
                                            </div>
                                            {/* <button onClick={() => deleteStage(stage.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={14} /></button> */}
                                        </div>
                                    )}
                                </Draggable>
                            ))}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </DragDropContext>
            <div className="flex items-center gap-2 border-t pt-4">
                <Input value={newStageName} onChange={(e) => setNewStageName(e.target.value)} placeholder="Новый этап" />
                <PrimaryBtn onClick={addStage}><Plus size={16}/></PrimaryBtn>
            </div>
        </SettingsCard>
    );
}
