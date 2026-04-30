import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#020203] text-zinc-100">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#020203]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <img src="/logo.png?cb=20260430" alt="Next Capital logo" width={34} height={34} className="rounded-md" />
          <div className="flex items-center gap-2">
            <Link href="/login" className="rounded-full px-4 py-2 text-sm text-zinc-400 transition hover:text-zinc-100">
              Login
            </Link>
            <Link href="/register" className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm text-zinc-100 transition hover:bg-white/10">
              Crear cuenta
            </Link>
          </div>
        </div>
      </header>

      <section className="relative mx-auto flex min-h-[85vh] max-w-[100vw] items-center overflow-hidden">
        {/* Right Image Background with Fade */}
        <div className="absolute inset-y-0 right-0 w-full md:w-[70%] lg:w-[60%]">
          {/* Gradients to fade smoothly into the black background on the left and edges */}
          <div className="absolute inset-0 z-10 bg-gradient-to-r from-[#020203] via-[#020203]/70 to-transparent" />
          <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#020203] via-transparent to-[#020203]" />
          <div className="absolute inset-0 z-10 bg-[#020203]/20" /> {/* Slight overall darkening */}
          <img
            src="/trading-bg.png"
            alt="Trading and Investing"
            className="h-full w-full object-cover opacity-80 mix-blend-screen"
          />
        </div>

        {/* Left Content */}
        <div className="relative z-20 mx-auto w-full max-w-7xl px-6">
          <div className="relative max-w-3xl py-20 lg:py-32">
            {/* Large Logo with absolute positioning to ignore its massive internal whitespace */}
            <div className="relative h-20 w-full sm:h-28 md:h-32 lg:h-40">
              <img 
                src="/logo.png?cb=20260430" 
                alt="Next Capital logo" 
                className="pointer-events-none absolute left-[-70px] top-1/2 z-50 w-[320px] max-w-none -translate-y-1/2 drop-shadow-lg md:w-[480px] lg:w-[600px]" 
              />
            </div>
            
            {/* Text Content */}
            <div className="ml-[-20px]">
              <h1 className="mt-8 text-[32px] font-semibold leading-[1.1] tracking-tight text-white md:text-[44px] lg:mt-12 lg:text-[52px]">
                La nueva era de las
                <br />
                <span className="bg-gradient-to-br from-emerald-400 via-teal-300 to-blue-500 bg-clip-text text-transparent drop-shadow-sm">Inversiones</span>
              </h1>
              <p className="mt-6 text-sm leading-relaxed text-zinc-400 md:text-base md:max-w-xl">
                Monitorea capital, depósitos y rendimiento estimado <br className="hidden sm:block" />
                con una experiencia minimalista, sobria y de alto nivel institucional.
              </p>
              
              {/* Buttons */}
              <div className="mt-12 flex flex-wrap items-center gap-4">
                <Link href="/register" className="group relative overflow-hidden rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-black shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-transform hover:scale-105 hover:bg-zinc-100">
                  <span className="relative z-10">Crear cuenta</span>
                </Link>
                <Link href="/login" className="rounded-full border border-white/10 bg-white/5 px-8 py-3.5 text-sm font-semibold text-zinc-300 backdrop-blur-sm transition-colors hover:bg-white/10 hover:text-white">
                  Ver acceso
                </Link>
              </div>
              
              <p className="mt-10 flex items-center text-[11px] text-zinc-500">
                <svg className="mr-2 h-3 w-3 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Plataforma privada. Los resultados pueden variar.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="grid gap-12 border-t border-white/10 pt-12 md:grid-cols-3">
          <div>
            <p className="text-xs tracking-[0.2em] text-zinc-500">ESTRATEGIAS</p>
            <p className="mt-3 text-base text-zinc-100">Trading dinámico</p>
            <p className="mt-1 text-sm text-zinc-400">Rendimiento variable según mercado</p>
          </div>
          <div>
            <p className="text-xs tracking-[0.2em] text-zinc-500">EJECUCIÓN</p>
            <p className="mt-3 text-base text-zinc-100">Gestión disciplinada</p>
            <p className="mt-1 text-sm text-zinc-400">Seguimiento continuo y control de riesgo</p>
          </div>
          <div>
            <p className="text-xs tracking-[0.2em] text-zinc-500">SEGURIDAD</p>
            <p className="mt-3 text-base text-zinc-100">Infraestructura robusta</p>
            <p className="mt-1 text-sm text-zinc-400">Trazabilidad y acceso por roles</p>
          </div>
        </div>
      </section>

      {/* Planes de Inversión */}
      <section className="relative mx-auto max-w-7xl px-6 pb-32">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">Planes de Inversión</h2>
          <p className="mt-4 text-zinc-400">Elige la estrategia que mejor se adapte a tu capital y metas financieras.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Plan Inicio */}
          <div className="group relative rounded-3xl border border-white/10 bg-zinc-900/50 p-8 transition-all hover:-translate-y-2 hover:border-white/20 hover:bg-zinc-900/80 hover:shadow-2xl hover:shadow-cyan-500/10">
            <h3 className="text-xl font-semibold text-white">Plan Inicio</h3>
            <div className="my-6 flex items-baseline gap-2">
              <span className="text-4xl font-bold tracking-tight text-white">$100</span>
              <span className="text-sm text-zinc-500">USD</span>
            </div>
            <ul className="mb-8 space-y-4 text-sm text-zinc-400">
              <li className="flex items-center gap-3">
                <svg className="h-5 w-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                <span><strong className="text-white">0.5%</strong> de rendimiento diario estimado</span>
              </li>
              <li className="flex items-center gap-3">
                <svg className="h-5 w-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                Monitoreo en tiempo real
              </li>
            </ul>
            <Link href="/register" className="block w-full rounded-full bg-white/5 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-white/10">Comenzar</Link>
          </div>

          {/* Plan Plata */}
          <div className="group relative rounded-3xl border border-white/10 bg-zinc-900/50 p-8 transition-all hover:-translate-y-2 hover:border-white/20 hover:bg-zinc-900/80 hover:shadow-2xl hover:shadow-teal-500/10">
            <h3 className="text-xl font-semibold text-white">Plan Plata</h3>
            <div className="my-6 flex items-baseline gap-2">
              <span className="text-4xl font-bold tracking-tight text-white">$500</span>
              <span className="text-sm text-zinc-500">USD</span>
            </div>
            <ul className="mb-8 space-y-4 text-sm text-zinc-400">
              <li className="flex items-center gap-3">
                <svg className="h-5 w-5 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                <span><strong className="text-white">0.75%</strong> de rendimiento diario estimado</span>
              </li>
              <li className="flex items-center gap-3">
                <svg className="h-5 w-5 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                Monitoreo en tiempo real
              </li>
            </ul>
            <Link href="/register" className="block w-full rounded-full bg-white/5 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-white/10">Comenzar</Link>
          </div>

          {/* Plan Oro */}
          <div className="group relative rounded-3xl border border-amber-500/30 bg-amber-500/5 p-8 transition-all hover:-translate-y-2 hover:border-amber-500/50 hover:bg-amber-500/10 hover:shadow-2xl hover:shadow-amber-500/20">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-amber-600 to-amber-400 px-3 py-1 text-xs font-bold text-black shadow-lg">MÁS POPULAR</div>
            <h3 className="text-xl font-semibold text-white">Plan Oro</h3>
            <div className="my-6 flex items-baseline gap-2">
              <span className="text-4xl font-bold tracking-tight text-white">$1,000</span>
              <span className="text-sm text-zinc-500">USD</span>
            </div>
            <ul className="mb-8 space-y-4 text-sm text-zinc-400">
              <li className="flex items-center gap-3">
                <svg className="h-5 w-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                <span><strong className="text-white">1%</strong> de rendimiento diario estimado</span>
              </li>
              <li className="flex items-center gap-3">
                <svg className="h-5 w-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                Atención prioritaria
              </li>
            </ul>
            <Link href="/register" className="block w-full rounded-full bg-gradient-to-r from-amber-500 to-amber-600 py-3 text-center text-sm font-semibold text-black transition-transform hover:scale-105">Comenzar</Link>
          </div>

          {/* Plan Platinium */}
          <div className="group relative overflow-hidden rounded-3xl border border-indigo-500/30 bg-zinc-900/50 p-8 transition-all hover:-translate-y-2 hover:border-indigo-500/50 hover:shadow-2xl hover:shadow-indigo-500/20">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 opacity-50" />
            <div className="relative z-10">
              <h3 className="text-xl font-semibold text-white">Plan Platinium</h3>
              <div className="my-6 flex items-baseline gap-2">
                <span className="text-4xl font-bold tracking-tight text-white">$2,000</span>
                <span className="text-sm text-zinc-500">USD</span>
              </div>
              <ul className="mb-8 space-y-4 text-sm text-zinc-400">
                <li className="flex items-center gap-3">
                  <svg className="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  <span><strong className="text-white">1.25%</strong> de rendimiento diario estimado</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Gestión institucional
                </li>
              </ul>
              <Link href="/register" className="block w-full rounded-full bg-indigo-500 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-indigo-400">Comenzar</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-16">
        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 sm:flex-row sm:items-start">
          <p className="text-xs text-zinc-500">
            Todas las inversiones conllevan riesgo. Los rendimientos no están garantizados. Los resultados pasados no aseguran resultados futuros.
            <br className="hidden sm:block" />
            <Link href="/terms" className="mt-2 inline-block text-zinc-400 hover:text-white underline underline-offset-2">
              Términos y Condiciones
            </Link>
          </p>
          <Link href="/admin" className="text-zinc-700 transition-colors hover:text-white" title="Panel Administrativo">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </Link>
        </div>
      </section>
    </main>
  );
}
