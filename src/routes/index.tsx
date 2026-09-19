import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowDownRight,
  ArrowUpRight,
  Instagram,
  Mail,
  Menu,
  MessageCircle,
  Play,
  Quote,
  X,
  Youtube,
} from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "../integrations/supabase/client";

const heroAsset = {
  url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/channels4_profile-hcyvINGNgSvvHYQRzwyX2wxZXLHErM.jpg",
};
const aboutAsset = {
  url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/A%20little%20introduction%20is%20probably%20long%20overdue%20%F0%9F%8C%B7%20so%20hi%2C%20I%E2%80%99m%20Faith%F0%9F%92%97If%20you%E2%80%99re%20new%20here%2C%20i%E2%80%99m%20happ-Npc67YE18XDQpypAyIqjFkMHP3fG9X.jpg",
};

const modellingImages = [
  ["https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202026-09-20%20at%2012.28.01%20AM%20%283%29-TDjLVKmKvwz1tjagbmhATSzCyFNGAu.jpeg", "Portrait in a rich purple satin dress"],
  ["https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202026-09-20%20at%2012.28.01%20AM-SYPqvvdlo0AsYDQAIZHsA5r45lSFAm.jpeg", "Playful portrait in a purple dress"],
  ["https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202026-09-20%20at%2012.28.01%20AM%20%281%29-UNvIDQDWxiNsBQOvvYI8QISCFC8qyJ.jpeg", "Graduation portrait in blue and purple"],
  ["https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202026-09-20%20at%2012.28.02%20AM%20%281%29-NHeafEbz5iBn0aFeCrtNIiHqbtSj9X.jpeg", "Outdoor portrait in a patterned dress"],
  ["https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202026-09-20%20at%2012.28.01%20AM%20%282%29-AO9YvGea1puX0oMG2sl1gwYced6a6T.jpeg", "Full-length portrait in a purple dress"],
  ["https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202026-09-20%20at%2012.28.02%20AM%20%282%29-EEpfZiNWVCFOVnVa7ptlxVbJhmqHqW.jpeg", "Portrait in a dark gathered blouse"],
  ["https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202026-09-20%20at%2012.28.03%20AM%20%281%29-YJiu7q9cbx6EhiPvLimbvusNReXIbL.jpeg", "Outdoor full-length portrait"],
  ["https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202026-09-20%20at%2012.28.02%20AM-YW9QxoItSz3EWDGKVqW6npb9U8vSJy.jpeg", "Portrait beside a car"],
  ["https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202026-09-20%20at%2012.28.03%20AM-FBkBHnl7V8yyqR6fVY6aGHbomZEY7N.jpeg", "Close-up outdoor portrait"],
  ["https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202026-09-20%20at%2012.28.03%20AM%20%282%29-8R19KS3Kt4oHOp4k57ixYdMn738BMd.jpeg", "Creative portrait at a café table"],
  ["https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202026-09-20%20at%2012.28.04%20AM%20%281%29-FppX8MZM430VHcVuPUwbZVjHSqjAyi.jpeg", "Portrait in a white shirt"],
  ["https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202026-09-18%20at%2010.13.26%20PM-DhEmZ0o5ZVFTvisobGpCYPB4Z05unW.jpeg", "Formal portrait in a blue graduation stole"],
  ["https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202026-09-18%20at%2010.34.55%20PM-ftPIAGTCoZMtKgX5gb0fC5pXvGoEES.jpeg", "Warm portrait on a cream sofa"],
  ["https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202026-09-19%20at%208.47.45%20AM-5CgPp2cK058HIWglW1MaImNjJK9P30.jpeg", "Close-up portrait with copper braids"],
] as const;

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Faith Ekuase | YouTube Vlogger & Storyteller" },
      {
        name: "description",
        content: "Meet Faith Ekuase, a YouTube vlogger and storyteller sharing real, personal moments through her lens.",
      },
      { property: "og:title", content: "Faith Ekuase | Life, through my lens." },
      {
        property: "og:description",
        content: "A cinematic creator portfolio featuring Faith's vlogs, story, and collaboration details.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const EMAIL = "mailto:faithekuase1@gmail.com";
const MEDIA_KIT = "mailto:faithekuase1@gmail.com?subject=Media%20Kit%20Request&body=Hi%20Faith%2C%0A%0AI'd%20love%20to%20request%20your%20latest%20media%20kit.%0A";
const WHATSAPP = "https://wa.me/2347055082561";
const footerLinks: Array<[string, string]> = [
  ["YouTube", "https://youtube.com/@faith-ekuase"],
  ["Instagram", "https://www.instagram.com/faith_ekuase/"],
  ["Pinterest", "https://www.pinterest.com/faithekuase1/"],
  ["Email", EMAIL],
  ["WhatsApp", WHATSAPP],
];

type Vlog = { id: string; media_url: string; title: string; category: string; description: string; sort_order: number };

const attachedVlogs: Vlog[] = [
  {
    id: "attached-vlog-1",
    media_url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Video%202026-09-20%20at%2012.46.25%20AM-FpDbzxVaJdJeDvLal8yzMVNs0GDhoQ.mp4",
    title: "A little moment worth sharing",
    category: "Everyday moments",
    description: "A glimpse into the moments that make the everyday feel special.",
    sort_order: 1,
  },
  {
    id: "attached-vlog-2",
    media_url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Video%202026-09-20%20at%2012.46.33%20AM%20%281%29-YUxJ2QqKtIh6lId0Uj5nhr53qRqjft.mp4",
    title: "Come along with me",
    category: "Life lately",
    description: "A personal look at life, movement, and the stories in between.",
    sort_order: 2,
  },
  {
    id: "attached-vlog-3",
    media_url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Video%202026-09-20%20at%2012.46.33%20AM-aT0g7RsXFydyqWS0h32uif84lPh4BI.mp4",
    title: "Through my lens",
    category: "Creator diary",
    description: "A short behind-the-scenes glimpse from my world.",
    sort_order: 3,
  },
];

function Reveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <div className={`reveal ${className}`} style={{ "--reveal-delay": `${delay}ms` } as React.CSSProperties}>
      {children}
    </div>
  );
}

