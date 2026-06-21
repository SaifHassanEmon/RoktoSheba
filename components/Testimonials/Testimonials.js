'use client';

import { useState, useEffect, useCallback } from 'react';
import styles from './Testimonials.module.css';

const testimonials = [
  {
    id: 1,
    quote: 'I donated blood for the first time through RoktoSeba. The process was so smooth!',
    name: 'Aminul Islam',
    bloodGroup: 'O+',
    location: 'Dhanmondi',
    stat: '3 lives saved',
  },
  {
    id: 2,
    quote: 'When my mother needed AB- blood urgently, I found a donor within 15 minutes.',
    name: 'Sabrina Akter',
    bloodGroup: 'AB-',
    location: 'Gulshan',
    stat: 'Recipient',
  },
  {
    id: 3,
    quote: 'I have been donating regularly for 2 years. This platform makes it effortless.',
    name: 'Jahidul Haque',
    bloodGroup: 'B+',
    location: 'Mirpur',
    stat: '12 lives saved',
  },
  {
    id: 4,
    quote: 'The Messenger bot helped me find O+ blood at 2 AM. Truly life-saving!',
    name: 'Nazia Begum',
    bloodGroup: 'O+',
    location: 'Uttara',
    stat: 'Recipient',
  },
];

export default function Testimonials() {
  const [active, setActive] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const next = useCallback(() => {
    setActive((prev) => (prev + 1) % testimonials.length);
  }, []);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [isPaused, next]);

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        {/* Section header */}
        <div className={styles.header}>
          <span className={styles.label}>TESTIMONIALS</span>
          <h2 className={styles.heading}>Stories That Inspire</h2>
        </div>

        {/* Carousel viewport */}
        <div
          className={styles.carousel}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div
            className={styles.track}
            style={{ transform: `translateX(-${active * 100}%)` }}
          >
            {testimonials.map((t) => (
              <div className={styles.slide} key={t.id}>
                <div className={styles.card}>
                  {/* Decorative quotation mark */}
                  <span className={styles.quoteDecor} aria-hidden="true">"</span>

                  <blockquote className={styles.quote}>{t.quote}</blockquote>

                  <div className={styles.meta}>
                    {/* Avatar placeholder */}
                    <div className={styles.avatar}>
                      {t.name.charAt(0)}
                    </div>

                    <div className={styles.info}>
                      <span className={styles.name}>{t.name}</span>
                      <span className={styles.location}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                        {t.location}
                      </span>
                    </div>

                    <span className={styles.bloodBadge}>{t.bloodGroup}</span>
                  </div>

                  <div className={styles.stat}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                    {t.stat}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation dots */}
        <div className={styles.dots}>
          {testimonials.map((_, i) => (
            <button
              key={i}
              className={`${styles.dot} ${i === active ? styles.dotActive : ''}`}
              onClick={() => setActive(i)}
              aria-label={`Go to testimonial ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
