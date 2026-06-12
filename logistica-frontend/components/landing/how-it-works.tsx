'use client'

import { motion } from 'framer-motion'

const steps = [
  {
    number: '01',
    title: 'Configura tu operación',
    description:
      'Importa tu flota, define rutas y conecta tus almacenes en menos de un día. Soporte dedicado durante toda la implementación sin costo adicional.',
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="16" cy="16" r="4" />
        <path d="M16 2v3M16 27v3M2 16h3M27 16h3M6.34 6.34l2.12 2.12M23.54 23.54l2.12 2.12M6.34 25.66l2.12-2.12M23.54 8.46l2.12-2.12" />
      </svg>
    ),
    visual: (
      <div className="grid grid-cols-3 gap-2">
        {['Flota', 'Rutas', 'Almacenes', 'Conductores', 'Zonas', 'Alertas'].map(item => (
          <div key={item} className="rounded-lg px-2 py-1.5 text-[10px] font-medium text-center bg-lw-primary/10 text-lw-primary">
            {item}
          </div>
        ))}
      </div>
    ),
  },
  {
    number: '02',
    title: 'Conecta tus sistemas',
    description:
      'Integración nativa con SAP, Oracle y facturación electrónica. API REST documentada con más de 50 conectores preconfigurados.',
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M11 16a6 6 0 009.17.66l3.5-3.5a6 6 0 00-8.49-8.49L13.5 6.34" />
        <path d="M21 16a6 6 0 01-9.17-.66l-3.5 3.5a6 6 0 008.49 8.49l1.67-1.67" />
      </svg>
    ),
    visual: (
      <div className="flex flex-col gap-2">
        {[
          { sys: 'SAP ERP', connected: true },
          { sys: 'Oracle NetSuite', connected: true },
          { sys: 'Facturación Electrónica', connected: true },
          { sys: 'API Custom', connected: false },
        ].map(({ sys, connected }) => (
          <div key={sys} className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-lw-success' : 'bg-lw-cta'}`} />
            <span className="text-sm text-lw-text/80">{sys}</span>
            <span className={`ml-auto text-[10px] font-medium ${connected ? 'text-lw-success' : 'text-lw-cta'}`}>
              {connected ? 'Conectado' : 'Disponible'}
            </span>
          </div>
        ))}
      </div>
    ),
  },
  {
    number: '03',
    title: 'Gestiona y optimiza',
    description:
      'Monitorea tu operación en tiempo real, recibe alertas inteligentes y deja que la IA tome las decisiones de optimización.',
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="4 20 10 14 16 18 22 8 28 12" />
        <path d="M28 8v8M28 8h-8" />
      </svg>
    ),
    visual: (
      <div className="space-y-2">
        {[
          { label: 'Eficiencia de flota', value: 94, colorClass: 'bg-lw-primary', textClass: 'text-lw-primary' },
          { label: 'Entregas a tiempo',   value: 97, colorClass: 'bg-lw-success', textClass: 'text-lw-success' },
          { label: 'Ahorro combustible',  value: 31, colorClass: 'bg-lw-cta',     textClass: 'text-lw-cta' },
        ].map(({ label, value, colorClass, textClass }) => (
          <div key={label}>
            <div className="flex justify-between text-xs mb-1 text-lw-text/70">
              <span>{label}</span>
              <span className={`font-semibold ${textClass}`}>{value}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-lw-primary/10">
              <div className={`h-1.5 rounded-full ${colorClass}`} style={{ width: `${value}%` }} />
            </div>
          </div>
        ))}
      </div>
    ),
  },
]

export function HowItWorks() {
  return (
    <section id="proceso" className="py-24 px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <p className="text-xs font-semibold uppercase tracking-widest mb-3 text-lw-cta">
            Proceso
          </p>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-lw-text font-heading">
            Empieza en 3 pasos
          </h2>
          <p className="text-lg max-w-xl mx-auto text-lw-text/65">
            Implementación sin fricciones. Operando en producción en menos de 48 horas.
          </p>
        </motion.div>

        <div className="space-y-20">
          {steps.map((step, i) => {
            const isEven = i % 2 === 0
            return (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, x: isEven ? -60 : 60 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.65, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] }}
                className={`flex flex-col ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'} items-center gap-12 md:gap-16`}
              >
                {/* Text */}
                <div className="flex-1 min-w-0">
                  <div
                    className="text-8xl font-bold leading-none mb-4 select-none text-lw-primary font-heading"
                    style={{ opacity: 0.08 }}
                    aria-hidden="true"
                  >
                    {step.number}
                  </div>
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 bg-lw-bg text-lw-primary">
                    {step.icon}
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold mb-4 text-lw-text font-heading">
                    {step.title}
                  </h3>
                  <p className="text-base md:text-lg leading-relaxed text-lw-text/70">
                    {step.description}
                  </p>
                </div>

                {/* Visual */}
                <div className="flex-1 flex justify-center w-full">
                  <motion.div
                    className="w-full max-w-sm rounded-3xl p-8 bg-lw-bg border border-lw-primary/12"
                    style={{ boxShadow: '0 20px 40px rgba(37,99,235,0.12)' }}
                    whileHover={{ scale: 1.02, rotate: isEven ? 1 : -1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex items-center gap-2 mb-6">
                      <div className="w-2.5 h-2.5 rounded-full bg-lw-cta" />
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                      <div className="w-2.5 h-2.5 rounded-full bg-lw-success" />
                    </div>
                    {step.visual}
                  </motion.div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
