'use client'

import { motion } from 'framer-motion'

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.55,
      delay: i * 0.1,
      ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
    },
  }),
}

const features = [
  {
    title: 'Tracking en tiempo real',
    description:
      'Mapa interactivo con posición exacta de cada vehículo. Alertas automáticas de retrasos, desvíos y eventos críticos.',
    accentClass: 'bg-lw-primary text-white',
    iconBgClass: 'bg-lw-primary',
    featured: true,
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="11" cy="8.5" r="3.5" />
        <path d="M11 1.5C7.134 1.5 4 4.634 4 8.5c0 5.5 7 12 7 12s7-6.5 7-12c0-3.866-3.134-7-7-7z" />
      </svg>
    ),
  },
  {
    title: 'Dashboard de KPIs',
    description:
      'Reportes automáticos de eficiencia, costos y tiempos. Visibilidad total de tu operación en tiempo real.',
    accentClass: 'bg-lw-cta/15 text-lw-cta',
    featured: false,
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="2" y="2" width="18" height="18" rx="2" />
        <path d="M2 8h18M8 20V8" />
        <path d="M12 12h4M12 15h4M12 18h2" />
      </svg>
    ),
  },
  {
    title: 'Rutas optimizadas con IA',
    description:
      'Algoritmos de IA calculan rutas óptimas dinámicamente, reduciendo hasta 30% los costos de combustible.',
    accentClass: 'bg-lw-primary/15 text-lw-primary',
    featured: false,
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M9 18L3.5 15.5V6.5L9 4m0 14l6-3m-6 3V4m6 11l5.5 2.5V8.5L15 6m0 9V6" />
      </svg>
    ),
  },
  {
    title: 'Integración ERP / SAP',
    description:
      'Conecta con SAP, Oracle, facturación electrónica y más de 50 herramientas empresariales vía API REST.',
    accentClass: 'bg-lw-cta/15 text-lw-cta',
    featured: false,
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M9.5 11.5a5 5 0 007.07.5l2.5-2.5a5 5 0 00-7.07-7.07l-1.5 1.5" />
        <path d="M12.5 10.5a5 5 0 01-7.07-.5l-2.5 2.5a5 5 0 007.07 7.07l1.5-1.5" />
      </svg>
    ),
  },
  {
    title: 'App móvil para conductores',
    description:
      'Firma digital, evidencia fotográfica y actualización de estado sin papel. iOS y Android.',
    accentClass: 'bg-lw-primary/15 text-lw-primary',
    featured: false,
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="5" y="1" width="12" height="20" rx="2" />
        <path d="M11 17.5h.01" />
      </svg>
    ),
  },
]

export function Features() {
  return (
    <section id="soluciones" className="py-24 px-6 bg-lw-bg">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="text-xs font-semibold uppercase tracking-widest mb-3 text-lw-cta">
            Soluciones
          </p>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-lw-text font-heading">
            Todo lo que tu operación necesita
          </h2>
          <p className="text-lg max-w-2xl mx-auto text-lw-text/65">
            Plataforma integral que centraliza toda tu logística en un solo lugar.
          </p>
        </motion.div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {/* Featured card — 2 cols */}
          <motion.div
            custom={0}
            variants={cardVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            className="lg:col-span-2 rounded-2xl p-8 cursor-default relative overflow-hidden
                       bg-gradient-to-br from-lw-dark-mid to-lw-dark-light"
            style={{ boxShadow: '0 20px 40px rgba(12,26,74,0.4)' }}
            whileHover={{ y: -4 }}
            transition={{ duration: 0.2 }}
          >
            {/* Grid overlay */}
            <div
              aria-hidden="true"
              className="absolute inset-0 opacity-[0.07]"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)
                `,
                backgroundSize: '32px 32px',
              }}
            />

            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-lw-primary flex items-center justify-center mb-6 text-white">
                {features[0].icon}
              </div>
              <h3 className="text-2xl font-bold text-white mb-3 font-heading">
                {features[0].title}
              </h3>
              <p className="text-lg mb-8 text-white/65">
                {features[0].description}
              </p>

              {/* Mini map */}
              <div className="rounded-xl p-4 relative overflow-hidden h-32 bg-white/5 border border-white/8">
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 120" preserveAspectRatio="none" aria-hidden="true">
                  <path d="M80 60 L160 36 L240 72 L320 24 L360 56" stroke="#60A5FA" strokeWidth="1.5" fill="none" opacity="0.4" />
                </svg>
                {[
                  { x: '20%', y: '50%' }, { x: '40%', y: '30%' },
                  { x: '60%', y: '60%' }, { x: '80%', y: '20%' }, { x: '90%', y: '47%' },
                ].map((pos, i) => (
                  <div key={i} className="absolute -translate-x-1 -translate-y-1" style={{ left: pos.x, top: pos.y }}>
                    <div className="w-2.5 h-2.5 rounded-full bg-lw-cta" style={{ boxShadow: '0 0 6px rgba(249,115,22,0.6)' }} />
                    <div className="absolute inset-0 rounded-full bg-lw-cta opacity-35 animate-ping" />
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Regular cards */}
          {features.slice(1).map((feature, i) => (
            <motion.div
              key={feature.title}
              custom={i + 1}
              variants={cardVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              className="rounded-2xl p-6 cursor-default bg-white/75 border border-lw-primary/10
                         backdrop-blur-md shadow-sm"
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${feature.accentClass}`}>
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold mb-2 text-lw-text font-heading">
                {feature.title}
              </h3>
              <p className="text-sm leading-relaxed text-lw-text/65">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
