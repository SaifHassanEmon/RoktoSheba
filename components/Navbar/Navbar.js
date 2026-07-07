'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import ThemeToggle from '@/components/ThemeToggle/ThemeToggle';
import styles from './Navbar.module.css';
import { useAuth } from '@/context/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, isAdmin, isModerator } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setMobileOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setMobileOpen(false);
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <header className={`${styles.navbar} ${scrolled ? styles.scrolled : ''}`}>
      <nav className={styles.navInner}>
        {/* Logo */}
        <Link href="/" className={styles.logo} onClick={() => setMobileOpen(false)}>
          <Image
            src="/images/logo.png"
            alt="RedpulseBD Logo"
            width={20}
            height={30}
            className={styles.logoIcon}
            priority
          />
          <span className={styles.logoText}>RedpulseBD</span>
        </Link>

        {/* Desktop Nav Links */}
        <ul className={styles.navLinks}>
          <li>
            <Link href="/" className={styles.navLink}>Home</Link>
          </li>
          <li>
            <Link href="/search" className={styles.navLink}>Find Donors</Link>
          </li>
          <li>
            <Link href="/search?request=true" className={styles.navLink}>Request Blood</Link>
          </li>
          <li>
            <Link href="/blood-banks" className={styles.navLink}>Blood Banks</Link>
          </li>
        </ul>

        {/* Desktop Right Section */}
        <div className={styles.navRight}>
          <ThemeToggle />
          {user ? (
            <>
              {isModerator && (
                <Link href="/moderator" className={styles.navLink}>
                  Moderator Desk
                </Link>
              )}
              {isAdmin ? (
                <Link href="/admin/dashboard" className={`${styles.navLink} ${styles.adminLink}`}>
                  Admin Dashboard <span className={styles.adminBadge}>Admin</span>
                </Link>
              ) : (
                <Link href="/dashboard" className={styles.navLink}>Dashboard</Link>
              )}
              <button onClick={handleLogout} className="btn btn-ghost">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className={styles.navLink}>Login</Link>
              <Link href="/register" className={`btn btn-primary ${styles.ctaBtn}`}>
                Become a Donor
              </Link>
            </>
          )}
        </div>

        {/* Hamburger Button */}
        <button
          className={`${styles.hamburger} ${mobileOpen ? styles.hamburgerActive : ''}`}
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
          aria-expanded={mobileOpen}
        >
          <span className={styles.hamburgerLine} />
          <span className={styles.hamburgerLine} />
          <span className={styles.hamburgerLine} />
        </button>
      </nav>

      {/* Mobile Menu Overlay */}
      <div
        className={`${styles.mobileOverlay} ${mobileOpen ? styles.mobileOverlayActive : ''}`}
        onClick={() => setMobileOpen(false)}
      />

      {/* Mobile Menu */}
      <div className={`${styles.mobileMenu} ${mobileOpen ? styles.mobileMenuActive : ''}`}>
        <ul className={styles.mobileLinks}>
          <li>
            <Link href="/" className={styles.mobileLink} onClick={() => setMobileOpen(false)}>
              Home
            </Link>
          </li>
          <li>
            <Link href="/search" className={styles.mobileLink} onClick={() => setMobileOpen(false)}>
              Find Donors
            </Link>
          </li>
          <li>
            <Link href="/search?request=true" className={styles.mobileLink} onClick={() => setMobileOpen(false)}>
              Request Blood
            </Link>
          </li>
          <li>
            <Link href="/blood-banks" className={styles.mobileLink} onClick={() => setMobileOpen(false)}>
              Blood Banks
            </Link>
          </li>
        </ul>
        <div className={styles.mobileActions}>
          <ThemeToggle />
          {user ? (
            <>
              {isModerator && (
                <Link
                  href="/moderator"
                  className={`btn btn-secondary ${styles.mobileCta}`}
                  onClick={() => setMobileOpen(false)}
                >
                  Moderator Desk
                </Link>
              )}
              {isAdmin ? (
                <Link
                  href="/admin/dashboard"
                  className={`btn btn-secondary ${styles.mobileCta} ${styles.mobileAdminCta}`}
                  onClick={() => setMobileOpen(false)}
                >
                  Admin Dashboard
                </Link>
              ) : (
                <Link
                  href="/dashboard"
                  className={`btn btn-secondary ${styles.mobileCta}`}
                  onClick={() => setMobileOpen(false)}
                >
                  Dashboard
                </Link>
              )}
              <button
                onClick={handleLogout}
                className={`btn btn-ghost ${styles.mobileCta}`}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className={`btn btn-secondary ${styles.mobileCta}`}
                onClick={() => setMobileOpen(false)}
              >
                Login
              </Link>
              <Link
                href="/register"
                className={`btn btn-primary ${styles.mobileCta}`}
                onClick={() => setMobileOpen(false)}
              >
                Become a Donor
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
