"use client";
import { useCallback, useEffect, useState } from "react";
import AppShell, { ManagerOnly, useProfile } from "@/components/AppShell";
import { Chip, Kpi, money } from "@/components/ui";
import { supabase } from "@/lib/supabase";

function Body() {
  const p = useProfile()!;
  const [salary, setSalary] = useState<any[]>([]);
  const [mine, setMine] = useState<any[]>([]);
  const [pending, setPending] = useState<any[]>([]);
  const [amount, setAmount] = useState(""), [reason, setReason] = useState("");

  const load = useCallback(async () => {
    const [{ data: s }, { data: m }, { data: q }] = await Promise.all([
      supabase.from("salaries").select("*").eq("user_id", p.id).order("pay_period", { ascending: false }),
      supabase.from("advance_salary_requests").select("*").eq("user_id", p.id).order("requested_at", { ascending: false }),
      supabase.from("advance_salary_requests").select("*, users!advance_salary_requests_user_id_fkey(name)").eq("status", "pending"),
    ]);
    setSalary(s ?? []); setMine(m ?? []); setPending((q ?? []).filter((x) => x.user_id !== p.id));
  }, [p.id]);
  useEffect(() => { load(); }, [load]);

  async function request(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("advance_salary_requests").insert({ user_id: p.id, amount: Number(amount), reason });
    if (error) return alert(error.message);
    setAmount(""); setReason(""); load();
  }
  async function decide(id: string, status: "approved" | "rejected") {
    await supabase.from("advance_salary_requests").update({ status, director_approval: p.id }).eq("id", id); load();
  }

  const cur = salary[0];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi label="Base salary" value={money(cur?.base_salary)} tone="" />
        <Kpi label="Deductions" value={money(cur?.deductions)} tone="text-danger" />
        <Kpi label="Bonuses" value={money(cur?.bonuses)} tone="text-success" />
        <Kpi label={`Net pay ${cur?.pay_period ?? ""}`} value={money(cur?.net_pay)} tone="text-accent" />
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <form onSubmit={request} className="card space-y-3">
          <h2 className="font-display font-semibold">Request advance salary</h2>
          <input className="input" type="number" min="1" placeholder="Amount (PKR)" value={amount} onChange={(e) => setAmount(e.target.value)} required />
          <textarea className="input min-h-[80px] py-2" placeholder="Reason" value={reason} onChange={(e) => setReason(e.target.value)} required />
          <button className="btn-primary w-full">Submit request</button>
          <ul className="divide-y divide-line text-sm">{mine.map((r) => (
            <li key={r.id} className="flex justify-between py-2"><span>{money(r.amount)}</span><span className="text-primary-700">{new Date(r.requested_at).toLocaleDateString()}</span><Chip v={r.status} /></li>
          ))}</ul>
        </form>
        <ManagerOnly>
          <section className="card">
            <h2 className="font-display font-semibold mb-3">Pending approvals</h2>
            {pending.length === 0 && <p className="text-sm text-primary-700">Nothing to approve.</p>}
            {pending.map((r) => (
              <div key={r.id} className="border-t border-line py-3">
                <p className="font-medium">{r.users?.name} · {money(r.amount)}</p>
                <p className="text-sm text-primary-700">{r.reason}</p>
                <div className="flex gap-2 mt-2">
                  <button className="btn-primary" onClick={() => decide(r.id, "approved")}>Approve</button>
                  <button className="btn-danger" onClick={() => decide(r.id, "rejected")}>Reject</button>
                </div>
              </div>
            ))}
          </section>
        </ManagerOnly>
      </div>
    </div>
  );
}

export default function Page() { return <AppShell title="Payroll"><Body /></AppShell>; }
