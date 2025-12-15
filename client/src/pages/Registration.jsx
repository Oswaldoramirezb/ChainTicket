import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import AnimatedBackground from '../components/AnimatedBackground';
import { User, Store, ArrowRight, Mail, Phone, MapPin, Building } from 'lucide-react';

const Registration = () => {
    const { completeRegistration, user } = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [userType, setUserType] = useState(null);
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        location: '',
        businessName: ''
    });

    const handleTypeSelect = (type) => {
        setUserType(type);
        setStep(2);
    };

    const handleSubmit = async () => {
        await completeRegistration(userType, formData);
        if (userType === 'vendor') {
            navigate('/admin');
        } else {
            navigate('/client');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
            <AnimatedBackground />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="glass-panel w-full max-w-[600px] p-10 md:p-14 relative z-10 border-t-2 border-t-[#FFD700]"
            >
                {step === 1 && (
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-center"
                    >
                        <h2 className="text-3xl md:text-4xl font-bold font-serif text-gradient-gold tracking-widest uppercase mb-4">
                            Welcome
                        </h2>
                        <p className="text-gray-400 text-sm mb-12 tracking-widest">How would you like to register?</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <button
                                onClick={() => handleTypeSelect('user')}
                                className="group p-8 border border-[#333] hover:border-[#FFD700] bg-black/50 transition-all duration-300"
                            >
                                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[#FFD700]/10 flex items-center justify-center group-hover:bg-[#FFD700]/20 transition-colors">
                                    <User className="w-8 h-8 text-[#FFD700]" />
                                </div>
                                <h3 className="text-xl font-serif text-white mb-2">User</h3>
                                <p className="text-gray-500 text-xs tracking-wide">Browse and purchase tickets for events and services</p>
                            </button>

                            <button
                                onClick={() => handleTypeSelect('vendor')}
                                className="group p-8 border border-[#333] hover:border-[#FFD700] bg-black/50 transition-all duration-300"
                            >
                                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[#FFD700]/10 flex items-center justify-center group-hover:bg-[#FFD700]/20 transition-colors">
                                    <Store className="w-8 h-8 text-[#FFD700]" />
                                </div>
                                <h3 className="text-xl font-serif text-white mb-2">Vendor</h3>
                                <p className="text-gray-500 text-xs tracking-wide">Publish and sell tickets for your events and services</p>
                            </button>
                        </div>
                    </motion.div>
                )}

                {step === 2 && (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        <div className="text-center mb-10">
                            <div className="inline-block px-4 py-1 bg-[#FFD700]/10 border border-[#FFD700]/30 text-[#FFD700] text-xs uppercase tracking-widest mb-4">
                                {userType === 'vendor' ? 'Vendor Registration' : 'User Registration'}
                            </div>
                            <h2 className="text-2xl md:text-3xl font-bold font-serif text-white tracking-widest uppercase">
                                Complete Your Profile
                            </h2>
                        </div>

                        <div className="space-y-5">
                            <div>
                                <label className="text-[10px] text-gray-500 uppercase tracking-widest mb-2 block">Full Name *</label>
                                <div className="flex items-center gap-3 bg-black/50 border border-[#333] focus-within:border-[#FFD700] p-4 transition-colors">
                                    <User className="w-5 h-5 text-[#666]" />
                                    <input
                                        type="text"
                                        value={formData.fullName}
                                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                        className="bg-transparent flex-1 text-white outline-none"
                                        placeholder="Enter your full name"
                                        required
                                    />
                                </div>
                            </div>

                            {userType === 'vendor' && (
                                <div>
                                    <label className="text-[10px] text-gray-500 uppercase tracking-widest mb-2 block">Business Name *</label>
                                    <div className="flex items-center gap-3 bg-black/50 border border-[#333] focus-within:border-[#FFD700] p-4 transition-colors">
                                        <Building className="w-5 h-5 text-[#666]" />
                                        <input
                                            type="text"
                                            value={formData.businessName}
                                            onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                                            className="bg-transparent flex-1 text-white outline-none"
                                            placeholder="Enter your business name"
                                            required
                                        />
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="text-[10px] text-gray-500 uppercase tracking-widest mb-2 block">Email</label>
                                <div className="flex items-center gap-3 bg-black/50 border border-[#333] focus-within:border-[#FFD700] p-4 transition-colors">
                                    <Mail className="w-5 h-5 text-[#666]" />
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="bg-transparent flex-1 text-white outline-none"
                                        placeholder="Enter your email"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] text-gray-500 uppercase tracking-widest mb-2 block">Phone</label>
                                <div className="flex items-center gap-3 bg-black/50 border border-[#333] focus-within:border-[#FFD700] p-4 transition-colors">
                                    <Phone className="w-5 h-5 text-[#666]" />
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="bg-transparent flex-1 text-white outline-none"
                                        placeholder="Enter your phone number"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] text-gray-500 uppercase tracking-widest mb-2 block">Location</label>
                                <div className="flex items-center gap-3 bg-black/50 border border-[#333] focus-within:border-[#FFD700] p-4 transition-colors">
                                    <MapPin className="w-5 h-5 text-[#666]" />
                                    <input
                                        type="text"
                                        value={formData.location}
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                        className="bg-transparent flex-1 text-white outline-none"
                                        placeholder="Enter your location"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4 mt-10">
                            <button
                                onClick={() => setStep(1)}
                                className="flex-1 py-4 border border-[#333] text-gray-400 hover:text-white hover:border-white transition-all text-sm uppercase tracking-widest"
                            >
                                Back
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={!formData.fullName || (userType === 'vendor' && !formData.businessName)}
                                className="flex-1 py-4 bg-[#FFD700] text-black font-bold text-sm uppercase tracking-widest hover:bg-[#B8860B] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                Complete
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </motion.div>
                )}
            </motion.div>
        </div>
    );
};

export default Registration;
