import React, { useState } from 'react';
import { Briefcase, Loader2, User } from 'lucide-react';
import { db, auth, appId } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, getDocs, collection, query, where } from 'firebase/firestore';
import { Input } from './UI';
import { generateCompanyCode } from '../utils';

export function AuthScreen({ showClientLogin }) {
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

            } else {
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

export function ClientLoginScreen({ onLoginSuccess, onBack }) {
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
