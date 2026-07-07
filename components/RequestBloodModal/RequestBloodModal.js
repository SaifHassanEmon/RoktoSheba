'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import styles from './RequestBloodModal.module.css';

export default function RequestBloodModal({ donor, onClose }) {
  const { user, loading } = useAuth();
  
  const [urgency, setUrgency] = useState('Critical'); // 'Critical', 'Urgent', 'Routine'
  const [patientName, setPatientName] = useState('');
  const [attendantName, setAttendantName] = useState('');
  const [bloodGroup, setBloodGroup] = useState(donor?.bloodGroup || '');
  const [unitsRequired, setUnitsRequired] = useState('');
  const [requiredDate, setRequiredDate] = useState('');
  const [hospital, setHospital] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [wardRoom, setWardRoom] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

  useEffect(() => {
    if (donor) {
      setBloodGroup(donor.bloodGroup);
    }
  }, [donor]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!patientName || !attendantName || !bloodGroup || !unitsRequired || !requiredDate || !hospital || !contactPhone) {
      setError('Please fill in all required fields marked with *');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await addDoc(collection(db, 'blood_requests'), {
        patientName,
        attendantName,
        bloodGroup,
        unitsRequired: parseInt(unitsRequired) || 1,
        requiredDate,
        hospital,
        contactPhone,
        wardRoom,
        additionalNotes,
        urgency,
        donorId: donor?.id || 'general',
        donorName: donor?.name || 'Any Compatible Donor',
        status: 'pending',
        requestedBy: user ? user.uid : 'guest',
        requesterEmail: user ? user.email : 'guest',
        createdAt: new Date().toISOString()
      });

      setSuccess(true);
    } catch (err) {
      console.error('Error submitting blood request:', err);
      setError('Failed to submit request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={`card-glass ${styles.modal}`}>
        <button onClick={onClose} className={styles.closeBtn} aria-label="Close modal">✕</button>

        {success ? (
          <div className={styles.successWrapper}>
            <div className={styles.successIcon}>🩸</div>
            <h2 className={styles.successTitle}>Request Submitted!</h2>
            <p className={styles.successText}>
              Your request for blood has been successfully registered. A moderator will verify the details and share the donor's information shortly.
            </p>
            <p className={styles.successSubtext}>
              You can track the status of this request in your dashboard.
            </p>
            <div className={styles.successActions}>
              <Link href="/dashboard" className="btn btn-primary" onClick={onClose}>
                Go to Dashboard
              </Link>
              <button className="btn btn-secondary" onClick={onClose}>
                Close
              </button>
            </div>
          </div>
        ) : (
          <>
            <h2 className={styles.modalTitle}>
              {donor ? `Request Blood from ${donor.name}` : 'Request Blood'}
            </h2>
            <p className={styles.modalSubtitle}>
              Please provide the medical details. Your request will be reviewed by a moderator.
            </p>

            {error && <div className={styles.errorMsg}>{error}</div>}

              <form onSubmit={handleSubmit} className={styles.form}>
                {/* Urgency Toggle */}
                <div className={styles.urgencySection}>
                  <span className={styles.urgencyLabel}>URGENCY LEVEL *</span>
                  <div className={styles.urgencyToggles}>
                    <button
                      type="button"
                      className={`${styles.urgencyBtn} ${urgency === 'Critical' ? styles.criticalActive : ''}`}
                      onClick={() => setUrgency('Critical')}
                    >
                      <span className={`${styles.dot} ${styles.dotCritical}`}></span>
                      Critical
                    </button>
                    <button
                      type="button"
                      className={`${styles.urgencyBtn} ${urgency === 'Urgent' ? styles.urgentActive : ''}`}
                      onClick={() => setUrgency('Urgent')}
                    >
                      <span className={`${styles.dot} ${styles.dotUrgent}`}></span>
                      Urgent
                    </button>
                    <button
                      type="button"
                      className={`${styles.urgencyBtn} ${urgency === 'Routine' ? styles.routineActive : ''}`}
                      onClick={() => setUrgency('Routine')}
                    >
                      <span className={`${styles.dot} ${styles.dotRoutine}`}></span>
                      Routine
                    </button>
                  </div>
                </div>

                <div className={styles.grid}>
                  <div className={styles.inputGroup}>
                    <label htmlFor="patientName">PATIENT NAME *</label>
                    <input
                      type="text"
                      id="patientName"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      placeholder="Name of Patient"
                      required
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <label htmlFor="attendantName">ATTENDANT NAME *</label>
                    <input
                      type="text"
                      id="attendantName"
                      value={attendantName}
                      onChange={(e) => setAttendantName(e.target.value)}
                      placeholder="Your Name"
                      required
                    />
                  </div>
                </div>

                {/* Blood Group Required Selector */}
                <div className={styles.inputGroup}>
                  <label>BLOOD GROUP REQUIRED *</label>
                  <div className={styles.bloodGrid}>
                    {bloodGroups.map((group) => (
                      <button
                        key={group}
                        type="button"
                        className={`${styles.bloodBtn} ${bloodGroup === group ? styles.bloodBtnActive : ''}`}
                        onClick={() => setBloodGroup(group)}
                      >
                        {group}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={styles.grid}>
                  <div className={styles.inputGroup}>
                    <label htmlFor="unitsRequired">UNITS REQUIRED *</label>
                    <input
                      type="number"
                      id="unitsRequired"
                      value={unitsRequired}
                      onChange={(e) => setUnitsRequired(e.target.value)}
                      placeholder="e.g. 2"
                      min="1"
                      required
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <label htmlFor="requiredDate">REQUIRED DATE *</label>
                    <input
                      type="date"
                      id="requiredDate"
                      value={requiredDate}
                      onChange={(e) => setRequiredDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>
                </div>

                <div className={styles.inputGroup}>
                  <label htmlFor="hospital">HOSPITAL / CLINIC *</label>
                  <input
                    type="text"
                    id="hospital"
                    value={hospital}
                    onChange={(e) => setHospital(e.target.value)}
                    placeholder="Hospital name and address"
                    required
                  />
                </div>

                <div className={styles.grid}>
                  <div className={styles.inputGroup}>
                    <label htmlFor="contactPhone">CONTACT PHONE *</label>
                    <input
                      type="tel"
                      id="contactPhone"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="+880 1X-XXXXXXXX"
                      required
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <label htmlFor="wardRoom">WARD / ROOM NO.</label>
                    <input
                      type="text"
                      id="wardRoom"
                      value={wardRoom}
                      onChange={(e) => setWardRoom(e.target.value)}
                      placeholder="Ward 5, Bed 12"
                    />
                  </div>
                </div>

                <div className={styles.inputGroup}>
                  <label htmlFor="additionalNotes">ADDITIONAL NOTES</label>
                  <textarea
                    id="additionalNotes"
                    value={additionalNotes}
                    onChange={(e) => setAdditionalNotes(e.target.value)}
                    placeholder="Enter any other details (e.g., medical conditions, specific instructions)"
                    rows="3"
                  />
                </div>

                <div className={styles.actions}>
                  <button type="button" onClick={onClose} className="btn btn-secondary" disabled={submitting}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? 'Submitting...' : 'Submit Request'}
                  </button>
                </div>
              </form>
          </>
        )}
      </div>
    </div>
  );
}
