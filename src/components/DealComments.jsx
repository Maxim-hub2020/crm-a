import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, addDoc, serverTimestamp, doc, deleteDoc } from 'firebase/firestore';
import { Input, PrimaryBtn } from './UI';
import { Send, Trash2 } from 'lucide-react';
import { db, appId } from '../firebase';

export function DealComments({ adminId, dealId, user }) {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");

    useEffect(() => {
        if (!dealId) return;
        const q = query(collection(db, 'artifacts', appId, 'users', adminId, 'deals', dealId, 'comments'), orderBy('createdAt', 'asc'));
        const unsub = onSnapshot(q, snap => {
            setComments(snap.docs.map(d => ({id: d.id, ...d.data()})));
        });
        return unsub;
    }, [dealId, adminId]);

    const handleAddComment = async () => {
        if (!newComment.trim() || !dealId) return;
        await addDoc(collection(db, 'artifacts', appId, 'users', adminId, 'deals', dealId, 'comments'), {
            text: newComment,
            createdAt: serverTimestamp(),
            author: user.email
        });
        setNewComment("");
    }

    const handleDeleteComment = async (commentId) => {
        if (!dealId || !commentId) return;
        await deleteDoc(doc(db, 'artifacts', appId, 'users', adminId, 'deals', dealId, 'comments', commentId));
    };
    
    return (
        <div className="p-1 h-full flex flex-col">
            <div className="flex-1 space-y-4 overflow-y-auto no-scrollbar pr-2">
                {comments.length > 0 ? comments.map(comment => (
                    <div key={comment.id} className="bg-gray-100 rounded-lg p-3 group relative">
                        <p className="text-xs text-gray-500 font-bold">{comment.author} - {new Date(comment.createdAt?.toDate()).toLocaleString('ru-RU')}</p>
                        <p className="text-sm text-gray-800 break-words">{comment.text}</p>
                        {user.email === comment.author && (
                            <button 
                                onClick={() => handleDeleteComment(comment.id)} 
                                className="absolute top-1 right-1 p-1 rounded-full bg-gray-200 text-gray-600 hover:bg-red-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Trash2 size={12} />
                            </button>
                        )}
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
