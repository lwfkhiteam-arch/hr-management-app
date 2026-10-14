"use client";
import { useCallback, useEffect, useState } from "react";
import AppShell, { ManagerOnly } from "@/components/AppShell";
import { Chip, Kpi, todayISO } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { exportCSV, exportPDF } from "@/lib/export";

type Row = { name: string; department: string | null; status: string; check_in: string; check_out: string };

export default function Dashboard() {
  const [rows, setRows] = useState<Row[]>([]);
  const [holidays, setHolidays] = useState<{ name: string; date: string }[]>([]);

  const load = useCallback(async () => {
    const d = todayISO();
    const [{ data: users }, { data: att }, { data: leaves }, { data: hol }] = await Promise.all([
      supabase.from("users").select("id,name,department"),
      supabase.from("attendance").select("*").eq("date", d),
      supabase.from("leave_requests").select("user_id").eq("status", "approved").lte("start_date", d).gte("end_date", d),
      supabase.from("holidays").select("name,date").gte("date", d).order("date").limit(5),
    ]);
    const onLeave = new Set((leaves ?? []).map((l) => l.user_id));
    setRows((users ?? []).map((u) => {
      const a = att?.find((x) => x.user_id === u.id);
      return {
        name: u.name, department: u.department,
        status: a ? a.status : onLeave.has(u.id) ? "on_leave" : "absent",
        check_in: a ? new Date(a.timestamp).toLocaleTimeString() : "—",
        check_out: a?.check_out_at ? new Date(a.check_out_at).toLocaleTimeString() : "—",
      };
    }));
    setHolidays(hol ?? []);
  }, []);

  useEffect(() => {
    load();
    const ch = supabase.channel("att-live").on("postgres_changes", { event: "*", schema: "public", table: "attendance" }, load).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load]);

  const count = (s: string) => rows.filter((r) => r.status === s).length;

  return (
    <AppShell title="Dashboard">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi label="Present" value={count("present")} tone="text-success" />
        <Kpi label="Late" value={count("late")} tone="text-warning" />
        <Kpi label="On leave" value={count("on_leave")} tone="text-accent" />
        <Kpi label="Absent" value={count("absent")} tone="text-danger" />
      </div>
      <div className="grid lg:grid-cols-3 gap-4 mt-4">
        <section className="card lg:col-span-2 overflow-x-auto">
          <div className="flex flex-wrap gap-2 items-center justify-between mb-3">
            <h2 className="font-display font-semibold">Live attendance · {todayISO()}</h2>
            <ManagerOnly>
              <div className="flex gap-2">
                <button className="btn-ghost" onClick={() => exportCSV(`attendance-${todayISO()}`, rows)}>CSV</button>
                <button className="btn-ghost" onClick={() => exportPDF(`Attendance ${todayISO()}`, rows)}>PDF</button>
              </div>
            </ManagerOnly>
          </div>
          <table className="w-full text-sm">
            <thead className="text-left text-primary-700"><tr><th className="py-2">Employee</th><th>Dept</th><th>Status</th><th>In</th><th>Out</th></tr></thead>
            <tbody>{rows.map((r, i) => (
              <tr key={i} className="border-t border-line"><td className="py-2 font-medium">{r.name}</td><td>{r.department ?? "—"}</td><td><Chip v={r.status} /></td><td>{r.check_in}</td><td>{r.check_out}</td></tr>
            ))}</tbody>
          </table>
        </section>
        <section className="card">
          <h2 className="font-display font-semibold mb-3">Upcoming holidays</h2>
          <ul className="space-y-2 text-sm">
            {holidays.length === 0 && <li className="text-primary-700">No upcoming holidays.</li>}
            {holidays.map((h) => <li key={h.date} className="flex justify-between"><span>{h.name}</span><span className="text-primary-700">{h.date}</span></li>)}
          </ul>
        </section>
      </div>
    </AppShell>
  );
}
