import { Truck } from 'lucide-react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* Left branding panel — visible lg+ */}
      <div className="hidden lg:flex lg:w-[52%] bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 flex-col items-center justify-center p-14 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/5 rounded-full" />
        <div className="absolute -bottom-32 -left-32 w-[28rem] h-[28rem] bg-white/5 rounded-full" />
        <div className="absolute top-1/2 right-8 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2" />

        <div className="relative z-10 text-white max-w-sm text-center">
          {/* Logo */}
          <div className="flex items-center justify-center w-20 h-20 bg-white/15 rounded-2xl mx-auto mb-8 ring-1 ring-white/20">
            <Truck className="w-10 h-10 text-white" />
          </div>

          <h1 className="text-4xl font-bold tracking-tight mb-3">Logística</h1>
          <p className="text-blue-200 text-lg leading-relaxed">
            Gestiona envíos, rutas, vehículos y clientes desde un solo lugar.
          </p>

        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-neutral-50 dark:bg-neutral-950">
        {children}
      </div>
    </div>
  );
}
