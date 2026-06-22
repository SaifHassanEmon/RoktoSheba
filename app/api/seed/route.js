// Script to seed Firestore with the mock donor data
// Run this with Node.js directly after compiling, or as an API route.
// For simplicity in Next.js, we will create it as an API route that can be triggered once.

import { db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import seedDonors from '@/data/seedDonors';

export async function POST(request) {
  try {
    let count = 0;
    for (const donor of seedDonors) {
      // Use the donor.id as the document ID
      const donorRef = doc(db, 'donors', donor.id);
      await setDoc(donorRef, {
        name: donor.name,
        bloodGroup: donor.bloodGroup,
        division: donor.division || 'Dhaka', // Default to Dhaka for seed mock data
        district: donor.district || 'Dhaka',
        area: donor.area,
        areas: donor.areas || [donor.area],
        phone: donor.phone,
        lastDonation: donor.lastDonation,
        available: donor.available,
        totalDonations: donor.totalDonations,
        createdAt: new Date(),
      });
      count++;
    }
    
    return new Response(JSON.stringify({ success: true, count, message: 'Seeded successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error seeding data:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
