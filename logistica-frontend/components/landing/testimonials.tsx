'use client'

import { useRef } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'

interface Testimonial {
  quote: string
  author: string
  role: string
  company: string
  country: string
  initial: string
  accentClass: string
}

const testimonials: Testimonial[] = [
  {
    quote: 'Redujimos costos de distribución en 28% en el primer trimestre. El tracking en tiempo real cambió completamente la gestión de nuestra flota de 80 vehículos.',
    author: 'Carlos Ramírez', role: 'Gerente de Operaciones',
    company: 'Distribuidora Andina S.A.', country: 'Colombia',
    initial: 'CR', accentClass: 'bg-lw-primary',
  },
  {
    quote: 'La integración con SAP fue perfecta. En 2 días teníamos todo conectado y el equipo adoptó la plataforma sin ningún problema ni capacitación adicional.',
    author: 'Ana Martínez', role: 'Directora de Supply Chain',
    company: 'Industrias del Pacífico', country: 'Perú',
    initial: 'AM', accentClass: 'bg-lw-cta',
  },
  {
    quote: 'Los conductores adoran la app. Ya no hay papel, no hay llamadas para confirmar entregas. Todo queda registrado automáticamente con foto y firma digital.',
    author: 'Miguel Torres', role: 'Jefe de Flota',
    company: 'TransporteExpress', country: 'México',
    initial: 'MT', accentClass: 'bg-lw-primary',
  },
  {
    quote: 'El dashboard de KPIs nos permite tomar decisiones en tiempo real. Antes esperábamos reportes semanales; ahora tenemos visibilidad total en segundos.',
    author: 'Laura González', role: 'VP Operaciones',
    company: 'LogiMax Corp', country: 'Chile',
    initial: 'LG', accentClass: 'bg-lw-cta',
  },
  {
    quote: 'La IA de optimización de rutas es increíble. Manejamos 200 vehículos y ahorramos casi $50,000 USD mensuales en combustible desde el primer mes.',
    author: 'Roberto Jiménez', role: 'Director General',
    company: 'Flota Nacional', country: 'Brasil',
    initial: 'RJ', accentClass: 'bg-lw-primary',
  },
  {
    quote: 'Soporte excepcional y producto robusto. En 18 meses nunca hemos tenido una caída del sistema. El 99.9% de uptime prometido es completamente real.',
    author: 'Diana Morales', role: 'CTO',
    company: 'Envíos Rápidos', country: 'Argentina',
    initial: 'DM', accentClass: 'bg-lw-cta',
  },
]

function StarRating() {
  return (
    <div className="flex gap-0.5" aria-label="5 estrellas">
      {[1, 2, 3, 4, 5].map(s => (
        <svg key={s} width="14" height="14" viewBox="0 0 14 14" fill="currentColor" className="text-lw-cta" aria-hidden="true">
          <path d="M7 1l1.55 3.14L12 4.64l-2.5 2.44.59 3.43L7 8.77l-3.09 1.74.59-3.43L2 4.64l3.45-.5L7 1z" />
        </svg>
      ))}
    </div>
  )
}

function TiltCard({ t, delay }: { t: Testimonial; delay: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const rawX = useMotionValue(0)
  const rawY = useMotionValue(0)
  const springX = useSpring(rawX, { stiffness: 150, damping: 25 })
  const springY = useSpring(rawY, { stiffness: 150, damping: 25 })
  const rotateY = useTransform(springX, [-0.5, 0.5], [-5, 5])
  const rotateX = useTransform(springY, [-0.5, 0.5], [5, -5])

  const onMove = (e: React.MouseEvent) => {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    rawX.set((e.clientX - rect.left) / rect.width - 0.5)
    rawY.set((e.clientY - rect.top) / rect.height - 0.5)
  }

  const onLeave = () => { rawX.set(0); rawY.set(0) }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.55, delay }}
      style={{ rotateX, rotateY, transformPerspective: 800 }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className="rounded-2xl cursor-default"
      role="article"
    >
      <div className="rounded-2xl p-6 bg-white/75 border border-lw-primary/10 backdrop-blur-md shadow-sm h-full">
        <StarRating />
        <blockquote className="mt-4 mb-5 text-sm leading-relaxed text-lw-text/80">
          &ldquo;{t.quote}&rdquo;
        </blockquote>
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${t.accentClass}`} aria-hidden="true">
            {t.initial}
          </div>
          <div>
            <div className="text-sm font-semibold text-lw-text">{t.author}</div>
            <div className="text-xs text-lw-text/55">{t.role} · {t.company}</div>
          </div>
          <div className="ml-auto text-xs font-medium text-lw-text/40">{t.country}</div>
        </div>
      </div>
    </motion.div>
  )
}

export function Testimonials() {
  return (
    <section id="clientes" className="py-24 px-6 bg-lw-bg">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="text-xs font-semibold uppercase tracking-widest mb-3 text-lw-cta">
            Testimonios
          </p>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-lw-text font-heading">
            Lo que dicen nuestros clientes
          </h2>
          <p className="text-lg max-w-xl mx-auto text-lw-text/65">
            Empresas reales, resultados medibles.
          </p>
        </motion.div>

        {/* CSS columns masonry */}
        <div className="columns-1 md:columns-2 lg:columns-3 gap-6">
          {testimonials.map((t, i) => (
            <div key={t.author} className="break-inside-avoid mb-6">
              <TiltCard t={t} delay={i * 0.08} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
