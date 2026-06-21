import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { BLOOD_GROUPS, DHAKA_AREAS, COMPATIBILITY } from '@/data/seedDonors';

/**
 * Check if a donor is eligible to donate (last donation > 90 days ago)
 */
export function isDonorEligible(lastDonationDate) {
  if (!lastDonationDate) return true;
  const last = new Date(lastDonationDate);
  const now = new Date();
  const diffDays = Math.floor((now - last) / (1000 * 60 * 60 * 24));
  return diffDays >= 90;
}

/**
 * Format the days since last donation
 */
export function daysSinceLastDonation(lastDonationDate) {
  if (!lastDonationDate) return null;
  const last = new Date(lastDonationDate);
  const now = new Date();
  return Math.floor((now - last) / (1000 * 60 * 60 * 24));
}

/**
 * Get days until eligible to donate again
 */
export function daysUntilEligible(lastDonationDate) {
  if (!lastDonationDate) return 0;
  const last = new Date(lastDonationDate);
  const now = new Date();
  const diffDays = Math.floor((now - last) / (1000 * 60 * 60 * 24));
  return Math.max(0, 90 - diffDays);
}

/**
 * Get filtered donors based on search criteria from Firestore
 * @param {Object} filters - { bloodGroup, area, availableOnly, eligibleOnly }
 * @returns {Array} Filtered donor list
 */
export async function getDonors(filters = {}) {
  let q = collection(db, 'donors');
  const queryConstraints = [];

  // Filter by blood group
  if (filters.bloodGroup && filters.bloodGroup !== 'all') {
    queryConstraints.push(where('bloodGroup', '==', filters.bloodGroup));
  }

  // Filter by area
  if (filters.area && filters.area !== 'all') {
    queryConstraints.push(where('area', '==', filters.area));
  }

  // Filter by availability
  if (filters.availableOnly) {
    queryConstraints.push(where('available', '==', true));
  }

  if (queryConstraints.length > 0) {
    q = query(q, ...queryConstraints);
  }

  try {
    const querySnapshot = await getDocs(q);
    let results = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Post-query filter for eligibility (since it requires date computation)
    if (filters.eligibleOnly) {
      results = results.filter(d => isDonorEligible(d.lastDonation));
    }

    return results;
  } catch (error) {
    console.error("Error fetching donors:", error);
    return [];
  }
}

/**
 * Get donor statistics for the stats counter from Firestore
 */
export async function getDonorStats() {
  try {
    const querySnapshot = await getDocs(collection(db, 'donors'));
    const donors = querySnapshot.docs.map(doc => doc.data());
    
    const totalDonors = donors.length;
    const totalDonations = donors.reduce((sum, d) => sum + (d.totalDonations || 0), 0);
    const availableDonors = donors.filter(d => d.available).length;
    const areasCount = new Set(donors.map(d => d.area)).size;

    return {
      totalDonors,
      totalDonations,
      availableDonors,
      areasCount,
    };
  } catch (error) {
    console.error("Error fetching stats:", error);
    return { totalDonors: 0, totalDonations: 0, availableDonors: 0, areasCount: 0 };
  }
}

/**
 * Get compatible donors for a given blood group from Firestore
 */
export async function getCompatibleDonors(bloodGroup) {
  const compatibility = COMPATIBILITY[bloodGroup];
  if (!compatibility) return [];

  const compatibleGroups = compatibility.canReceiveFrom;
  
  try {
    // Firestore "in" queries are limited to 10 elements, but we have 8 max blood groups
    const q = query(
      collection(db, 'donors'), 
      where('bloodGroup', 'in', compatibleGroups),
      where('available', '==', true)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching compatible donors:", error);
    return [];
  }
}

export { BLOOD_GROUPS, DHAKA_AREAS, COMPATIBILITY };
