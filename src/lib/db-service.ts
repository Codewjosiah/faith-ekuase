import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType, isUserAdmin, auth } from "./firebase";

export interface Inquiry {
  id: string;
  name: string;
  email: string;
  companyOrBrand?: string;
  projectType?:
    "sponsored_vlog" | "brand_ambassadorship" | "modelling_campaign" | "event_appearance" | "other";
  timeline?: string;
  message: string;
  status: "new" | "in_review" | "contacted" | "closed";
  createdAt: string;
}

export interface VlogItem {
  id: string;
  title: string;
  category: string;
  description: string;
  media_url: string;
  sort_order: number;
  createdAt: string;
  updatedAt: string;
}

export interface MediaKitRequestItem {
  id: string;
  name: string;
  email: string;
  company?: string;
  notes?: string;
  status: "pending" | "sent" | "archived";
  createdAt: string;
}

export const INITIAL_DEFAULT_VLOGS: Omit<VlogItem, "createdAt" | "updatedAt">[] = [
  {
    id: "vlog-1",
    title: "A little moment worth sharing",
    category: "Everyday moments",
    description: "A glimpse into the moments that make the everyday feel special.",
    media_url:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Video%202026-09-20%20at%2012.46.25%20AM-FpDbzxVaJdJeDvLal8yzMVNs0GDhoQ.mp4",
    sort_order: 1,
  },
  {
    id: "vlog-2",
    title: "Come along with me",
    category: "Life lately",
    description: "A personal look at life, movement, and the stories in between.",
    media_url:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Video%202026-09-20%20at%2012.46.33%20AM%20%281%29-YUxJ2QqKtIh6lId0Uj5nhr53qRqjft.mp4",
    sort_order: 2,
  },
  {
    id: "vlog-3",
    title: "Through my lens",
    category: "Creator diary",
    description: "A short behind-the-scenes glimpse from my world.",
    media_url:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Video%202026-09-20%20at%2012.46.33%20AM-aT0g7RsXFydyqWS0h32uif84lPh4BI.mp4",
    sort_order: 3,
  },
];

function generateSafeId(prefix = "doc"): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// ==================== INQUIRIES ====================

