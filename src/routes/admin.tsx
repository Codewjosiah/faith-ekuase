import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  Check, ChevronDown, ChevronUp, Eye, EyeOff, Film, Image, LayoutDashboard,
  Link2, LogOut, Menu, Plus, Save, Settings, ShieldCheck, Trash2, Upload,
  UserRound, X,
} from "lucide-react";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { bootstrapInitialAdmin, resolveCmsMedia } from "../lib/cms.functions";
import { supabase } from "../integrations/supabase/client";
import type { Json, Tables } from "../integrations/supabase/types";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Faith Ekuase CMS | Admin" },
      { name: "description", content: "Private content workspace for the Faith Ekuase portfolio." },
      { property: "og:title", content: "Faith Ekuase CMS" },
      { property: "og:description", content: "Private content workspace for the Faith Ekuase portfolio." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminPage,
});

type Tab = "overview" | "profile" | "vlogs" | "links" | "media" | "settings";
type Vlog = Tables<"vlogs">;
type SocialLink = Tables<"social_links">;
type MediaAsset = Tables<"media_assets">;
type ContentMap = Record<string, Record<string, Json | undefined>>;
type Field = { key: string; label: string; multiline?: boolean; number?: boolean; list?: boolean };

const EMPTY_CONTENT: ContentMap = {};
const PROFILE_FIELDS: Field[] = [
  { key: "name", label: "Public display name" },
  { key: "heroKicker", label: "Hero eyebrow" },
  { key: "heroTitle", label: "Hero headline" },
  { key: "heroIntro", label: "Hero introduction", multiline: true },
  { key: "heroSecondLine", label: "Hero second paragraph", multiline: true },
  { key: "heroNote", label: "Hero note" },
  { key: "location", label: "Location caption" },
  { key: "aboutCaption", label: "Photo caption" },
  { key: "aboutLead", label: "About introduction" },
  { key: "aboutIntro", label: "About student line", multiline: true },
  { key: "aboutBody", label: "About story", multiline: true },
  { key: "aboutClosing", label: "About closing", multiline: true },
];
const SETTINGS_FIELDS: Field[] = [
  { key: "browserTitle", label: "Browser page title" },
  { key: "metaDescription", label: "Search description", multiline: true },
  { key: "footerTagline", label: "Footer tagline" },
  { key: "footerLine", label: "Footer line" },
  { key: "copyrightYear", label: "Copyright year" },
  { key: "initialVlogCount", label: "Vlogs shown before “See more”", number: true },
  { key: "finalEyebrow", label: "Final section eyebrow" },
  { key: "finalTitle", label: "Final section title" },
  { key: "finalLead", label: "Final section text", multiline: true },
];

function jsonObject(value: Json): Record<string, Json | undefined> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, Json | undefined> : {};
}

