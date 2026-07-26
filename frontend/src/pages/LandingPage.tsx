import LandingHeader from '../components/landing/LandingHeader'
import HeroSection from '../components/landing/HeroSection'
import BenefitsBentoGrid from '../components/landing/BenefitsBentoGrid'
import FinalCta from '../components/landing/FinalCta'
import LandingFooter from '../components/landing/LandingFooter'

export default function LandingPage() {
  return (
    <div className="bg-background text-on-surface font-body-md overflow-x-hidden" id="top">
      <LandingHeader />
      <main className="pt-24">
        <HeroSection />
        <BenefitsBentoGrid />
        <FinalCta />
      </main>
      <LandingFooter />
    </div>
  )
}
