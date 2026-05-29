import {
  AlertTriangle,
  ClipboardList,
  Gauge,
  Package,
  QrCode,
  Settings,
  Users,
  Wrench,
} from "lucide-react";

export const dynamic = "force-dynamic";

const navItems = [
  { label: "Dashboard", icon: Gauge },
  { label: "Equipos", icon: QrCode },
  { label: "Ordenes", icon: ClipboardList },
  { label: "Preventivos", icon: Wrench },
  { label: "Repuestos", icon: Package },
  { label: "Personal", icon: Users },
  { label: "Alertas", icon: AlertTriangle },
  { label: "Ajustes", icon: Settings },
];

type DashboardSummary = {
  metrics: {
    openWorkOrders: number;
    criticalWorkOrders: number;
    preventiveCompliance: number;
    assetsActive: number;
    assetsInMaintenance: number;
    lowStockItems: number;
    urgentLowStockItems: number;
  };
  recentWorkOrders: {
    id: string;
    number: string;
    title: string;
    type: string;
    priority: string;
    status: string;
    asset: {
      id: string;
      code: string;
      name: string;
    };
    assignedTechnician: {
      id: string;
      name: string;
      email: string;
    } | null;
    updatedAt: string;
  }[];
  priorities: {
    title: string;
    detail: string;
    severity: string;
  }[];
};

type DashboardState = {
  data: DashboardSummary;
  isConnected: boolean;
  message?: string;
};

const emptyDashboard: DashboardSummary = {
  metrics: {
    openWorkOrders: 0,
    criticalWorkOrders: 0,
    preventiveCompliance: 0,
    assetsActive: 0,
    assetsInMaintenance: 0,
    lowStockItems: 0,
    urgentLowStockItems: 0,
  },
  recentWorkOrders: [],
  priorities: [
    {
      title: "Dashboard sin conexion",
      detail: "No fue posible cargar datos reales desde la API.",
      severity: "warning",
    },
  ],
};

const priorityLabels: Record<string, string> = {
  LOW: "Baja",
  MEDIUM: "Media",
  HIGH: "Alta",
  CRITICAL: "Critica",
};

const statusLabels: Record<string, string> = {
  DRAFT: "Borrador",
  OPEN: "Abierta",
  ASSIGNED: "Asignada",
  IN_PROGRESS: "En progreso",
  ON_HOLD: "En espera",
  COMPLETED: "Cerrada",
  CANCELLED: "Cancelada",
};

const getApiBaseUrl = () =>
  process.env.API_INTERNAL_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:4000/api";

const getDashboardToken = async () => {
  const email = process.env.DASHBOARD_ADMIN_EMAIL;
  const password = process.env.DASHBOARD_ADMIN_PASSWORD;

  if (!email || !password) {
    return null;
  }

  const response = await fetch(`${getApiBaseUrl()}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  const session = (await response.json()) as { accessToken?: string };
  return session.accessToken ?? null;
};

const getDashboardData = async (): Promise<DashboardState> => {
  try {
    const token = await getDashboardToken();

    if (!token) {
      return {
        data: emptyDashboard,
        isConnected: false,
        message:
          "Configura credenciales de dashboard para consultar la API protegida.",
      };
    }

    const response = await fetch(`${getApiBaseUrl()}/reports/summary`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    if (!response.ok) {
      return {
        data: emptyDashboard,
        isConnected: false,
        message: `La API respondio ${response.status}.`,
      };
    }

    return {
      data: (await response.json()) as DashboardSummary,
      isConnected: true,
    };
  } catch {
    return {
      data: emptyDashboard,
      isConnected: false,
      message: "La API no esta disponible en este momento.",
    };
  }
};

const buildMetrics = (summary: DashboardSummary) => [
  {
    label: "Ordenes abiertas",
    value: String(summary.metrics.openWorkOrders),
    note: `${summary.metrics.criticalWorkOrders} criticas`,
  },
  {
    label: "Cumplimiento preventivo",
    value: `${summary.metrics.preventiveCompliance}%`,
    note: "Calculado con ordenes preventivas del mes",
  },
  {
    label: "Equipos activos",
    value: String(summary.metrics.assetsActive),
    note: `${summary.metrics.assetsInMaintenance} en mantenimiento`,
  },
  {
    label: "Repuestos bajos",
    value: String(summary.metrics.lowStockItems),
    note: `${summary.metrics.urgentLowStockItems} agotados`,
  },
];

export default async function Home() {
  const dashboard = await getDashboardData();
  const metrics = buildMetrics(dashboard.data);

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
                      ? "bg-brand text-white"
                      : "text-slate-600 hover:bg-field hover:text-ink"
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
              <h1 className="text-2xl font-semibold tracking-normal">
                Centro de mantenimiento
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Vista operacional para activos, ordenes, preventivos e
                inventario.
              </p>
              {!dashboard.isConnected ? (
                <p className="mt-2 text-sm text-amber-700">
                  {dashboard.message}
                </p>
              ) : null}
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
              <article
                key={metric.label}
                className="rounded border border-line bg-white p-4"
              >
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
                    {dashboard.data.recentWorkOrders.map((workOrder) => (
                      <tr key={workOrder.id} className="border-t border-line">
                        <td className="px-4 py-3">{workOrder.number}</td>
                        <td className="px-4 py-3">
                          <span className="block font-medium">
                            {workOrder.asset.name}
                          </span>
                          <span className="text-xs text-slate-500">
                            {workOrder.title}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {priorityLabels[workOrder.priority] ??
                            workOrder.priority}
                        </td>
                        <td className="px-4 py-3">
                          {statusLabels[workOrder.status] ?? workOrder.status}
                        </td>
                      </tr>
                    ))}
                    {dashboard.data.recentWorkOrders.length === 0 ? (
                      <tr className="border-t border-line">
                        <td className="px-4 py-6 text-slate-500" colSpan={4}>
                          No hay ordenes de trabajo registradas.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="rounded border border-line bg-white p-4">
              <h2 className="text-base font-semibold">Prioridades del dia</h2>
              <div className="mt-4 grid gap-3 text-sm">
                {dashboard.data.priorities.map((priority) => (
                  <div
                    key={`${priority.title}-${priority.detail}`}
                    className="rounded border border-line p-3"
                  >
                    <p className="font-medium">{priority.title}</p>
                    <p className="mt-1 text-slate-500">{priority.detail}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
