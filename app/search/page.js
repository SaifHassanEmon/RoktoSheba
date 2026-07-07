'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar/Navbar';
import SearchFilters from '@/components/SearchFilters/SearchFilters';
import DonorCard from '@/components/DonorCard/DonorCard';
import RequestBloodModal from '@/components/RequestBloodModal/RequestBloodModal';
import Footer from '@/components/Footer/Footer';
import { getDonors, getDivisionForDistrict, isDonorEligible } from '@/lib/donors';
import { COMPATIBILITY } from '@/data/seedDonors';
import styles from './page.module.css';

// Client-side in-memory filter helper
function filterDonorsLocally(donorsList, currentFilters) {
  return donorsList.filter(donor => {
    // 1. Blood Group
    if (currentFilters.bloodGroup && currentFilters.bloodGroup !== 'all') {
      if (donor.bloodGroup !== currentFilters.bloodGroup) return false;
    }

    // 2. Division
    if (currentFilters.division && currentFilters.division !== 'all') {
      const donorDivision = donor.division || getDivisionForDistrict(donor.district);
      if (donorDivision !== currentFilters.division) return false;
    }

    // 3. District
    if (currentFilters.district && currentFilters.district !== 'all') {
      const donorDistrict = donor.district || 'Dhaka';
      if (donorDistrict !== currentFilters.district) return false;
    }

    // 4. Area
    if (currentFilters.area && currentFilters.area !== 'all') {
      const matchPrimary = donor.area === currentFilters.area;
      const matchAvailable = Array.isArray(donor.areas) && donor.areas.includes(currentFilters.area);
      if (!matchPrimary && !matchAvailable) return false;
    }

    // 5. Available Only
    if (currentFilters.availableOnly) {
      if (!donor.available || !isDonorEligible(donor.lastDonation)) return false;
    }

    // 6. Eligible Only
    if (currentFilters.eligibleOnly) {
      if (!isDonorEligible(donor.lastDonation)) return false;
    }

    return true;
  });
}

function SearchContent() {
  const searchParams = useSearchParams();
  const [compatOpen, setCompatOpen] = useState(false);
  const [selectedDonorForRequest, setSelectedDonorForRequest] = useState(null);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    bloodGroup: 'all',
    division: 'all',
    district: 'all',
    area: 'all',
    availableOnly: false,
    eligibleOnly: false,
  });
  const [allDonors, setAllDonors] = useState([]);
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seedAttempted, setSeedAttempted] = useState(false);

  // 1. Fetch all donors from database once on mount (or if seed attempted)
  useEffect(() => {
    const loadAllDonors = async () => {
      setLoading(true);
      try {
        let allResults = await getDonors({});

        if (allResults.length <= 2 && !seedAttempted) {
          try {
            await fetch('/api/seed', { method: 'POST' });
            setSeedAttempted(true);
            allResults = await getDonors({});
          } catch (error) {
            console.error('Seed request failed:', error);
          }
        }

        setAllDonors(allResults);
      } catch (err) {
        console.error('Failed to load donors:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadAllDonors();
  }, [seedAttempted]);

  // 2. Synchronize filters and run local filtering whenever searchParams or allDonors changes
  useEffect(() => {
    const bg = searchParams.get('bloodGroup') || 'all';
    const div = searchParams.get('division') || 'all';
    const dist = searchParams.get('district') || 'all';
    const area = searchParams.get('area') || 'all';
    const req = searchParams.get('request') === 'true';

    if (req) {
      setSelectedDonorForRequest(null);
      setIsRequestModalOpen(true);
    }
    
    const newFilters = {
      ...filters,
      bloodGroup: bg,
      division: div,
      district: dist,
      area
    };
    
    setFilters(newFilters);
    const filtered = filterDonorsLocally(allDonors, newFilters);
    setDonors(filtered);
  }, [searchParams, allDonors]);

  // 3. Handle local filter updates instantly
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    const filtered = filterDonorsLocally(allDonors, newFilters);
    setDonors(filtered);
  };

  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <div className={styles.container}>
          {/* Page header */}
          <div className={styles.pageHeader}>
            <div>
              <h1 className={styles.pageTitle}>Find Blood Donors in Bangladesh</h1>
              <p className={styles.resultsCount}>
                Showing <strong>{donors.length}</strong> donor{donors.length !== 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={() => handleRequestBlood(null)}
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', height: '42px' }}
            >
              🩸 Post General Blood Request
            </button>
          </div>

          {/* Filters */}
          <SearchFilters filters={filters} onFilterChange={handleFilterChange} />

          {/* Results */}
          {loading ? (
            <div className={styles.loading}>
              <div className={styles.spinner} />
              <p>Fetching donors...</p>
            </div>
          ) : donors.length > 0 ? (
            <div className={styles.grid}>
              {donors.map((donor) => (
                <DonorCard
                  key={donor.id}
                  donor={donor}
                  onRequestBlood={(d) => {
                    setSelectedDonorForRequest(d);
                    setIsRequestModalOpen(true);
                  }}
                />
              ))}
            </div>
          ) : (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  <line x1="8" y1="11" x2="14" y2="11" />
                </svg>
              </div>
              <h3 className={styles.emptyTitle}>No donors found</h3>
              <p className={styles.emptyText}>
                No donors found matching your criteria. Try adjusting your filters.
              </p>
            </div>
          )}

          {/* Blood Compatibility Section */}
          <div className={styles.compatSection}>
            <button
              className={styles.compatToggle}
              onClick={() => setCompatOpen(!compatOpen)}
              aria-expanded={compatOpen}
            >
              <span className={styles.compatToggleText}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                Blood Group Compatibility Guide
              </span>
              <svg
                className={`${styles.chevron} ${compatOpen ? styles.chevronOpen : ''}`}
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {compatOpen && (
              <div className={styles.compatContent}>
                <div className={styles.compatTable}>
                  <div className={styles.compatHeader}>
                    <span>Blood Group</span>
                    <span>Can Donate To</span>
                    <span>Can Receive From</span>
                  </div>
                  {Object.entries(COMPATIBILITY).map(([group, info]) => (
                    <div key={group} className={styles.compatRow}>
                      <span className={styles.compatGroup}>{group}</span>
                      <span className={styles.compatList}>
                        {info.canDonateTo.join(', ')}
                      </span>
                      <span className={styles.compatList}>
                        {info.canReceiveFrom.join(', ')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />

      {isRequestModalOpen && (
        <RequestBloodModal
          donor={selectedDonorForRequest}
          onClose={() => {
            setIsRequestModalOpen(false);
            setSelectedDonorForRequest(null);
          }}
        />
      )}
    </>
  );
}

// Loading fallback
function SearchLoading() {
  return (
    <div className={styles.loading}>
      <div className={styles.spinner} />
      <p>Loading search…</p>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchLoading />}>
      <SearchContent />
    </Suspense>
  );
}
