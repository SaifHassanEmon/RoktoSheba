'use client';

import styles from './EmergencyTicker.module.css';

const emergencyRequests = [
  'URGENT: O- blood needed at Dhaka Medical College — Contact: 01712-XXXXXX',
  'CRITICAL: AB+ required at Square Hospital, Panthapath — 2 bags needed',
  'EMERGENCY: B- blood needed at BIRDEM Hospital, Shahbag — Contact ASAP',
  'URGENT: A+ platelet donor needed at United Hospital, Gulshan',
];

export default function EmergencyTicker() {
  return (
    <div className={styles.ticker}>
      <div className={styles.tickerTrack}>
        {[...emergencyRequests, ...emergencyRequests].map((request, index) => (
          <div className={styles.tickerItem} key={index}>
            <span className={styles.pulseDot} />
            <span className={styles.tickerText}>{request}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
