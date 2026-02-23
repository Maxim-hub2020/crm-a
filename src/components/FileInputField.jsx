import React, { useState, useEffect, useRef } from 'react';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { doc, updateDoc, deleteField } from 'firebase/firestore';
import { File as FileIcon, UploadCloud, Loader2, Trash2 } from 'lucide-react';
import { Input } from './UI';
import { db, storage, appId } from '../firebase';

export function FileInputField({ field, value, onFileUpload, onFileDelete, dealId, disabled }) {
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        try {
            // Call the passed-in onFileUpload prop
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
        if (!confirm(`Удалить файл \"${value.name}\"?`)) return;
         try {
            // Call the passed-in onFileDelete prop
            await onFileDelete(dealId, field.id, value.path);
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
