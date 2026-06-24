'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

const AuthContext = createContext({
  user: null,
  donorProfile: null,
  isAdmin: false,
  loading: true,
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [donorProfile, setDonorProfile] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        // Fetch the donor profile from Firestore if it exists
        try {
          const docRef = doc(db, 'donors', firebaseUser.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const profileData = docSnap.data();
            setDonorProfile({ id: docSnap.id, ...profileData });
            setIsAdmin(profileData.role === 'admin' || firebaseUser.email === 'admin@redpulsebd.org');
          } else {
            setDonorProfile(null);
            setIsAdmin(firebaseUser.email === 'admin@redpulsebd.org');
          }
        } catch (error) {
          console.error("Error fetching donor profile:", error);
          setDonorProfile(null);
          setIsAdmin(firebaseUser.email === 'admin@redpulsebd.org');
        }
      } else {
        setDonorProfile(null);
        setIsAdmin(false);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, donorProfile, isAdmin, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
