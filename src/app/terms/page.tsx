import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#020203] text-zinc-100">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#020203]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center px-6">
          <Link href="/">
            <img src="/logo.png?cb=20260430" alt="Next Capital logo" width={34} height={34} className="rounded-md" />
          </Link>
          <span className="ml-4 border-l border-white/20 pl-4 text-sm font-medium text-zinc-400">Términos y Condiciones</span>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">Términos y Condiciones</h1>
        <p className="mt-4 text-sm text-zinc-400">Última actualización: Abril 2026</p>

        <div className="mt-12 space-y-10 text-sm leading-relaxed text-zinc-300">
          
          <article>
            <h2 className="text-xl font-semibold text-white">1. Política de Retiros</h2>
            <p className="mt-3">
              Para garantizar la liquidez operativa y mantener una gestión disciplinada del capital de nuestros inversores, 
              Next Capital ha establecido una ventana estricta para la solicitud de retiros.
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-zinc-400">
              <li>Las peticiones de retiro de ganancias o capital solo podrán realizarse entre el <strong>día 28 y el día 30 de cada mes</strong>.</li>
              <li>Cualquier solicitud de retiro enviada fuera de esta ventana será rechazada automáticamente por el sistema o procesada en el ciclo del mes siguiente.</li>
              <li>Una vez solicitados dentro de la ventana permitida, los retiros pueden tardar hasta 72 horas hábiles en reflejarse en su cuenta bancaria, dependiendo de los tiempos interbancarios.</li>
            </ul>
          </article>

          <article>
            <h2 className="text-xl font-semibold text-white">2. Bonos y Saldos Promocionales</h2>
            <p className="mt-3">
              Next Capital puede ofrecer bonos de bienvenida, saldos promocionales o recompensas por referir a nuevos usuarios a la plataforma. Para proteger la integridad financiera del ecosistema, aplican las siguientes restricciones:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-zinc-400">
              <li>
                <strong>Bloqueo de Retiro:</strong> Todo saldo proveniente de una promoción, bono o programa de referidos <strong>no podrá ser retirado de la plataforma</strong> bajo ninguna circunstancia hasta que el usuario haya realizado y completado un <strong>depósito mínimo real de $100 USD</strong>.
              </li>
              <li>
                Los saldos promocionales pueden generar rendimientos diarios según la estrategia asignada, pero dichas ganancias también permanecerán bloqueadas para retiro hasta cumplir la condición del depósito mínimo.
              </li>
            </ul>
          </article>

          <article>
            <h2 className="text-xl font-semibold text-white">3. Riesgo de Inversión</h2>
            <p className="mt-3">
              Todas las inversiones conllevan un riesgo intrínseco. Los porcentajes de rendimiento diario ofrecidos en nuestros planes (Plan Inicio, Plata, Oro, Platinium) son estimaciones basadas en datos históricos y estrategias de trading dinámico. 
            </p>
            <p className="mt-2">
              Next Capital se esfuerza por mitigar riesgos mediante estrictos controles institucionales, pero los resultados pasados no garantizan resultados futuros.
            </p>
          </article>

        </div>

        <div className="mt-16 border-t border-white/10 pt-8">
          <Link href="/" className="text-sm font-medium text-cyan-400 hover:text-cyan-300">
            &larr; Volver a la página principal
          </Link>
        </div>
      </section>
    </main>
  );
}
