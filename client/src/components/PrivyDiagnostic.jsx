import { usePrivy } from '@privy-io/react-auth';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, ExternalLink } from 'lucide-react';

/**
 * Componente de diagnóstico para verificar configuración de Privy
 * Usar temporalmente para debuggear problemas de login
 */
const PrivyDiagnostic = () => {
    const { ready, authenticated, user } = usePrivy();

    const checks = [
        {
            name: 'Privy SDK Cargado',
            status: ready ? 'success' : 'warning',
            message: ready ? 'SDK está listo' : 'SDK está cargando...'
        },
        {
            name: 'Usuario Autenticado',
            status: authenticated ? 'success' : 'info',
            message: authenticated ? 'Usuario conectado' : 'No hay usuario conectado'
        },
        {
            name: 'App ID Configurado',
            status: import.meta.env.VITE_PRIVY_APP_ID ? 'success' : 'warning',
            message: import.meta.env.VITE_PRIVY_APP_ID || 'Usando App ID por defecto'
        },
        {
            name: 'Método de Login',
            status: user ? 'success' : 'info',
            message: user?.google ? '🔴 Google OAuth' : user?.email ? '✅ Email' : 'No especificado'
        }
    ];

    const getStatusIcon = (status) => {
        switch (status) {
            case 'success':
                return <CheckCircle className="w-5 h-5 text-green-400" />;
            case 'warning':
                return <AlertCircle className="w-5 h-5 text-yellow-400" />;
            case 'error':
                return <XCircle className="w-5 h-5 text-red-400" />;
            default:
                return <AlertCircle className="w-5 h-5 text-blue-400" />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'success':
                return 'border-green-500/30 bg-green-500/5';
            case 'warning':
                return 'border-yellow-500/30 bg-yellow-500/5';
            case 'error':
                return 'border-red-500/30 bg-red-500/5';
            default:
                return 'border-blue-500/30 bg-blue-500/5';
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-4 right-4 z-50 max-w-md"
        >
            <div className="glass-panel p-4 border border-[#FFD700]">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-white font-bold text-sm">🔍 Privy Diagnostic</h3>
                    <a
                        href="https://dashboard.privy.io/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#FFD700] text-xs flex items-center gap-1 hover:underline"
                    >
                        Dashboard
                        <ExternalLink className="w-3 h-3" />
                    </a>
                </div>

                <div className="space-y-2">
                    {checks.map((check, index) => (
                        <div
                            key={index}
                            className={`p-2 border rounded ${getStatusColor(check.status)}`}
                        >
                            <div className="flex items-center gap-2">
                                {getStatusIcon(check.status)}
                                <div className="flex-1">
                                    <p className="text-white text-xs font-semibold">{check.name}</p>
                                    <p className="text-gray-400 text-[10px]">{check.message}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {user?.google && (
                    <div className="mt-3 p-2 bg-red-500/10 border border-red-500/30 rounded">
                        <p className="text-red-400 text-[10px] font-semibold">
                            ⚠️ Google detectado pero puede no estar configurado
                        </p>
                        <p className="text-gray-400 text-[9px] mt-1">
                            Verifica Google OAuth en Privy Dashboard
                        </p>
                    </div>
                )}

                {user?.email && (
                    <div className="mt-3 p-2 bg-green-500/10 border border-green-500/30 rounded">
                        <p className="text-green-400 text-[10px] font-semibold">
                            ✅ Email login funcionando correctamente
                        </p>
                    </div>
                )}

                <div className="mt-3 text-[9px] text-gray-600 text-center">
                    Lee PRIVY_SETUP.md para configurar Google
                </div>
            </div>
        </motion.div>
    );
};

export default PrivyDiagnostic;

