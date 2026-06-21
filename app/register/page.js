'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { BLOOD_GROUPS, DHAKA_AREAS } from '@/data/seedDonors';
import Navbar from '@/components/Navbar/Navbar';
import Footer from '@/components/Footer/Footer';
import Link from 'next/link';
import styles from './page.module.css';

export default function RegisterPage() {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    bloodGroup: '',
    area: ''
  });
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      // 2. Save donor profile in Firestore
      await setDoc(doc(db, 'donors', user.uid), {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        bloodGroup: formData.bloodGroup,
        area: formData.area,
        district: 'Dhaka',
        available: true,
        totalDonations: 0,
        lastDonation: null,
        createdAt: new Date()
      });

      // 3. Backup data to Google Sheets via our API route
      try {
        await fetch('/api/sheets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            bloodGroup: formData.bloodGroup,
            area: formData.area,
            lastDonation: 'N/A' // Initial registration has no last donation date
          }),
        });
      } catch (sheetErr) {
        console.error('Failed to sync to Google Sheets:', sheetErr);
        // We don't block the user if Sheets backup fails
      }

      // 4. Redirect to dashboard
      router.push('/dashboard');
    } catch (err) {
      console.error('Registration error:', err);
      if (err.code === 'auth/email-already-in-use') {
        setError('Email is already in use. Please login instead.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters.');
      } else {
        setError('Failed to register. Please try again.');
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
          <div className={styles.header}>
            <h1 className={styles.title}>Become a Donor</h1>
            <p className={styles.subtitle}>Join our community and save lives</p>
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputGroup}>
              <label htmlFor="name" className={styles.label}>Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                className={styles.input}
                placeholder="John Doe"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="email" className={styles.label}>Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                className={styles.input}
                placeholder="you@example.com"
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
                minLength={6}
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="phone" className={styles.label}>Phone Number</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                className={styles.input}
                placeholder="+880 1XXX XXXXXX"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>

            <div className={styles.row}>
              <div className={styles.inputGroup}>
                <label htmlFor="bloodGroup" className={styles.label}>Blood Group</label>
                <select
                  id="bloodGroup"
                  name="bloodGroup"
                  className={styles.select}
                  value={formData.bloodGroup}
                  onChange={handleChange}
                  required
                >
                  <option value="" disabled>Select</option>
                  {BLOOD_GROUPS.map((bg) => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="area" className={styles.label}>Area in Dhaka</label>
                <select
                  id="area"
                  name="area"
                  className={styles.select}
                  value={formData.area}
                  onChange={handleChange}
                  required
                >
                  <option value="" disabled>Select Area</option>
                  {DHAKA_AREAS.map((area) => (
                    <option key={area} value={area}>{area}</option>
                  ))}
                </select>
              </div>
            </div>

            <button 
              type="submit" 
              className={styles.submitBtn}
              disabled={loading}
            >
              {loading ? <div className={styles.spinner}></div> : 'Register as Donor'}
            </button>
          </form>

          <div className={styles.footer}>
            Already have an account?{' '}
            <Link href="/login" className={styles.link}>
              Sign In
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
