import React, { useState, useEffect, useCallback, useMemo } from 'react';
import * as Lucide from 'lucide-react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, onSnapshot, doc, addDoc, updateDoc, deleteDoc, serverTimestamp, setDoc, getDoc, query, where, orderBy, writeBatch, getDocs, deleteField } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { initializeApp } from 'firebase/app';
import { createUserWithEmailAndPassword, sendEmailVerification, getAuth } from 'firebase/auth';

import { auth, db, storage, appId, firebaseConfig } from './firebase';
import { useDebounce, TAB_NAMES, generateShortId } from './utils';

// UI Components
import { PrimaryBtn, Modal } from './components/UI';
import { NavItem } from './components/NavItem';

// View Components
import { AuthScreen } from './components/AuthScreens';
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
import { CommandBar } from './components/CommandBar';
import { ClientWelcome } from './components/ClientWelcome';


const { 
    LayoutDashboard, Users, Wallet, Settings, Briefcase, 
    LogOut, Plus, Menu, Home, ShieldQuestion, ListTodo, ChevronRight, Loader2, Bot
} = Lucide; 

export default function App() {
    const [user, setUser] = useState(null);
    const [loadingAuth, setLoadingAuth] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('dashboard');
    
    const [userRole, setUserRole] = useState(null);
    const [adminId, setAdminId] = useState(null);
    const [managerDocId, setManagerDocId] = useState(null);
    const [loggedInClient, setLoggedInClient] = useState(null);

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
    const [clientData, setClientData] = useState({ deals: [], stages: [], transactions: [], manager: null });

    const [dealSearch, setDealSearch] = useState('');
    const [clientSearch, setClientSearch] = useState('');
    const [financeSearch, setFinanceSearch] = useState('');
    const [selectedAccountId, setSelectedAccountId] = useState('all');

    const [isDealModalOpen, setIsDealModalOpen] = useState(false);
    const [editingDeal, setEditingDeal] = useState(null);
    const [isClientModalOpen, setIsClientModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState(null);
    const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState(null);
    const [selectedClientDeal, setSelectedClientDeal] = useState(null);
    const [managerToDelete, setManagerToDelete] = useState(null);
    const [isPasswordChangeModalOpen, setIsPasswordChangeModalOpen] = useState(false);
    const [isCommandBarOpen, setIsCommandBarOpen] = useState(false);


    const openDealModal = (deal, stageId) => {
        setEditingDeal(deal ? deal : { stageId: stageId || (stages[0]?.id || '') });
        setIsDealModalOpen(true);
    };
    const closeDealModal = () => { setIsDealModalOpen(false); setEditingDeal(null); };
    
    useEffect(() => {
        const handleClientLoginByShortId = async (shortId) => {
            setLoadingAuth(true);
            try {
                const allAdminsQuery = query(collection(db, 'user_profiles'), where('role', '==', 'admin'));
                const allAdminsSnapshot = await getDocs(allAdminsQuery);
                let foundClient = null;
                let clientAdminId = null;

                for (const adminDoc of allAdminsSnapshot.docs) {
                    clientAdminId = adminDoc.id;
                    const clientsRef = collection(db, 'artifacts', appId, 'users', clientAdminId, 'clients');
                    const q = query(clientsRef, where("shortId", "==", shortId));
                    const clientSnapshot = await getDocs(q);

                    if (!clientSnapshot.empty) {
                        const clientDoc = clientSnapshot.docs[0];
                        foundClient = { id: clientDoc.id, adminId: clientAdminId, ...clientDoc.data() };
                        break;
                    }
                }

                if (foundClient) {
                    handleClientLogin(foundClient);
                } else {
                    console.error("Client not found by shortId");
                    window.history.replaceState({}, document.title, "/");
                }
            } catch (e) {
                console.error("Error during client auto-login by shortId:", e);
                window.history.replaceState({}, document.title, "/");
            } finally {
                setLoadingAuth(false);
            }
        };

        const params = new URLSearchParams(window.location.search);
        const clientShortId = params.get('c');
        if (clientShortId) {
            handleClientLoginByShortId(clientShortId);
        } else {
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
                            setAdminId(u.uid);
                        } else if (role === 'manager') {
                            setAdminId(userAdminId);
                        }
                    } else {
                        signOut(auth);
                    }
                } else {
                    setUser(null); setUserRole(null); setAdminId(null); setManagerDocId(null);
                    setLoggedInClient(null);
                    setStages([]); setDeals([]); setTasks([]); setClients([]); setCategories([]); setAccounts([]);
                    setTransactions([]); setCustomFields([]); setManagers([]); setDeletionRequests([]);
                }
                setLoadingAuth(false);
            });
            return () => unsub && unsub();
        }
    }, []);


    useEffect(() => {
        let subs = [];
        if (adminId) {
            const getPath = (c) => collection(db, 'artifacts', appId, 'users', adminId, c);
            
            if (loggedInClient) {
                // Client is logged in
                subs.push(onSnapshot(query(getPath('deals'), where('clientId', '==', loggedInClient.id)), snap => {
                    const clientDeals = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                    setClientData(prev => ({ ...prev, deals: clientDeals }));
                    
                    if (clientDeals.length > 0) {
                        onSnapshot(query(getPath('transactions'), where('dealId', 'in', clientDeals.map(d => d.id))), s => 
                            setClientData(prev => ({ ...prev, transactions: s.docs.map(d => ({id: d.id, ...d.data()})) }))
                        );
                    }
                }));
    
                subs.push(onSnapshot(query(getPath('stages'), orderBy('order')), s => {
                    const stagesData = s.docs.map(d => ({ id: d.id, ...d.data(), title: d.data().title || d.data().name }));
                    setClientData(prev => ({ ...prev, stages: stagesData }));
                }));

                if (loggedInClient.managerId) {
                    subs.push(onSnapshot(doc(getPath('managers'), loggedInClient.managerId), docSnap => {
                        if (docSnap.exists()) {
                            setClientData(prev => ({ ...prev, manager: docSnap.data() }));
                        }
                    }));
                }

            } else if (userRole === 'admin' || userRole === 'manager') {
                // Admin or Manager is logged in
                subs.push(onSnapshot(query(getPath('stages'), orderBy('order')), s => {
                    const stagesData = s.docs.map(d => ({ id: d.id, title: d.data().title || d.data().name, order: d.data().order }));
                    setStages(stagesData);
                }));
                subs.push(onSnapshot(query(getPath('tasks'), orderBy('createdAt', 'desc')), s => setTasks(s.docs.map(d => ({id:d.id, ...d.data()})))));
                subs.push(onSnapshot(getPath('categories'), s => setCategories(s.docs.map(d => ({id:d.id, ...d.data()})))));
                subs.push(onSnapshot(getPath('accounts'), s => setAccounts(s.docs.map(d => ({id:d.id, ...d.data()})))));
                subs.push(onSnapshot(query(getPath('customFields'), orderBy('order')), s => setCustomFields(s.docs.map(d => ({id:d.id, ...d.data()})))));
                subs.push(onSnapshot(getPath('managers'), s => setManagers(s.docs.map(d => ({id:d.id, ...d.data()})))));
                
                const commonQueryModifier = userRole === 'manager' ? [where('managerId', '==', managerDocId)] : [];
                
                subs.push(onSnapshot(query(getPath('deals'), ...commonQueryModifier), s => setDeals(s.docs.map(d => ({id:d.id, ...d.data()})))));
                subs.push(onSnapshot(query(getPath('clients'), ...commonQueryModifier), s => setClients(s.docs.map(d => ({id:d.id, ...d.data()})))));
                subs.push(onSnapshot(getPath('transactions'), s => setTransactions(s.docs.map(d => ({id:d.id, ...d.data()})))));

                if (userRole === 'admin') {
                    subs.push(onSnapshot(query(getPath('deletion_requests'), orderBy('createdAt', 'desc')), s => setDeletionRequests(s.docs.map(d => ({id: d.id, ...d.data()})))));
                }
            }
        }
        return () => subs.forEach(unsub => unsub());
    }, [adminId, userRole, loggedInClient, managerDocId]);


    const handleSaveClient = async (clientData) => {
        const {id, ...dataToSave} = clientData;
        const clientCollection = collection(db, 'artifacts', appId, 'users', adminId, 'clients');

        // Clean up data before saving
        const finalData = { ...dataToSave };
        delete finalData.email; // Ensure old fields are removed
        delete finalData.company;

        try {
            if (id) {
                const clientRef = doc(clientCollection, id);
                await updateDoc(clientRef, finalData);
            } else {
                const shortId = generateShortId();
                finalData.shortId = shortId;
                await addDoc(clientCollection, { ...finalData, createdAt: serverTimestamp(), adminId });
            }
            setIsClientModalOpen(false);
            setEditingClient(null);
        } catch (e) {
            alert("Ошибка сохранения клиента: " + e.message);
        }
    };


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
            (client.phone && client.phone.includes(searchLower)) ||
            (client.address && client.address.toLowerCase().includes(searchLower))
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
            const newDealRef = await addDoc(collection(db, 'artifacts', appId, 'users', adminId, 'deals'), newDealData);
            setEditingDeal({ ...newDealData, id: newDealRef.id }); // Keep modal open with new deal
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
        setDeals(prev => prev.map(d => {
            if (d.id === dealId) {
                const newCustomData = {...d.customData};
                delete newCustomData[fieldId];
                return {...d, customData: newCustomData};
            }
            return d;
        }));
    };


    const handleAddManager = async ({ name, email, password, phone }) => {
        if (!name || !email || !password || !adminId) return alert("Заполните все поля");

        let tempAuth;
        try {
            const tempApp = initializeApp(firebaseConfig, `temp-manager-${Date.now()}`);
            tempAuth = getAuth(tempApp);
            const userCredential = await createUserWithEmailAndPassword(tempAuth, email, password);
            const newManagerUser = userCredential.user;

            await sendEmailVerification(newManagerUser);

            const managerData = { name, email, uid: newManagerUser.uid };
            if (phone) {
                managerData.phone = phone;
            }

            const managerRef = await addDoc(collection(db, 'artifacts', appId, 'users', adminId, 'managers'), managerData);

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
            const confirmMessage = `Вы уверены, что хотите отправить запрос на удаление ${itemName}?\nЭто действие нельзя будет отменить.`
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
        } else { 
            try {
                const collectionName = itemType === 'deal' ? 'deals' 
                                    : itemType === 'client' ? 'clients' 
                                    : itemType === 'transaction' ? 'transactions'
                                    : 'tasks';
                await deleteDoc(doc(db, 'artifacts', appId, 'users', adminId, collectionName, itemId));
                console.log(`${itemType} успешно удален.`);
                if (itemType === 'deal') closeDealModal();
                if (itemType === 'client') { setIsClientModalOpen(false); setEditingClient(null); }
                if (itemType === 'transaction') { setIsTransactionModalOpen(false); setEditingTransaction(null); }
            } catch (error) {
                console.error("Ошибка при удалении: ", error);
                alert("Не удалось удалить. Попробуйте еще раз.");
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
        } else { 
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
    }

    const handleParseCommand = (command) => {
        const lowerCommand = command.toLowerCase();
        const tokens = lowerCommand.split(/\s+/);
        const isDeal = tokens.includes('проект') || tokens.includes('сделку');
        const isTask = tokens.includes('задачу');
        const isTransaction = tokens.includes('финансы') || tokens.includes('операцию') || tokens.includes('транзакцию');

        const budgetMatch = command.match(/(?:бюджет|сумма|на)\s*([\d\s]+)/i);
        const value = budgetMatch ? parseInt(budgetMatch[1].replace(/\s/g, ''), 10) : '';

        if (isDeal) {
            const titleMatch = command.match(/(?:проект|сделку)\s*"([^"]+)"/i) || command.match(/(?:проект|сделку)\s*([^для]+)/i);
            const title = titleMatch ? titleMatch[1].trim() : 'Новый проект';

            const clientNameMatch = command.match(/для\s*"([^"]+)"/i) || command.match(/для\s*(.+)/i);
            let clientId = '';
            if (clientNameMatch) {
                const clientName = clientNameMatch[1].trim().toLowerCase();
                const foundClient = clients.find(c => c.name.toLowerCase() === clientName);
                if (foundClient) {
                    clientId = foundClient.id;
                }
            }
            openDealModal({ title, value, clientId });
        } else if (isTransaction) {
            const descriptionMatch = command.match(/(?:операцию|транзакцию)\s*"([^"]+)"/i) || command.match(/(?:операцию|транзакцию)\s*(.+)/i);
            const description = descriptionMatch ? descriptionMatch[1].trim() : 'Новая операция';
            setEditingTransaction({ description, amount: value, type: 'expense' }); 
            setIsTransactionModalOpen(true);
        } else if (isTask) {
            const titleMatch = command.match(/задачу\s*"([^"]+)"/i) || command.match(/задачу\s*(.+)/i);
            const title = titleMatch ? titleMatch[1].trim() : 'Новая задача';
            addDoc(collection(db, 'artifacts', appId, 'users', adminId, 'tasks'), { 
                title,
                completed: false,
                createdAt: serverTimestamp()
            });
            setActiveTab('tasks');

        } else {
            alert('Не удалось распознать команду. Попробуйте: "проект", "задачу" или "операцию".');
        }
    };

    const handleLogout = () => {
        if (loggedInClient) {
            setLoggedInClient(null);
            setAdminId(null);
            window.history.replaceState({}, document.title, "/");
        } else {
            signOut(auth);
        }
    };


    if (loadingAuth) return <div className="h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-blue-600" size={48}/></div>;

    if (!user && !loggedInClient) {
        return <AuthScreen />;
    }

    if (loggedInClient) {
        return (
            <ClientWelcome 
                client={loggedInClient}
                clientData={clientData}
                onLogout={handleLogout}
                selectedDeal={selectedClientDeal}
                onSelectDeal={setSelectedClientDeal}
            />
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
                    <button onClick={handleLogout} className="text-slate-400 hover:text-red-500 transition-colors font-black text-[10px] flex items-center justify-center gap-1 w-full py-4 hover:bg-red-50 rounded-2xl uppercase tracking-widest">
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
                        <button onClick={() => setIsCommandBarOpen(true)} className="hidden sm:flex items-center justify-center gap-2 text-sm font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-700 p-2 rounded-lg transition-colors">
                           <Bot size={18}/>
                           <span>AI-помощник</span>
                        </button>
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
                   {(userRole === 'admin' || userRole === 'manager') && activeTab === 'settings' && 
                        <SettingsView 
                            adminId={adminId} 
                            onDeleteManager={(manager) => setManagerToDelete(manager)} 
                            user={user} 
                            onPasswordChange={() => setIsPasswordChangeModalOpen(true)} 
                            userRole={userRole} 
                            onAddManager={handleAddManager} 
                            stages={stages} 
                            setStages={setStages}
                            managers={managers}
                            categories={categories}
                            accounts={accounts}
                            customFields={customFields}
                            setCustomFields={setCustomFields}
                         />
                    }
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
                        {...{adminId, managers, stages, customFields, userRole, managerDocId, user, accounts, categories, tasks, transactions}}
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

            {isCommandBarOpen &&
                <Modal title="" onClose={() => setIsCommandBarOpen(false)} width="max-w-2xl">
                    <CommandBar onParseCommand={handleParseCommand} onClose={() => setIsCommandBarOpen(false)} />
                </Modal>
            }

            {isClientModalOpen && <Modal title={editingClient ? "Карточка клиента" : "Новый клиент"} onClose={()=>{setIsClientModalOpen(false); setEditingClient(null);}}><ClientForm client={editingClient} onSave={handleSaveClient} onClose={()=>{setIsClientModalOpen(false); setEditingClient(null);}} {...{adminId, managerDocId, userRole, onRequestDelete: handleRequestDelete}} /></Modal>}
            {isTransactionModalOpen && <Modal title={editingTransaction ? "Редактировать операцию" : "Новая операция"} onClose={()=>{setIsTransactionModalOpen(false); setEditingTransaction(null);}}><TransactionForm onClose={()=>{setIsTransactionModalOpen(false); setEditingTransaction(null);}} {...{adminId, categories, accounts, transaction: editingTransaction, managerDocId, userRole}} /></Modal>}
        </div>
    );
}