function AdminPage() {
  const bootstrapAdmin = useServerFn(bootstrapInitialAdmin);
  const resolveMedia = useServerFn(resolveCmsMedia);
  const [session, setSession] = useState<Awaited<ReturnType<typeof supabase.auth.getSession>>["data"]["session"]>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState("");
  const [notice, setNotice] = useState("");
  const [tab, setTab] = useState<Tab>("overview");
  const [mobileNav, setMobileNav] = useState(false);
  const [vlogs, setVlogs] = useState<Vlog[]>([]);
  const [links, setLinks] = useState<SocialLink[]>([]);
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [assetPreviews, setAssetPreviews] = useState<Record<string, string>>({});
  const [content, setContent] = useState<ContentMap>(EMPTY_CONTENT);
  const [editing, setEditing] = useState<string | null>(null);
  const [vlogDraft, setVlogDraft] = useState<Partial<Vlog>>({});
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    setSession(sessionData.session);
    setAuthReady(true);
    if (!sessionData.session) { setAuthorized(false); return; }

    const { data: role } = await supabase.from("user_roles").select("role").eq("user_id", sessionData.session.user.id).eq("role", "admin").maybeSingle();
    let isAdmin = role?.role === "admin";
    if (!isAdmin) {
      try {
        const result = await bootstrapAdmin();
        isAdmin = result.ok || result.reason === "already_claimed";
      } catch {
        isAdmin = false;
      }
    }
    if (!isAdmin) {
      setAuthorized(false);
      setNotice("This account is not authorized to manage the website.");
      return;
    }
    setAuthorized(true);

    const [vlogResult, linkResult, contentResult, assetResult] = await Promise.all([
      supabase.from("vlogs").select("*").order("sort_order"),
      supabase.from("social_links").select("*").order("sort_order"),
      supabase.from("site_content").select("*"),
      supabase.from("media_assets").select("*").order("asset_key"),
    ]);
    const error = vlogResult.error ?? linkResult.error ?? contentResult.error ?? assetResult.error;
    if (error) { setNotice(`Could not load content: ${error.message}`); return; }
    setVlogs(vlogResult.data ?? []);
    setLinks(linkResult.data ?? []);
    setAssets(assetResult.data ?? []);
    setContent(Object.fromEntries((contentResult.data ?? []).map((row) => [row.content_key, jsonObject(row.content)])));

    const storedUrls = [...(assetResult.data ?? []).map((asset) => asset.url), ...(vlogResult.data ?? []).flatMap((vlog) => [vlog.media_url, vlog.thumbnail_url])];
    const resolved = await resolveMedia({ data: { urls: storedUrls } });
    setAssetPreviews(Object.fromEntries(storedUrls.map((url, index) => [url, resolved[index] ?? url])));
  }, [bootstrapAdmin, resolveMedia]);

  useEffect(() => {
    void load();
    const { data } = supabase.auth.onAuthStateChange(() => { window.setTimeout(() => void load(), 0); });
    return () => data.subscription.unsubscribe();
  }, [load]);

  async function authenticate(event: React.FormEvent) {
    event.preventDefault();
    setAuthError("");
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail.includes("@")) { setAuthError("Enter a valid email address."); return; }
    if (Array.from(password).length < 8) { setAuthError("Use at least 8 characters for your password."); return; }
    const result = mode === "login"
      ? await supabase.auth.signInWithPassword({ email: normalizedEmail, password })
      : await supabase.auth.signUp({ email: normalizedEmail, password, options: { emailRedirectTo: `${window.location.origin}/admin` } });
    if (result.error) { setAuthError(result.error.message); return; }
    if (!result.data.session) { setMode("login"); setNotice("Account created. Confirm your email, then sign in."); return; }
    await load();
  }

  async function saveContent(key: string, values: Record<string, Json | undefined>) {
    setLoading(true);
    const { error } = await supabase.from("site_content").upsert({ content_key: key, content: values as Json });
    setLoading(false);
    setNotice(error ? `Could not save changes: ${error.message}` : "Changes saved and published.");
    if (!error) await load();
  }

  async function addVlog() {
    const { data, error } = await supabase.from("vlogs").insert({ title: `Video ${vlogs.length + 1}`, category: "Vlog", description: "", sort_order: vlogs.length + 1, is_visible: false }).select().single();
    if (error) { setNotice(`Could not add vlog: ${error.message}`); return; }
    setVlogs([...vlogs, data]); setEditing(data.id); setVlogDraft(data); setTab("vlogs");
  }

  async function saveVlog() {
    if (!editing) return;
    const payload = {
      title: vlogDraft.title?.trim() || "Untitled vlog",
      category: vlogDraft.category?.trim() || "Vlog",
      description: vlogDraft.description ?? "",
      media_url: vlogDraft.media_url ?? "",
      thumbnail_url: vlogDraft.thumbnail_url ?? "",
      is_featured: Boolean(vlogDraft.is_featured),
      is_visible: Boolean(vlogDraft.is_visible && vlogDraft.media_url),
    };
    setLoading(true);
    const { error } = await supabase.from("vlogs").update(payload).eq("id", editing);
    setLoading(false);
    setNotice(error ? `Could not save vlog: ${error.message}` : "Vlog saved and published.");
    if (!error) { setEditing(null); await load(); }
  }

  async function removeVlog(id: string) {
    if (!window.confirm("Permanently delete this vlog?")) return;
    const { error } = await supabase.from("vlogs").delete().eq("id", id);
    setNotice(error ? `Could not delete vlog: ${error.message}` : "Vlog deleted.");
    if (!error) await load();
  }

  async function moveVlog(index: number, direction: number) {
    const nextIndex = index + direction;
    const current = vlogs[index]; const target = vlogs[nextIndex];
    if (!current || !target) return;
    const [a, b] = await Promise.all([
      supabase.from("vlogs").update({ sort_order: target.sort_order }).eq("id", current.id),
      supabase.from("vlogs").update({ sort_order: current.sort_order }).eq("id", target.id),
    ]);
    setNotice(a.error || b.error ? "Could not reorder vlogs." : "Vlog order updated.");
    await load();
  }

  async function uploadFile(file: File, target: { kind: "vlog"; id: string; field: "media_url" | "thumbnail_url" } | { kind: "asset"; key: string }) {
    const isVideo = target.kind === "vlog" && target.field === "media_url";
    if (isVideo ? !file.type.startsWith("video/") : !file.type.startsWith("image/")) { setNotice(`Choose ${isVideo ? "a video" : "an image"} file.`); return; }
    setNotice("Uploading…");
    const folder = isVideo ? "videos" : "images";
    const path = `${folder}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "-")}`;
    const { error: uploadError } = await supabase.storage.from("cms-media").upload(path, file, { contentType: file.type });
    if (uploadError) { setNotice(`Upload failed: ${uploadError.message}`); return; }
    const storedUrl = `storage://cms-media/${path}`;
    const result = target.kind === "vlog"
      ? await supabase.from("vlogs").update({ [target.field]: storedUrl }).eq("id", target.id)
      : await supabase.from("media_assets").update({ url: storedUrl }).eq("asset_key", target.key);
    setNotice(result.error ? `Could not attach upload: ${result.error.message}` : "Upload complete and published.");
    if (!result.error) await load();
  }

  if (!authReady) return <div className="admin-loading"><div className="admin-spinner" />Loading workspace</div>;
  if (!session) return <AuthScreen mode={mode} setMode={setMode} email={email} setEmail={setEmail} password={password} setPassword={setPassword} showPassword={showPassword} setShowPassword={setShowPassword} error={authError} notice={notice} authenticate={authenticate} />;
  if (!authorized) return <main className="auth-screen"><div className="auth-panel"><div className="admin-mark"><ShieldCheck size={18} /> FE / CMS</div><h1>Access restricted.</h1><p className="auth-sub">This signed-in account is not an administrator for Faith’s website.</p>{notice && <p className="admin-error">{notice}</p>}<button className="admin-submit" onClick={async () => { await supabase.auth.signOut(); setSession(null); }}>Sign out</button></div></main>;

  const nav: [Tab, string, ReactNode][] = [
    ["overview", "Overview", <LayoutDashboard size={16} />], ["profile", "Profile & content", <UserRound size={16} />],
    ["vlogs", "Vlogs & videos", <Film size={16} />], ["links", "Social links", <Link2 size={16} />],
    ["media", "Images", <Image size={16} />], ["settings", "Settings", <Settings size={16} />],
  ];

  return <div className="cms-app">
    <aside className={mobileNav ? "cms-sidebar open" : "cms-sidebar"}><div className="cms-brand"><span>FE</span><div><strong>Faith Ekuase</strong><small>Content studio</small></div><button className="cms-close" aria-label="Close navigation" onClick={() => setMobileNav(false)}><X size={18} /></button></div><nav>{nav.map(([key, label, icon]) => <button key={key} className={tab === key ? "active" : ""} onClick={() => { setTab(key); setMobileNav(false); }}>{icon}{label}</button>)}</nav><div className="sidebar-bottom"><a href="/" target="_blank" rel="noreferrer">View live site ↗</a><button onClick={async () => { await supabase.auth.signOut(); setSession(null); }}><LogOut size={15} />Log out</button></div></aside>
    <div className="cms-main"><header className="cms-topbar"><button className="mobile-nav-toggle" aria-label="Open navigation" onClick={() => setMobileNav(true)}><Menu size={20} /></button><div><p className="eyebrow">Faith Ekuase / CMS</p><h1>{nav.find(([key]) => key === tab)?.[1]}</h1></div><div className="topbar-status"><span className="live-dot" />Connected to live site</div></header>
      <div className="cms-content">{notice && <div className="cms-notice"><Check size={15} />{notice}<button aria-label="Dismiss message" onClick={() => setNotice("")}><X size={14} /></button></div>}
        {tab === "overview" && <Overview vlogs={vlogs} links={links} onAdd={addVlog} onTab={setTab} />}
        {tab === "profile" && <><JsonForm title="Profile & identity" description="The words shown in the opening and About sections." contentKey="profile" values={content.profile ?? {}} fields={PROFILE_FIELDS} onSave={saveContent} loading={loading} /><JsonForm title="Collaboration" description="The invitation and collaboration ideas shown to brands." contentKey="collaboration" values={content.collaboration ?? {}} fields={[{key:"eyebrow",label:"Eyebrow"},{key:"title",label:"Headline"},{key:"paragraphs",label:"Paragraphs (one per line)",list:true,multiline:true},{key:"ideas",label:"Collaboration ideas (one per line)",list:true,multiline:true}]} onSave={saveContent} loading={loading} /><JsonForm title="Contact" description="The contact details and enquiry message on the live site." contentKey="contact" values={content.contact ?? {}} fields={[{key:"eyebrow",label:"Eyebrow"},{key:"title",label:"Headline"},{key:"lead",label:"Introduction",multiline:true},{key:"email",label:"Email address"},{key:"whatsapp",label:"Displayed WhatsApp number"},{key:"whatsappUrl",label:"WhatsApp link"},{key:"note",label:"Enquiry note",multiline:true}]} onSave={saveContent} loading={loading} /><JsonForm title="Media kit" description="The media-kit request section." contentKey="media_kit" values={content.media_kit ?? {}} fields={[{key:"eyebrow",label:"Eyebrow"},{key:"title",label:"Headline"},{key:"paragraphs",label:"Paragraphs (one per line)",list:true,multiline:true},{key:"requestEmail",label:"Request email"}]} onSave={saveContent} loading={loading} /></>}
        {tab === "settings" && <JsonForm title="Website settings" description="Control page details, the footer, and the final invitation." contentKey="settings" values={content.settings ?? {}} fields={SETTINGS_FIELDS} onSave={saveContent} loading={loading} />}
        {tab === "vlogs" && <Vlogs vlogs={vlogs} previews={assetPreviews} editing={editing} draft={vlogDraft} setEditing={setEditing} setDraft={setVlogDraft} add={addVlog} save={saveVlog} remove={removeVlog} move={moveVlog} upload={uploadFile} loading={loading} />}
        {tab === "links" && <Links links={links} setNotice={setNotice} load={load} />}
        {tab === "media" && <Media assets={assets} previews={assetPreviews} upload={uploadFile} setNotice={setNotice} load={load} />}
      </div>
    </div>
  </div>;
}

