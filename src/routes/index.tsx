import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Instagram,
  Mail,
  Menu,
  MessageCircle,
  Play,
  Quote,
  Send,
  Shield,
  X,
  Youtube,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  subscribeVlogs,
  seedInitialVlogsIfEmpty,
  submitInquiry,
  submitMediaKitRequest,
  type VlogItem,
  type Inquiry,
  subscribePortfolioContent,
  DEFAULT_PORTFOLIO_CONTENT,
  type PortfolioContent,
} from "../lib/db-service";

const heroAsset = {
  url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/channels4_profile-hcyvINGNgSvvHYQRzwyX2wxZXLHErM.jpg",
};
const aboutAsset = {
  url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/A%20little%20introduction%20is%20probably%20long%20overdue%20%F0%9F%8C%B7%20so%20hi%2C%20I%E2%80%99m%20Faith%F0%9F%92%97If%20you%E2%80%99re%20new%20here%2C%20i%E2%80%99m%20happ-Npc67YE18XDQpypAyIqjFkMHP3fG9X.jpg",
};

const modellingImages = [
  [
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202026-09-20%20at%2012.28.01%20AM%20%283%29-TDjLVKmKvwz1tjagbmhATSzCyFNGAu.jpeg",
    "Portrait in a rich purple satin dress",
  ],
  [
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202026-09-20%20at%2012.28.01%20AM-SYPqvvdlo0AsYDQAIZHsA5r45lSFAm.jpeg",
    "Playful portrait in a purple dress",
  ],
  [
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202026-09-20%20at%2012.28.01%20AM%20%281%29-UNvIDQDWxiNsBQOvvYI8QISCFC8qyJ.jpeg",
    "Graduation portrait in blue and purple",
  ],
  [
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202026-09-20%20at%2012.28.02%20AM%20%281%29-NHeafEbz5iBn0aFeCrtNIiHqbtSj9X.jpeg",
    "Outdoor portrait in a patterned dress",
  ],
  [
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202026-09-20%20at%2012.28.01%20AM%20%282%29-AO9YvGea1puX0oMG2sl1gwYced6a6T.jpeg",
    "Full-length portrait in a purple dress",
  ],
  [
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202026-09-20%20at%2012.28.02%20AM%20%282%29-EEpfZiNWVCFOVnVa7ptlxVbJhmqHqW.jpeg",
    "Portrait in a dark gathered blouse",
  ],
  [
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202026-09-20%20at%2012.28.03%20AM%20%281%29-YJiu7q9cbx6EhiPvLimbvusNReXIbL.jpeg",
    "Outdoor full-length portrait",
  ],
  [
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202026-09-20%20at%2012.28.02%20AM-YW9QxoItSz3EWDGKVqW6npb9U8vSJy.jpeg",
    "Portrait beside a car",
  ],
  [
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202026-09-20%20at%2012.28.03%20AM-FBkBHnl7V8yyqR6fVY6aGHbomZEY7N.jpeg",
    "Close-up outdoor portrait",
  ],
  [
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202026-09-20%20at%2012.28.03%20AM%20%282%29-8R19KS3Kt4oHOp4k57ixYdMn738BMd.jpeg",
    "Creative portrait at a café table",
  ],
  [
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202026-09-20%20at%2012.28.04%20AM%20%281%29-FppX8MZM430VHcVuPUwbZVjHSqjAyi.jpeg",
    "Portrait in a white shirt",
  ],
  [
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202026-09-18%20at%2010.13.26%20PM-DhEmZ0o5ZVFTvisobGpCYPB4Z05unW.jpeg",
    "Formal portrait in a blue graduation stole",
  ],
  [
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202026-09-18%20at%2010.34.55%20PM-ftPIAGTCoZMtKgX5gb0fC5pXvGoEES.jpeg",
    "Warm portrait on a cream sofa",
  ],
  [
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202026-09-19%20at%208.47.45%20AM-5CgPp2cK058HIWglW1MaImNjJK9P30.jpeg",
    "Close-up portrait with copper braids",
  ],
] as const;

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Faith Ekuase | YouTube Vlogger & Storyteller" },
      {
        name: "description",
        content:
          "Meet Faith Ekuase, a YouTube vlogger and storyteller sharing real, personal moments through her lens.",
      },
      { property: "og:title", content: "Faith Ekuase | Life, through my lens." },
      {
        property: "og:description",
        content:
          "A cinematic creator portfolio featuring Faith's vlogs, story, and collaboration details.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const EMAIL = "mailto:faithekuase1@gmail.com";
const MEDIA_KIT =
  "mailto:faithekuase1@gmail.com?subject=Media%20Kit%20Request&body=Hi%20Faith%2C%0A%0AI'd%20love%20to%20request%20your%20latest%20media%20kit.%0A";
const WHATSAPP = "https://wa.me/2347055082561";
const footerLinks: Array<[string, string]> = [
  ["YouTube", "https://youtube.com/@faith-ekuase"],
  ["Instagram", "https://www.instagram.com/faith_ekuase/"],
  ["Pinterest", "https://www.pinterest.com/faithekuase1/"],
  ["TikTok", "https://www.tiktok.com/@.faithekuase"],
  ["Email", EMAIL],
  ["WhatsApp", WHATSAPP],
];

type Vlog = {
  id: string;
  media_url: string;
  title: string;
  category: string;
  description: string;
  sort_order: number;
};

const attachedVlogs: Vlog[] = [
  {
    id: "attached-vlog-1",
    media_url:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Video%202026-09-20%20at%2012.46.25%20AM-FpDbzxVaJdJeDvLal8yzMVNs0GDhoQ.mp4",
    title: "A little moment worth sharing",
    category: "Everyday moments",
    description: "A glimpse into the moments that make the everyday feel special.",
    sort_order: 1,
  },
  {
    id: "attached-vlog-2",
    media_url:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Video%202026-09-20%20at%2012.46.33%20AM%20%281%29-YUxJ2QqKtIh6lId0Uj5nhr53qRqjft.mp4",
    title: "Come along with me",
    category: "Life lately",
    description: "A personal look at life, movement, and the stories in between.",
    sort_order: 2,
  },
  {
    id: "attached-vlog-3",
    media_url:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Video%202026-09-20%20at%2012.46.33%20AM-aT0g7RsXFydyqWS0h32uif84lPh4BI.mp4",
    title: "Through my lens",
    category: "Creator diary",
    description: "A short behind-the-scenes glimpse from my world.",
    sort_order: 3,
  },
];

function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <div
      className={`reveal ${className}`}
      style={{ "--reveal-delay": `${delay}ms` } as React.CSSProperties}
    >
      {children}
    </div>
  );
}

