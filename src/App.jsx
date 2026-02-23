import React, { useState, useEffect, useCallback, useMemo } from 'react';
import * as Lucide from 'lucide-react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, onSnapshot, doc, addDoc, updateDoc, deleteDoc, serverTimestamp, setDoc, getDoc, query, where, orderBy, writeBatch, getDocs, deleteField } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { initializeApp } from 'firebase/app';
import { createUserWithEmailAndPassword, sendEmailVerification, getAuth } from 'firebase/auth';

import { auth, db, storage, appId, firebaseConfig } from './firebase';
import { useDebounce, TAB_NAMES, generateCompanyCode } from './utils';

// UI Components
import { PrimaryBtn, Modal } from './components/UI';
import { NavItem } from './components/NavItem';

// View Components
import { AuthScreen, ClientLoginScreen } from './components/AuthScreens';
import { DashboardView } from './components/DashboardView';
import { KanbanView } from './components/KanbanView';
import { FinancesView } from './components/FinancesView';
import { ClientsView } from './components/ClientsView';
import { TasksView } from './components/TasksView';
import { SettingsView } from './components/settings';
import { DeletionRequestsView } from './components/DeletionRequestsView';
import { ClientForm } from './components/ClientForm';
import { DealCard } from './components/DealCard';
import { TransactionForm } from './components/TransactionForm';
import { ReassignModal } from './components/ReassignModal';
import { ClientDealDetail } from './components/ClientDealDetail';
import { PasswordChangeModal } from './components/PasswordChangeModal';

