
import React, { useEffect } from 'react';
import { AlertTriangle, Info } from 'lucide-react';
import { ConfirmOptions } from '../types';

interface ConfirmDialogProps {
    options: ConfirmOptions;
    onConfirm: () => void;
    onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ options, onConfirm, onCancel }) => {
    useEffect(() => {
        console.log("POPUP_OPENED", { type: 'ConfirmDialog', title: options.title });
        return () => console.log("POPUP_CLOSED", { type: 'ConfirmDialog' });
    }, [options.title]);

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[99999] flex items-center justify-center p-4 transition-all duration-300" onClick={onCancel}>
            <div className="bg-white rounded-[32px] w-full max-w-sm shadow-2xl overflow-hidden border border-slate-100 animate-pop" onClick={e => e.stopPropagation()}>
                <div className="p-8">
                    <div className="flex flex-col items-center text-center mb-6">
                        <div className={`p-4 rounded-xl mb-4 shadow-md ${options.variant === 'danger' ? 'bg-red-50 text-red-600 shadow-red-100' : 'bg-blue-50 text-blue-600 shadow-blue-100'}`}>
                            {options.variant === 'danger' ? <AlertTriangle size={32} strokeWidth={2.5}/> : <Info size={32} strokeWidth={2.5}/>}
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 tracking-tight mb-2 uppercase">{options.title}</h3>
                        <p className="text-slate-500 text-xs font-medium leading-relaxed px-4">
                            {options.description}
                        </p>
                    </div>
                    <div className="flex flex-col gap-2">
                        <button 
                            onClick={onConfirm}
                            className={`w-full h-11 rounded-xl text-white font-bold uppercase text-[10px] tracking-widest transition-all hover:scale-[1.02] active:scale-95 ${options.variant === 'danger' ? 'bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/10' : 'bg-pink-600 hover:bg-pink-700 shadow-lg shadow-pink-600/10'}`}
                        >
                            {options.confirmText || 'Confirmar'}
                        </button>
                        <button 
                            onClick={onCancel}
                            className="w-full h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-widest transition-all"
                        >
                            {options.cancelText || 'Cancelar'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