export async function submitInquiry(data: {
  name: string;
  email: string;
  companyOrBrand?: string;
  projectType?: Inquiry["projectType"];
  timeline?: string;
  message: string;
}): Promise<string> {
  const path = "inquiries";
  const id = generateSafeId("inq");
  const docRef = doc(db, path, id);

  const payload: Record<string, unknown> = {
    name: data.name.trim().slice(0, 100),
    email: data.email.trim().toLowerCase().slice(0, 150),
    message: data.message.trim().slice(0, 2000),
    status: "new",
    createdAt: new Date().toISOString(),
  };

  if (data.companyOrBrand?.trim()) {
    payload.companyOrBrand = data.companyOrBrand.trim().slice(0, 100);
  }
  if (data.projectType) {
    payload.projectType = data.projectType;
  }
  if (data.timeline?.trim()) {
    payload.timeline = data.timeline.trim().slice(0, 100);
  }

  try {
    await setDoc(docRef, payload);
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${path}/${id}`);
  }
}

export function subscribeInquiries(
  onData: (inquiries: Inquiry[]) => void,
  onError?: (error: unknown) => void,
) {
  const path = "inquiries";
  const colRef = collection(db, path);

  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: Inquiry[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<Inquiry, "id">),
      }));
      // Sort newest first
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onData(list);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, path);
    },
  );
}

export async function updateInquiryStatus(
  id: string,
  status: Inquiry["status"],
  existingData: Partial<Inquiry>,
): Promise<void> {
  const path = `inquiries/${id}`;
  const docRef = doc(db, "inquiries", id);

  try {
    const payload: Record<string, unknown> = {
      name: existingData.name || "Anonymous",
      email: existingData.email || "",
      message: existingData.message || "",
      status,
      createdAt: existingData.createdAt || new Date().toISOString(),
    };
    if (existingData.companyOrBrand) payload.companyOrBrand = existingData.companyOrBrand;
    if (existingData.projectType) payload.projectType = existingData.projectType;
    if (existingData.timeline) payload.timeline = existingData.timeline;

    await setDoc(docRef, payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteInquiry(id: string): Promise<void> {
  const path = `inquiries/${id}`;
  const docRef = doc(db, "inquiries", id);

  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ==================== VLOGS ====================

export function subscribeVlogs(
  onData: (vlogs: VlogItem[]) => void,
  onError?: (error: unknown) => void,
) {
  const path = "vlogs";
  const colRef = collection(db, path);

  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: VlogItem[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<VlogItem, "id">),
      }));
      list.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
      onData(list);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, path);
    },
  );
}

export async function seedInitialVlogsIfEmpty(): Promise<void> {
  const path = "vlogs";
  try {
    const colRef = collection(db, path);
    const snap = await getDocs(colRef);
    if (snap.empty) {
      const now = new Date().toISOString();
      for (const item of INITIAL_DEFAULT_VLOGS) {
        const docRef = doc(db, path, item.id);
        await setDoc(docRef, {
          title: item.title,
          category: item.category,
          description: item.description,
          media_url: item.media_url,
          sort_order: item.sort_order,
          createdAt: now,
          updatedAt: now,
        });
      }
    }
  } catch (error) {
    console.warn("Could not seed vlogs (may require admin privileges or network):", error);
  }
}

export async function saveVlog(
  vlog: Omit<VlogItem, "createdAt" | "updatedAt"> & { id?: string },
): Promise<string> {
  const path = "vlogs";
  const id = vlog.id || generateSafeId("vlog");
  const docRef = doc(db, path, id);
  const now = new Date().toISOString();

  const payload = {
    title: vlog.title.trim().slice(0, 150),
    category: vlog.category.trim().slice(0, 80),
    description: vlog.description.trim().slice(0, 500),
    media_url: vlog.media_url.trim().slice(0, 2048),
    sort_order: Number(vlog.sort_order) || 0,
    createdAt: now,
    updatedAt: now,
  };

  try {
    await setDoc(docRef, payload);
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${path}/${id}`);
  }
}

