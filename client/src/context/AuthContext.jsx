import { createContext, useContext, useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const AuthProvider = ({ children }) => {
    const { ready, authenticated, user: privyUser, login: privyLogin, logout: privyLogout } = usePrivy();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [needsRegistration, setNeedsRegistration] = useState(false);

    useEffect(() => {
        const checkUserInDatabase = async () => {
            if (ready) {
                setLoading(false);
                if (authenticated && privyUser) {
                    const privyId = privyUser.id;
                    const walletAddress = privyUser.wallet?.address || null;
                    
                    try {
                        const response = await fetch(`${API_URL}/api/users/${privyId}`);
                        const data = await response.json();
                        
                        if (data.found && data.user) {
                            const dbUser = data.user;
                            setUser({
                                role: dbUser.user_type === 'vendor' ? 'admin' : 'client',
                                userType: dbUser.user_type,
                                name: dbUser.full_name || privyUser.email?.address || walletAddress?.slice(0, 10) || 'User',
                                wallet: walletAddress,
                                privyId: privyId,
                                profile: {
                                    fullName: dbUser.full_name,
                                    email: dbUser.email,
                                    phone: dbUser.phone,
                                    location: dbUser.location,
                                    businessName: dbUser.business_name
                                },
                                isRegistered: true,
                                profileComplete: dbUser.profile_complete
                            });
                            setNeedsRegistration(false);
                        } else {
                            setUser({
                                role: 'client',
                                name: privyUser.email?.address || walletAddress?.slice(0, 10) || 'User',
                                wallet: walletAddress,
                                privyId: privyId,
                                isRegistered: false
                            });
                            setNeedsRegistration(true);
                        }
                    } catch (error) {
                        console.error('Error checking user in database:', error);
                        setUser({
                            role: 'client',
                            name: privyUser.email?.address || walletAddress?.slice(0, 10) || 'User',
                            wallet: walletAddress,
                            privyId: privyId,
                            isRegistered: false
                        });
                        setNeedsRegistration(true);
                    }
                } else {
                    setUser(null);
                    setNeedsRegistration(false);
                }
            }
        };

        checkUserInDatabase();
    }, [ready, authenticated, privyUser]);

    const connectWallet = async () => {
        privyLogin();
    };

    const completeRegistration = async (userType, profileData) => {
        const privyId = user?.privyId;
        const walletAddress = user?.wallet;
        
        if (!privyId) return false;

        try {
            const response = await fetch(`${API_URL}/api/users`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    privyId,
                    walletAddress,
                    userType,
                    profile: profileData
                }),
            });

            const data = await response.json();
            
            if (data.success) {
                setUser(prev => ({
                    ...prev,
                    role: userType === 'vendor' ? 'admin' : 'client',
                    userType,
                    profile: profileData,
                    isRegistered: true,
                    profileComplete: profileData.fullName ? true : false,
                    name: profileData.fullName || prev?.name
                }));

                setNeedsRegistration(false);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error completing registration:', error);
            return false;
        }
    };

    const updateUserProfile = async (profileData) => {
        const privyId = user?.privyId;
        if (!privyId) return false;

        try {
            const response = await fetch(`${API_URL}/api/users/${privyId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    profile: profileData
                }),
            });

            const data = await response.json();
            
            if (data.success) {
                setUser(prev => ({
                    ...prev,
                    profile: { ...prev?.profile, ...profileData },
                    name: profileData.fullName || prev?.name,
                    profileComplete: profileData.fullName ? true : prev?.profileComplete
                }));
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error updating profile:', error);
            return false;
        }
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
