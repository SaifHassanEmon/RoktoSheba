'use client';

import BloodGroupBadge from '@/components/BloodGroupBadge/BloodGroupBadge';
import { isDonorEligible, daysSinceLastDonation, daysUntilEligible } from '@/lib/donors';
import styles from './DonorCard.module.css';

export default function DonorCard({ donor, onRequestBlood }) {
  const {
    name,
    bloodGroup,
    area,
    phone,
    lastDonation,
    available,
    totalDonations,
  } = donor;

  const eligible = isDonorEligible(lastDonation);
  const daysSince = daysSinceLastDonation(lastDonation);
  const daysLeft = daysUntilEligible(lastDonation);
  const isAvailable = available && eligible;

  return (
    <div className={styles.card}>
      {/* Top section */}
      <div className={styles.top}>
        <BloodGroupBadge group={bloodGroup} size="lg" />
        <div className={styles.topInfo}>
          <h3 className={styles.name}>{name}</h3>
          <span className={styles.area}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            {area}
          </span>
        </div>
      </div>

      {/* Stats row */}
      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statValue}>{totalDonations}</span>
          <span className={styles.statLabel}>donations</span>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.stat}>
          <span className={styles.statValue}>{daysSince ?? '—'}</span>
          <span className={styles.statLabel}>days ago</span>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.stat}>
          <span
            className={`${styles.availDot} ${
              isAvailable ? styles.dotGreen : styles.dotRed
            }`}
          />
          <span className={styles.statLabel}>
            {isAvailable ? 'Available' : 'Unavailable'}
          </span>
        </div>
      </div>

      {/* Eligibility status */}
      <div className={styles.eligibility}>
        {eligible ? (
          <span className={styles.eligibleBadge}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Eligible to Donate
          </span>
        ) : (
          <span className={styles.notEligibleBadge}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            Eligible in {daysLeft} days
          </span>
        )}
      </div>

      {/* Contact hidden message */}
      <div className={styles.contactNotice}>
        🔒 Contact number hidden for donor privacy
      </div>

      {/* Action buttons */}
      <div className={styles.actions}>
        <button
          onClick={() => onRequestBlood && onRequestBlood(donor)}
          className={styles.requestBtn}
        >
          🩸 Request Blood
        </button>
      </div>
    </div>
  );
}
