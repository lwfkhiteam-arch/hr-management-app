"use client";
import { createContext, useContext, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Fingerprint, ListChecks, Wallet, CalendarDays, ChevronsLeft, Menu, LogOut } from "lucide-react";
import { supabase, getProfile, isManager, type Profile } from "@/lib/supabase";
import NotificationBell from "./NotificationBell";

const ProfileCtx = createContext<Profile | null>(null);
export const useProfile = () => useContext(ProfileCtx);

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/attendance", label: "Attendance", icon: Fingerprint },
  { href: "/tasks", label: "Tasks", icon: ListChecks },
  { href: "/payroll", label: "Payroll", icon: Wallet },
  { href: "/hr", label: "Leaves & HR", icon: CalendarDays },
];

export default function AppShell({ title, children }: { title: string; children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [menu, setMenu] = useState(false);
  const path = usePathname(), router = useRouter();

  useEffect(() => {
    getProfile().then((p) => (p ? setProfile(p) : router.replace("/login")));
    const { data } = supabase.auth.onAuthStateChange((e) => e === "SIGNED_OUT" && router.replace("/login"));
    return () => data.subscription.unsubscribe();
  }, [router]);

  if (!profile) return <div className="min-h-screen grid place-items-center text-primary-700">Loading…</div>;

  const side = (
    <nav className="flex flex-col gap-1 p-3">
      {NAV.map(({ href, label, icon: I }) => (
        <Link key={href} href={href} onClick={() => setDrawer(false)}
          className={`flex items-center gap-3 rounded-lg px-3 min-h-[44px] text-sm font-medium ${path.startsWith(href) ? "bg-accent text-white" : "text-slate-300 hover:bg-white/10"}`}>
          <I size={20} />{!collapsed && label}
        </Link>
      ))}
    </nav>
  );

  return (
    <ProfileCtx.Provider value={profile}>
      <div className="flex min-h-screen">
        <aside className={`hidden md:flex flex-col bg-primary transition-all ${collapsed ? "w-[72px]" : "w-[260px]"}`}>
          <div className="flex items-center justify-between p-4 text-white">
            {!collapsed && <span className="font-display font-bold">OfficeHR</span>}
            <button onClick={() => setCollapsed(!collapsed)} aria-label="Collapse sidebar"><ChevronsLeft className={collapsed ? "rotate-180" : ""} /></button>
          </div>
          {side}
        </aside>
        {drawer && (
          <div className="fixed inset-0 z-40 md:hidden" onClick={() => setDrawer(false)}>
            <div className="absolute inset-0 bg-black/40" />
            <aside className="relative w-64 h-full bg-primary pt-4" onClick={(e) => e.stopPropagation()}>{side}</aside>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <header className="sticky top-0 z-30 flex items-center gap-3 bg-white border-b border-line px-4 h-16">
            <button className="md:hidden" onClick={() => setDrawer(true)} aria-label="Open menu"><Menu /></button>
            <h1 className="font-display text-lg font-bold flex-1 truncate">{title}</h1>
            <NotificationBell userId={profile.id} />
            <div className="relative">
              <button onClick={() => setMenu(!menu)} className="flex items-center gap-2">
                <img src={profile.avatar_url || `https://api.dicebear.com/9.x/initials/svg?seed=${profile.name}`} alt="" className="h-9 w-9 rounded-full object-cover" />
              </button>
              {menu && (
                <div className="absolute right-0 mt-2 w-64 card p-0 overflow-hidden">
                  <div className="p-4 border-b border-line">
                    <p className="font-semibold">{profile.name}</p>
                    <p className="text-xs text-primary-700 truncate">{profile.email}</p>
                    <span className="chip bg-accent-50 text-accent mt-2 capitalize">{profile.role}</span>
                  </div>
                  <button onClick={() => supabase.auth.signOut()} className="flex w-full items-center gap-2 p-4 text-sm text-danger hover:bg-surface"><LogOut size={16} />Sign out</button>
                </div>
              )}
            </div>
          </header>
          <main className="p-4 md:p-6 max-w-7xl mx-auto">{children}</main>
        </div>
      </div>
    </ProfileCtx.Provider>
  );
}

export function ManagerOnly({ children }: { children: React.ReactNode }) {
  return isManager(useProfile()) ? <>{children}</> : null;
}
