'use client'

import { motion } from 'framer-motion'
import { ParticlesCanvas } from './particles-canvas'
import { MagneticButton } from './magnetic-button'

const headlineWords = ['Mueve', 'más,', 'gestiona', 'menos.']

const wordVariants = {
  hidden: { opacity: 0, y: 60, filter: 'blur(8px)' },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.7,
      delay: 0.1 * i,
      ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
    },
  }),
}

const stats = [
  { value: '200+', label: 'empresas' },
  { value: '50K+', label: 'envíos/día' },
  { value: '99.9%', label: 'uptime' },
  { value: '30%', label: 'menos costos' },
]

// Floating badges use CSS animate-float + animation-delay via inline style (no Tailwind class for delay)
const floatingBadges = [
  {
    pos: 'top-[38%] left-[5%]',
    delay: '0s',
    entrance: { initial: { opacity: 0, x: -40 }, animate: { opacity: 1, x: 0 }, transition: { duration: 0.8, delay: 1.3 } },
    iconBg: 'bg-lw-primary/30',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#60A5FA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="9" cy="7" r="3" />
        <path d="M9 1.5C5.686 1.5 3 4.186 3 7c0 4.5 6 9.5 6 9.5s6-5 6-9.5c0-3.314-2.686-6-6-6z" />
      </svg>
    ),
    title: 'Tracking en vivo',
    sub: 'Flota actualizada',
  },
  {
    pos: 'top-[22%] right-[8%]',
    delay: '0.5s',
    entrance: { initial: { opacity: 0, x: 40 }, animate: { opacity: 1, x: 0 }, transition: { duration: 0.8, delay: 1.5 } },
    iconBg: 'bg-lw-cta/20',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#FB923C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M9 2L2 5.5v5L9 15l7-4.5v-5L9 2z" />
        <path d="M9 2v13M2 5.5l7 3.5 7-3.5" />
      </svg>
    ),
    title: 'IA Optimizada',
    sub: '-30% combustible',
  },
  {
    pos: 'bottom-[28%] right-[6%]',
    delay: '1s',
    entrance: { initial: { opacity: 0, x: 40 }, animate: { opacity: 1, x: 0 }, transition: { duration: 0.8, delay: 1.7 } },
    iconBg: 'bg-lw-success/20',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#4ADE80" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M9 1.5L1.5 6v6L9 16.5l7.5-4.5V6L9 1.5z" />
        <path d="M5.5 9l2.5 2.5 5-5" />
      </svg>
    ),
    title: '99.9% Uptime',
    sub: 'SLA garantizado',
  },
]

export function Hero() {
  return (
    <section
      className="relative min-h-dvh flex flex-col items-center justify-center overflow-hidden
                 bg-gradient-to-br from-lw-dark via-lw-dark-mid to-lw-dark-light"
    >
      {/* Noise texture — decorative, zero layout impact */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: '256px 256px',
        }}
      />

      {/* Subtle grid */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)
          `,
          backgroundSize: '64px 64px',
        }}
      />

      {/* Mesh radial gradients — aria-hidden, purely visual */}
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute rounded-full"
          style={{
            width: 700, height: 700, top: -200, right: -200,
            background: 'radial-gradient(circle, rgba(37,99,235,0.25) 0%, transparent 70%)',
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: 500, height: 500, bottom: -100, left: '5%',
            background: 'radial-gradient(circle, rgba(249,115,22,0.12) 0%, transparent 70%)',
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: 400, height: 400, top: '45%', left: '35%',
            background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)',
          }}
        />
      </div>

      {/* Canvas particles */}
      <ParticlesCanvas />

      {/* ── Main content ── */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 pt-24 pb-20 text-center">

        {/* Trust badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2.5 mb-10 px-4 py-2 rounded-full
                     bg-white/5 border border-white/10 backdrop-blur-xl cursor-default"
        >
          <span
            className="w-2 h-2 rounded-full bg-lw-success"
            style={{ boxShadow: '0 0 6px #22c55e' }}
          />
          <span className="text-sm font-medium text-white/80">
            Más de 200 empresas en Latinoamérica confían en nosotros
          </span>
        </motion.div>

        {/* Headline — word stagger */}
        <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight mb-6 font-heading">
          {headlineWords.map((word, i) => (
            <motion.span
              key={word + i}
              custom={i}
              variants={wordVariants}
              initial="hidden"
              animate="visible"
              className="inline-block mr-3 md:mr-4"
            >
              {word}
            </motion.span>
          ))}
        </h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.65 }}
          className="text-xl md:text-2xl max-w-2xl mx-auto mb-10 text-white/65 font-sans"
        >
          Logística inteligente para empresas que no se detienen.
        </motion.p>

        {/* CTA row */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.85 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
        >
          <MagneticButton
            href="#demo"
            className="text-base font-semibold cursor-pointer px-8 py-4 rounded-xl
                       bg-lw-cta text-white hover:opacity-90 transition-opacity duration-200
                       shadow-lg shadow-lw-cta/30 no-underline"
          >
            Solicitar demo gratuita
          </MagneticButton>
          <MagneticButton
            href="#proceso"
            className="flex items-center gap-2 text-base font-semibold cursor-pointer
                       px-8 py-4 rounded-xl bg-white/5 border border-white/10
                       backdrop-blur-xl text-white/90 hover:text-white
                       transition-colors duration-200 no-underline"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M9 16A7 7 0 109 2a7 7 0 000 14zm-1-5.268V7.268a1 1 0 011.555-.832l2.667 1.732a1 1 0 010 1.664L9.555 11.6A1 1 0 018 10.732z" clipRule="evenodd" />
            </svg>
            Ver cómo funciona
          </MagneticButton>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.1 }}
          className="flex flex-wrap items-center justify-center gap-8 md:gap-12"
        >
          {stats.map(({ value, label }) => (
            <div key={label} className="text-center cursor-default">
              <div className="text-2xl md:text-3xl font-bold text-white font-heading">{value}</div>
              <div className="text-xs uppercase tracking-widest mt-0.5 text-white/40">{label}</div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Floating badges — desktop only, CSS float animation, Framer only for entrance */}
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none hidden lg:block overflow-hidden">
        {floatingBadges.map((badge) => (
          <motion.div
            key={badge.title}
            initial={badge.entrance.initial}
            animate={badge.entrance.animate}
            transition={badge.entrance.transition}
            className={`absolute ${badge.pos}`}
          >
            {/* CSS float — runs on compositor, no JS per-frame */}
            <div
              className="flex items-center gap-3 px-4 py-3 rounded-2xl
                         bg-white/5 border border-white/10 backdrop-blur-xl
                         animate-float"
              style={{ animationDelay: badge.delay }}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${badge.iconBg}`}>
                {badge.icon}
              </div>
              <div>
                <div className="text-white text-xs font-semibold">{badge.title}</div>
                <div className="text-white/45 text-[10px]">{badge.sub}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Scroll indicator — CSS animation */}
      <div
        aria-hidden="true"
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5
                   text-white/30 animate-bounce-down"
      >
        <span className="text-[10px] uppercase tracking-widest">Scroll</span>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path fillRule="evenodd" d="M4.293 5.293a1 1 0 011.414 0L8 7.586l2.293-2.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </div>
    </section>
  )
}
