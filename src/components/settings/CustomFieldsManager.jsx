import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { collection, writeBatch, doc, addDoc, deleteDoc } from 'firebase/firestore';
import { Input, Select, PrimaryBtn } from '../UI';
import { GripVertical, Trash2, ListPlus, Plus } from 'lucide-react';
import { SettingsCard } from './SettingsCard';
import { db, appId } from '../../firebase';

const fieldTypes = {
    text: 'Текст',
    number: 'Число',
    date: 'Дата',
    file: 'Файл'
};

export function CustomFieldsManager({ adminId, customFields, setCustomFields }) {
    const [newFieldName, setNewFieldName] = useState('');
    const [newFieldType, setNewFieldType] = useState('text');

    const onDragEnd = (result) => {
        if (!result.destination || !adminId) return;
        const items = Array.from(customFields);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        const batch = writeBatch(db);
        items.forEach((field, index) => {
            const fieldRef = doc(db, 'artifacts', appId, 'users', adminId, 'customFields', field.id);
            batch.update(fieldRef, { order: index });
        });
        batch.commit();
        setCustomFields(items);
    };

    const addField = async () => {
        if (!newFieldName.trim() || !adminId) return;
        await addDoc(collection(db, 'artifacts', appId, 'users', adminId, 'customFields'), 
            { name: newFieldName, type: newFieldType, order: customFields.length }
        );
        setNewFieldName('');
    };

    const deleteField = async (fieldId) => {
        if (!adminId) return;
        await deleteDoc(doc(db, 'artifacts', appId, 'users', adminId, 'customFields', fieldId));
    };

    return (
        <SettingsCard title="Поля проектов" icon={<ListPlus size={16}/>}>
            <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="customFields">
                    {(provided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2 mb-4">
                            {customFields.map((field, index) => (
                                <Draggable key={field.id} draggableId={field.id} index={index}>
                                    {(provided) => (
                                        <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                            <div className="flex items-center gap-2">
                                                <GripVertical size={16} className="text-gray-400" />
                                                <span className="font-medium text-sm">{field.name}</span>
                                                <span className="text-xs text-gray-400">({fieldTypes[field.type]})</span>
                                            </div>
                                            <button onClick={() => deleteField(field.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                                        </div>
                                    )}
                                </Draggable>
                            ))}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </DragDropContext>

            <div className="flex flex-col gap-2 border-t pt-4">
                <Input value={newFieldName} onChange={(e) => setNewFieldName(e.target.value)} placeholder="Название поля" />
                <div className="flex gap-2">
                    <Select value={newFieldType} onChange={(e) => setNewFieldType(e.target.value)}>
                        {Object.entries(fieldTypes).map(([key, value]) => (
                            <option key={key} value={key}>{value}</option>
                        ))}
                    </Select>
                    <PrimaryBtn onClick={addField}><Plus size={16}/></PrimaryBtn>
                </div>
            </div>
        </SettingsCard>
    );
}
