"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isEmailAllowed, NOT_INVITED } from "@/lib/access";
import { ADMIN_EMAILS, STORAGE } from "@/lib/config";
import { getInviteList } from "@/lib/invites";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Sign in / sign up / sign out with Supabase Auth (ROADMAP A6).
// Only used when STORAGE=supabase; locally (STORAGE=file) there is no login.

type AuthResult = { ok: boolean; error?: string; message?: string } | null;

function readForm(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase().slice(0, 200);
  const password = String(formData.get("password") ?? "").slice(0, 200);
  return { email, password };
}

export async function signInAction(_prev: AuthResult, formData: FormData): Promise<AuthResult> {
  if (STORAGE !== "supabase") redirect("/");
  const { email, password } = readForm(formData);
  if (!email || !password) return { ok: false, error: "Enter your email and password." };
  if (!isEmailAllowed(email, await getInviteList(), ADMIN_EMAILS)) return { ok: false, error: NOT_INVITED };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, error: error.message };
  redirect("/");
}

export async function signUpAction(_prev: AuthResult, formData: FormData): Promise<AuthResult> {
  if (STORAGE !== "supabase") redirect("/");
  const { email, password } = readForm(formData);
  if (!email || password.length < 8) return { ok: false, error: "Use your email and a password of at least 8 characters." };
  if (password !== String(formData.get("password2") ?? "").slice(0, 200)) return { ok: false, error: "The two passwords are different. Type them again." };
  if (!isEmailAllowed(email, await getInviteList(), ADMIN_EMAILS)) return { ok: false, error: NOT_INVITED };
  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${origin}/auth/confirm` },
  });
  if (error) return { ok: false, error: error.message };
  if (data.session) redirect("/");
  return { ok: true, message: "Almost there: open the email from Supabase and click the link to confirm." };
}

export async function signOutAction(): Promise<void> {
  if (STORAGE === "supabase") {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }
  redirect("/login");
}
