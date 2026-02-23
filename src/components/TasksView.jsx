import React, { useState, useMemo } from 'react';
import { Archive, ListTodo, Plus, Calendar } from 'lucide-react';
import { db, appId } from '../firebase';
import { collection, addDoc, updateDoc, doc, deleteDoc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { Input, PrimaryBtn } from './UI';
import { TaskItem } from './TaskItem';

export function TasksView({ tasks, adminId }) {
    const [newTaskText, setNewTaskText] = useState('');
    const [newTaskDeadline, setNewTaskDeadline] = useState('');
    const [showArchived, setShowArchived] = useState(false);

    const handleAddTask = async (e) => {
        e.preventDefault();
        if(!newTaskText.trim() || !adminId) return;
        await addDoc(collection(db, 'artifacts', appId, 'users', adminId, 'tasks'), {
            text: newTaskText,
            completed: false,
            deadline: newTaskDeadline,
            createdAt: serverTimestamp()
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

    const clearArchive = async () => {
        if (!confirm("Вы уверены, что хотите навсегда удалить все выполненные задачи? Это действие необратимо.")) return;
        const batch = writeBatch(db);
        tasks.filter(t => t.completed).forEach(task => {
            const taskRef = doc(db, 'artifacts', appId, 'users', adminId, 'tasks', task.id);
            batch.delete(taskRef);
        });
        await batch.commit();
    }

    const { today, soon, later, archived } = useMemo(() => {
        const today = [];
        const soon = [];
        const later = [];
        const archived = [];

        const now = new Date();
        const todayDate = now.setHours(0, 0, 0, 0);
        const sevenDaysFromNow = new Date(todayDate).setDate(new Date(todayDate).getDate() + 7);

        tasks.forEach(task => {
            if (task.completed) {
                archived.push(task);
                return;
            }

            if (!task.deadline) {
                later.push(task);
                return;
            }

            const taskDate = new Date(task.deadline).setHours(0, 0, 0, 0);
            
            if (taskDate < todayDate) {
                today.push(task);
            } else if (taskDate === todayDate) {
                today.push(task);
            } else if (taskDate <= sevenDaysFromNow) {
                soon.push(task);
            } else {
                later.push(task);
            }
        });

        return { 
            today: today.sort((a,b) => new Date(a.deadline) - new Date(b.deadline)),
            soon: soon.sort((a,b) => new Date(a.deadline) - new Date(b.deadline)),
            later: later.sort((a,b) => new Date(a.deadline) - new Date(b.deadline)),
            archived: archived.sort((a,b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0))
        };
    }, [tasks]);

    const TaskSection = ({ title, tasks, onToggle, onDelete, onClear }) => {
        if (tasks.length === 0 && title !== 'Архив') return null;
        return (
            <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-black text-gray-500 tracking-wider uppercase">{title}</h3>
                    {onClear && <button onClick={onClear} className="text-xs font-bold text-red-500 hover:underline">Очистить архив</button>}
                </div>
                <div className="space-y-3">
                    {tasks.length > 0 
                        ? tasks.map(task => <TaskItem key={task.id} task={task} onToggle={onToggle} onDelete={onDelete} />)
                        : <p className="text-sm text-gray-400 italic">Нет задач в этой категории.</p>
                    }
                </div>
            </div>
        );
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-[32px] shadow-lg p-4 sm:p-8">
                <div className="flex justify-between items-center mb-6">
                     <h2 className="text-xl font-black text-gray-800">{showArchived ? 'Архив задач' : 'Общий список задач'}</h2>
                     <button onClick={() => setShowArchived(!showArchived)} className="flex items-center gap-2 text-sm font-bold py-2 px-4 rounded-full hover:bg-gray-100">
                         {showArchived ? <ListTodo size={16} /> : <Archive size={16} />} 
                         {showArchived ? 'К списку задач' : 'Архив'}
                     </button>
                </div>

                {!showArchived && (
                    <form onSubmit={handleAddTask} className="flex flex-col sm:flex-row gap-2 mb-8 items-end p-4 border rounded-2xl">
                        <Input value={newTaskText} onChange={e => setNewTaskText(e.target.value)} placeholder="Что нужно сделать?" label="Новая задача"/>
                        <Input type="date" label="Срок" value={newTaskDeadline} onChange={e => setNewTaskDeadline(e.target.value)} className="w-full sm:w-48"/>
                        <PrimaryBtn type="submit" className="w-full sm:w-auto"><Plus size={18}/></PrimaryBtn>
                    </form>
                )}

                {showArchived 
                    ? <TaskSection title="Архив" tasks={archived} onToggle={toggleTask} onDelete={deleteTask} onClear={clearArchive} />
                    : <>
                        <TaskSection title="Сегодня" tasks={today} onToggle={toggleTask} onDelete={deleteTask} />
                        <TaskSection title="В скором времени" tasks={soon} onToggle={toggleTask} onDelete={deleteTask} />
                        <TaskSection title="Позже" tasks={later} onToggle={toggleTask} onDelete={deleteTask} />
                      </>
                }
            </div>
        </div>
    );
}
