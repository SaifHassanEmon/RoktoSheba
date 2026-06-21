// Mock donor data for Dhaka, Bangladesh
// This will be loaded into Firestore as seed data

const seedDonors = [
  { id: 'd1', name: 'Rafiul Islam', bloodGroup: 'B+', area: 'Dhanmondi', district: 'Dhaka', phone: '+8801712345001', lastDonation: '2026-03-10', available: true, totalDonations: 8 },
  { id: 'd2', name: 'Tasnim Akter', bloodGroup: 'A+', area: 'Gulshan', district: 'Dhaka', phone: '+8801812345002', lastDonation: '2026-05-15', available: true, totalDonations: 3 },
  { id: 'd3', name: 'Mehedi Hasan', bloodGroup: 'O+', area: 'Mirpur', district: 'Dhaka', phone: '+8801912345003', lastDonation: '2026-01-20', available: true, totalDonations: 12 },
  { id: 'd4', name: 'Fatema Begum', bloodGroup: 'AB+', area: 'Uttara', district: 'Dhaka', phone: '+8801612345004', lastDonation: '2026-04-05', available: false, totalDonations: 5 },
  { id: 'd5', name: 'Kamal Uddin', bloodGroup: 'B-', area: 'Mohammadpur', district: 'Dhaka', phone: '+8801512345005', lastDonation: '2025-12-01', available: true, totalDonations: 15 },
  { id: 'd6', name: 'Nusrat Jahan', bloodGroup: 'A-', area: 'Banani', district: 'Dhaka', phone: '+8801712345006', lastDonation: '2026-06-01', available: true, totalDonations: 2 },
  { id: 'd7', name: 'Shakib Al Hasan', bloodGroup: 'O-', area: 'Motijheel', district: 'Dhaka', phone: '+8801812345007', lastDonation: '2026-02-14', available: true, totalDonations: 20 },
  { id: 'd8', name: 'Rabeya Khatun', bloodGroup: 'AB-', area: 'Tejgaon', district: 'Dhaka', phone: '+8801912345008', lastDonation: '2026-05-25', available: true, totalDonations: 1 },
  { id: 'd9', name: 'Imran Hossain', bloodGroup: 'A+', area: 'Badda', district: 'Dhaka', phone: '+8801612345009', lastDonation: '2026-03-28', available: true, totalDonations: 7 },
  { id: 'd10', name: 'Sumaiya Rahman', bloodGroup: 'B+', area: 'Bashundhara', district: 'Dhaka', phone: '+8801512345010', lastDonation: '2026-04-18', available: true, totalDonations: 4 },
  { id: 'd11', name: 'Tanvir Ahmed', bloodGroup: 'O+', area: 'Dhanmondi', district: 'Dhaka', phone: '+8801712345011', lastDonation: '2026-01-05', available: true, totalDonations: 9 },
  { id: 'd12', name: 'Mithila Farjana', bloodGroup: 'A+', area: 'Uttara', district: 'Dhaka', phone: '+8801812345012', lastDonation: '2026-05-02', available: false, totalDonations: 6 },
  { id: 'd13', name: 'Arif Mahmud', bloodGroup: 'B-', area: 'Gulshan', district: 'Dhaka', phone: '+8801912345013', lastDonation: '2025-11-15', available: true, totalDonations: 18 },
  { id: 'd14', name: 'Sadia Islam', bloodGroup: 'O+', area: 'Mirpur', district: 'Dhaka', phone: '+8801612345014', lastDonation: '2026-06-10', available: true, totalDonations: 2 },
  { id: 'd15', name: 'Rahim Uddin', bloodGroup: 'AB+', area: 'Mohammadpur', district: 'Dhaka', phone: '+8801512345015', lastDonation: '2026-03-01', available: true, totalDonations: 11 },
  { id: 'd16', name: 'Anika Tabassum', bloodGroup: 'A-', area: 'Banani', district: 'Dhaka', phone: '+8801712345016', lastDonation: '2026-02-20', available: true, totalDonations: 3 },
  { id: 'd17', name: 'Farhan Chowdhury', bloodGroup: 'B+', area: 'Tejgaon', district: 'Dhaka', phone: '+8801812345017', lastDonation: '2026-04-30', available: true, totalDonations: 10 },
  { id: 'd18', name: 'Jannatul Ferdous', bloodGroup: 'O-', area: 'Badda', district: 'Dhaka', phone: '+8801912345018', lastDonation: '2026-01-25', available: true, totalDonations: 6 },
  { id: 'd19', name: 'Mahfuz Alam', bloodGroup: 'AB-', area: 'Bashundhara', district: 'Dhaka', phone: '+8801612345019', lastDonation: '2026-05-10', available: false, totalDonations: 4 },
  { id: 'd20', name: 'Razia Sultana', bloodGroup: 'A+', area: 'Motijheel', district: 'Dhaka', phone: '+8801512345020', lastDonation: '2026-03-15', available: true, totalDonations: 8 },
  { id: 'd21', name: 'Nasir Uddin', bloodGroup: 'B+', area: 'Dhanmondi', district: 'Dhaka', phone: '+8801712345021', lastDonation: '2026-02-08', available: true, totalDonations: 14 },
  { id: 'd22', name: 'Habiba Akter', bloodGroup: 'O+', area: 'Gulshan', district: 'Dhaka', phone: '+8801812345022', lastDonation: '2026-06-05', available: true, totalDonations: 1 },
  { id: 'd23', name: 'Jubayer Rahman', bloodGroup: 'A-', area: 'Mirpur', district: 'Dhaka', phone: '+8801912345023', lastDonation: '2025-12-20', available: true, totalDonations: 7 },
  { id: 'd24', name: 'Meherun Nesa', bloodGroup: 'B-', area: 'Uttara', district: 'Dhaka', phone: '+8801612345024', lastDonation: '2026-04-12', available: true, totalDonations: 5 },
  { id: 'd25', name: 'Shahin Alam', bloodGroup: 'AB+', area: 'Mohammadpur', district: 'Dhaka', phone: '+8801512345025', lastDonation: '2026-01-30', available: true, totalDonations: 9 },
  { id: 'd26', name: 'Tamanna Haque', bloodGroup: 'O+', area: 'Wari', district: 'Dhaka', phone: '+8801712345026', lastDonation: '2026-05-20', available: true, totalDonations: 3 },
  { id: 'd27', name: 'Shafiqul Islam', bloodGroup: 'A+', area: 'Lalbagh', district: 'Dhaka', phone: '+8801812345027', lastDonation: '2026-03-05', available: true, totalDonations: 16 },
  { id: 'd28', name: 'Nazmul Haque', bloodGroup: 'B+', area: 'Khilgaon', district: 'Dhaka', phone: '+8801912345028', lastDonation: '2026-04-22', available: false, totalDonations: 2 },
  { id: 'd29', name: 'Sharmin Sultana', bloodGroup: 'O-', area: 'Rampura', district: 'Dhaka', phone: '+8801612345029', lastDonation: '2026-02-28', available: true, totalDonations: 11 },
  { id: 'd30', name: 'Kamrul Hassan', bloodGroup: 'AB+', area: 'Jatrabari', district: 'Dhaka', phone: '+8801512345030', lastDonation: '2026-06-15', available: true, totalDonations: 5 },
  { id: 'd31', name: 'Farzana Yasmin', bloodGroup: 'A+', area: 'Shyamoli', district: 'Dhaka', phone: '+8801712345031', lastDonation: '2026-01-12', available: true, totalDonations: 8 },
  { id: 'd32', name: 'Aminul Haque', bloodGroup: 'B-', area: 'Farmgate', district: 'Dhaka', phone: '+8801812345032', lastDonation: '2025-10-30', available: true, totalDonations: 22 },
];

