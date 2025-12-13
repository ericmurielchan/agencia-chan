
import React, { useState, useRef } from 'react';
import { SystemSettings } from '../types';
import { Settings, Upload, Check, RefreshCcw, Palette, LayoutTemplate, Sidebar as SidebarIcon } from 'lucide-react';

interface SystemAdminProps {
    settings: SystemSettings;
    onUpdateSettings: (newSettings: SystemSettings) => void;
}

const PRIMARY_PRESETS = [
    { color: '#db2777', label: 'Pink' },
    { color: '#3b82f6', label: 'Blue' },
    { color: '#10b981', label: 'Emerald' },
    { color: '#8b5cf6', label: 'Purple' },
    { color: '#f59e0b', label: 'Amber' },
    { color: '#ef4444', label: 'Red' },
];

const SIDEBAR_PRESETS = [
    { color: '#0f172a', label: 'Slate 900' }, // Padrão
    { color: '#1e1b4b', label: 'Indigo 950' },
    { color: '#171717', label: 'Neutral 900' },
    { color: '#312e81', label: 'Indigo 900' },
    { color: '#020617', label: 'Slate 950' },
    { color: '#2e1065', label: 'Violet 950' },
];

export const SystemAdmin: React.FC<SystemAdminProps> = ({ settings, onUpdateSettings }) => {
    const [localSettings, setLocalSettings] = useState<SystemSettings>(settings);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [successMsg, setSuccessMsg] = useState('');

    const handleSave = () => {
        onUpdateSettings(localSettings);
        setSuccessMsg('Configurações do sistema atualizadas com sucesso!');
        setTimeout(() => setSuccessMsg(''), 3000);
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setLocalSettings({ ...localSettings, logo: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    const resetLogo = () => {
        setLocalSettings({ ...localSettings, logo: '' });
    };

    return (
        <div className="space-y-6 animate-pop max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Settings className="text-slate-600"/> Administração do Sistema
                    </h2>
                    <p className="text-slate-500">Personalize a aparência e identidade da plataforma.</p>
                </div>
                {successMsg && (
                    <div className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 animate-pop">
                        <Check size={16}/> {successMsg}
                    </div>
                )}
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <LayoutTemplate size={18} className="text-pink-600"/> Identidade Visual
                    </h3>
                </div>
                
                <div className="p-8 space-y-8">
                    {/* Nome da Agência */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Nome da Agência / Sistema</label>
                        <input 
                            className="w-full border border-slate-200 rounded-lg p-3 text-lg font-medium outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100 transition-all"
                            value={localSettings.agencyName}
                            onChange={e => setLocalSettings({...localSettings, agencyName: e.target.value})}
                            placeholder="Ex: Minha Agência OS"
                        />
                        <p className="text-xs text-slate-400 mt-1">Este nome aparecerá no título da aba, no menu lateral e na tela de login.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Logotipo */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-3">Logotipo do Sistema</label>
                            <div className="flex items-start gap-4">
                                <div className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center bg-slate-50 relative overflow-hidden group">
                                    {localSettings.logo ? (
                                        <img src={localSettings.logo} alt="Logo" className="w-full h-full object-contain p-2" />
                                    ) : (
                                        <span className="text-xs text-slate-400 text-center px-2">Sem Logo</span>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <button 
                                        onClick={() => fileInputRef.current?.click()}
                                        className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors w-full"
                                    >
                                        <Upload size={16}/> Carregar Imagem
                                    </button>
                                    {localSettings.logo && (
                                        <button 
                                            onClick={resetLogo}
                                            className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-red-50 hover:text-red-600 text-slate-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors w-full"
                                        >
                                            <RefreshCcw size={16}/> Restaurar Padrão
                                        </button>
                                    )}
                                    <input 
                                        type="file" 
                                        ref={fileInputRef} 
                                        className="hidden" 
                                        accept="image/png, image/jpeg, image/svg+xml"
                                        onChange={handleLogoUpload}
                                    />
                                    <p className="text-[10px] text-slate-400">Recomendado: PNG ou SVG (Quadrado ou Horizontal)</p>
                                </div>
                            </div>
                        </div>

                        {/* Cores */}
                        <div className="space-y-6">
                            
                            {/* Cor Primária */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                                    <Palette size={16}/> Cor Primária do Tema
                                </label>
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {PRIMARY_PRESETS.map(preset => (
                                        <button
                                            key={preset.color}
                                            onClick={() => setLocalSettings({...localSettings, primaryColor: preset.color})}
                                            className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${localSettings.primaryColor === preset.color ? 'border-slate-800 ring-2 ring-slate-200' : 'border-transparent'}`}
                                            style={{ backgroundColor: preset.color }}
                                            title={preset.label}
                                        />
                                    ))}
                                    <div className="relative w-8 h-8 rounded-full overflow-hidden border-2 border-slate-200 flex items-center justify-center cursor-pointer hover:border-slate-400">
                                        <input 
                                            type="color" 
                                            className="absolute w-[150%] h-[150%] cursor-pointer -top-1 -left-1 p-0 m-0 opacity-0"
                                            value={localSettings.primaryColor}
                                            onChange={e => setLocalSettings({...localSettings, primaryColor: e.target.value})}
                                        />
                                        <div className="w-full h-full" style={{ backgroundColor: localSettings.primaryColor }}></div>
                                        <span className="absolute inset-0 flex items-center justify-center pointer-events-none text-white drop-shadow-md text-xs font-bold">+</span>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-400">Define a cor de botões, destaques e itens ativos.</p>
                            </div>

                            {/* Cor da Barra Lateral */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                                    <SidebarIcon size={16}/> Cor da Barra Lateral
                                </label>
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {SIDEBAR_PRESETS.map(preset => (
                                        <button
                                            key={preset.color}
                                            onClick={() => setLocalSettings({...localSettings, sidebarColor: preset.color})}
                                            className={`w-8 h-8 rounded-md border-2 transition-transform hover:scale-110 ${localSettings.sidebarColor === preset.color ? 'border-pink-500 ring-2 ring-pink-100' : 'border-slate-200'}`}
                                            style={{ backgroundColor: preset.color }}
                                            title={preset.label}
                                        />
                                    ))}
                                    <div className="relative w-8 h-8 rounded-md overflow-hidden border-2 border-slate-200 flex items-center justify-center cursor-pointer hover:border-slate-400 bg-white">
                                        <input 
                                            type="color" 
                                            className="absolute w-[150%] h-[150%] cursor-pointer -top-1 -left-1 p-0 m-0 opacity-0"
                                            value={localSettings.sidebarColor || '#0f172a'}
                                            onChange={e => setLocalSettings({...localSettings, sidebarColor: e.target.value})}
                                        />
                                        <div className="w-4 h-4 rounded-full border border-slate-300" style={{ backgroundColor: localSettings.sidebarColor }}></div>
                                        <span className="absolute bottom-0 right-0 text-[8px] text-slate-400 font-bold p-0.5">+</span>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-400">Personalize o fundo do menu principal.</p>
                            </div>

                        </div>
                    </div>
                </div>

                <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
                    <button 
                        onClick={handleSave}
                        className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-3 rounded-lg font-bold shadow-lg transition-all flex items-center gap-2"
                        style={{ backgroundColor: localSettings.primaryColor }} 
                    >
                        <Check size={20}/> Salvar Configurações
                    </button>
                </div>
            </div>
        </div>
    );
};
