export const STATUS_STYLE: Record<string, string> = {
  present: "bg-emerald-100 text-emerald-700", approved: "bg-emerald-100 text-emerald-700", completed: "bg-emerald-100 text-emerald-700",
  late: "bg-amber-100 text-amber-700", pending: "bg-amber-100 text-amber-700", in_progress: "bg-blue-100 text-blue-700",
  absent: "bg-rose-100 text-rose-700", rejected: "bg-rose-100 text-rose-700", on_leave: "bg-slate-100 text-slate-700",
  urgent: "bg-rose-100 text-rose-700", high: "bg-amber-100 text-amber-700", medium: "bg-blue-100 text-blue-700", low: "bg-slate-100 text-slate-700",
};

export function Chip({ v }: { v: string }) {
  return <span className={`chip capitalize ${STATUS_STYLE[v] ?? "bg-slate-100"}`}>{v.replace("_", " ")}</span>;
}

export function Kpi({ label, value, tone }: { label: string; value: number | string; tone: string }) {
  return (
    <div className="card">
      <p className="text-xs font-medium uppercase tracking-wide text-primary-700">{label}</p>
      <p className={`mt-1 text-3xl font-bold tabular-nums ${tone}`}>{value}</p>
    </div>
  );
}

export const money = (n: number) => new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", maximumFractionDigits: 0 }).format(n || 0);
export const todayISO = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Karachi" });