const { 
    LayoutDashboard, Users, Wallet, Settings, Briefcase, 
    LogOut, Plus, Menu, Home, ShieldQuestion, ListTodo, ChevronRight, Loader2
} = Lucide; // Reduced Lucide imports

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
    const [isPasswordChangeModalOpen, setIsPasswordChangeModalOpen] = useState(false);


    const openDealModal = (deal, stageId) => {
        setEditingDeal(deal ? deal : { stageId: stageId || (stages[0]?.id || '') });
        setIsDealModalOpen(true);
    };
    const closeDealModal = () => { setIsDealModalOpen(false); setEditingDeal(null); };
    
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (u) => {
            if (u && u.emailVerified) {
                const userProfileRef = doc(db, 'user_profiles', u.uid);
                const roleDocSnap = await getDoc(userProfileRef);

                if (roleDocSnap.exists()) {
                    const roleData = roleDocSnap.data();
                    const { role, adminId: userAdminId, managerDocId: userManagerDocId } = roleData;

                    setUser(u);
                    setUserRole(role);
                    setManagerDocId(userManagerDocId || null);

                    if (role === 'admin') {
                        setAdminId(u.uid); // Admin's ID is their own UID
                        if (!roleData.companyCode) {
                            const newCompanyCode = generateCompanyCode();
                            await updateDoc(userProfileRef, { companyCode: newCompanyCode });
                            setCompanyCode(newCompanyCode);
                        } else {
                            setCompanyCode(roleData.companyCode);
                        }
                    } else if (role === 'manager') {
                        setAdminId(userAdminId);
                        if (userAdminId) {
                            const adminProfileRef = doc(db, 'user_profiles', userAdminId);
                            const adminDocSnap = await getDoc(adminProfileRef);
                            if (adminDocSnap.exists()) {
                                setCompanyCode(adminDocSnap.data().companyCode);
                            }
                        }
                    }
                } else {
                    // Handle case where user exists in Auth but not in user_profiles
                    signOut(auth); // Log them out
                }
            } else {
                // Reset all state when user logs out or is not verified
                setUser(null); setUserRole(null); setAdminId(null); setManagerDocId(null); setCompanyCode(null);
                setLoggedInClient(null); setIsClientLogin(false);
                setStages([]); setDeals([]); setTasks([]); setClients([]); setCategories([]); setAccounts([]);
                setTransactions([]); setCustomFields([]); setManagers([]); setDeletionRequests([]);
            }
            setLoadingAuth(false);
        });

        return () => unsub();
    }, []);

    useEffect(() => {
        let subs = [];
        if (adminId) {
            const getPath = (c) => collection(db, 'artifacts', appId, 'users', adminId, c);
            if (loggedInClient) {
                subs.push(onSnapshot(query(getPath('deals'), where('clientId', '==', loggedInClient.id)), snap => {
                     const clientDeals = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                     setClientData(prev => ({ ...prev, deals: clientDeals }));
                     if (clientDeals.length > 0) {
                        onSnapshot(query(getPath('transactions'), where('dealId', 'in', clientDeals.map(d => d.id))), s => setClientData(prev => ({ ...prev, transactions: s.docs.map(d => ({id: d.id, ...d.data()})) })));
                     }
                }));
                subs.push(onSnapshot(query(getPath('stages'), orderBy('order')), s => setClientData(prev => ({ ...prev, stages: s.docs.map(d => ({ id: d.id, ...d.data() })) }))));
            } else if (userRole === 'admin' || userRole === 'manager') {
                subs.push(onSnapshot(query(getPath('stages'), orderBy('order')), s => setStages(s.docs.map(d => ({ id: d.id, ...d.data() })))) );
                subs.push(onSnapshot(query(getPath('tasks'), orderBy('createdAt', 'desc')), s => setTasks(s.docs.map(d => ({id:d.id, ...d.data()})))));
                subs.push(onSnapshot(getPath('categories'), s => setCategories(s.docs.map(d => ({id:d.id, ...d.data()})))));
                subs.push(onSnapshot(getPath('accounts'), s => setAccounts(s.docs.map(d => ({id:d.id, ...d.data()})))));
                subs.push(onSnapshot(query(getPath('customFields'), orderBy('order')), s => setCustomFields(s.docs.map(d => ({id:d.id, ...d.data()})))));
                subs.push(onSnapshot(getPath('managers'), s => setManagers(s.docs.map(d => ({id:d.id, ...d.data()})))));
                
                if (userRole === 'admin') {
                    subs.push(onSnapshot(getPath('deals'), s => setDeals(s.docs.map(d => ({id:d.id, ...d.data()})))));
                    subs.push(onSnapshot(getPath('clients'), s => setClients(s.docs.map(d => ({id:d.id, ...d.data()})))));
                    subs.push(onSnapshot(getPath('transactions'), s => setTransactions(s.docs.map(d => ({id:d.id, ...d.data()})))));
                    subs.push(onSnapshot(query(getPath('deletion_requests'), orderBy('createdAt', 'desc')), s => setDeletionRequests(s.docs.map(d => ({id: d.id, ...d.data()})))));
                } else {
                    subs.push(onSnapshot(query(getPath('deals'), where('managerId', '==', managerDocId)), s => setDeals(s.docs.map(d => ({id:d.id, ...d.data()})))));
                    subs.push(onSnapshot(query(getPath('clients'), where('managerId', '==', managerDocId)), s => setClients(s.docs.map(d => ({id:d.id, ...d.data()})))));
                    subs.push(onSnapshot(getPath('transactions'), s => setTransactions(s.docs.map(d => ({id:d.id, ...d.data()})))));
                }
            }
        }
        return () => subs.forEach(unsub => unsub());
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
        if (!adminId) return;
        const isManager = userRole === 'manager';
    
        if (isManager) {
            const confirmMessage = `Вы уверены, что хотите отправить запрос на удаление ${itemName}?
Это действие нельзя будет отменить.`
            if (window.confirm(confirmMessage)) {
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
                if (itemType === 'client') { setIsClientModalOpen(false); setEditingClient(null); }
                if (itemType === 'transaction') { setIsTransactionModalOpen(false); setEditingTransaction(null); }
            }
        } else { // Admin
            const itemRussian = itemType === 'deal' ? 'проект' : itemType === 'client' ? 'клиента' : itemType === 'transaction' ? 'операцию' : 'задачу';
            const confirmMessage = `Вы уверены, что хотите удалить ${itemRussian} \"${itemName}\"?`;
    
            if (window.confirm(confirmMessage)) {
                 const collectionName = itemType === 'deal' ? 'deals' 
                                    : itemType === 'client' ? 'clients' 
                                    : itemType === 'transaction' ? 'transactions'
                                    : 'tasks';
                await deleteDoc(doc(db, 'artifacts', appId, 'users', adminId, collectionName, itemId));
                console.log(`${itemType} успешно удален.`);
                if (itemType === 'deal') closeDealModal();
                if (itemType === 'client') { setIsClientModalOpen(false); setEditingClient(null); }
                if (itemType === 'transaction') { setIsTransactionModalOpen(false); setEditingTransaction(null); }
            }
        }
    };

    const handleUpdateRequest = async (request, newStatus) => {
        const requestRef = doc(db, 'artifacts', appId, 'users', adminId, 'deletion_requests', request.id);
        if (newStatus === 'approved') {
            try {
                const collectionName = request.itemType === 'deal' ? 'deals' 
                                    : request.itemType === 'client' ? 'clients' 
                                    : request.itemType === 'transaction' ? 'transactions'
                                    : 'tasks';
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
        return <AuthScreen showClientLogin={() => setIsClientLogin(true)} />;
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
                    {userRole !== 'client' && <NavItem icon={<Settings size={22}/>} label="Система" active={activeTab === 'settings'} onClick={()=>{setActiveTab('settings'); setIsSidebarOpen(false);}} isSidebarOpen={isSidebarOpen} />}
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
                   {activeTab === 'tasks' && <TasksView tasks={tasks} adminId={adminId} onRequestDelete={handleRequestDelete} userRole={userRole} />}
                   {activeTab === 'clients' && <ClientsView clients={filteredClients} setEditingClient={(c)=>{setEditingClient(c); setIsClientModalOpen(true);}} managers={managers} userRole={userRole} searchTerm={clientSearch} onSearchChange={setClientSearch} />}
                   {(userRole === 'admin' || userRole === 'manager') && activeTab === 'settings' && <SettingsView adminId={adminId} onDeleteManager={(manager) => setManagerToDelete(manager)} companyCode={companyCode} user={user} onPasswordChange={() => setIsPasswordChangeModalOpen(true)} userRole={userRole} onAddManager={handleAddManager} />}
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
                        {...{adminId, managers, stages, customFields, userRole, managerDocId, user, accounts, categories, tasks}}
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

            {isPasswordChangeModalOpen &&
                <Modal title="Смена пароля" onClose={() => setIsPasswordChangeModalOpen(false)}>
                    <PasswordChangeModal user={user} onClose={() => setIsPasswordChangeModalOpen(false)} />
                </Modal>
            }

            {isClientModalOpen && <Modal title={editingClient ? "Карточка клиента" : "Новый клиент"} onClose={()=>{setIsClientModalOpen(false); setEditingClient(null);}}><ClientForm client={editingClient} onClose={()=>{setIsClientModalOpen(false); setEditingClient(null);}} {...{adminId, managerDocId, userRole, companyCode, onRequestDelete: handleRequestDelete}} /></Modal>}
            {isTransactionModalOpen && <Modal title={editingTransaction ? "Редактировать операцию" : "Новая операция"} onClose={()=>{setIsTransactionModalOpen(false); setEditingTransaction(null);}}><TransactionForm onClose={()=>{setIsTransactionModalOpen(false); setEditingTransaction(null);}} {...{adminId, categories, accounts, transaction: editingTransaction, managerDocId, userRole}} /></Modal>}
        </div>
    );
}
