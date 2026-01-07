import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, Check, Sparkles, Shield, Key, X } from 'lucide-react';
import { usePrivy, useWallets } from '@privy-io/react-auth';

const WalletWelcomeModal = () => {
    const { authenticated, user } = usePrivy();
    const { wallets } = useWallets();
    const [isOpen, setIsOpen] = useState(false);
    const [step, setStep] = useState(0);

    const wallet = wallets && wallets.length > 0 ? wallets[0] : null;
    const address = wallet?.address;

    useEffect(() => {
        // Check if user is authenticated and has a wallet
        if (authenticated && address && user) {
            const userId = user.id;
            const hasSeenWelcome = localStorage.getItem(`wallet_welcome_seen_${userId}`);
            
            // Show modal only if user hasn't seen it before
            if (!hasSeenWelcome) {
                setTimeout(() => {
                    setIsOpen(true);
                    // Auto-advance through steps
                    setTimeout(() => setStep(1), 1500);
                    setTimeout(() => setStep(2), 3000);
                }, 500);
            }
        }
    }, [authenticated, address, user]);

    const handleClose = () => {
        if (user) {
            localStorage.setItem(`wallet_welcome_seen_${user.id}`, 'true');
        }
        setIsOpen(false);
    };

    const formatAddress = (addr) => {
        if (!addr) return '';
        return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]"
                        onClick={handleClose}
                    />

                    {/* Modal */}
                    <div className="fixed inset-0 flex items-center justify-center z-[101] p-6">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            transition={{ type: "spring", duration: 0.5 }}
                            className="glass-panel max-w-md w-full p-8 relative border-t-4 border-t-[#FFD700]"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Close button */}
                            <button
                                onClick={handleClose}
                                className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            {/* Success Icon */}
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                                className="relative w-20 h-20 mx-auto mb-6"
                            >
                                <div className="absolute inset-0 bg-[#FFD700] rounded-full blur-xl opacity-50 animate-pulse" />
                                <div className="relative w-full h-full bg-[#FFD700]/20 rounded-full border-2 border-[#FFD700] flex items-center justify-center">
                                    <Wallet className="w-10 h-10 text-[#FFD700]" />
                                </div>
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.5 }}
                                    className="absolute -bottom-1 -right-1 w-8 h-8 bg-green-500 rounded-full border-2 border-black flex items-center justify-center"
                                >
                                    <Check className="w-5 h-5 text-white" />
                                </motion.div>
                            </motion.div>

                            {/* Title */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="text-center mb-6"
                            >
                                <h2 className="text-2xl font-bold font-serif text-gradient-gold mb-2">
                                    ¡Wallet Creada!
                                </h2>
                                <p className="text-gray-400 text-sm">
                                    Tu wallet embebida de Privy está lista
                                </p>
                            </motion.div>

                            {/* Features */}
                            <div className="space-y-4 mb-6">
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: step >= 0 ? 1 : 0.3, x: 0 }}
                                    transition={{ delay: 0.4 }}
                                    className={`flex items-start gap-3 p-3 rounded bg-black/50 border ${step >= 0 ? 'border-[#FFD700]/30' : 'border-[#333]'}`}
                                >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${step >= 0 ? 'bg-[#FFD700]/20' : 'bg-[#333]'}`}>
                                        <Sparkles className={`w-4 h-4 ${step >= 0 ? 'text-[#FFD700]' : 'text-gray-600'}`} />
                                    </div>
                                    <div>
                                        <p className="text-white text-sm font-semibold mb-1">Creación Automática</p>
                                        <p className="text-gray-400 text-xs">
                                            Tu wallet se creó automáticamente al iniciar sesión
                                        </p>
                                    </div>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: step >= 1 ? 1 : 0.3, x: 0 }}
                                    transition={{ delay: 0.6 }}
                                    className={`flex items-start gap-3 p-3 rounded bg-black/50 border ${step >= 1 ? 'border-green-500/30' : 'border-[#333]'}`}
                                >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${step >= 1 ? 'bg-green-500/20' : 'bg-[#333]'}`}>
                                        <Shield className={`w-4 h-4 ${step >= 1 ? 'text-green-400' : 'text-gray-600'}`} />
                                    </div>
                                    <div>
                                        <p className="text-white text-sm font-semibold mb-1">Máxima Seguridad</p>
                                        <p className="text-gray-400 text-xs">
                                            Gestionada por Privy - Sin riesgo de perder claves
                                        </p>
                                    </div>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: step >= 2 ? 1 : 0.3, x: 0 }}
                                    transition={{ delay: 0.8 }}
                                    className={`flex items-start gap-3 p-3 rounded bg-black/50 border ${step >= 2 ? 'border-blue-500/30' : 'border-[#333]'}`}
                                >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${step >= 2 ? 'bg-blue-500/20' : 'bg-[#333]'}`}>
                                        <Key className={`w-4 h-4 ${step >= 2 ? 'text-blue-400' : 'text-gray-600'}`} />
                                    </div>
                                    <div>
                                        <p className="text-white text-sm font-semibold mb-1">Sin Claves Privadas</p>
                                        <p className="text-gray-400 text-xs">
                                            No necesitas recordar ni guardar seed phrases
                                        </p>
                                    </div>
                                </motion.div>
                            </div>

                            {/* Wallet Address */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 1 }}
                                className="mb-6 p-4 bg-[#FFD700]/5 border border-[#FFD700]/20 rounded"
                            >
                                <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-2 text-center">
                                    Tu Dirección
                                </p>
                                <p className="text-[#FFD700] font-mono text-sm text-center font-semibold">
                                    {formatAddress(address)}
                                </p>
                            </motion.div>

                            {/* CTA Button */}
                            <motion.button
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 1.2 }}
                                onClick={handleClose}
                                className="w-full py-4 bg-[#FFD700] text-black font-bold text-sm uppercase tracking-widest hover:bg-[#B8860B] transition-colors rounded"
                            >
                                Comenzar a Usar
                            </motion.button>

                            {/* Powered by Privy */}
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1.4 }}
                                className="text-center text-[10px] text-gray-600 mt-4 uppercase tracking-widest"
                            >
                                🔒 Powered by Privy Embedded Wallets
                            </motion.p>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
};

export default WalletWelcomeModal;

