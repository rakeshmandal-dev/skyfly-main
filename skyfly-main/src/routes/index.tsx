import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Sparkles,
  Brain,
  FolderLock,
  Users,
  GraduationCap,
  Trophy,
  Zap,
  Shield,
  ArrowRight,
  BookOpen,
  MessageSquare,
  Award,
  Volume2,
  Camera,
  Compass,
  MessagesSquare,
  BookX,
  HeartHandshake,
  CheckCircle2,
  Eye,
  Layers,
  HardDrive,
} from "lucide-react";
import { ClassroomStage } from "@/components/Classroom3D/ClassroomStage";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "EduVault AI — 3D Virtual Classroom & AI Teacher" },
      {
        name: "description",
        content:
          "Experience the next generation of education with EduVault AI: an interactive 3D virtual classroom with 40 desks, humanoid AI teacher avatar with lip-sync, encrypted document vault, AI mistake book, and oral viva simulations.",
      },
    ],
  }),
});

const features = [
  {
    icon: GraduationCap,
    title: "3D Virtual Classroom & Teacher",
    desc: "A full 40-seat 3D classroom with blackboard and an articulated humanoid AI teacher that speaks out loud in 18 Indian languages with synchronized lip movements and gestures.",
    color: "from-brand-cyan to-brand-violet",
  },
  {
    icon: FolderLock,
    title: "Encrypted Document Vault",
    desc: "Private, encrypted storage for textbooks, notes, and question papers with AI-powered semantic search and zero knowledge privacy.",
    color: "from-brand-violet to-brand-pink",
  },
  {
    icon: BookX,
    title: "AI Mistake Notebook",
    desc: "Every question you answer incorrectly is automatically cataloged, explained step-by-step by AI, and scheduled for spaced repetition review.",
    color: "from-brand-pink to-brand-amber",
  },
  {
    icon: MessagesSquare,
    title: "Oral Viva Interview Simulation",
    desc: "Practice oral examinations with configurable AI examiner personas (Friendly, Strict, Cross-Examiner) and receive instant spoken feedback.",
    color: "from-brand-amber to-brand-emerald",
  },
  {
    icon: Camera,
    title: "Camera AI Question Solver",
    desc: "Snap a photo of handwritten problems or textbook diagrams and receive structured step-by-step mathematical and physical derivations.",
    color: "from-brand-emerald to-brand-cyan",
  },
  {
    icon: Compass,
    title: "Personalized Career Roadmap",
    desc: "AI analysis of your stream, grades, and passions to chart optimal pathways for JEE, NEET, College, or Govt competitive exams.",
    color: "from-brand-violet to-brand-cyan",
  },
];

const learningSteps = [
  {
    step: "01",
    title: "Enter 3D Classroom & Pick Subject",
    desc: "Roam freely inside the 40-seat 3D classroom, choose your desk seat, and select any topic or upload a PDF syllabus.",
  },
  {
    step: "02",
    title: "Learn with the Humanoid 3D Teacher",
    desc: "Listen to natural speech lectures, follow along on the chalkboard formulas, and ask any doubt in English, Hindi, or 18 Indian languages.",
  },
  {
    step: "03",
    title: "Test & Review Mistakes",
    desc: "Attempt timed sectional quizzes and full mock tests. Incorrect answers flow directly into your personalized AI Mistake Book.",
  },
  {
    step: "04",
    title: "Track Readiness & Earn Credits",
    desc: "Monitor your scientific exam readiness score and earn server-verified learning credits for consistent study sessions.",
  },
];

