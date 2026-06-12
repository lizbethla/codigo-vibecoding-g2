'use client'

import Link from 'next/link'

const socialLinks = [
  {
    label: 'LinkedIn',
    href: '#',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor" aria-hidden="true">
        <path d="M16 0H2C.9 0 0 .9 0 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V2c0-1.1-.9-2-2-2zM5.5 15H3V7h2.5v8zM4.25 5.8C3.42 5.8 2.75 5.13 2.75 4.3S3.42 2.8 4.25 2.8 5.75 3.47 5.75 4.3 5.08 5.8 4.25 5.8zM15 15h-2.5v-4.5c0-1.08-.02-2.47-1.5-2.47-1.51 0-1.74 1.18-1.74 2.39V15H6.75V7H9.1v1.1h.03c.33-.63 1.13-1.29 2.32-1.29 2.48 0 2.94 1.63 2.94 3.75V15z" />
      </svg>
    ),
  },
  {
    label: 'Twitter / X',
    href: '#',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor" aria-hidden="true">
        <path d="M14.23 1.5h2.6l-5.68 6.49 6.68 8.83h-5.24l-4.1-5.36-4.69 5.36H1.2l6.08-6.95L.85 1.5h5.37l3.71 4.91L14.23 1.5zm-.91 13.67h1.44L4.77 2.97H3.22l10.1 12.2z" />
      </svg>
    ),
  },
  {
    label: 'YouTube',
    href: '#',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor" aria-hidden="true">
        <path d="M17.6 4.6s-.2-1.4-.8-2c-.77-.8-1.63-.8-2.03-.85C12.26 1.6 9 1.6 9 1.6s-3.26 0-5.77.15c-.4.05-1.26.05-2.03.85-.6.6-.8 2-.8 2S.2 6.2.2 7.8v1.5c0 1.6.2 3.2.2 3.2s.2 1.4.8 2c.77.8 1.78.77 2.23.85 1.62.16 6.57.2 6.57.2s3.27-.04 5.77-.19c.4-.05 1.26-.05 2.03-.85.6-.6.8-2 .8-2s.2-1.6.2-3.2V7.8c0-1.6-.2-3.2-.2-3.2zM7.25 11.4V6.6l5.46 2.41-5.46 2.39z" />
      </svg>
    ),
  },
]

const columns = [
  {
    title: 'Producto',
    links: [
      { label: 'Tracking en tiempo real', href: '#soluciones' },
      { label: 'Dashboard & KPIs',        href: '#soluciones' },
      { label: 'Optimización IA',         href: '#soluciones' },
      { label: 'App para conductores',    href: '#soluciones' },
      { label: 'Integraciones',           href: '#soluciones' },
    ],
  },
  {
    title: 'Empresa',
    links: [
      { label: 'Sobre nosotros', href: '#' },
      { label: 'Clientes',       href: '#clientes' },
      { label: 'Blog',           href: '#' },
      { label: 'Prensa',         href: '#' },
      { label: 'Carreras',       href: '#' },
    ],
  },
  {
    title: 'Soporte',
    links: [
      { label: 'Documentación API', href: '#' },
      { label: 'Centro de ayuda',   href: '#' },
      { label: 'Estado del servicio', href: '#' },
      { label: 'Contacto',          href: '#demo' },
      { label: 'Privacidad',        href: '#' },
    ],
  },
]

export function Footer() {
  return (
    <footer className="bg-lw-dark border-t border-lw-primary/12">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">

          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-lw-primary flex items-center justify-center flex-shrink-0">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M8 1L14.5 4.5v7L8 15L1.5 11.5v-7L8 1z" fill="rgba(255,255,255,0.2)" />
                  <path d="M8 1L14.5 4.5L8 8L1.5 4.5L8 1z" fill="white" />
                  <path d="M14.5 4.5V11.5L8 15V8L14.5 4.5z" fill="rgba(255,255,255,0.55)" />
                </svg>
              </div>
              <span className="text-lg font-semibold text-white font-heading">LogísticaWeb</span>
            </div>
            <p className="text-sm leading-relaxed mb-6 text-white/45">
              Logística inteligente para empresas que no se detienen. Plataforma integral para operaciones de distribución en Latinoamérica.
            </p>

            {/* Social icons */}
            <div className="flex gap-3">
              {socialLinks.map(({ label, href, icon }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-9 h-9 rounded-lg flex items-center justify-center cursor-pointer
                             bg-white/6 border border-white/8 text-white/45
                             hover:bg-lw-primary/20 hover:text-lw-secondary hover:shadow-lg
                             hover:shadow-lw-primary/30 transition-all duration-200"
                >
                  {icon}
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {columns.map(col => (
            <div key={col.title}>
              <h4 className="text-sm font-semibold text-white mb-5 font-heading">{col.title}</h4>
              <ul className="space-y-3">
                {col.links.map(({ label, href }) => (
                  <li key={label}>
                    <a
                      href={href}
                      className="text-sm cursor-pointer text-white/45 hover:text-white/85
                                 transition-colors duration-200 no-underline"
                    >
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 border-t border-white/7">
          <p className="text-xs text-white/30">
            © {new Date().getFullYear()} LogísticaWeb. Todos los derechos reservados.
          </p>
          <div className="flex gap-6">
            {['Términos de uso', 'Política de privacidad', 'Cookies'].map(item => (
              <a
                key={item}
                href="#"
                className="text-xs cursor-pointer text-white/30 hover:text-white/60
                           transition-colors duration-200 no-underline"
              >
                {item}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
