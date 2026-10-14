"use client";
import { useCallback, useEffect, useState } from "react";
import AppShell, { ManagerOnly, useProfile } from "@/components/AppShell";
import { Chip } from "@/components/ui";
import { supabase } from "@/lib/supabase";

function Leaves() {
  const p = useProfile()!;
  const [list, setList] = useState<any[]>([]);
  const [f, setF] = useState({ leave_type: "casual", start_date: "", end_date: "", reason: "" });
  const load = useCallback(async () => {
    const { data } = await supabase.from("leave_requests").select("*, users(name)").order("created_at", { ascending: false });
    setList(data ?? []);
  }, []);
  useEffect(() => { load(); }, [load]);
  async function apply(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("leave_requests").insert({ ...f, user_id: p.id });
    if (error) return alert(error.message);
    setF({ ...f, start_date: "", end_date: "", reason: "" }); load();
  }
  const decide = async (id: string, status: string) => { await supabase.from("leave_requests").update({ status }).eq("id", id); load(); };

  return (
    <section className="card space-y-3">
      <h2 className="font-display font-semibold">Leave requests</h2>
      <form onSubmit={apply} className="grid sm:grid-cols-2 gap-2">
        <select className="input" value={f.leave_type} onChange={(e) => setF({ ...f, leave_type: e.target.value })}>
          <option value="sick">Sick</option><option value="casual">Casual</option><option value="annual">Annual</option>
        </select>
        <input className="input" placeholder="Reason" value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} />
        <input className="input" type="date" required value={f.start_date} onChange={(e) => setF({ ...f, start_date: e.target.value })} />
        <input className="input" type="date" required value={f.end_date} onChange={(e) => setF({ ...f, end_date: e.target.value })} />
        <button className="btn-primary sm:col-span-2">Apply for leave</button>
      </form>
      <ul className="divide-y divide-line text-sm">{list.map((l) => (
        <li key={l.id} className="py-2 flex flex-wrap items-center gap-2">
          <span className="font-medium flex-1">{l.users?.name} · <span className="capitalize">{l.leave_type}</span> · {l.start_date} → {l.end_date}</span>
          <Chip v={l.status} />
          {l.status === "pending" && l.user_id !== p.id && (
            <ManagerOnly>
              <button className="btn-primary !min-h-[36px]" onClick={() => decide(l.id, "approved")}>Approve</button>
              <button className="btn-danger !min-h-[36px]" onClick={() => decide(l.id, "rejected")}>Reject</button>
            </ManagerOnly>
          )}
        </li>
      ))}</ul>
    </section>
  );
}

