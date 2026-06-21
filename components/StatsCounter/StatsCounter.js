'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { getDonorStats } from '@/lib/donors';
import styles from './StatsCounter.module.css';

const baseStats = [
  {
    id: 'total',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    label: 'Total Donors',
    suffix: '+',
  },
  {
    id: 'lives',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
    ),
    label: 'Lives Saved',
    suffix: '+',
  },
  {
    id: 'areas',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
        <circle cx="12" cy="10" r="3"/>
      </svg>
    ),
    label: 'Active Areas',
    suffix: '',
  },
  {
    id: 'available',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
        <polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
    ),
    label: 'Available Now',
    suffix: '',
  },
];

function AnimatedNumber({ target, suffix, shouldAnimate }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!shouldAnimate || target === undefined) return;
    
    // If target is 0, just set to 0 immediately
    if (target === 0) {
      setCount(0);
      return;
    }

    let current = 0;
    const duration = 2000;
    const steps = 60;
    const increment = target / steps;
    const stepTime = duration / steps;

    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [shouldAnimate, target]);

  return (
    <span className={styles.number}>
      {count.toLocaleString()}{suffix}
    </span>
  );
}

export default function StatsCounter() {
  const [isVisible, setIsVisible] = useState(false);
  const [statsData, setStatsData] = useState(null);
  const sectionRef = useRef(null);

  useEffect(() => {
    async function loadStats() {
      const data = await getDonorStats();
      setStatsData(data);
    }
    loadStats();
  }, []);

  const handleIntersect = useCallback((entries) => {
    const [entry] = entries;
    if (entry.isIntersecting) {
      setIsVisible(true);
    }
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(handleIntersect, {
      threshold: 0.2,
    });

    const current = sectionRef.current;
    if (current) {
      observer.observe(current);
    }

    return () => {
      if (current) {
        observer.unobserve(current);
      }
    };
  }, [handleIntersect]);

  const getValue = (id) => {
    if (!statsData) return 0;
    switch(id) {
      case 'total': return statsData.totalDonors;
      case 'lives': return statsData.totalDonations * 3;
      case 'areas': return statsData.areasCount;
      case 'available': return statsData.availableDonors;
      default: return 0;
    }
  };

  return (
    <section className={styles.section} ref={sectionRef}>
      <div className={styles.container}>
        <div className={styles.grid}>
          {baseStats.map((stat, index) => (
            <div
              className={styles.card}
              key={stat.label}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={styles.iconWrapper}>
                {stat.icon}
              </div>
              <AnimatedNumber
                target={getValue(stat.id)}
                suffix={stat.suffix}
                shouldAnimate={isVisible && statsData !== null}
              />
              <span className={styles.label}>{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
