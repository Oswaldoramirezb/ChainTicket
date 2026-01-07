import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle, XCircle, Wallet, Fingerprint, CheckCheck } from 'lucide-react';

const TransactionFeedback = ({ isOpen, status, message, onClose, txHash }) => {
    // status can be: 'preparing', 'signing', 'confirming', 'success', 'error'

    const statusConfig = {
        preparing: {
            icon: Loader2,
            iconClass: 'animate-spin text-blue-400',
            bgClass: 'bg-blue-500/10 border-blue-500/30',
            title: 'Preparando Transacción',
            subtitle: 'Configurando los parámetros...'
        },
        signing: {
            icon: Fingerprint,
            iconClass: 'text-[#FFD700] animate-pulse',
            bgClass: 'bg-[#FFD700]/10 border-[#FFD700]/30',
            title: 'Firmando con Privy',
            subtitle: 'Tu wallet embebida está firmando la transacción'
        },
        confirming: {
            icon: CheckCheck,
            iconClass: 'text-purple-400 animate-pulse',
            bgClass: 'bg-purple-500/10 border-purple-500/30',
            title: 'Confirmando en Blockchain',
            subtitle: 'Esperando confirmación de Movement...'
        },
        success: {
            icon: CheckCircle,
            iconClass: 'text-green-400',
            bgClass: 'bg-green-500/10 border-green-500/30',
            title: '¡Transacción Exitosa!',
            subtitle: 'La operación se completó correctamente'
        },
        error: {
            icon: XCircle,
            iconClass: 'text-red-400',
            bgClass: 'bg-red-500/10 border-red-500/30',
            title: 'Error en Transacción',
            subtitle: message || 'Hubo un problema al procesar la transacción'
        }
    };

    const config = statusConfig[status] || statusConfig.preparing;
    const Icon = config.icon;
    const isProcessing = ['preparing', 'signing', 'confirming'].includes(status);
    const isComplete = ['success', 'error'].includes(status);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100]"
                        onClick={isComplete ? onClose : undefined}
                    />

                    {/* Modal */}
                    <div className="fixed inset-0 flex items-center justify-center z-[101] p-6">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            transition={{ type: "spring", duration: 0.5 }}
                            className="glass-panel max-w-md w-full p-8 relative border-t-2 border-t-[#FFD700]"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Icon */}
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                                className={`relative w-20 h-20 mx-auto mb-6 rounded-full border-2 flex items-center justify-center ${config.bgClass}`}
                            >
                                <Icon className={`w-10 h-10 ${config.iconClass}`} />
                            </motion.div>

                            {/* Title */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="text-center mb-6"
                            >
                                <h2 className="text-2xl font-bold font-serif text-white mb-2">
                                    {config.title}
                                </h2>
                                <p className="text-gray-400 text-sm">
                                    {config.subtitle}
                                </p>
                            </motion.div>

                            {/* Progress Steps */}
                            {isProcessing && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.4 }}
                                    className="mb-6"
                                >
                                    <div className="flex items-center justify-between">
                                        {/* Step 1: Preparing */}
                                        <div className="flex flex-col items-center flex-1">
                                            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center mb-2 ${
                                                status === 'preparing' 
                                                    ? 'border-blue-400 bg-blue-400/20' 
                                                    : ['signing', 'confirming'].includes(status)
                                                    ? 'border-green-400 bg-green-400/20'
                                                    : 'border-gray-600 bg-gray-600/20'
                                            }`}>
                                                {['signing', 'confirming'].includes(status) ? (
                                                    <CheckCircle className="w-4 h-4 text-green-400" />
                                                ) : (
                                                    <span className="text-xs font-bold text-blue-400">1</span>
                                                )}
                                            </div>
                                            <span className="text-[10px] text-gray-500 uppercase tracking-wider">Preparar</span>
                                        </div>

                                        {/* Connector */}
                                        <div className={`h-[2px] flex-1 mx-2 ${
                                            ['signing', 'confirming'].includes(status) ? 'bg-green-400' : 'bg-gray-600'
                                        }`} />

                                        {/* Step 2: Signing */}
                                        <div className="flex flex-col items-center flex-1">
                                            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center mb-2 ${
                                                status === 'signing'
                                                    ? 'border-[#FFD700] bg-[#FFD700]/20'
                                                    : status === 'confirming'
                                                    ? 'border-green-400 bg-green-400/20'
                                                    : 'border-gray-600 bg-gray-600/20'
                                            }`}>
                                                {status === 'confirming' ? (
                                                    <CheckCircle className="w-4 h-4 text-green-400" />
                                                ) : (
                                                    <Wallet className={`w-4 h-4 ${status === 'signing' ? 'text-[#FFD700]' : 'text-gray-600'}`} />
                                                )}
                                            </div>
                                            <span className="text-[10px] text-gray-500 uppercase tracking-wider">Firmar</span>
                                        </div>

                                        {/* Connector */}
                                        <div className={`h-[2px] flex-1 mx-2 ${
                                            status === 'confirming' ? 'bg-purple-400' : 'bg-gray-600'
                                        }`} />

                                        {/* Step 3: Confirming */}
                                        <div className="flex flex-col items-center flex-1">
                                            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center mb-2 ${
                                                status === 'confirming'
                                                    ? 'border-purple-400 bg-purple-400/20'
                                                    : 'border-gray-600 bg-gray-600/20'
                                            }`}>
                                                <CheckCheck className={`w-4 h-4 ${status === 'confirming' ? 'text-purple-400' : 'text-gray-600'}`} />
                                            </div>
                                            <span className="text-[10px] text-gray-500 uppercase tracking-wider">Confirmar</span>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* Transaction Hash */}
                            {txHash && status === 'success' && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 }}
                                    className="mb-6 p-3 bg-black/50 border border-[#333] rounded"
                                >
                                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-2 text-center">
                                        Transaction Hash
                                    </p>
                                    <p className="text-xs text-[#FFD700] font-mono text-center break-all">
                                        {txHash.slice(0, 10)}...{txHash.slice(-8)}
                                    </p>
                                </motion.div>
                            )}

                            {/* Custom Message */}
                            {message && status !== 'error' && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.5 }}
                                    className="mb-6 p-3 bg-[#FFD700]/5 border border-[#FFD700]/20 rounded"
                                >
                                    <p className="text-xs text-gray-300 text-center">
                                        {message}
                                    </p>
                                </motion.div>
                            )}

                            {/* Close Button - Only show when complete */}
                            {isComplete && (
                                <motion.button
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.6 }}
                                    onClick={onClose}
                                    className={`w-full py-4 font-bold text-sm uppercase tracking-widest transition-colors rounded ${
                                        status === 'success'
                                            ? 'bg-green-500 text-white hover:bg-green-600'
                                            : 'bg-red-500 text-white hover:bg-red-600'
                                    }`}
                                >
                                    {status === 'success' ? 'Continuar' : 'Cerrar'}
                                </motion.button>
                            )}

                            {/* Privy Badge */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.7 }}
                                className="mt-6 flex items-center justify-center gap-2"
                            >
                                <div className="w-1 h-1 rounded-full bg-[#FFD700]" />
                                <p className="text-[10px] text-gray-600 uppercase tracking-widest">
                                    Firmado con Privy Embedded Wallet
                                </p>
                                <div className="w-1 h-1 rounded-full bg-[#FFD700]" />
                            </motion.div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
};

export default TransactionFeedback;

