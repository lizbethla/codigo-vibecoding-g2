'use client'

const logos = [
  'Grupo Éxito', 'Cementos Argos', 'Nutresa', 'ISA Group', 'Bancolombia',
  'EPM', 'Bavaria', 'Postobón', 'Corona', 'Sofasa',
]

export function LogosBar() {
  const doubled = [...logos, ...logos]

  return (
    <section
      id="clientes"
      className="py-14 overflow-hidden bg-white border-y border-lw-primary/8"
    >
      <div className="max-w-7xl mx-auto px-6 mb-8 text-center">
        <p className="text-xs uppercase tracking-widest font-semibold text-lw-text/50">
          Empresas líderes que confían en LogísticaWeb
        </p>
      </div>

      <div className="relative">
        {/* Fade edges */}
        <div
          aria-hidden="true"
          className="absolute left-0 top-0 bottom-0 w-24 z-10 pointer-events-none
                     bg-gradient-to-r from-white to-transparent"
        />
        <div
          aria-hidden="true"
          className="absolute right-0 top-0 bottom-0 w-24 z-10 pointer-events-none
                     bg-gradient-to-l from-white to-transparent"
        />

        {/* CSS-animated marquee — no JS, runs on compositor */}
        <div className="flex w-max animate-marquee gap-12">
          {doubled.map((name, i) => (
            <div
              key={i}
              className="flex items-center gap-2.5 opacity-[0.28] hover:opacity-60
                         transition-opacity duration-200 cursor-pointer whitespace-nowrap
                         flex-shrink-0"
            >
              <div className="w-7 h-7 rounded-lg bg-lw-bg flex items-center justify-center flex-shrink-0">
                <div className="w-3 h-3 rounded-sm bg-lw-primary" />
              </div>
              <span className="text-base font-semibold text-lw-text font-heading">
                {name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
