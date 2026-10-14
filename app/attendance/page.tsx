"use client";
import { useCallback, useEffect, useState } from "react";
import AppShell, { useProfile } from "@/components/AppShell";
import FaceCheckIn from "@/components/FaceCheckIn";
import { Chip, todayISO } from "@/components/ui";
import { supabase } from "@/lib/supabase";

function Body() {
  const p = useProfile()!;
  const [history, setHistory] = useState<any[]>([]);
  const [warnings, setWarnings] = useState<any[]>([]);
  const load = useCallback(async () => {
    const [{ data: h }, { data: w }] = await Promise.all([
      supabase.from("attendance").select("*").eq("user_id", p.id).order("date", { ascending: false }).limit(30),
      supabase.from("warnings").select("*").eq("user_id", p.id).order("created_at", { ascending: false }),
    ]);
    setHistory(h ?? []); setWarnings(w ?? []);
  }, [p.id]);
  useEffect(() => { load(); }, [load]);
  const today = history.find((h) => h.date === todayISO()) ?? null;

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <FaceCheckIn userId={p.id} today={today} onDone={load} />
      <div className="space-y-4">
        <section className="card">
          <h2 className="font-display font-semibold mb-3">My history</h2>
          <ul className="divide-y divide-line text-sm">{history.map((h) => (
            <li key={h.id} className="flex justify-between py-2"><span>{h.date}</span><span>{new Date(h.timestamp).toLocaleTimeString()}</span><Chip v={h.status} /></li>
          ))}</ul>
        </section>
        <section className="card">
          <h2 className="font-display font-semibold mb-3">Warning history</h2>
          {warnings.length === 0 ? <p className="text-sm text-primary-700">No warnings. Keep it up!</p> :
            <ul className="space-y-2 text-sm">{warnings.map((w) => (
              <li key={w.id} className="border-l-4 border-danger pl-3"><p className="font-medium capitalize">{w.warning_type.replace("_", " ")}</p><p className="text-primary-700">{w.message}</p></li>
            ))}</ul>}
        </section>
      </div>
    </div>
  );
}

export default function Page() { return <AppShell title="Attendance"><Body /></AppShell>; }
