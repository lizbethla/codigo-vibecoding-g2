'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { MagneticButton } from './magnetic-button'

export function CtaFinal() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setSubmitted(true)
  }

  return (
    <section id="demo" className="py-24 px-6 bg-white">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7 }}
        >
          {/* Rotating gradient border — CSS spin, zero JS overhead */}
          <div className="relative rounded-3xl overflow-hidden p-0.5">
            {/* Spinner: oversized conic-gradient div, CSS animation */}
            <div
              aria-hidden="true"
              className="absolute animate-spin-slow pointer-events-none"
              style={{
                inset: '-100%',
                background:
                  'conic-gradient(from 0deg, #2563eb 0%, #f97316 25%, #3b82f6 50%, #f97316 75%, #2563eb 100%)',
              }}
            />

            {/* Inner panel */}
            <div className="relative rounded-[calc(1.5rem-2px)] px-8 py-16 md:py-20 text-center overflow-hidden bg-lw-dark">
              {/* Mesh bg */}
              <div
                aria-hidden="true"
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: `
                    radial-gradient(circle at 20% 50%, rgba(37,99,235,0.2) 0%, transparent 60%),
                    radial-gradient(circle at 80% 20%, rgba(249,115,22,0.12) 0%, transparent 50%)
                  `,
                }}
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 rounded-3xl pointer-events-none"
                style={{ boxShadow: 'inset 0 0 80px rgba(37,99,235,0.08)' }}
              />

              <div className="relative z-10">
                <motion.p
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                  className="text-xs font-semibold uppercase tracking-widest mb-4 text-lw-cta"
                >
                  Demo gratuita
                </motion.p>

                <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 font-heading">
                  ¿Listo para transformar tu logística?
                </h2>
                <p className="text-lg mb-10 max-w-xl mx-auto text-white/60 font-sans">
                  Solicita una demo personalizada. Sin compromiso, sin tarjeta de crédito.
                  Te contactamos en menos de 24 horas.
                </p>

                {submitted ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center gap-3"
                  >
                    <div className="w-14 h-14 rounded-full flex items-center justify-center mb-2 bg-lw-success/15">
                      <svg
                        width="28" height="28" viewBox="0 0 28 28"
                        fill="none" stroke="currentColor"
                        strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                        className="text-lw-success" aria-hidden="true"
                      >
                        <path d="M5 14l6 6L23 8" />
                      </svg>
                    </div>
                    <p className="text-white text-lg font-semibold">¡Solicitud recibida!</p>
                    <p className="text-white/60">Te contactaremos en menos de 24 horas.</p>
                  </motion.div>
                ) : (
                  <form
                    onSubmit={handleSubmit}
                    className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
                    noValidate
                  >
                    <label htmlFor="cta-email" className="sr-only">
                      Correo electrónico
                    </label>
                    <input
                      id="cta-email"
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="tucorreo@empresa.com"
                      className="
                        flex-1 rounded-xl px-4 py-3 text-sm outline-none font-sans
                        bg-white/8 border border-white/15 text-white
                        placeholder:text-white/35
                        focus:border-lw-primary focus:ring-2 focus:ring-lw-primary/20
                        transition-colors duration-200
                      "
                    />
                    <MagneticButton
                      type="submit"
                      className="
                        text-sm font-semibold cursor-pointer px-6 py-3 rounded-xl
                        whitespace-nowrap bg-lw-cta text-white
                        hover:opacity-90 transition-opacity duration-200
                        shadow-lg shadow-lw-cta/30
                      "
                    >
                      Solicitar demo
                    </MagneticButton>
                  </form>
                )}

                {/* Trust signals */}
                <div className="mt-8 flex flex-wrap items-center justify-center gap-6">
                  {[
                    'Sin tarjeta de crédito',
                    'Respuesta en 24h',
                    'Demo personalizada',
                  ].map(label => (
                    <div key={label} className="flex items-center gap-2 text-white/45">
                      <svg
                        width="14" height="14" viewBox="0 0 14 14"
                        fill="none" stroke="currentColor" strokeWidth="1.5"
                        strokeLinecap="round" strokeLinejoin="round"
                        className="text-lw-success" aria-hidden="true"
                      >
                        <path d="M2 7l3 3 7-7" />
                      </svg>
                      <span className="text-xs">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
