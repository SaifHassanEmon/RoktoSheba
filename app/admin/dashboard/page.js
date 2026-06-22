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
import { BLOOD_GROUPS, DHAKA_AREAS } from '@/data/seedDonors';
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
    area: '',
    totalDonations: 0,
    lastDonation: '',
    available: true
  });
  const [modalError, setModalError] = useState('');
  const [saving, setSaving] = useState(false);

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
      // Sort donors by name alphabetically
      donorsList.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      setDonors(donorsList);
    } catch (err) {
      console.error('Error fetching donors:', err);
      setError('Failed to fetch donors list. Please refresh the page.');
    } finally {
      setLoading(false);
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
      
      // Update local state
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
      setFormData({
        name: donor.name || '',
        email: donor.email || '',
        phone: donor.phone || '',
        bloodGroup: donor.bloodGroup || '',
        area: donor.area || '',
        totalDonations: donor.totalDonations || 0,
        lastDonation: donor.lastDonation || '',
        available: donor.available !== undefined ? donor.available : true
      });
    } else {
      setCurrentDonor(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        bloodGroup: '',
        area: '',
        totalDonations: 0,
        lastDonation: '',
        available: true
      });
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

  // Save Modal (Create / Update)
  const handleSaveDonor = async (e) => {
    e.preventDefault();
    setModalError('');
    setSaving(true);

    // Basic Validation
    if (!formData.name || !formData.phone || !formData.bloodGroup || !formData.area) {
      setModalError('Please fill in all required fields.');
      setSaving(false);
      return;
    }

    try {
      if (modalMode === 'edit' && currentDonor) {
        // Edit flow
        const donorRef = doc(db, 'donors', currentDonor.id);
        const updateData = {
          name: formData.name,
          phone: formData.phone,
          bloodGroup: formData.bloodGroup,
          area: formData.area,
          totalDonations: parseInt(formData.totalDonations) || 0,
          lastDonation: formData.lastDonation || null,
          available: formData.available
        };
        // Add email if provided
        if (formData.email) updateData.email = formData.email;

        await updateDoc(donorRef, updateData);
        
        setDonors(prev => prev.map(d => 
          d.id === currentDonor.id ? { ...d, ...updateData } : d
        ));
        showToast('Donor profile updated successfully.');
      } else {
        // Add flow
        const collectionRef = collection(db, 'donors');
        const newData = {
          name: formData.name,
          email: formData.email || '',
          phone: formData.phone,
          bloodGroup: formData.bloodGroup,
          area: formData.area,
          district: 'Dhaka',
          totalDonations: parseInt(formData.totalDonations) || 0,
          lastDonation: formData.lastDonation || null,
          available: formData.available,
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
  const availableDonors = donors.filter(d => d.available).length;
  const unavailableDonors = totalDonors - availableDonors;
  const totalDonations = donors.reduce((sum, d) => sum + (parseInt(d.totalDonations) || 0), 0);
  const totalAreas = new Set(donors.map(d => d.area).filter(Boolean)).size;

  // Filtered Donors List
  const filteredDonors = donors.filter(donor => {
    // Search Filter
    const searchMatch = 
      (donor.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (donor.phone || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    // Blood Group Filter
    const groupMatch = selectedGroup === 'all' || donor.bloodGroup === selectedGroup;
    
    // Area Filter
    const areaMatch = selectedArea === 'all' || donor.area === selectedArea;

    // Availability Filter
    const availabilityMatch = 
      selectedAvailability === 'all' || 
      (selectedAvailability === 'available' && donor.available) ||
      (selectedAvailability === 'unavailable' && !donor.available);

    return searchMatch && groupMatch && areaMatch && availabilityMatch;
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
      
      {/* Toast Notification */}
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
              <p className={styles.subtitle}>Administrative control panel for RoktoSeba donors database.</p>
            </div>
            <button 
              onClick={() => openModal('add')} 
              className={`btn btn-primary ${styles.addBtn}`}
            >
              ➕ Add New Donor
            </button>
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
                <p>Areas in Dhaka</p>
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
                  <label htmlFor="filterArea">Area</label>
                  <select 
                    id="filterArea"
                    value={selectedArea} 
                    onChange={(e) => setSelectedArea(e.target.value)}
                    className={styles.selectInput}
                  >
                    <option value="all">All Areas</option>
                    {DHAKA_AREAS.map(a => <option key={a} value={a}>{a}</option>)}
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
                      <th>Area</th>
                      <th>Total Donations</th>
                      <th>Last Donation</th>
                      <th>Available</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDonors.map(donor => (
                      <tr key={donor.id} className={!donor.available ? styles.rowUnavailable : ''}>
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
                        <td>{donor.area}</td>
                        <td className={styles.centerText}>{donor.totalDonations || 0}</td>
                        <td>{donor.lastDonation || 'N/A'}</td>
                        <td>
                          <label className={styles.switch}>
                            <input 
                              type="checkbox" 
                              checked={donor.available !== false}
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

                <div className={styles.formGroup}>
                  <label htmlFor="donorArea">Area in Dhaka *</label>
                  <select 
                    id="donorArea"
                    name="area" 
                    value={formData.area} 
                    onChange={handleFormChange}
                    required
                  >
                    <option value="" disabled>Select Area</option>
                    {DHAKA_AREAS.map(a => <option key={a} value={a}>{a}</option>)}
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
                      checked={formData.available} 
                      onChange={handleFormChange}
                    />
                    <span>Available to Donate Now</span>
                  </label>
                </div>
              </div>

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