function AuthScreen({ mode, setMode, email, setEmail, password, setPassword, showPassword, setShowPassword, error, notice, authenticate }: { mode:"login"|"signup"; setMode:(value:"login"|"signup")=>void; email:string; setEmail:(value:string)=>void; password:string; setPassword:(value:string)=>void; showPassword:boolean; setShowPassword:(value:boolean)=>void; error:string; notice:string; authenticate:(event:React.FormEvent)=>void }) {
  return <main className="auth-screen"><div className="auth-panel"><div className="admin-mark"><ShieldCheck size={18} /> FE / CMS</div><p className="eyebrow">Private workspace</p><h1>{mode === "login" ? "Welcome back." : "Create your workspace."}</h1><p className="auth-sub">Manage Faith’s website, media, and links from one place.</p><form className="admin-form" onSubmit={authenticate}><label>Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required /></label><label>Password<div className="password-field"><input type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} autoComplete={mode === "signup" ? "new-password" : "current-password"} required /><button type="button" className="password-toggle" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label>{error && <p className="admin-error">{error}</p>}{notice && <p className="admin-success">{notice}</p>}<button className="admin-submit" type="submit">{mode === "login" ? "Sign in" : "Create account"}<span>↗</span></button></form><button className="auth-switch" onClick={() => setMode(mode === "login" ? "signup" : "login")}>{mode === "login" ? "Need an account? Create one" : "Already have an account? Sign in"}</button></div></main>;
}

