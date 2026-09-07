import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "../integrations/supabase/client";

export const Route = createFileRoute("/admin")({ component: AdminPage });

type Vlog = { id: string; title: string; media_url: string; is_visible: boolean; is_featured: boolean; sort_order: number };

function AdminPage() {
  const [session, setSession] = useState<boolean | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [vlogs, setVlogs] = useState<Vlog[]>([]);

  const load = async () => {
    const { data } = await supabase.auth.getSession();
    setSession(Boolean(data.session));
    if (data.session) {
      const result = await supabase.from("vlogs").select("id,title,media_url,is_visible,is_featured,sort_order").order("sort_order");
      if (result.data) setVlogs(result.data as Vlog[]);
    }
  };

  useEffect(() => { void load(); }, []);

  const login = async (event: React.FormEvent) => {
    event.preventDefault(); setError("");
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) { setError("Invalid email or password."); return; }
    await load();
  };

  if (session === null) return <main className="admin-shell"><p>Loading admin…</p></main>;
  if (!session) return <main className="admin-shell"><section className="admin-card"><p className="eyebrow">Faith Ekuase CMS</p><h1>Admin sign in</h1><p>Manage the content that appears on the public website.</p><form onSubmit={login} className="admin-form"><label>Email<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></label><label>Password<input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} /></label>{error && <p className="admin-error">{error}</p>}<button className="button-primary" type="submit">Sign in</button></form></section></main>;

  return <main className="admin-shell"><header className="admin-header"><div><p className="eyebrow">Faith Ekuase CMS</p><h1>Website dashboard</h1></div><button className="button-secondary" onClick={async () => { await supabase.auth.signOut(); setSession(false); }}>Log out</button></header><section className="admin-grid"><article className="admin-card"><p className="eyebrow">Overview</p><h2>{vlogs.filter((v) => v.is_visible && v.media_url).length} published vlogs</h2><p>{vlogs.filter((v) => !v.media_url).length} awaiting upload</p></article><article className="admin-card"><p className="eyebrow">Vlogs</p>{vlogs.map((v) => <div className="admin-row" key={v.id}><div><strong>{v.title}</strong><span>{v.media_url ? "Uploaded" : "Awaiting upload"}</span></div><span>{v.is_featured ? "Featured" : "Draft"}</span></div>)}</article></section></main>;
}
