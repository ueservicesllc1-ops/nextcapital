import Link from "next/link";

export default function PoliciesPage() {
  return (
    <main className="min-h-screen bg-[#020203] text-zinc-100">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#020203]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center px-6">
          <Link href="/" className="text-xl font-bold tracking-tight text-white transition hover:text-zinc-300">
            NextCapital
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-6 py-20">
        <h1 className="text-3xl font-semibold text-white md:text-4xl">Políticas del Sitio</h1>
        <p className="mt-4 text-sm text-zinc-400">Última actualización: 30 de abril de 2026</p>

        <div className="mt-12 space-y-8 text-sm leading-relaxed text-zinc-300">
          <section>
            <h2 className="text-xl font-medium text-white">1. Política de Privacidad y Manejo de Datos</h2>
            <p className="mt-3">
              En NextCapital, valoramos profundamente la privacidad de nuestros usuarios. Todos los datos 
              personales y financieros recopilados durante el registro, depósito o retiro son encriptados 
              y almacenados en servidores seguros (Firebase/Google Cloud) siguiendo los estándares de la industria.
            </p>
            <p className="mt-2">
              No compartimos, vendemos ni alquilamos su información personal a terceros bajo ninguna circunstancia, 
              salvo cuando sea requerido por la ley aplicable o las autoridades reguladoras financieras.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-white">2. Política de Seguridad Transaccional (Stripe)</h2>
            <p className="mt-3">
              Nuestra plataforma utiliza <strong>Stripe</strong> como pasarela de pago oficial para todas las transacciones con tarjeta. 
              NextCapital no tiene acceso ni almacena el número de su tarjeta de crédito o débito, ni los códigos CVV.
              Stripe maneja toda esta información a través de sus sistemas con certificación PCI de Nivel 1, garantizando 
              el más alto estándar de seguridad cibernética disponible.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-white">3. Política contra el Lavado de Dinero (AML)</h2>
            <p className="mt-3">
              Como plataforma de inversión responsable, NextCapital implementa medidas estrictas de prevención 
              de lavado de dinero. El equipo de Compliance se reserva el derecho de:
            </p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-zinc-400">
              <li>Solicitar verificación de identidad (KYC) antes de procesar retiros superiores a ciertos montos.</li>
              <li>Rechazar transferencias bancarias de origen sospechoso o de cuentas que no pertenezcan al titular de la inversión.</li>
              <li>Retener fondos y reportar a las autoridades competentes cualquier actividad ilícita detectada.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-medium text-white">4. Uso de Cookies</h2>
            <p className="mt-3">
              Utilizamos cookies técnicas y de sesión estrictamente necesarias para mantener activa su cuenta mientras 
              navega por nuestro panel de inversión. Al continuar utilizando NextCapital, usted acepta el uso de 
              estas herramientas analíticas y de funcionamiento.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-white">5. Suspensión de Cuentas</h2>
            <p className="mt-3">
              Cualquier intento de fraude, manipulación del código, inyección de datos falsos de comprobantes bancarios, 
              o cualquier otra violación a nuestras normativas, resultará en la suspensión inmediata e irrevocable 
              de su cuenta, así como en la retención de todos los fondos promocionales y rendimientos asociados.
            </p>
          </section>
        </div>

        <div className="mt-16 border-t border-white/10 pt-8">
          <Link href="/" className="rounded-full border border-white/20 bg-white/5 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-white/10">
            Volver al Inicio
          </Link>
        </div>
      </section>
    </main>
  );
}
