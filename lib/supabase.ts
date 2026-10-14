"use client";
import { createBrowserClient } from "@supabase/ssr";

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export type Role = "director" | "hr" | "employee";
export type Profile = { id: string; email: string; name: string; avatar_url: string | null; department: string | null; shift_id: string | null; role: Role };

export async function getProfile(): Promise<Profile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("users_with_role").select("*").eq("id", user.id).single();
  return data as Profile;
}

export const isManager = (p?: Profile | null) => p?.role === "director" || p?.role === "hr";

export async function uploadFile(bucket: "task-attachments" | "worksheets" | "avatars", file: File) {
  const { data: { user } } = await supabase.auth.getUser();
  const path = `${user!.id}/${Date.now()}-${file.name.replace(/[^\w.-]/g, "_")}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file);
  if (error) throw error;
  return path; // store path; resolve with signedUrl() when displaying
}

export async function signedUrl(bucket: string, path: string) {
  const { data } = await supabase.storage.from(bucket).createSignedUrl(path, 3600);
  return data?.signedUrl;
}
