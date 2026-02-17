import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import * as Lucide from 'lucide-react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, sendEmailVerification } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, doc, addDoc, updateDoc, deleteDoc, serverTimestamp, setDoc, getDoc, query, where, orderBy, writeBatch, getDocs } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

const { 
    LayoutDashboard, Users, Wallet, Settings, X, Briefcase, Phone, Mail, Trash2, Check, 
    CreditCard, Tag, Sparkles, Calculator, Layers, MessageSquare, User, HelpCircle, 
    CheckCircle2, Pencil, Copy, AtSign, Send, Crown, Loader2, Mic, MicOff, Hash, Home,
    Users2, Lock, Plus, LogOut, Sliders, ChevronRight, FileDown, ExternalLink, ListTodo, Type, Calendar, Pilcrow,
    Search, GripVertical, Bell, UserCheck, ShieldQuestion, Menu, Archive, Clock, UploadCloud, File as FileIcon
} = Lucide;

// ==================================================================================
const firebaseConfig = {
    apiKey: "AIzaSyDl3vMtK203-TTFJ9KiVx7eHCVoAP1f_X4",
    authDomain: "crm-a-65f00.firebaseapp.com",
    projectId: "crm-a-65f00",
    storageBucket: "crm-a-65f00.appspot.com",
    messagingSenderId: "427479091195",
    appId: "1:427479091195:web:fa3cd7b4c5c7dc9a42ad5e",
    measurementId: "G-R0CNPHZ5R9"
};
// ==================================================================================

const appId = 'crm-pro-v1';

// Firebase Initialization
let app, auth, db, storage;
try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
} catch (e) {
    console.error("Firebase initialization error. Have you inserted your keys?", e);
}

// --- HOOKS ---
function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
}

// --- HELPER FUNCTIONS ---
const TAB_NAMES = { dashboard: 'Дашборд', kanban: 'Проекты', finances: 'Финансы', clients: 'Клиенты', tasks: 'Задачи', settings: 'Система', requests: 'Запросы' };

const copyToClipboard = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {}, () => prompt("Не удалось скопировать. Скопируйте вручную:", text));
};

const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let password = "";
    for (let i = 0; i < 8; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}

const generateCompanyCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}


// --- ATOMIC COMPONENTS ---
const Label = ({children}) => <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">{children}</label>;
const Input = ({ label, ...props }) => (<div className="space-y-1.5 w-full text-left">
    {label && <Label>{label}</Label>}
    <input {...props} className={`w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none text-sm ${props.className || ''}`} />
</div>);
const Select = ({ label, children, ...props }) => (<div className="space-y-1.5 w-full text-left">
    {label && <Label>{label}</Label>}
    <select {...props} className={`w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none text-sm appearance-none ${props.className || ''}`}>{children}</select>
</div>);
const PrimaryBtn = ({ children, onClick, className = "", ...props }) => (<button onClick={onClick} className={`btn-hover bg-gray-900 text-white px-5 py-2.5 rounded-full text-sm font-semibold shadow-lg hover:bg-black flex items-center justify-center gap-2 ${className}`} {...props}>{children}</button>);
const Modal = ({ title, children, onClose, width = "max-w-md" }) => (
    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-md z-[150] flex items-center justify-center p-2 sm:p-4">
        <div className={`bg-white rounded-3xl sm:rounded-[32px] shadow-2xl w-full ${width} max-h-[95vh] flex flex-col overflow-hidden animate-in zoom-in duration-200`} onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center px-6 sm:px-8 py-4 border-b border-gray-100 shrink-0">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 truncate pr-4 uppercase tracking-tight">{title}</h2>
                <button onClick={onClose} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="overflow-y-auto flex-1 no-scrollbar">{children}</div>
        </div>
    </div>
);
const NavItem = ({ icon, label, active, onClick, badge, isSidebarOpen }) => (
    <button onClick={onClick} className={`w-full flex items-center p-3 rounded-2xl transition-all duration-200 mb-1 ${active ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:bg-white/50 hover:text-gray-700'}`}>
        <div className="flex items-center justify-center w-6 h-6 shrink-0"><span className={active ? 'text-blue-600' : 'opacity-70'}>{icon}</span></div>
        <span className={`ml-3 font-medium text-sm whitespace-nowrap transition-all duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 md:group-hover/aside:opacity-100'}`}>{label}</span>
        {badge > 0 && <span className={`ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm transition-all duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 md:group-hover/aside:opacity-100'}`}>{badge}</span>}
    </button>
);
const SettingsCard = ({ title, icon, children }) => (
    <div className="glass-panel rounded-3xl border border-white/50 overflow-hidden shadow-sm mb-6">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/30 flex items-center gap-2 text-gray-900 font-semibold"><div className="text-indigo-600">{icon}</div><h3 className="truncate uppercase text-xs font-black tracking-widest">{title}</h3></div>
        <div className="p-4 sm:p-6">{children}</div>
    </div>
);

