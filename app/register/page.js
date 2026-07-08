'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { BLOOD_GROUPS } from '@/data/seedDonors';
import { BANGLADESH_DATA } from '@/data/bangladeshData';
import { isDonorEligible } from '@/lib/donors';
import Navbar from '@/components/Navbar/Navbar';
import Footer from '@/components/Footer/Footer';
import Link from 'next/link';
import styles from './page.module.css';

export default function RegisterPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('donor'); // 'donor' or 'recipient'
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab === 'recipient') {
        setActiveTab('recipient');
      }
    }
  }, []);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    bloodGroup: '',
    division: '',
    district: '',
    area: '',
    gender: '',
    university: '',
    lastDonation: ''
  });
  
  const [districtsList, setDistrictsList] = useState([]);
  const [areasList, setAreasList] = useState([]);
  
  const [availabilityOption, setAvailabilityOption] = useState('primary'); // 'primary', 'multiple', 'all_district'
  const [selectedAreas, setSelectedAreas] = useState([]); // Selected areas from checkboxes
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleDivisionChange = (e) => {
    const div = e.target.value;
    setFormData(prev => ({ ...prev, division: div, district: '', area: '' }));
    
    if (div && BANGLADESH_DATA[div]) {
      setDistrictsList(Object.keys(BANGLADESH_DATA[div].districts));
    } else {
      setDistrictsList([]);
    }
    setAreasList([]);
    setSelectedAreas([]);
  };

  const handleDistrictChange = (e) => {
    const dist = e.target.value;
    setFormData(prev => ({ ...prev, district: dist, area: '' }));
    
    if (dist && formData.division && BANGLADESH_DATA[formData.division].districts[dist]) {
      setAreasList(BANGLADESH_DATA[formData.division].districts[dist]);
    } else {
      setAreasList([]);
    }
    setSelectedAreas([]);
  };

  const handleAreaChange = (e) => {
    const ar = e.target.value;
    setFormData(prev => ({ ...prev, area: ar }));
    if (availabilityOption === 'primary') {
      setSelectedAreas([ar]);
    } else if (availabilityOption === 'multiple') {
      // Ensure primary area is always selected
      setSelectedAreas(prev => prev.includes(ar) ? prev : [...prev, ar]);
    }
  };

  const handleAvailabilityOptionChange = (option) => {
    setAvailabilityOption(option);
    if (option === 'primary') {
      setSelectedAreas(formData.area ? [formData.area] : []);
    } else if (option === 'all_district') {
      setSelectedAreas(areasList);
    } else {
      setSelectedAreas(formData.area ? [formData.area] : []);
    }
  };

  const handleAreaCheckboxChange = (areaName, checked) => {
    if (checked) {
      setSelectedAreas(prev => [...prev, areaName]);
    } else {
      setSelectedAreas(prev => prev.filter(a => a !== areaName));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (activeTab === 'donor' && (!formData.division || !formData.district || !formData.area)) {
      setError('Please select division, district, and area.');
      return;
    }

    setLoading(true);

    try {
      // 1. Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      if (activeTab === 'recipient') {
        // 2. Save recipient profile in Firestore
        await setDoc(doc(db, 'donors', user.uid), {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          role: 'recipient',
          available: false,
          createdAt: new Date()
        });
      } else {
        // Calculate final areas array
        let finalAreas = [];
        if (availabilityOption === 'primary') {
          finalAreas = [formData.area];
        } else if (availabilityOption === 'all_district') {
          finalAreas = areasList;
        } else {
          // Filter unique areas, ensuring primary area is always present
          finalAreas = Array.from(new Set([formData.area, ...selectedAreas])).filter(Boolean);
        }

        // Calculate availability based on last donation date (if provided)
        const eligible = isDonorEligible(formData.lastDonation);

        // 2. Save donor profile in Firestore
        await setDoc(doc(db, 'donors', user.uid), {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          bloodGroup: formData.bloodGroup,
          division: formData.division,
          district: formData.district,
          area: formData.area,           // Primary residential area (string)
          areas: finalAreas,             // Areas where donor is available (array)
          availableAllAreas: availabilityOption === 'all_district',
          available: eligible,           // Mark unavailable if ineligible
          totalDonations: formData.lastDonation ? 1 : 0,
          lastDonation: formData.lastDonation || null,
          gender: formData.gender,
          university: formData.university || '',
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
              division: formData.division,
              district: formData.district,
              area: formData.area,
              areas: finalAreas.join(', '),
              lastDonation: formData.lastDonation || 'N/A',
              gender: formData.gender,
              university: formData.university || 'N/A'
            }),
          });
        } catch (sheetErr) {
          console.error('Failed to sync to Google Sheets:', sheetErr);
        }
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
          {/* Tab navigation */}
          <div className={styles.tabs}>
            <button
              type="button"
              className={`${styles.tab} ${activeTab === 'donor' ? styles.activeTab : ''}`}
              onClick={() => { setActiveTab('donor'); setError(''); }}
            >
              Register as Donor
            </button>
            <button
              type="button"
              className={`${styles.tab} ${activeTab === 'recipient' ? styles.activeTab : ''}`}
              onClick={() => { setActiveTab('recipient'); setError(''); }}
            >
              Register as Recipient
            </button>
          </div>

          <div className={styles.header}>
            <h1 className={styles.title}>
              {activeTab === 'recipient' ? 'Register to Request Blood' : 'Become a Donor'}
            </h1>
            <p className={styles.subtitle}>
              {activeTab === 'recipient' ? 'Create an account to submit and track blood requests' : 'Join our community and save lives'}
            </p>
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputGroup}>
              <label htmlFor="name" className={styles.label}>Full Name *</label>
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
              <label htmlFor="email" className={styles.label}>Email Address *</label>
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
              <label htmlFor="password" className={styles.label}>Password *</label>
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
              <label htmlFor="phone" className={styles.label}>Phone Number *</label>
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

                {activeTab === 'donor' && (
              <>
                <div className={styles.inputGroup}>
                  <label htmlFor="bloodGroup" className={styles.label}>Blood Group *</label>
                  <select
                    id="bloodGroup"
                    name="bloodGroup"
                    className={styles.select}
                    value={formData.bloodGroup}
                    onChange={handleChange}
                    required
                  >
                    <option value="" disabled>Select Blood Group</option>
                    {BLOOD_GROUPS.map((bg) => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.row}>
                  <div className={styles.inputGroup}>
                    <label htmlFor="gender" className={styles.label}>Gender *</label>
                    <select
                      id="gender"
                      name="gender"
                      className={styles.select}
                      value={formData.gender}
                      onChange={handleChange}
                      required
                    >
                      <option value="" disabled>Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className={styles.inputGroup}>
                    <label htmlFor="university" className={styles.label}>University (Optional)</label>
                    <input
                      type="text"
                      id="university"
                      name="university"
                      className={styles.input}
                      placeholder="e.g. Dhaka University"
                      value={formData.university}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className={styles.inputGroup}>
                  <label htmlFor="lastDonation" className={styles.label}>Last Donation Date (Optional)</label>
                  <input
                    type="date"
                    id="lastDonation"
                    name="lastDonation"
                    className={styles.input}
                    value={formData.lastDonation}
                    onChange={handleChange}
                    max={new Date().toISOString().split('T')[0]}
                  />
                  <p className={styles.helpText}>
                    Leave empty if you have never donated before. We use this to check your availability/eligibility status.
                  </p>
                </div>

                {/* Bangladesh Division & District Selection */}
                <div className={styles.row}>
                  <div className={styles.inputGroup}>
                    <label htmlFor="division" className={styles.label}>Division *</label>
                    <select
                      id="division"
                      name="division"
                      className={styles.select}
                      value={formData.division}
                      onChange={handleDivisionChange}
                      required
                    >
                      <option value="" disabled>Select Division</option>
                      {Object.keys(BANGLADESH_DATA).map((div) => (
                        <option key={div} value={div}>{div}</option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.inputGroup}>
                    <label htmlFor="district" className={styles.label}>District *</label>
                    <select
                      id="district"
                      name="district"
                      className={styles.select}
                      value={formData.district}
                      onChange={handleDistrictChange}
                      disabled={!formData.division}
                      required
                    >
                      <option value="" disabled>Select District</option>
                      {districtsList.map((dist) => (
                        <option key={dist} value={dist}>{dist}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className={styles.inputGroup}>
                  <label htmlFor="area" className={styles.label}>Primary Residential Area *</label>
                  <select
                    id="area"
                    name="area"
                    className={styles.select}
                    value={formData.area}
                    onChange={handleAreaChange}
                    disabled={!formData.district}
                    required
                  >
                    <option value="" disabled>Select Area</option>
                    {areasList.map((ar) => (
                      <option key={ar} value={ar}>{ar}</option>
                    ))}
                  </select>
                  <p className={styles.helpText}>
                    Select your main neighborhood.
                  </p>
                </div>

                {/* Availability configuration */}
                {formData.area && areasList.length > 0 && (
                  <div className={styles.availabilityConfig}>
                    <label className={styles.label}>Availability Coverage Area</label>
                    <div className={styles.radioGroup}>
                      <label className={styles.radioLabel}>
                        <input
                          type="radio"
                          name="availabilityOption"
                          checked={availabilityOption === 'primary'}
                          onChange={() => handleAvailabilityOptionChange('primary')}
                        />
                        <span>Only {formData.area} (primary area)</span>
                      </label>
                      <label className={styles.radioLabel}>
                        <input
                          type="radio"
                          name="availabilityOption"
                          checked={availabilityOption === 'all_district'}
                          onChange={() => handleAvailabilityOptionChange('all_district')}
                        />
                        <span>Available in all areas in {formData.district} district</span>
                      </label>
                      <label className={styles.radioLabel}>
                        <input
                          type="radio"
                          name="availabilityOption"
                          checked={availabilityOption === 'multiple'}
                          onChange={() => handleAvailabilityOptionChange('multiple')}
                        />
                        <span>Select specific areas (multiple)</span>
                      </label>
                    </div>

                    {availabilityOption === 'multiple' && areasList.length > 0 && (
                      <div className={styles.checkboxGrid}>
                        {areasList.map((a) => (
                          <label key={a} className={styles.checkboxLabel}>
                            <input
                              type="checkbox"
                              checked={selectedAreas.includes(a) || a === formData.area}
                              onChange={(e) => handleAreaCheckboxChange(a, e.target.checked)}
                              disabled={a === formData.area} // Primary area is always included
                            />
                            <span>{a}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            <button 
              type="submit" 
              className={styles.submitBtn}
              disabled={loading}
            >
              {loading ? <div className={styles.spinner}></div> : activeTab === 'recipient' ? 'Register as Recipient' : 'Register as Donor'}
            </button>
          </form>

          <div className={styles.footer}>
            Already have an account?{' '}
            <Link href={activeTab === 'recipient' ? '/login?tab=recipient' : '/login'} className={styles.link}>
              Sign In
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
