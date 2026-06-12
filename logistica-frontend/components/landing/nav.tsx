'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { MagneticButton } from './magnetic-button'

const links = ['Soluciones', 'Proceso', 'Clientes', 'Precios']
const linkHrefs = ['#soluciones', '#proceso', '#clientes', '#demo']

export function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const linkColor = scrolled ? 'text-lw-text hover:text-lw-primary' : 'text-white/80 hover:text-white'

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/92 backdrop-blur-2xl border-b border-lw-primary/8 shadow-sm'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 cursor-pointer">
          <div className="w-8 h-8 rounded-lg bg-lw-primary flex items-center justify-center flex-shrink-0">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M8 1L14.5 4.5v7L8 15L1.5 11.5v-7L8 1z" fill="rgba(255,255,255,0.2)" />
              <path d="M8 1L14.5 4.5L8 8L1.5 4.5L8 1z" fill="white" />
              <path d="M14.5 4.5V11.5L8 15V8L14.5 4.5z" fill="rgba(255,255,255,0.55)" />
            </svg>
          </div>
          <span
            className={`text-lg font-semibold font-heading transition-colors duration-300 ${
              scrolled ? 'text-lw-text' : 'text-white'
            }`}
          >
            LogísticaWeb
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          {links.map((item, i) => (
            <a
              key={item}
              href={linkHrefs[i]}
              className={`text-sm font-medium cursor-pointer transition-colors duration-200 no-underline ${linkColor}`}
            >
              {item}
            </a>
          ))}
        </div>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/login"
            className={`text-sm font-medium cursor-pointer transition-colors duration-200 no-underline ${linkColor}`}
          >
            Iniciar sesión
          </Link>
          <MagneticButton
            href="#demo"
            className="text-sm font-semibold cursor-pointer px-4 py-2 rounded-lg
                       bg-lw-cta text-white hover:opacity-90 transition-opacity duration-200
                       no-underline"
          >
            Solicitar demo
          </MagneticButton>
        </div>

        {/* Mobile hamburger */}
        <button
          aria-label="Abrir menú"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen(!mobileOpen)}
          className={`md:hidden cursor-pointer p-2 rounded-lg transition-colors duration-200 ${
            scrolled ? 'text-lw-text' : 'text-white'
          }`}
        >
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            {mobileOpen ? (
              <>
                <line x1="4" y1="4" x2="18" y2="18" />
                <line x1="18" y1="4" x2="4" y2="18" />
              </>
            ) : (
              <>
                <line x1="3" y1="6" x2="19" y2="6" />
                <line x1="3" y1="11" x2="19" y2="11" />
                <line x1="3" y1="16" x2="19" y2="16" />
              </>
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="md:hidden bg-white/97 backdrop-blur-2xl border-b border-lw-primary/10 overflow-hidden"
          >
            <div className="px-6 py-5 flex flex-col gap-4">
              {links.map((item, i) => (
                <a
                  key={item}
                  href={linkHrefs[i]}
                  onClick={() => setMobileOpen(false)}
                  className="text-base font-medium cursor-pointer text-lw-text hover:text-lw-primary
                             transition-colors duration-200 no-underline"
                >
                  {item}
                </a>
              ))}
              <hr className="border-lw-primary/10" />
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="text-lw-text font-medium cursor-pointer no-underline"
              >
                Iniciar sesión
              </Link>
              <a
                href="#demo"
                onClick={() => setMobileOpen(false)}
                className="text-center text-sm font-semibold py-3 rounded-lg cursor-pointer
                           bg-lw-cta text-white no-underline"
              >
                Solicitar demo gratuita
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}