export async function deleteVlog(id: string): Promise<void> {
  const path = `vlogs/${id}`;
  const docRef = doc(db, "vlogs", id);

  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ==================== MEDIA KIT REQUESTS ====================

export async function submitMediaKitRequest(data: {
  name: string;
  email: string;
  company?: string;
  notes?: string;
}): Promise<string> {
  const path = "media_kit_requests";
  const id = generateSafeId("mkr");
  const docRef = doc(db, path, id);

  const payload: Record<string, unknown> = {
    name: data.name.trim().slice(0, 100),
    email: data.email.trim().toLowerCase().slice(0, 150),
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  if (data.company?.trim()) {
    payload.company = data.company.trim().slice(0, 100);
  }
  if (data.notes?.trim()) {
    payload.notes = data.notes.trim().slice(0, 500);
  }

  try {
    await setDoc(docRef, payload);
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${path}/${id}`);
  }
}

export function subscribeMediaKitRequests(
  onData: (requests: MediaKitRequestItem[]) => void,
  onError?: (error: unknown) => void,
) {
  const path = "media_kit_requests";
  const colRef = collection(db, path);

  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: MediaKitRequestItem[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<MediaKitRequestItem, "id">),
      }));
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onData(list);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, path);
    },
  );
}

export async function updateMediaKitRequestStatus(
  id: string,
  status: MediaKitRequestItem["status"],
  existing: Partial<MediaKitRequestItem>,
): Promise<void> {
  const path = `media_kit_requests/${id}`;
  const docRef = doc(db, "media_kit_requests", id);

  try {
    const payload: Record<string, unknown> = {
      name: existing.name || "Anonymous",
      email: existing.email || "",
      status,
      createdAt: existing.createdAt || new Date().toISOString(),
    };
    if (existing.company) payload.company = existing.company;
    if (existing.notes) payload.notes = existing.notes;

    await setDoc(docRef, payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteMediaKitRequest(id: string): Promise<void> {
  const path = `media_kit_requests/${id}`;
  const docRef = doc(db, "media_kit_requests", id);

  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ==================== ADMIN ACCESS CHECK ====================

export async function verifyCurrentUserIsAdmin(): Promise<boolean> {
  const user = auth.currentUser;
  if (!user) return false;

  try {
    const adminDoc = await getDoc(doc(db, "admins", user.uid));
    return adminDoc.exists();
  } catch {
    return false;
  }
}

// ==================== PORTFOLIO CONTENT & IMAGES ====================

export interface SocialLinks {
  youtube: string;
  instagram: string;
  pinterest: string;
  tiktok: string;
  email: string;
  whatsappNumber: string;
  whatsappLink: string;
}

export const DEFAULT_SOCIAL_LINKS: SocialLinks = {
  youtube: "https://youtube.com/@faith-ekuase",
  instagram: "https://www.instagram.com/faith_ekuase/",
  pinterest: "https://www.pinterest.com/faithekuase1/",
  tiktok: "https://www.tiktok.com/@.faithekuase",
  email: "faithekuase1@gmail.com",
  whatsappNumber: "+234 705 508 2561",
  whatsappLink: "https://wa.me/2347055082561",
};

export interface PortfolioContent {
  heroImageUrl: string;
  heroCaption: string;
  heroSubtitle: string;
  aboutImageUrl: string;
  aboutPolaroidCaption: string;
  aboutLead: string;
  aboutStory: string;
  modellingImages: Array<{ url: string; caption: string }>;
  socialLinks: SocialLinks;
  updatedAt: string;
}

export const DEFAULT_PORTFOLIO_CONTENT: PortfolioContent = {
  heroImageUrl:
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/channels4_profile-hcyvINGNgSvvHYQRzwyX2wxZXLHErM.jpg",
  heroCaption: "Based in Benin City",
  heroSubtitle:
    "I’m Faith Ekuase, a vlogger and content creator who creates visually engaging content around lifestyle, fashion, beauty, and everyday experiences.\n\nCome along as I share my world, explore new experiences, and create videos that feel real, personal, and worth watching.",
  aboutImageUrl:
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/A%20little%20introduction%20is%20probably%20long%20overdue%20%F0%9F%8C%B7%20so%20hi%2C%20I%E2%80%99m%20Faith%F0%9F%92%97If%20you%E2%80%99re%20new%20here%2C%20i%E2%80%99m%20happ-Npc67YE18XDQpypAyIqjFkMHP3fG9X.jpg",
  aboutPolaroidCaption: "hello, it’s Faith ♡",
  aboutLead: "I’m Faith Ekuase.",
  aboutStory:
    "A Physiotherapy student, a vlogger, and someone who enjoys finding stories in the everyday.\n\nI love capturing experiences, sharing my perspective, and bringing people along for the moments that make life interesting. My faith is part of that journey too—quietly shaping the way I see things, the values I carry, and the gratitude I have for where I am.\n\nBetween school, creating, and everything in between, I’m learning, growing, and discovering what I want to say through my videos.",
  modellingImages: [
    {
      url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202026-09-20%20at%2012.28.01%20AM%20%283%29-TDjLVKmKvwz1tjagbmhATSzCyFNGAu.jpeg",
      caption: "Portrait in a rich purple satin dress",
    },
    {
      url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202026-09-20%20at%2012.28.01%20AM-SYPqvvdlo0AsYDQAIZHsA5r45lSFAm.jpeg",
      caption: "Playful portrait in a purple dress",
    },
    {
      url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202026-09-20%20at%2012.28.01%20AM%20%281%29-UNvIDQDWxiNsBQOvvYI8QISCFC8qyJ.jpeg",
      caption: "Graduation portrait in blue and purple",
    },
    {
      url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202026-09-20%20at%2012.28.02%20AM%20%281%29-NHeafEbz5iBn0aFeCrtNIiHqbtSj9X.jpeg",
      caption: "Outdoor portrait in a patterned dress",
    },
    {
      url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202026-09-20%20at%2012.28.01%20AM%20%282%29-AO9YvGea1puX0oMG2sl1gwYced6a6T.jpeg",
      caption: "Full-length portrait in a purple dress",
    },
    {
      url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202026-09-20%20at%2012.28.02%20AM%20%282%29-EEpfZiNWVCFOVnVa7ptlxVbJhmqHqW.jpeg",
      caption: "Portrait in a dark gathered blouse",
    },
    {
      url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202026-09-20%20at%2012.28.03%20AM%20%281%29-YJiu7q9cbx6EhiPvLimbvusNReXIbL.jpeg",
      caption: "Outdoor full-length portrait",
    },
    {
      url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202026-09-20%20at%2012.28.02%20AM-YW9QxoItSz3EWDGKVqW6npb9U8vSJy.jpeg",
      caption: "Portrait beside a car",
    },
    {
      url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202026-09-20%20at%2012.28.03%20AM-FBkBHnl7V8yyqR6fVY6aGHbomZEY7N.jpeg",
      caption: "Close-up outdoor portrait",
    },
    {
      url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202026-09-20%20at%2012.28.03%20AM%20%282%29-8R19KS3Kt4oHOp4k57ixYdMn738BMd.jpeg",
      caption: "Creative portrait at a café table",
    },
    {
      url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202026-09-20%20at%2012.28.04%20AM%20%281%29-FppX8MZM430VHcVuPUwbZVjHSqjAyi.jpeg",
      caption: "Portrait in a white shirt",
    },
    {
      url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202026-09-18%20at%2010.13.26%20PM-DhEmZ0o5ZVFTvisobGpCYPB4Z05unW.jpeg",
      caption: "Formal portrait in a blue graduation stole",
    },
    {
      url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202026-09-18%20at%2010.34.55%20PM-ftPIAGTCoZMtKgX5gb0fC5pXvGoEES.jpeg",
      caption: "Warm portrait on a cream sofa",
    },
    {
      url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202026-09-19%20at%208.47.45%20AM-5CgPp2cK058HIWglW1MaImNjJK9P30.jpeg",
      caption: "Close-up portrait with copper braids",
    },
  ],
  socialLinks: DEFAULT_SOCIAL_LINKS,
  updatedAt: new Date().toISOString(),
};

export interface GalleryMediaItem {
  id: string;
  name: string;
  url: string;
  type: "image" | "video";
  uploadedAt: string;
}

export function getLocalGalleryHistory(): GalleryMediaItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("faith_gallery_media");
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveToLocalGalleryHistory(item: Omit<GalleryMediaItem, "id">): GalleryMediaItem {
  const newItem: GalleryMediaItem = {
    ...item,
    id: `gallery_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
  };
  if (typeof window !== "undefined") {
    try {
      const existing = getLocalGalleryHistory();
      const updated = [newItem, ...existing.filter((i) => i.url !== item.url)].slice(0, 50);
      localStorage.setItem("faith_gallery_media", JSON.stringify(updated));
    } catch {
      // Non-critical
    }
  }
  return newItem;
}

export async function uploadFileToGallery(file: File): Promise<string> {
  const isVideo = file.type.startsWith("video/") || /\.(mp4|webm|mov|m4v)$/i.test(file.name);

  // 1. Try standard binary multipart upload first
  try {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      const data = (await res.json()) as { url?: string };
      if (data.url) {
        saveToLocalGalleryHistory({
          name: file.name,
          url: data.url,
          type: isVideo ? "video" : "image",
          uploadedAt: new Date().toISOString(),
        });
        return data.url;
      }
    }
  } catch (err) {
    console.warn("Multipart upload error, trying base64 fallback:", err);
  }

  // 2. Base64 fallback if multipart fetch is intercepted or unsupported
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: file.name,
            base64,
          }),
        });
        if (res.ok) {
          const data = (await res.json()) as { url?: string };
          if (data.url) {
            saveToLocalGalleryHistory({
              name: file.name,
              url: data.url,
              type: isVideo ? "video" : "image",
              uploadedAt: new Date().toISOString(),
            });
            resolve(data.url);
            return;
          }
        }
        throw new Error("Server upload endpoint did not return URL");
      } catch (err) {
        reject(err instanceof Error ? err : new Error("File upload failed"));
      }
    };
    reader.onerror = () => reject(new Error("Unable to read file from gallery/device"));
    reader.readAsDataURL(file);
  });
}

