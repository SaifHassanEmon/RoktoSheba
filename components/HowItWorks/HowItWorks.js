'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './HowItWorks.module.css';

const steps = [
  {
    number: '01',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/>
        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
    ),
    title: 'Search',
    description: 'Find matching blood donors in your area of Dhaka instantly.',
  },
  {
    number: '02',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
      </svg>
    ),
    title: 'Connect',
    description: 'Call or message the donor directly. No middleman, no delays.',
  },
  {
    number: '03',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
      </svg>
    ),
    title: 'Donate',
    description: 'Meet at the hospital and donate. Together, save a life.',
  },
];

export default function HowItWorks() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.15 }
    );

    const current = sectionRef.current;
    if (current) observer.observe(current);
    return () => {
      if (current) observer.unobserve(current);
    };
  }, []);

  return (
    <section className={styles.section} ref={sectionRef}>
      <div className={styles.container}>
        <div className={styles.header}>
          <span className={styles.sectionLabel}>HOW IT WORKS</span>
          <h2 className={styles.sectionTitle}>Three Simple Steps to Save a Life</h2>
          <p className={styles.sectionDesc}>
            Finding a blood donor has never been easier. Our platform connects you directly with willing donors in Dhaka.
          </p>
        </div>

        <div className={styles.stepsGrid}>
          {steps.map((step, index) => (
            <div
              key={step.number}
              className={`${styles.stepCard} ${isVisible ? styles.stepVisible : ''}`}
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className={styles.connector}>
                  <svg width="100%" height="2" className={styles.connectorLine}>
                    <line x1="0" y1="1" x2="100%" y2="1" stroke="var(--border)" strokeWidth="2" strokeDasharray="6 4"/>
                  </svg>
                  <svg className={styles.connectorArrow} width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M4 2L8 6L4 10" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              )}

              {/* Number badge */}
              <div className={styles.numberBadge}>
                {step.number}
              </div>

              {/* Icon circle */}
              <div className={styles.iconCircle}>
                {step.icon}
              </div>

              <h3 className={styles.stepTitle}>{step.title}</h3>
              <p className={styles.stepDesc}>{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
