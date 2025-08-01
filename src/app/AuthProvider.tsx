'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { UserData } from '@/lib/firebase/auth';

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  const signOut = async () => {
    try {
      // Sign out from Firebase
      await auth.signOut();

      // Clear session cookie
      await fetch('/api/auth/signout', {
        method: 'POST',
      });

      // Clear local state
      setUser(null);
      setUserData(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('🔍 Auth state changed:', user ? `User ${user.uid}` : 'No user');

      if (user) {
        setUser(user);

        // Fetch user data from session with retry logic
        try {
          console.log('📡 Fetching user data from session...');

          // Retry logic to handle race condition with session creation
          let response;
          let retryCount = 0;
          const maxRetries = 5;

          do {
            if (retryCount > 0) {
              console.log(`🔄 Retrying session fetch (attempt ${retryCount + 1}/${maxRetries})...`);
              await new Promise(resolve => setTimeout(resolve, 500 * retryCount)); // Exponential backoff
            }

            response = await fetch('/api/auth/session', {
              credentials: 'include',
              cache: 'no-store'
            });

            retryCount++;
          } while (!response.ok && response.status === 401 && retryCount < maxRetries);

          if (response.ok) {
            const data = await response.json();
            console.log('✅ User data fetched:', data.user?.email);
            setUserData(data.user);
          } else {
            console.log('❌ Session fetch failed after retries:', response.status);
            if (response.status === 401 || response.status === 404) {
              console.log('🔄 Session invalid, clearing user data');
              setUserData(null);
              // Only force sign out if this isn't a temporary race condition
              if (retryCount >= maxRetries) {
                await auth.signOut();
              }
            }
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setUserData(null);
        }
      } else {
        console.log('🚪 No user, clearing state');
        setUser(null);
        setUserData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, userData, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};