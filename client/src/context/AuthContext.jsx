import { createContext, useContext, useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

const REGISTERED_WALLETS_KEY = 'chainticket_registered_wallets';

const getRegisteredWallets = () => {
    try {
        const data = localStorage.getItem(REGISTERED_WALLETS_KEY);
        return data ? JSON.parse(data) : {};
    } catch {
        return {};
    }
};

const saveRegisteredWallet = (walletAddress, userData) => {
    const wallets = getRegisteredWallets();
    wallets[walletAddress] = userData;
    localStorage.setItem(REGISTERED_WALLETS_KEY, JSON.stringify(wallets));
};

export const AuthProvider = ({ children }) => {
    const { ready, authenticated, user: privyUser, login: privyLogin, logout: privyLogout } = usePrivy();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [needsRegistration, setNeedsRegistration] = useState(false);

    useEffect(() => {
        if (ready) {
            setLoading(false);
            if (authenticated && privyUser) {
                const walletAddress = privyUser.wallet?.address || null;
                const registeredWallets = getRegisteredWallets();
                const existingUser = walletAddress ? registeredWallets[walletAddress] : null;

                if (existingUser) {
                    setUser({
                        role: existingUser.userType === 'vendor' ? 'admin' : 'client',
                        userType: existingUser.userType,
                        name: existingUser.profile?.fullName || privyUser.wallet?.address?.slice(0, 10) || 'User',
                        wallet: walletAddress,
                        privyId: privyUser.id,
                        profile: existingUser.profile,
                        isRegistered: true
                    });
                    setNeedsRegistration(false);
                } else {
                    setUser({
                        role: 'client',
                        name: privyUser.email?.address || privyUser.wallet?.address?.slice(0, 10) || 'User',
                        wallet: walletAddress,
                        privyId: privyUser.id,
                        isRegistered: false
                    });
                    setNeedsRegistration(true);
                }
            } else {
                setUser(null);
                setNeedsRegistration(false);
            }
        }
    }, [ready, authenticated, privyUser]);

    const login = async (username, password) => {
        setLoading(true);
        await new Promise(resolve => setTimeout(resolve, 1000));

        if (username === 'admin' && password === '123') {
            setUser({ role: 'admin', name: 'Admin User', isRegistered: true, userType: 'vendor' });
            setLoading(false);
            return true;
        }

        if (username === 'user' && password === '123') {
            setUser({ role: 'client', name: 'Client User', isRegistered: true, userType: 'user' });
            setLoading(false);
            return true;
        }

        setLoading(false);
        return false;
    };

    const connectWallet = async () => {
        privyLogin();
    };

    const completeRegistration = async (userType, profileData) => {
        const walletAddress = user?.wallet;
        if (!walletAddress) return false;

        const userData = {
            userType,
            profile: profileData,
            registeredAt: Date.now()
        };

        saveRegisteredWallet(walletAddress, userData);

        setUser(prev => ({
            ...prev,
            role: userType === 'vendor' ? 'admin' : 'client',
            userType,
            profile: profileData,
            isRegistered: true,
            name: profileData.fullName || prev?.name
        }));

        setNeedsRegistration(false);
        return true;
    };

    const updateUserProfile = (profileData) => {
        const walletAddress = user?.wallet;
        if (walletAddress) {
            const registeredWallets = getRegisteredWallets();
            if (registeredWallets[walletAddress]) {
                registeredWallets[walletAddress].profile = {
                    ...registeredWallets[walletAddress].profile,
                    ...profileData
                };
                localStorage.setItem(REGISTERED_WALLETS_KEY, JSON.stringify(registeredWallets));
            }
        }

        setUser(prev => ({
            ...prev,
            profile: { ...prev?.profile, ...profileData },
            name: profileData.fullName || prev?.name
        }));
    };

    const logout = async () => {
        if (authenticated) {
            await privyLogout();
        }
        setUser(null);
        setNeedsRegistration(false);
    };

    return (
        <AuthContext.Provider value={{
            user,
            login,
            logout,
            connectWallet,
            loading,
            ready,
            authenticated,
            needsRegistration,
            completeRegistration,
            updateUserProfile
        }}>
            {children}
        </AuthContext.Provider>
    );
};
