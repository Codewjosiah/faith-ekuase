import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth, signInAdmin, signUpAdmin, logoutUser, hasAnyRegisteredAdmin } from "../lib/firebase";
import {
  subscribeInquiries,
  updateInquiryStatus,
  deleteInquiry,
  type Inquiry,
  subscribeVlogs,
  saveVlog,
  deleteVlog,
  seedInitialVlogsIfEmpty,
  type VlogItem,
  subscribeMediaKitRequests,
  updateMediaKitRequestStatus,
  deleteMediaKitRequest,
  type MediaKitRequestItem,
  verifyCurrentUserIsAdmin,
  subscribePortfolioContent,
  savePortfolioContent,
  DEFAULT_PORTFOLIO_CONTENT,
  type PortfolioContent,
} from "../lib/db-service";
import {
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  ExternalLink,
  FileText,
  Filter,
  Image,
  LogIn,
  LogOut,
  Mail,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  UserPlus,
  Video,
  X,
} from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Portal | Faith Ekuase" },
      { name: "description", content: "Creator portfolio management and administrative controls" },
    ],
  }),
  component: AdminDashboard,
});

function AdminDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [hasAdminRegistered, setHasAdminRegistered] = useState(false);

  // Authentication form state
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authConfirmPass, setAuthConfirmPass] = useState("");
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Dashboard tab
  const [activeTab, setActiveTab] = useState<
    "overview" | "visuals" | "vlogs" | "inquiries" | "mediakit" | "system"
  >("overview");

  // Inquiries state
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [inquiriesFilter, setInquiriesFilter] = useState<string>("all");
  const [inquirySearch, setInquirySearch] = useState<string>("");

  // Vlogs state
  const [vlogs, setVlogs] = useState<VlogItem[]>([]);
  const [editingVlog, setEditingVlog] = useState<Partial<VlogItem> | null>(null);
  const [isVlogModalOpen, setIsVlogModalOpen] = useState(false);
  const [vlogSaving, setVlogSaving] = useState(false);

  // Media kit state
  const [mediaKitRequests, setMediaKitRequests] = useState<MediaKitRequestItem[]>([]);

  // Portfolio Visuals state (Hero, Polaroid, Modelling Gallery)
  const [portfolioContent, setPortfolioContent] =
    useState<PortfolioContent>(DEFAULT_PORTFOLIO_CONTENT);
  const [visualsSaving, setVisualsSaving] = useState(false);
  const [newModellingUrl, setNewModellingUrl] = useState("");
  const [newModellingCaption, setNewModellingCaption] = useState("");

  // Action status toast
  const [statusNotice, setStatusNotice] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setStatusNotice({ message, type });
    setTimeout(() => setStatusNotice(null), 4000);
  };

  useEffect(() => {
    // Check if an admin account is already registered
    hasAnyRegisteredAdmin().then((hasAdmin) => {
      setHasAdminRegistered(hasAdmin);
      if (!hasAdmin) {
        setAuthMode("signup");
      }
    });

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const adminCheck = await verifyCurrentUserIsAdmin();
        setIsAdmin(adminCheck);
      } else {
        setIsAdmin(false);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Subscriptions when admin is authenticated
  useEffect(() => {
    if (!isAdmin) return;

    const unsubInquiries = subscribeInquiries(
      (data) => setInquiries(data),
      (err) => console.error("Inquiries sync error:", err),
    );

    const unsubVlogs = subscribeVlogs(
      (data) => {
        setVlogs(data);
        if (data.length === 0) {
          seedInitialVlogsIfEmpty();
        }
      },
      (err) => console.error("Vlogs sync error:", err),
    );

    const unsubMediaKit = subscribeMediaKitRequests(
      (data) => setMediaKitRequests(data),
      (err) => console.error("Media kit requests sync error:", err),
    );

    const unsubVisuals = subscribePortfolioContent(
      (data) => setPortfolioContent(data),
      (err) => console.error("Visuals sync error:", err),
    );

    return () => {
      unsubInquiries();
      unsubVlogs();
      unsubMediaKit();
      unsubVisuals();
    };
  }, [isAdmin]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (!authEmail.trim() || !authPassword) {
      setAuthError("Please fill in email and password.");
      return;
    }

    if (authMode === "signup" && authPassword !== authConfirmPass) {
      setAuthError("Passwords do not match.");
      return;
    }

    if (authMode === "signup" && authPassword.length < 6) {
      setAuthError("Password must be at least 6 characters.");
      return;
    }

    setAuthSubmitting(true);
    try {
      if (authMode === "signup") {
        await signUpAdmin(authEmail, authPassword);
        setHasAdminRegistered(true);
        showToast("Admin account created successfully");
      } else {
        await signInAdmin(authEmail, authPassword);
        showToast("Signed in successfully");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Authentication failed";
      if (msg.includes("auth/invalid-credential") || msg.includes("auth/user-not-found")) {
        setAuthError("Invalid email or password.");
      } else if (msg.includes("auth/email-already-in-use")) {
        setAuthError("An account with this email already exists. Please sign in.");
      } else if (msg.includes("auth/operation-not-allowed")) {
        setAuthError(
          "Email/Password sign-in is disabled in Firebase Console. Please enable Email/Password provider under Authentication > Sign-in method.",
        );
      } else {
        setAuthError(msg);
      }
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      showToast("Signed out");
    } catch (err: unknown) {
      showToast("Sign out failed", "error");
    }
  };

  // Portfolio Visuals Handlers
  const handleSaveVisuals = async (e: React.FormEvent) => {
    e.preventDefault();
    setVisualsSaving(true);
    try {
      await savePortfolioContent(portfolioContent);
      showToast("Portfolio visuals and stories saved to live site!");
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Failed to save visuals", "error");
    } finally {
      setVisualsSaving(false);
    }
  };

  const handleAddModellingImage = () => {
    if (!newModellingUrl.trim()) {
      showToast("Please enter a valid image URL", "error");
      return;
    }
    const updated = [
      ...portfolioContent.modellingImages,
      {
        url: newModellingUrl.trim(),
        caption: newModellingCaption.trim() || "Modelling portrait",
      },
    ];
    setPortfolioContent({ ...portfolioContent, modellingImages: updated });
    setNewModellingUrl("");
    setNewModellingCaption("");
    showToast("Image added to gallery list (click Save Visuals to publish)");
  };

  const handleRemoveModellingImage = (indexToRemove: number) => {
    const updated = portfolioContent.modellingImages.filter((_, idx) => idx !== indexToRemove);
    setPortfolioContent({ ...portfolioContent, modellingImages: updated });
  };

  // Vlog Handlers
  const handleSaveVlog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVlog?.title || !editingVlog?.category || !editingVlog?.media_url) {
      showToast("Please fill in required fields", "error");
      return;
    }

    setVlogSaving(true);
    try {
      await saveVlog({
        id: editingVlog.id,
        title: editingVlog.title,
        category: editingVlog.category,
        description: editingVlog.description || "",
        media_url: editingVlog.media_url,
        sort_order: Number(editingVlog.sort_order ?? vlogs.length + 1),
      });
      showToast(editingVlog.id ? "Vlog updated" : "New vlog added");
      setIsVlogModalOpen(false);
      setEditingVlog(null);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Failed to save vlog", "error");
    } finally {
      setVlogSaving(false);
    }
  };

  const handleDeleteVlog = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;
    try {
      await deleteVlog(id);
      showToast("Vlog deleted");
    } catch (err: unknown) {
      showToast("Failed to delete vlog", "error");
    }
  };

  // Inquiry Handlers
  const handleStatusChange = async (inquiry: Inquiry, newStatus: Inquiry["status"]) => {
    try {
      await updateInquiryStatus(inquiry.id, newStatus, inquiry);
      showToast(`Inquiry marked as ${newStatus}`);
    } catch (err: unknown) {
      showToast("Failed to update status", "error");
    }
  };

  const handleDeleteInquiry = async (id: string) => {
    if (!confirm("Delete this inquiry record?")) return;
    try {
      await deleteInquiry(id);
      showToast("Inquiry removed");
    } catch (err: unknown) {
      showToast("Failed to delete inquiry", "error");
    }
  };

  // Media Kit Handlers
  const handleMediaKitStatusChange = async (
    req: MediaKitRequestItem,
    newStatus: MediaKitRequestItem["status"],
  ) => {
    try {
      await updateMediaKitRequestStatus(req.id, newStatus, req);
      showToast(`Request marked as ${newStatus}`);
    } catch (err: unknown) {
      showToast("Failed to update status", "error");
    }
  };

  const handleDeleteMediaKit = async (id: string) => {
    if (!confirm("Delete this media kit request?")) return;
    try {
      await deleteMediaKitRequest(id);
      showToast("Request removed");
    } catch (err: unknown) {
      showToast("Failed to delete request", "error");
    }
  };

  const filteredInquiries = inquiries.filter((inq) => {
    const matchesFilter = inquiriesFilter === "all" || inq.status === inquiriesFilter;
    const matchesSearch =
      inquirySearch === "" ||
      inq.name.toLowerCase().includes(inquirySearch.toLowerCase()) ||
      inq.email.toLowerCase().includes(inquirySearch.toLowerCase()) ||
      (inq.companyOrBrand &&
        inq.companyOrBrand.toLowerCase().includes(inquirySearch.toLowerCase())) ||
      inq.message.toLowerCase().includes(inquirySearch.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-card/90 px-6 py-4 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="flex items-center gap-2 text-xs text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft size={15} />
            <span>Public Portfolio</span>
          </Link>
          <div className="h-4 w-px bg-border" />
          <h1 className="font-display text-lg font-medium tracking-wide">
            Faith Ekuase{" "}
            <span className="text-xs uppercase tracking-widest text-primary">Creator Portal</span>
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {user && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">{user.email}</span>
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition hover:bg-secondary hover:text-foreground"
              >
                <LogOut size={13} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Floating Notice */}
      {statusNotice && (
        <div
          className={`fixed bottom-6 right-6 z-50 rounded-lg px-4 py-3 text-xs shadow-xl transition-all ${
            statusNotice.type === "success"
              ? "border border-emerald-500/30 bg-emerald-950/90 text-emerald-200"
              : "border border-red-500/30 bg-red-950/90 text-red-200"
          }`}
        >
          {statusNotice.message}
        </div>
      )}

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {authLoading ? (
          <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-muted-foreground">
            <RefreshCw size={24} className="animate-spin text-primary" />
            <p className="text-xs">Loading secure portal...</p>
          </div>
        ) : !user ? (
          <div className="mx-auto my-12 max-w-md rounded-2xl border border-border bg-card p-8 shadow-2xl">
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-primary">
                <ShieldCheck size={24} />
              </div>
              <h2 className="font-display text-2xl font-normal">Creator Administration</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Manage your profile, showcase vlogs, polaroid stories, and collaboration requests.
              </p>
            </div>

            {/* Toggle Sign In / Sign Up (Only show Sign Up if no admin has registered yet) */}
            {!hasAdminRegistered && (
              <div className="mt-6 flex rounded-lg border border-border bg-background p-1">
                <button
                  onClick={() => {
                    setAuthMode("signin");
                    setAuthError(null);
                  }}
                  className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition ${
                    authMode === "signin"
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    setAuthMode("signup");
                    setAuthError(null);
                  }}
                  className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition ${
                    authMode === "signup"
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Create Admin Account
                </button>
              </div>
            )}

            {authError && (
              <div className="mt-4 rounded-lg border border-amber-500/40 bg-amber-950/40 p-3.5 text-xs text-amber-200 space-y-2">
                <p className="leading-relaxed">{authError}</p>
                {authError.includes("Firebase Console") && (
                  <div className="pt-1">
                    <a
                      href="https://console.firebase.google.com/project/gen-lang-client-0362464829/authentication/providers"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded bg-primary px-3 py-1.5 font-semibold text-primary-foreground transition hover:opacity-90"
                    >
                      <span>Enable in Firebase Console</span>
                      <ExternalLink size={13} />
                    </a>
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="mt-6 space-y-4 text-xs">
              <div>
                <label className="mb-1 block font-semibold text-warm">Email Address</label>
                <input
                  type="email"
                  required
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="admin@faithekuase.com"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block font-semibold text-warm">Password</label>
                <input
                  type="password"
                  required
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
              </div>

              {authMode === "signup" && !hasAdminRegistered && (
                <div>
                  <label className="mb-1 block font-semibold text-warm">Confirm Password</label>
                  <input
                    type="password"
                    required
                    value={authConfirmPass}
                    onChange={(e) => setAuthConfirmPass(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                  />
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={authSubmitting}
                  className="button-primary w-full justify-center py-2.5"
                >
                  {authSubmitting ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : authMode === "signup" ? (
                    <UserPlus size={14} />
                  ) : (
                    <LogIn size={14} />
                  )}
                  <span>
                    {authSubmitting
                      ? "Authenticating..."
                      : authMode === "signup"
                        ? "Register & Access Dashboard"
                        : "Sign In"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div>
            {/* Dashboard Tabs */}
            <div className="mb-8 flex flex-wrap items-center gap-2 border-b border-border pb-4">
              <button
                onClick={() => setActiveTab("overview")}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold uppercase tracking-wider transition ${
                  activeTab === "overview"
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <BarChart3 size={14} />
                <span>Overview</span>
              </button>
              <button
                onClick={() => setActiveTab("visuals")}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold uppercase tracking-wider transition ${
                  activeTab === "visuals"
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <Image size={14} />
                <span>Portfolio & Visuals</span>
              </button>
              <button
                onClick={() => setActiveTab("vlogs")}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold uppercase tracking-wider transition ${
                  activeTab === "vlogs"
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <Video size={14} />
                <span>Vlogs ({vlogs.length})</span>
              </button>
              <button
                onClick={() => setActiveTab("inquiries")}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold uppercase tracking-wider transition ${
                  activeTab === "inquiries"
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <Mail size={14} />
                <span>Inquiries ({inquiries.length})</span>
                {inquiries.filter((i) => i.status === "new").length > 0 && (
                  <span className="ml-1 rounded-full bg-amber-500 px-1.5 py-0.2 text-[10px] font-bold text-black">
                    {inquiries.filter((i) => i.status === "new").length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab("mediakit")}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold uppercase tracking-wider transition ${
                  activeTab === "mediakit"
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <FileText size={14} />
                <span>Media Kit Requests ({mediaKitRequests.length})</span>
              </button>
            </div>

            {/* TAB: OVERVIEW */}
            {activeTab === "overview" && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-xl border border-border bg-card p-5">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span className="text-xs uppercase tracking-wider">New Inquiries</span>
                      <Mail size={16} className="text-amber-400" />
                    </div>
                    <p className="mt-3 font-display text-3xl font-semibold">
                      {inquiries.filter((i) => i.status === "new").length}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {inquiries.length} total brand proposals
                    </p>
                  </div>

                  <div className="rounded-xl border border-border bg-card p-5">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span className="text-xs uppercase tracking-wider">Showcase Vlogs</span>
                      <Video size={16} className="text-primary" />
                    </div>
                    <p className="mt-3 font-display text-3xl font-semibold">{vlogs.length}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Live video features</p>
                  </div>

                  <div className="rounded-xl border border-border bg-card p-5">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span className="text-xs uppercase tracking-wider">Modelling Photos</span>
                      <Image size={16} className="text-warm" />
                    </div>
                    <p className="mt-3 font-display text-3xl font-semibold">
                      {portfolioContent.modellingImages.length}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">Through my lens portraits</p>
                  </div>

                  <div className="rounded-xl border border-border bg-card p-5">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span className="text-xs uppercase tracking-wider">Media Kit Leads</span>
                      <FileText size={16} className="text-emerald-400" />
                    </div>
                    <p className="mt-3 font-display text-3xl font-semibold">
                      {mediaKitRequests.length}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {mediaKitRequests.filter((r) => r.status === "pending").length} pending send
                    </p>
                  </div>
                </div>

                {/* Quick Shortcuts */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="rounded-xl border border-border bg-card p-6">
                    <h3 className="font-display text-lg font-medium">Visuals & Branding</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Update your hero portrait, polaroid photo, about story, and modelling images.
                    </p>
                    <div className="mt-4 flex gap-3">
                      <button
                        onClick={() => setActiveTab("visuals")}
                        className="button-primary text-xs"
                      >
                        Manage Visuals & Photos
                      </button>
                      <button
                        onClick={() => setActiveTab("vlogs")}
                        className="button-secondary text-xs"
                      >
                        Manage Vlogs
                      </button>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border bg-card p-6">
                    <h3 className="font-display text-lg font-medium">Recent Inquiries</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {inquiries.length > 0
                        ? `You have ${inquiries.filter((i) => i.status === "new").length} unreviewed proposal(s).`
                        : "No inquiries submitted yet."}
                    </p>
                    <div className="mt-4">
                      <button
                        onClick={() => setActiveTab("inquiries")}
                        className="button-secondary text-xs"
                      >
                        View All Inquiries
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: PORTFOLIO & VISUALS (HERO, POLAROID, MODELLING) */}
            {activeTab === "visuals" && (
              <form onSubmit={handleSaveVisuals} className="space-y-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
                  <div>
                    <h3 className="font-display text-xl font-medium">
                      Portfolio Visuals & Content
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Manage your profile portrait, polaroid, intro copy, and modelling pictures.
                    </p>
                  </div>
                  <button
                    type="submit"
                    disabled={visualsSaving}
                    className="button-primary inline-flex items-center gap-2 text-xs"
                  >
                    <CheckCircle2 size={15} />
                    <span>{visualsSaving ? "Publishing..." : "Save & Publish Visuals"}</span>
                  </button>
                </div>

                {/* Section 1: Hero & Profile Image */}
                <div className="rounded-xl border border-border bg-card p-6 space-y-4">
                  <h4 className="font-display text-lg font-semibold flex items-center gap-2">
                    <Image size={18} className="text-primary" />
                    <span>Hero & Profile Image</span>
                  </h4>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <div className="space-y-3 md:col-span-2 text-xs">
                      <div>
                        <label className="mb-1 block font-semibold text-warm">
                          Profile / Hero Image URL *
                        </label>
                        <input
                          type="url"
                          required
                          value={portfolioContent.heroImageUrl}
                          onChange={(e) =>
                            setPortfolioContent({
                              ...portfolioContent,
                              heroImageUrl: e.target.value,
                            })
                          }
                          placeholder="https://... direct image URL"
                          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block font-semibold text-warm">
                          Portrait Caption
                        </label>
                        <input
                          type="text"
                          value={portfolioContent.heroCaption}
                          onChange={(e) =>
                            setPortfolioContent({
                              ...portfolioContent,
                              heroCaption: e.target.value,
                            })
                          }
                          placeholder="e.g. Based in Benin City"
                          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block font-semibold text-warm">
                          Hero Introduction
                        </label>
                        <textarea
                          rows={3}
                          value={portfolioContent.heroSubtitle}
                          onChange={(e) =>
                            setPortfolioContent({
                              ...portfolioContent,
                              heroSubtitle: e.target.value,
                            })
                          }
                          placeholder="Welcome text under your name..."
                          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col items-center justify-center rounded-xl border border-border/80 bg-background/50 p-3">
                      <p className="text-[11px] text-muted-foreground mb-2">Live Preview</p>
                      <div className="h-44 w-36 overflow-hidden rounded-lg border border-border">
                        <img
                          src={portfolioContent.heroImageUrl}
                          alt="Hero Preview"
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              DEFAULT_PORTFOLIO_CONTENT.heroImageUrl;
                          }}
                        />
                      </div>
                      <span className="mt-2 text-[10px] text-muted-foreground">
                        {portfolioContent.heroCaption}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Section 2: About & Polaroid */}
                <div className="rounded-xl border border-border bg-card p-6 space-y-4">
                  <h4 className="font-display text-lg font-semibold flex items-center gap-2">
                    <Image size={18} className="text-warm" />
                    <span>About Polaroid & Story</span>
                  </h4>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <div className="space-y-3 md:col-span-2 text-xs">
                      <div>
                        <label className="mb-1 block font-semibold text-warm">
                          Polaroid Image URL *
                        </label>
                        <input
                          type="url"
                          required
                          value={portfolioContent.aboutImageUrl}
                          onChange={(e) =>
                            setPortfolioContent({
                              ...portfolioContent,
                              aboutImageUrl: e.target.value,
                            })
                          }
                          placeholder="https://... direct image URL"
                          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block font-semibold text-warm">
                          Polaroid Handwritten Caption
                        </label>
                        <input
                          type="text"
                          value={portfolioContent.aboutPolaroidCaption}
                          onChange={(e) =>
                            setPortfolioContent({
                              ...portfolioContent,
                              aboutPolaroidCaption: e.target.value,
                            })
                          }
                          placeholder="e.g. hello, it’s Faith ♡"
                          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block font-semibold text-warm">Lead Line</label>
                        <input
                          type="text"
                          value={portfolioContent.aboutLead}
                          onChange={(e) =>
                            setPortfolioContent({ ...portfolioContent, aboutLead: e.target.value })
                          }
                          placeholder="e.g. I’m Faith Ekuase."
                          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block font-semibold text-warm">
                          About Narrative Copy
                        </label>
                        <textarea
                          rows={4}
                          value={portfolioContent.aboutStory}
                          onChange={(e) =>
                            setPortfolioContent({ ...portfolioContent, aboutStory: e.target.value })
                          }
                          placeholder="Your story, philosophy, background..."
                          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col items-center justify-center rounded-xl border border-border/80 bg-background/50 p-3">
                      <p className="text-[11px] text-muted-foreground mb-2">Polaroid Preview</p>
                      <div className="w-36 rounded-sm bg-cream p-2 text-background shadow-md">
                        <img
                          src={portfolioContent.aboutImageUrl}
                          alt="Polaroid Preview"
                          className="aspect-[4/5] w-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              DEFAULT_PORTFOLIO_CONTENT.aboutImageUrl;
                          }}
                        />
                        <p className="mt-2 text-center font-display text-[10px] italic">
                          {portfolioContent.aboutPolaroidCaption}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 3: Modelling Gallery (Through My Lens) */}
                <div className="rounded-xl border border-border bg-card p-6 space-y-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h4 className="font-display text-lg font-semibold flex items-center gap-2">
                        <Image size={18} className="text-primary" />
                        <span>
                          Modelling Through My Lens Gallery (
                          {portfolioContent.modellingImages.length})
                        </span>
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Portraits and fashion frames shown in the public modelling gallery.
                      </p>
                    </div>
                  </div>

                  {/* Add New Picture Input */}
                  <div className="rounded-lg border border-border bg-background/70 p-4 text-xs space-y-3">
                    <p className="font-semibold text-warm">Add New Picture to Gallery</p>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div className="sm:col-span-2">
                        <input
                          type="url"
                          value={newModellingUrl}
                          onChange={(e) => setNewModellingUrl(e.target.value)}
                          placeholder="Image URL (https://...)"
                          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-foreground focus:border-primary focus:outline-none"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          value={newModellingCaption}
                          onChange={(e) => setNewModellingCaption(e.target.value)}
                          placeholder="Caption / Alt text"
                          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-foreground focus:border-primary focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleAddModellingImage}
                        className="button-secondary text-xs inline-flex items-center gap-1.5"
                      >
                        <Plus size={14} />
                        <span>Add Picture to List</span>
                      </button>
                    </div>
                  </div>

                  {/* Existing Pictures Grid */}
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                    {portfolioContent.modellingImages.map((img, idx) => (
                      <div
                        key={idx}
                        className="group relative overflow-hidden rounded-lg border border-border bg-secondary"
                      >
                        <img
                          src={img.url}
                          alt={img.caption}
                          className="aspect-[4/5] w-full object-cover"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 flex flex-col justify-between bg-black/60 p-2 opacity-0 transition group-hover:opacity-100">
                          <button
                            type="button"
                            onClick={() => handleRemoveModellingImage(idx)}
                            className="self-end rounded bg-red-950/80 p-1 text-red-300 hover:bg-red-900"
                            title="Remove picture"
                          >
                            <Trash2 size={13} />
                          </button>
                          <p className="text-[10px] text-white/90 line-clamp-2">{img.caption}</p>
                        </div>
                        <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1 text-[9px] text-white">
                          #{idx + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    disabled={visualsSaving}
                    className="button-primary inline-flex items-center gap-2 text-xs py-3 px-8"
                  >
                    <CheckCircle2 size={16} />
                    <span>{visualsSaving ? "Publishing Changes..." : "Publish All Visuals"}</span>
                  </button>
                </div>
              </form>
            )}

            {/* TAB: VLOGS MANAGER */}
            {activeTab === "vlogs" && (
              <div className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-display text-xl font-medium">Showcase Vlogs</h3>
                    <p className="text-xs text-muted-foreground">
                      Curate videos displayed on Faith's portfolio.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingVlog({
                        title: "",
                        category: "Everyday moments",
                        media_url: "",
                        description: "",
                        sort_order: vlogs.length + 1,
                      });
                      setIsVlogModalOpen(true);
                    }}
                    className="button-primary inline-flex items-center gap-2 text-xs"
                  >
                    <Plus size={15} />
                    <span>Add New Vlog</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {vlogs.map((vlog) => (
                    <div
                      key={vlog.id}
                      className="overflow-hidden rounded-xl border border-border bg-card transition hover:border-muted-foreground/30"
                    >
                      <div className="relative aspect-video bg-black">
                        <video
                          src={vlog.media_url}
                          className="h-full w-full object-cover"
                          preload="metadata"
                          controls
                        />
                        <span className="absolute left-2 top-2 rounded bg-black/70 px-2 py-0.5 text-[10px] uppercase tracking-wider text-warm backdrop-blur-sm">
                          {vlog.category}
                        </span>
                      </div>
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-display text-base font-semibold">{vlog.title}</h4>
                          <span className="rounded bg-secondary px-2 py-0.5 text-[10px] text-muted-foreground">
                            #{vlog.sort_order}
                          </span>
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground line-clamp-2">
                          {vlog.description}
                        </p>
                        <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs">
                          <a
                            href={vlog.media_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-primary hover:underline"
                          >
                            <span>Open Link</span>
                            <ExternalLink size={12} />
                          </a>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setEditingVlog(vlog);
                                setIsVlogModalOpen(true);
                              }}
                              className="rounded bg-secondary px-2.5 py-1 text-foreground transition hover:bg-muted"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteVlog(vlog.id, vlog.title)}
                              className="rounded p-1 text-muted-foreground hover:bg-red-950/40 hover:text-red-400"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: INQUIRIES */}
            {activeTab === "inquiries" && (
              <div className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="relative max-w-sm flex-1">
                    <Search
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      size={16}
                    />
                    <input
                      type="text"
                      placeholder="Search name, email, brand, message..."
                      value={inquirySearch}
                      onChange={(e) => setInquirySearch(e.target.value)}
                      className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-4 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Filter size={14} className="text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Filter:</span>
                    {(["all", "new", "in_review", "contacted", "closed"] as const).map((status) => (
                      <button
                        key={status}
                        onClick={() => setInquiriesFilter(status)}
                        className={`rounded-full px-3 py-1 text-xs font-semibold capitalize transition ${
                          inquiriesFilter === status
                            ? "bg-foreground text-background"
                            : "border border-border text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {status.replace("_", " ")}
                      </button>
                    ))}
                  </div>
                </div>

                {filteredInquiries.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center text-sm text-muted-foreground">
                    No inquiries found matching criteria.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {filteredInquiries.map((inq) => (
                      <div
                        key={inq.id}
                        className="rounded-xl border border-border bg-card p-5 transition hover:border-muted-foreground/40"
                      >
                        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="font-display text-lg font-semibold">{inq.name}</h4>
                              {inq.companyOrBrand && (
                                <span className="rounded bg-secondary px-2 py-0.5 text-xs text-warm">
                                  {inq.companyOrBrand}
                                </span>
                              )}
                              {inq.projectType && (
                                <span className="rounded border border-border px-2 py-0.5 text-xs capitalize text-muted-foreground">
                                  {inq.projectType.replace("_", " ")}
                                </span>
                              )}
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                  inq.status === "new"
                                    ? "bg-amber-500/20 text-amber-300"
                                    : inq.status === "in_review"
                                      ? "bg-blue-500/20 text-blue-300"
                                      : inq.status === "contacted"
                                        ? "bg-emerald-500/20 text-emerald-300"
                                        : "bg-muted text-muted-foreground"
                                }`}
                              >
                                {inq.status}
                              </span>
                            </div>
                            <div className="mt-1 flex flex-wrap gap-4 text-xs text-muted-foreground">
                              <span>
                                Email:{" "}
                                <a
                                  href={`mailto:${inq.email}`}
                                  className="text-foreground underline"
                                >
                                  {inq.email}
                                </a>
                              </span>
                              {inq.timeline && <span>Timeline: {inq.timeline}</span>}
                              <span>Received: {new Date(inq.createdAt).toLocaleString()}</span>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <select
                              value={inq.status}
                              onChange={(e) =>
                                handleStatusChange(inq, e.target.value as Inquiry["status"])
                              }
                              className="rounded border border-border bg-secondary px-2.5 py-1 text-xs text-foreground focus:outline-none"
                            >
                              <option value="new">New</option>
                              <option value="in_review">In Review</option>
                              <option value="contacted">Contacted</option>
                              <option value="closed">Closed</option>
                            </select>
                            <a
                              href={`mailto:${inq.email}?subject=Collaboration%20with%20Faith%20Ekuase`}
                              className="inline-flex items-center gap-1.5 rounded bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground transition hover:opacity-90"
                            >
                              <Mail size={13} />
                              <span>Reply</span>
                            </a>
                            <button
                              onClick={() => handleDeleteInquiry(inq.id)}
                              className="rounded p-1 text-muted-foreground hover:bg-red-950/40 hover:text-red-400"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>

                        <div className="mt-4 rounded-lg bg-background/60 p-4 text-xs leading-relaxed text-muted-foreground">
                          <p className="whitespace-pre-wrap">{inq.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB: MEDIA KIT REQUESTS */}
            {activeTab === "mediakit" && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-display text-xl font-medium">Media Kit Requests</h3>
                  <p className="text-xs text-muted-foreground">
                    Brands and agencies requesting Faith's official media kit and rates.
                  </p>
                </div>

                {mediaKitRequests.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center text-sm text-muted-foreground">
                    No media kit requests logged yet.
                  </div>
                ) : (
                  <div className="rounded-xl border border-border bg-card overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-border bg-secondary/50 text-muted-foreground">
                        <tr>
                          <th className="p-3">Requester</th>
                          <th className="p-3">Company / Agency</th>
                          <th className="p-3">Date</th>
                          <th className="p-3">Status</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {mediaKitRequests.map((req) => (
                          <tr key={req.id} className="hover:bg-secondary/30">
                            <td className="p-3 font-medium">
                              <div>{req.name}</div>
                              <a
                                href={`mailto:${req.email}`}
                                className="text-muted-foreground hover:underline"
                              >
                                {req.email}
                              </a>
                            </td>
                            <td className="p-3 text-muted-foreground">{req.company || "—"}</td>
                            <td className="p-3 text-muted-foreground">
                              {new Date(req.createdAt).toLocaleDateString()}
                            </td>
                            <td className="p-3">
                              <select
                                value={req.status}
                                onChange={(e) =>
                                  handleMediaKitStatusChange(
                                    req,
                                    e.target.value as MediaKitRequestItem["status"],
                                  )
                                }
                                className="rounded border border-border bg-secondary px-2 py-0.5 text-xs text-foreground focus:outline-none"
                              >
                                <option value="pending">Pending</option>
                                <option value="sent">Sent</option>
                                <option value="archived">Archived</option>
                              </select>
                            </td>
                            <td className="p-3 text-right">
                              <div className="inline-flex items-center gap-2">
                                <a
                                  href={`mailto:${req.email}?subject=Faith%20Ekuase%20Media%20Kit%20%26%20Rate%20Card`}
                                  className="rounded bg-primary px-2.5 py-1 font-semibold text-primary-foreground"
                                >
                                  Send Kit
                                </a>
                                <button
                                  onClick={() => handleDeleteMediaKit(req.id)}
                                  className="rounded p-1 text-muted-foreground hover:text-red-400"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Vlog Modal */}
      {isVlogModalOpen && editingVlog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h3 className="font-display text-xl font-semibold">
                {editingVlog.id ? "Edit Vlog Entry" : "Add Portfolio Vlog"}
              </h3>
              <button
                onClick={() => {
                  setIsVlogModalOpen(false);
                  setEditingVlog(null);
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveVlog} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="mb-1 block font-semibold text-muted-foreground">Title *</label>
                <input
                  type="text"
                  required
                  value={editingVlog.title || ""}
                  onChange={(e) => setEditingVlog({ ...editingVlog, title: e.target.value })}
                  placeholder="e.g. Life lately in Benin City"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-semibold text-muted-foreground">
                    Category *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingVlog.category || ""}
                    onChange={(e) => setEditingVlog({ ...editingVlog, category: e.target.value })}
                    placeholder="e.g. Everyday moments"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-semibold text-muted-foreground">Order</label>
                  <input
                    type="number"
                    value={editingVlog.sort_order ?? 1}
                    onChange={(e) =>
                      setEditingVlog({ ...editingVlog, sort_order: Number(e.target.value) })
                    }
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block font-semibold text-muted-foreground">
                  Video URL *
                </label>
                <input
                  type="url"
                  required
                  value={editingVlog.media_url || ""}
                  onChange={(e) => setEditingVlog({ ...editingVlog, media_url: e.target.value })}
                  placeholder="https://... direct video file or hosted stream"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block font-semibold text-muted-foreground">
                  Description *
                </label>
                <textarea
                  rows={3}
                  required
                  value={editingVlog.description || ""}
                  onChange={(e) => setEditingVlog({ ...editingVlog, description: e.target.value })}
                  placeholder="Short engaging description for viewers..."
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsVlogModalOpen(false);
                    setEditingVlog(null);
                  }}
                  className="button-secondary"
                >
                  Cancel
                </button>
                <button type="submit" disabled={vlogSaving} className="button-primary">
                  {vlogSaving ? "Saving..." : editingVlog.id ? "Save Changes" : "Create Vlog"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
