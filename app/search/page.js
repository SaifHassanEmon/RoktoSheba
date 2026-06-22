'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar/Navbar';
import SearchFilters from '@/components/SearchFilters/SearchFilters';
import DonorCard from '@/components/DonorCard/DonorCard';
import Footer from '@/components/Footer/Footer';
import { getDonors } from '@/lib/donors';
import { COMPATIBILITY } from '@/data/seedDonors';
import styles from './page.module.css';

function SearchContent() {
  const searchParams = useSearchParams();
  const [compatOpen, setCompatOpen] = useState(false);
  const [filters, setFilters] = useState({
    bloodGroup: 'all',
    division: 'all',
    district: 'all',
    area: 'all',
    availableOnly: false,
    eligibleOnly: false,
  });
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seedAttempted, setSeedAttempted] = useState(false);

  // Read URL params on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      const bg = searchParams.get('bloodGroup') || 'all';
      const div = searchParams.get('division') || 'all';
      const dist = searchParams.get('district') || 'all';
      const area = searchParams.get('area') || 'all';
      const initial = { 
        bloodGroup: bg, 
        division: div, 
        district: dist, 
        area, 
        availableOnly: false, 
        eligibleOnly: false 
      };
      setFilters(initial);
      
      let results = await getDonors(initial);

      if (results.length <= 2 && !seedAttempted) {
        try {
          await fetch('/api/seed', { method: 'POST' });
          setSeedAttempted(true);
          results = await getDonors(initial);
        } catch (error) {
          console.error('Seed request failed:', error);
        }
      }

      setDonors(results);
      setLoading(false);
    };
    
    fetchInitialData();
  }, [searchParams, seedAttempted]);

  const handleFilterChange = async (newFilters) => {
    setLoading(true);
    setFilters(newFilters);
    const results = await getDonors(newFilters);
    setDonors(results);
    setLoading(false);
  };

  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <div className={styles.container}>
          {/* Page header */}
          <div className={styles.pageHeader}>
            <h1 className={styles.pageTitle}>Find Blood Donors in Dhaka</h1>
            <p className={styles.resultsCount}>
              Showing <strong>{donors.length}</strong> donor{donors.length !== 1 ? 's' : ''}
            </p>
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
                <DonorCard key={donor.id} donor={donor} />
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
