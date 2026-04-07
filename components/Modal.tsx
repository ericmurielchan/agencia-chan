
import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    maxWidth?: string; // Default is 500px as per requirements
    hideHeader?: boolean;
    noPadding?: boolean;
    scrollable?: boolean;
}

export const Modal: React.FC<ModalProps> = ({ 
    isOpen, 
    onClose, 
    title, 
    children, 
    maxWidth = '500px',
    hideHeader = false,
    noPadding = false,
    scrollable = true
}) => {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const modalRoot = document.getElementById('modal-root');
    if (!modalRoot) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Overlay */}
            <div 
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in" 
                onClick={onClose}
            />
            
            {/* Modal Content */}
            <div 
                className="relative bg-white rounded-3xl shadow-2xl w-full flex flex-col animate-pop overflow-hidden"
                style={{ maxWidth, maxHeight: '90vh' }}
            >
                {/* Header */}
                {!hideHeader && (
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
                        <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                            {title}
                        </h3>
                        <button 
                            onClick={onClose} 
                            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all"
                        >
                            <X size={20} />
                        </button>
                    </div>
                )}

                {/* Body */}
                <div className={`${noPadding ? 'p-0' : 'p-6'} ${scrollable ? 'overflow-y-auto custom-scrollbar' : 'overflow-hidden'} flex-1`}>
                    {children}
                </div>
            </div>
        </div>,
        modalRoot
    );
};
