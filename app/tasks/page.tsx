"use client";
import { useCallback, useEffect, useState } from "react";
import { Paperclip, Send } from "lucide-react";
import AppShell, { ManagerOnly, useProfile } from "@/components/AppShell";
import { Chip } from "@/components/ui";
import { supabase, uploadFile, signedUrl } from "@/lib/supabase";

function Composer({ onCreated }: { onCreated: () => void }) {
  const p = useProfile()!;
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);
  const [f, setF] = useState({ title: "", description: "", assigned_to_type: "all", assigned_to_user_id: "", priority: "medium" });
  const [file, setFile] = useState<File | null>(null);
  useEffect(() => { supabase.from("users").select("id,name").order("name").then(({ data }) => setUsers(data ?? [])); }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const image_attachment_url = file ? await uploadFile("task-attachments", file) : null;
    const { error } = await supabase.from("director_instructions_and_tasks").insert({
      ...f, created_by: p.id, image_attachment_url,
      assigned_to_user_id: f.assigned_to_type === "individual" ? f.assigned_to_user_id : null,
    });
    if (error) return alert(error.message);
    setF({ ...f, title: "", description: "" }); setFile(null); onCreated();
  }

  return (
    <form onSubmit={submit} className="card space-y-3">
      <h2 className="font-display font-semibold">Broadcast instruction</h2>
      <input className="input" placeholder="Title" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} required />
      <textarea className="input min-h-[96px] py-2" placeholder="Description" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
      <div className="grid sm:grid-cols-3 gap-2">
        <select className="input" value={f.assigned_to_type} onChange={(e) => setF({ ...f, assigned_to_type: e.target.value })}>
          <option value="all">All employees</option><option value="individual">Individual</option>
        </select>
        {f.assigned_to_type === "individual" && (
          <select className="input" required value={f.assigned_to_user_id} onChange={(e) => setF({ ...f, assigned_to_user_id: e.target.value })}>
            <option value="">Select employee</option>{users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        )}
        <select className="input" value={f.priority} onChange={(e) => setF({ ...f, priority: e.target.value })}>
          {["low", "medium", "high", "urgent"].map((x) => <option key={x}>{x}</option>)}
        </select>
      </div>
      <label className="btn-ghost w-full cursor-pointer"><Paperclip size={16} />{file ? file.name : "Attach image / document"}
        <input type="file" hidden accept="image/*,.pdf,.doc,.docx" onChange={(e) => setFile(e.target.files?.[0] ?? null)} /></label>
      <button className="btn-primary w-full">Send</button>
    </form>
  );
}

function TaskCard({ t }: { t: any }) {
  const p = useProfile()!;
  const [open, setOpen] = useState(false);
  const [thread, setThread] = useState<any[]>([]);
  const [text, setText] = useState(""), [file, setFile] = useState<File | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase.from("task_feedbacks_and_worksheets").select("*, users(name)").eq("task_id", t.id).order("submitted_at");
    setThread(data ?? []);
  }, [t.id]);
  useEffect(() => {
    if (!open) return; load();
    const ch = supabase.channel(`fb-${t.id}`).on("postgres_changes", { event: "INSERT", schema: "public", table: "task_feedbacks_and_worksheets", filter: `task_id=eq.${t.id}` }, load).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [open, load, t.id]);

  async function send() {
    if (!text && !file) return;
    const worksheet_attachment_url = file ? await uploadFile("worksheets", file) : null;
    await supabase.from("task_feedbacks_and_worksheets").insert({ task_id: t.id, user_id: p.id, feedback_text: text, worksheet_attachment_url });
    setText(""); setFile(null); load();
  }
  const openFile = async (bucket: string, path: string) => { const u = await signedUrl(bucket, path); if (u) window.open(u); };

  return (
    <article className="card">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-semibold flex-1">{t.title}</h3><Chip v={t.priority} /><Chip v={t.status} />
      </div>
      <p className="text-sm text-primary-700 mt-1">{t.description}</p>
      <p className="text-xs text-slate-400 mt-2">{t.assigned_to_type === "all" ? "Everyone" : t.assignee?.name} · {new Date(t.created_at).toLocaleString()}</p>
      {t.image_attachment_url && <button className="text-sm text-accent mt-2" onClick={() => openFile("task-attachments", t.image_attachment_url)}>📎 View attachment</button>}
      <button className="block text-sm font-medium text-accent mt-3" onClick={() => setOpen(!open)}>{open ? "Hide" : "Submissions & feedback"}</button>
      {open && (
        <div className="mt-3 space-y-3">
          {thread.map((m) => (
            <div key={m.id} className="rounded-lg bg-surface p-3 text-sm">
              <p className="font-medium">{m.users?.name}</p>
              {m.feedback_text && <p>{m.feedback_text}</p>}
              {m.worksheet_attachment_url && <button className="text-accent" onClick={() => openFile("worksheets", m.worksheet_attachment_url)}>📎 Worksheet</button>}
            </div>
          ))}
          <div className="flex gap-2">
            <input className="input" placeholder="Write feedback…" value={text} onChange={(e) => setText(e.target.value)} />
            <label className="btn-ghost cursor-pointer" aria-label="Attach worksheet"><Paperclip size={16} /><input type="file" hidden onChange={(e) => setFile(e.target.files?.[0] ?? null)} /></label>
            <button className="btn-primary" onClick={send} aria-label="Send"><Send size={16} /></button>
          </div>
          {file && <p className="text-xs text-primary-700">Attached: {file.name}</p>}
          {t.assigned_to_user_id === p.id && t.status !== "completed" && (
            <button className="btn-ghost" onClick={async () => { await supabase.from("director_instructions_and_tasks").update({ status: "completed" }).eq("id", t.id); location.reload(); }}>Mark completed</button>
          )}
        </div>
      )}
    </article>
  );
}

function Body() {
  const [tasks, setTasks] = useState<any[]>([]);
  const load = useCallback(async () => {
    const { data } = await supabase.from("director_instructions_and_tasks")
      .select("*, assignee:users!director_instructions_and_tasks_assigned_to_user_id_fkey(name)").order("created_at", { ascending: false });
    setTasks(data ?? []);
  }, []);
  useEffect(() => { load(); }, [load]);
  return (
    <div className="grid lg:grid-cols-3 gap-4">
      <ManagerOnly><div className="lg:col-span-1"><Composer onCreated={load} /></div></ManagerOnly>
      <div className="lg:col-span-2 space-y-4">
        {tasks.length === 0 && <p className="card text-sm text-primary-700">No instructions yet.</p>}
        {tasks.map((t) => <TaskCard key={t.id} t={t} />)}
      </div>
    </div>
  );
}

export default function Page() { return <AppShell title="Tasks & Instructions"><Body /></AppShell>; }
