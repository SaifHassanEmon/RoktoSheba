'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar/Navbar';
import Footer from '@/components/Footer/Footer';
import { BLOOD_BANKS } from '@/data/bloodBanks';
import { BANGLADESH_DATA } from '@/data/bangladeshData';
import styles from './page.module.css';

// Haversine formula to calculate distance in km
function getHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

export default function BloodBanksPage() {
  const [banks, setBanks] = useState(BLOOD_BANKS);
  const [userLocation, setUserLocation] = useState(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState('');
  const [geoSuccess, setGeoSuccess] = useState(false);
  const [limitTo20km, setLimitTo20km] = useState(true);

  // Filters State
  const [division, setDivision] = useState('');
  const [district, setDistrict] = useState('');
  const [districtsList, setDistrictsList] = useState([]);

  // Sync districts dropdown when division changes
  useEffect(() => {
    if (division && BANGLADESH_DATA[division]) {
      setDistrictsList(Object.keys(BANGLADESH_DATA[division].districts));
    } else {
      setDistrictsList([]);
    }
    setDistrict('');
  }, [division]);

  const handleLocateUser = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }
    setGeoLoading(true);
    setGeoError('');
    setGeoSuccess(false);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const uLat = position.coords.latitude;
        const uLon = position.coords.longitude;
        setUserLocation({ lat: uLat, lon: uLon });
        setGeoSuccess(true);
        setGeoLoading(false);

        // Map and calculate distance for all blood banks
        const calculated = BLOOD_BANKS.map(bank => {
          const dist = getHaversineDistance(uLat, uLon, bank.lat, bank.lon);
          return { ...bank, distance: parseFloat(dist.toFixed(2)) };
        });

        // Sort by distance (closest first)
        calculated.sort((a, b) => a.distance - b.distance);
        setBanks(calculated);
      },
      (error) => {
        console.error('Error fetching location:', error);
        setGeoLoading(false);
        if (error.code === 1) {
          setGeoError('Location permission denied. Please enable location access in your browser settings.');
        } else {
          setGeoError('Unable to retrieve your current location. Please search manually below.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Filter list of blood banks based on dropdown selects and proximity
  const filteredBanks = banks.filter(bank => {
    if (division && bank.division !== division) return false;
    if (district && bank.district !== district) return false;
    if (userLocation && limitTo20km && bank.distance !== undefined && bank.distance > 20) return false;
    return true;
  });

  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <div className={styles.container}>
          {/* Header Section */}
          <div className={styles.pageHeader}>
            <span className="badge badge-accent">Emergency Directory</span>
            <h1 className={styles.pageTitle}>Nearby Blood Banks</h1>
            <p className={styles.pageSubtitle}>
              Find physical blood banks and storage facilities near your location. Share your location for instant distance-based sorting.
            </p>
          </div>

          {/* Geolocation Activation Card */}
          <div className={`card-glass ${styles.geoCard}`}>
            <div className={styles.geoLeft}>
              <div className={styles.geoIcon}>📍</div>
              <div className={styles.geoInfo}>
                <h3>Find Nearest Facilities Instantly</h3>
                <p>Allow browser location access to sort blood banks starting from the closest to you.</p>
              </div>
            </div>
            <div className={styles.geoRight}>
              <button
                onClick={handleLocateUser}
                disabled={geoLoading}
                className={`btn btn-primary ${styles.locateBtn}`}
              >
                {geoLoading ? (
                  <>
                    <span className={styles.spinner} />
                    Locating...
                  </>
                ) : (
                  '⚡ Locate Closest Banks'
                )}
              </button>
            </div>
          </div>

          {/* Geolocation Feedback Message */}
          {geoSuccess && (
            <div className={`${styles.alert} ${styles.alertSuccess}`}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', width: '100%' }}>
                <span>✅ Location retrieved successfully! Blood banks are now sorted by distance from your current coordinates.</span>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '600' }}>
                  <input
                    type="checkbox"
                    checked={limitTo20km}
                    onChange={(e) => setLimitTo20km(e.target.checked)}
                    style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                  />
                  <span>Suggest only within 20 km</span>
                </label>
              </div>
            </div>
          )}
          {geoError && (
            <div className={`${styles.alert} ${styles.alertError}`}>
              ⚠️ {geoError}
            </div>
          )}

          {/* Manual Filter Controls */}
          <div className={`card-glass ${styles.filterBar}`}>
            <h4 className={styles.filterTitle}>🔍 Filter Manually</h4>
            <div className={styles.filterGrid}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Division</label>
                <select
                  value={division}
                  onChange={(e) => setDivision(e.target.value)}
                  className={styles.select}
                >
                  <option value="">All Divisions</option>
                  {Object.keys(BANGLADESH_DATA).map(div => (
                    <option key={div} value={div}>{div}</option>
                  ))}
                </select>
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>District</label>
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  disabled={!division}
                  className={styles.select}
                >
                  <option value="">All Districts</option>
                  {districtsList.map(dist => (
                    <option key={dist} value={dist}>{dist}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Results Grid */}
          <div className={styles.resultsHeader}>
            <h3>Available Facilities ({filteredBanks.length})</h3>
          </div>

          {filteredBanks.length > 0 ? (
            <div className={styles.banksGrid}>
              {filteredBanks.map((bank) => (
                <div key={bank.id} className={`card-glass ${styles.bankCard}`}>
                  <div className={styles.cardHeader}>
                    <h3 className={styles.bankName}>{bank.name}</h3>
                    <span className={`${styles.badge} ${bank.availableStatus.includes('24/7') ? styles.activeBadge : styles.timedBadge}`}>
                      {bank.availableStatus}
                    </span>
                  </div>

                  {/* Distance badge if geolocation is active */}
                  {bank.distance !== undefined && (
                    <div className={styles.distanceBadge}>
                      📍 <strong>{bank.distance} km</strong> away from you
                    </div>
                  )}

                  <div className={styles.cardBody}>
                    <div className={styles.infoRow}>
                      <span className={styles.infoIcon}>📍</span>
                      <p className={styles.infoText}>{bank.address}</p>
                    </div>

                    <div className={styles.infoRow}>
                      <span className={styles.infoIcon}>📞</span>
                      <a href={`tel:${bank.phone}`} className={styles.phoneLink}>
                        {bank.phone}
                      </a>
                    </div>
                  </div>

                  <div className={styles.cardActions}>
                    <a href={`tel:${bank.phone}`} className={`btn btn-primary ${styles.actionBtn}`}>
                      📞 Call Hotline
                    </a>
                    
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${bank.lat},${bank.lon}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`btn btn-secondary ${styles.actionBtn}`}
                    >
                      🗺️ Get Directions
                    </a>
                  </div>

                  {bank.website && (
                    <a
                      href={bank.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.webLink}
                    >
                      🌐 Visit Official Website
                    </a>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>🏥</div>
              <h3>No blood banks found</h3>
              <p>No facilities match your active division/district filter. Try clearing the filters.</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