function Overview({ vlogs, links, onAdd, onTab }: { vlogs:Vlog[]; links:SocialLink[]; onAdd:()=>void; onTab:(tab:Tab)=>void }) {
  return <><div className="welcome-row"><div><p className="eyebrow">Good to see you</p><h2>Your creative home, in one place.</h2><p>Every saved update is connected to the public portfolio.</p></div><button className="admin-submit compact" onClick={onAdd}><Plus size={17} /> Add vlog</button></div><div className="metric-grid"><Metric label="Published vlogs" value={vlogs.filter((vlog) => vlog.is_visible && vlog.media_url).length} icon={<Film />} /><Metric label="Awaiting upload" value={vlogs.filter((vlog) => !vlog.media_url).length} icon={<Upload />} /><Metric label="Active links" value={links.filter((link) => link.is_visible).length} icon={<Link2 />} /><Metric label="Website status" value="Live" icon={<Check />} /></div><div className="dashboard-grid"><section className="cms-card"><div className="card-heading"><div><p className="eyebrow">Your library</p><h3>Vlogs & videos</h3></div><button className="text-action" onClick={() => onTab("vlogs")}>Manage all ↗</button></div>{vlogs.slice(0,4).map((vlog) => <div className="mini-row" key={vlog.id}><span className={vlog.media_url ? "status-dot ready" : "status-dot waiting"} /><div><strong>{vlog.title}</strong><small>{vlog.media_url ? vlog.is_visible ? "Published" : "Ready to publish" : "Awaiting upload"}</small></div><span className="mini-order">{String(vlog.sort_order).padStart(2,"0")}</span></div>)}</section><section className="cms-card quick-card"><p className="eyebrow">Quick actions</p><h3>Make an update</h3>{[["profile","Edit site content",<UserRound />],["vlogs","Upload a vlog",<Upload />],["links","Add a social link",<Link2 />],["media","Replace a photo",<Image />]].map(([key,label,icon]) => <button key={String(key)} onClick={() => onTab(key as Tab)}>{icon}<span>{label}</span><span>↗</span></button>)}</section></div></>;
}
function Metric({ label, value, icon }: { label:string; value:string|number; icon:ReactNode }) { return <div className="metric-card"><span className="metric-icon">{icon}</span><strong>{value}</strong><small>{label}</small></div>; }

