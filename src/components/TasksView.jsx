import React, { useState, useMemo } from 'react';
import { CheckSquare, Square, Plus, Trash2, Calendar } from 'lucide-react';
import { doc, updateDoc, addDoc, collection, serverTimestamp, Timestamp } from 'firebase/firestore';
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

    const isOverdue = useMemo(() => {
        if (task.completed || !task.dueDate?.toDate) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return task.dueDate.toDate() < today;
    }, [task.dueDate, task.completed]);

    return (
        <div className={`flex items-start justify-between p-4 rounded-2xl bg-white shadow-sm hover:shadow-md transition-all ${task.completed ? 'opacity-60' : ''}`}>
            <div className="flex items-start gap-3 flex-grow">
                <button onClick={handleToggle} className="mt-0.5 shrink-0">
                    {task.completed 
                        ? <CheckSquare size={22} className="text-green-500" /> 
                        : <Square size={22} className={`text-gray-300 ${isOverdue ? 'text-red-300' : ''}`} />
                    }
                </button>
                <div className="flex-grow">
                     <span className={`text-sm text-gray-800 ${task.completed ? 'line-through text-gray-500' : ''}`}>{task.text}</span>
                     {task.dueDate && (
                         <div className={`text-xs flex items-center gap-1.5 mt-1.5 font-medium ${isOverdue && !task.completed ? 'text-red-500' : 'text-gray-400'}`}>
                            <Calendar size={12} />
                            <span>{task.dueDate.toDate().toLocaleDateString('ru-RU')}</span>
                        </div>
                     )}
                </div>
            </div>
            <div className="ml-4 shrink-0">
                <button onClick={handleDelete} className="p-1 rounded-full text-gray-400 hover:bg-red-100 hover:text-red-600 transition-colors">
                    <Trash2 size={16} />
                </button>
            </div>
        </div>
    );
};

const TaskSection = ({ title, tasks, onUpdate, onRequestDelete, emptyText, accentColor = 'text-gray-400' }) => {
    if (tasks.length === 0 && !emptyText) return null;

    return (
        <div className="mb-6">
            <h3 className={`text-sm font-bold ${accentColor} uppercase tracking-widest mb-3 px-1`}>{title} ({tasks.length})</h3>
            <div className="space-y-3">
                {tasks.length > 0 ? (
                    tasks.map(task => (
                        <TaskItem key={task.id} task={task} onUpdate={onUpdate} onRequestDelete={onRequestDelete} />
                    ))
                ) : (
                    <div className="text-center text-gray-400 text-sm py-5 bg-white/50 rounded-2xl">{emptyText}</div>
                )}
            </div>
        </div>
    );
};


export function TasksView({ tasks, adminId, onRequestDelete, userRole }) {
    const [newTask, setNewTask] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    const handleAddTask = async (e) => {
        e.preventDefault();
        if (!newTask.trim() || !adminId) return;

        setIsAdding(true);
        try {
            const payload = {
                text: newTask,
                completed: false,
                createdAt: serverTimestamp(),
                ...(dueDate && { dueDate: Timestamp.fromDate(new Date(dueDate)) })
            };
            await addDoc(collection(db, 'artifacts', appId, 'users', adminId, 'tasks'), payload);
            setNewTask('');
            setDueDate('');
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

    const { overdue, today, upcoming, noDate, completed } = useMemo(() => {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000 - 1);

        const visibleTasks = tasks.filter(t => t.status !== 'trashed');
        const uncompletedTasks = visibleTasks.filter(t => !t.completed);
        const completedTasks = visibleTasks.filter(t => t.completed);

        const overdue = [];
        const today = [];
        const upcoming = [];
        const noDate = [];

        uncompletedTasks.forEach(task => {
            if (task.dueDate?.toDate) {
                const taskDueDate = task.dueDate.toDate();
                if (taskDueDate < todayStart) {
                    overdue.push(task);
                } else if (taskDueDate >= todayStart && taskDueDate <= todayEnd) {
                    today.push(task);
                } else {
                    upcoming.push(task);
                }
            } else {
                noDate.push(task);
            }
        });

        const sortFn = (a, b) => (a.dueDate.toDate() || 0) - (b.dueDate.toDate() || 0);
        const createdSortFn = (a, b) => (b.createdAt.toDate() || 0) - (a.createdAt.toDate() || 0);

        return {
            overdue: overdue.sort(sortFn),
            today: today.sort(createdSortFn),
            upcoming: upcoming.sort(sortFn),
            noDate: noDate.sort(createdSortFn),
            completed: completedTasks.sort(createdSortFn)
        }

    }, [tasks]);


    return (
        <div className="max-w-3xl mx-auto">
            <form onSubmit={handleAddTask} className="flex flex-col sm:flex-row items-center gap-3 mb-8 bg-white p-3 rounded-2xl shadow-lg">
                <Input 
                    value={newTask}
                    onChange={e => setNewTask(e.target.value)}
                    placeholder="Например, позвонить клиенту..."
                    className="w-full !py-3"
                    disabled={isAdding}
                />
                 <Input 
                    type="date"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className="w-full sm:w-48 !py-3"
                    disabled={isAdding}
                />
                <PrimaryBtn type="submit" disabled={!newTask.trim() || isAdding} className="!py-3 w-full sm:w-auto">
                    <Plus size={20}/>
                    <span className="hidden sm:inline">Добавить</span>
                </PrimaryBtn>
            </form>

            {tasks.length === 0
                ? <div className="text-center text-gray-400 py-10">Задач пока нет. Добавьте первую!</div>
                : <>
                    <TaskSection title="Просроченные" tasks={overdue} onUpdate={handleUpdateTask} onRequestDelete={onRequestDelete} accentColor="text-red-500" emptyText="Нет просроченных задач" />
                    <TaskSection title="На сегодня" tasks={today} onUpdate={handleUpdateTask} onRequestDelete={onRequestDelete} accentColor="text-blue-500" emptyText="На сегодня задач нет"/>
                    <TaskSection title="Предстоящие" tasks={upcoming} onUpdate={handleUpdateTask} onRequestDelete={onRequestDelete} emptyText="Нет предстоящих задач" />
                    <TaskSection title="Без срока" tasks={noDate} onUpdate={handleUpdateTask} onRequestDelete={onRequestDelete} />
                    <TaskSection title="Выполненные" tasks={completed} onUpdate={handleUpdateTask} onRequestDelete={onRequestDelete} emptyText="Нет выполненных задач"/>
                </>
            }
        </div>
    );
}
