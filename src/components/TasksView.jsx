import React, { useState } from 'react';
import { CheckSquare, Square, MoreHorizontal, Plus, Trash2 } from 'lucide-react';
import { doc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db, appId } from '../firebase';
import { Input, PrimaryBtn } from './UI';

const TaskItem = ({ task, onUpdate, onRequestDelete }) => {

    const handleToggle = () => {
        onUpdate(task.id, { completed: !task.completed });
    };

    const handleDelete = () => {
        const itemName = `задачу \"${task.text}\"`;
        onRequestDelete(task.id, 'task', itemName);
    };

    return (
        <div className={`flex items-center justify-between p-4 rounded-2xl bg-white shadow-sm hover:shadow-md transition-all ${task.completed ? 'line-through text-gray-400' : ''}`}>
            <div onClick={handleToggle} className="flex items-center gap-3 cursor-pointer flex-grow">
                {task.completed ? <CheckSquare size={22} className="text-green-500" /> : <Square size={22} className="text-gray-300" />}
                <span className="text-sm text-gray-800">{task.text}</span>
            </div>
            <div className="ml-4">
                <button onClick={handleDelete} className="p-1 rounded-full text-gray-400 hover:bg-red-100 hover:text-red-600 transition-colors">
                    <Trash2 size={16} />
                </button>
            </div>
        </div>
    );
};


export function TasksView({ tasks, adminId, onRequestDelete, userRole }) {
    const [newTask, setNewTask] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    const handleAddTask = async (e) => {
        e.preventDefault();
        if (!newTask.trim() || !adminId) return;

        setIsAdding(true);
        try {
            await addDoc(collection(db, 'artifacts', appId, 'users', adminId, 'tasks'), {
                text: newTask,
                completed: false,
                createdAt: serverTimestamp()
            });
            setNewTask('');
        } catch (error) {
            console.error("Error adding task: ", error);
        } finally {
            setIsAdding(false);
        }
    };

    const handleUpdateTask = async (id, data) => {
        if (!adminId) return;
        const taskRef = doc(db, 'artifacts', appId, 'users', adminId, 'tasks', id);
        await updateDoc(taskRef, data);
    };

    // Filter out trashed tasks from being displayed
    const visibleTasks = tasks.filter(t => t.status !== 'trashed');

    return (
        <div className="max-w-3xl mx-auto">
            <form onSubmit={handleAddTask} className="flex items-center gap-3 mb-6 bg-white p-3 rounded-2xl shadow-lg">
                <Input 
                    value={newTask}
                    onChange={e => setNewTask(e.target.value)}
                    placeholder="Например, позвонить клиенту..."
                    className="flex-grow !py-3"
                    disabled={isAdding}
                />
                <PrimaryBtn type="submit" disabled={!newTask.trim() || isAdding} className="!py-3">
                    <Plus size={20}/>
                    <span className="hidden sm:inline">Добавить</span>
                </PrimaryBtn>
            </form>

            <div className="space-y-3">
                {visibleTasks.length > 0 
                    ? visibleTasks.map(task => (
                        <TaskItem 
                            key={task.id} 
                            task={task} 
                            onUpdate={handleUpdateTask} 
                            onRequestDelete={onRequestDelete}
                        />
                    ))
                    : <div className="text-center text-gray-400 py-10">Задач пока нет. Добавьте первую!</div>
                }
            </div>
        </div>
    );
}
