import React, { useState, useEffect } from 'react';
import { SettingsCard } from './SettingsCard';
import { Input, PrimaryBtn, SecondaryBtn } from '../UI';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db, appId } from '../../firebase'; // Assuming db and appId are exported from firebase config

export function IntegrationsManager({ adminId }) {
    const [maxApiToken, setMaxApiToken] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    const settingsRef = adminId ? doc(db, 'artifacts', appId, 'users', adminId, 'settings', 'integrations') : null;

    useEffect(() => {
        if (!settingsRef) return;
        const fetchToken = async () => {
            const docSnap = await getDoc(settingsRef);
            if (docSnap.exists() && docSnap.data().maxApiToken) {
                setMaxApiToken(docSnap.data().maxApiToken);
            }
        };
        fetchToken();
    }, [adminId]);

    const handleSave = async () => {
        if (!settingsRef) return;
        setIsLoading(true);
        try {
            await updateDoc(settingsRef, { maxApiToken }, { merge: true });
            console.log('Токен API MAX успешно сохранен.');
            setIsEditing(false);
        } catch (error) {
            console.error('Ошибка сохранения токена:', error);
            alert('Не удалось сохранить токен.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SettingsCard title="Интеграции" description="Настройте подключение к сторонним сервисам.">
            <div className="space-y-4">
                <div>
                    <label className="font-semibold text-gray-700 block mb-1.5">Токен API для мессенджера MAX</label>
                    <div className="flex items-center gap-2">
                         <Input 
                            type={isEditing ? 'text' : 'password'}
                            value={maxApiToken}
                            onChange={(e) => setMaxApiToken(e.target.value)}
                            placeholder="Введите ваш токен"
                            disabled={!isEditing}
                        />
                        {isEditing ? (
                            <PrimaryBtn onClick={handleSave} disabled={isLoading}>
                                {isLoading ? 'Сохранение...' : 'Сохранить'}
                            </PrimaryBtn>
                        ) : (
                            <SecondaryBtn onClick={() => setIsEditing(true)}>Изменить</SecondaryBtn>
                        )}
                    </div>
                </div>
            </div>
        </SettingsCard>
    );
}
