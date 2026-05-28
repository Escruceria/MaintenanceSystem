import {
  AlertTriangle,
  ClipboardList,
  Gauge,
  Package,
  QrCode,
  Settings,
  Users,
  Wrench,
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', icon: Gauge },
  { label: 'Equipos', icon: QrCode },
  { label: 'Ordenes', icon: ClipboardList },
  { label: 'Preventivos', icon: Wrench },
  { label: 'Repuestos', icon: Package },
  { label: 'Personal', icon: Users },
  { label: 'Alertas', icon: AlertTriangle },
  { label: 'Ajustes', icon: Settings },
];

const metrics = [
  { label: 'Ordenes abiertas', value: '24', note: '7 criticas' },
  { label: 'Cumplimiento preventivo', value: '91%', note: '+4% este mes' },
  { label: 'Equipos activos', value: '418', note: '12 en mantenimiento' },
  { label: 'Repuestos bajos', value: '18', note: '5 urgentes' },
];

const workOrders = [
  ['OT-2026-0018', 'Bomba centrifuga linea 2', 'Critica', 'En progreso'],
  ['OT-2026-0019', 'Compresor principal', 'Alta', 'Asignada'],
  ['OT-2026-0020', 'Tablero electrico A3', 'Media', 'Abierta'],
  ['OT-2026-0021', 'Montacargas 04', 'Alta', 'Pendiente repuesto'],
];

export default function Home() {
  return (
    <main className="min-h-screen">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[260px_1fr]">
        <aside className="border-b border-line bg-white px-4 py-4 lg:border-b-0 lg:border-r">
          <div className="mb-6 flex items-center gap-3 px-2">
            <div className="grid h-10 w-10 place-items-center rounded bg-brand text-sm font-bold text-white">
              MS
            </div>
            <div>
              <p className="text-sm font-semibold">MaintenanceSystem</p>
              <p className="text-xs text-slate-500">CMMS Enterprise</p>
            </div>
          </div>
          <nav className="grid gap-1">
            {navItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  className={`flex h-10 items-center gap-3 rounded px-3 text-left text-sm ${
                    index === 0
                      ? 'bg-brand text-white'
                      : 'text-slate-600 hover:bg-field hover:text-ink'
                  }`}
                  title={item.label}
                >
                  <Icon size={18} aria-hidden="true" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        <section className="px-4 py-5 sm:px-6 lg:px-8">
          <header className="mb-6 flex flex-col gap-4 border-b border-line pb-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-normal">Centro de mantenimiento</h1>
              <p className="mt-1 text-sm text-slate-500">
                Vista operacional para activos, ordenes, preventivos e inventario.
              </p>
            </div>
            <div className="flex gap-2">
              <button className="h-10 rounded border border-line bg-white px-4 text-sm font-medium">
                Exportar
              </button>
              <button className="h-10 rounded bg-brand px-4 text-sm font-medium text-white">
                Nueva orden
              </button>
            </div>
          </header>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric) => (
              <article key={metric.label} className="rounded border border-line bg-white p-4">
                <p className="text-sm text-slate-500">{metric.label}</p>
                <p className="mt-3 text-3xl font-semibold">{metric.value}</p>
                <p className="mt-2 text-sm text-brand">{metric.note}</p>
              </article>
            ))}
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_360px]">
            <section className="rounded border border-line bg-white">
              <div className="border-b border-line px-4 py-3">
                <h2 className="text-base font-semibold">Ordenes recientes</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px] border-collapse text-sm">
                  <thead className="bg-field text-left text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-medium">Codigo</th>
                      <th className="px-4 py-3 font-medium">Equipo</th>
                      <th className="px-4 py-3 font-medium">Prioridad</th>
                      <th className="px-4 py-3 font-medium">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workOrders.map((row) => (
                      <tr key={row[0]} className="border-t border-line">
                        {row.map((cell) => (
                          <td key={cell} className="px-4 py-3">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="rounded border border-line bg-white p-4">
              <h2 className="text-base font-semibold">Prioridades del dia</h2>
              <div className="mt-4 grid gap-3 text-sm">
                <div className="rounded border border-line p-3">
                  <p className="font-medium">Cerrar ordenes criticas</p>
                  <p className="mt-1 text-slate-500">3 ordenes superan el SLA operativo.</p>
                </div>
                <div className="rounded border border-line p-3">
                  <p className="font-medium">Revisar inventario minimo</p>
                  <p className="mt-1 text-slate-500">Rodamientos y correas requieren compra.</p>
                </div>
                <div className="rounded border border-line p-3">
                  <p className="font-medium">Programar preventivos</p>
                  <p className="mt-1 text-slate-500">12 activos vencen esta semana.</p>
                </div>
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