function Index() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [videos, setVideos] = useState<Vlog[]>(attachedVlogs);
  const [showAllVideos, setShowAllVideos] = useState(false);
  const [content, setContent] = useState<PortfolioContent>(DEFAULT_PORTFOLIO_CONTENT);

  // Inquiry form state
  const [inquiryForm, setInquiryForm] = useState({
    name: "",
    email: "",
    companyOrBrand: "",
    projectType: "sponsored_vlog" as NonNullable<Inquiry["projectType"]>,
    timeline: "",
    message: "",
  });
  const [inquirySubmitting, setInquirySubmitting] = useState(false);
  const [inquirySuccess, setInquirySuccess] = useState(false);
  const [inquiryError, setInquiryError] = useState<string | null>(null);

  // Media kit modal state
  const [mediaKitModalOpen, setMediaKitModalOpen] = useState(false);
  const [mediaKitForm, setMediaKitForm] = useState({ name: "", email: "", company: "", notes: "" });
  const [mediaKitSubmitting, setMediaKitSubmitting] = useState(false);
  const [mediaKitSuccess, setMediaKitSuccess] = useState(false);

  useEffect(() => {
    // Seed initial vlogs if collection is empty
    seedInitialVlogsIfEmpty();

    // Subscribe to live vlogs from Firestore
    const unsub = subscribeVlogs(
      (items) => {
        if (items.length > 0) {
          setVideos(items);
        }
      },
      (err) => console.warn("Live vlogs sync fallback to default:", err),
    );

    // Subscribe to live portfolio content
    const unsubContent = subscribePortfolioContent(
      (data) => setContent(data),
      (err) => console.warn("Portfolio content sync fallback to default:", err),
    );

    return () => {
      unsub();
      unsubContent();
    };
  }, []);

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryForm.name || !inquiryForm.email || !inquiryForm.message) {
      setInquiryError("Please fill in your name, email, and message.");
      return;
    }

    setInquirySubmitting(true);
    setInquiryError(null);
    try {
      await submitInquiry({
        name: inquiryForm.name,
        email: inquiryForm.email,
        companyOrBrand: inquiryForm.companyOrBrand,
        projectType: inquiryForm.projectType,
        timeline: inquiryForm.timeline,
        message: inquiryForm.message,
      });
      setInquirySuccess(true);
      setInquiryForm({
        name: "",
        email: "",
        companyOrBrand: "",
        projectType: "sponsored_vlog",
        timeline: "",
        message: "",
      });
    } catch (err: unknown) {
      setInquiryError(
        err instanceof Error
          ? err.message
          : "Failed to send proposal. Please try again or email Faith directly.",
      );
    } finally {
      setInquirySubmitting(false);
    }
  };

  const handleMediaKitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mediaKitForm.name || !mediaKitForm.email) return;

    setMediaKitSubmitting(true);
    try {
      await submitMediaKitRequest(mediaKitForm);
      setMediaKitSuccess(true);
      setMediaKitForm({ name: "", email: "", company: "", notes: "" });
    } catch (err: unknown) {
      console.error("Media kit request failed:", err);
    } finally {
      setMediaKitSubmitting(false);
    }
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 28);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach(
          (entry) => entry.isIntersecting && entry.target.classList.add("is-visible"),
        ),
      { threshold: 0.12 },
    );
    document.querySelectorAll(".reveal").forEach((element) => observer.observe(element));
    return () => {
      window.removeEventListener("scroll", onScroll);
      observer.disconnect();
    };
  }, []);

  const closeMenu = () => setMenuOpen(false);
  const visibleVideos = showAllVideos ? videos : videos.slice(0, 4);

  return (
    <main className="overflow-x-clip bg-background text-foreground">
      <header className={`site-nav ${scrolled ? "site-nav-scrolled" : ""}`}>
        <a href="#home" className="font-display text-lg font-semibold" onClick={closeMenu}>
          Faith Ekuase
        </a>
        <nav
          className="hidden items-center gap-8 text-sm text-muted-foreground md:flex"
          aria-label="Main navigation"
        >
          <a className="nav-link" href="#home">
            Home
          </a>
          <a className="nav-link" href="#about">
            About
          </a>
          <a className="nav-link" href="#vlogs">
            Vlogs
          </a>
          <a className="nav-link" href="#modelling">
            Modelling
          </a>
          <a className="nav-link" href="#collaborate">
            Collaborate
          </a>
          <a className="nav-link" href="#contact">
            Contact
          </a>
        </nav>
        <button
          className="icon-button nav-menu-button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        {menuOpen && (
          <nav className="mobile-menu md:hidden" aria-label="Mobile navigation">
            {[
              ["Home", "#home"],
              ["About", "#about"],
              ["Vlogs", "#vlogs"],
              ["Modelling", "#modelling"],
              ["Collaborate", "#collaborate"],
              ["Contact", "#contact"],
            ].map(([label, href]) => (
              <a key={href} href={href} onClick={closeMenu}>
                {label}
                <ArrowDownRight size={18} />
              </a>
            ))}
          </nav>
        )}
      </header>

      <section id="home" className="hero-section">
        <div className="hero-copy">
          <p className="eyebrow hero-enter">
            YouTube Vlogger · Storyteller · Creator · Content Creator
          </p>
          <h1 className="hero-title hero-enter hero-enter-delay">
            Life, through
            <br />
            my lens.
          </h1>
          <div className="hero-body hero-enter hero-enter-delay-2 whitespace-pre-line">
            <p>{content.heroSubtitle}</p>
          </div>
          <div className="hero-actions hero-enter hero-enter-delay-2">
            <a href="#vlogs" className="button-primary">
              Explore my vlogs <Play size={15} fill="currentColor" />
            </a>
            <a href="#contact" className="button-secondary">
              Work with me <ArrowDownRight size={16} />
            </a>
          </div>
          <p className="hero-note hero-enter hero-enter-delay-2">
            Creating moments worth watching.
          </p>
        </div>
        <div className="hero-portrait-wrap hero-enter">
          <img
            src={content.heroImageUrl}
            alt="Faith Ekuase"
            className="hero-portrait"
            fetchPriority="high"
          />
          <div className="portrait-caption">
            <span>{content.heroCaption}</span>
          </div>
        </div>
      </section>

      <section id="vlogs" className="section section-vlogs">
        <Reveal className="section-heading">
          <p className="eyebrow">Selected work · 2026</p>
          <h2>
            Come along for
            <br />
            the journey.
          </h2>
          <p>
            <em>A look at what I create.</em>
            <br />
            Explore a selection of my recent content across lifestyle, beauty, fashion, and everyday
            experiences, created to feel authentic and engaging.
          </p>
        </Reveal>
        <div className="video-layout">
          {visibleVideos.map((video, index) => (
            <Reveal
              key={video.id}
              className={`video-card ${index === 0 ? "video-featured" : ""}`}
              delay={index * 90}
            >
              <div className="video-frame">
                <video
                  src={video.media_url}
                  controls
                  preload="metadata"
                  playsInline
                  aria-label={video.title}
                />
              </div>
              <div className="video-info">
                <div>
                  <p className="eyebrow">{video.category}</p>
                  <h3>{video.title}</h3>
                  <p>{video.description}</p>
                </div>
                <a href={video.media_url} target="_blank" rel="noreferrer" className="watch-link">
                  Watch vlog <Play size={14} fill="currentColor" />
                </a>
              </div>
            </Reveal>
          ))}
        </div>
        {videos.length > 4 && (
          <button
            className="button-secondary mx-auto mt-10 flex"
            onClick={() => setShowAllVideos((value) => !value)}
          >
            {showAllVideos ? "Show less" : "See more vlogs"}
          </button>
        )}
      </section>

      <section id="about" className="section about-section">
        <Reveal className="polaroid-wrap">
          <figure className="polaroid">
            <img
              src={content.aboutImageUrl}
              alt="Faith Ekuase introducing herself in a colourful portrait"
              loading="lazy"
            />
            <figcaption>{content.aboutPolaroidCaption}</figcaption>
          </figure>
        </Reveal>
        <Reveal className="about-copy" delay={120}>
          <p className="eyebrow">Behind the camera</p>
          <h2>The person behind the vlogs.</h2>
          <p className="lead">{content.aboutLead}</p>
          <div className="space-y-4 whitespace-pre-line text-muted-foreground leading-relaxed">
            <p>{content.aboutStory}</p>
          </div>
          <p className="closing-line">Still becoming. Still creating. Still grateful.</p>
        </Reveal>
      </section>

      <section id="modelling" className="section modelling-section">
        <Reveal className="section-heading">
          <p className="eyebrow">Selected portraits · 2026</p>
          <h2>
            Modelling,
            <br />
            through my lens.
          </h2>
          <p>
            A collection of portraits, fashion moments, and everyday frames that celebrate
            expression, confidence, and the stories we carry in front of the camera.
          </p>
        </Reveal>
        <div className="modelling-grid">
          {content.modellingImages.map((img, index) => (
            <Reveal
              key={`${img.url}-${index}`}
              className={`modelling-card modelling-card-${(index % 14) + 1}`}
              delay={(index % 4) * 70}
            >
              <img src={img.url} alt={img.caption || "Modelling portrait"} loading="lazy" />
            </Reveal>
          ))}
        </div>
      </section>

      <section className="section approach-section">
        <Reveal className="approach-intro">
          <p className="eyebrow">My approach</p>
          <h2>
            What makes a<br />
            good vlog?
          </h2>
          <p>
            For me, it’s not always about having the biggest moment. Sometimes it’s the small
            details—the conversations, the atmosphere, the unexpected parts of a day, or the feeling
            of being there.
          </p>
        </Reveal>
        <div className="principles">
          {[
            [
              "01",
              "Real moments",
              "I capture experiences in a way that feels natural and personal.",
            ],
            [
              "02",
              "A personal perspective",
              "Every vlog is shaped by my own voice, personality, and way of seeing things.",
            ],
            [
              "03",
              "Stories worth sharing",
              "I look for the details that turn an ordinary experience into something worth watching.",
            ],
          ].map(([number, title, text], index) => (
            <Reveal className="principle" delay={index * 80} key={number}>
              <span>{number}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section id="collaborate" className="collab-section">
        <Reveal>
          <p className="eyebrow">For brands & creative teams</p>
          <h2>
            Let’s create something
            <br />
            worth watching.
          </h2>
        </Reveal>
        <div className="collab-grid">
          <Reveal className="collab-copy">
            <p>I love discovering new experiences and sharing them through my vlogs.</p>
            <p>
              For brands, that can mean introducing a product, exploring a place, sharing an
              experience, or creating a story that feels natural within my content.
            </p>
            <p>
              I’m open to collaborations that fit my creative style and give my audience something
              meaningful, useful, or enjoyable to watch.
            </p>
            <a href="#contact" className="button-dark">
              Work with Faith <ArrowUpRight size={16} />
            </a>
          </Reveal>
          <Reveal className="opportunities" delay={100}>
            <p className="eyebrow">Ideas we can discuss</p>
            {[
              "Sponsored vlogs",
              "Product integrations",
              "Lifestyle features",
              "Experience-based content",
              "Brand storytelling",
              "Creative collaborations",
            ].map((item) => (
              <div key={item}>
                <span>{item}</span>
                <ArrowUpRight size={17} />
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      <section className="section why-section">
        <Reveal className="why-heading">
          <Quote size={36} strokeWidth={1.4} />
          <h2>
            More than
            <br />
            just a mention.
          </h2>
          <p>
            I want collaborations to feel like part of the story—not something that interrupts it.
          </p>
        </Reveal>
        <Reveal className="why-list" delay={100}>
          <p>
            That means understanding the brand, finding a natural creative direction, and making
            content that feels authentic to my audience and my style.
          </p>
          {[
            "A personal, creator-led perspective",
            "Natural storytelling through vlogs",
            "Thoughtful integration into relevant content",
            "Clear communication throughout the project",
            "A collaborative approach from concept to delivery",
          ].map((item, i) => (
            <div key={item}>
              <span>0{i + 1}</span>
              {item}
            </div>
          ))}
          <p className="closing-line">
            Let’s create something your audience will genuinely enjoy watching.
          </p>
        </Reveal>
      </section>

      <section className="media-kit-section">
        <Reveal>
          <p className="eyebrow">The details</p>
          <h2>
            Let’s talk
            <br />
            numbers.
          </h2>
        </Reveal>
        <Reveal className="media-kit-copy" delay={100}>
          <p>Want to know more about my audience, platforms, and collaboration opportunities?</p>
          <p>Request my media kit for the latest available creator information.</p>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setMediaKitModalOpen(true)}
              className="button-primary cursor-pointer"
            >
              Request media kit <Mail size={16} />
            </button>
            <a href={MEDIA_KIT} className="button-secondary">
              Direct email <ArrowUpRight size={14} />
            </a>
          </div>
        </Reveal>
      </section>

      <section className="section socials-section">
        <Reveal className="section-heading">
          <p className="eyebrow">Elsewhere online</p>
          <h2>Follow along.</h2>
          <p>Watch my latest vlogs, see what I’m creating, and come along for the journey.</p>
        </Reveal>
        <div className="social-list">
          <SocialRow
            number="01"
            icon={<Youtube />}
            name="YouTube"
            text="Watch my vlogs and explore my latest videos."
            action="Watch on YouTube"
            href={content.socialLinks?.youtube || "https://youtube.com/@faith-ekuase"}
          />
          <SocialRow
            number="02"
            icon={<Instagram />}
            name="Instagram"
            text="A closer look at my life, creative updates, and moments outside the vlog."
            action="Follow on Instagram"
            href={content.socialLinks?.instagram || "https://www.instagram.com/faith_ekuase/"}
          />
          <SocialRow
            number="03"
            icon={<span className="pinterest-mark">P</span>}
            name="Pinterest"
            text="A collection of visual inspiration, ideas, and things I love."
            action="Visit Pinterest"
            href={content.socialLinks?.pinterest || "https://www.pinterest.com/faithekuase1/"}
          />
          <SocialRow
            number="04"
            icon={<span className="pinterest-mark">T</span>}
            name="TikTok"
            text="Short-form moments, lifestyle inspiration, and everyday experiences."
            action="Follow on TikTok"
            href={content.socialLinks?.tiktok || "https://www.tiktok.com/@.faithekuase"}
          />
          {content.socialLinks?.customLinks &&
            content.socialLinks.customLinks.map((custom, idx) => (
              <SocialRow
                key={custom.id || idx}
                number={String(5 + idx).padStart(2, "0")}
                icon={
                  <span className="pinterest-mark">{custom.platform.charAt(0).toUpperCase()}</span>
                }
                name={custom.platform || custom.title}
                text={custom.description || `Connect with me on ${custom.platform}.`}
                action={custom.actionText || `Visit ${custom.platform}`}
                href={custom.url}
              />
            ))}
        </div>
      </section>

      <section id="contact" className="contact-section">
        <Reveal>
          <p className="eyebrow">Start a conversation</p>
          <h2>
            Have a collaboration
            <br />
            in mind?
          </h2>
          <p className="contact-lead">
            I’d love to hear from you. Whether you’re a brand, agency, or creative team, send me
            your campaign idea, timeline, and what you’d like to create.
          </p>
        </Reveal>

        {/* Live Collaboration Form */}
        <Reveal className="mt-8 rounded-2xl border border-border bg-card p-6 sm:p-8" delay={100}>
          <h3 className="font-display text-xl sm:text-2xl font-normal">
            Send a Collaboration Proposal
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Directly enters Faith's priority review queue in the admin portal.
          </p>

          {inquirySuccess ? (
            <div className="mt-6 rounded-xl border border-emerald-500/30 bg-emerald-950/40 p-6 text-center">
              <CheckCircle2 size={36} className="mx-auto text-emerald-400" />
              <h4 className="mt-3 font-display text-xl text-emerald-200">Proposal Submitted!</h4>
              <p className="mt-2 text-xs text-muted-foreground">
                Thank you for reaching out. Your proposal has been securely logged in Faith's
                creator dashboard. Faith will review your brief and get back to you shortly.
              </p>
              <button onClick={() => setInquirySuccess(false)} className="button-secondary mt-5">
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleInquirySubmit} className="mt-6 space-y-4">
              {inquiryError && (
                <div className="rounded-lg border border-red-500/40 bg-red-950/40 p-3 text-xs text-red-200">
                  {inquiryError}
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-warm">Your Name *</label>
                  <input
                    type="text"
                    required
                    value={inquiryForm.name}
                    onChange={(e) => setInquiryForm({ ...inquiryForm, name: e.target.value })}
                    placeholder="e.g. Sarah Jenkins"
                    className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-warm">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={inquiryForm.email}
                    onChange={(e) => setInquiryForm({ ...inquiryForm, email: e.target.value })}
                    placeholder="e.g. sarah@brand.com"
                    className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-warm">
                    Company / Brand
                  </label>
                  <input
                    type="text"
                    value={inquiryForm.companyOrBrand}
                    onChange={(e) =>
                      setInquiryForm({ ...inquiryForm, companyOrBrand: e.target.value })
                    }
                    placeholder="e.g. Glow Skincare"
                    className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-warm">
                    Collaboration Type
                  </label>
                  <select
                    value={inquiryForm.projectType}
                    onChange={(e) =>
                      setInquiryForm({
                        ...inquiryForm,
                        projectType: e.target.value as NonNullable<Inquiry["projectType"]>,
                      })
                    }
                    className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
                  >
                    <option value="sponsored_vlog">Sponsored Vlog</option>
                    <option value="brand_ambassadorship">Brand Ambassadorship</option>
                    <option value="modelling_campaign">Modelling Campaign</option>
                    <option value="event_appearance">Event Appearance</option>
                    <option value="other">Other Partnership</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-warm">
                  Campaign Timeline / Preferred Dates
                </label>
                <input
                  type="text"
                  value={inquiryForm.timeline}
                  onChange={(e) => setInquiryForm({ ...inquiryForm, timeline: e.target.value })}
                  placeholder="e.g. Next month, Q3 launch, flexible"
                  className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-warm">
                  Campaign Brief & Project Details *
                </label>
                <textarea
                  rows={4}
                  required
                  value={inquiryForm.message}
                  onChange={(e) => setInquiryForm({ ...inquiryForm, message: e.target.value })}
                  placeholder="Describe your brand, campaign goals, key deliverables, and deliverables..."
                  className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={inquirySubmitting}
                  className="button-primary inline-flex items-center gap-2"
                >
                  <Send size={15} />
                  <span>{inquirySubmitting ? "Submitting..." : "Send Proposal"}</span>
                </button>
              </div>
            </form>
          )}
        </Reveal>

        <Reveal className="contact-actions mt-10" delay={150}>
          <a
            href={`mailto:${content.socialLinks?.email || "faithekuase1@gmail.com"}`}
            className="button-secondary"
          >
            Email me directly <Mail size={16} />
          </a>
          <a
            href={content.socialLinks?.whatsappLink || "https://wa.me/2347055082561"}
            target="_blank"
            rel="noreferrer"
            className="button-secondary"
          >
            WhatsApp me <MessageCircle size={16} />
          </a>
        </Reveal>
        <Reveal className="contact-details">
          <a href={`mailto:${content.socialLinks?.email || "faithekuase1@gmail.com"}`}>
            {content.socialLinks?.email || "faithekuase1@gmail.com"}
          </a>
          <a
            href={content.socialLinks?.whatsappLink || "https://wa.me/2347055082561"}
            target="_blank"
            rel="noreferrer"
          >
            {content.socialLinks?.whatsappNumber || "+234 705 508 2561"}
          </a>
          <p>
            For collaboration enquiries, please include a brief description of your project and the
            best way to reach you.
          </p>
        </Reveal>
      </section>

      <section className="final-cta">
        <Reveal>
          <p className="eyebrow">One more thing</p>
          <h2>
            Your next story
            <br />
            could start here.
          </h2>
          <p>
            Have a product, experience, or idea you’d love to share through a vlog? Let’s create
            something people will want to watch.
          </p>
          <div>
            <a href="#contact" className="button-primary">
              Work with Faith <ArrowUpRight size={16} />
            </a>
            <a href="#vlogs" className="button-secondary">
              Explore my vlogs <Play size={14} />
            </a>
          </div>
        </Reveal>
      </section>

      <footer>
        <div>
          <a href="#home" className="footer-brand">
            Faith Ekuase
          </a>
          <p>YouTube vlogger · Storyteller · Creator</p>
          <p>Life, through my lens.</p>
        </div>
        <nav aria-label="Footer navigation">
          {[
            ["YouTube", content.socialLinks?.youtube || "https://youtube.com/@faith-ekuase"],
            [
              "Instagram",
              content.socialLinks?.instagram || "https://www.instagram.com/faith_ekuase/",
            ],
            [
              "Pinterest",
              content.socialLinks?.pinterest || "https://www.pinterest.com/faithekuase1/",
            ],
            ["TikTok", content.socialLinks?.tiktok || "https://www.tiktok.com/@.faithekuase"],
            ...(content.socialLinks?.customLinks?.map((c) => [c.title || c.platform, c.url]) || []),
            ["Email", `mailto:${content.socialLinks?.email || "faithekuase1@gmail.com"}`],
            ["WhatsApp", content.socialLinks?.whatsappLink || "https://wa.me/2347055082561"],
          ].map(([label, href]) => (
            <a
              key={label}
              href={href}
              target={href.startsWith("http") ? "_blank" : undefined}
              rel={href.startsWith("http") ? "noreferrer" : undefined}
            >
              {label}
            </a>
          ))}
        </nav>
        <p className="copyright">© 2026 Faith Ekuase. All rights reserved.</p>
      </footer>

      {/* Interactive Media Kit Modal */}
      {mediaKitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-display text-xl">Request Official Media Kit</h3>
              <button
                onClick={() => {
                  setMediaKitModalOpen(false);
                  setMediaKitSuccess(false);
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>

            {mediaKitSuccess ? (
              <div className="py-8 text-center">
                <CheckCircle2 size={36} className="mx-auto text-emerald-400" />
                <h4 className="mt-3 font-display text-lg text-emerald-200">Request Received!</h4>
                <p className="mt-2 text-xs text-muted-foreground">
                  Thank you for your interest! Your request has been logged. Faith's management team
                  will send over the current creator deck and rate card shortly.
                </p>
                <button
                  onClick={() => {
                    setMediaKitModalOpen(false);
                    setMediaKitSuccess(false);
                  }}
                  className="button-primary mt-6 text-xs"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleMediaKitSubmit} className="mt-4 space-y-3.5 text-xs">
                <p className="text-muted-foreground">
                  Receive Faith's comprehensive media kit including audience analytics, past brand
                  highlights, and current rates.
                </p>

                <div>
                  <label className="mb-1 block font-semibold text-warm">Your Name *</label>
                  <input
                    type="text"
                    required
                    value={mediaKitForm.name}
                    onChange={(e) => setMediaKitForm({ ...mediaKitForm, name: e.target.value })}
                    placeholder="e.g. Alex Morgan"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-semibold text-warm">Business Email *</label>
                  <input
                    type="email"
                    required
                    value={mediaKitForm.email}
                    onChange={(e) => setMediaKitForm({ ...mediaKitForm, email: e.target.value })}
                    placeholder="e.g. alex@agency.com"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-semibold text-warm">
                    Company / Agency Name
                  </label>
                  <input
                    type="text"
                    value={mediaKitForm.company}
                    onChange={(e) => setMediaKitForm({ ...mediaKitForm, company: e.target.value })}
                    placeholder="e.g. Creative Media Group"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-semibold text-warm">
                    Campaign Notes / Objectives
                  </label>
                  <textarea
                    rows={2}
                    value={mediaKitForm.notes}
                    onChange={(e) => setMediaKitForm({ ...mediaKitForm, notes: e.target.value })}
                    placeholder="Any specific campaign timeline or deliverables in mind?"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setMediaKitModalOpen(false)}
                    className="button-secondary text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={mediaKitSubmitting}
                    className="button-primary text-xs"
                  >
                    {mediaKitSubmitting ? "Submitting..." : "Send Request"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

function SocialRow({
  number,
  icon,
  name,
  text,
  action,
  href,
}: {
  number: string;
  icon: React.ReactNode;
  name: string;
  text: string;
  action: string;
  href: string;
}) {
  return (
    <Reveal className="social-row">
      <span className="social-number">{number}</span>
      <span className="social-icon">{icon}</span>
      <div>
        <h3>{name}</h3>
        <p>{text}</p>
      </div>
      <a href={href} target="_blank" rel="noreferrer" aria-label={`${action} (opens in a new tab)`}>
        {action}
        <ArrowUpRight size={17} />
      </a>
    </Reveal>
  );
}
