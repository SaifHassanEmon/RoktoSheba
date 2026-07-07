'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { collection, getDocs, doc, getDoc, updateDoc, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Navbar from '@/components/Navbar/Navbar';
import Footer from '@/components/Footer/Footer';
import styles from './page.module.css';

export default function ModeratorPage() {
  const { user, isModerator, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();

  const [requests, setRequests] = useState([]);
  const [availableDonors, setAvailableDonors] = useState({}); // mapped by bloodGroup -> array of donors
  const [selectedDonors, setSelectedDonors] = useState({}); // request.id -> donorId (for general requests)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'pending', 'approved', 'rejected'
  const [actionInProgress, setActionInProgress] = useState({}); // request.id -> boolean
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Security Check: Redirect if not moderator/admin
  useEffect(() => {
    if (!authLoading && (!user || (!isModerator && !isAdmin))) {
      router.push('/login?redirect=/moderator');
    }
  }, [user, isModerator, isAdmin, authLoading, router]);

  // Fetch Requests & Donors
  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch blood requests
      const reqQuery = query(collection(db, 'blood_requests'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(reqQuery);
      const reqList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRequests(reqList);

      // 2. Fetch all donors to support matching general requests
      const donorSnapshot = await getDocs(collection(db, 'donors'));
      const donorList = donorSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Group donors by blood group for easy dropdown matching
      const grouped = {};
      donorList.forEach(d => {
        if (d.available) {
          if (!grouped[d.bloodGroup]) {
            grouped[d.bloodGroup] = [];
          }
          grouped[d.bloodGroup].push(d);
        }
      });
      setAvailableDonors(grouped);

    } catch (err) {
      console.error('Error fetching moderator data:', err);
      setError('Failed to fetch requests. Please reload.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && (isModerator || isAdmin)) {
      fetchData();
    }
  }, [user, isModerator, isAdmin]);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 4000);
  };

  const handleVerify = async (requestId, donorId, targetDonorId) => {
    setActionInProgress(prev => ({ ...prev, [requestId]: true }));
    try {
      let finalDonorId = targetDonorId;
      
      // If it is a general request and a specific donor was chosen in the dropdown
      if (targetDonorId === 'general') {
        const selectedId = selectedDonors[requestId];
        if (!selectedId) {
          showToast('Please select a donor to assign for this general request.', 'error');
          setActionInProgress(prev => ({ ...prev, [requestId]: false }));
          return;
        }
        finalDonorId = selectedId;
      }

      // Fetch donor phone info
      let phoneInfo = 'N/A';
      let donorName = 'Assigned Donor';
      
      const donorRef = doc(db, 'donors', finalDonorId);
      const donorSnap = await getDoc(donorRef);
      if (donorSnap.exists()) {
        const donorData = donorSnap.data();
        phoneInfo = donorData.phone || 'N/A';
        donorName = donorData.name || 'Assigned Donor';
      } else {
        throw new Error('Donor profile not found in database.');
      }

      // Update request in Firestore
      const reqRef = doc(db, 'blood_requests', requestId);
      await updateDoc(reqRef, {
        status: 'approved',
        donorPhone: phoneInfo,
        donorName: donorName,
        donorId: finalDonorId,
        verifiedBy: user.uid,
        verifiedAt: new Date().toISOString()
      });

      // Update state
      setRequests(prev => prev.map(r => 
        r.id === requestId 
          ? { 
              ...r, 
              status: 'approved', 
              donorPhone: phoneInfo, 
              donorName: donorName, 
              donorId: finalDonorId, 
              verifiedBy: user.uid 
            } 
          : r
      ));
      
      showToast('Request verified. Donor information shared successfully!');
    } catch (err) {
      console.error('Error verifying request:', err);
      showToast('Verification failed. ' + err.message, 'error');
    } finally {
      setActionInProgress(prev => ({ ...prev, [requestId]: false }));
    }
  };

  const handleReject = async (requestId) => {
    if (!window.confirm('Are you sure you want to reject this request?')) return;
    
    setActionInProgress(prev => ({ ...prev, [requestId]: true }));
    try {
      const reqRef = doc(db, 'blood_requests', requestId);
      await updateDoc(reqRef, {
        status: 'rejected',
        verifiedBy: user.uid,
        verifiedAt: new Date().toISOString()
      });

      // Update state
      setRequests(prev => prev.map(r => 
        r.id === requestId ? { ...r, status: 'rejected', verifiedBy: user.uid } : r
      ));
      
      showToast('Request rejected successfully.', 'warning');
    } catch (err) {
      console.error('Error rejecting request:', err);
      showToast('Operation failed.', 'error');
    } finally {
      setActionInProgress(prev => ({ ...prev, [requestId]: false }));
    }
  };

  const handleDonorSelect = (requestId, donorId) => {
    setSelectedDonors(prev => ({ ...prev, [requestId]: donorId }));
  };

  // Filter requests
  const filteredRequests = requests.filter(r => {
    if (filterStatus === 'all') return true;
    return r.status === filterStatus;
  });

  if (authLoading || !user || (!isModerator && !isAdmin)) {
    return (
      <>
        <Navbar />
        <main className={styles.moderatorMain}>
          <div className={styles.loaderWrapper}>
            <div className={styles.spinner}></div>
            <p>Verifying Moderator Credentials...</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />

      {toast.show && (
        <div className={`${styles.toast} ${styles[toast.type]}`}>
          {toast.type === 'success' ? '✅' : toast.type === 'warning' ? '⚠️' : '❌'} {toast.message}
        </div>
      )}

      <main className={styles.moderatorMain}>
        <div className="container">
          <header className={styles.header}>
            <div className={styles.headerTitleBox}>
              <span className="badge badge-accent">Moderator Desk</span>
              <h1 className={styles.title}>Blood Request Verification</h1>
              <p className={styles.subtitle}>Review requests and approve sharing of donor contact numbers.</p>
            </div>
            <div className={styles.headerActions}>
              <button onClick={fetchData} className="btn btn-secondary">
                🔄 Refresh List
              </button>
            </div>
          </header>

          {/* Filters Bar */}
          <div className={`card-glass ${styles.filtersBar}`}>
            <button 
              className={`${styles.filterTab} ${filterStatus === 'all' ? styles.activeTab : ''}`}
              onClick={() => setFilterStatus('all')}
            >
              All Requests ({requests.length})
            </button>
            <button 
              className={`${styles.filterTab} ${filterStatus === 'pending' ? styles.activeTab : ''}`}
              onClick={() => setFilterStatus('pending')}
            >
              Pending ({requests.filter(r => r.status === 'pending').length})
            </button>
            <button 
              className={`${styles.filterTab} ${filterStatus === 'approved' ? styles.activeTab : ''}`}
              onClick={() => setFilterStatus('approved')}
            >
              Approved ({requests.filter(r => r.status === 'approved').length})
            </button>
            <button 
              className={`${styles.filterTab} ${filterStatus === 'rejected' ? styles.activeTab : ''}`}
              onClick={() => setFilterStatus('rejected')}
            >
              Rejected ({requests.filter(r => r.status === 'rejected').length})
            </button>
          </div>

          {/* Main List */}
          {loading ? (
            <div className={styles.loaderWrapper}>
              <div className={styles.spinner}></div>
              <p>Loading requests database...</p>
            </div>
          ) : error ? (
            <div className={styles.errorBox}>{error}</div>
          ) : filteredRequests.length === 0 ? (
            <div className={`card-glass ${styles.emptyBox}`}>
              <h3>No requests found</h3>
              <p>There are no blood requests matching this status filter.</p>
            </div>
          ) : (
            <div className={styles.requestsList}>
              {filteredRequests.map((req) => {
                const isGeneral = req.donorId === 'general';
                const compDonors = availableDonors[req.bloodGroup] || [];
                const reqDateFormatted = req.requiredDate ? new Date(req.requiredDate).toLocaleDateString('en-US', {
                  month: 'short', day: 'numeric', year: 'numeric'
                }) : 'N/A';
                const createdDate = req.createdAt ? new Date(req.createdAt).toLocaleString('en-US', {
                  month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                }) : 'N/A';

                return (
                  <div key={req.id} className={`card-glass ${styles.requestCard}`}>
                    {/* Top Row: Urgency & Status */}
                    <div className={styles.cardHeader}>
                      <span className={`${styles.urgencyTag} ${
                        req.urgency === 'Critical' ? styles.tagCritical : 
                        req.urgency === 'Urgent' ? styles.tagUrgent : styles.tagRoutine
                      }`}>
                        {req.urgency}
                      </span>
                      <span className={`${styles.statusTag} ${
                        req.status === 'approved' ? styles.statusApproved :
                        req.status === 'rejected' ? styles.statusRejected : styles.statusPending
                      }`}>
                        {req.status}
                      </span>
                    </div>

                    {/* Content Columns */}
                    <div className={styles.cardBody}>
                      <div className={styles.infoCol}>
                        <div className={styles.bloodCircle}>{req.bloodGroup}</div>
                        <div>
                          <h3 className={styles.patientName}>Patient: {req.patientName}</h3>
                          <p className={styles.attendantInfo}>
                            Attendant: <strong>{req.attendantName}</strong> | Requester Email: {req.requesterEmail || 'N/A'}
                          </p>
                          <p className={styles.dateHospital}>
                            📅 Need Date: <strong>{reqDateFormatted}</strong> | 🏥 Hospital: <strong>{req.hospital}</strong>
                          </p>
                          {req.wardRoom && <p className={styles.wardRoom}>Room/Ward: {req.wardRoom}</p>}
                          {req.additionalNotes && (
                            <p className={styles.notes}>
                              <strong>Notes:</strong> "{req.additionalNotes}"
                            </p>
                          )}
                          <p className={styles.timestamp}>Submitted: {createdDate}</p>
                        </div>
                      </div>

                      <div className={styles.matchCol}>
                        <h4>Donor Assignment</h4>
                        
                        {req.status === 'pending' ? (
                          <>
                            {isGeneral ? (
                              <div className={styles.donorSelectBox}>
                                <p className={styles.selectLabel}>General Request. Match compatible available donor:</p>
                                <select
                                  value={selectedDonors[req.id] || ''}
                                  onChange={(e) => handleDonorSelect(req.id, e.target.value)}
                                  className={styles.donorSelect}
                                >
                                  <option value="">-- Choose Donor ({compDonors.length} available) --</option>
                                  {compDonors.map(d => (
                                    <option key={d.id} value={d.id}>
                                      {d.name} ({d.area}) - {d.phone}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            ) : (
                              <div className={styles.requestedDonorBox}>
                                Requested Donor: <strong>{req.donorName}</strong>
                                <span className={styles.subText}>Donor ID: {req.donorId}</span>
                              </div>
                            )}

                            <div className={styles.actions}>
                              <button
                                onClick={() => handleVerify(req.id, req.donorId, req.donorId)}
                                className={`btn btn-primary ${styles.verifyBtn}`}
                                disabled={actionInProgress[req.id]}
                              >
                                {actionInProgress[req.id] ? 'Processing...' : 'Verify & Share Info'}
                              </button>
                              <button
                                onClick={() => handleReject(req.id)}
                                className={`btn btn-secondary ${styles.rejectBtn}`}
                                disabled={actionInProgress[req.id]}
                              >
                                Reject
                              </button>
                            </div>
                          </>
                        ) : req.status === 'approved' ? (
                          <div className={styles.assignedBox}>
                            <p className={styles.assignedTitle}>✅ Contact Shared</p>
                            <p>Donor: <strong>{req.donorName}</strong></p>
                            <p>Contact Phone: <code>{req.donorPhone}</code></p>
                            {req.verifiedBy && <span className={styles.subText}>Approved by Admin/Mod</span>}
                          </div>
                        ) : (
                          <div className={styles.rejectedBox}>
                            <p>❌ Request Rejected</p>
                            <span className={styles.subText}>This request was rejected by moderator</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
