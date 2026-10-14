"use client";
import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { supabase } from "@/lib/supabase";

type N = { id: string; title: string; message: string | null; is_read: boolean; created_at: string };

export default function NotificationBell({ userId }: { userId: string }) {
  const [items, setItems] = useState<N[]>([]);
  const [open, setOpen] = useState(false);
  const unread = items.filter((i) => !i.is_read).length;

  useEffect(() => {
    supabase.from("in_app_notifications").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(20)
      .then(({ data }) => setItems(data ?? []));
    const ch = supabase.channel(`notif-${userId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "in_app_notifications", filter: `user_id=eq.${userId}` },
        (p) => setItems((prev) => [p.new as N, ...prev].slice(0, 20)))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [userId]);

  async function markAll() {
    await supabase.from("in_app_notifications").update({ is_read: true }).eq("user_id", userId).eq("is_read", false);
    setItems((p) => p.map((i) => ({ ...i, is_read: true })));
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="relative h-11 w-11 grid place-items-center rounded-full hover:bg-surface" aria-label="Notifications">
        <Bell size={20} />
        {unread > 0 && <span className="absolute top-1 right-1 min-w-[18px] h-[18px] rounded-full bg-danger text-white text-[10px] font-bold grid place-items-center">{unread > 9 ? "9+" : unread}</span>}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[90vw] card p-0 overflow-hidden">
          <div className="flex justify-between items-center p-3 border-b border-line">
            <span className="font-semibold text-sm">Notifications</span>
            <button onClick={markAll} className="text-xs text-accent">Mark all read</button>
          </div>
          <ul className="max-h-96 overflow-auto">
            {items.length === 0 && <li className="p-4 text-sm text-primary-700">You're all caught up.</li>}
            {items.map((n) => (
              <li key={n.id} className={`p-3 border-b border-line text-sm ${n.is_read ? "" : "bg-accent-50"}`}>
                <p className="font-medium">{n.title}</p>
                {n.message && <p className="text-primary-700 text-xs">{n.message}</p>}
                <p className="text-[11px] text-slate-400 mt-1">{new Date(n.created_at).toLocaleString()}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
