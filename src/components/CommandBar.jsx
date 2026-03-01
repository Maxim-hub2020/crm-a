import React, { useState } from 'react';
import { Input, PrimaryBtn } from './UI';
import { Bot } from 'lucide-react';

export function CommandBar({ onParseCommand, onClose }) {
    const [command, setCommand] = useState('');

    const handleParse = () => {
        if (command.trim()) {
            onParseCommand(command);
            onClose();
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleParse();
        }
    };

    return (
        <div className="p-1">
            <div className="flex items-center gap-3 mb-4">
                 <div className="bg-blue-100 text-blue-600 p-2 rounded-lg">
                    <Bot size={24} />
                 </div>
                 <div>
                    <h3 className="font-bold text-lg">AI-помощник</h3>
                    <p className="text-sm text-gray-500">Опишите, что нужно сделать. Например: "Новый проект для..."</p>
                </div>
            </div>
            <div className="flex gap-2">
                <Input
                    value={command}
                    onChange={(e) => setCommand(e.target.value)}
                    placeholder="Создать проект для..."
                    onKeyPress={handleKeyPress}
                    autoFocus
                />
                <PrimaryBtn onClick={handleParse}>Выполнить</PrimaryBtn>
            </div>
        </div>
    );
}
