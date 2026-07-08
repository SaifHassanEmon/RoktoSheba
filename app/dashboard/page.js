'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { doc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
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
  const [requests, setRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(true);

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

  useEffect(() => {
    const fetchMyRequests = async () => {
      if (!user) return;
      try {
        const q = query(
          collection(db, 'blood_requests'),
          where('requestedBy', '==', user.uid)
        );
        const querySnapshot = await getDocs(q);
        const reqList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        reqList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setRequests(reqList);
      } catch (error) {
        console.error('Error fetching requests:', error);
      } finally {
        setRequestsLoading(false);
      }
    };
    fetchMyRequests();
  }, [user]);

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

  const handleSaveRecipient = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveMessage({ type: '', text: '' });

    try {
      const docRef = doc(db, 'donors', user.uid);
      await updateDoc(docRef, {
        gender: localGender,
        university: localUniversity,
      });
      setSaveMessage({ type: 'success', text: 'Account settings updated successfully!' });
      setTimeout(() => setSaveMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Error updating recipient profile:', error);
      setSaveMessage({ type: 'error', text: 'Failed to update settings. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const isRecipient = donorProfile?.role === 'recipient';
  const eligible = isDonorEligible(localLastDonation);
  const daysLeft = daysUntilEligible(localLastDonation);

  return (
    <>
      <Navbar />
      <main className={styles.dashboardContainer}>
        <div className="container">
          <header className={styles.header}>
            <h1 className={styles.greeting}>
              Hello, <span>{donorProfile?.name || user.displayName || 'User'}</span>
            </h1>
            <p className={styles.subtitle}>
              {isRecipient 
                ? "Manage your blood request profile and track submissions."
                : "Manage your blood donation profile and availability."}
            </p>
          </header>

          {isRecipient ? (
            /* Recipient Stats */
            <div className={styles.statsRow}>
              <div className={`card-glass ${styles.statCard}`}>
                <div className={styles.statIcon}>👤</div>
                <div className={styles.statInfo}>
                  <span className={styles.statLabel}>Account Role</span>
                  <span className={styles.statValue}>
                    <span className="badge badge-accent">Recipient</span>
                  </span>
                </div>
              </div>

              <div className={`card-glass ${styles.statCard}`}>
                <div className={styles.statIcon}>🩸</div>
                <div className={styles.statInfo}>
                  <span className={styles.statLabel}>Total Requests</span>
                  <span className={styles.statValue}>{requests.length}</span>
                </div>
              </div>

              <div className={`card-glass ${styles.statCard}`}>
                <div className={styles.statIcon}>⏳</div>
                <div className={styles.statInfo}>
                  <span className={styles.statLabel}>Pending Verification</span>
                  <span className={styles.statValue}>
                    {requests.filter(r => r.status === 'pending').length}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* Donor Stats */
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
          )}

          <div className={styles.dashboardGrid}>
            {isRecipient ? (
              /* Recipient Settings Card */
              <div className={`card-glass ${styles.settingsCard}`}>
                <h2>Account Settings</h2>
                
                <form onSubmit={handleSaveRecipient} className={styles.form}>
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
            ) : (
              /* Donation Settings Card */
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
            )}

            {/* My Blood Requests panel */}
            <div className={`card-glass ${styles.requestsCard}`}>
              <h2>My Blood Requests</h2>
              
              {requestsLoading ? (
                <div className={styles.requestsLoader}>
                  <div className={styles.miniSpinner}></div>
                  <p>Loading requests...</p>
                </div>
              ) : requests.length === 0 ? (
                <div className={styles.noRequests}>
                  <p>You haven't submitted any blood requests yet.</p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                    Find donors on the <a href="/search" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>Search page</a> to request blood.
                  </p>
                </div>
              ) : (
                <div className={styles.requestsList}>
                  {requests.map(req => {
                    const reqDateFormatted = req.requiredDate ? new Date(req.requiredDate).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric'
                    }) : 'N/A';
                    
                    return (
                      <div key={req.id} className={styles.requestItem}>
                        <div className={styles.reqHeader}>
                          <span className={`badge badge-accent`}>{req.bloodGroup}</span>
                          <span className={`${styles.statusBadge} ${
                            req.status === 'approved' ? styles.statusApproved :
                            req.status === 'rejected' ? styles.statusRejected : styles.statusPending
                          }`}>
                            {req.status === 'approved' ? 'Approved' : req.status === 'rejected' ? 'Rejected' : 'Pending'}
                          </span>
                        </div>
                        
                        <div className={styles.reqBody}>
                          <p>Patient: <strong>{req.patientName}</strong></p>
                          <p>Hospital: <strong>{req.hospital}</strong></p>
                          <p>Needed On: <strong>{reqDateFormatted}</strong> ({req.unitsRequired} unit{req.unitsRequired > 1 ? 's' : ''})</p>
                          <p className={styles.targetDonorText}>Target Donor: <strong>{req.donorName}</strong></p>
                          
                          {req.status === 'approved' && req.donorPhone && (
                            <div className={styles.revealedContact}>
                              <p className={styles.contactLabel}>✅ Donor Contact Shared:</p>
                              <p className={styles.phoneDisplay}>📞 {req.donorPhone}</p>
                              <div className={styles.revealedActions}>
                                <a href={`tel:${req.donorPhone}`} className={`btn btn-primary ${styles.revealedBtn}`}>
                                  Call Donor
                                </a>
                                <a 
                                  href={`https://wa.me/${req.donorPhone.replace(/[^0-9]/g, '')}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className={`btn btn-secondary ${styles.revealedBtn}`}
                                >
                                  WhatsApp
                                </a>
                              </div>
                            </div>
                          )}

                          {req.status === 'pending' && (
                            <p className={styles.statusNotice}>⌛ Pending moderator verification. Contact details will appear here once verified.</p>
                          )}
                          
                          {req.status === 'rejected' && (
                            <p className={styles.statusNoticeRejected}>❌ This request was rejected by our moderators.</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