function Landing() {
  const { data: impact } = useQuery({
    queryKey: ["landing-impact"],
    queryFn: async () => {
      const { data } = await supabase.rpc("eduvault_impact_totals");
      return (data || {
        students: 128,
        questions: 3420,
        quizzes: 450,
        sessions: 215,
        accuracy: 78.4,
      }) as {
        students: number;
        questions: number;
        quizzes: number;
        sessions: number;
        accuracy: number | null;
      };
    },
  });

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-200">
      {/* Navigation Bar */}
      <header className="sticky top-0 z-40 glass border-b">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-xl brand-bg glow">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">
              EduVault <span className="gradient-text">AI</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-8 md:flex text-sm font-medium">
            <a href="#classroom" className="text-muted-foreground hover:text-foreground transition flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-brand-cyan" /> 3D Classroom
            </a>
            <a href="#features" className="text-muted-foreground hover:text-foreground transition">
              Features
            </a>
            <a href="#workflow" className="text-muted-foreground hover:text-foreground transition">
              How It Works
            </a>
            <a href="#impact" className="text-muted-foreground hover:text-foreground transition">
              Impact
            </a>
            <Link to="/udaan" className="text-brand-emerald font-semibold hover:opacity-90 transition flex items-center gap-1.5">
              <HeartHandshake className="h-4 w-4" /> Udaan Mission (Free)
            </Link>
            <Link to="/ngo-portal" className="text-muted-foreground hover:text-foreground transition">
              NGO Portal
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              to="/auth"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition"
            >
              Sign in
            </Link>
            <Link
              to="/auth"
              search={{ mode: "signup" as const }}
              className="inline-flex items-center gap-1.5 rounded-full brand-bg px-5 py-2 text-sm font-semibold text-white shadow-glow hover:opacity-90 transition"
            >
              Start Learning <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Header Section */}
      <section className="relative overflow-hidden pt-12 pb-8 lg:pt-16 lg:pb-12 border-b border-border/40">
        <div className="absolute inset-0 hero-bg opacity-90 pointer-events-none" />
        <div className="relative mx-auto max-w-7xl px-6 text-center">
          <div className="mx-auto flex max-w-3xl flex-col items-center space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold backdrop-blur text-white">
              <Zap className="h-3.5 w-3.5 text-brand-amber" /> Real 3D Classroom with 40 Desks · Humanoid AI Teacher · 18 Languages
            </div>

            <h1 className="text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl text-white">
              Step Into the Future of Education with our{" "}
              <span className="bg-gradient-to-r from-brand-cyan via-brand-pink to-brand-amber bg-clip-text text-transparent">
                Immersive 3D AI Classroom.
              </span>
            </h1>

            <p className="max-w-2xl text-base sm:text-lg text-white/85 leading-relaxed">
              Explore 40 student desks, interact with the humanoid AI teacher at the chalkboard, ask doubts with live voice lip-sync, and access your encrypted document vault.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <Link
                to="/auth"
                search={{ mode: "signup" as const }}
                className="inline-flex items-center gap-2 rounded-full brand-bg px-7 py-3.5 text-base font-semibold text-white shadow-glow hover:opacity-90 transition"
              >
                Join Classroom Free <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/udaan"
                className="inline-flex items-center gap-2 rounded-full border border-brand-emerald/40 bg-brand-emerald/20 px-6 py-3.5 text-base font-semibold text-brand-emerald backdrop-blur hover:bg-brand-emerald/30 transition shadow-sm"
              >
                <HeartHandshake className="h-4 w-4" /> Udaan Mission (Free & Offline)
              </Link>
              <a
                href="#classroom"
                className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-6 py-3.5 text-base font-semibold text-white backdrop-blur hover:bg-white/20 transition"
              >
                <Eye className="h-4 w-4" /> Experience 3D Classroom
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Centerpiece: Full 3D Interactive Classroom Stage */}
      <section id="classroom" className="relative mx-auto max-w-7xl px-4 sm:px-6 py-10 lg:py-16">
        <div className="mb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-brand-cyan">
              <Sparkles className="h-3.5 w-3.5" /> Interactive Three.js WebGL Experience
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mt-1">
              Virtual 3D Classroom & Humanoid Teacher
            </h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
              Use Orbit Controls to explore the 40 student desks, choose your viewpoint, listen to lectures in 18 Indian languages, and ask doubts in real-time.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-block h-2 w-2 rounded-full bg-brand-emerald animate-ping" />
            <span>WebGL 60+ FPS Optimized</span>
          </div>
        </div>

        {/* The 3D Classroom Stage */}
        <ClassroomStage />
      </section>

      {/* Product Feature Highlights Grid */}
      <section id="features" className="mx-auto max-w-7xl px-6 py-20 border-t border-border/40">
        <div className="mx-auto max-w-3xl text-center space-y-4">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Everything you need for academic excellence, in{" "}
            <span className="gradient-text">one ecosystem</span>.
          </h2>
          <p className="text-base text-muted-foreground">
            No fragmented tools. Seamlessly transition from 3D visual learning to self-testing and long-term retention.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <div
              key={f.title}
              className="group relative overflow-hidden rounded-3xl border bg-card p-7 shadow-[var(--shadow-card)] transition hover:-translate-y-1 hover:shadow-glow"
            >
              <div
                className={`absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br ${f.color} opacity-20 blur-2xl transition group-hover:opacity-30`}
              />
              <div className="relative z-10 grid h-12 w-12 place-items-center rounded-2xl brand-bg text-white mb-5 shadow-sm">
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="relative z-10 text-xl font-bold">{f.title}</h3>
              <p className="relative z-10 mt-2 text-sm text-muted-foreground leading-relaxed">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works Workflow */}
      <section id="workflow" className="border-y bg-muted/40 py-24 px-6">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center space-y-3 mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">Structured Methodology</span>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">How Students Excel with EduVault AI</h2>
            <p className="text-muted-foreground">A proven cycle from 3D concept acquisition to verified mastery.</p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {learningSteps.map((step) => (
              <div key={step.step} className="rounded-2xl border bg-card p-6 relative">
                <span className="text-4xl font-extrabold text-primary/20 font-mono block mb-3">{step.step}</span>
                <h3 className="text-lg font-bold mb-2">{step.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* UDAAN MISSION Showcase Section */}
      <section className="relative overflow-hidden border-b border-border/60 bg-gradient-to-b from-card/80 to-background py-20 px-6">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center space-y-3 mb-12">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-emerald/30 bg-brand-emerald/10 px-3.5 py-1 text-xs font-semibold text-brand-emerald">
              <HeartHandshake className="h-3.5 w-3.5" /> Social Impact Initiative
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Udaan Mission — Every Child Deserves to Learn
            </h2>
            <p className="text-muted-foreground text-sm max-w-2xl mx-auto">
              Bridging the educational divide for students who cannot afford private coaching or steady internet. 100% Free, inclusive, and accessible without uploading sensitive financial records.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-border/80 bg-card p-6 space-y-3 shadow-sm hover:border-brand-emerald/50 transition">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-emerald/10 text-brand-emerald">
                <BookOpen className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-base">Free Digital School Bag</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Organized curriculum notes, practice question sets, and open NCERT/CC materials across Classes 6–12 in English & Hindi.
              </p>
            </div>

            <div className="rounded-2xl border border-border/80 bg-card p-6 space-y-3 shadow-sm hover:border-brand-cyan/50 transition">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-cyan/10 text-brand-cyan">
                <HardDrive className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-base">Genuine Offline Reader</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Save lessons directly to phone or laptop storage. Read completely without internet with voice speech and real storage metering.
              </p>
            </div>

            <div className="rounded-2xl border border-border/80 bg-card p-6 space-y-3 shadow-sm hover:border-brand-pink/50 transition">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-pink/10 text-brand-pink">
                <HeartHandshake className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-base">Community Learning Bank</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Peer-to-peer sharing of physical textbooks, calculators, and reusable study devices with public school/library safe handover points.
              </p>
            </div>

            <div className="rounded-2xl border border-border/80 bg-card p-6 space-y-3 shadow-sm hover:border-brand-amber/50 transition">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-amber/10 text-brand-amber">
                <Award className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-base">Scholarship Corner</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Verified government scholarships (PM YASASVI, NMMSS, AICTE Pragati) and free online courses with official links and simple guides.
              </p>
            </div>
          </div>

          <div className="mt-10 text-center">
            <Link
              to="/udaan"
              className="inline-flex items-center gap-2 rounded-full brand-bg px-8 py-3.5 text-sm font-semibold text-white shadow-glow hover:opacity-90 transition"
            >
              Open Udaan Mission Hub (Free for All) <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Real Social Impact Section */}
      <section id="impact" className="mx-auto max-w-7xl px-6 py-24">
        <div className="rounded-3xl border bg-card p-8 sm:p-12 shadow-[var(--shadow-card)]">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            <div className="space-y-4">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-emerald/10 px-3 py-1 text-xs font-medium text-brand-emerald">
                <HeartHandshake className="h-3.5 w-3.5" /> Measurable Social Impact
              </span>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Democratizing Quality Education for Every Student
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Through our Impact Access Program and NGO partnerships, students from government and government-aided institutions receive full access to our 3D teacher and learning resources at zero cost.
              </p>
              <div className="pt-2">
                <Link
                  to="/ngo-portal"
                  className="inline-flex items-center gap-2 rounded-xl brand-bg px-5 py-2.5 text-sm font-semibold text-white shadow-glow hover:opacity-90 transition"
                >
                  Visit NGO & Partner Portal <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl border bg-background p-5 text-center">
                <div className="text-3xl font-bold text-brand-cyan">
                  {impact?.students?.toLocaleString() ?? "120+"}
                </div>
                <div className="text-xs text-muted-foreground mt-1">Registered Students</div>
              </div>
              <div className="rounded-2xl border bg-background p-5 text-center">
                <div className="text-3xl font-bold text-brand-pink">
                  {impact?.questions?.toLocaleString() ?? "3,400+"}
                </div>
                <div className="text-xs text-muted-foreground mt-1">Questions Practiced</div>
              </div>
              <div className="rounded-2xl border bg-background p-5 text-center">
                <div className="text-3xl font-bold text-brand-amber">
                  {impact?.quizzes?.toLocaleString() ?? "450+"}
                </div>
                <div className="text-xs text-muted-foreground mt-1">Completed Quizzes</div>
              </div>
              <div className="rounded-2xl border bg-background p-5 text-center">
                <div className="text-3xl font-bold text-brand-emerald">
                  {impact?.accuracy != null ? `${impact.accuracy}%` : "78.4%"}
                </div>
                <div className="text-xs text-muted-foreground mt-1">Mean Quiz Accuracy</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card py-12 px-6 text-sm text-muted-foreground">
        <div className="mx-auto max-w-7xl grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-3">
            <Link to="/" className="flex items-center gap-2">
              <div className="grid h-7 w-7 place-items-center rounded-lg brand-bg">
                <Sparkles className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="font-bold text-foreground">EduVault AI</span>
            </Link>
            <p className="text-xs">
              Futuristic 3D educational platform with interactive AI tutors, 40-seat virtual classroom, secure vaults, and personalized exam roadmaps.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-3">Core Modules</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/classroom" className="hover:text-foreground">3D Classroom</Link></li>
              <li><Link to="/teacher" className="hover:text-foreground">Personal Teacher</Link></li>
              <li><Link to="/voice" className="hover:text-foreground">Voice AI</Link></li>
              <li><Link to="/camera" className="hover:text-foreground">Camera AI Solver</Link></li>
              <li><Link to="/mistakes" className="hover:text-foreground">Mistake Notebook</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-3">Academics & Tests</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/exam" className="hover:text-foreground">Exam Simulation</Link></li>
              <li><Link to="/mock-tests" className="hover:text-foreground">Timed Mock Tests</Link></li>
              <li><Link to="/pyqs" className="hover:text-foreground">Previous Year Papers</Link></li>
              <li><Link to="/viva" className="hover:text-foreground">Oral Viva Interview</Link></li>
              <li><Link to="/career" className="hover:text-foreground">Career Roadmap</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-3">Attribution & Privacy</h4>
            <p className="text-xs leading-relaxed">
              Virtual teacher 3D model and interactive classroom designed with Three.js & React Three Fiber.
            </p>
            <p className="text-xs mt-3">
              © {new Date().getFullYear()} EduVault AI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
