import { createContext, useContext, useState, useEffect } from 'react';

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isGuest, setIsGuest] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [conversationCount, setConversationCount] = useState(0);

  // Initialize user on mount
  useEffect(() => {
    async function initUser() {
      try {
        // Check if we're in WordPress mode
        const isWordPressMode = window.bewerbungstrainerData !== undefined;

        if (isWordPressMode) {
          // WordPress mode - fetch user info
          try {
            const response = await fetch('/wp-json/bewerbungstrainer/v1/user/info');
            const data = await response.json();

            if (data.is_logged_in) {
              setUser({
                id: data.user_id,
                name: data.display_name,
                email: data.email,
                ...data
              });
              setIsGuest(false);
            } else {
              // WordPress but not logged in - use guest mode
              const storedData = localStorage.getItem('bewerbungstrainer_user_data');
              if (storedData) {
                setUser(JSON.parse(storedData));
              }
              setIsGuest(true);
            }
          } catch (error) {
            console.error('Failed to fetch WordPress user:', error);
            // Fallback to localStorage
            const storedData = localStorage.getItem('bewerbungstrainer_user_data');
            if (storedData) {
              setUser(JSON.parse(storedData));
            }
            setIsGuest(true);
          }
        } else {
          // Standalone mode - use localStorage
          const storedData = localStorage.getItem('bewerbungstrainer_user_data');
          if (storedData) {
            setUser(JSON.parse(storedData));
          }
          setIsGuest(true);
        }

        // Load conversation count
        const storedCount = localStorage.getItem('bewerbungstrainer_conversation_count');
        if (storedCount) {
          setConversationCount(parseInt(storedCount, 10));
        }
      } catch (error) {
        console.error('User initialization failed:', error);
      } finally {
        setIsLoading(false);
      }
    }

    initUser();
  }, []);

  const updateUser = (updates) => {
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);

    // Persist to localStorage if in guest mode
    if (isGuest) {
      localStorage.setItem('bewerbungstrainer_user_data', JSON.stringify(updatedUser));
    }
  };

  const clearUser = () => {
    setUser(null);
    localStorage.removeItem('bewerbungstrainer_user_data');
    localStorage.removeItem('bewerbungstrainer_conversation_count');
    setConversationCount(0);
  };

  const incrementConversationCount = () => {
    const newCount = conversationCount + 1;
    setConversationCount(newCount);
    localStorage.setItem('bewerbungstrainer_conversation_count', String(newCount));
  };

  const value = {
    user,
    isGuest,
    isLoading,
    conversationCount,
    updateUser,
    clearUser,
    incrementConversationCount,
    // Computed values
    hasCompletedWizard: !!user?.name && !!user?.position && !!user?.company,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
}