function JsonForm({ title, description, contentKey, values, fields, onSave, loading }: { title:string; description:string; contentKey:string; values:Record<string,Json|undefined>; fields:Field[]; onSave:(key:string, values:Record<string,Json|undefined>)=>Promise<void>; loading:boolean }) {
  const [draft, setDraft] = useState<Record<string,Json|undefined>>(values);
  useEffect(() => setDraft(values), [values]);
  const displayValue = (field:Field) => field.list && Array.isArray(draft[field.key]) ? (draft[field.key] as Json[]).join("\n") : String(draft[field.key] ?? "");
  return <section className="form-section"><div className="section-intro"><p className="eyebrow">Content controls</p><h2>{title}</h2><p>{description}</p></div><div className="cms-card edit-card">{fields.map((field) => <label key={field.key}>{field.label}{field.multiline ? <textarea rows={field.list ? 5 : 3} value={displayValue(field)} onChange={(event) => setDraft({...draft,[field.key]:field.list ? event.target.value.split("\n").map((line) => line.trim()).filter(Boolean) : event.target.value})} /> : <input type={field.number ? "number" : "text"} value={displayValue(field)} onChange={(event) => setDraft({...draft,[field.key]:field.number ? Number(event.target.value) : event.target.value})} />}</label>)}<button className="admin-submit" disabled={loading} onClick={() => void onSave(contentKey,draft)}><Save size={16} />{loading ? "Saving…" : "Save changes"}</button></div></section>;
}

