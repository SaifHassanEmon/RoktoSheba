'use client';

import BloodGroupBadge from '@/components/BloodGroupBadge/BloodGroupBadge';
import { isDonorEligible, daysSinceLastDonation, daysUntilEligible } from '@/lib/donors';
import styles from './DonorCard.module.css';

export default function DonorCard({ donor }) {
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

      {/* Eligibility badge */}
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

      {/* Action buttons */}
      <div className={styles.actions}>
        <a href={`tel:${phone}`} className={styles.callBtn}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
          Call
        </a>
        <a
          href={`https://wa.me/${phone?.replace(/[^0-9]/g, '')}`}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.messageBtn}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
          Message
        </a>
      </div>
    </div>
  );
}