function Holidays() {
  const [list, setList] = useState<any[]>([]);
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [f, setF] = useState({ name: "", date: "" });
  const load = useCallback(async () => { const { data } = await supabase.from("holidays").select("*").order("date"); setList(data ?? []); }, []);
  useEffect(() => { load(); }, [load]);
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const offset = month.getDay();
  const key = (d: number) => `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const shift = (n: number) => setMonth(new Date(month.getFullYear(), month.getMonth() + n, 1));

  return (
    <section className="card space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-semibold">Holiday calendar</h2>
        <div className="flex items-center gap-2 text-sm">
          <button className="btn-ghost !min-h-[36px]" onClick={() => shift(-1)}>‹</button>
          <span className="w-28 text-center">{month.toLocaleString("en", { month: "long", year: "numeric" })}</span>
          <button className="btn-ghost !min-h-[36px]" onClick={() => shift(1)}>›</button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => <div key={i} className="text-primary-700 font-semibold">{d}</div>)}
        {Array.from({ length: offset }).map((_, i) => <div key={"e" + i} />)}
        {Array.from({ length: days }, (_, i) => i + 1).map((d) => {
          const h = list.find((x) => x.date === key(d));
          return <div key={d} title={h?.name} className={`aspect-square grid place-items-center rounded-lg ${h ? "bg-danger text-white font-bold" : "bg-surface"}`}>{d}</div>;
        })}
      </div>
      <ManagerOnly>
        <form className="flex gap-2" onSubmit={async (e) => { e.preventDefault(); await supabase.from("holidays").insert(f); setF({ name: "", date: "" }); load(); }}>
          <input className="input" placeholder="Holiday name" required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          <input className="input" type="date" required value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} />
          <button className="btn-primary">Add</button>
        </form>
      </ManagerOnly>
    </section>
  );
}

function Shifts() {
  const [list, setList] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [f, setF] = useState({ name: "", start_time: "09:00", end_time: "17:00", grace_period_mins: 15 });
  const load = useCallback(async () => {
    const [{ data: s }, { data: u }] = await Promise.all([supabase.from("shifts").select("*").order("start_time"), supabase.from("users").select("id,name,shift_id").order("name")]);
    setList(s ?? []); setUsers(u ?? []);
  }, []);
  useEffect(() => { load(); }, [load]);
  return (
    <section className="card space-y-3">
      <h2 className="font-display font-semibold">Shifts</h2>
      <ul className="text-sm divide-y divide-line">{list.map((s) => (
        <li key={s.id} className="py-2 flex justify-between"><span className="font-medium">{s.name}</span><span>{s.start_time.slice(0, 5)} – {s.end_time.slice(0, 5)} · grace {s.grace_period_mins}m</span></li>
      ))}</ul>
      <form className="grid grid-cols-2 sm:grid-cols-5 gap-2" onSubmit={async (e) => { e.preventDefault(); await supabase.from("shifts").insert(f); load(); }}>
        <input className="input col-span-2 sm:col-span-1" placeholder="Name" required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        <input className="input" type="time" value={f.start_time} onChange={(e) => setF({ ...f, start_time: e.target.value })} />
        <input className="input" type="time" value={f.end_time} onChange={(e) => setF({ ...f, end_time: e.target.value })} />
        <input className="input" type="number" min="0" value={f.grace_period_mins} onChange={(e) => setF({ ...f, grace_period_mins: Number(e.target.value) })} />
        <button className="btn-primary">Add shift</button>
      </form>
      <h3 className="font-semibold text-sm pt-2">Assign employees</h3>
      <ul className="text-sm space-y-2">{users.map((u) => (
        <li key={u.id} className="flex items-center gap-2"><span className="flex-1">{u.name}</span>
          <select className="input !w-44" value={u.shift_id ?? ""} onChange={async (e) => { await supabase.from("users").update({ shift_id: e.target.value || null }).eq("id", u.id); load(); }}>
            <option value="">No shift</option>{list.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select></li>
      ))}</ul>
    </section>
  );
}

function Warnings() {
  const [list, setList] = useState<any[]>([]);
  useEffect(() => { supabase.from("warnings").select("*, users!warnings_user_id_fkey(name)").order("created_at", { ascending: false }).limit(100).then(({ data }) => setList(data ?? [])); }, []);
  return (
    <section className="card">
      <h2 className="font-display font-semibold mb-3">Warning history</h2>
      <ul className="text-sm divide-y divide-line">{list.map((w) => (
        <li key={w.id} className="py-2 flex flex-wrap gap-2 justify-between"><span className="font-medium">{w.users?.name}</span><span className="capitalize text-danger">{w.warning_type.replace("_", " ")}</span><span className="text-primary-700">{new Date(w.created_at).toLocaleDateString()}</span></li>
      ))}</ul>
    </section>
  );
}

export default function Page() {
  return (
    <AppShell title="Leaves & HR">
      <div className="grid lg:grid-cols-2 gap-4">
        <Leaves />
        <Holidays />
        <ManagerOnly><Shifts /></ManagerOnly>
        <ManagerOnly><Warnings /></ManagerOnly>
      </div>
    </AppShell>
  );
}
