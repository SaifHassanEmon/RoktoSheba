'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { isDonorEligible, daysUntilEligible } from '@/lib/donors';
import Navbar from '@/components/Navbar/Navbar';
import Footer from '@/components/Footer/Footer';
import styles from './page.module.css';

export default function DashboardPage() {
  const { user, donorProfile, loading } = useAuth();
  const router = useRouter();

  const [saving, setSaving] = useState(false);
  const [localAvailability, setLocalAvailability] = useState(false);
  const [localLastDonation, setLocalLastDonation] = useState('');
  const [localGender, setLocalGender] = useState('');
  const [localUniversity, setLocalUniversity] = useState('');
  const [saveMessage, setSaveMessage] = useState({ type: '', text: '' });

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Initialize state from profile
  useEffect(() => {
    if (donorProfile) {
      setLocalAvailability(donorProfile.available || false);
      setLocalLastDonation(donorProfile.lastDonation || '');
      setLocalGender(donorProfile.gender || '');
      setLocalUniversity(donorProfile.university || '');
    }
  }, [donorProfile]);

  if (loading || !user) {
    return (
      <>
        <Navbar />
        <main className={styles.dashboardContainer}>
          <div className={styles.loadingWrapper}>
            <div className={styles.spinner}></div>
            <p>Loading your dashboard...</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveMessage({ type: '', text: '' });

    try {
      const eligible = isDonorEligible(localLastDonation);
      const finalAvailability = eligible ? localAvailability : false;
      const docRef = doc(db, 'donors', user.uid);
      await updateDoc(docRef, {
        available: finalAvailability,
        lastDonation: localLastDonation,
        gender: localGender,
        university: localUniversity,
      });
      setSaveMessage({ type: 'success', text: 'Profile updated successfully!' });
      setTimeout(() => setSaveMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setSaveMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const eligible = isDonorEligible(localLastDonation);
  const daysLeft = daysUntilEligible(localLastDonation);

  return (
    <>
      <Navbar />
      <main className={styles.dashboardContainer}>
        <div className="container">
          <header className={styles.header}>
            <h1 className={styles.greeting}>
              Hello, <span>{donorProfile?.name || user.displayName || 'Donor'}</span>
            </h1>
            <p className={styles.subtitle}>Manage your blood donation profile and availability.</p>
          </header>

          <div className={styles.statsRow}>
            <div className={`card-glass ${styles.statCard}`}>
              <div className={styles.statIcon}>🩸</div>
              <div className={styles.statInfo}>
                <span className={styles.statLabel}>Blood Group</span>
                <span className={styles.statValue}>
                  {donorProfile?.bloodGroup ? (
                    <span className="badge badge-accent">{donorProfile.bloodGroup}</span>
                  ) : (
                    'Not Set'
                  )}
                </span>
              </div>
            </div>

            <div className={`card-glass ${styles.statCard}`}>
              <div className={styles.statIcon}>❤️</div>
              <div className={styles.statInfo}>
                <span className={styles.statLabel}>Total Donations</span>
                <span className={styles.statValue}>{donorProfile?.totalDonations || 0}</span>
              </div>
            </div>

            <div className={`card-glass ${styles.statCard}`}>
              <div className={styles.statIcon}>📅</div>
              <div className={styles.statInfo}>
                <span className={styles.statLabel}>Eligibility Status</span>
                <span className={styles.statValue}>
                  {eligible ? (
                    <span className="badge badge-success">Eligible to Donate</span>
                  ) : (
                    <span className="badge badge-warning">Eligible in {daysLeft} days</span>
                  )}
                </span>
              </div>
            </div>
          </div>

          <div className={styles.settingsWrapper}>
            <div className={`card-glass ${styles.settingsCard}`}>
              <h2>Donation Settings</h2>
              
              <form onSubmit={handleSave} className={styles.form}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    <div className={styles.toggleWrapper}>
                      <span>Currently Available to Donate</span>
                      <label className={styles.switch}>
                        <input
                          type="checkbox"
                          checked={eligible ? localAvailability : false}
                          disabled={!eligible}
                          onChange={(e) => setLocalAvailability(e.target.checked)}
                        />
                        <span className={styles.slider}></span>
                      </label>
                    </div>
                  </label>
                  <p className={styles.helpText}>
                    {eligible 
                      ? "Turn this off if you are temporarily unavailable (e.g., traveling, sick)." 
                      : "Unavailable because you are not eligible to donate yet (must wait 90 days between donations)."}
                  </p>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="gender" className={styles.label}>Gender</label>
                  <select
                    id="gender"
                    className={styles.input}
                    value={localGender}
                    onChange={(e) => setLocalGender(e.target.value)}
                    required
                  >
                    <option value="" disabled>Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="university" className={styles.label}>University (Optional)</label>
                  <input
                    type="text"
                    id="university"
                    className={styles.input}
                    value={localUniversity}
                    placeholder="e.g. Dhaka University"
                    onChange={(e) => setLocalUniversity(e.target.value)}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="lastDonation" className={styles.label}>Last Donation Date</label>
                  <input
                    type="date"
                    id="lastDonation"
                    className={styles.input}
                    value={localLastDonation}
                    onChange={(e) => setLocalLastDonation(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                  />
                  <p className={styles.helpText}>
                    We use this to calculate when you'll be eligible to donate again (90 days).
                  </p>
                </div>

                {saveMessage.text && (
                  <div className={`${styles.message} ${styles[saveMessage.type]}`}>
                    {saveMessage.text}
                  </div>
                )}

                <button
                  type="submit"
                  className={`btn btn-primary ${styles.saveBtn}`}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
