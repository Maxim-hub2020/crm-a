
import React, { useState, useEffect, useMemo } from 'react';
import { doc, updateDoc, collection, addDoc, serverTimestamp, deleteField } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { Trash2 } from 'lucide-react';

import { Input, Select, Label, PrimaryBtn } from './UI';
import { FileInputField } from './FileInputField';
import { DealComments } from './DealComments';
import { DealTasks } from './DealTasks';
import { DealFinances } from './DealFinances';
import { useDebounce } from '../utils';
import { db, storage, appId } from '../firebase';


function DetailTab({ label, name, count, activeTab, setActiveTab }) {
    return (
        <button onClick={() => setActiveTab(name)} className={`px-3 sm:px-4 py-2 font-bold text-sm rounded-md relative ${activeTab === name ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-100/50'}`}>
            {label} 
            {count > 0 && <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-full">{count}</span>}
        </button>
    );
}

export function DealCard({ deal, onClose, onSaveNewDeal, onRequestDelete, onFileUpload, onFileDelete, ...props }) {
    const { adminId, clients, managers, stages, customFields, userRole, managerDocId, user, accounts, categories, tasks, transactions } = props;
    const [dealData, setDealData] = useState({});
    const [activeTab, setActiveTab] = useState('comments');
    const [isDeleted, setIsDeleted] = useState(false); // Prevent autosave on delete
    const debouncedDealData = useDebounce(dealData, 1000);

    useEffect(() => {
        const defaultManager = userRole === 'manager' ? managerDocId : '';
        const defaultState = { title: '', value: '', clientId: '', managerId: defaultManager, stageId: stages[0]?.id || '', customData: {} };
        const initialState = { ...defaultState, ...(deal || {}) };
        setDealData(initialState);
    }, [deal, stages, userRole, managerDocId]);

    useEffect(() => {
        const autoSave = async () => {
            // Do not save if marked as deleted, or if it's a new deal, or if data hasn't changed.
            if (isDeleted || !dealData.id || JSON.stringify(dealData) === JSON.stringify(deal)) {
                return;
            }
            
            const dealRef = doc(db, 'artifacts', appId, 'users', adminId, 'deals', dealData.id);
            try {
                await updateDoc(dealRef, { ...dealData, value: Number(dealData.value || 0) });
            } catch (error) {
                // It's possible the document was deleted by another process, so we can ignore "not found" errors.
                if (error.code !== 'not-found') {
                    console.error("Autosave failed:", error);
                }
            }
        };

        autoSave();
    }, [debouncedDealData, deal, adminId, isDeleted]); // Added dependencies

    const handleChange = (field, value) => {
        setDealData(prev => ({...prev, [field]: value}));
    };
    
    const handleCustomFieldChange = (fieldId, value) => {
         setDealData(prev => ({
             ...prev,
             customData: {
                 ...prev.customData,
                 [fieldId]: value
             }
         }));
    }

    const handleDeleteRequest = () => {
        if (!dealData.id) return;
        setIsDeleted(true); // Mark for deletion to prevent auto-save
        onRequestDelete(dealData.id, 'deal', dealData.title);
    }

    const dealTasks = useMemo(() => tasks.filter(t => t.dealId === dealData.id), [tasks, dealData.id]);


    return (
        <div className="flex flex-col lg:flex-row">
            <div className="w-full lg:w-[350px] shrink-0 border-b lg:border-b-0 lg:border-r border-gray-100 p-6 flex flex-col space-y-4 overflow-y-auto no-scrollbar bg-gray-50/50">
                <div className="space-y-4">
                    <Input label="Название проекта" value={dealData.title || ''} onChange={e => handleChange('title', e.target.value)} />
                    <Select label="Этап" value={dealData.stageId || ''} onChange={e => handleChange('stageId', e.target.value)}>
                        {stages.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                    </Select>
                    <Input label="Бюджет" type="number" value={dealData.value || ''} onChange={e => handleChange('value', e.target.value)} />
                    <Select label="Клиент" value={dealData.clientId || ''} onChange={e => handleChange('clientId', e.target.value)}>
                        <option value="">Без клиента</option>
                        {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </Select>
                    {userRole === 'admin' && (
                        <Select label="Менеджер" value={dealData.managerId || ''} onChange={e => handleChange('managerId', e.target.value)}>
                            <option value="">Не назначен</option>
                            {managers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </Select>
                    )}
                    {customFields.map(field => (
                        <div key={field.id} className="space-y-1.5 w-full text-left">
                            <Label>{field.name}</Label>
                            {field.type === 'file' ? (
                                 <FileInputField 
                                    field={field}
                                    value={dealData.customData?.[field.id]}
                                    onFileUpload={onFileUpload}
                                    onFileDelete={onFileDelete}
                                    dealId={dealData.id}
                                    disabled={!dealData.id}
                                />
                            ) : (
                                <Input 
                                    type={field.type}
                                    value={dealData.customData?.[field.id] || ''}
                                    onChange={e => handleCustomFieldChange(field.id, e.target.value)}
                                />
                            )}
                        </div>
                    ))}
                </div>
                <div className="mt-auto flex flex-col gap-2 pt-4 border-t">
                    {!dealData.id && <PrimaryBtn onClick={() => onSaveNewDeal(dealData)} className="w-full">Сохранить проект</PrimaryBtn>}
                    {dealData.id && <button onClick={handleDeleteRequest} className="text-xs font-bold text-red-500 hover:bg-red-50 p-2 rounded-lg flex items-center justify-center gap-2"><Trash2 size={14}/>{userRole === 'admin' ? 'Удалить проект' : 'Запросить удаление'}</button>}
                </div>
            </div>

            <div className="flex-1 p-6 flex flex-col min-h-0">
                {dealData.id ? (<>
                    <div className="flex items-center border-b border-gray-100 pb-3 mb-4">
                        <DetailTab label="Комментарии" name="comments" activeTab={activeTab} setActiveTab={setActiveTab} />
                        <DetailTab label="Задачи" name="tasks" count={dealTasks.filter(t=>!t.completed).length} activeTab={activeTab} setActiveTab={setActiveTab} />
                        {userRole === 'admin' && <DetailTab label="Финансы" name="finances" activeTab={activeTab} setActiveTab={setActiveTab} />}
                    </div>
                    <div className="flex-1 overflow-y-auto no-scrollbar -mr-6 -ml-6 pl-6 pr-6">
                        {activeTab === 'comments' && <DealComments {...{adminId, dealId: dealData.id, user}} />}
                        {activeTab === 'tasks' && <DealTasks adminId={adminId} deal={dealData} tasks={dealTasks} />}
                        {userRole === 'admin' && activeTab === 'finances' && <DealFinances {...{adminId, dealId: dealData.id, transactions, categories, accounts, managers, userRole, onRequestDelete, managerDocId }} />}
                    </div>
                </>) : (
                    <div className="flex-1 flex items-center justify-center text-center text-gray-400 p-8">
                        <p>Начните вводить данные и нажмите "Сохранить проект",<br/>чтобы добавить комментарии, задачи и финансы.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