// Dhaka areas list
export const DHAKA_AREAS = [
  'Badda', 'Banani', 'Bashundhara', 'Dhanmondi', 'Farmgate',
  'Gulshan', 'Jatrabari', 'Khilgaon', 'Lalbagh', 'Mirpur',
  'Mohammadpur', 'Motijheel', 'Rampura', 'Shyamoli', 'Tejgaon',
  'Uttara', 'Wari'
];

// Blood groups list
export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

// Blood group compatibility chart
export const COMPATIBILITY = {
  'O-':  { canDonateTo: ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'], canReceiveFrom: ['O-'] },
  'O+':  { canDonateTo: ['O+', 'A+', 'B+', 'AB+'], canReceiveFrom: ['O-', 'O+'] },
  'A-':  { canDonateTo: ['A-', 'A+', 'AB-', 'AB+'], canReceiveFrom: ['O-', 'A-'] },
  'A+':  { canDonateTo: ['A+', 'AB+'], canReceiveFrom: ['O-', 'O+', 'A-', 'A+'] },
  'B-':  { canDonateTo: ['B-', 'B+', 'AB-', 'AB+'], canReceiveFrom: ['O-', 'B-'] },
  'B+':  { canDonateTo: ['B+', 'AB+'], canReceiveFrom: ['O-', 'O+', 'B-', 'B+'] },
  'AB-': { canDonateTo: ['AB-', 'AB+'], canReceiveFrom: ['O-', 'A-', 'B-', 'AB-'] },
  'AB+': { canDonateTo: ['AB+'], canReceiveFrom: ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'] },
};

export default seedDonors;