function Index() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [videos, setVideos] = useState<Vlog[]>([]);
  const [showAllVideos, setShowAllVideos] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 28);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add("is-visible")),
      { threshold: 0.12 },
    );
    document.querySelectorAll(".reveal").forEach((element) => observer.observe(element));
    return () => {
      window.removeEventListener("scroll", onScroll);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    let active = true;
    supabase
      .from("vlogs")
      .select("id, media_url, title, category, description, sort_order")
      .eq("is_visible", true)
      .eq("is_featured", true)
      .neq("media_url", "")
      .order("sort_order", { ascending: true })
      .then(({ data, error }) => {
        if (error) console.error("[v0] Failed to load published vlogs", error);
        if (active) {
          const published = (data ?? []) as Vlog[];
          const attached = attachedVlogs.filter((video) => !published.some((item) => item.media_url === video.media_url));
          setVideos([...published, ...attached].slice(0, 3));
        }
      });
    return () => { active = false; };
  }, []);

  const closeMenu = () => setMenuOpen(false);
  const visibleVideos = showAllVideos ? videos : videos.slice(0, 4);

  return (
    <main className="overflow-x-clip bg-background text-foreground">
      <header className={`site-nav ${scrolled ? "site-nav-scrolled" : ""}`}>
        <a href="#home" className="font-display text-lg font-semibold" onClick={closeMenu}>Faith Ekuase</a>
        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex" aria-label="Main navigation">
          <a className="nav-link" href="#home">Home</a><a className="nav-link" href="#about">About</a>
          <a className="nav-link" href="#vlogs">Vlogs</a><a className="nav-link" href="#modelling">Modelling</a><a className="nav-link" href="#collaborate">Collaborate</a>
          <a className="nav-link" href="#contact">Contact</a>
        </nav>
        <a href="#contact" className="button-primary nav-cta">Work with me <ArrowUpRight size={16} /></a>
        <button className="icon-button nav-menu-button" onClick={() => setMenuOpen((open) => !open)} aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen}>
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        {menuOpen && (
          <nav className="mobile-menu md:hidden" aria-label="Mobile navigation">
            {[["Home", "#home"], ["About", "#about"], ["Vlogs", "#vlogs"], ["Modelling", "#modelling"], ["Collaborate", "#collaborate"], ["Contact", "#contact"]].map(([label, href]) => (
              <a key={href} href={href} onClick={closeMenu}>{label}<ArrowDownRight size={18} /></a>
            ))}
          </nav>
        )}
      </header>

      <section id="home" className="hero-section">
        <div className="hero-copy">
          <p className="eyebrow hero-enter">YouTube Vlogger · Storyteller · Creator</p>
          <h1 className="hero-title hero-enter hero-enter-delay">Life, through<br />my lens.</h1>
          <div className="hero-body hero-enter hero-enter-delay-2">
            <p>I’m Faith Ekuase, a vlogger who loves capturing everyday moments, personal experiences, and the little things that make life worth remembering.</p>
            <p>Come along as I share my world, explore new experiences, and create videos that feel real, personal, and worth watching.</p>
          </div>
          <div className="hero-actions hero-enter hero-enter-delay-2">
            <a href="#vlogs" className="button-primary">Explore my vlogs <Play size={15} fill="currentColor" /></a>
            <a href="#contact" className="button-secondary">Work with me <ArrowDownRight size={16} /></a>
          </div>
          <p className="hero-note hero-enter hero-enter-delay-2">Creating moments worth watching.</p>
        </div>
        <div className="hero-portrait-wrap hero-enter">
          <img src={heroAsset.url} alt="Faith Ekuase with copper braids, looking thoughtfully to the side" className="hero-portrait" fetchPriority="high" />
          <div className="portrait-caption"><span>Based in Benin City</span><span>01 / 03</span></div>
        </div>
      </section>

      <section id="vlogs" className="section section-vlogs">
        <Reveal className="section-heading">
          <p className="eyebrow">Selected work · 2026</p>
          <h2>Come along for<br />the journey.</h2>
          <p>A collection of my favourite vlogs and creative projects. From everyday moments to new experiences, these videos are a glimpse into the stories I love capturing and sharing.</p>
        </Reveal>
        <div className="video-layout">
          {visibleVideos.map((video, index) => (
            <Reveal key={video.title} className={`video-card ${index === 0 ? "video-featured" : ""}`} delay={index * 90}>
              <div className="video-frame">
                <video src={video.media_url} controls preload="metadata" playsInline aria-label={video.title} />
              </div>
              <div className="video-info">
                <div><p className="eyebrow">{video.category}</p><h3>{video.title}</h3><p>{video.description}</p></div>
                <a href={video.media_url} target="_blank" rel="noreferrer" className="watch-link">Watch vlog <Play size={14} fill="currentColor" /></a>
              </div>
            </Reveal>
          ))}
        </div>
        {videos.length > 4 && <button className="button-secondary mx-auto mt-10 flex" onClick={() => setShowAllVideos((value) => !value)}>{showAllVideos ? "Show less" : "See more vlogs"}</button>}
      </section>

      <section id="about" className="section about-section">
        <Reveal className="polaroid-wrap">
          <figure className="polaroid">
            <img src={aboutAsset.url} alt="Faith Ekuase introducing herself in a colourful scrapbook-style portrait" loading="lazy" />
            <figcaption>hello, it’s Faith ♡</figcaption>
          </figure>
        </Reveal>
        <Reveal className="about-copy" delay={120}>
          <p className="eyebrow">Behind the camera</p><h2>The person behind the vlogs.</h2>
          <p className="lead">I’m Faith Ekuase.</p>
          <p>A Physiotherapy student, a vlogger, and someone who enjoys finding stories in the everyday.</p>
          <p>I love capturing experiences, sharing my perspective, and bringing people along for the moments that make life interesting. My faith is part of that journey too—quietly shaping the way I see things, the values I carry, and the gratitude I have for where I am.</p>
          <p>Between school, creating, and everything in between, I’m learning, growing, and discovering what I want to say through my videos.</p>
          <p className="closing-line">Still becoming. Still creating. Still grateful.</p>
        </Reveal>
      </section>

      <section id="modelling" className="section modelling-section">
        <Reveal className="section-heading">
          <p className="eyebrow">Selected portraits · 2026</p>
          <h2>Modelling,<br />through my lens.</h2>
          <p>A collection of portraits, fashion moments, and everyday frames that celebrate expression, confidence, and the stories we carry in front of the camera.</p>
        </Reveal>
        <div className="modelling-grid">
          {modellingImages.map(([src, alt], index) => (
            <Reveal key={src} className={`modelling-card modelling-card-${index + 1}`} delay={(index % 4) * 70}>
              <img src={src} alt={alt} loading="lazy" />
            </Reveal>
          ))}
        </div>
      </section>

      <section className="section approach-section">
        <Reveal className="approach-intro"><p className="eyebrow">My approach</p><h2>What makes a<br />good vlog?</h2><p>For me, it’s not always about having the biggest moment. Sometimes it’s the small details—the conversations, the atmosphere, the unexpected parts of a day, or the feeling of being there.</p></Reveal>
        <div className="principles">
          {[
            ["01", "Real moments", "I capture experiences in a way that feels natural and personal."],
            ["02", "A personal perspective", "Every vlog is shaped by my own voice, personality, and way of seeing things."],
            ["03", "Stories worth sharing", "I look for the details that turn an ordinary experience into something worth watching."],
          ].map(([number, title, text], index) => <Reveal className="principle" delay={index * 80} key={number}><span>{number}</span><h3>{title}</h3><p>{text}</p></Reveal>)}
        </div>
      </section>

      <section id="collaborate" className="collab-section">
        <Reveal><p className="eyebrow">For brands & creative teams</p><h2>Let’s create something<br />worth watching.</h2></Reveal>
        <div className="collab-grid">
          <Reveal className="collab-copy"><p>I love discovering new experiences and sharing them through my vlogs.</p><p>For brands, that can mean introducing a product, exploring a place, sharing an experience, or creating a story that feels natural within my content.</p><p>I’m open to collaborations that fit my creative style and give my audience something meaningful, useful, or enjoyable to watch.</p><a href="#contact" className="button-dark">Work with Faith <ArrowUpRight size={16} /></a></Reveal>
          <Reveal className="opportunities" delay={100}><p className="eyebrow">Ideas we can discuss</p>{["Sponsored vlogs", "Product integrations", "Lifestyle features", "Experience-based content", "Brand storytelling", "Creative collaborations"].map((item) => <div key={item}><span>{item}</span><ArrowUpRight size={17} /></div>)}</Reveal>
        </div>
      </section>

      <section className="section why-section">
        <Reveal className="why-heading"><Quote size={36} strokeWidth={1.4} /><h2>More than<br />just a mention.</h2><p>I want collaborations to feel like part of the story—not something that interrupts it.</p></Reveal>
        <Reveal className="why-list" delay={100}>
          <p>That means understanding the brand, finding a natural creative direction, and making content that feels authentic to my audience and my style.</p>
          {["A personal, creator-led perspective", "Natural storytelling through vlogs", "Thoughtful integration into relevant content", "Clear communication throughout the project", "A collaborative approach from concept to delivery"].map((item, i) => <div key={item}><span>0{i + 1}</span>{item}</div>)}
          <p className="closing-line">Let’s create something your audience will genuinely enjoy watching.</p>
        </Reveal>
      </section>

      <section className="media-kit-section">
        <Reveal><p className="eyebrow">The details</p><h2>Let’s talk<br />numbers.</h2></Reveal>
        <Reveal className="media-kit-copy" delay={100}><p>Want to know more about my audience, platforms, and collaboration opportunities?</p><p>Request my media kit for the latest available creator information.</p><a href={MEDIA_KIT} className="button-primary">Request media kit <Mail size={16} /></a></Reveal>
      </section>

      <section className="section socials-section">
        <Reveal className="section-heading"><p className="eyebrow">Elsewhere online</p><h2>Follow along.</h2><p>Watch my latest vlogs, see what I’m creating, and come along for the journey.</p></Reveal>
        <div className="social-list">
          <SocialRow number="01" icon={<Youtube />} name="YouTube" text="Watch my vlogs and explore my latest videos." action="Watch on YouTube" href="https://youtube.com/@faith-ekuase" />
          <SocialRow number="02" icon={<Instagram />} name="Instagram" text="A closer look at my life, creative updates, and moments outside the vlog." action="Follow on Instagram" href="https://www.instagram.com/faith_ekuase/" />
          <SocialRow number="03" icon={<span className="pinterest-mark">P</span>} name="Pinterest" text="A collection of visual inspiration, ideas, and things I love." action="Visit Pinterest" href="https://www.pinterest.com/faithekuase1/" />
        </div>
      </section>

      <section id="contact" className="contact-section">
        <Reveal><p className="eyebrow">Start a conversation</p><h2>Have a collaboration<br />in mind?</h2><p className="contact-lead">I’d love to hear from you. Whether you’re a brand, agency, or creative team, send me your campaign idea, timeline, and what you’d like to create.</p></Reveal>
        <Reveal className="contact-actions" delay={100}><a href={EMAIL} className="button-primary">Email me <Mail size={16} /></a><a href={WHATSAPP} target="_blank" rel="noreferrer" className="button-secondary">WhatsApp me <MessageCircle size={16} /></a></Reveal>
        <Reveal className="contact-details"><a href={EMAIL}>faithekuase1@gmail.com</a><a href={WHATSAPP} target="_blank" rel="noreferrer">+234 705 508 2561</a><p>For collaboration enquiries, please include a brief description of your project and the best way to reach you.</p></Reveal>
      </section>

      <section className="final-cta">
        <Reveal><p className="eyebrow">One more thing</p><h2>Your next story<br />could start here.</h2><p>Have a product, experience, or idea you’d love to share through a vlog? Let’s create something people will want to watch.</p><div><a href="#contact" className="button-primary">Work with Faith <ArrowUpRight size={16} /></a><a href="#vlogs" className="button-secondary">Explore my vlogs <Play size={14} /></a></div></Reveal>
      </section>

      <footer>
        <div><a href="#home" className="footer-brand">Faith Ekuase</a><p>YouTube vlogger · Storyteller · Creator</p><p>Life, through my lens.</p></div>
        <nav aria-label="Footer navigation">{footerLinks.map(([label, href]) => <a key={label} href={href} target={href.startsWith("http") ? "_blank" : undefined} rel={href.startsWith("http") ? "noreferrer" : undefined}>{label}</a>)}</nav>
        <p className="copyright">© 2026 Faith Ekuase. All rights reserved.</p>
      </footer>
    </main>
  );
}

function SocialRow({ number, icon, name, text, action, href }: { number: string; icon: React.ReactNode; name: string; text: string; action: string; href: string }) {
  return <Reveal className="social-row"><span className="social-number">{number}</span><span className="social-icon">{icon}</span><div><h3>{name}</h3><p>{text}</p></div><a href={href} target="_blank" rel="noreferrer" aria-label={`${action} (opens in a new tab)`}>{action}<ArrowUpRight size={17} /></a></Reveal>;
}
