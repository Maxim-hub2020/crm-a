import React, { useState } from 'react';
import { collection, addDoc, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { Plus } from 'lucide-react';
import { Input, PrimaryBtn } from './UI';
import { TaskItem } from './TaskItem';
import { db, appId } from '../firebase';

export function DealTasks({ adminId, deal, tasks: projectTasks }) {
    const [newTaskText, setNewTaskText] = useState('');
    const [newTaskDeadline, setNewTaskDeadline] = useState('');
    
    const handleAddTask = async () => {
        if(!newTaskText.trim() || !deal?.id) return;
        await addDoc(collection(db, 'artifacts', appId, 'users', adminId, 'tasks'), {
            text: newTaskText,
            completed: false,
            deadline: newTaskDeadline,
            createdAt: serverTimestamp(),
            dealId: deal.id,
            dealTitle: deal.title
        });
        setNewTaskText('');
        setNewTaskDeadline('');
    };

    const toggleTask = async (task) => {
        const taskRef = doc(db, 'artifacts', appId, 'users', adminId, 'tasks', task.id);
        await updateDoc(taskRef, { completed: !task.completed });
    };

    const deleteTask = async (taskId) => {
        if (!confirm("Удалить задачу?")) return;
        const taskRef = doc(db, 'artifacts', appId, 'users', adminId, 'tasks', taskId);
        await deleteDoc(taskRef);
    };

    const today = new Date().toISOString().slice(0, 10);
    
    return (
        <div className="p-1 h-full flex flex-col">
            <div className="flex-1 space-y-3 overflow-y-auto no-scrollbar pr-2">
                 {projectTasks.length > 0 ? projectTasks.map(task => (
                    <TaskItem key={task.id} task={task} onToggle={toggleTask} onDelete={deleteTask} />
                )) : <p className="text-sm text-center text-gray-400 pt-10">Задач по этому проекту нет.</p>}
            </div>
            <div className="mt-4 flex flex-col sm:flex-row gap-2 pt-2 border-t items-end">
                <Input value={newTaskText} onChange={e => setNewTaskText(e.target.value)} placeholder="Новая задача"/>
                <Input type="date" label="Срок" value={newTaskDeadline} onChange={e => setNewTaskDeadline(e.target.value)} className="w-full sm:w-40" min={today} />
                <PrimaryBtn onClick={handleAddTask} className="w-full sm:w-auto !px-4"><Plus size={16}/></PrimaryBtn>
            </div>
        </div>
    )
}