// --- Reassign Modal ---
function ReassignModal({ manager, otherManagers, onConfirm, onCancel }) {
    const [newManagerId, setNewManagerId] = useState(otherManagers[0]?.id || 'none');

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


// --- SUB-MODULES ---
function CompanyIdCard({ companyCode }) {
    return (
        <SettingsCard title="Код компании" icon={<Hash size={16}/>}>
            <p className="text-sm mb-4">Этот код позволяет менеджерам и клиентам входить в вашу систему. Он не может быть изменен.</p>
            <div className="flex items-center gap-2 p-3 bg-gray-100 rounded-xl">
                <span className="text-lg font-mono flex-1 text-center select-all">{companyCode}</span>
                <button onClick={() => copyToClipboard(companyCode)} className="p-2 bg-blue-100 text-blue-600 hover:bg-blue-200 rounded-lg">
                    <Copy size={16}/>
                </button>
            </div>
        </SettingsCard>
    );
}

function TeamManager({ managers, onAddManager, onDeleteManager }) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleAdd = (e) => {
        e.preventDefault();
        onAddManager({name, email, password});
        setName('');
        setEmail('');
        setPassword('');
    }

    return (
        <SettingsCard title="Команда" icon={<Users2 size={16}/>}>
            <div className="space-y-3 mb-4">
                {managers.map(m => (
                    <div key={m.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                            <p className="font-semibold">{m.name}</p>
                            <p className="text-xs text-gray-500">{m.email}</p>
                        </div>
                        <button onClick={() => onDeleteManager(m)} className="text-red-500 hover:text-red-700"><Trash2 size={16}/></button>
                    </div>
                ))}
            </div>
             <form onSubmit={handleAdd} className="space-y-3 border-t pt-4">
                <h4 className="font-bold">Добавить менеджера</h4>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Имя" required />
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" required />
                <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Пароль" required />
                <PrimaryBtn type="submit" className="w-full">Добавить</PrimaryBtn>
             </form>
        </SettingsCard>
    );
}

function CategoriesManager({ adminId, db, appId, categories }) {
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryType, setNewCategoryType] = useState('expense');

    const handleAddCategory = async () => {
        if (!newCategoryName.trim() || !adminId) return;
        const path = collection(db, 'artifacts', appId, 'users', adminId, 'categories');
        await addDoc(path, { name: newCategoryName, type: newCategoryType });
        setNewCategoryName('');
    };

    const handleDeleteCategory = async (id) => {
        const path = doc(db, 'artifacts', appId, 'users', adminId, 'categories', id);
        await deleteDoc(path);
    };

    return (
         <SettingsCard title="Категории финансов" icon={<Tag size={16}/>}>
            <div className="space-y-2 mb-4">
                {categories.map(c => (
                    <div key={c.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <span className={`font-medium text-sm ${c.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>{c.name}</span>
                        <button onClick={() => handleDeleteCategory(c.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                    </div>
                ))}
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-2">
                <Input value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} placeholder="Новая категория" />
                <Select value={newCategoryType} onChange={e => setNewCategoryType(e.target.value)}>
                    <option value="expense">Расход</option>
                    <option value="income">Доход</option>
                </Select>
                <PrimaryBtn onClick={handleAddCategory} className="w-full sm:w-auto"><Plus size={16}/></PrimaryBtn>
            </div>
        </SettingsCard>
    );
}

function CustomFieldsManager({ adminId, db, appId, customFields }) {
    const [fieldName, setFieldName] = useState('');
    const [fieldType, setFieldType] = useState('text');

    const handleAddField = async () => {
        if (!fieldName.trim() || !adminId) return;
        await addDoc(collection(db, 'artifacts', appId, 'users', adminId, 'customFields'), {
            name: fieldName,
            type: fieldType,
            order: customFields.length
        });
        setFieldName('');
    }
    
    const deleteField = async (id) => {
         await deleteDoc(doc(db, 'artifacts', appId, 'users', adminId, 'customFields', id));
    }

    const getIcon = (type) => {
        if (type === 'text') return <Pilcrow size={14}/>;
        if (type === 'number') return <Hash size={14}/>;
        if (type === 'date') return <Calendar size={14}/>;
        if (type === 'file') return <FileIcon size={14}/>;
    }

    return (
        <SettingsCard title="Дополнительные поля" icon={<Sliders size={16}/>}>
             <div className="space-y-2 mb-4">
                {customFields.map(f => (
                    <div key={f.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                            <span className="text-gray-400">{getIcon(f.type)}</span>
                            <span className="font-medium text-sm">{f.name}</span>
                        </div>
                        <button onClick={() => deleteField(f.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                    </div>
                ))}
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-2 border-t pt-4">
                <Input value={fieldName} onChange={e => setFieldName(e.target.value)} placeholder="Название поля" />
                <Select value={fieldType} onChange={e => setFieldType(e.target.value)}>
                    <option value="text">Текст</option>
                    <option value="number">Число</option>
                    <option value="date">Дата</option>
                    <option value="file">Файл</option>
                </Select>
                <PrimaryBtn onClick={handleAddField} className="w-full sm:w-auto"><Plus size={16}/></PrimaryBtn>
            </div>
        </SettingsCard>
    );
}

function StagesManager({ adminId, db, appId, stages, setStages }) {
    const [newStageName, setNewStageName] = useState('');

    const handleAddStage = async () => {
        if (!newStageName.trim() || !adminId) return;
        await addDoc(collection(db, 'artifacts', appId, 'users', adminId, 'stages'), {
            name: newStageName,
            order: stages.length
        });
        setNewStageName('');
    };

    const handleDeleteStage = async (id) => {
        if (!confirm("Вы уверены, что хотите удалить этот статус? Проекты в этом статусе не будут удалены, но им нужно будет назначить новый статус вручную.")) return;
        await deleteDoc(doc(db, 'artifacts', appId, 'users', adminId, 'stages', id));
    };

    const onDragEnd = async (result) => {
        const { destination, source } = result;
        if (!destination) return;
        if (destination.index === source.index) return;

        const reorderedStages = Array.from(stages);
        const [removed] = reorderedStages.splice(source.index, 1);
        reorderedStages.splice(destination.index, 0, removed);
        
        setStages(reorderedStages);

        const batch = writeBatch(db);
        reorderedStages.forEach((stage, index) => {
            const stageRef = doc(db, 'artifacts', appId, 'users', adminId, 'stages', stage.id);
            batch.update(stageRef, { order: index });
        });
        await batch.commit();
    };

    return (
        <SettingsCard title="Статусы проектов" icon={<Layers size={16}/>}>
            <p className="text-sm text-gray-500 mb-4">Перетаскивайте статусы, чтобы изменить их порядок на доске.</p>
            <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="stages-list">
                    {(provided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2 mb-4">
                            {stages.map((s, index) => (
                                <Draggable key={s.id} draggableId={s.id} index={index}>
                                    {(provided) => (
                                        <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <div className="flex items-center gap-2">
                                                <GripVertical className="w-5 h-5 text-gray-400" />
                                                <span className="font-medium text-sm">{s.name}</span>
                                            </div>
                                            <button onClick={() => handleDeleteStage(s.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                                        </div>
                                    )}
                                </Draggable>
                            ))}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </DragDropContext>
            <div className="flex flex-col sm:flex-row items-center gap-2 border-t pt-4">
                <Input value={newStageName} onChange={e => setNewStageName(e.target.value)} placeholder="Новый статус" />
                <PrimaryBtn onClick={handleAddStage} className="w-full sm:w-auto"><Plus size={16}/></PrimaryBtn>
            </div>
        </SettingsCard>
    );
}

function AccountsManager({ adminId, db, appId, accounts }) {
    const [newAccountName, setNewAccountName] = useState('');

    const handleAddAccount = async () => {
        if (!newAccountName.trim() || !adminId) return;
        await addDoc(collection(db, 'artifacts', appId, 'users', adminId, 'accounts'), {
            name: newAccountName,
            createdAt: serverTimestamp()
        });
        setNewAccountName('');
    };

    const handleDeleteAccount = async (id) => {
        if (!confirm("Вы уверены, что хотите удалить этот счет? Операции, связанные с ним, останутся, но будут отображаться как 'Без счета'.")) return;
        await deleteDoc(doc(db, 'artifacts', appId, 'users', adminId, 'accounts', id));
    };

    return (
        <SettingsCard title="Счета" icon={<CreditCard size={16}/>}>
            <p className="text-sm text-gray-500 mb-4">Управляйте своими финансовыми счетами, например, 'Касса' или 'Банк'.</p>
            <div className="space-y-2 mb-4">
                {accounts.map(a => (
                    <div key={a.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <span className="font-medium text-sm">{a.name}</span>
                        <button onClick={() => handleDeleteAccount(a.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                    </div>
                ))}
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-2 border-t pt-4">
                <Input value={newAccountName} onChange={e => setNewAccountName(e.target.value)} placeholder="Название нового счета" />
                <PrimaryBtn onClick={handleAddAccount} className="w-full sm:w-auto"><Plus size={16}/></PrimaryBtn>
            </div>
        </SettingsCard>
    );
}


// --- FORMS ---

function ClientForm({ client, onClose, adminId, managerDocId, userRole }) {
    const [formData, setFormData] = useState(client || { name: '', email: '', phone: '', loginName: '', loginPassword: '' });

    useEffect(() => {
        if (!client) { // Only for new clients
            const newPassword = generatePassword();
            setFormData(prev => ({...prev, loginPassword: newPassword}));
        }
    }, [client]);

    const handleChange = (field, value) => setFormData(prev => ({...prev, [field]: value}));
    
    const handleSave = async () => {
        if (!formData.name || !adminId) return alert("Имя клиента - обязательное поле");

        const finalData = {
            ...formData,
            loginName: formData.loginName || formData.name, // Default login name to client name
            managerId: userRole === 'manager' ? managerDocId : (formData.managerId || null)
        };

        const clientCollection = collection(db, 'artifacts', appId, 'users', adminId, 'clients');
        
        try {
             // Check for unique loginName
            const q = query(clientCollection, where("loginName", "==", finalData.loginName));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty && querySnapshot.docs.some(doc => doc.id !== formData.id)) {
                alert("Клиент с таким именем для входа уже существует. Пожалуйста, выберите другое.");
                return;
            }

            if (formData.id) { // Editing existing client
                const clientRef = doc(clientCollection, formData.id);
                await updateDoc(clientRef, finalData);
            } else { // Creating new client
                await addDoc(clientCollection, { ...finalData, createdAt: serverTimestamp() });
            }
            onClose();
        } catch (e) {
            alert("Ошибка сохранения клиента: " + e.message);
        }
    };

    return (
        <div className="p-6 sm:p-8 space-y-4">
            <Input label="Имя *" value={formData.name || ''} onChange={e => handleChange('name', e.target.value)} />
            <Input label="Email" type="email" value={formData.email || ''} onChange={e => handleChange('email', e.target.value)} />
            <Input label="Телефон" value={formData.phone || ''} onChange={e => handleChange('phone', e.target.value)} />
            
            <div className="pt-4 border-t">
                <Label>Данные для входа клиента</Label>
                <div className="p-4 bg-gray-50 rounded-xl space-y-3">
                     <Input label="Имя для входа (логин)" value={formData.loginName || ''} onChange={e => handleChange('loginName', e.target.value)} placeholder="Можно оставить пустым, будет как Имя" />
                     <Input label="Пароль" value={formData.loginPassword || ''} onChange={e => handleChange('loginPassword', e.target.value)} />
                     <p className="text-xs text-gray-500">Эти данные клиент будет использовать для входа в свой личный кабинет. Вы всегда можете их посмотреть или изменить здесь.</p>
                </div>
            </div>

            <PrimaryBtn onClick={handleSave} className="w-full py-4 uppercase font-black text-xs tracking-widest">Сохранить</PrimaryBtn>
        </div>
    );
}

function TransactionForm({ onClose, adminId, db, appId, categories, accounts, dealId, transaction: editingTransaction, managerDocId, userRole }) {
    const [formData, setFormData] = useState({
        amount: '',
        type: 'expense',
        categoryId: '',
        accountId: '',
        description: '',
        date: new Date().toISOString().slice(0, 10),
        status: 'actual', // 'actual' vs 'planned'
    });

    useEffect(() => {
        if (editingTransaction) {
            setFormData({
                amount: editingTransaction.amount || '',
                type: editingTransaction.type || 'expense',
                categoryId: editingTransaction.categoryId || '',
                accountId: editingTransaction.accountId || '',
                description: editingTransaction.description || '',
                date: editingTransaction.date || new Date().toISOString().slice(0, 10),
                status: editingTransaction.status || 'actual',
            });
        }
    }, [editingTransaction]);
    
    const handleChange = (field, value) => setFormData(prev => ({...prev, [field]: value}));

    const handleSubmit = async (e) => {
        e.preventDefault();
        const { amount, type, date } = formData;
        if (!amount || !type || !date || !adminId) {
            alert("Пожалуйста, заполните все обязательные поля.");
            return;
        }

        const creatorId = userRole === 'manager' ? managerDocId : (userRole === 'admin' ? 'admin' : null);
        const data = { ...formData, amount: Number(formData.amount), dealId: dealId || null, createdBy: creatorId };

        if (editingTransaction?.id) {
             const transactionRef = doc(db, 'artifacts', appId, 'users', adminId, 'transactions', editingTransaction.id);
             await updateDoc(transactionRef, data);
             if (editingTransaction.dealId) {
                 const dealTransactionRef = doc(db, 'artifacts', appId, 'users', adminId, 'deals', editingTransaction.dealId, 'transactions', editingTransaction.id);
                 await updateDoc(dealTransactionRef, data);
             }
        } else {
            const collectionPath = dealId 
                ? collection(db, 'artifacts', appId, 'users', adminId, 'deals', dealId, 'transactions')
                : collection(db, 'artifacts', appId, 'users', adminId, 'transactions');
            const newDocRef = await addDoc(collectionPath, { ...data, createdAt: serverTimestamp() });
            
            if (dealId) {
                 const mainCollectionRef = collection(db, 'artifacts', appId, 'users', adminId, 'transactions');
                 await setDoc(doc(mainCollectionRef, newDocRef.id), { ...data, createdAt: serverTimestamp() });
            }
        }

        onClose();
    };
    
    const filteredCategories = useMemo(() => categories.filter(c => c.type === formData.type), [categories, formData.type]);
    
    useEffect(() => {
       if (!formData.categoryId && filteredCategories.length > 0) {
           handleChange('categoryId', filteredCategories[0].id);
       }
    }, [formData.type, filteredCategories]);

    return (
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <Input label="Сумма *" type="number" value={formData.amount} onChange={e => handleChange('amount', e.target.value)} required />
                <Input label="Дата *" type="date" value={formData.date} onChange={e => handleChange('date', e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <Select label="Тип" value={formData.type} onChange={e => handleChange('type', e.target.value)}>
                    <option value="expense">Расход</option>
                    <option value="income">Доход</option>
                </Select>
                 <Select label="Статус" value={formData.status} onChange={e => handleChange('status', e.target.value)}>
                    <option value="actual">Фактический</option>
                    <option value="planned">Плановый</option>
                </Select>
            </div>
            <Select label="Категория" value={formData.categoryId} onChange={e => handleChange('categoryId', e.target.value)}>
                <option value="">Без категории</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
            <Select label="Счет" value={formData.accountId} onChange={e => handleChange('accountId', e.target.value)}>
                <option value="">Без счета</option>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </Select>
            <div>
                <Label>Описание</Label>
                <textarea value={formData.description} onChange={e => handleChange('description', e.target.value)} className="w-full border border-gray-200 rounded-xl p-2.5 outline-none min-h-[100px]"></textarea>
            </div>
            <PrimaryBtn type="submit" className="w-full py-4 uppercase font-black text-xs tracking-widest">{editingTransaction ? 'Обновить' : 'Сохранить'}</PrimaryBtn>
        </form>
    );
}

function DealComments({ adminId, db, appId, dealId, user }) {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");

    useEffect(() => {
        if (!dealId) return;
        const q = query(collection(db, 'artifacts', appId, 'users', adminId, 'deals', dealId, 'comments'), orderBy('createdAt', 'asc'));
        const unsub = onSnapshot(q, snap => {
            setComments(snap.docs.map(d => ({id: d.id, ...d.data()})));
        });
        return unsub;
    }, [dealId, adminId, appId]);

    const handleAddComment = async () => {
        if (!newComment.trim() || !dealId) return;
        await addDoc(collection(db, 'artifacts', appId, 'users', adminId, 'deals', dealId, 'comments'), {
            text: newComment,
            createdAt: serverTimestamp(),
            author: user.email
        });
        setNewComment("");
    }
    
    return (
        <div className="p-1 h-full flex flex-col">
            <div className="flex-1 space-y-4 overflow-y-auto no-scrollbar pr-2">
                {comments.length > 0 ? comments.map(comment => (
                    <div key={comment.id} className="bg-gray-100 rounded-lg p-3">
                        <p className="text-xs text-gray-500 font-bold">{comment.author} - {new Date(comment.createdAt?.toDate()).toLocaleString('ru-RU')}</p>
                        <p className="text-sm text-gray-800 break-words">{comment.text}</p>
                    </div>
                )) : <p className="text-sm text-center text-gray-400 pt-10">Комментариев пока нет.</p>}
            </div>
            <div className="mt-4 flex gap-2 pt-2 border-t">
                <Input value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Ваш комментарий..."/>
                <PrimaryBtn onClick={handleAddComment} className="!px-4"><Send size={16}/></PrimaryBtn>
            </div>
        </div>
    )
}

function DealTasks({ adminId, db, appId, deal, tasks: projectTasks, onTasksUpdate }) {
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
    
    return (
        <div className="p-1 h-full flex flex-col">
            <div className="flex-1 space-y-3 overflow-y-auto no-scrollbar pr-2">
                 {projectTasks.length > 0 ? projectTasks.map(task => (
                    <TaskItem key={task.id} task={task} onToggle={toggleTask} onDelete={deleteTask} />
                )) : <p className="text-sm text-center text-gray-400 pt-10">Задач по этому проекту нет.</p>}
            </div>
            <div className="mt-4 flex flex-col sm:flex-row gap-2 pt-2 border-t items-end">
                <Input value={newTaskText} onChange={e => setNewTaskText(e.target.value)} placeholder="Новая задача"/>
                <Input type="date" label="Срок" value={newTaskDeadline} onChange={e => setNewTaskDeadline(e.target.value)} className="w-full sm:w-40"/>
                <PrimaryBtn onClick={handleAddTask} className="w-full sm:w-auto !px-4"><Plus size={16}/></PrimaryBtn>
            </div>
        </div>
    )
}

function DealFinances({ adminId, db, appId, dealId, categories, accounts, managers, userRole, onRequestDelete }) {
    const [transactions, setTransactions] = useState([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState(null);

    useEffect(() => {
        if (!dealId) return;
        const q = query(collection(db, 'artifacts', appId, 'users', adminId, 'deals', dealId, 'transactions'), orderBy('date', 'desc'));
        const unsub = onSnapshot(q, snap => setTransactions(snap.docs.map(d => ({id:d.id, ...d.data()}))));
        return unsub;
    }, [dealId, adminId, appId]);

    const getManagerName = (id) => managers.find(m => m.id === id)?.name || id;

    const handleEdit = (tx) => {
        setEditingTransaction(tx);
        setIsFormOpen(true);
    }
    
    const handleCloseForm = () => {
        setIsFormOpen(false);
        setEditingTransaction(null);
    }

    return (
         <div className="p-1 h-full flex flex-col">
            <div className="flex-1 overflow-y-auto no-scrollbar pr-2">
                {transactions.length > 0 ? transactions.map(t => (
                    <div key={t.id} className="p-3 rounded-lg hover:bg-gray-50 flex justify-between items-center group">
                        <div>
                            <p className={`font-bold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>{t.amount.toLocaleString()} ₽</p>
                            <p className="text-xs text-gray-500">{new Date(t.date).toLocaleDateString('ru-RU')}</p>
                        </div>
                        <div className="flex-1 px-4 min-w-0">
                            <p className="text-sm text-gray-600 truncate">{t.description}</p>
                             {t.status === 'planned' && <span className="text-xs font-bold text-blue-500 bg-blue-100 px-2 py-0.5 rounded-full">Плановый</span>}
                            {userRole === 'admin' && t.createdBy && (
                                <p className="text-xs text-gray-400 flex items-center gap-1 mt-1"><UserCheck size={12}/> {getManagerName(t.createdBy)}</p>
                            )}
                        </div>
                         <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button onClick={() => handleEdit(t)} className="p-1 hover:text-blue-600"><Pencil size={14}/></button>
                             <button onClick={() => onRequestDelete(t.id, 'transaction', `Операция на ${t.amount} ₽`)} className="p-1 hover:text-red-600"><Trash2 size={14}/></button>
                        </div>
                    </div>
                )) : <p className="text-sm text-center text-gray-400 pt-10">Финансовых операций не найдено.</p>}
            </div>
            <div className="mt-4 pt-2 border-t">
                <PrimaryBtn onClick={() => handleEdit(null)} className="w-full">Добавить операцию</PrimaryBtn>
            </div>
            {isFormOpen && <Modal title={editingTransaction ? "Редактировать операцию" : "Новая операция"} onClose={handleCloseForm}><TransactionForm onClose={handleCloseForm} {...{adminId, db, appId, categories, accounts, dealId, transaction: editingTransaction}} /></Modal>}
        </div>
    )
}

function FileInputField({ field, value, onFileUpload, onFileDelete, dealId, disabled }) {
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        try {
            await onFileUpload(file, dealId, field.id);
        } catch (err) {
            console.error("Upload failed", err);
            alert("Ошибка загрузки файла.");
        } finally {
            setUploading(false);
        }
    };
    
    const handleDelete = async () => {
        if (!value?.name) return;
        if (!confirm(`Удалить файл "${value.name}"?`)) return;
         try {
            await onFileDelete(dealId, field.id, value.name);
        } catch (err) {
            console.error("Delete failed", err);
            alert("Ошибка удаления файла.");
        }
    }

    if (uploading) {
        return (
            <div className="flex items-center gap-2 p-3 text-sm text-gray-500 bg-gray-100 rounded-xl">
                <Loader2 className="animate-spin" size={16}/> Загрузка...
            </div>
        )
    }

    if (value && value.url) {
        return (
             <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
                 <a href={value.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm font-semibold text-blue-600 truncate hover:underline">
                    <FileIcon size={16}/>
                    <span className="truncate">{value.name}</span>
                </a>
                <button onClick={handleDelete} disabled={disabled} className="p-1 text-red-500 hover:text-red-700 disabled:opacity-50">
                    <Trash2 size={14}/>
                </button>
            </div>
        )
    }

    return (
         <>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" disabled={disabled}/>
            <button 
                onClick={() => fileInputRef.current.click()}
                disabled={disabled}
                className="w-full flex items-center justify-center gap-2 p-3 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-semibold text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <UploadCloud size={16}/> Загрузить файл
            </button>
        </>
    )
}

function DealCard({ deal, onClose, onSaveNewDeal, onRequestDelete, onFileUpload, onFileDelete, ...props }) {
    const { adminId, db, appId, clients, managers, stages, customFields, userRole, managerDocId, user, accounts, categories, tasks } = props;
    const [dealData, setDealData] = useState({});
    const [activeTab, setActiveTab] = useState('comments');
    const debouncedDealData = useDebounce(dealData, 1000);

    useEffect(() => {
        const defaultManager = userRole === 'manager' ? managerDocId : '';
        const defaultState = { title: '', value: '', clientId: '', managerId: defaultManager, stageId: stages[0]?.id || '', customData: {} };
        const initialState = { ...defaultState, ...(deal || {}) };
        setDealData(initialState);
    }, [deal, stages, userRole, managerDocId]);

    useEffect(() => {
        const autoSave = async () => {
            if (dealData.id && JSON.stringify(dealData) !== JSON.stringify(deal)) { 
                const dealRef = doc(db, 'artifacts', appId, 'users', adminId, 'deals', dealData.id);
                await updateDoc(dealRef, { ...dealData, value: Number(dealData.value || 0) });
            }
        };
        autoSave();
    }, [debouncedDealData, deal]);

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
        onRequestDelete(dealData.id, 'deal', dealData.title);
    }

    const dealTasks = useMemo(() => tasks.filter(t => t.dealId === dealData.id), [tasks, dealData.id]);

    const DetailTab = ({ label, name, count }) => (<button onClick={() => setActiveTab(name)} className={`px-3 sm:px-4 py-2 font-bold text-sm rounded-md relative ${activeTab === name ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-100/50'}`}>{label} {count > 0 && <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-full">{count}</span>}</button>);

    return (
        <div className="flex flex-col lg:flex-row" style={{ height: 'calc(95vh - 65px)' }}>
            <div className="w-full lg:w-[350px] shrink-0 border-b lg:border-b-0 lg:border-r border-gray-100 p-6 flex flex-col space-y-4 overflow-y-auto no-scrollbar bg-gray-50/50">
                <div className="space-y-4">
                    <Input label="Название проекта" value={dealData.title || ''} onChange={e => handleChange('title', e.target.value)} />
                    <Select label="Этап" value={dealData.stageId || ''} onChange={e => handleChange('stageId', e.target.value)}>
                        {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
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
                        <DetailTab label="Комментарии" name="comments" />
                        <DetailTab label="Задачи" name="tasks" count={dealTasks.filter(t=>!t.completed).length} />
                        <DetailTab label="Финансы" name="finances" />
                    </div>
                    <div className="flex-1 overflow-y-auto no-scrollbar -mr-6 -ml-6 pl-6 pr-6">
                        {activeTab === 'comments' && <DealComments {...{adminId, db, appId, dealId: dealData.id, user}} />}
                        {activeTab === 'tasks' && <DealTasks deal={dealData} tasks={dealTasks} {...{adminId, db, appId}} />}
                        {activeTab === 'finances' && <DealFinances {...{...props, dealId: dealData.id }} />}
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

function AuthScreen({ auth, db, appId, showClientLogin }) {
    const [isLoginView, setIsLoginView] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [unverifiedUser, setUnverifiedUser] = useState(null);

    const handleResendVerification = async () => {
        if (!unverifiedUser) return;
        try {
            await sendEmailVerification(unverifiedUser);
            setMessage('Письмо с подтверждением отправлено повторно. Обязательно проверьте папку "Спам"!');
            await signOut(auth);
            setUnverifiedUser(null);
        } catch (error) {
            setMessage("Ошибка при повторной отправке: " + error.message);
        }
    };

    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        setUnverifiedUser(null);

        try {
            if (isLoginView) {
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;

                if (!user.emailVerified) {
                    const roleDoc = await getDoc(doc(db, 'user_profiles', user.uid));
                    if (roleDoc.exists() && (roleDoc.data().role === 'admin' || roleDoc.data().role === 'manager')) {
                         setUnverifiedUser(user);
                         setMessage("Ваш аккаунт не подтвержден. Пожалуйста, проверьте вашу почту (включая папку \"Спам\") и перейдите по ссылке.");
                         setLoading(false);
                         return; 
                    }
                }

            } else { // Registration
                if (!companyName) throw new Error("Пожалуйста, укажите название компании.");
                
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                await sendEmailVerification(userCredential.user);
                
                let newCompanyCode = generateCompanyCode();
                let codeExists = true;
                while (codeExists) {
                    const codeQuery = query(collection(db, 'user_profiles'), where('companyCode', '==', newCompanyCode));
                    const codeSnapshot = await getDocs(codeQuery);
                    if (codeSnapshot.empty) {
                        codeExists = false;
                    } else {
                        newCompanyCode = generateCompanyCode();
                    }
                }

                await setDoc(doc(db, 'user_profiles', userCredential.user.uid), {
                     role: 'admin',
                     adminId: userCredential.user.uid,
                     companyName: companyName,
                     companyCode: newCompanyCode
                });

                setMessage('Аккаунт создан! Пожалуйста, проверьте вашу почту (включая папку "Спам") и подтвердите email для завершения регистрации.');
                setIsLoginView(true);
            }
        } catch (err) {
            let msg = "Произошла ошибка.";
            if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
                 msg = "Неверный логин или пароль.";
            } else if (err.code === 'auth/email-already-in-use') {
                 msg = "Этот email уже используется.";
            } else if (err.message) {
                 msg = err.message;
            }
            setMessage(msg);
        } finally {
            if (!unverifiedUser) setLoading(false);
        }
    };

    return (
        <div className="flex h-screen items-center justify-center bg-[#F5F5F7] p-4">
            <div className="w-full max-w-sm bg-white p-8 sm:p-10 rounded-3xl sm:rounded-[40px] shadow-2xl ring-1 ring-black/5">
                <div className="flex justify-center mb-6"><div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center text-white shadow-lg"><Briefcase size={32} /></div></div>
                
                {message && (
                    <div className={`p-4 mb-4 text-sm rounded-lg text-center ${unverifiedUser || message.startsWith('Аккаунт создан') ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                        {message}
                        {unverifiedUser && (
                            <button onClick={handleResendVerification} className="font-bold underline mt-2 block w-full">Отправить письмо еще раз</button>
                        )}
                    </div>
                )}
                
                <form onSubmit={handleAuth} className="space-y-4">
                    <h3 className="text-center font-bold text-2xl tracking-tighter text-gray-800">{isLoginView ? 'Вход в систему' : 'Регистрация'}</h3>
                    {!isLoginView && <Input placeholder="Название компании" type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} required />}
                    <Input placeholder="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                    <Input placeholder="Пароль" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
                    <button type="submit" disabled={loading} className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold hover:bg-black transition-all shadow-lg uppercase tracking-widest text-xs">
                        {loading ? <Loader2 className="animate-spin mx-auto" /> : (isLoginView ? 'Войти' : 'Создать аккаунт')}
                    </button>
                    <div className="text-center pt-2 space-y-2">
                        <button type="button" onClick={() => { setIsLoginView(!isLoginView); setMessage(''); setUnverifiedUser(null); }} className="text-xs text-slate-400 font-bold hover:text-black uppercase tracking-widest">
                            {isLoginView ? 'Создать аккаунт компании' : 'Уже есть аккаунт? Войти'}
                        </button>
                        <button type="button" onClick={showClientLogin} className="text-xs text-blue-500 font-bold hover:text-blue-700 uppercase tracking-widest">
                           Войти как клиент
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function KanbanView({ stages, deals, clients, openDealModal, managers, userRole, onDragEnd, searchTerm, onSearchChange }) {
    const getClientName = (id) => clients.find(c => c.id === id)?.name || 'Без клиента';
    const getManagerName = (id) => managers.find(m => m.id === id)?.name || 'Не назначен';
    
    return (
        <div className="h-full flex flex-col">
             <div className="mb-4 relative">
                <Input 
                    value={searchTerm}
                    onChange={e => onSearchChange(e.target.value)} 
                    placeholder="Поиск..."
                    className="pl-10"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
            <DragDropContext onDragEnd={onDragEnd}>
                <div className="kanban-scroll flex-1 flex space-x-4 md:space-x-6 overflow-x-auto pb-6 items-start snap-x snap-mandatory md:snap-none">
                    {stages.map(stage => (
                        <Droppable key={stage.id} droppableId={stage.id}>
                            {(provided, snapshot) => (
                                <div
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    className={`flex-shrink-0 w-[90vw] sm:w-80 flex flex-col max-h-full bg-slate-200/20 rounded-3xl p-2 border border-slate-100 shadow-inner transition-colors snap-center ${snapshot.isDraggingOver ? 'bg-blue-50' : ''}`}
                                >
                                    <div className="flex justify-between items-center mb-3 px-4 pt-3 shrink-0">
                                        <h3 className="font-bold text-slate-900 text-[10px] uppercase tracking-widest opacity-40">{stage.name}</h3>
                                        <span className="text-slate-400 font-black text-[10px] bg-white px-2 py-0.5 rounded-full">{deals.filter(d=>d.stageId === stage.id).reduce((sum, d) => sum + Number(d.value || 0), 0).toLocaleString()} ₽</span>
                                    </div>
                                    <div className="flex-1 overflow-y-auto space-y-3 p-1 min-h-[150px] no-scrollbar">
                                        {deals.filter(d => d.stageId === stage.id).map((deal, index) => (
                                            <Draggable key={deal.id} draggableId={deal.id} index={index}>
                                                {(provided, snapshot) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                        onClick={() => openDealModal(deal)}
                                                        className={`bg-white p-4 sm:p-6 rounded-2xl sm:rounded-[28px] shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group ring-1 ring-black/[0.03] border border-transparent hover:border-blue-100 ${snapshot.isDragging ? 'shadow-lg scale-105' : ''}`}
                                                    >
                                                        <h4 className="font-bold sm:font-black text-slate-800 leading-tight mb-2 text-sm">{deal.title}</h4>
                                                        <div className="text-[10px] font-bold sm:font-black text-blue-500 uppercase tracking-widest mb-3 opacity-60">{getClientName(deal.clientId)}</div>
                                                        
                                                        {userRole === 'admin' && deal.managerId && (
                                                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                                                                <UserCheck size={12}/> {getManagerName(deal.managerId)}
                                                            </div>
                                                        )}
                                                        
                                                        <div className="font-bold sm:font-black text-slate-900 text-xs mt-3">{Number(deal.value||0).toLocaleString()} ₽</div>
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </div>
                                     <button onClick={() => openDealModal(null, stage.id)} className="w-full mt-2 py-5 rounded-[24px] border-2 border-dashed border-slate-200 text-slate-300 hover:border-blue-400 hover:text-blue-500 transition-all text-[10px] font-black uppercase">Добавить проект</button>
                                </div>
                            )}
                        </Droppable>
                    ))}
                </div>
            </DragDropContext>
        </div>
    );
}

function ClientsView({ clients, setEditingClient, onRequestDelete, managers, userRole, searchTerm, onSearchChange }) {
     const getManagerName = (id) => managers.find(m => m.id === id)?.name || 'Не назначен';
     return (
        <div>
            <div className="mb-4 relative max-w-sm">
                 <Input 
                    value={searchTerm}
                    onChange={e => onSearchChange(e.target.value)} 
                    placeholder="Поиск..."
                    className="pl-10"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
            {/* Desktop Table */}
            <div className="hidden md:block bg-white rounded-[32px] shadow-lg overflow-x-auto">
                <table className="min-w-full">
                    <thead className="bg-gray-50">
                         <tr>
                            <th className="px-6 py-3 text-left text-xs font-black text-gray-500 uppercase tracking-widest">Имя</th>
                            <th className="px-6 py-3 text-left text-xs font-black text-gray-500 uppercase tracking-widest">Контакты</th>
                            {userRole === 'admin' && <th className="px-6 py-3 text-left text-xs font-black text-gray-500 uppercase tracking-widest">Менеджер</th>}
                            <th className="relative px-6 py-3"><span className="sr-only">Действия</span></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {clients.map(client => (
                            <tr key={client.id} className="hover:bg-gray-50/50">
                                <td className="px-6 py-4 whitespace-nowrap"><div className="font-bold text-sm text-gray-900">{client.name}</div></td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <div className="truncate">{client.email}</div>
                                    <div>{client.phone}</div>
                                </td>
                                {userRole === 'admin' && <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getManagerName(client.managerId)}</td>}
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                                    <button onClick={() => setEditingClient(client)} className="text-blue-600 hover:text-blue-900 font-bold">Карточка</button>
                                    <button onClick={() => onRequestDelete(client.id, 'client', client.name)} className="text-red-500 hover:text-red-700 font-bold">Удалить</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
                 {clients.map(client => (
                    <div key={client.id} className="bg-white rounded-2xl shadow-lg p-4 space-y-3">
                         <div className="font-bold text-lg text-gray-900">{client.name}</div>
                         <div className="text-sm text-gray-600">
                            <p className="truncate"><strong>Email:</strong> {client.email || '-'}</p>
                            <p><strong>Телефон:</strong> {client.phone || '-'}</p>
                         </div>
                        {userRole === 'admin' && (
                             <div className="text-sm text-gray-500 border-t pt-2"><strong>Менеджер:</strong> {getManagerName(client.managerId)}</div>
                        )}
                         <div className="flex justify-end gap-4 pt-2 border-t">
                            <button onClick={() => setEditingClient(client)} className="text-blue-600 font-bold text-sm">Карточка</button>
                            <button onClick={() => onRequestDelete(client.id, 'client', client.name)} className="text-red-500 font-bold text-sm">Удалить</button>
                        </div>
                    </div>
                 ))}
            </div>
        </div>
    );
}

function SettingsView({ user, appId, db, managers, companyCode, customFields, categories, stages, setStages, accounts, onAddManager, onDeleteManager }) {
     return (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 max-w-7xl mx-auto">
            <div className="lg:col-span-2 xl:col-span-1">
                <CompanyIdCard companyCode={companyCode}/>
                <TeamManager {...{managers, onAddManager, onDeleteManager}}/>
            </div>
             <div className="lg:col-span-2 xl:col-span-1">
                <StagesManager {...{adminId: user.uid, db, appId, stages, setStages}}/>
                <AccountsManager {...{adminId: user.uid, db, appId, accounts}}/>
            </div>
            <div className="lg:col-span-2 xl:col-span-1">
                <CategoriesManager {...{adminId: user.uid, db, appId, categories}}/>
                <CustomFieldsManager {...{adminId: user.uid, db, appId, customFields}}/>
            </div>
        </div>
    );
}

function DeletionRequestsView({ requests, onUpdateRequest, managers }) {
    const getManagerName = (id) => managers.find(m => m.id === id)?.name || id;

    const getRequestType = (type) => {
        switch(type) {
            case 'deal': return 'Проект';
            case 'transaction': return 'Операция';
            case 'client': return 'Клиент';
            default: return 'Объект';
        }
    }

    return (
        <div>
            {/* Desktop Table */}
            <div className="hidden md:block bg-white rounded-[32px] shadow-lg overflow-x-auto">
                <table className="min-w-full">
                    <thead className="bg-gray-50">
                            <tr>
                            <th className="px-6 py-3 text-left text-xs font-black text-gray-500 uppercase tracking-widest">Дата</th>
                            <th className="px-6 py-3 text-left text-xs font-black text-gray-500 uppercase tracking-widest">Тип</th>
                            <th className="px-6 py-3 text-left text-xs font-black text-gray-500 uppercase tracking-widest">Название/Описание</th>
                            <th className="px-6 py-3 text-left text-xs font-black text-gray-500 uppercase tracking-widest">Запросил</th>
                            <th className="px-6 py-3 text-left text-xs font-black text-gray-500 uppercase tracking-widest">Действия</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {requests.filter(r => r.status === 'pending').map(req => (
                            <tr key={req.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(req.createdAt?.toDate()).toLocaleString('ru-RU')}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-700">{getRequestType(req.itemType)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 truncate max-w-sm">{req.itemName}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getManagerName(req.requestedBy)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                                    <button onClick={() => onUpdateRequest(req, 'approved')} className="px-3 py-1 text-xs font-bold text-white bg-green-500 rounded-full hover:bg-green-600">Одобрить</button>
                                    <button onClick={() => onUpdateRequest(req, 'denied')} className="px-3 py-1 text-xs font-bold text-white bg-red-500 rounded-full hover:bg-red-600">Отклонить</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {requests.filter(r => r.status === 'pending').length === 0 && <p className="text-center p-10 text-gray-400">Нет активных запросов на удаление.</p>}
            </div>
            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
                {requests.filter(r => r.status === 'pending').map(req => (
                    <div key={req.id} className="bg-white rounded-2xl shadow-lg p-4 space-y-3">
                        <div className="font-bold text-lg text-gray-900 truncate">{req.itemName}</div>
                        <div className="text-sm text-gray-600">
                            <p><strong>Тип:</strong> {getRequestType(req.itemType)}</p>
                            <p><strong>Дата:</strong> {new Date(req.createdAt?.toDate()).toLocaleString('ru-RU')}</p>
                            <p><strong>Запросил:</strong> {getManagerName(req.requestedBy)}</p>
                        </div>
                        <div className="flex justify-end gap-2 pt-2 border-t">
                            <button onClick={() => onUpdateRequest(req, 'approved')} className="px-4 py-2 text-xs font-bold text-white bg-green-500 rounded-lg hover:bg-green-600">Одобрить</button>
                            <button onClick={() => onUpdateRequest(req, 'denied')} className="px-4 py-2 text-xs font-bold text-white bg-red-500 rounded-lg hover:bg-red-600">Отклонить</button>
                        </div>
                    </div>
                ))}
                 {requests.filter(r => r.status === 'pending').length === 0 && <p className="text-center p-10 text-gray-400">Нет активных запросов на удаление.</p>}
            </div>
        </div>
    );
}

function FinancesView ({ transactions, accounts, categories, managers, userRole, onEditTransaction, onRequestDelete, searchTerm, onSearchChange, selectedAccount, onAccountChange }) {
    const getCategoryName = (id) => categories.find(c => c.id === id)?.name || <span className="text-gray-400">Без категории</span>;
    const getAccountName = (id) => accounts.find(a => a.id === id)?.name || <span className="text-gray-400">Без счета</span>;
    const getManagerName = (id) => managers.find(m => m.id === id)?.name || id;

    const { actualIncome, actualExpense, plannedExpense, actualBalance } = useMemo(() => {
        let actualIncome = 0;
        let actualExpense = 0;
        let plannedExpense = 0;

        transactions.forEach(t => {
            if (t.status === 'planned') {
                if (t.type === 'expense') {
                    plannedExpense += t.amount;
                }
            } else { // actual
                if (t.type === 'income') {
                    actualIncome += t.amount;
                } else {
                    actualExpense += t.amount;
                }
            }
        });
        const actualBalance = actualIncome - actualExpense;
        return { actualIncome, actualExpense, plannedExpense, actualBalance };
    }, [transactions]);


    return (
        <div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="p-4 sm:p-6 bg-white rounded-3xl shadow-lg">
                    <div className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Доходы (факт)</div>
                    <div className="text-2xl sm:text-3xl font-black text-green-500">{actualIncome.toLocaleString()} ₽</div>
                </div>
                <div className="p-4 sm:p-6 bg-white rounded-3xl shadow-lg">
                    <div className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Расходы (факт)</div>
                    <div className="text-2xl sm:text-3xl font-black text-red-500">{actualExpense.toLocaleString()} ₽</div>
                </div>
                <div className="p-4 sm:p-6 bg-white rounded-3xl shadow-lg">
                    <div className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Баланс (факт)</div>
                    <div className="text-2xl sm:text-3xl font-black text-gray-800">{actualBalance.toLocaleString()} ₽</div>
                </div>
                 <div className="p-4 sm:p-6 bg-white rounded-3xl shadow-lg">
                    <div className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Расходы (план)</div>
                    <div className="text-2xl sm:text-3xl font-black text-blue-500">{plannedExpense.toLocaleString()} ₽</div>
                </div>
            </div>

             <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <div className="flex-grow relative">
                    <Input 
                        value={searchTerm}
                        onChange={e => onSearchChange(e.target.value)} 
                        placeholder="Поиск..."
                        className="pl-10"
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
                <Select value={selectedAccount} onChange={e => onAccountChange(e.target.value)} className="sm:w-64">
                    <option value="all">Все счета</option>
                    {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </Select>
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block bg-white rounded-[32px] shadow-lg overflow-x-auto">
                <table className="min-w-full">
                    <thead className="bg-gray-50">
                         <tr>
                            <th className="px-6 py-3 text-left text-xs font-black text-gray-500 uppercase tracking-widest">Дата</th>
                            <th className="px-6 py-3 text-left text-xs font-black text-gray-500 uppercase tracking-widest">Сумма</th>
                            <th className="px-6 py-3 text-left text-xs font-black text-gray-500 uppercase tracking-widest">Категория</th>
                            <th className="px-6 py-3 text-left text-xs font-black text-gray-500 uppercase tracking-widest">Счет</th>
                            <th className="px-6 py-3 text-left text-xs font-black text-gray-500 uppercase tracking-widest">Описание</th>
                            {userRole === 'admin' && <th className="px-6 py-3 text-left text-xs font-black text-gray-500 uppercase tracking-widest">Создал</th>}
                            <th className="px-6 py-3 text-left text-xs font-black text-gray-500 uppercase tracking-widest">Действия</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {transactions.map(t => (
                            <tr key={t.id} className={`hover:bg-gray-50/50 ${t.status === 'planned' ? 'opacity-60' : ''}`}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <div className="flex items-center gap-2">
                                        {t.status === 'planned' && <Clock size={14} className="text-blue-500" />}
                                        {new Date(t.date).toLocaleDateString('ru-RU')}
                                    </div>
                                </td>
                                <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                    {t.type === 'income' ? '+' : '-'} {t.amount.toLocaleString()} ₽
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{getCategoryName(t.categoryId)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{getAccountName(t.accountId)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 truncate max-w-xs">{t.description}</td>
                                {userRole === 'admin' && <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getManagerName(t.createdBy)}</td>}
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                   <div className="flex items-center gap-2">
                                     <button onClick={() => onEditTransaction(t)} className="p-1 hover:text-blue-600"><Pencil size={14}/></button>
                                     <button onClick={() => onRequestDelete(t.id, 'transaction', `Операция на ${t.amount} ₽`)} className="p-1 hover:text-red-600"><Trash2 size={14}/></button>
                                   </div>
                               </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {/* Mobile Cards */}
             <div className="md:hidden space-y-4">
                {transactions.map(t => (
                    <div key={t.id} className={`bg-white rounded-2xl shadow-lg p-4 space-y-2 ${t.status === 'planned' ? 'opacity-70' : ''}`}>
                        <div className="flex justify-between items-start">
                             <div className={`text-xl font-bold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>{t.type === 'income' ? '+' : '-'} {t.amount.toLocaleString()} ₽</div>
                             <div className="text-xs text-gray-500 flex items-center gap-1.5">
                                {t.status === 'planned' && <Clock size={12} className="text-blue-500" />}
                                {new Date(t.date).toLocaleDateString('ru-RU')}
                            </div>
                        </div>
                        <div className="text-sm text-gray-600 border-t pt-2 space-y-1">
                             <p className="truncate"><strong>Описание:</strong> {t.description || '-'}</p>
                             <p><strong>Категория:</strong> {getCategoryName(t.categoryId)}</p>
                             <p><strong>Счет:</strong> {getAccountName(t.accountId)}</p>
                              {userRole === 'admin' && <p><strong>Создал:</strong> {getManagerName(t.createdBy)}</p>}
                        </div>
                        <div className="flex justify-end gap-4 pt-2 border-t">
                            <button onClick={() => onEditTransaction(t)} className="text-blue-600 font-bold text-sm">Изменить</button>
                            <button onClick={() => onRequestDelete(t.id, 'transaction', `Операция на ${t.amount} ₽`)} className="text-red-500 font-bold text-sm">Удалить</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function TaskItem({ task, onToggle, onDelete }) {
    const [isExiting, setIsExiting] = useState(false);

    const handleToggle = () => {
        setIsExiting(true);
        setTimeout(() => {
            onToggle(task);
            setIsExiting(false); // Reset for re-appearing if un-toggled
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
                    <a href="#" onClick={(e) => { e.preventDefault(); /* Maybe navigate to deal in future */ }} className="text-xs text-blue-500 hover:underline block mt-1">
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

function TaskSection({ title, tasks, onToggle, onDelete, onClear }) {
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
}

function TasksView({ tasks, adminId, db, appId }) {
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
            
            if (taskDate < todayDate) { // Overdue tasks go to Today
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

function ClientLoginScreen({ onLoginSuccess, onBack }) {
    const [localCompanyCode, setLocalCompanyCode] = useState('');
    const [loginName, setLoginName] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (!localCompanyCode || !loginName || !password) {
            setError('Все поля должны быть заполнены.');
            setLoading(false);
            return;
        }

        try {
            const profilesRef = collection(db, 'user_profiles');
            const profilesQuery = query(profilesRef, where("companyCode", "==", localCompanyCode.toUpperCase()), where("role", "==", "admin"));
            const profilesSnapshot = await getDocs(profilesQuery);

            if (profilesSnapshot.empty) {
                setError('Компания с таким кодом не найдена.');
                setLoading(false);
                return;
            }
            const adminProfile = profilesSnapshot.docs[0].data();
            const adminId = adminProfile.adminId;

            const clientsRef = collection(db, 'artifacts', appId, 'users', adminId, 'clients');
            const q = query(clientsRef, where("loginName", "==", loginName), where("loginPassword", "==", password));
            
            const querySnapshot = await getDocs(q);

            if (querySnapshot.size === 1) {
                const clientDoc = querySnapshot.docs[0];
                onLoginSuccess({ id: clientDoc.id, adminId, ...clientDoc.data() });
            } else {
                setError('Неверное имя для входа или пароль.');
            }
        } catch (e) {
            setError('Произошла ошибка входа. Проверьте данные и попробуйте снова.');
            console.error("Client login error: ", e);
        }

        setLoading(false);
    }

     return (
        <div className="flex h-screen items-center justify-center bg-[#F5F5F7] p-4">
            <div className="w-full max-w-sm bg-white p-8 sm:p-10 rounded-3xl sm:rounded-[40px] shadow-2xl ring-1 ring-black/5">
                <div className="flex justify-center mb-6"><div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg"><User size={32} /></div></div>
                
                {error && (
                    <div className={`p-4 mb-4 text-sm rounded-lg text-center bg-red-100 text-red-800`}>
                        {error}
                    </div>
                )}
                
                <form onSubmit={handleLogin} className="space-y-4">
                    <h3 className="text-center font-bold text-2xl tracking-tighter text-gray-800">Вход для клиента</h3>
                    <Input placeholder="Код компании" type="text" value={localCompanyCode} onChange={e => setLocalCompanyCode(e.target.value)} required />
                    <Input placeholder="Имя для входа" type="text" value={loginName} onChange={e => setLoginName(e.target.value)} required />
                    <Input placeholder="Пароль" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
                    <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg uppercase tracking-widest text-xs">
                        {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Войти'}
                    </button>
                     <div className="text-center pt-2">
                        <button type="button" onClick={onBack} className="text-xs text-slate-400 font-bold hover:text-black uppercase tracking-widest">
                            Назад ко входу для сотрудников
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );

}


function ClientDealDetail({ deal, stages, transactions }) {
    const currentStageIdx = stages.findIndex(s => s.id === deal.stageId);
    const paidAmount = transactions
        .filter(t => t.dealId === deal.id && t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
    const remainingAmount = (deal.value || 0) - paidAmount;

    return (
        <div className="p-6 sm:p-8">
            <div className="space-y-6 mb-8 relative pl-6 border-l-2 border-slate-100 ml-3">
                {stages.map((s, i) => (
                    <div key={i} className="flex items-center gap-4 relative">
                        <div className={`absolute -left-[29px] w-6 h-6 rounded-full border-4 border-white shadow-sm flex items-center justify-center ${i <= currentStageIdx ? 'bg-blue-600' : 'bg-slate-200'}`}>
                            {i <= currentStageIdx && <Check size={12} className="text-white" />}
                        </div>
                        <div className={`text-sm font-medium ${i <= currentStageIdx ? 'text-slate-900 font-bold' : 'text-slate-400'}`}>{s.name}</div>
                    </div>
                ))}
            </div>
            <div className="bg-slate-50 p-4 sm:p-6 rounded-2xl">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                    <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-widest">Внесено</div>
                        <div className="text-xl sm:text-2xl font-black tracking-tight text-green-500">{paidAmount.toLocaleString()} ₽</div>
                    </div>
                    <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-widest">Остаток</div>
                        <div className="text-xl sm:text-2xl font-black tracking-tight text-red-500">{remainingAmount.toLocaleString()} ₽</div>
                    </div>
                    <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-widest">Общая сумма</div>
                        <div className="text-xl sm:text-2xl font-black tracking-tight text-slate-800">{Number(deal.value || 0).toLocaleString()} ₽</div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- MAIN APP ---
export default function App() {
    const [user, setUser] = useState(null);
    const [loadingAuth, setLoadingAuth] = useState(true);
    const [isClientLogin, setIsClientLogin] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('dashboard');
    
    // User & Data State
    const [userRole, setUserRole] = useState(null);
    const [adminId, setAdminId] = useState(null);
    const [managerDocId, setManagerDocId] = useState(null);
    const [loggedInClient, setLoggedInClient] = useState(null);
    const [companyCode, setCompanyCode] = useState(null);

    // Data
    const [stages, setStages] = useState([]);
    const [deals, setDeals] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [clients, setClients] = useState([]);
    const [categories, setCategories] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [customFields, setCustomFields] = useState([]);
    const [managers, setManagers] = useState([]);
    const [deletionRequests, setDeletionRequests] = useState([]);
    const [clientData, setClientData] = useState({ deals: [], stages: [], transactions: [] });

    // Search & Filter State
    const [dealSearch, setDealSearch] = useState('');
    const [clientSearch, setClientSearch] = useState('');
    const [financeSearch, setFinanceSearch] = useState('');
    const [selectedAccountId, setSelectedAccountId] = useState('all');

    // Modal State
    const [isDealModalOpen, setIsDealModalOpen] = useState(false);
    const [editingDeal, setEditingDeal] = useState(null);
    const [isClientModalOpen, setIsClientModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState(null);
    const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState(null);
    const [selectedClientDeal, setSelectedClientDeal] = useState(null);
    const [managerToDelete, setManagerToDelete] = useState(null);

    const openDealModal = (deal, stageId) => {
        const newDealDefaults = { stageId: stageId || (stages[0]?.id || '') };
        setEditingDeal(deal ? deal : newDealDefaults);
        setIsDealModalOpen(true);
    };
    const closeDealModal = () => {
        setIsDealModalOpen(false);
        setEditingDeal(null);
    };
    
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (u) => {
            if (u && u.emailVerified) {
                 const roleDocRef = doc(db, 'user_profiles', u.uid);
                 const roleDocSnap = await getDoc(roleDocRef);
                 
                 if (roleDocSnap.exists()) {
                     const roleData = roleDocSnap.data();
                     setUser(u);
                     setUserRole(roleData.role);
                     setAdminId(roleData.adminId);
                     setManagerDocId(roleData.managerDocId || null);

                     if (roleData.role === 'admin') {
                        // --- FIX FOR MISSING COMPANY CODE ---
                        if (!roleData.companyCode) {
                            console.log("Company code is missing. Generating a new one...");
                            let newCompanyCode = generateCompanyCode();
                            let codeExists = true;
                            while (codeExists) {
                                const codeQuery = query(collection(db, 'user_profiles'), where('companyCode', '==', newCompanyCode));
                                const codeSnapshot = await getDocs(codeQuery);
                                if (codeSnapshot.empty) {
                                    codeExists = false;
                                } else {
                                    newCompanyCode = generateCompanyCode();
                                }
                            }
                            await updateDoc(roleDocRef, { companyCode: newCompanyCode });
                            setCompanyCode(newCompanyCode);
                            console.log("New company code generated and saved:", newCompanyCode);
                        } else {
                            setCompanyCode(roleData.companyCode);
                        }
                     }
                 } else {
                     console.error("Verified user without profile found!");
                 }
            } else {
                setUser(null); setUserRole(null); setAdminId(null); setManagerDocId(null); 
                setCompanyCode(null);
                if (loggedInClient) setLoggedInClient(null);
                setIsClientLogin(false);
                setStages([]); setDeals([]); setTasks([]); setClients([]); setCategories([]); setAccounts([]);
                setTransactions([]); setCustomFields([]); setManagers([]); setDeletionRequests([]);
                setClientData({ deals: [], stages: [], transactions: [] });
            }
            setLoadingAuth(false);
        });
        return () => unsub();
    }, []);

     useEffect(() => {
        let subscriptions = [];
        let transactionsUnsub = null;
        
        const cleanup = () => {
            subscriptions.forEach(unsub => unsub && unsub());
            if(transactionsUnsub) transactionsUnsub();
        };

        if (adminId) {
            if (loggedInClient) {
                const getPath = (c) => collection(db, 'artifacts', appId, 'users', adminId, c);
                const dealsQuery = query(getPath('deals'), where('clientId', '==', loggedInClient.id));
                const dealsUnsub = onSnapshot(dealsQuery, snap => {
                     const clientDeals = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                     setClientData(prev => ({ ...prev, deals: clientDeals }));

                     const dealIds = clientDeals.map(d => d.id);
                     if (dealIds.length > 0) {
                        if (transactionsUnsub) transactionsUnsub();
                        const transactionsQuery = query(getPath('transactions'), where('dealId', 'in', dealIds));
                        transactionsUnsub = onSnapshot(transactionsQuery, transSnap => {
                             setClientData(prev => ({ ...prev, transactions: transSnap.docs.map(d => ({id: d.id, ...d.data()})) }));
                        });
                     } else {
                         setClientData(prev => ({ ...prev, transactions: [] }));
                     }
                });

                const stagesQuery = query(getPath('stages'), orderBy('order'));
                const stagesUnsub = onSnapshot(stagesQuery, snap => {
                     setClientData(prev => ({ ...prev, stages: snap.docs.map(d => ({ id: d.id, ...d.data() })) }));
                });

                subscriptions.push(dealsUnsub, stagesUnsub);
            
            } else if (userRole === 'admin' || userRole === 'manager') {
                const getPath = (c) => collection(db, 'artifacts', appId, 'users', adminId, c);
                const commonSubs = [
                    onSnapshot(query(getPath('stages'), orderBy('order')), s => setStages(s.docs.map(d => ({ id: d.id, ...d.data() })))) ,
                    onSnapshot(query(getPath('tasks'), orderBy('createdAt', 'desc')), s => setTasks(s.docs.map(d => ({id:d.id, ...d.data()})))),
                    onSnapshot(getPath('categories'), s => setCategories(s.docs.map(d => ({id:d.id, ...d.data()})))),
                    onSnapshot(getPath('accounts'), s => setAccounts(s.docs.map(d => ({id:d.id, ...d.data()})))),
                    onSnapshot(query(getPath('customFields'), orderBy('order')), s => setCustomFields(s.docs.map(d => ({id:d.id, ...d.data()})))),
                    onSnapshot(getPath('managers'), s => setManagers(s.docs.map(d => ({id:d.id, ...d.data()})))),
                ];

                const dataSubs = userRole === 'admin' ? [
                    onSnapshot(getPath('deals'), s => setDeals(s.docs.map(d => ({id:d.id, ...d.data()})))),
                    onSnapshot(getPath('clients'), s => setClients(s.docs.map(d => ({id:d.id, ...d.data()})))),
                    onSnapshot(getPath('transactions'), s => setTransactions(s.docs.map(d => ({id:d.id, ...d.data()})))),
                ] : [
                    onSnapshot(query(getPath('deals'), where('managerId', '==', managerDocId)), s => setDeals(s.docs.map(d => ({id:d.id, ...d.data()})))),
                    onSnapshot(query(getPath('clients'), where('managerId', '==', managerDocId)), s => setClients(s.docs.map(d => ({id:d.id, ...d.data()})))),
                    onSnapshot(getPath('transactions'), s => setTransactions(s.docs.map(d => ({id:d.id, ...d.data()})))), // filtered later
                ];

                subscriptions = [...commonSubs, ...dataSubs];

                 if (userRole === 'admin') {
                    subscriptions.push(onSnapshot(query(getPath('deletion_requests'), orderBy('createdAt', 'desc')), s => setDeletionRequests(s.docs.map(d => ({id: d.id, ...d.data()})))));
                }
            }
        }
        return cleanup;
    }, [adminId, userRole, loggedInClient, managerDocId]);

    useEffect(() => {
        if (selectedClientDeal && clientData.deals.length > 0) {
            const updatedDeal = clientData.deals.find(d => d.id === selectedClientDeal.id);
            if (updatedDeal && JSON.stringify(updatedDeal) !== JSON.stringify(selectedClientDeal)) {
                setSelectedClientDeal(updatedDeal);
            }
        }
    }, [clientData.deals, selectedClientDeal]);

    const visibleTransactions = useMemo(() => {
         if (userRole === 'admin') return transactions;
         if (userRole === 'manager') {
            const managerDealIds = new Set(deals.map(d => d.id));
            return transactions.filter(t => t.dealId && managerDealIds.has(t.dealId));
         }
         return [];
    }, [transactions, deals, userRole]);

    const getClientNameById = useCallback((id) => clients.find(c => c.id === id)?.name || '', [clients]);

    const filteredDeals = useMemo(() => {
        const searchLower = dealSearch.toLowerCase();
        return deals.filter(deal => {
            const inTitle = deal.title.toLowerCase().includes(searchLower);
            const inClient = getClientNameById(deal.clientId).toLowerCase().includes(searchLower);
            const inCustomFields = deal.customData && Object.values(deal.customData).some(val => String(val).toLowerCase().includes(searchLower));
            return inTitle || inClient || inCustomFields;
        });
    }, [dealSearch, deals, getClientNameById]);

    const filteredClients = useMemo(() => {
        const searchLower = clientSearch.toLowerCase();
        return clients.filter(client => 
            client.name.toLowerCase().includes(searchLower) ||
            (client.email && client.email.toLowerCase().includes(searchLower)) ||
            (client.phone && client.phone.includes(searchLower))
        );
    }, [clientSearch, clients]);

    const filteredTransactions = useMemo(() => {
        const searchLower = financeSearch.toLowerCase();
        return visibleTransactions
            .filter(t => selectedAccountId === 'all' || t.accountId === selectedAccountId)
            .filter(t => 
                t.description.toLowerCase().includes(searchLower) ||
                String(t.amount).includes(searchLower)
            );
    }, [financeSearch, visibleTransactions, selectedAccountId]);

    const handleSaveNewDeal = async (dealData) => {
        if (!dealData.title || !adminId) {
            alert("Название проекта - обязательное поле.");
            return;
        }
        const creatorId = userRole === 'manager' ? managerDocId : (userRole === 'admin' ? 'admin' : null);
        const newDealData = {
            ...dealData,
            createdBy: creatorId,
            createdAt: serverTimestamp(),
            stageUpdatedAt: serverTimestamp()
        };
        try {
            await addDoc(collection(db, 'artifacts', appId, 'users', adminId, 'deals'), newDealData);
            closeDealModal();
        } catch (e) {
            console.error("Ошибка создания проекта: ", e);
            alert("Не удалось создать проект.");
        }
    };

    const handleFileUpload = async (file, dealId, fieldId) => {
        if (!file || !dealId || !fieldId || !adminId) return;

        const filePath = `deal-files/${dealId}/${fieldId}/${file.name}`;
        const fileRef = ref(storage, filePath);
        
        await uploadBytes(fileRef, file);
        const downloadURL = await getDownloadURL(fileRef);

        const dealRef = doc(db, 'artifacts', appId, 'users', adminId, 'deals', dealId);
        await updateDoc(dealRef, {
            [`customData.${fieldId}`]: {
                name: file.name,
                url: downloadURL,
                path: filePath
            }
        });
         // This is a bit of a hack to force re-render in the modal
        setDeals(prev => prev.map(d => d.id === dealId ? {...d, customData: {...(d.customData || {}), [fieldId]: { name: file.name, url: downloadURL, path: filePath }}} : d));
    };

    const handleFileDelete = async (dealId, fieldId, filePath) => {
        if (!dealId || !fieldId || !filePath || !adminId) return;
        
        const fileRef = ref(storage, filePath);
        await deleteObject(fileRef);

        const dealRef = doc(db, 'artifacts', appId, 'users', adminId, 'deals', dealId);
         await updateDoc(dealRef, {
            [`customData.${fieldId}`]: deleteField()
        });
        // This is a bit of a hack to force re-render in the modal
        setDeals(prev => prev.map(d => {
            if (d.id === dealId) {
                const newCustomData = {...d.customData};
                delete newCustomData[fieldId];
                return {...d, customData: newCustomData};
            }
            return d;
        }));
    };


    const handleAddManager = async ({ name, email, password }) => {
        if (!name || !email || !password || !adminId) return alert("Заполните все поля");

        let tempAuth;
        try {
            const tempApp = initializeApp(firebaseConfig, `temp-manager-${Date.now()}`);
            tempAuth = getAuth(tempApp);
            const userCredential = await createUserWithEmailAndPassword(tempAuth, email, password);
            const newManagerUser = userCredential.user;

            await sendEmailVerification(newManagerUser);

            const managerRef = await addDoc(collection(db, 'artifacts', appId, 'users', adminId, 'managers'), {
                name, email, uid: newManagerUser.uid
            });

            await setDoc(doc(db, 'user_profiles', newManagerUser.uid), {
                role: 'manager', adminId: adminId, managerDocId: managerRef.id
            });

            console.log(`Менеджер ${name} добавлен. Ему на почту отправлено письмо для подтверждения аккаунта.`);
        } catch (error) {
            alert("Ошибка добавления менеджера: " + error.message);
        } finally {
            if (tempAuth) await tempAuth.signOut();
        }
    };

    const handleReassignAndeleteManager = async (manager, newManagerId) => {
        const dealsRef = collection(db, 'artifacts', appId, 'users', adminId, 'deals');
        const q = query(dealsRef, where('managerId', '==', manager.id));

        try {
            const dealsSnapshot = await getDocs(q);
            const batch = writeBatch(db);

            dealsSnapshot.forEach(dealDoc => {
                batch.update(dealDoc.ref, { managerId: newManagerId === 'none' ? '' : newManagerId });
            });
            
            if(manager.uid) {
                 batch.delete(doc(db, 'user_profiles', manager.uid));
            }
            batch.delete(doc(db, 'artifacts', appId, 'users', adminId, 'managers', manager.id));

            await batch.commit();
            console.log(`Менеджер ${manager.name} удален, все его проекты переданы.`);
            setManagerToDelete(null);
        } catch (e) {
            alert('Ошибка при передаче проектов и удалении: ' + e.message);
        }
    }

     const handleRequestDelete = async (itemId, itemType, itemName) => {
        const isManager = userRole === 'manager';
        const itemRussian = itemType === 'deal' ? 'проект' : itemType === 'client' ? 'клиента' : 'операцию';
        const confirmationText = isManager 
            ? `Вы уверены, что хотите запросить удаление?`
            : `Вы уверены, что хотите удалить ${itemRussian}? Это действие необратимо.`;
        
        if (!confirm(confirmationText)) return;

        if (isManager) {
            const request = {
                itemId,
                itemType,
                itemName,
                requestedBy: managerDocId,
                status: 'pending',
                createdAt: serverTimestamp()
            };
            await addDoc(collection(db, 'artifacts', appId, 'users', adminId, 'deletion_requests'), request);
            console.log('Запрос на удаление отправлен администратору.');
            if (itemType === 'deal') closeDealModal();
        } else { // Admin
            let collectionName = itemType === 'deal' ? 'deals' : itemType === 'client' ? 'clients' : 'transactions';
            await deleteDoc(doc(db, 'artifacts', appId, 'users', adminId, collectionName, itemId));
            if (itemType === 'deal') closeDealModal();
            console.log(`${itemRussian.charAt(0).toUpperCase() + itemRussian.slice(1)} успешно удален(а).`);
        }
    };

    const handleUpdateRequest = async (request, newStatus) => {
        const requestRef = doc(db, 'artifacts', appId, 'users', adminId, 'deletion_requests', request.id);
        if (newStatus === 'approved') {
            try {
                const collectionName = request.itemType === 'deal' ? 'deals' : request.itemType === 'client' ? 'clients' : 'transactions';
                const itemRef = doc(db, 'artifacts', appId, 'users', adminId, collectionName, request.itemId);
                
                const dealTransactionRef = request.itemType === 'transaction' && request.dealId
                    ? doc(db, 'artifacts', appId, 'users', adminId, 'deals', request.dealId, 'transactions', request.itemId) 
                    : null;

                const batch = writeBatch(db);
                batch.delete(itemRef);
                if(dealTransactionRef) batch.delete(dealTransactionRef);
                batch.update(requestRef, { status: newStatus });
                await batch.commit();

                console.log('Запрос одобрен и объект удален.');
            } catch(e) {
                alert("Ошибка при удалении: " + e.message);
                await updateDoc(requestRef, { status: 'failed' });
            }
        } else { // denied
            await updateDoc(requestRef, { status: newStatus });
            console.log('Запрос отклонен.');
        }
    }
    
    const handleDragEnd = async (result) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;
        if (destination.droppableId === source.droppableId && destination.index === source.index) return;

        const dealRef = doc(db, 'artifacts', appId, 'users', adminId, 'deals', draggableId);
        await updateDoc(dealRef, { stageId: destination.droppableId, stageUpdatedAt: serverTimestamp() });
    };

    const handleClientLogin = (client) => {
        setLoggedInClient(client);
        setAdminId(client.adminId);
        setIsClientLogin(false);
    }


    if (loadingAuth) return <div className="h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-blue-600" size={48}/></div>;

    if (!user && !loggedInClient) {
        if (isClientLogin) {
            return <ClientLoginScreen onLoginSuccess={handleClientLogin} onBack={() => setIsClientLogin(false)} />;
        }
        return <AuthScreen auth={auth} db={db} appId={appId} showClientLogin={() => setIsClientLogin(true)} />;
    }

    if (loggedInClient) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6">
                <div className="w-full max-w-4xl bg-white rounded-[32px] p-6 sm:p-8 shadow-xl animate-in zoom-in duration-300">
                    <div className="flex justify-between items-center mb-6 sm:mb-8">
                        <h1 className="text-xl sm:text-2xl font-black truncate pr-4">Мои заказы - {loggedInClient.name}</h1>
                        <button onClick={() => { setLoggedInClient(null); setAdminId(null); }} className="text-red-500 font-bold uppercase text-[10px]">Выход</button>
                    </div>
                    <div className="space-y-4">
                        {clientData.deals.length > 0 ? clientData.deals.map(deal => (
                             <div key={deal.id} onClick={() => setSelectedClientDeal(deal)} className="bg-gray-50 hover:bg-gray-100 p-4 sm:p-6 rounded-2xl cursor-pointer transition-all flex justify-between items-center">
                                <div>
                                    <h2 className="font-bold text-lg text-gray-800">{deal.title}</h2>
                                    <p className="text-sm text-gray-500">Бюджет: {Number(deal.value || 0).toLocaleString()} ₽</p>
                                </div>
                                <ChevronRight className="text-gray-400"/>
                            </div>
                        )) : <p className="text-center text-gray-400 py-10">У вас пока нет заказов.</p>}
                    </div>
                </div>

                {selectedClientDeal && (
                    <Modal 
                        title={selectedClientDeal.title}
                        onClose={() => setSelectedClientDeal(null)}
                        width="max-w-3xl"
                    >
                        <ClientDealDetail 
                            deal={selectedClientDeal} 
                            stages={clientData.stages} 
                            transactions={clientData.transactions} 
                        />
                    </Modal>
                )}
            </div>
        );
    }
    
    function DashboardView({ deals, tasks, stages, clients, managers, userRole, openDealModal }) {
        const getStageName = (id) => stages.find(s => s.id === id)?.name || 'Неизвестно';
        const getClientName = (id) => clients.find(c => c.id === id)?.name || 'Без клиента';
        const getManagerName = (id) => managers.find(m => m.id === id)?.name || 'Не назначен';

        const { stuckDeals, upcomingTasks } = useMemo(() => {
            const fiveDaysAgo = new Date();
            fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

            const stuck = deals.filter(deal => 
                deal.stageUpdatedAt && deal.stageUpdatedAt.toDate() < fiveDaysAgo
            );

            const now = new Date();
            const todayDate = now.setHours(0, 0, 0, 0);
            const sevenDaysFromNow = new Date(todayDate).setDate(new Date(todayDate).getDate() + 7);
            
            const upcoming = tasks.filter(task => {
                if(task.completed) return false;
                if(!task.deadline) return false;
                const taskDate = new Date(task.deadline).setHours(0, 0, 0, 0);
                return taskDate <= sevenDaysFromNow;
            }).sort((a,b) => new Date(a.deadline) - new Date(b.deadline));

            return { stuckDeals: stuck, upcomingTasks: upcoming };
        }, [deals, tasks]);

        return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                    <h2 className="text-xl font-black text-gray-800 mb-4 flex items-center gap-2"><Layers size={20} className="text-orange-500"/> Зависшие проекты</h2>
                    <div className="bg-white rounded-[32px] shadow-lg p-4 space-y-3">
                        {stuckDeals.length > 0 ? stuckDeals.map(deal => (
                            <div key={deal.id} onClick={() => openDealModal(deal)} className="p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 cursor-pointer">
                                <h4 className="font-bold text-gray-800">{deal.title}</h4>
                                <p className="text-xs text-gray-500">Клиент: {getClientName(deal.clientId)}</p>
                                <p className="text-xs text-red-500 font-semibold">На этапе "{getStageName(deal.stageId)}" с {deal.stageUpdatedAt.toDate().toLocaleDateString('ru-RU')}</p>
                                {userRole === 'admin' && <p className="text-xs text-gray-400">Менеджер: {getManagerName(deal.managerId)}</p>}
                            </div>
                        )) : <p className="text-center p-8 text-gray-400">Нет проектов, требующих внимания.</p>}
                    </div>
                </div>
                <div>
                     <h2 className="text-xl font-black text-gray-800 mb-4 flex items-center gap-2"><ListTodo size={20} className="text-blue-500"/> Ближайшие задачи</h2>
                     <div className="bg-white rounded-[32px] shadow-lg p-4 space-y-3">
                         {upcomingTasks.length > 0 ? upcomingTasks.map(task => (
                            <div key={task.id} className="p-4 bg-gray-50 rounded-2xl">
                                <p className="font-semibold text-gray-800">{task.text}</p>
                                {task.deadline && (
                                     <div className="text-xs text-amber-600 font-bold flex items-center gap-1.5 mt-1">
                                        <Calendar size={12}/> Срок: {new Date(task.deadline).toLocaleDateString('ru-RU')}
                                    </div>
                                )}
                            </div>
                         )) : <p className="text-center p-8 text-gray-400">Нет задач на ближайшее время.</p>}
                    </div>
                </div>
            </div>
        );
    }
    
    return (
        <div className="flex h-screen overflow-hidden relative selection:bg-blue-100">
             {isSidebarOpen && <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-black/30 z-40 md:hidden"></div>}
            <aside className={`group/aside transition-all duration-300 ease-in-out glass flex flex-col shrink-0 border-r border-slate-200/50 md:relative fixed h-full z-50 bg-white/80 backdrop-blur-lg
                ${isSidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64 md:translate-x-0 md:w-20 md:hover:w-64'}`}>
                <div className="h-20 flex items-center justify-center md:justify-start md:px-8 border-b border-slate-100 shrink-0">
                    <div className="bg-slate-900 p-2 rounded-2xl text-white shadow-lg shrink-0"><Briefcase size={24}/></div>
                    <span className={`ml-3 font-black text-xl lg:text-2xl tracking-tighter uppercase transition-opacity duration-300 whitespace-nowrap 
                        ${isSidebarOpen ? 'opacity-100' : 'opacity-0 md:group-hover/aside:opacity-100'}`}>ProCRM</span>
                </div>
                <nav className="flex-1 mt-10 px-4 space-y-1">
                    <NavItem icon={<Home size={22}/>} label="Дашборд" active={activeTab === 'dashboard'} onClick={()=>{setActiveTab('dashboard'); setIsSidebarOpen(false);}} isSidebarOpen={isSidebarOpen} />
                    <NavItem icon={<LayoutDashboard size={22}/>} label="Проекты" active={activeTab === 'kanban'} onClick={()=>{setActiveTab('kanban'); setIsSidebarOpen(false);}} isSidebarOpen={isSidebarOpen} />
                    {userRole === 'admin' && <NavItem icon={<Wallet size={22}/>} label="Финансы" active={activeTab === 'finances'} onClick={()=>{setActiveTab('finances'); setIsSidebarOpen(false);}} isSidebarOpen={isSidebarOpen} />}
                    <NavItem icon={<ListTodo size={22}/>} label="Задачи" active={activeTab === 'tasks'} onClick={()=>{setActiveTab('tasks'); setIsSidebarOpen(false);}} isSidebarOpen={isSidebarOpen} />
                    <NavItem icon={<Users size={22}/>} label="Клиенты" active={activeTab === 'clients'} onClick={()=>{setActiveTab('clients'); setIsSidebarOpen(false);}} isSidebarOpen={isSidebarOpen} />
                    {userRole === 'admin' && <NavItem icon={<ShieldQuestion size={22}/>} label="Запросы" active={activeTab === 'requests'} onClick={()=>{setActiveTab('requests'); setIsSidebarOpen(false);}} badge={deletionRequests.filter(r=>r.status === 'pending').length} isSidebarOpen={isSidebarOpen}/>}
                    {userRole === 'admin' && <NavItem icon={<Settings size={22}/>} label="Система" active={activeTab === 'settings'} onClick={()=>{setActiveTab('settings'); setIsSidebarOpen(false);}} isSidebarOpen={isSidebarOpen} />}
                </nav>
                <div className="p-4 border-t border-slate-100 text-center shrink-0">
                    <button onClick={()=>signOut(auth)} className="text-slate-400 hover:text-red-500 transition-colors font-black text-[10px] flex items-center justify-center gap-1 w-full py-4 hover:bg-red-50 rounded-2xl uppercase tracking-widest">
                        <LogOut size={16}/> 
                        <span className={`transition-opacity duration-300 ml-2 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 md:group-hover/aside:opacity-100'}`}>Выход</span>
                    </button>
                </div>
            </aside>

            <div className="flex-1 flex flex-col min-w-0 bg-[#F5F5F7]">
                <header className="h-20 flex items-center justify-between px-4 sm:px-10 shrink-0 bg-white/50 backdrop-blur-md z-10 border-b">
                    <div className="flex items-center gap-2">
                        <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 -ml-2"><Menu /></button>
                        <h1 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight uppercase truncate">{TAB_NAMES[activeTab]}</h1>
                    </div>
                     <div className="flex items-center gap-2 sm:gap-4">
                        {activeTab === 'kanban' && <PrimaryBtn onClick={() => openDealModal(null)} className="!px-3 sm:!px-5"><Plus size={18}/> <span className="hidden sm:inline">Проект</span></PrimaryBtn>}
                        {activeTab === 'finances' && userRole === 'admin' && <PrimaryBtn onClick={()=> { setEditingTransaction(null); setIsTransactionModalOpen(true);}} className="bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100 !px-3 sm:!px-5"><Plus size={18}/> <span className="hidden sm:inline">Операция</span></PrimaryBtn>}
                        {activeTab === 'clients' && <PrimaryBtn onClick={()=>{setEditingClient(null); setIsClientModalOpen(true);}} className="bg-blue-600 hover:bg-blue-700 shadow-blue-100 !px-3 sm:!px-5"><Plus size={18}/> <span className="hidden sm:inline">Клиент</span></PrimaryBtn>}
                    </div>
                </header>
                <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-10 pt-4 relative no-scrollbar">
                   {activeTab === 'dashboard' && <DashboardView deals={deals} tasks={tasks} stages={stages} clients={clients} managers={managers} userRole={userRole} openDealModal={openDealModal} />}
                   {activeTab === 'kanban' && <KanbanView stages={stages} deals={filteredDeals} clients={clients} openDealModal={openDealModal} managers={managers} userRole={userRole} onDragEnd={handleDragEnd} searchTerm={dealSearch} onSearchChange={setDealSearch} />}
                   {activeTab === 'finances' && userRole === 'admin' && <FinancesView transactions={filteredTransactions} accounts={accounts} categories={categories} managers={managers} userRole={userRole} onEditTransaction={(t) => {setEditingTransaction(t); setIsTransactionModalOpen(true);}} onRequestDelete={handleRequestDelete} searchTerm={financeSearch} onSearchChange={setFinanceSearch} selectedAccount={selectedAccountId} onAccountChange={setSelectedAccountId} />}
                   {activeTab === 'requests' && userRole === 'admin' && <DeletionRequestsView requests={deletionRequests} onUpdateRequest={handleUpdateRequest} managers={managers} />}
                   {activeTab === 'tasks' && <TasksView tasks={tasks} adminId={adminId} db={db} appId={appId} />}
                   {activeTab === 'clients' && <ClientsView clients={filteredClients} setEditingClient={(c)=>{setEditingClient(c); setIsClientModalOpen(true);}} onRequestDelete={handleRequestDelete} managers={managers} userRole={userRole} searchTerm={clientSearch} onSearchChange={setClientSearch} />}
                   {userRole === 'admin' && activeTab === 'settings' && <SettingsView user={user} appId={appId} db={db} managers={managers} companyCode={companyCode} customFields={customFields} categories={categories} stages={stages} setStages={setStages} accounts={accounts} onAddManager={handleAddManager} onDeleteManager={(m) => setManagerToDelete(m)} />}
                </main>
            </div>
            
            {isDealModalOpen && 
                <Modal 
                    title={editingDeal?.id ? 'Карточка проекта' : 'Новый проект'}
                    onClose={closeDealModal}
                    width={'max-w-5xl'}
                >
                    <DealCard 
                        deal={editingDeal} 
                        onClose={closeDealModal}
                        onSaveNewDeal={handleSaveNewDeal}
                        onRequestDelete={handleRequestDelete}
                        onFileUpload={handleFileUpload}
                        onFileDelete={handleFileDelete}
                        clients={clients} 
                        {...{adminId, db, appId, managers, stages, customFields, userRole, managerDocId, user, accounts, categories, tasks}}
                    />
                </Modal>
            }

            {managerToDelete && 
                <ReassignModal 
                    manager={managerToDelete} 
                    otherManagers={managers.filter(m => m.id !== managerToDelete.id)}
                    onConfirm={handleReassignAndeleteManager}
                    onCancel={() => setManagerToDelete(null)}
                />
            }

            {isClientModalOpen && <Modal title={editingClient ? "Карточка клиента" : "Новый клиент"} onClose={()=>{setIsClientModalOpen(false); setEditingClient(null);}}><ClientForm client={editingClient} onClose={()=>{setIsClientModalOpen(false); setEditingClient(null);}} {...{adminId, managerDocId, userRole}} /></Modal>}
            {isTransactionModalOpen && <Modal title={editingTransaction ? "Редактировать операцию" : "Новая операция"} onClose={()=>{setIsTransactionModalOpen(false); setEditingTransaction(null);}}><TransactionForm onClose={()=>{setIsTransactionModalOpen(false); setEditingTransaction(null);}} {...{adminId, db, appId, categories, accounts, transaction: editingTransaction, managerDocId, userRole}} /></Modal>}
        </div>
    );
}
