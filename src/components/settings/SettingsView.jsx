import React, { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db, appId } from '../../firebase';
import { CompanyIdCard, TeamManager, CategoriesManager, StagesManager, AccountsManager, CustomFieldsManager } from './';
import { PrimaryBtn } from '../UI';

export function SettingsView({ adminId, onDeleteManager, companyCode, onAddManager, userRole, onPasswordChange }) {
    const [managers, setManagers] = useState([]);
    const [categories, setCategories] = useState([]);
    const [stages, setStages] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [customFields, setCustomFields] = useState([]);

    useEffect(() => {
        if (!adminId || userRole !== 'admin') return;

        const unsubManagers = onSnapshot(collection(db, 'artifacts', appId, 'users', adminId, 'managers'), snap => setManagers(snap.docs.map(doc => ({ ...doc.data(), id: doc.id }))));
        const unsubCategories = onSnapshot(collection(db, 'artifacts', appId, 'users', adminId, 'categories'), snap => setCategories(snap.docs.map(doc => ({ ...doc.data(), id: doc.id }))));
        const unsubStages = onSnapshot(collection(db, 'artifacts', appId, 'users', adminId, 'stages'), snap => setStages(snap.docs.map(doc => ({ ...doc.data(), id: doc.id })).sort((a,b) => a.order - b.order)));
        const unsubAccounts = onSnapshot(collection(db, 'artifacts', appId, 'users', adminId, 'accounts'), snap => setAccounts(snap.docs.map(doc => ({ ...doc.data(), id: doc.id }))));
        const unsubCustomFields = onSnapshot(collection(db, 'artifacts', appId, 'users', adminId, 'customFields'), snap => setCustomFields(snap.docs.map(doc => ({ ...doc.data(), id: doc.id })).sort((a,b) => a.order - b.order)));

        return () => {
            unsubManagers();
            unsubCategories();
            unsubStages();
            unsubAccounts();
            unsubCustomFields();
        };
    }, [adminId, userRole]);

    return (
        <div className="h-screen bg-gray-50/50">
            <main className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-6">
                    {userRole === 'admin' && <CompanyIdCard companyCode={companyCode} />}
                     <div className="bg-white p-6 rounded-2xl shadow-sm">
                         <h3 className="text-lg font-bold mb-4">Безопасность</h3>
                        <PrimaryBtn onClick={onPasswordChange} className="w-full">Сменить пароль</PrimaryBtn>
                    </div>
                    {userRole === 'admin' && <TeamManager managers={managers} onAddManager={onAddManager} onDeleteManager={onDeleteManager} />}
                </div>
                 {userRole === 'admin' && (
                    <>
                        <div className="space-y-6">
                            <StagesManager adminId={adminId} stages={stages} setStages={setStages} />
                            <CustomFieldsManager adminId={adminId} customFields={customFields} setCustomFields={setCustomFields} />
                        </div>
                        <div className="space-y-6">
                            <CategoriesManager adminId={adminId} categories={categories} />
                            <AccountsManager adminId={adminId} accounts={accounts} />
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
