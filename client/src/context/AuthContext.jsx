import { createContext, useContext, useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

// Backend API URL - Using CloudFront HTTPS to avoid mixed content issues
const API_URL = import.meta.env.VITE_API_URL || 'https://d4y2c4layjh2.cloudfront.net';

const GUEST_EXPIRY_HOURS = 24;

const generateGuestId = () => {
  return 'guest_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

const isGuestExpired = (guestData) => {
  if (!guestData || !guestData.createdAt) return true;
  const expiryTime = guestData.createdAt + (GUEST_EXPIRY_HOURS * 60 * 60 * 1000);
  return Date.now() > expiryTime;
};

export const AuthProvider = ({ children }) => {
  const { ready, authenticated, user: privyUser, login: privyLogin, logout: privyLogout } = usePrivy();
  
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [needsRegistration, setNeedsRegistration] = useState(false);
  const [guestData, setGuestData] = useState(null);

  // Limpiar sesiones guest expiradas al cargar, pero NO restaurar automáticamente
  useEffect(() => {
    const storedGuest = localStorage.getItem('guestSession');
    if (storedGuest) {
      try {
        const parsed = JSON.parse(storedGuest);
        if (isGuestExpired(parsed)) {
          localStorage.removeItem('guestSession');
        }
        // NO setear user aquí - dejar que el usuario elija en /login
      } catch (e) {
        localStorage.removeItem('guestSession');
      }
    }
  }, []);

  // Check guest expiry periodically (only if user is guest)
  useEffect(() => {
    if (!user?.isGuest) return;
    
    const checkExpiry = () => {
      const storedGuest = localStorage.getItem('guestSession');
      if (storedGuest) {
        try {
          const parsed = JSON.parse(storedGuest);
          if (isGuestExpired(parsed)) {
            localStorage.removeItem('guestSession');
            setUser(null);
            setGuestData(null);
          }
        } catch (e) {
          localStorage.removeItem('guestSession');
          setUser(null);
          setGuestData(null);
        }
      }
    };
    
    const interval = setInterval(checkExpiry, 60000);
    return () => clearInterval(interval);
  }, [user?.isGuest]);

  // Handle Privy authentication
  useEffect(() => {
    const checkUserInDatabase = async () => {
      if (ready) setLoading(false);
      
      if (authenticated && privyUser) {
        // Clear any guest session when real auth happens
        const storedGuest = localStorage.getItem('guestSession');
        let previousGuestData = null;
        if (storedGuest) {
          try {
            previousGuestData = JSON.parse(storedGuest);
            localStorage.removeItem('guestSession');
          } catch (e) {
            // ignore
          }
        }
        
        const privyId = privyUser.id;
        const walletAddress = privyUser.wallet?.address || null;
        
        try {
          const response = await fetch(`${API_URL}/api/users/${privyId}`);
          const data = await response.json();
          
          if (data.found && data.user) {
            const dbUser = data.user;
            console.log('User from DB:', { 
              usertype: dbUser.usertype, 
              willSetRole: dbUser.usertype === 'vendor' ? 'admin' : 'client',
              fullUser: dbUser 
            });
            
            setUser({
              role: dbUser.userType || dbUser.usertype === 'vendor' ? 'admin' : 'client',
              userType: dbUser.userType || dbUser.usertype,
              name: dbUser.fullName || dbUser.fullname || privyUser.email?.address || walletAddress?.slice(0, 10) || 'User',
              wallet: walletAddress,
              privyId: privyId,
              profile: {
                fullName: dbUser.fullName || dbUser.fullname,
                email: dbUser.email,
                phone: dbUser.phone,
                location: dbUser.location,
                businessName: dbUser.businessName || dbUser.businessname,
                businessCategory: dbUser.businessCategory || dbUser.businesscategory
              },
              isRegistered: true,
              isGuest: false,
              profileComplete: dbUser.profileComplete || dbUser.profilecomplete,
              previousGuestData: previousGuestData?.data || null
            });
            setNeedsRegistration(false);
            setGuestData(null);
          } else {
            // User not in DB - needs registration
            setUser({
              role: previousGuestData?.role === 'admin' ? 'admin' : 'client',
              name: privyUser.email?.address || walletAddress?.slice(0, 10) || 'User',
              wallet: walletAddress,
              privyId: privyId,
              isRegistered: false,
              isGuest: false,
              previousGuestData: previousGuestData?.data || null
            });
            setNeedsRegistration(true);
            setGuestData(null);
          }
        } catch (error) {
          console.error('Error checking user in database:', error);
          setUser({
            role: 'client',
            name: privyUser.email?.address || walletAddress?.slice(0, 10) || 'User',
            wallet: walletAddress,
            privyId: privyId,
            isRegistered: false,
            isGuest: false
          });
          setNeedsRegistration(true);
        }
      } else if (!user?.isGuest) {
        // Not authenticated and not a guest
        setUser(null);
        setNeedsRegistration(false);
      }
    };
    
    checkUserInDatabase();
  }, [ready, authenticated, privyUser]);

  const connectWallet = async () => {
    privyLogin();
  };

  const enterAsGuest = (guestType) => {
    const guestId = generateGuestId();
    const guestSession = {
      guestId,
      role: guestType === 'admin' ? 'admin' : 'client',
      createdAt: Date.now(),
      data: {}
    };
    
    localStorage.setItem('guestSession', JSON.stringify(guestSession));
    setGuestData(guestSession);
    setUser({
      role: guestSession.role,
      name: 'Guest',
      isGuest: true,
      guestId: guestId,
      guestData: {}
    });
  };

  const updateGuestData = (newData) => {
    if (!user?.isGuest) return;
    
    const storedGuest = localStorage.getItem('guestSession');
    if (storedGuest) {
      try {
        const parsed = JSON.parse(storedGuest);
        parsed.data = { ...parsed.data, ...newData };
        localStorage.setItem('guestSession', JSON.stringify(parsed));
        setGuestData(parsed);
        setUser(prev => ({ ...prev, guestData: parsed.data }));
      } catch (e) {
        console.error('Error updating guest data:', e);
      }
    }
  };

  const completeRegistration = async (userType, profileData) => {
    const privyId = user?.privyId;
    const walletAddress = user?.wallet;
    
    if (!privyId) return false;
    
    console.log('Completing registration:', { 
      userType, 
      willSetRole: userType === 'vendor' ? 'admin' : 'client',
      profileData 
    });
    
    try {
      const response = await fetch(`${API_URL}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          privyId,
          walletAddress,
          userType,
          profile: profileData
        })
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
    if (!privyId) {
      console.error('Cannot update profile: No privyId');
      return false;
    }
    
    console.log('Updating user profile:', privyId, profileData);
    
    try {
      const response = await fetch(`${API_URL}/api/users/${privyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: profileData })
      });
      
      const data = await response.json();
      console.log('Update profile response:', data);
      
      if (data.success) {
        console.log('Profile updated successfully');
        setUser(prev => ({
          ...prev,
          profile: { ...prev?.profile, ...profileData },
          name: profileData.fullName || prev?.name,
          profileComplete: profileData.fullName ? true : prev?.profileComplete
        }));
        return true;
      } else {
        console.error('Profile update failed:', data);
        return false;
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      return false;
    }
  };

  const fixUserType = async () => {
    const privyId = user?.privyId;
    if (!privyId) return false;
    
    try {
      console.log('Fixing user type to vendor...');
      const response = await fetch(`${API_URL}/api/users/${privyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userType: 'vendor' })
      });
      
      const data = await response.json();
      if (data.success) {
        console.log('User type fixed successfully! Reload the page to fetch updated user data');
        window.location.reload();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error fixing user type:', error);
      return false;
    }
  };

  const logout = async () => {
    if (authenticated) {
      await privyLogout();
    }
    localStorage.removeItem('guestSession');
    setUser(null);
    setGuestData(null);
    setNeedsRegistration(false);
  };

  const exitGuestMode = () => {
    localStorage.removeItem('guestSession');
    setUser(null);
    setGuestData(null);
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
      updateUserProfile,
      fixUserType,
      enterAsGuest,
      updateGuestData,
      exitGuestMode,
      isGuest: user?.isGuest || false
    }}>
      {children}
    </AuthContext.Provider>
  );
};
