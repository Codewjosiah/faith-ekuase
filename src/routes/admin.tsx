import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
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
  DEFAULT_SOCIAL_LINKS,
  uploadFileToGallery,
  getLocalGalleryHistory,
  type GalleryMediaItem,
  type PortfolioContent,
  type SocialLinks,
} from "../lib/db-service";
import {
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  ExternalLink,
  FileText,
  Filter,
  FolderOpen,
  Globe,
  Image,
  LogIn,
  LogOut,
  Mail,
  MessageCircle,
  Play,
  Plus,
  RefreshCw,
  Search,
  Share2,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
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

// Curated library of media already in project for quick gallery selection
const GALLERY_IMAGE_PRESETS = [
  {
    name: "Original Hero Portrait",
    url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/channels4_profile-hcyvINGNgSvvHYQRzwyX2wxZXLHErM.jpg",
  },
  {
    name: "Scrapbook Polaroid",
    url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/A%20little%20introduction%20is%20probably%20long%20overdue%20%F0%9F%8C%B7%20so%20hi%2C%20I%E2%80%99m%20Faith%F0%9F%92%97If%20you%E2%80%99re%20new%20here%2C%20i%E2%80%99m%20happ-Npc67YE18XDQpypAyIqjFkMHP3fG9X.jpg",
  },
  {
    name: "Purple Satin Portrait",
    url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202026-09-20%20at%2012.28.01%20AM%20%283%29-TDjLVKmKvwz1tjagbmhATSzCyFNGAu.jpeg",
  },
  {
    name: "Graduation Blue Stole",
    url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202026-09-18%20at%2010.13.26%20PM-DhEmZ0o5ZVFTvisobGpCYPB4Z05unW.jpeg",
  },
  {
    name: "Cream Sofa Portrait",
    url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202026-09-18%20at%2010.34.55%20PM-ftPIAGTCoZMtKgX5gb0fC5pXvGoEES.jpeg",
  },
  {
    name: "Copper Braids Portrait",
    url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202026-09-19%20at%208.47.45%20AM-5CgPp2cK058HIWglW1MaImNjJK9P30.jpeg",
  },
  {
    name: "Café Table Creative",
    url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202026-09-20%20at%2012.28.03%20AM%20%282%29-8R19KS3Kt4oHOp4k57ixYdMn738BMd.jpeg",
  },
  {
    name: "Patterned Dress Outdoor",
    url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202026-09-20%20at%2012.28.02%20AM%20%281%29-NHeafEbz5iBn0aFeCrtNIiHqbtSj9X.jpeg",
  },
];

const GALLERY_VIDEO_PRESETS = [
  {
    name: "Everyday Moments Vlog",
    url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Video%202026-09-20%20at%2012.46.25%20AM-FpDbzxVaJdJeDvLal8yzMVNs0GDhoQ.mp4",
  },
  {
    name: "Come Along With Me Vlog",
    url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Video%202026-09-20%20at%2012.46.33%20AM%20%281%29-YUxJ2QqKtIh6lId0Uj5nhr53qRqjft.mp4",
  },
  {
    name: "Through My Lens Diary",
    url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Video%202026-09-20%20at%2012.46.33%20AM-aT0g7RsXFydyqWS0h32uif84lPh4BI.mp4",
  },
];

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
    "overview" | "visuals" | "vlogs" | "socials" | "inquiries" | "mediakit"
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

  // Portfolio Visuals state (Hero, Polaroid, Modelling Gallery, Socials)
  const [portfolioContent, setPortfolioContent] =
    useState<PortfolioContent>(DEFAULT_PORTFOLIO_CONTENT);
  const [socialsState, setSocialsState] = useState<SocialLinks>(DEFAULT_SOCIAL_LINKS);
  const [visualsSaving, setVisualsSaving] = useState(false);
  const [socialsSaving, setSocialsSaving] = useState(false);
  const [newModellingUrl, setNewModellingUrl] = useState("");
  const [newModellingCaption, setNewModellingCaption] = useState("");

  // Gallery Picker Modal
  const [galleryModalOpen, setGalleryModalOpen] = useState(false);
  const [galleryPickerType, setGalleryPickerType] = useState<"image" | "video">("image");
  const [gallerySelectCallback, setGallerySelectCallback] = useState<
    ((url: string) => void) | null
  >(null);
  const [localGallery, setLocalGallery] = useState<GalleryMediaItem[]>([]);

  // File Upload State
  const [uploadingTarget, setUploadingTarget] = useState<string | null>(null);

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
    setLocalGallery(getLocalGalleryHistory());
  }, []);

  useEffect(() => {
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
      (data) => {
        setPortfolioContent(data);
        if (data.socialLinks) {
          setSocialsState(data.socialLinks);
        }
      },
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
          "Email/Password sign-in is disabled in your Firebase project. Click the button below to enable it in Firebase Console.",
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

  // Generic File Upload Handler from Device
  const handleFileUpload = async (file: File, target: string, onDone: (url: string) => void) => {
    setUploadingTarget(target);
    try {
      const uploadedUrl = await uploadFileToGallery(file);
      onDone(uploadedUrl);
      setLocalGallery(getLocalGalleryHistory());
      showToast(`Uploaded ${file.name} successfully!`);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Upload failed", "error");
    } finally {
      setUploadingTarget(null);
    }
  };

  // Open Gallery Picker Modal
  const openGalleryModal = (type: "image" | "video", onSelect: (url: string) => void) => {
    setGalleryPickerType(type);
    setGallerySelectCallback(() => onSelect);
    setLocalGallery(getLocalGalleryHistory());
    setGalleryModalOpen(true);
  };

  // Portfolio Visuals Handlers
  const handleSaveVisuals = async (e: React.FormEvent) => {
    e.preventDefault();
    setVisualsSaving(true);
    try {
      await savePortfolioContent({
        ...portfolioContent,
        socialLinks: socialsState,
      });
      showToast("Portfolio visuals and stories saved to live site!");
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Failed to save visuals", "error");
    } finally {
      setVisualsSaving(false);
    }
  };

  const handleSaveSocials = async (e: React.FormEvent) => {
    e.preventDefault();
    setSocialsSaving(true);
    try {
      await savePortfolioContent({
        ...portfolioContent,
        socialLinks: socialsState,
      });
      showToast("Social links and contact numbers published to live site!");
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Failed to save social links", "error");
    } finally {
      setSocialsSaving(false);
    }
  };

  const handleAddModellingImage = () => {
    if (!newModellingUrl.trim()) {
      showToast("Please enter or upload an image", "error");
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
    showToast("Photo added! Click 'Publish All Visuals' to save changes live.");
  };

  const handleRemoveModellingImage = (indexToRemove: number) => {
    const updated = portfolioContent.modellingImages.filter((_, idx) => idx !== indexToRemove);
    setPortfolioContent({ ...portfolioContent, modellingImages: updated });
  };

  // Vlog Handlers
  const handleSaveVlog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVlog?.title || !editingVlog?.category || !editingVlog?.media_url) {
      showToast("Please fill in required fields (title, category, and video)", "error");
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
      showToast(editingVlog.id ? "Vlog updated" : "New vlog added to portfolio");
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
                Manage your profile, showcase vlogs, polaroid stories, social links, and
                collaboration requests.
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
            {/* Quick Action Navigation Bar */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card/60 p-3">
              <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <Sparkles size={14} className="text-primary" />
                <span>Quick Jump:</span>
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("visuals")}
                  className="rounded-md border border-border bg-secondary/80 px-3 py-1.5 text-xs font-medium hover:border-primary hover:text-foreground transition"
                >
                  🖼️ Profile & Photos
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("vlogs")}
                  className="rounded-md border border-border bg-secondary/80 px-3 py-1.5 text-xs font-medium hover:border-primary hover:text-foreground transition"
                >
                  🎬 Showcase Vlogs ({vlogs.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("socials")}
                  className="rounded-md border border-primary/50 bg-primary/15 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/25 transition flex items-center gap-1.5"
                >
                  <Share2 size={12} />
                  <span>📱 Social Links & WhatsApp</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("inquiries")}
                  className="rounded-md border border-border bg-secondary/80 px-3 py-1.5 text-xs font-medium hover:border-primary hover:text-foreground transition"
                >
                  📬 Inquiries ({inquiries.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("mediakit")}
                  className="rounded-md border border-border bg-secondary/80 px-3 py-1.5 text-xs font-medium hover:border-primary hover:text-foreground transition"
                >
                  📄 Media Kit ({mediaKitRequests.length})
                </button>
              </div>
            </div>

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
                onClick={() => setActiveTab("socials")}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold uppercase tracking-wider transition ${
                  activeTab === "socials"
                    ? "bg-primary text-primary-foreground shadow-md ring-2 ring-primary/40 font-bold"
                    : "text-foreground bg-primary/10 border border-primary/40 hover:bg-primary/20 font-bold"
                }`}
              >
                <Share2 size={14} className={activeTab === "socials" ? "" : "text-primary"} />
                <span>Social Links & Contacts</span>
                <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary">
                  Manage
                </span>
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
                    <p className="mt-1 text-xs text-muted-foreground">Through my lens gallery</p>
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

                {/* Dedicated Social Links Overview Card */}
                <div className="rounded-xl border border-border bg-card p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
                    <div>
                      <h3 className="font-display text-lg font-semibold flex items-center gap-2">
                        <Share2 size={18} className="text-primary" />
                        <span>Live Social Media Profiles & WhatsApp</span>
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        These links and contact numbers are published live across your website
                        header, Elsewhere Online section, contact section, and footer.
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTab("socials")}
                      className="button-primary text-xs inline-flex items-center gap-2 whitespace-nowrap"
                    >
                      <Share2 size={14} />
                      <span>Edit & Manage Social Links</span>
                    </button>
                  </div>

                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                    <div className="rounded-lg border border-border/80 bg-background/60 p-3">
                      <p className="text-muted-foreground font-medium">YouTube Channel</p>
                      <p
                        className="mt-1 font-semibold text-foreground truncate"
                        title={socialsState.youtube}
                      >
                        {socialsState.youtube || "Not configured"}
                      </p>
                    </div>
                    <div className="rounded-lg border border-border/80 bg-background/60 p-3">
                      <p className="text-muted-foreground font-medium">Instagram Profile</p>
                      <p
                        className="mt-1 font-semibold text-foreground truncate"
                        title={socialsState.instagram}
                      >
                        {socialsState.instagram || "Not configured"}
                      </p>
                    </div>
                    <div className="rounded-lg border border-border/80 bg-background/60 p-3">
                      <p className="text-muted-foreground font-medium">TikTok Profile</p>
                      <p
                        className="mt-1 font-semibold text-foreground truncate"
                        title={socialsState.tiktok}
                      >
                        {socialsState.tiktok || "Not configured"}
                      </p>
                    </div>
                    <div className="rounded-lg border border-border/80 bg-background/60 p-3">
                      <p className="text-muted-foreground font-medium">Pinterest Profile</p>
                      <p
                        className="mt-1 font-semibold text-foreground truncate"
                        title={socialsState.pinterest}
                      >
                        {socialsState.pinterest || "Not configured"}
                      </p>
                    </div>
                    <div className="rounded-lg border border-border/80 bg-background/60 p-3">
                      <p className="text-muted-foreground font-medium">Official Email</p>
                      <p
                        className="mt-1 font-semibold text-foreground truncate"
                        title={socialsState.email}
                      >
                        {socialsState.email || "Not configured"}
                      </p>
                    </div>
                    <div className="rounded-lg border border-border/80 bg-background/60 p-3">
                      <p className="text-muted-foreground font-medium">WhatsApp Display Number</p>
                      <p
                        className="mt-1 font-semibold text-foreground truncate"
                        title={socialsState.whatsappNumber}
                      >
                        {socialsState.whatsappNumber || "Not configured"}
                      </p>
                    </div>
                    <div className="rounded-lg border border-border/80 bg-background/60 p-3 sm:col-span-2">
                      <p className="text-muted-foreground font-medium">WhatsApp Direct Chat Link</p>
                      <p
                        className="mt-1 font-semibold text-foreground truncate"
                        title={socialsState.whatsappLink}
                      >
                        {socialsState.whatsappLink || "Not configured"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Quick Shortcuts */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  <div className="rounded-xl border border-border bg-card p-6">
                    <h3 className="font-display text-lg font-medium">Visuals & Photos</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Update profile portrait, polaroid story, and modelling images. Upload directly
                      from your device or pick from gallery.
                    </p>
                    <button
                      onClick={() => setActiveTab("visuals")}
                      className="button-primary mt-4 text-xs"
                    >
                      Manage Visuals & Photos
                    </button>
                  </div>

                  <div className="rounded-xl border border-border bg-card p-6">
                    <h3 className="font-display text-lg font-medium">Vlogs & Videos</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Add, edit, or remove showcase videos. Upload new videos from device or select
                      from attached files.
                    </p>
                    <button
                      onClick={() => setActiveTab("vlogs")}
                      className="button-secondary mt-4 text-xs"
                    >
                      Manage Showcase Vlogs
                    </button>
                  </div>

                  <div className="rounded-xl border border-border bg-card p-6">
                    <h3 className="font-display text-lg font-medium">Social Links & Phone</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Manage your YouTube, Instagram, TikTok, Pinterest, WhatsApp number, and email.
                    </p>
                    <button
                      onClick={() => setActiveTab("socials")}
                      className="button-secondary mt-4 text-xs"
                    >
                      Manage Social Links
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: PORTFOLIO & VISUALS (HERO, POLAROID, MODELLING) */}
            {activeTab === "visuals" && (
              <form onSubmit={handleSaveVisuals} className="space-y-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
                  <div>
                    <h3 className="font-display text-xl font-medium">Portfolio Visuals & Photos</h3>
                    <p className="text-xs text-muted-foreground">
                      Upload from your gallery/device, choose from presets, or provide URLs.
                    </p>
                  </div>
                  <button
                    type="submit"
                    disabled={visualsSaving}
                    className="button-primary inline-flex items-center gap-2 text-xs"
                  >
                    <CheckCircle2 size={15} />
                    <span>{visualsSaving ? "Publishing..." : "Publish All Visuals"}</span>
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
                          Profile / Hero Image *
                        </label>
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <label className="button-primary text-xs cursor-pointer inline-flex items-center gap-1.5 shadow-sm">
                            <Upload size={13} />
                            <span>
                              {uploadingTarget === "hero"
                                ? "Uploading Photo..."
                                : "Upload from Gallery / Device"}
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) {
                                  handleFileUpload(f, "hero", (url) =>
                                    setPortfolioContent({ ...portfolioContent, heroImageUrl: url }),
                                  );
                                }
                              }}
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() =>
                              openGalleryModal("image", (url) =>
                                setPortfolioContent({ ...portfolioContent, heroImageUrl: url }),
                              )
                            }
                            className="button-secondary text-xs inline-flex items-center gap-1.5"
                          >
                            <FolderOpen size={13} />
                            <span>Pick from Media Library</span>
                          </button>
                        </div>
                        <input
                          type="text"
                          required
                          value={portfolioContent.heroImageUrl}
                          onChange={(e) =>
                            setPortfolioContent({
                              ...portfolioContent,
                              heroImageUrl: e.target.value,
                            })
                          }
                          placeholder="Image URL or uploaded path (/uploads/...)"
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
                      <div className="h-44 w-36 overflow-hidden rounded-lg border border-border bg-black">
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
                          Polaroid Image *
                        </label>
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <label className="button-primary text-xs cursor-pointer inline-flex items-center gap-1.5 shadow-sm">
                            <Upload size={13} />
                            <span>
                              {uploadingTarget === "polaroid"
                                ? "Uploading Photo..."
                                : "Upload from Gallery / Device"}
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) {
                                  handleFileUpload(f, "polaroid", (url) =>
                                    setPortfolioContent({
                                      ...portfolioContent,
                                      aboutImageUrl: url,
                                    }),
                                  );
                                }
                              }}
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() =>
                              openGalleryModal("image", (url) =>
                                setPortfolioContent({ ...portfolioContent, aboutImageUrl: url }),
                              )
                            }
                            className="button-secondary text-xs inline-flex items-center gap-1.5"
                          >
                            <FolderOpen size={13} />
                            <span>Pick from Media Library</span>
                          </button>
                        </div>
                        <input
                          type="text"
                          required
                          value={portfolioContent.aboutImageUrl}
                          onChange={(e) =>
                            setPortfolioContent({
                              ...portfolioContent,
                              aboutImageUrl: e.target.value,
                            })
                          }
                          placeholder="Image URL or uploaded path (/uploads/...)"
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
                            setPortfolioContent({
                              ...portfolioContent,
                              aboutLead: e.target.value,
                            })
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
                            setPortfolioContent({
                              ...portfolioContent,
                              aboutStory: e.target.value,
                            })
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
                        Portraits and fashion frames shown in the public gallery. Upload from your
                        device or pick existing photos.
                      </p>
                    </div>
                  </div>

                  {/* Add New Picture Input */}
                  <div className="rounded-lg border border-border bg-background/70 p-4 text-xs space-y-3">
                    <p className="font-semibold text-warm">Add Photo to Gallery</p>

                    <div className="flex flex-wrap items-center gap-2">
                      <label className="button-primary text-xs cursor-pointer inline-flex items-center gap-1.5 shadow-sm">
                        <Upload size={13} />
                        <span>
                          {uploadingTarget === "modelling"
                            ? "Uploading Photo..."
                            : "Upload from Gallery / Photos"}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) {
                              handleFileUpload(f, "modelling", (url) => setNewModellingUrl(url));
                            }
                          }}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => openGalleryModal("image", (url) => setNewModellingUrl(url))}
                        className="button-secondary text-xs inline-flex items-center gap-1.5"
                      >
                        <FolderOpen size={13} />
                        <span>Choose from Media Library</span>
                      </button>
                    </div>

                    {newModellingUrl && (
                      <div className="flex items-center gap-3 rounded-lg border border-primary/40 bg-card p-2.5">
                        <img
                          src={newModellingUrl}
                          alt="New upload preview"
                          className="h-16 w-14 rounded object-cover border border-border"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-semibold text-primary">
                            Photo Selected & Ready
                          </p>
                          <p className="text-[10px] text-muted-foreground truncate">
                            {newModellingUrl}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setNewModellingUrl("")}
                          className="text-[11px] text-red-400 hover:underline"
                        >
                          Clear
                        </button>
                      </div>
                    )}

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div className="sm:col-span-2">
                        <input
                          type="text"
                          value={newModellingUrl}
                          onChange={(e) => setNewModellingUrl(e.target.value)}
                          placeholder="Or paste direct image URL (/uploads/...)"
                          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-foreground focus:border-primary focus:outline-none"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          value={newModellingCaption}
                          onChange={(e) => setNewModellingCaption(e.target.value)}
                          placeholder="Photo Caption (e.g. Portrait in purple dress)"
                          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-foreground focus:border-primary focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleAddModellingImage}
                        className="button-primary text-xs inline-flex items-center gap-1.5"
                      >
                        <Plus size={14} />
                        <span>Add Picture to Gallery</span>
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

                {/* Section 4: Social Links & Contact Channels (also available in dedicated tab) */}
                <div className="rounded-xl border border-border bg-card p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border pb-3">
                    <div>
                      <h4 className="font-display text-lg font-semibold flex items-center gap-2 text-primary">
                        <Share2 size={18} />
                        <span>Social Links & Contact Channels</span>
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Manage your social media channels, handles, and direct WhatsApp contact
                        published across the website.
                      </p>
                    </div>
                    <span className="text-[11px] rounded-full bg-primary/10 border border-primary/30 px-2.5 py-1 text-primary font-semibold">
                      Live on Header, Elsewhere & Footer
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="mb-1 block font-semibold text-muted-foreground">
                        YouTube Channel URL
                      </label>
                      <input
                        type="url"
                        value={socialsState.youtube}
                        onChange={(e) =>
                          setSocialsState({ ...socialsState, youtube: e.target.value })
                        }
                        placeholder="https://youtube.com/@faith-ekuase"
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block font-semibold text-muted-foreground">
                        Instagram Profile URL
                      </label>
                      <input
                        type="url"
                        value={socialsState.instagram}
                        onChange={(e) =>
                          setSocialsState({ ...socialsState, instagram: e.target.value })
                        }
                        placeholder="https://www.instagram.com/faith_ekuase/"
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block font-semibold text-muted-foreground">
                        TikTok Profile URL
                      </label>
                      <input
                        type="url"
                        value={socialsState.tiktok}
                        onChange={(e) =>
                          setSocialsState({ ...socialsState, tiktok: e.target.value })
                        }
                        placeholder="https://www.tiktok.com/@.faithekuase"
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block font-semibold text-muted-foreground">
                        Pinterest Profile URL
                      </label>
                      <input
                        type="url"
                        value={socialsState.pinterest}
                        onChange={(e) =>
                          setSocialsState({ ...socialsState, pinterest: e.target.value })
                        }
                        placeholder="https://www.pinterest.com/faithekuase1/"
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block font-semibold text-muted-foreground">
                        Official Contact Email
                      </label>
                      <input
                        type="email"
                        value={socialsState.email}
                        onChange={(e) =>
                          setSocialsState({ ...socialsState, email: e.target.value })
                        }
                        placeholder="faithekuase1@gmail.com"
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block font-semibold text-muted-foreground">
                        Display WhatsApp Number
                      </label>
                      <input
                        type="text"
                        value={socialsState.whatsappNumber}
                        onChange={(e) =>
                          setSocialsState({ ...socialsState, whatsappNumber: e.target.value })
                        }
                        placeholder="+234 705 508 2561"
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="mb-1 block font-semibold text-muted-foreground">
                        WhatsApp Direct Chat Link
                      </label>
                      <input
                        type="url"
                        value={socialsState.whatsappLink}
                        onChange={(e) =>
                          setSocialsState({ ...socialsState, whatsappLink: e.target.value })
                        }
                        placeholder="https://wa.me/2347055082561"
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    disabled={visualsSaving}
                    className="button-primary inline-flex items-center gap-2 text-xs py-3 px-8 shadow-md"
                  >
                    <CheckCircle2 size={16} />
                    <span>
                      {visualsSaving ? "Publishing Changes..." : "Publish All Visuals & Socials"}
                    </span>
                  </button>
                </div>
              </form>
            )}

            {/* TAB: SOCIAL LINKS & CONTACT DETAILS */}
            {activeTab === "socials" && (
              <form onSubmit={handleSaveSocials} className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
                  <div>
                    <h3 className="font-display text-xl font-medium">
                      Social Links & Contact Info
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Manage all handles, profile links, WhatsApp, and contact numbers across the
                      website.
                    </p>
                  </div>
                  <button
                    type="submit"
                    disabled={socialsSaving}
                    className="button-primary inline-flex items-center gap-2 text-xs"
                  >
                    <CheckCircle2 size={15} />
                    <span>{socialsSaving ? "Saving..." : "Save Social Links"}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 text-xs">
                  <div className="rounded-xl border border-border bg-card p-6 space-y-4">
                    <h4 className="font-display text-base font-semibold flex items-center gap-2 text-warm">
                      <Share2 size={16} />
                      <span>Social Media Profiles</span>
                    </h4>

                    <div>
                      <label className="mb-1 block font-semibold text-muted-foreground">
                        YouTube Channel URL
                      </label>
                      <input
                        type="url"
                        value={socialsState.youtube}
                        onChange={(e) =>
                          setSocialsState({ ...socialsState, youtube: e.target.value })
                        }
                        placeholder="https://youtube.com/@faith-ekuase"
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block font-semibold text-muted-foreground">
                        Instagram Profile URL
                      </label>
                      <input
                        type="url"
                        value={socialsState.instagram}
                        onChange={(e) =>
                          setSocialsState({ ...socialsState, instagram: e.target.value })
                        }
                        placeholder="https://www.instagram.com/faith_ekuase/"
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block font-semibold text-muted-foreground">
                        TikTok Profile URL
                      </label>
                      <input
                        type="url"
                        value={socialsState.tiktok}
                        onChange={(e) =>
                          setSocialsState({ ...socialsState, tiktok: e.target.value })
                        }
                        placeholder="https://www.tiktok.com/@.faithekuase"
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block font-semibold text-muted-foreground">
                        Pinterest Profile URL
                      </label>
                      <input
                        type="url"
                        value={socialsState.pinterest}
                        onChange={(e) =>
                          setSocialsState({ ...socialsState, pinterest: e.target.value })
                        }
                        placeholder="https://www.pinterest.com/faithekuase1/"
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="rounded-xl border border-border bg-card p-6 space-y-4">
                    <h4 className="font-display text-base font-semibold flex items-center gap-2 text-primary">
                      <Mail size={16} />
                      <span>Contact & Collaboration Channels</span>
                    </h4>

                    <div>
                      <label className="mb-1 block font-semibold text-muted-foreground">
                        Official Contact Email
                      </label>
                      <input
                        type="email"
                        value={socialsState.email}
                        onChange={(e) =>
                          setSocialsState({ ...socialsState, email: e.target.value })
                        }
                        placeholder="faithekuase1@gmail.com"
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block font-semibold text-muted-foreground">
                        Display WhatsApp Number
                      </label>
                      <input
                        type="text"
                        value={socialsState.whatsappNumber}
                        onChange={(e) =>
                          setSocialsState({ ...socialsState, whatsappNumber: e.target.value })
                        }
                        placeholder="+234 705 508 2561"
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block font-semibold text-muted-foreground">
                        WhatsApp Direct Click Link
                      </label>
                      <input
                        type="url"
                        value={socialsState.whatsappLink}
                        onChange={(e) =>
                          setSocialsState({ ...socialsState, whatsappLink: e.target.value })
                        }
                        placeholder="https://wa.me/2347055082561"
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none"
                      />
                    </div>

                    <div className="rounded-lg bg-background/50 p-4 border border-border/80">
                      <p className="text-muted-foreground leading-relaxed">
                        These links appear dynamically on your header, &quot;Elsewhere Online&quot;
                        section, contact section, and footer navigation.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={socialsSaving}
                    className="button-primary inline-flex items-center gap-2 text-xs py-3 px-8"
                  >
                    <CheckCircle2 size={16} />
                    <span>{socialsSaving ? "Saving..." : "Save All Social Links"}</span>
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
                      Curate videos displayed on Faith's portfolio. Upload directly from your device
                      or select attached videos.
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
                            <span>Open Media</span>
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
                  Video Source *
                </label>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <label className="button-primary text-xs cursor-pointer inline-flex items-center gap-1.5 shadow-sm">
                    <Upload size={13} />
                    <span>
                      {uploadingTarget === "vlog_video"
                        ? "Uploading video..."
                        : "Upload Video from Gallery / Device"}
                    </span>
                    <input
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) {
                          handleFileUpload(f, "vlog_video", (url) =>
                            setEditingVlog({ ...editingVlog, media_url: url }),
                          );
                        }
                      }}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      openGalleryModal("video", (url) =>
                        setEditingVlog({ ...editingVlog, media_url: url }),
                      )
                    }
                    className="button-secondary text-xs inline-flex items-center gap-1.5"
                  >
                    <FolderOpen size={13} />
                    <span>Select from Video Gallery</span>
                  </button>
                </div>

                {editingVlog.media_url ? (
                  <div className="rounded-xl border border-border/80 bg-background/80 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-primary flex items-center gap-1">
                        <Play size={12} /> Video Attached & Ready
                      </span>
                      <button
                        type="button"
                        onClick={() => setEditingVlog({ ...editingVlog, media_url: "" })}
                        className="text-[11px] text-muted-foreground hover:text-red-400"
                      >
                        Remove / Replace
                      </button>
                    </div>
                    <div className="aspect-video w-full rounded-lg overflow-hidden bg-black">
                      <video
                        src={editingVlog.media_url}
                        controls
                        className="w-full h-full object-contain"
                        preload="metadata"
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground truncate">
                      Source: {editingVlog.media_url}
                    </p>
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-border/80 bg-background/40 p-4 text-center">
                    <Video size={24} className="mx-auto text-muted-foreground/60 mb-1" />
                    <p className="text-[11px] text-muted-foreground">
                      No video chosen yet. Upload an MP4/MOV from your device gallery or pick from
                      attached videos.
                    </p>
                  </div>
                )}

                <div className="mt-2">
                  <input
                    type="text"
                    required
                    value={editingVlog.media_url || ""}
                    onChange={(e) => setEditingVlog({ ...editingVlog, media_url: e.target.value })}
                    placeholder="Or paste direct video URL (/uploads/...)"
                    className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-[11px] text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
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

      {/* Gallery Selector Modal */}
      {galleryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-display text-lg font-semibold flex items-center gap-2">
                <FolderOpen size={18} className="text-primary" />
                <span>
                  {galleryPickerType === "video"
                    ? "Select Video from Gallery"
                    : "Select Image from Gallery"}
                </span>
              </h3>
              <button
                onClick={() => setGalleryModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>

            {/* Quick Upload from modal */}
            <div className="rounded-lg border border-border/80 bg-background/60 p-3 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                Or upload a new file from your device / gallery:
              </span>
              <label className="button-primary text-xs cursor-pointer inline-flex items-center gap-1.5 shadow-sm">
                <Upload size={13} />
                <span>
                  {uploadingTarget === "modal_upload" ? "Uploading..." : "Upload New File"}
                </span>
                <input
                  type="file"
                  accept={galleryPickerType === "video" ? "video/*" : "image/*"}
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      handleFileUpload(f, "modal_upload", (url) => {
                        if (gallerySelectCallback) {
                          gallerySelectCallback(url);
                        }
                        setGalleryModalOpen(false);
                      });
                    }
                  }}
                />
              </label>
            </div>

            {/* Grid of presets and uploaded items */}
            <div className="max-h-[55vh] overflow-y-auto pr-1 space-y-5">
              {/* User Uploaded Items */}
              {localGallery.filter((item) => item.type === galleryPickerType).length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-primary mb-2 flex items-center gap-1.5">
                    <Sparkles size={13} />
                    <span>Your Uploaded Media (from Device Gallery)</span>
                  </h4>
                  {galleryPickerType === "video" ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {localGallery
                        .filter((item) => item.type === "video")
                        .map((vid) => (
                          <div
                            key={vid.id}
                            onClick={() => {
                              if (gallerySelectCallback) gallerySelectCallback(vid.url);
                              setGalleryModalOpen(false);
                            }}
                            className="cursor-pointer rounded-xl border border-primary/40 bg-card p-2.5 transition hover:border-primary hover:bg-secondary/70 group"
                          >
                            <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
                              <video
                                src={vid.url}
                                className="w-full h-full object-cover"
                                preload="metadata"
                              />
                            </div>
                            <p className="mt-1.5 text-xs font-semibold text-foreground truncate">
                              {vid.name}
                            </p>
                            <span className="text-[10px] text-muted-foreground">
                              Uploaded from device
                            </span>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {localGallery
                        .filter((item) => item.type === "image")
                        .map((img) => (
                          <div
                            key={img.id}
                            onClick={() => {
                              if (gallerySelectCallback) gallerySelectCallback(img.url);
                              setGalleryModalOpen(false);
                            }}
                            className="group cursor-pointer rounded-lg border border-primary/40 bg-card overflow-hidden transition hover:border-primary hover:ring-2 hover:ring-primary/30"
                          >
                            <img
                              src={img.url}
                              alt={img.name}
                              className="aspect-[4/5] w-full object-cover group-hover:scale-105 transition"
                              loading="lazy"
                            />
                            <p className="p-1.5 text-[10px] text-foreground font-medium truncate">
                              {img.name}
                            </p>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}

              {/* Built-in Presets */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Curated Project Media Library
                </h4>
                {galleryPickerType === "video" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {GALLERY_VIDEO_PRESETS.map((vid, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          if (gallerySelectCallback) gallerySelectCallback(vid.url);
                          setGalleryModalOpen(false);
                        }}
                        className="cursor-pointer rounded-xl border border-border bg-secondary/50 p-3 transition hover:border-primary hover:bg-secondary"
                      >
                        <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
                          <video
                            src={vid.url}
                            className="w-full h-full object-cover"
                            preload="metadata"
                          />
                        </div>
                        <p className="mt-2 text-xs font-semibold text-foreground">{vid.name}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {GALLERY_IMAGE_PRESETS.map((img, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          if (gallerySelectCallback) gallerySelectCallback(img.url);
                          setGalleryModalOpen(false);
                        }}
                        className="group cursor-pointer rounded-lg border border-border bg-secondary overflow-hidden transition hover:border-primary"
                      >
                        <img
                          src={img.url}
                          alt={img.name}
                          className="aspect-[4/5] w-full object-cover group-hover:scale-105 transition"
                          loading="lazy"
                        />
                        <p className="p-2 text-[10px] text-muted-foreground truncate">{img.name}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
