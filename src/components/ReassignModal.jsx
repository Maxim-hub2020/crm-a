import React from 'react';
import { Modal, Select, PrimaryBtn } from './UI';

export function ReassignModal({ manager, otherManagers, onConfirm, onCancel }) {
    const [newManagerId, setNewManagerId] = React.useState(otherManagers[0]?.id || 'none');

    const handleSubmit = () => {
        if (!confirm(`Вы уверены, что хотите передать все проекты от ${manager.name} и удалить этого менеджера?`)) return;
        onConfirm(manager, newManagerId);
    }

    return (
        <Modal title="Передача проектов" onClose={onCancel}>
            <div className="p-6 sm:p-8 space-y-4">
                <p>Вы собираетесь удалить менеджера <strong>{manager.name}</strong>.</p>
                <p className="text-sm text-gray-600">Все проекты, закрепленные за ним, должны быть переданы другому менеджеру или оставлены без ответственного.</p>
                <Select 
                    label="Передать проекты менеджеру"
                    value={newManagerId}
                    onChange={e => setNewManagerId(e.target.value)} 
                >
                    {otherManagers.map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                    <option value="none">Оставить без менеджера</option>
                </Select>
                <PrimaryBtn onClick={handleSubmit} className="w-full bg-red-600 hover:bg-red-700">Передать и удалить</PrimaryBtn>
            </div>
        </Modal>
    )
}
