import dynamic from 'next/dynamic'
import { Nav } from '@/components/landing/nav'
import { Hero } from '@/components/landing/hero'
import { LogosBar } from '@/components/landing/logos-bar'

// Lazy-load below-fold sections — split into separate JS chunks
const Features    = dynamic(() => import('@/components/landing/features').then(m => ({ default: m.Features })))
const HowItWorks  = dynamic(() => import('@/components/landing/how-it-works').then(m => ({ default: m.HowItWorks })))
const Testimonials = dynamic(() => import('@/components/landing/testimonials').then(m => ({ default: m.Testimonials })))
const CtaFinal    = dynamic(() => import('@/components/landing/cta-final').then(m => ({ default: m.CtaFinal })))
const Footer      = dynamic(() => import('@/components/landing/footer').then(m => ({ default: m.Footer })))

export default function LandingPage() {
  return (
    <>
      <Nav />
      <Hero />
      <LogosBar />
      <Features />
      <HowItWorks />
      <Testimonials />
      <CtaFinal />
      <Footer />
    </>
  )
}