const PORTFOLIO_CONTENT_DOC = "main";

export function subscribePortfolioContent(
  onData: (content: PortfolioContent) => void,
  onError?: (err: unknown) => void,
) {
  const docRef = doc(db, "portfolio_content", PORTFOLIO_CONTENT_DOC);
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const raw = snapshot.data();
        let parsedModelling: Array<{ url: string; caption: string }> =
          DEFAULT_PORTFOLIO_CONTENT.modellingImages;
        if (raw.modellingImagesJson) {
          try {
            parsedModelling = JSON.parse(raw.modellingImagesJson);
          } catch {
            // fallback
          }
        }

        let parsedSocials: SocialLinks = DEFAULT_SOCIAL_LINKS;
        if (raw.socialLinksJson) {
          try {
            parsedSocials = { ...DEFAULT_SOCIAL_LINKS, ...JSON.parse(raw.socialLinksJson) };
          } catch {
            // fallback
          }
        }

        onData({
          heroImageUrl: raw.heroImageUrl || DEFAULT_PORTFOLIO_CONTENT.heroImageUrl,
          heroCaption: raw.heroCaption || DEFAULT_PORTFOLIO_CONTENT.heroCaption,
          heroSubtitle: raw.heroSubtitle || DEFAULT_PORTFOLIO_CONTENT.heroSubtitle,
          aboutImageUrl: raw.aboutImageUrl || DEFAULT_PORTFOLIO_CONTENT.aboutImageUrl,
          aboutPolaroidCaption:
            raw.aboutPolaroidCaption || DEFAULT_PORTFOLIO_CONTENT.aboutPolaroidCaption,
          aboutLead: raw.aboutLead || DEFAULT_PORTFOLIO_CONTENT.aboutLead,
          aboutStory: raw.aboutStory || DEFAULT_PORTFOLIO_CONTENT.aboutStory,
          modellingImages: parsedModelling,
          socialLinks: parsedSocials,
          updatedAt: raw.updatedAt || new Date().toISOString(),
        });
      } else {
        onData(DEFAULT_PORTFOLIO_CONTENT);
      }
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, `portfolio_content/${PORTFOLIO_CONTENT_DOC}`);
    },
  );
}

