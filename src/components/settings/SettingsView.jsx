import React from 'react';
import { TeamManager, CategoriesManager, StagesManager, AccountsManager, CustomFieldsManager, IntegrationsManager } from './';
import { PrimaryBtn } from '../UI';

export function SettingsView({ adminId, onDeleteManager, onAddManager, userRole, onPasswordChange, stages, setStages, managers, categories, accounts, customFields, setCustomFields }) {

    return (
        <div className="h-screen bg-gray-50/50">
            <main className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-6">
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
                            <IntegrationsManager adminId={adminId} />
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
