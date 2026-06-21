import Navbar from '@/components/Navbar/Navbar';
import EmergencyTicker from '@/components/EmergencyTicker/EmergencyTicker';
import Hero from '@/components/Hero/Hero';
import StatsCounter from '@/components/StatsCounter/StatsCounter';
import HowItWorks from '@/components/HowItWorks/HowItWorks';
import Testimonials from '@/components/Testimonials/Testimonials';
import Footer from '@/components/Footer/Footer';

export default function Home() {
  return (
    <>
      <EmergencyTicker />
      <Navbar />
      <main>
        <Hero />
        <StatsCounter />
        <HowItWorks />
        <Testimonials />
      </main>
      <Footer />
    </>
  );
}
