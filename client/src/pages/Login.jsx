import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import AnimatedBackground from '../components/AnimatedBackground';
import logo from '../assets/logo.jpg';
import { Wallet, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const { connectWallet, loading, authenticated, user, ready, needsRegistration } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (ready && authenticated && user) {
            if (needsRegistration) {
                navigate('/register');
            } else if (user.role === 'admin') {
                navigate('/admin');
            } else {
                navigate('/client');
            }
        }
    }, [ready, authenticated, user, navigate, needsRegistration]);

    const handleWallet = async () => {
        await connectWallet();
    };

    if (!ready) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black">
                <div className="text-[#FFD700] text-xl animate-pulse">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
            <AnimatedBackground />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                className="glass-panel w-full max-w-[500px] p-10 md:p-14 relative z-10 flex flex-col items-center border-t-2 border-t-[#FFD700]"
            >
                <div className="relative mb-12 text-center group">
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.8 }}
                        className="w-48 h-48 md:w-56 md:h-56 mx-auto mb-6 relative"
                    >
                        <div className="absolute inset-0 bg-[#FFD700] rounded-full blur-[40px] opacity-20 animate-pulse" />
                        <img
                            src={logo}
                            alt="Chain Ticket Logo"
                            className="w-full h-full object-cover rounded-full border border-[#FFD700]/30 shadow-2xl relative z-10"
                        />
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="text-4xl md:text-5xl font-bold text-gradient-gold font-serif tracking-widest uppercase"
                    >
                        Chain Ticket
                    </motion.h1>
                    <p className="text-[#FFD700] text-xs tracking-[0.6em] uppercase mt-3 font-light">Exclusive Access</p>
                </div>

                <motion.button
                    onClick={handleWallet}
                    disabled={loading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="btn-premium w-full flex items-center justify-center gap-4"
                >
                    {loading ? 'CONNECTING...' : (
                        <>
                            <Wallet className="w-5 h-5" />
                            <span className="font-serif">ENTER PORTAL</span>
                            <ArrowRight className="w-5 h-5" />
                        </>
                    )}
                </motion.button>

                <p className="text-[10px] text-gray-500 mt-6 text-center tracking-widest uppercase">
                    Email, Wallet, or Social Login
                </p>
            </motion.div>

            <div className="absolute bottom-6 text-[10px] text-[#444] tracking-[0.5em] font-mono uppercase">
                Secured by Movement M1
            </div>
        </div>
    );
};

export default Login;
