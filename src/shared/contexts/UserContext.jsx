import { createContext, useContext, useState, useEffect } from 'react';

const UserContext = createContext(null);

/**
 * UserProvider - Manages user state for both logged-in WordPress users and guest users
 *
 * Features:
 * - WordPress user detection
 * - Guest mode support with localStorage persistence
 * - User data updates
 * - User session management
 */
export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isGuest, setIsGuest] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initUser();
  }, []);

  /**
   * Initialize user from WordPress or localStorage
   */
  async function initUser() {
    try {
      // Check if WordPress user data is available
      const wpConfig = window.bewerbungstrainerConfig;

      if (wpConfig && wpConfig.currentUser && wpConfig.currentUser.id > 0) {
        // WordPress user is logged in
        console.log('👤 [USER] WordPress user detected:', wpConfig.currentUser);
        setUser({
          id: wpConfig.currentUser.id,
          name: wpConfig.currentUser.name || wpConfig.currentUser.firstName || 'User',
          firstName: wpConfig.currentUser.firstName || '',
          email: wpConfig.currentUser.email || '',
          isWordPress: true
        });
        setIsGuest(false);
      } else {
        // Guest mode - check localStorage
        console.log('👤 [USER] No WordPress user, checking localStorage...');
        const storedUser = localStorage.getItem('bewerbungstrainer_user_data');

        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          console.log('👤 [USER] Guest user loaded from localStorage:', parsedUser);
          setUser(parsedUser);
          setIsGuest(true);
        } else {
          console.log('👤 [USER] No user data found, waiting for wizard...');
          setIsGuest(true);
        }
      }
    } catch (error) {
      console.error('❌ [USER] Error initializing user:', error);
      setIsGuest(true);
    } finally {
      setIsLoading(false);
    }
  }

  /**
   * Update user data
   * @param {Object} updates - User data to update
   */
  const updateUser = (updates) => {
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);

    // Persist to localStorage if guest
    if (isGuest) {
      localStorage.setItem('bewerbungstrainer_user_data', JSON.stringify(updatedUser));
      console.log('💾 [USER] Guest user data saved to localStorage');
    }
  };

  /**
   * Clear user data (logout)
   */
  const clearUser = () => {
    setUser(null);
    if (isGuest) {
      localStorage.removeItem('bewerbungstrainer_user_data');
      console.log('🗑️ [USER] Guest user data cleared');
    }
  };

  /**
   * Set user data (typically after wizard completion)
   * @param {Object} userData - Complete user data object
   */
  const setUserData = (userData) => {
    const userWithMeta = {
      ...userData,
      isWordPress: false,
      isGuest: true
    };
    setUser(userWithMeta);
    setIsGuest(true);

    // Persist to localStorage
    localStorage.setItem('bewerbungstrainer_user_data', JSON.stringify(userWithMeta));
    console.log('👤 [USER] User data set:', userWithMeta);
  };

  const value = {
    user,
    isGuest,
    isLoading,
    updateUser,
    clearUser,
    setUserData
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

/**
 * Hook to access user context
 * @returns {Object} User context value
 */
export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
}