export async function savePortfolioContent(content: Partial<PortfolioContent>): Promise<void> {
  const docRef = doc(db, "portfolio_content", PORTFOLIO_CONTENT_DOC);
  const now = new Date().toISOString();

  const payload: Record<string, unknown> = {
    heroImageUrl: (content.heroImageUrl || DEFAULT_PORTFOLIO_CONTENT.heroImageUrl).slice(0, 2048),
    heroCaption: (content.heroCaption || DEFAULT_PORTFOLIO_CONTENT.heroCaption).slice(0, 100),
    heroSubtitle: (content.heroSubtitle || DEFAULT_PORTFOLIO_CONTENT.heroSubtitle).slice(0, 1000),
    aboutImageUrl: (content.aboutImageUrl || DEFAULT_PORTFOLIO_CONTENT.aboutImageUrl).slice(
      0,
      2048,
    ),
    aboutPolaroidCaption: (
      content.aboutPolaroidCaption || DEFAULT_PORTFOLIO_CONTENT.aboutPolaroidCaption
    ).slice(0, 150),
    aboutLead: (content.aboutLead || DEFAULT_PORTFOLIO_CONTENT.aboutLead).slice(0, 500),
    aboutStory: (content.aboutStory || DEFAULT_PORTFOLIO_CONTENT.aboutStory).slice(0, 3000),
    modellingImagesJson: JSON.stringify(
      content.modellingImages || DEFAULT_PORTFOLIO_CONTENT.modellingImages,
    ).slice(0, 50000),
    socialLinksJson: JSON.stringify(
      content.socialLinks || DEFAULT_PORTFOLIO_CONTENT.socialLinks,
    ).slice(0, 5000),
    updatedAt: now,
  };

  try {
    await setDoc(docRef, payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `portfolio_content/${PORTFOLIO_CONTENT_DOC}`);
  }
}
