import { Link } from "react-router-dom";

export default function HomePage() {
  return (
    <section className="space-y-10">
      <header className="space-y-6 text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">AYD Express</p>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Súmate a la plataforma que conecta tiendas, clientes y repartidores
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-slate-600">
          Navega el catálogo público, crea tu cuenta según tu rol y disfruta de una experiencia consistente en web y móvil.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            to="/auth/register?rol=CLIENTE"
            className="rounded-md bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-blue-500"
          >
            Crear cuenta cliente
          </Link>
          <Link
            to="/catalogo/tiendas"
            className="rounded-md border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Ver tiendas
          </Link>
        </div>
      </header>
      <div className="grid gap-6 md:grid-cols-3">
        {[
          {
            title: "Clientes",
            description:
              "Explora tiendas verificadas, arma tu carrito y da seguimiento a tus pedidos con timelines claros.",
          },
          {
            title: "Tiendas",
            description:
              "Administra tu catálogo, tarifas de envío y pedidos en tiempo real desde un panel accesible.",
          },
          {
            title: "Repartidores",
            description:
              "Recibe entregas asignadas, actualiza estados y comparte tu ubicación durante el recorrido.",
          },
        ].map((card) => (
          <article key={card.title} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-xl font-semibold">{card.title}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{card.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
