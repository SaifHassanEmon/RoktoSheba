'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  addDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Navbar from '@/components/Navbar/Navbar';
import Footer from '@/components/Footer/Footer';
import { BLOOD_GROUPS } from '@/data/seedDonors';
import { BANGLADESH_DATA } from '@/data/bangladeshData';
import { isDonorEligible } from '@/lib/donors';
import styles from './page.module.css';

export default function AdminDashboardPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();

  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [selectedDivision, setSelectedDivision] = useState('all');
  const [selectedDistrict, setSelectedDistrict] = useState('all');
  const [selectedArea, setSelectedArea] = useState('all');
  const [selectedAvailability, setSelectedAvailability] = useState('all');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [currentDonor, setCurrentDonor] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    bloodGroup: '',
    division: '',
    district: '',
    area: '',
    totalDonations: 0,
    lastDonation: '',
    available: true
  });

  const [modalDistricts, setModalDistricts] = useState([]);
  const [modalAreas, setModalAreas] = useState([]);
  const [modalAvailabilityOption, setModalAvailabilityOption] = useState('primary'); // 'primary', 'multiple', 'all_district'
  const [modalSelectedAreas, setModalSelectedAreas] = useState([]); // Array of areas from checkboxes

  const [modalError, setModalError] = useState('');
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Success Feedback Toast
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Security checks
  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      router.push('/login?tab=admin');
    }
  }, [user, isAdmin, authLoading, router]);

  // Fetch all donors
  const fetchDonors = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'donors'));
      const donorsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      donorsList.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      setDonors(donorsList);
    } catch (err) {
      console.error('Error fetching donors:', err);
      setError('Failed to fetch donors list. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const syncAllToGoogleSheets = async () => {
    if (donors.length === 0) {
      showToast('No donors to sync.', 'error');
      return;
    }
    setSyncing(true);
    try {
      // Map donors list to sheets representation
      const formattedDonors = donors.map(donor => ({
        name: donor.name || "",
        email: donor.email || "",
        phone: donor.phone || "",
        bloodGroup: donor.bloodGroup || "",
        division: donor.division || "",
        district: donor.district || "",
        area: donor.area || "",
        areas: Array.isArray(donor.areas) ? donor.areas.join(', ') : (donor.area || ""),
        lastDonation: donor.lastDonation || "N/A",
        available: donor.available !== undefined ? donor.available : true,
        totalDonations: donor.totalDonations || 0,
        createdAt: donor.createdAt ? (donor.createdAt.seconds ? new Date(donor.createdAt.seconds * 1000).toISOString() : donor.createdAt) : new Date().toISOString()
      }));

      const res = await fetch('/api/sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formattedDonors)
      });

      const result = await res.json();
      if (result.success) {
        showToast(`Successfully synced ${result.count || donors.length} donors to Google Sheets!`);
      } else {
        showToast(result.message || 'Failed to sync. Make sure GOOGLE_SCRIPT_URL is configured in your environment variables.', 'error');
      }
    } catch (err) {
      console.error('Error syncing to Google Sheets:', err);
      showToast('Failed to sync to Google Sheets. Check console for details.', 'error');
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    if (user && isAdmin) {
      fetchDonors();
    }
  }, [user, isAdmin]);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  // Toggle Availability
  const handleToggleAvailability = async (donorId, currentStatus) => {
    try {
      const donorRef = doc(db, 'donors', donorId);
      await updateDoc(donorRef, {
        available: !currentStatus
      });
      
      setDonors(prev => prev.map(d => 
        d.id === donorId ? { ...d, available: !currentStatus } : d
      ));
      showToast('Availability status updated successfully.');
    } catch (err) {
      console.error('Error updating availability:', err);
      showToast('Failed to update availability.', 'error');
    }
  };

  // Delete Donor
  const handleDeleteDonor = async (donorId, name) => {
    if (window.confirm(`Are you sure you want to delete donor "${name}"? This action cannot be undone.`)) {
      try {
        await deleteDoc(doc(db, 'donors', donorId));
        setDonors(prev => prev.filter(d => d.id !== donorId));
        showToast(`Donor "${name}" deleted successfully.`);
      } catch (err) {
        console.error('Error deleting donor:', err);
        showToast('Failed to delete donor.', 'error');
      }
    }
  };

  // Open Modal
  const openModal = (mode, donor = null) => {
    setModalMode(mode);
    setModalError('');
    
    if (mode === 'edit' && donor) {
      setCurrentDonor(donor);
      
      const div = donor.division || '';
      const dist = donor.district || '';
      const ar = donor.area || '';
      const listAreas = donor.areas || (ar ? [ar] : []);
      
      setFormData({
        name: donor.name || '',
        email: donor.email || '',
        phone: donor.phone || '',
        bloodGroup: donor.bloodGroup || '',
        division: div,
        district: dist,
        area: ar,
        totalDonations: donor.totalDonations || 0,
        lastDonation: donor.lastDonation || '',
        available: donor.available !== undefined ? donor.available : true
      });

      // Populate dropdown lists
      if (div && BANGLADESH_DATA[div]) {
        setModalDistricts(Object.keys(BANGLADESH_DATA[div].districts));
        if (dist && BANGLADESH_DATA[div].districts[dist]) {
          setModalAreas(BANGLADESH_DATA[div].districts[dist]);
        } else {
          setModalAreas([]);
        }
      } else {
        setModalDistricts([]);
        setModalAreas([]);
      }

      // Populate multi-area configurations
      setModalSelectedAreas(listAreas);
      if (donor.availableAllAreas) {
        setModalAvailabilityOption('all_district');
      } else if (listAreas.length > 1) {
        setModalAvailabilityOption('multiple');
      } else {
        setModalAvailabilityOption('primary');
      }

    } else {
      setCurrentDonor(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        bloodGroup: '',
        division: '',
        district: '',
        area: '',
        totalDonations: 0,
        lastDonation: '',
        available: true
      });
      setModalDistricts([]);
      setModalAreas([]);
      setModalSelectedAreas([]);
      setModalAvailabilityOption('primary');
    }
    setModalOpen(true);
  };

  // Handle Form Change
  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Chained dropdown selections inside modal
  const handleModalDivisionChange = (e) => {
    const div = e.target.value;
    setFormData(prev => ({ ...prev, division: div, district: '', area: '' }));
    if (div && BANGLADESH_DATA[div]) {
      setModalDistricts(Object.keys(BANGLADESH_DATA[div].districts));
    } else {
      setModalDistricts([]);
    }
    setModalAreas([]);
    setModalSelectedAreas([]);
  };

  const handleModalDistrictChange = (e) => {
    const dist = e.target.value;
    setFormData(prev => ({ ...prev, district: dist, area: '' }));
    if (dist && formData.division && BANGLADESH_DATA[formData.division].districts[dist]) {
      setModalAreas(BANGLADESH_DATA[formData.division].districts[dist]);
    } else {
      setModalAreas([]);
    }
    setModalSelectedAreas([]);
  };

  const handleModalAreaChange = (e) => {
    const ar = e.target.value;
    setFormData(prev => ({ ...prev, area: ar }));
    if (modalAvailabilityOption === 'primary') {
      setModalSelectedAreas([ar]);
    } else if (modalAvailabilityOption === 'multiple') {
      setModalSelectedAreas(prev => prev.includes(ar) ? prev : [...prev, ar]);
    }
  };

  const handleModalAvailabilityOptionChange = (option) => {
    setModalAvailabilityOption(option);
    if (option === 'primary') {
      setModalSelectedAreas(formData.area ? [formData.area] : []);
    } else if (option === 'all_district') {
      setModalSelectedAreas(modalAreas);
    } else {
      setModalSelectedAreas(formData.area ? [formData.area] : []);
    }
  };

  const handleModalAreaCheckboxChange = (areaName, checked) => {
    if (checked) {
      setModalSelectedAreas(prev => [...prev, areaName]);
    } else {
      setModalSelectedAreas(prev => prev.filter(a => a !== areaName));
    }
  };

  // Save Modal (Create / Update)
  const handleSaveDonor = async (e) => {
    e.preventDefault();
    setModalError('');
    setSaving(true);

    if (!formData.name || !formData.phone || !formData.bloodGroup || !formData.division || !formData.district || !formData.area) {
      setModalError('Please fill in all required fields.');
      setSaving(false);
      return;
    }

    // Calculate final areas array
    let finalAreas = [];
    if (modalAvailabilityOption === 'primary') {
      finalAreas = [formData.area];
    } else if (modalAvailabilityOption === 'all_district') {
      finalAreas = modalAreas;
    } else {
      finalAreas = Array.from(new Set([formData.area, ...modalSelectedAreas])).filter(Boolean);
    }

    try {
      if (modalMode === 'edit' && currentDonor) {
        const donorRef = doc(db, 'donors', currentDonor.id);
        const eligible = isDonorEligible(formData.lastDonation);
        const finalAvailability = eligible ? formData.available : false;
        const updateData = {
          name: formData.name,
          phone: formData.phone,
          bloodGroup: formData.bloodGroup,
          division: formData.division,
          district: formData.district,
          area: formData.area,
          areas: finalAreas,
          availableAllAreas: modalAvailabilityOption === 'all_district',
          totalDonations: parseInt(formData.totalDonations) || 0,
          lastDonation: formData.lastDonation || null,
          available: finalAvailability
        };
        if (formData.email) updateData.email = formData.email;

        await updateDoc(donorRef, updateData);
        
        setDonors(prev => prev.map(d => 
          d.id === currentDonor.id ? { ...d, ...updateData } : d
        ));
        showToast('Donor profile updated successfully.');
      } else {
        const collectionRef = collection(db, 'donors');
        const eligible = isDonorEligible(formData.lastDonation);
        const finalAvailability = eligible ? formData.available : false;
        const newData = {
          name: formData.name,
          email: formData.email || '',
          phone: formData.phone,
          bloodGroup: formData.bloodGroup,
          division: formData.division,
          district: formData.district,
          area: formData.area,
          areas: finalAreas,
          availableAllAreas: modalAvailabilityOption === 'all_district',
          totalDonations: parseInt(formData.totalDonations) || 0,
          lastDonation: formData.lastDonation || null,
          available: finalAvailability,
          createdAt: new Date()
        };

        const docRef = await addDoc(collectionRef, newData);
        
        setDonors(prev => [...prev, { id: docRef.id, ...newData }].sort((a, b) => a.name.localeCompare(b.name)));
        showToast('New donor added successfully.');
      }
      setModalOpen(false);
    } catch (err) {
      console.error('Error saving donor:', err);
      setModalError('Failed to save donor record. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Calculate dynamic dashboard stats
  const totalDonors = donors.length;
  const availableDonors = donors.filter(d => d.available && isDonorEligible(d.lastDonation)).length;
  const unavailableDonors = totalDonors - availableDonors;
  const totalDonations = donors.reduce((sum, d) => sum + (parseInt(d.totalDonations) || 0), 0);
  const totalAreas = new Set(donors.map(d => d.area).filter(Boolean)).size;

  // Filtered Donors List
  const filteredDonors = donors.filter(donor => {
    const searchMatch = 
      (donor.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (donor.phone || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const groupMatch = selectedGroup === 'all' || donor.bloodGroup === selectedGroup;
    
    const divisionMatch = selectedDivision === 'all' || donor.division === selectedDivision;
    
    const districtMatch = selectedDistrict === 'all' || donor.district === selectedDistrict;

    // Match area - supports both legacy string and new array-of-areas
    const areaMatch = selectedArea === 'all' || 
      donor.area === selectedArea || 
      (Array.isArray(donor.areas) && donor.areas.includes(selectedArea));

    const isAvailable = donor.available && isDonorEligible(donor.lastDonation);
    const availabilityMatch = 
      selectedAvailability === 'all' || 
      (selectedAvailability === 'available' && isAvailable) ||
      (selectedAvailability === 'unavailable' && !isAvailable);

    return searchMatch && groupMatch && divisionMatch && districtMatch && areaMatch && availabilityMatch;
  });

  if (authLoading || !user || !isAdmin) {
    return (
      <>
        <Navbar />
        <main className={styles.adminMain}>
          <div className={styles.loaderWrapper}>
            <div className={styles.spinner}></div>
            <p>Authenticating Administrator...</p>
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
          {toast.type === 'success' ? '✅' : '❌'} {toast.message}
        </div>
      )}

      <main className={styles.adminMain}>
        <div className="container">
          <header className={styles.header}>
            <div className={styles.headerTitleBox}>
              <span className="badge badge-accent">Admin Portal</span>
              <h1 className={styles.title}>System Dashboard</h1>
              <p className={styles.subtitle}>Administrative control panel for RedpulseBD donors database.</p>
            </div>
            <div className={styles.headerActions}>
              <button 
                onClick={syncAllToGoogleSheets} 
                className={`btn btn-secondary ${styles.syncBtn}`}
                disabled={syncing}
              >
                {syncing ? '🔄 Syncing...' : '📊 Sync to Google Sheet'}
              </button>
              <button 
                onClick={() => openModal('add')} 
                className={`btn btn-primary ${styles.addBtn}`}
              >
                ➕ Add New Donor
              </button>
            </div>
          </header>

          {/* Stats Grid */}
          <section className={styles.statsGrid}>
            <div className={`card-glass ${styles.statCard}`}>
              <div className={styles.statIcon}>👥</div>
              <div className={styles.statDetails}>
                <h3>{totalDonors}</h3>
                <p>Total Registered</p>
              </div>
            </div>

            <div className={`card-glass ${styles.statCard}`}>
              <div className={styles.statIcon}>🟢</div>
              <div className={styles.statDetails}>
                <h3>{availableDonors}</h3>
                <p>Active & Available</p>
              </div>
            </div>

            <div className={`card-glass ${styles.statCard}`}>
              <div className={styles.statIcon}>🔴</div>
              <div className={styles.statDetails}>
                <h3>{unavailableDonors}</h3>
                <p>Temporarily Offline</p>
              </div>
            </div>

            <div className={`card-glass ${styles.statCard}`}>
              <div className={styles.statIcon}>🩸</div>
              <div className={styles.statDetails}>
                <h3>{totalDonations}</h3>
                <p>Total Donations</p>
              </div>
            </div>

            <div className={`card-glass ${styles.statCard}`}>
              <div className={styles.statIcon}>📍</div>
              <div className={styles.statDetails}>
                <h3>{totalAreas}</h3>
                <p>Areas Covered</p>
              </div>
            </div>
          </section>

          {/* Management Area */}
          <section className={`card-glass ${styles.managementCard}`}>
            <div className={styles.filtersBar}>
              <div className={styles.searchBox}>
                <input 
                  type="text" 
                  placeholder="Search by name or phone..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={styles.searchInput}
                />
              </div>

              <div className={styles.selectsBox}>
                <div className={styles.selectWrapper}>
                  <label htmlFor="filterBloodGroup">Blood Group</label>
                  <select 
                    id="filterBloodGroup"
                    value={selectedGroup} 
                    onChange={(e) => setSelectedGroup(e.target.value)}
                    className={styles.selectInput}
                  >
                    <option value="all">All Groups</option>
                    {BLOOD_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>

                <div className={styles.selectWrapper}>
                  <label htmlFor="filterDivision">Division</label>
                  <select 
                    id="filterDivision"
                    value={selectedDivision} 
                    onChange={(e) => {
                      setSelectedDivision(e.target.value);
                      setSelectedDistrict('all');
                      setSelectedArea('all');
                    }}
                    className={styles.selectInput}
                  >
                    <option value="all">All Divisions</option>
                    {Object.keys(BANGLADESH_DATA).map(div => <option key={div} value={div}>{div}</option>)}
                  </select>
                </div>

                <div className={styles.selectWrapper}>
                  <label htmlFor="filterDistrict">District</label>
                  <select 
                    id="filterDistrict"
                    value={selectedDistrict} 
                    onChange={(e) => {
                      setSelectedDistrict(e.target.value);
                      setSelectedArea('all');
                    }}
                    className={styles.selectInput}
                    disabled={selectedDivision === 'all'}
                  >
                    <option value="all">All Districts</option>
                    {selectedDivision !== 'all' && Object.keys(BANGLADESH_DATA[selectedDivision].districts).map(dist => <option key={dist} value={dist}>{dist}</option>)}
                  </select>
                </div>

                <div className={styles.selectWrapper}>
                  <label htmlFor="filterArea">Area</label>
                  <select 
                    id="filterArea"
                    value={selectedArea} 
                    onChange={(e) => setSelectedArea(e.target.value)}
                    className={styles.selectInput}
                    disabled={selectedDistrict === 'all'}
                  >
                    <option value="all">All Areas</option>
                    {selectedDivision !== 'all' && selectedDistrict !== 'all' && BANGLADESH_DATA[selectedDivision].districts[selectedDistrict].map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>

                <div className={styles.selectWrapper}>
                  <label htmlFor="filterAvailability">Status</label>
                  <select 
                    id="filterAvailability"
                    value={selectedAvailability} 
                    onChange={(e) => setSelectedAvailability(e.target.value)}
                    className={styles.selectInput}
                  >
                    <option value="all">All Statuses</option>
                    <option value="available">Available Only</option>
                    <option value="unavailable">Offline Only</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Donors Table */}
            {loading ? (
              <div className={styles.tableLoader}>
                <div className={styles.spinner}></div>
                <p>Fetching donors...</p>
              </div>
            ) : error ? (
              <div className={styles.errorBox}>{error}</div>
            ) : filteredDonors.length === 0 ? (
              <div className={styles.emptyBox}>No donors found matching your search filters.</div>
            ) : (
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Group</th>
                      <th>Phone</th>
                      <th>District / Area</th>
                      <th>Total Donations</th>
                      <th>Last Donation</th>
                      <th>Available</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDonors.map(donor => (
                      <tr key={donor.id} className={!(donor.available && isDonorEligible(donor.lastDonation)) ? styles.rowUnavailable : ''}>
                        <td>
                          <div className={styles.donorInfo}>
                            <span className={styles.donorName}>{donor.name}</span>
                            {donor.email && <span className={styles.donorEmail}>{donor.email}</span>}
                          </div>
                        </td>
                        <td>
                          <span className={`badge badge-accent`}>{donor.bloodGroup}</span>
                        </td>
                        <td className={styles.phoneCell}>{donor.phone}</td>
                        <td>
                          <div className={styles.donorInfo}>
                            <span>{donor.district || 'Dhaka'}</span>
                            <span className={styles.donorEmail}>
                              {donor.areas && donor.areas.length > 1 
                                ? `${donor.area} (${donor.areas.length} areas)` 
                                : donor.area || 'N/A'}
                            </span>
                          </div>
                        </td>
                        <td className={styles.centerText}>{donor.totalDonations || 0}</td>
                        <td>{donor.lastDonation || 'N/A'}</td>
                        <td>
                          <label className={styles.switch}>
                            <input 
                              type="checkbox" 
                              checked={donor.available && isDonorEligible(donor.lastDonation)}
                              disabled={!isDonorEligible(donor.lastDonation)}
                              onChange={() => handleToggleAvailability(donor.id, donor.available)}
                            />
                            <span className={styles.slider}></span>
                          </label>
                        </td>
                        <td>
                          <div className={styles.actionsBox}>
                            <button 
                              onClick={() => openModal('edit', donor)}
                              className={styles.actionBtnEdit}
                              title="Edit Profile"
                            >
                              ✏️ Edit
                            </button>
                            <button 
                              onClick={() => handleDeleteDonor(donor.id, donor.name)}
                              className={styles.actionBtnDelete}
                              title="Delete Donor"
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className={styles.tableFooter}>
              Showing {filteredDonors.length} of {donors.length} donors
            </div>
          </section>
        </div>
      </main>

      {/* Add / Edit Donor Modal */}
      {modalOpen && (
        <div className={styles.modalOverlay}>
          <div className={`card-glass ${styles.modalCard}`}>
            <header className={styles.modalHeader}>
              <h2>{modalMode === 'edit' ? 'Edit Donor Profile' : 'Add New Donor'}</h2>
              <button onClick={() => setModalOpen(false)} className={styles.modalClose}>✕</button>
            </header>

            {modalError && <div className={styles.errorBox}>{modalError}</div>}

            <form onSubmit={handleSaveDonor} className={styles.modalForm}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label htmlFor="donorName">Full Name *</label>
                  <input 
                    type="text" 
                    id="donorName"
                    name="name" 
                    value={formData.name} 
                    onChange={handleFormChange}
                    placeholder="Enter donor name"
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="donorEmail">Email Address</label>
                  <input 
                    type="email" 
                    id="donorEmail"
                    name="email" 
                    value={formData.email} 
                    onChange={handleFormChange}
                    placeholder="donor@example.com"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="donorPhone">Phone Number *</label>
                  <input 
                    type="tel" 
                    id="donorPhone"
                    name="phone" 
                    value={formData.phone} 
                    onChange={handleFormChange}
                    placeholder="+880 1XXX XXXXXX"
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="donorBloodGroup">Blood Group *</label>
                  <select 
                    id="donorBloodGroup"
                    name="bloodGroup" 
                    value={formData.bloodGroup} 
                    onChange={handleFormChange}
                    required
                  >
                    <option value="" disabled>Select Blood Group</option>
                    {BLOOD_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>

                {/* Chained Location Dropdowns */}
                <div className={styles.formGroup}>
                  <label htmlFor="donorDivision">Division *</label>
                  <select 
                    id="donorDivision"
                    name="division" 
                    value={formData.division} 
                    onChange={handleModalDivisionChange}
                    required
                  >
                    <option value="" disabled>Select Division</option>
                    {Object.keys(BANGLADESH_DATA).map(div => <option key={div} value={div}>{div}</option>)}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="donorDistrict">District *</label>
                  <select 
                    id="donorDistrict"
                    name="district" 
                    value={formData.district} 
                    onChange={handleModalDistrictChange}
                    disabled={!formData.division}
                    required
                  >
                    <option value="" disabled>Select District</option>
                    {modalDistricts.map(dist => <option key={dist} value={dist}>{dist}</option>)}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="donorArea">Primary Residential Area *</label>
                  <select 
                    id="donorArea"
                    name="area" 
                    value={formData.area} 
                    onChange={handleModalAreaChange}
                    disabled={!formData.district}
                    required
                  >
                    <option value="" disabled>Select Area</option>
                    {modalAreas.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="donorTotalDonations">Total Donations</label>
                  <input 
                    type="number" 
                    id="donorTotalDonations"
                    name="totalDonations" 
                    value={formData.totalDonations} 
                    onChange={handleFormChange}
                    min="0"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="donorLastDonation">Last Donation Date</label>
                  <input 
                    type="date" 
                    id="donorLastDonation"
                    name="lastDonation" 
                    value={formData.lastDonation} 
                    onChange={handleFormChange}
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div className={`${styles.formGroup} ${styles.checkboxGroup}`}>
                  <label className={styles.toggleLabel}>
                    <input 
                      type="checkbox" 
                      name="available" 
                      checked={isDonorEligible(formData.lastDonation) ? formData.available : false}
                      disabled={!isDonorEligible(formData.lastDonation)}
                      onChange={handleFormChange}
                    />
                    <span>Available to Donate Now</span>
                  </label>
                  {!isDonorEligible(formData.lastDonation) && (
                    <p style={{ fontSize: '0.75rem', color: 'var(--warning)', marginTop: '0.25rem' }}>
                      Unavailable because donor is not eligible (last donation was less than 90 days ago).
                    </p>
                  )}
                </div>
              </div>

              {/* Multiple Areas of Availability */}
              {formData.area && (
                <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border-light)', paddingTop: '1rem', gridColumn: '1 / -1' }}>
                  <label className={styles.toggleLabel} style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.5rem', display: 'block' }}>
                    Areas of Availability to Donate
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="modalAvailabilityOption"
                        checked={modalAvailabilityOption === 'primary'}
                        onChange={() => handleModalAvailabilityOptionChange('primary')}
                      />
                      <span>My primary area only ({formData.area})</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="modalAvailabilityOption"
                        checked={modalAvailabilityOption === 'all_district'}
                        onChange={() => handleModalAvailabilityOptionChange('all_district')}
                      />
                      <span>Available in all areas in {formData.district} district</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="modalAvailabilityOption"
                        checked={modalAvailabilityOption === 'multiple'}
                        onChange={() => handleModalAvailabilityOptionChange('multiple')}
                      />
                      <span>Select specific areas (multiple)</span>
                    </label>
                  </div>

                  {modalAvailabilityOption === 'multiple' && modalAreas.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.5rem', maxHeight: '120px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '0.75rem' }}>
                      {modalAreas.map((a) => (
                        <label key={a} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={modalSelectedAreas.includes(a) || a === formData.area}
                            onChange={(e) => handleModalAreaCheckboxChange(a, e.target.checked)}
                            disabled={a === formData.area}
                          />
                          <span>{a}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className={styles.modalActions}>
                <button 
                  type="button" 
                  onClick={() => setModalOpen(false)}
                  className="btn btn-secondary"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}
