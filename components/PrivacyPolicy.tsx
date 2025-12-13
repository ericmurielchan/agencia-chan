
import React from 'react';
import { Shield, Lock, FileText, ArrowLeft, Printer } from 'lucide-react';

interface PrivacyPolicyProps {
    onBack: () => void;
    agencyName: string;
}

export const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ onBack, agencyName }) => {
    return (
        <div className="max-w-4xl mx-auto animate-pop pb-12">
            <div className="flex justify-between items-center mb-6">
                <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-medium transition-colors">
                    <ArrowLeft size={18}/> Voltar
                </button>
                <button onClick={() => window.print()} className="flex items-center gap-2 text-slate-500 hover:text-blue-600 font-medium transition-colors">
                    <Printer size={18}/> Imprimir
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                <div className="bg-slate-900 text-white p-8 md:p-12">
                    <div className="flex items-center gap-3 mb-4 text-emerald-400">
                        <Shield size={32}/>
                        <span className="font-bold tracking-widest uppercase text-sm">Documento Legal</span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold mb-4">Políticas de Privacidade</h1>
                    <p className="text-slate-400 text-lg">Última atualização: {new Date().toLocaleDateString()}</p>
                </div>

                <div className="p-8 md:p-12 space-y-8 text-slate-700 leading-relaxed">
                    <section>
                        <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <Lock size={20} className="text-emerald-600"/> 1. Coleta de Informações
                        </h2>
                        <p>
                            O sistema <strong>{agencyName}</strong> coleta informações essenciais para o funcionamento dos serviços de gestão, incluindo:
                        </p>
                        <ul className="list-disc ml-6 mt-2 space-y-1">
                            <li>Dados de identificação (Nome, E-mail, Cargo).</li>
                            <li>Registros de atividades (Logs de acesso, criação de tarefas).</li>
                            <li>Informações financeiras para processamento de pagamentos e reembolsos (quando aplicável).</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <FileText size={20} className="text-blue-600"/> 2. Uso dos Dados
                        </h2>
                        <p>
                            Utilizamos os dados coletados exclusivamente para:
                        </p>
                        <ul className="list-disc ml-6 mt-2 space-y-1">
                            <li>Prover, operar e manter o sistema.</li>
                            <li>Melhorar, personalizar e expandir nossos serviços.</li>
                            <li>Compreender e analisar como você utiliza o sistema (Análise de Produtividade e IA).</li>
                            <li>Processar transações e enviar notificações relacionadas.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 mb-4">3. Compartilhamento de Dados</h2>
                        <p>
                            Não vendemos, trocamos ou transferimos suas informações pessoais identificáveis para terceiros externos, exceto quando necessário para:
                        </p>
                        <ul className="list-disc ml-6 mt-2 space-y-1">
                            <li>Cumprimento da lei ou requisições judiciais.</li>
                            <li>Proteção de nossos direitos, propriedade ou segurança.</li>
                            <li>Fornecedores de serviços confiáveis que nos auxiliam na operação do sistema (ex: Servidores Cloud, APIs de IA), sob acordo de confidencialidade.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 mb-4">4. Segurança dos Dados</h2>
                        <p>
                            Implementamos uma variedade de medidas de segurança para manter a segurança de suas informações pessoais. Utilizamos criptografia SSL em todas as comunicações e armazenamos senhas com hash seguro. No entanto, nenhum método de transmissão pela Internet é 100% seguro.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 mb-4">5. Seus Direitos</h2>
                        <p>
                            Você tem o direito de solicitar o acesso, correção ou exclusão de seus dados pessoais armazenados no sistema. Para exercer esses direitos, entre em contato com o administrador do sistema da {agencyName}.
                        </p>
                    </section>

                    <div className="border-t border-slate-100 pt-8 mt-8 text-center text-sm text-slate-500">
                        <p>Dúvidas? Entre em contato com o suporte ou administração.</p>
                        <p>&copy; {new Date().getFullYear()} {agencyName}. Todos os direitos reservados.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
