'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import Navbar from '@/components/Navbar/Navbar';
import Footer from '@/components/Footer/Footer';
import Link from 'next/link';
import styles from './page.module.css';

export default function LoginPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('donor'); // 'donor' or 'admin'
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab === 'admin') {
        setActiveTab('admin');
      }
    }
  }, []);

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleDemoAdminLogin = () => {
    setFormData({
      email: 'admin@redpulsebd.org',
      password: 'admin123'
    });
    setActiveTab('admin');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (activeTab === 'admin') {
        // Special logic for admin login
        // If email/password are admin credentials, verify or auto-create in Firebase Auth
        if (formData.email === 'admin@redpulsebd.org' && formData.password === 'admin123') {
          try {
            await signInWithEmailAndPassword(auth, formData.email, formData.password);
          } catch (signInErr) {
            // If user doesn't exist, auto-create
            if (signInErr.code === 'auth/user-not-found' || signInErr.code === 'auth/invalid-credential') {
              const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
              const user = userCredential.user;
              // Write admin profile to Firestore
              await setDoc(doc(db, 'donors', user.uid), {
                name: 'System Admin',
                email: formData.email,
                phone: '+8801700000000',
                bloodGroup: 'AB+',
                area: 'Tejgaon',
                district: 'Dhaka',
                available: false,
                totalDonations: 0,
                lastDonation: null,
                role: 'admin',
                createdAt: new Date()
              });
            } else {
              throw signInErr;
            }
          }
          
          router.push('/admin/dashboard');
          return;
        }
        
        // If it's a different admin login, try to sign in normally first, then check role in Firestore
        const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
        const user = userCredential.user;
        const docRef = doc(db, 'donors', user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists() && docSnap.data().role === 'admin') {
          router.push('/admin/dashboard');
        } else if (formData.email === 'admin@redpulsebd.org') {
          // Fallback if role is not set but email is admin
          router.push('/admin/dashboard');
        } else {
          setError('Access Denied: You do not have administrator privileges.');
        }
      } else {
        // Regular donor login
        await signInWithEmailAndPassword(auth, formData.email, formData.password);
        
        // Check if the user is actually an admin and redirect accordingly
        const user = auth.currentUser;
        if (user) {
          const docSnap = await getDoc(doc(db, 'donors', user.uid));
          if (docSnap.exists() && docSnap.data().role === 'admin') {
            router.push('/admin/dashboard');
          } else {
            router.push('/dashboard');
          }
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Invalid email or password. Please try again.');
      } else {
        setError('Failed to login. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <Navbar />
      
      <main className={styles.main}>
        <div className={styles.card}>
          {/* Tab navigation */}
          <div className={styles.tabs}>
            <button
              type="button"
              className={`${styles.tab} ${activeTab === 'donor' ? styles.activeTab : ''}`}
              onClick={() => { setActiveTab('donor'); setError(''); }}
            >
              Donor Sign In
            </button>
            <button
              type="button"
              className={`${styles.tab} ${activeTab === 'admin' ? styles.activeTab : ''}`}
              onClick={() => { setActiveTab('admin'); setError(''); }}
            >
              Admin Portal
            </button>
          </div>

          <div className={styles.header}>
            <h1 className={styles.title}>
              {activeTab === 'admin' ? 'Admin Portal' : 'Welcome Back'}
            </h1>
            <p className={styles.subtitle}>
              {activeTab === 'admin' ? 'Sign in as system administrator' : 'Sign in to your donor account'}
            </p>
          </div>

          {error && <div className={styles.error}>{error}</div>}

          {activeTab === 'admin' && (
            <div className={styles.demoBox}>
              <p className={styles.demoText}>Testing the Admin features?</p>
              <button
                type="button"
                onClick={handleDemoAdminLogin}
                className={`btn btn-secondary ${styles.demoBtn}`}
              >
                ⚡ Use Demo Admin Account
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputGroup}>
              <label htmlFor="email" className={styles.label}>Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                className={styles.input}
                placeholder={activeTab === 'admin' ? 'admin@redpulsebd.org' : 'you@example.com'}
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="password" className={styles.label}>Password</label>
              <input
                type="password"
                id="password"
                name="password"
                className={styles.input}
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <button 
              type="submit" 
              className={styles.submitBtn}
              disabled={loading}
            >
              {loading ? <div className={styles.spinner}></div> : 'Sign In'}
            </button>
          </form>

          <div className={styles.footer}>
            {activeTab === 'admin' ? (
              <span>Looking for donor dashboard? <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('donor'); }} className={styles.link}>Donor Sign In</a></span>
            ) : (
              <>
                Don't have an account?{' '}
                <Link href="/register" className={styles.link}>
                  Become a Donor
                </Link>
              </>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
