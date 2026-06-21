import { Inter, Outfit } from 'next/font/google';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const outfit = Outfit({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-outfit',
});

export const metadata = {
  title: 'RoktoSeba — Blood Donation Platform | Dhaka, Bangladesh',
  description: 'Connect with blood donors across Dhaka instantly. No sign-up required for recipients. Find matching donors, post emergency blood requests, and save lives.',
  keywords: 'blood donation, Dhaka, Bangladesh, blood donor, blood bank, emergency blood, rokto, রক্তসেবা',
  openGraph: {
    title: 'RoktoSeba — Every Drop Counts. Save a Life Today.',
    description: 'Connect with blood donors across Dhaka instantly. No sign-up required.',
    type: 'website',
    locale: 'en_BD',
    siteName: 'RoktoSeba',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`} suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🩸</text></svg>" />
      </head>
      <body className={inter.className}>
        <ThemeProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
