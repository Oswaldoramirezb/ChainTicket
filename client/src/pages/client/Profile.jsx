import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import { User, Mail, Phone, MapPin, Save, Edit2 } from 'lucide-react';

const Profile = () => {
    const { user, updateUserProfile } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        fullName: user?.profile?.fullName || '',
        email: user?.profile?.email || '',
        phone: user?.profile?.phone || '',
        location: user?.profile?.location || ''
    });

    const handleSave = () => {
        updateUserProfile(formData);
        setIsEditing(false);
    };

    return (
        <div className="pb-20 max-w-2xl mx-auto">
            <div className="mb-12 text-center">
                <h2 className="text-4xl md:text-5xl font-bold font-serif text-gradient-gold tracking-widest uppercase">My Profile</h2>
                <div className="w-[1px] h-16 bg-gradient-to-b from-[#FFD700] to-transparent mx-auto mt-6" />
                <p className="text-gray-400 text-sm mt-4 tracking-widest uppercase">Manage your account information</p>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#050505] border border-[#222] p-8"
            >
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#FFD700] to-[#B8860B] flex items-center justify-center">
                            <User className="w-8 h-8 text-black" />
                        </div>
                        <div>
                            <p className="text-[#FFD700] font-mono text-sm">{user?.wallet ? user.wallet.substring(0, 16) + '...' : 'No Wallet'}</p>
                            <p className="text-gray-500 text-xs uppercase tracking-widest mt-1">{user?.userType === 'vendor' ? 'Vendor Account' : 'User Account'}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                        className="flex items-center gap-2 px-4 py-2 border border-[#FFD700] text-[#FFD700] hover:bg-[#FFD700] hover:text-black transition-all text-sm uppercase tracking-widest"
                    >
                        {isEditing ? <Save className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                        {isEditing ? 'Save' : 'Edit'}
                    </button>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="text-[10px] text-gray-500 uppercase tracking-widest mb-2 block">Full Name</label>
                        <div className="flex items-center gap-3 bg-black/50 border border-[#333] p-4">
                            <User className="w-5 h-5 text-[#666]" />
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={formData.fullName}
                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                    className="bg-transparent flex-1 text-white outline-none"
                                    placeholder="Enter your full name"
                                />
                            ) : (
                                <span className="text-white">{formData.fullName || 'Not set'}</span>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] text-gray-500 uppercase tracking-widest mb-2 block">Email</label>
                        <div className="flex items-center gap-3 bg-black/50 border border-[#333] p-4">
                            <Mail className="w-5 h-5 text-[#666]" />
                            {isEditing ? (
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="bg-transparent flex-1 text-white outline-none"
                                    placeholder="Enter your email"
                                />
                            ) : (
                                <span className="text-white">{formData.email || 'Not set'}</span>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] text-gray-500 uppercase tracking-widest mb-2 block">Phone</label>
                        <div className="flex items-center gap-3 bg-black/50 border border-[#333] p-4">
                            <Phone className="w-5 h-5 text-[#666]" />
                            {isEditing ? (
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="bg-transparent flex-1 text-white outline-none"
                                    placeholder="Enter your phone"
                                />
                            ) : (
                                <span className="text-white">{formData.phone || 'Not set'}</span>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] text-gray-500 uppercase tracking-widest mb-2 block">Location</label>
                        <div className="flex items-center gap-3 bg-black/50 border border-[#333] p-4">
                            <MapPin className="w-5 h-5 text-[#666]" />
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    className="bg-transparent flex-1 text-white outline-none"
                                    placeholder="Enter your location"
                                />
                            ) : (
                                <span className="text-white">{formData.location || 'Not set'}</span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-[#222]">
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">Account Type</p>
                    <div className="inline-block px-4 py-2 bg-[#FFD700]/10 border border-[#FFD700]/30 text-[#FFD700] text-sm uppercase tracking-widest">
                        {user?.userType === 'vendor' ? 'Vendor' : 'User'}
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Profile;