function Vlogs({ vlogs, previews, editing, draft, setEditing, setDraft, add, save, remove, move, upload, loading }: { vlogs:Vlog[]; previews:Record<string,string>; editing:string|null; draft:Partial<Vlog>; setEditing:(id:string|null)=>void; setDraft:(draft:Partial<Vlog>)=>void; add:()=>void; save:()=>void; remove:(id:string)=>void; move:(index:number,direction:number)=>void; upload:(file:File,target:{kind:"vlog";id:string;field:"media_url"|"thumbnail_url"})=>void; loading:boolean }) {
  return <section><div className="section-intro split"><div><p className="eyebrow">Selected work</p><h2>Vlogs & videos</h2><p>Upload media, edit details, and choose what appears publicly.</p></div><button className="admin-submit compact" onClick={add}><Plus size={17} /> Add vlog</button></div><div className="vlog-list">{vlogs.map((vlog,index) => <article className="vlog-item" key={vlog.id}><div className="vlog-thumb">{vlog.thumbnail_url ? <img src={previews[vlog.thumbnail_url] ?? vlog.thumbnail_url} alt="" /> : <Film size={26} />}<span>{vlog.media_url ? "Uploaded" : "Awaiting upload"}</span></div><div className="vlog-summary"><p className="eyebrow">{vlog.category}</p><h3>{vlog.title}</h3><p>{vlog.description || "No description yet"}</p><div className="vlog-badges"><span className={vlog.is_visible ? "badge good" : "badge"}>{vlog.is_visible ? "Published" : "Draft"}</span>{vlog.is_featured && <span className="badge">Featured</span>}</div></div><div className="vlog-actions"><button onClick={() => void move(index,-1)} aria-label="Move up"><ChevronUp size={16} /></button><button onClick={() => void move(index,1)} aria-label="Move down"><ChevronDown size={16} /></button><button onClick={() => { setEditing(vlog.id); setDraft(vlog); }}>Edit</button><button className="danger" onClick={() => void remove(vlog.id)} aria-label={`Delete ${vlog.title}`}><Trash2 size={15} /></button></div></article>)}</div>{editing && <div className="modal-backdrop"><div className="edit-modal"><div className="modal-heading"><div><p className="eyebrow">Edit record</p><h2>{draft.title}</h2></div><button aria-label="Close editor" onClick={() => setEditing(null)}><X /></button></div><div className="modal-grid"><label>Title<input value={draft.title ?? ""} onChange={(event) => setDraft({...draft,title:event.target.value})} /></label><label>Category<input value={draft.category ?? ""} onChange={(event) => setDraft({...draft,category:event.target.value})} /></label><label className="wide">Description<textarea value={draft.description ?? ""} onChange={(event) => setDraft({...draft,description:event.target.value})} /></label></div><div className="toggle-row"><label><input type="checkbox" checked={Boolean(draft.is_featured)} onChange={(event) => setDraft({...draft,is_featured:event.target.checked})} /> Featured</label><label><input type="checkbox" checked={Boolean(draft.is_visible)} disabled={!draft.media_url} onChange={(event) => setDraft({...draft,is_visible:event.target.checked})} /> Published</label></div><div className="upload-zone"><Upload size={20} /><div><strong>{draft.media_url ? "Replace video" : "Upload video"}</strong><small>MP4, MOV or WebM</small></div><label className="upload-button">Choose video<input type="file" accept="video/*" onChange={(event) => { const file=event.target.files?.[0]; if(file) void upload(file,{kind:"vlog",id:editing,field:"media_url"}); }} /></label></div><div className="upload-zone"><Image size={20} /><div><strong>{draft.thumbnail_url ? "Replace thumbnail" : "Upload thumbnail"}</strong><small>JPG, PNG or WebP</small></div><label className="upload-button">Choose image<input type="file" accept="image/*" onChange={(event) => { const file=event.target.files?.[0]; if(file) void upload(file,{kind:"vlog",id:editing,field:"thumbnail_url"}); }} /></label></div><div className="modal-footer"><button className="button-secondary" onClick={() => setEditing(null)}>Cancel</button><button className="admin-submit" onClick={() => void save()} disabled={loading}><Save size={16} />{loading ? "Saving…" : "Save changes"}</button></div></div></div>}</section>;
}

