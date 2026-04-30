import Link from "next/link";
import { demoPlans } from "@/lib/mock-data";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900">
      <section className="mx-auto max-w-6xl px-6 py-20">
        <p className="text-sm uppercase tracking-[0.25em] text-cyan-300">Next Capital</p>
        <h1 className="mt-4 text-4xl font-bold text-white md:text-6xl">Smart investment platform for modern investors</h1>
        <p className="mt-6 max-w-2xl text-slate-300">
          Monitorea tu capital, depósitos y rendimiento estimado desde un solo dashboard.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/register" className="rounded-xl bg-cyan-500 px-5 py-3 font-medium text-slate-950 hover:bg-cyan-400">
            Crear cuenta
          </Link>
          <Link href="/login" className="rounded-xl border border-slate-700 px-5 py-3 font-medium text-slate-100 hover:bg-slate-800">
            Iniciar sesión
          </Link>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-6 pb-10 md:grid-cols-3">
        {["Dashboard en tiempo real", "Depósitos con Stripe y banco", "Control de riesgo y seguimiento"].map((item) => (
          <article key={item} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
            <h2 className="text-lg font-semibold text-white">{item}</h2>
            <p className="mt-2 text-sm text-slate-400">Visualiza rendimientos estimados, historial y estado de cada movimiento.</p>
          </article>
        ))}
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10">
        <h2 className="text-2xl font-semibold text-white">Cómo funciona</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {["Crea tu cuenta", "Deposita por tarjeta o banco", "Monitorea resultados estimados"].map((step) => (
            <div key={step} className="rounded-2xl border border-slate-800 bg-slate-900 p-5 text-slate-300">
              {step}
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10">
        <h2 className="text-2xl font-semibold text-white">Estrategias</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {demoPlans.map((plan) => (
            <article key={plan.id} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
              <h3 className="text-lg font-semibold text-cyan-300">{plan.name}</h3>
              <p className="mt-2 text-sm text-slate-300">{plan.description}</p>
              <p className="mt-3 text-xs text-slate-400">{plan.estimatedDailyRange}</p>
              <p className="text-xs text-slate-400">{plan.estimatedMonthlyRange}</p>
              <p className="mt-2 text-xs text-amber-300">los resultados pueden variar</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-8">
        <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
          Toda inversión conlleva riesgo. Los rendimientos no están garantizados.
        </p>
      </section>
    </main>
  );
}
