import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import { User, Mail, Phone, MapPin, Save, Edit2, Building } from 'lucide-react';

const AdminProfile = () => {
    const { user, updateUserProfile } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        fullName: user?.profile?.fullName || '',
        email: user?.profile?.email || '',
        phone: user?.profile?.phone || '',
        location: user?.profile?.location || '',
        businessName: user?.profile?.businessName || ''
    });

    const handleSave = () => {
        updateUserProfile(formData);
        setIsEditing(false);
    };

    return (
        <div className="max-w-2xl mx-auto pb-20">
            <div className="flex items-center justify-between mb-12 border-b border-[#333] pb-6">
                <div>
                    <h2 className="text-4xl font-bold font-serif tracking-wide text-gradient-gold">My Profile</h2>
                    <p className="text-sm uppercase tracking-[0.2em] text-[#888] mt-2">Manage your account</p>
                </div>
                <button
                    onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                    className="flex items-center gap-2 px-6 py-3 border border-[#FFD700] text-[#FFD700] hover:bg-[#FFD700] hover:text-black transition-all text-sm uppercase tracking-widest"
                >
                    {isEditing ? <Save className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                    {isEditing ? 'Save Changes' : 'Edit Profile'}
                </button>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
            >
                <div className="bg-[#111] border border-[#333] p-6">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#FFD700] to-[#B8860B] flex items-center justify-center">
                            <User className="w-10 h-10 text-black" />
                        </div>
                        <div>
                            <p className="text-white text-xl font-serif">{formData.fullName || 'Admin User'}</p>
                            <p className="text-[#FFD700] font-mono text-sm mt-1">Administrator</p>
                        </div>
                    </div>
                </div>

                <div className="bg-[#111] border border-[#333] p-6 space-y-6">
                    <h3 className="text-lg font-bold text-white uppercase tracking-widest mb-4">Personal Information</h3>
                    
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
                        <label className="text-[10px] text-gray-500 uppercase tracking-widest mb-2 block">Business Name</label>
                        <div className="flex items-center gap-3 bg-black/50 border border-[#333] p-4">
                            <Building className="w-5 h-5 text-[#666]" />
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={formData.businessName}
                                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                                    className="bg-transparent flex-1 text-white outline-none"
                                    placeholder="Enter your business name"
                                />
                            ) : (
                                <span className="text-white">{formData.businessName || 'Not set'}</span>
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
            </motion.div>
        </div>
    );
};

export default AdminProfile;