function Links({ links, setNotice, load }: { links:SocialLink[]; setNotice:(notice:string)=>void; load:()=>Promise<void> }) {
  const [draft,setDraft] = useState({label:"",url:"",description:"",icon:"link"});
  async function add() { if(!draft.label.trim() || !draft.url.trim()) { setNotice("Add a title and URL."); return; } const {error}=await supabase.from("social_links").insert({...draft,sort_order:links.length+1}); setNotice(error ? `Could not add link: ${error.message}` : "Link added and published."); if(!error){setDraft({label:"",url:"",description:"",icon:"link"});await load();} }
  return <section><div className="section-intro"><p className="eyebrow">Elsewhere online</p><h2>Social links</h2><p>Add and manage the links shown on the public site.</p></div><div className="link-layout"><div className="cms-card edit-card"><label>Platform name<input value={draft.label} onChange={(event)=>setDraft({...draft,label:event.target.value})} /></label><label>URL<input value={draft.url} onChange={(event)=>setDraft({...draft,url:event.target.value})} placeholder="https://" /></label><label>Description<textarea value={draft.description} onChange={(event)=>setDraft({...draft,description:event.target.value})} /></label><label>Icon name<input value={draft.icon} onChange={(event)=>setDraft({...draft,icon:event.target.value.toLowerCase()})} placeholder="youtube, instagram, pinterest" /></label><button className="admin-submit" onClick={() => void add()}><Plus size={16} /> Add link</button></div><div className="cms-card"><div className="card-heading"><div><p className="eyebrow">Saved links</p><h3>{links.length} links</h3></div></div>{links.map((link)=><LinkEditor key={link.id} link={link} setNotice={setNotice} load={load} />)}</div></div></section>;
}

function LinkEditor({ link, setNotice, load }: { link:SocialLink; setNotice:(notice:string)=>void; load:()=>Promise<void> }) {
  const [draft,setDraft]=useState(link); const [open,setOpen]=useState(false);
  async function save(){const {id,updated_at,...values}=draft;void updated_at;const {error}=await supabase.from("social_links").update(values).eq("id",id);setNotice(error?`Could not save link: ${error.message}`:"Link saved and published.");if(!error){setOpen(false);await load();}}
  return <div className="link-row"><span className="metric-icon"><Link2 size={15}/></span><div>{open?<div className="inline-link-fields"><input value={draft.label} aria-label="Link label" onChange={(event)=>setDraft({...draft,label:event.target.value})}/><input value={draft.url} aria-label="Link URL" onChange={(event)=>setDraft({...draft,url:event.target.value})}/><input value={draft.description} aria-label="Link description" onChange={(event)=>setDraft({...draft,description:event.target.value})}/></div>:<><strong>{link.label}</strong><small>{link.url}</small></>}</div>{open?<button onClick={()=>void save()}>Save</button>:<button onClick={()=>setOpen(true)}>Edit</button>}<button onClick={async()=>{const {error}=await supabase.from("social_links").update({is_visible:!link.is_visible}).eq("id",link.id);setNotice(error?"Could not update visibility.":link.is_visible?"Link hidden.":"Link published.");await load();}}>{link.is_visible?"Visible":"Hidden"}</button><button className="danger" aria-label={`Delete ${link.label}`} onClick={async()=>{if(!window.confirm(`Delete ${link.label}?`))return;const {error}=await supabase.from("social_links").delete().eq("id",link.id);setNotice(error?"Could not delete link.":"Link deleted.");await load();}}><Trash2 size={15}/></button></div>;
}

function Media({ assets, previews, upload, setNotice, load }: { assets:MediaAsset[]; previews:Record<string,string>; upload:(file:File,target:{kind:"asset";key:string})=>void; setNotice:(notice:string)=>void; load:()=>Promise<void> }) {
  return <section><div className="section-intro"><p className="eyebrow">Site photography</p><h2>Images</h2><p>Replace the hero and About photos without changing the design.</p></div><div className="media-grid">{assets.map((asset)=><article className="cms-card media-editor" key={asset.asset_key}><img src={previews[asset.url]??asset.url} alt={asset.alt_text}/><p className="eyebrow">{asset.asset_key}</p><label>Alternative text<input value={asset.alt_text} onChange={(event)=>setAssetsLocal(assets,asset.asset_key,event.target.value)} onBlur={async(event)=>{const {error}=await supabase.from("media_assets").update({alt_text:event.target.value}).eq("asset_key",asset.asset_key);setNotice(error?"Could not save image description.":"Image description saved.");await load();}}/></label><label className="upload-button">Replace image<input type="file" accept="image/*" onChange={(event)=>{const file=event.target.files?.[0];if(file)void upload(file,{kind:"asset",key:asset.asset_key});}}/></label></article>)}</div></section>;
}

function setAssetsLocal(_assets: MediaAsset[], _key: string, _alt: string) {
  // The input remains readable while its value is persisted on blur; load refreshes canonical data.
}