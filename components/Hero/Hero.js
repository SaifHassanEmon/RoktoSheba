'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { BLOOD_GROUPS } from '@/data/seedDonors';
import { BANGLADESH_DATA } from '@/data/bangladeshData';
import styles from './Hero.module.css';

export default function Hero() {
  const router = useRouter();
  const [bloodGroup, setBloodGroup] = useState('');
  const [division, setDivision] = useState('');
  const [district, setDistrict] = useState('');
  const [area, setArea] = useState('');
  const [districtsList, setDistrictsList] = useState([]);
  const [areasList, setAreasList] = useState([]);

  const handleDivisionChange = (e) => {
    const val = e.target.value;
    setDivision(val);
    setDistrict('');
    setArea('');
    if (val && BANGLADESH_DATA[val]) {
      setDistrictsList(Object.keys(BANGLADESH_DATA[val].districts));
    } else {
      setDistrictsList([]);
    }
    setAreasList([]);
  };

  const handleDistrictChange = (e) => {
    const val = e.target.value;
    setDistrict(val);
    setArea('');
    if (division && val && BANGLADESH_DATA[division]?.districts[val]) {
      setAreasList(BANGLADESH_DATA[division].districts[val]);
    } else {
      setAreasList([]);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (bloodGroup) params.set('bloodGroup', bloodGroup);
    if (division) params.set('division', division);
    if (district) params.set('district', district);
    if (area) params.set('area', area);
    router.push(`/search?${params.toString()}`);
  };

  return (
    <section className={styles.hero}>
      {/* Floating decorative drops */}
      <div className={styles.floatingDrops}>
        <span className={`${styles.drop} ${styles.drop1}`} />
        <span className={`${styles.drop} ${styles.drop2}`} />
        <span className={`${styles.drop} ${styles.drop3}`} />
        <span className={`${styles.drop} ${styles.drop4}`} />
        <span className={`${styles.drop} ${styles.drop5}`} />
      </div>

      <div className={styles.heroInner}>
        {/* Left content */}
        <div className={styles.heroContent}>
          <div className={styles.badge}>
            <span className={styles.badgeDot} />
            Saving lives across Bangladesh
          </div>

          <h1 className={styles.heading}>
            <span className={styles.headingLine1}>Every Drop Counts.</span>
            <span className={styles.headingLine2}>Save a Life Today.</span>
          </h1>

          <p className={styles.subtext}>
            Connecting blood donors with those in need across Bangladesh.
            No sign-up required — find a donor in seconds.
          </p>

          {/* Inline Search Bar */}
          <form className={styles.searchBar} onSubmit={handleSearch}>
            {/* Blood Group */}
            <div className={styles.selectWrapper}>
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                className={styles.select}
                aria-label="Blood Group"
              >
                <option value="">Blood Group</option>
                {BLOOD_GROUPS.map((group) => (
                  <option key={group} value={group}>
                    {group}
                  </option>
                ))}
              </select>
              <span className={styles.selectIcon}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
            </div>

            {/* Division */}
            <div className={styles.selectWrapper}>
              <select
                value={division}
                onChange={handleDivisionChange}
                className={styles.select}
                aria-label="Division"
              >
                <option value="">Division</option>
                {Object.keys(BANGLADESH_DATA).map((div) => (
                  <option key={div} value={div}>
                    {div}
                  </option>
                ))}
              </select>
              <span className={styles.selectIcon}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
            </div>

            {/* District */}
            <div className={styles.selectWrapper}>
              <select
                value={district}
                onChange={handleDistrictChange}
                className={styles.select}
                disabled={!division}
                aria-label="District"
              >
                <option value="">District</option>
                {districtsList.map((dist) => (
                  <option key={dist} value={dist}>
                    {dist}
                  </option>
                ))}
              </select>
              <span className={styles.selectIcon}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
            </div>

            {/* Area */}
            <div className={styles.selectWrapper}>
              <select
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className={styles.select}
                disabled={!district}
                aria-label="Area"
              >
                <option value="">Area</option>
                {areasList.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
              <span className={styles.selectIcon}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
            </div>

            <button type="submit" className={`btn btn-primary btn-lg ${styles.searchBtn}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              Find Donors
            </button>
          </form>

          <div className={styles.heroMeta}>
            <div className={styles.metaItem}>
              <span className={styles.metaIcon}>✅</span>
              <span>100% Free</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaIcon}>⚡</span>
              <span>Instant Results</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaIcon}>🔒</span>
              <span>No Sign-up</span>
            </div>
          </div>
        </div>

        {/* Right decorative illustration */}
        <div className={styles.heroVisual}>
          <div className={styles.bloodDropLarge}>
            <div className={styles.dropInner}>
              <Image
                src="/images/logo.png"
                alt="RedpulseBD Logo"
                fill
                priority
                className={styles.dropImage}
              />
              <span className={styles.dropPulse} />
              <span className={styles.dropPulse2} />
            </div>
          </div>
          {/* Orbiting dots */}
          <div className={styles.orbit}>
            <span className={styles.orbitDot} style={{ '--delay': '0s', '--offset': '0deg' }}>A+</span>
            <span className={styles.orbitDot} style={{ '--delay': '1.5s', '--offset': '90deg' }}>B-</span>
            <span className={styles.orbitDot} style={{ '--delay': '3s', '--offset': '180deg' }}>O+</span>
            <span className={styles.orbitDot} style={{ '--delay': '4.5s', '--offset': '270deg' }}>AB</span>
          </div>
        </div>
      </div>
    </section>
  );
}
