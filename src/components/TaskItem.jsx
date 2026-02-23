import React, { useState } from 'react';
import { Check, Calendar, Trash2 } from 'lucide-react';

export function TaskItem({ task, onToggle, onDelete }) {
    const [isExiting, setIsExiting] = useState(false);

    const handleToggle = () => {
        setIsExiting(true);
        setTimeout(() => {
            onToggle(task);
            setIsExiting(false);
        }, 300);
    };

    const handleDelete = () => {
        setIsExiting(true);
        setTimeout(() => onDelete(task.id), 300);
    };

    return (
        <div className={`p-4 rounded-2xl flex items-start gap-4 transition-all duration-300 ${isExiting ? 'opacity-0 scale-95' : 'opacity-100 scale-100'} ${task.completed ? 'bg-green-50 text-gray-400 line-through' : 'bg-gray-50 hover:bg-gray-100'}`}>
            <div onClick={handleToggle} className={`w-5 h-5 mt-0.5 rounded-full border-2 flex items-center justify-center shrink-0 cursor-pointer ${task.completed ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}>
                {task.completed && <Check size={14} className="text-white"/>}
            </div>
            <div className="flex-1 min-w-0">
                <span className="flex-1 break-words">{task.text}</span>
                 {task.dealTitle && (
                    <a href="#" onClick={(e) => { e.preventDefault(); }} className="text-xs text-blue-500 hover:underline block mt-1">
                        Проект: {task.dealTitle}
                    </a>
                )}
                {task.deadline && (
                    <div className="text-xs text-amber-600 font-bold flex items-center gap-1.5 mt-1">
                        <Calendar size={12}/> {new Date(task.deadline).toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                )}
            </div>
            <button onClick={(e) => { e.stopPropagation(); handleDelete(); }} className="ml-auto text-gray-400 hover:text-red-500 p-1">
                <Trash2 size={16}/>
            </button>
        </div>
    );
}
