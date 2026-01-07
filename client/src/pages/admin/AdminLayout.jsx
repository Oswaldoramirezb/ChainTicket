import { useNavigate, Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogOut, LayoutDashboard, ListPlus, Shield, User, Wallet, KeyRound } from 'lucide-react';
import AnimatedBackground from '../../components/AnimatedBackground';

const AdminLayout = () => {
    const { logout, user, connectWallet, isGuest, exitGuestMode } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleLogin = async () => {
        await connectWallet();
    };

    const handleExitGuest = () => {
        exitGuestMode();
        navigate('/login');
    };

    const isActive = (path) => location.pathname === path;

    return (
        <div className="min-h-screen relative text-white flex flex-col pb-20 md:pb-0">
            <AnimatedBackground />

            {isGuest && (
                <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-b border-yellow-500/30 px-4 py-2 flex justify-between items-center z-50">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] text-yellow-400 uppercase tracking-widest">Guest Mode</span>
                        <span className="text-[9px] text-gray-400">- Services cannot be activated</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleLogin}
                            className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-yellow-400 hover:text-white transition-colors bg-yellow-500/20 hover:bg-yellow-500/30 px-3 py-1.5 rounded"
                        >
                            <KeyRound className="w-3 h-3" />
                            <span>Sign In with Privy</span>
                        </button>
                        <button
                            onClick={handleExitGuest}
                            className="text-[10px] text-gray-500 hover:text-white transition-colors"
                        >
                            Exit
                        </button>
                    </div>
                </div>
            )}

            <div className="glass-panel sticky top-0 z-50 px-6 py-4 flex justify-between items-center border-b border-white/5">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded border border-yellow-500/30 flex items-center justify-center bg-black/50">
                        <Shield className="w-5 h-5 text-yellow-500" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold tracking-[0.1em] text-gradient-gold">ADMIN DASHBOARD</h1>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest">
                            {isGuest ? 'Preview Mode' : 'Management Console'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {!isGuest && user?.wallet && (
                        <div className="hidden md:flex flex-col items-end bg-black/30 border border-yellow-500/20 px-4 py-2 rounded">
                            <p className="text-[9px] text-gray-500 uppercase tracking-widest mb-1">Connected Wallet</p>
                            <div className="flex items-center gap-2">
                                <Wallet className="w-3 h-3 text-yellow-500" />
                                <p className="text-xs font-mono text-yellow-500 font-semibold">
                                    {user.wallet}
                                </p>
                            </div>
                        </div>
                    )}
                    {!isGuest && (
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#94a3b8] hover:text-white transition-colors border border-transparent hover:border-white/10 px-4 py-2 rounded"
                        >
                            <LogOut className="w-4 h-4" />
                            <span>Logout</span>
                        </button>
                    )}
                </div>
            </div>

            <div className="flex flex-1">
                <aside className="w-64 hidden md:flex flex-col border-r border-white/5 bg-black/20 pt-8">
                    <nav className="space-y-2 px-4">
                        <Link
                            to="/admin"
                            className={`flex items-center gap-3 px-4 py-4 rounded transition-all group ${isActive('/admin') ? 'bg-yellow-500/10 border-l-2 border-yellow-500 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                        >
                            <LayoutDashboard className={`w-5 h-5 ${isActive('/admin') ? 'text-yellow-500' : 'group-hover:text-yellow-500 transition-colors'}`} />
                            <span className="text-sm tracking-wide font-medium">Overview</span>
                        </Link>
                        <Link
                            to="/admin/services"
                            className={`flex items-center gap-3 px-4 py-4 rounded transition-all group ${isActive('/admin/services') ? 'bg-yellow-500/10 border-l-2 border-yellow-500 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                        >
                            <ListPlus className={`w-5 h-5 ${isActive('/admin/services') ? 'text-yellow-500' : 'group-hover:text-yellow-500 transition-colors'}`} />
                            <span className="text-sm tracking-wide font-medium">Services</span>
                        </Link>
                        <Link
                            to="/admin/profile"
                            className={`flex items-center gap-3 px-4 py-4 rounded transition-all group ${isActive('/admin/profile') ? 'bg-yellow-500/10 border-l-2 border-yellow-500 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                        >
                            <User className={`w-5 h-5 ${isActive('/admin/profile') ? 'text-yellow-500' : 'group-hover:text-yellow-500 transition-colors'}`} />
                            <span className="text-sm tracking-wide font-medium">My Profile</span>
                        </Link>
                    </nav>
                </aside>

                <main className="flex-1 p-6 md:p-10 pt-8 overflow-y-auto">
                    <Outlet />
                </main>
            </div>

            <div className="fixed bottom-0 left-0 w-full h-20 bg-black border-t border-[#222] flex justify-around items-center z-50 md:hidden">
                <Link
                    to="/admin"
                    className={`flex flex-col items-center gap-1 transition-all ${isActive('/admin') ? 'text-[#FFD700]' : 'text-[#444]'}`}
                >
                    <LayoutDashboard className="w-5 h-5" />
                    <span className="text-[9px] uppercase font-bold tracking-[0.2em] mt-2">Overview</span>
                </Link>
                <div className="w-[1px] h-8 bg-[#222]" />
                <Link
                    to="/admin/services"
                    className={`flex flex-col items-center gap-1 transition-all ${isActive('/admin/services') ? 'text-[#FFD700]' : 'text-[#444]'}`}
                >
                    <ListPlus className="w-5 h-5" />
                    <span className="text-[9px] uppercase font-bold tracking-[0.2em] mt-2">Services</span>
                </Link>
                <div className="w-[1px] h-8 bg-[#222]" />
                <Link
                    to="/admin/profile"
                    className={`flex flex-col items-center gap-1 transition-all ${isActive('/admin/profile') ? 'text-[#FFD700]' : 'text-[#444]'}`}
                >
                    <User className="w-5 h-5" />
                    <span className="text-[9px] uppercase font-bold tracking-[0.2em] mt-2">Profile</span>
                </Link>
            </div>
        </div>
    );
};

export default AdminLayout;
