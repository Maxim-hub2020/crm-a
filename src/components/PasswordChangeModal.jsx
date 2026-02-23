import React, { useState } from 'react';
import { getAuth, EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { Input, PrimaryBtn } from './UI';
import { ShieldAlert, ShieldCheck } from 'lucide-react';

export function PasswordChangeModal({ onClose, user }) {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (newPassword !== confirmPassword) {
            setError('Новые пароли не совпадают.');
            return;
        }
        if (newPassword.length < 6) {
            setError('Новый пароль должен быть не менее 6 символов.');
            return;
        }

        setIsLoading(true);
        const auth = getAuth();

        try {
            const credential = EmailAuthProvider.credential(user.email, currentPassword);
            await reauthenticateWithCredential(user, credential);

            await updatePassword(user, newPassword);
            setSuccess('Пароль успешно изменен!');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setTimeout(() => {
                onClose();
            }, 2500);

        } catch (error) {
            console.error(error);
            if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                setError('Неверный текущий пароль.');
            } else if (error.code === 'auth/too-many-requests') {
                setError('Слишком много попыток. Попробуйте позже.');
            } else {
                setError('Произошла неизвестная ошибка. Повторите попытку.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-4">
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-lg text-sm flex items-center gap-2 animate-in fade-in">
                    <ShieldAlert size={18} className="shrink-0" />
                    <span>{error}</span>
                </div>
            )}
            {success && (
                 <div className="bg-green-50 border border-green-200 text-green-800 p-3 rounded-lg text-sm flex items-center gap-2 animate-in fade-in">
                    <ShieldCheck size={18} className="shrink-0" />
                    <span>{success}</span>
                </div>
            )}
            
            {!success && (
                <>
                    <Input 
                        label="Текущий пароль" 
                        type="password"
                        value={currentPassword}
                        onChange={e => setCurrentPassword(e.target.value)}
                        required 
                        autoComplete="current-password"
                    />
                    <Input 
                        label="Новый пароль (мин. 6 символов)" 
                        type="password"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        required 
                        autoComplete="new-password"
                    />
                    <Input 
                        label="Подтвердите новый пароль" 
                        type="password"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        required 
                        autoComplete="new-password"
                    />
                    
                    <PrimaryBtn type="submit" className="w-full py-4 uppercase font-black text-xs tracking-widest" disabled={isLoading}>
                        {isLoading ? 'Меняем пароль...' : 'Сменить пароль'}
                    </PrimaryBtn>
                </>
            )}
        </form>
    );
}
