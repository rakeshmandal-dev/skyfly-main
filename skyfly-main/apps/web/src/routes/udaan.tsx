import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  Sparkles,
  Wifi,
  WifiOff,
  Download,
  CheckCircle2,
  Bookmark,
  Share2,
  Search,
  Filter,
  GraduationCap,
  HardDrive,
  HeartHandshake,
  ShieldCheck,
  AlertTriangle,
  Send,
  HelpCircle,
  ExternalLink,
  Award,
  Layers,
  ChevronRight,
  Volume2,
  VolumeX,
  Play,
  RotateCcw,
  Check,
  Package,
  Calendar,
  FileText,
  UserCheck,
  Clock,
  Eye,
  Trash2,
  RefreshCw,
  Info,
  SlidersHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import { useSpeech } from "@/lib/speech";
import {
  getOfflineResources,
  isResourceSavedOffline,
  saveResourceOffline,
  removeOfflineResource,
  getOfflineStorageUsage,
  getSimulatedOffline,
  setSimulatedOffline,
  isEffectiveOffline,
  type OfflineResourceRecord,
} from "@/lib/offline-schoolbag";
import {
  SEED_UDAAN_RESOURCES,
  SEED_COMMUNITY_LISTINGS,
  SEED_SCHOLARSHIPS,
  VERIFIED_KNOWLEDGE_EXPLANATIONS,
  type UdaanResource,
  type UdaanCommunityItem,
  type UdaanOpportunity,
  type UdaanAssistantResponse,
} from "@eduvault/shared";

export const Route = createFileRoute("/udaan")({
  component: UdaanMissionHub,
  head: () => ({
    meta: [
      { title: "Udaan Mission — Every Child Deserves to Learn | EduVault AI" },
      {
        name: "description",
        content:
          "Equal access to high-quality education: Free digital school bag, genuine offline study reader, community learning bank, and verified scholarships.",
      },
      { property: "og:title", content: "Udaan Mission — Every Child Deserves to Learn" },
      {
        property: "og:description",
        content:
          "Free, inclusive learning for students without private coaching, high-end devices, or internet access. No sensitive income disclosure required.",
      },
    ],
  }),
});

type UdaanTab = "school_bag" | "offline_reader" | "assistant" | "community_bank" | "opportunities";

export function UdaanMissionHub() {
  const [activeTab, setActiveTab] = useState<UdaanTab>("school_bag");
  const [isOffline, setIsOffline] = useState(false);
  const [isSimulatedOfflineMode, setIsSimulatedOfflineMode] = useState(false);
  const [storageUsage, setStorageUsage] = useState(getOfflineStorageUsage());
  const [savedOfflineIds, setSavedOfflineIds] = useState<string[]>([]);

  // Connectivity listener
  useEffect(() => {
    const updateStatus = () => {
      setIsOffline(isEffectiveOffline());
      setIsSimulatedOfflineMode(getSimulatedOffline());
      setStorageUsage(getOfflineStorageUsage());
      setSavedOfflineIds(getOfflineResources().map((r) => r.id));
    };

    updateStatus();

    window.addEventListener("online", updateStatus);
    window.addEventListener("offline", updateStatus);
    window.addEventListener("udaan:offline_updated", updateStatus);
    window.addEventListener("udaan:connectivity_changed", updateStatus);

    return () => {
      window.removeEventListener("online", updateStatus);
      window.removeEventListener("offline", updateStatus);
      window.removeEventListener("udaan:offline_updated", updateStatus);
      window.removeEventListener("udaan:connectivity_changed", updateStatus);
    };
  }, []);

  const toggleSimulatedOffline = () => {
    const next = !isSimulatedOfflineMode;
    setSimulatedOffline(next);
    setIsSimulatedOfflineMode(next);
    setIsOffline(next || !navigator.onLine);
    if (next) {
      toast.info("Simulated Offline Mode active. You can now test genuine offline reading without turning off Wi-Fi.");
    } else {
      toast.success("Online network mode restored.");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 selection:text-primary">
      {/* Top Accessibility & Connectivity Banner */}
      <header className="border-b border-border/40 bg-card/60 backdrop-blur-md sticky top-0 z-40">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 group">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-emerald via-brand-cyan to-brand-violet text-white shadow-glow group-hover:scale-105 transition">
                <GraduationCap className="h-5 w-5" />
              </span>
              <span className="font-display font-bold tracking-tight text-lg text-foreground">
                EduVault <span className="text-primary text-xs uppercase px-1.5 py-0.5 rounded-full border border-primary/30">Udaan</span>
              </span>
            </Link>
            <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground pl-3 border-l border-border">
              <span>Mission: Every Child Deserves to Learn</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Storage Usage indicator */}
            <div className="hidden sm:flex items-center gap-2 rounded-full border border-border/80 bg-background/80 px-3 py-1.5 text-xs">
              <HardDrive className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Offline Bag: <strong>{storageUsage.formattedUsed}</strong> ({storageUsage.count} items)</span>
            </div>

            {/* Offline Simulation / Indicator Toggle */}
            <button
              onClick={toggleSimulatedOffline}
              title="Click to simulate offline mode without disconnecting Wi-Fi"
              aria-label="Toggle offline simulation"
              className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition border ${
                isOffline
                  ? "border-amber-500/50 bg-amber-500/10 text-amber-300"
                  : "border-brand-emerald/40 bg-brand-emerald/10 text-brand-emerald"
              }`}
            >
              {isOffline ? (
                <>
                  <WifiOff className="h-3.5 w-3.5" />
                  <span>Offline Mode {isSimulatedOfflineMode ? "(Simulated)" : ""}</span>
                </>
              ) : (
                <>
                  <Wifi className="h-3.5 w-3.5" />
                  <span>Online Active</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Hero Dignity Header */}
      <section className="relative overflow-hidden border-b border-border/40 bg-gradient-to-b from-card/80 via-card/30 to-background px-4 py-8 sm:px-6 sm:py-12">
        <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-brand-cyan/10 blur-3xl pointer-events-none" />
        <div className="absolute -right-20 top-0 h-72 w-72 rounded-full bg-brand-violet/10 blur-3xl pointer-events-none" />

        <div className="relative mx-auto max-w-5xl text-center space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-emerald/30 bg-brand-emerald/10 px-4 py-1 text-xs font-semibold text-brand-emerald">
            <HeartHandshake className="h-3.5 w-3.5" />
            Social Impact Initiative — 100% Free & Dignified
          </div>
          <h1 className="font-display text-3xl font-extrabold sm:text-5xl tracking-tight">
            UDAAN MISSION <br className="hidden sm:inline" />
            <span className="gradient-text">Every Child Deserves to Learn</span>
          </h1>
          <p className="mx-auto max-w-3xl text-sm sm:text-base text-muted-foreground leading-relaxed">
            Empowering students who cannot afford private coaching, expensive devices, or constant high-speed internet.
            Access free curriculum notes, genuine offline readers, community learning materials, and verified scholarships without disclosing sensitive financial documents.
          </p>

          {/* Quick Stats Banner */}
          <div className="pt-2 grid grid-cols-2 gap-3 sm:grid-cols-4 max-w-3xl mx-auto">
            <div className="rounded-2xl border border-border/60 bg-card/60 p-3 text-center">
              <div className="text-xl sm:text-2xl font-bold text-foreground">100% Free</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">Zero Subscription Fees</div>
            </div>
            <div className="rounded-2xl border border-border/60 bg-card/60 p-3 text-center">
              <div className="text-xl sm:text-2xl font-bold text-foreground">Zero Proofs</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">Dignity First Access</div>
            </div>
            <div className="rounded-2xl border border-border/60 bg-card/60 p-3 text-center">
              <div className="text-xl sm:text-2xl font-bold text-foreground">Offline Ready</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">Genuine Local Cache</div>
            </div>
            <div className="rounded-2xl border border-border/60 bg-card/60 p-3 text-center">
              <div className="text-xl sm:text-2xl font-bold text-foreground">Bilingual</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">Hindi & English Notes</div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Tabs Navigation */}
      <nav aria-label="Udaan Mission Navigation" className="border-b border-border/40 bg-card/40 backdrop-blur-md sticky top-[57px] z-30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex gap-2 overflow-x-auto py-2.5 scrollbar-none">
            {[
              { id: "school_bag", label: "Digital School Bag", labelHi: "डिजिटल बस्ता", icon: BookOpen },
              { id: "offline_reader", label: "Offline Reader", labelHi: "ऑफ़लाइन अध्ययन", icon: HardDrive, count: storageUsage.count },
              { id: "assistant", label: "Free Learning Assistant", labelHi: "सुलभ सहायक", icon: Sparkles },
              { id: "community_bank", label: "Community Bank", labelHi: "पुस्तक व उपकरण बैंक", icon: HeartHandshake },
              { id: "opportunities", label: "Scholarships & Grants", labelHi: "छात्रवृत्ति अवसर", icon: Award },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as UdaanTab)}
                  className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-medium transition ${
                    isActive
                      ? "brand-bg text-white shadow-glow"
                      : "border border-border/60 bg-card/40 text-muted-foreground hover:bg-card hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className="rounded-full bg-white/20 px-1.5 py-0.2 text-[10px] font-bold">
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Tab Panels */}
      <main id="main-content" className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {activeTab === "school_bag" && (
          <DigitalSchoolBagTab
            savedOfflineIds={savedOfflineIds}
            onOpenOfflineTab={() => setActiveTab("offline_reader")}
          />
        )}

        {activeTab === "offline_reader" && (
          <OfflineReaderTab
            storageUsage={storageUsage}
            isOffline={isOffline}
            onToggleSimulation={toggleSimulatedOffline}
            isSimulated={isSimulatedOfflineMode}
          />
        )}

        {activeTab === "assistant" && (
          <FreeAssistantTab isOffline={isOffline} />
        )}

        {activeTab === "community_bank" && (
          <CommunityLearningBankTab />
        )}

        {activeTab === "opportunities" && (
          <OpportunityCornerTab />
        )}
      </main>
    </div>
  );
}

// =============================================================================
// TAB 1: FREE DIGITAL SCHOOL BAG
// =============================================================================

function DigitalSchoolBagTab({
  savedOfflineIds,
  onOpenOfflineTab,
}: {
  savedOfflineIds: string[];
  onOpenOfflineTab: () => void;
}) {
  const [search, setSearch] = useState("");
  const [selectedClass, setSelectedClass] = useState("All");
  const [selectedSubject, setSelectedSubject] = useState("All");
  const [selectedLang, setSelectedLang] = useState<string>("All");
  const [selectedType, setSelectedType] = useState<string>("All");
  const [selectedSource, setSelectedSource] = useState<string>("All");
  const [activeReadingResource, setActiveReadingResource] = useState<UdaanResource | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const speech = useSpeech();

  const resources = useMemo(() => {
    return SEED_UDAAN_RESOURCES.filter((r) => {
      if (selectedClass !== "All" && r.classGrade !== selectedClass) return false;
      if (selectedSubject !== "All" && r.subject !== selectedSubject) return false;
      if (selectedLang !== "All" && r.language !== selectedLang && r.language !== "bilingual") return false;
      if (selectedType !== "All" && r.resourceType !== selectedType) return false;
      if (selectedSource !== "All" && r.sourceType !== selectedSource) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesTitle = r.title.toLowerCase().includes(q) || (r.titleHi && r.titleHi.toLowerCase().includes(q));
        const matchesSubject = r.subject.toLowerCase().includes(q);
        const matchesChapter = r.chapter.toLowerCase().includes(q);
        if (!matchesTitle && !matchesSubject && !matchesChapter) return false;
      }
      return true;
    });
  }, [search, selectedClass, selectedSubject, selectedLang, selectedType, selectedSource]);

  const handleSaveOffline = async (r: UdaanResource) => {
    try {
      setDownloadingId(r.id);
      setDownloadProgress(0);
      await saveResourceOffline(r, (pct) => setDownloadProgress(pct));
      toast.success(`"${r.title}" saved to your Offline Bag.`);
    } catch {
      toast.error("Could not save to device storage.");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDownloadTxt = (r: UdaanResource) => {
    const blob = new Blob([r.content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${r.title.replace(/[^a-zA-Z0-9_-]/g, "_")}.md`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast.success("Lesson file downloaded.");
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters Bar */}
      <div className="rounded-2xl border border-border/60 bg-card p-4 sm:p-6 space-y-4 shadow-[var(--shadow-card)]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notes, chapters, formulas or topics (e.g. Newton, Light, Calculus, Python)..."
            className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-5 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-muted-foreground mb-1">Class / Grade</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full rounded-lg border border-border bg-background p-2 text-foreground"
            >
              <option value="All">All Grades</option>
              <option value="Class 8">Class 8</option>
              <option value="Class 9">Class 9</option>
              <option value="Class 10">Class 10</option>
              <option value="Class 12">Class 12</option>
              <option value="Foundation / College">College / Foundation</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-muted-foreground mb-1">Subject</label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full rounded-lg border border-border bg-background p-2 text-foreground"
            >
              <option value="All">All Subjects</option>
              <option value="Physics">Physics</option>
              <option value="Chemistry">Chemistry</option>
              <option value="Mathematics">Mathematics</option>
              <option value="Biology">Biology</option>
              <option value="Science">General Science</option>
              <option value="Computer Science">Computer Science</option>
              <option value="History & Civics">History & Civics</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-muted-foreground mb-1">Language</label>
            <select
              value={selectedLang}
              onChange={(e) => setSelectedLang(e.target.value)}
              className="w-full rounded-lg border border-border bg-background p-2 text-foreground"
            >
              <option value="All">All Languages</option>
              <option value="en">English</option>
              <option value="hi">हिन्दी (Hindi)</option>
              <option value="bilingual">Bilingual</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-muted-foreground mb-1">Resource Type</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full rounded-lg border border-border bg-background p-2 text-foreground"
            >
              <option value="All">All Resource Types</option>
              <option value="notes">Chapter Notes</option>
              <option value="summary">Quick Summary</option>
              <option value="practice_questions">Practice Questions</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-muted-foreground mb-1">Source / Verification</label>
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="w-full rounded-lg border border-border bg-background p-2 text-foreground"
            >
              <option value="All">All Verified Sources</option>
              <option value="official_open">Official Open Curriculum (NCERT/CC)</option>
              <option value="community_verified">Peer-Verified Community Notes</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <span>Curriculum Resources</span>
          <span className="rounded-full bg-primary/10 text-primary text-xs font-semibold px-2 py-0.5">
            {resources.length} available
          </span>
        </h2>
        <span className="text-xs text-muted-foreground">
          Original & openly licensed materials. 100% Free.
        </span>
      </div>

      {/* Resources Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {resources.map((r) => {
          const isSaved = savedOfflineIds.includes(r.id);
          const isCurrentDownloading = downloadingId === r.id;

          return (
            <div
              key={r.id}
              className="group relative flex flex-col justify-between rounded-2xl border border-border/70 bg-card p-5 shadow-[var(--shadow-card)] transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-glow"
            >
              <div className="space-y-3">
                {/* Badges row */}
                <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                  <span className="rounded-md bg-secondary px-2 py-0.5 font-medium text-secondary-foreground">
                    {r.classGrade}
                  </span>
                  <span className="rounded-md bg-primary/10 text-primary px-2 py-0.5 font-semibold">
                    {r.subject}
                  </span>
                  {r.sourceType === "official_open" ? (
                    <span className="inline-flex items-center gap-1 rounded-md bg-brand-emerald/10 text-brand-emerald px-1.5 py-0.5 font-medium">
                      <ShieldCheck className="h-3 w-3" /> Official Open
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-md bg-brand-cyan/10 text-brand-cyan px-1.5 py-0.5 font-medium">
                      <UserCheck className="h-3 w-3" /> Community Verified
                    </span>
                  )}
                  <span className="rounded-md border border-border/80 px-1.5 py-0.5 text-muted-foreground uppercase text-[10px]">
                    {r.language}
                  </span>
                </div>

                {/* Title */}
                <div>
                  <h3 className="font-semibold text-base leading-snug group-hover:text-primary transition">
                    {r.title}
                  </h3>
                  {r.titleHi && (
                    <p className="text-xs text-muted-foreground mt-0.5 font-sans">
                      {r.titleHi}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                    <BookOpen className="h-3 w-3" /> {r.chapter}
                  </p>
                </div>

                {/* License and size info */}
                <div className="pt-2 border-t border-border/40 text-[11px] text-muted-foreground flex items-center justify-between">
                  <span>{(r.fileSizeBytes / 1024).toFixed(1)} KB (Low data)</span>
                  <span className="truncate max-w-[170px]" title={r.openLicense}>{r.openLicense}</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-4 pt-3 border-t border-border/40 space-y-2">
                {isCurrentDownloading && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-primary">
                      <span>Saving to device storage...</span>
                      <span>{downloadProgress}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full brand-bg transition-all duration-150"
                        style={{ width: `${downloadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveReadingResource(r)}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl brand-bg text-white py-2 px-3 text-xs font-semibold shadow-glow hover:opacity-95 transition"
                  >
                    <BookOpen className="h-3.5 w-3.5" /> Read
                  </button>

                  <button
                    onClick={() => (isSaved ? onOpenOfflineTab() : handleSaveOffline(r))}
                    disabled={isCurrentDownloading}
                    title={isSaved ? "Saved offline (Click to view)" : "Save for offline reading"}
                    className={`flex items-center gap-1 rounded-xl border px-3 py-2 text-xs font-medium transition ${
                      isSaved
                        ? "border-brand-emerald bg-brand-emerald/10 text-brand-emerald"
                        : "border-border hover:bg-secondary text-foreground"
                    }`}
                  >
                    {isSaved ? <Check className="h-3.5 w-3.5" /> : <Download className="h-3.5 w-3.5" />}
                    <span>{isSaved ? "Saved" : "Save"}</span>
                  </button>

                  <button
                    onClick={() => handleDownloadTxt(r)}
                    title="Download as Markdown/Text file"
                    className="rounded-xl border border-border p-2 text-muted-foreground hover:text-foreground hover:bg-secondary transition"
                  >
                    <FileText className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Reading Modal */}
      {activeReadingResource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-3xl border border-border bg-card p-6 shadow-2xl overflow-hidden">
            <header className="flex items-start justify-between gap-4 border-b border-border pb-4">
              <div>
                <div className="flex items-center gap-2 text-xs text-primary font-medium">
                  <span>{activeReadingResource.classGrade}</span>
                  <span>•</span>
                  <span>{activeReadingResource.subject}</span>
                  <span>•</span>
                  <span>{activeReadingResource.chapter}</span>
                </div>
                <h2 className="text-xl font-bold mt-1">{activeReadingResource.title}</h2>
                <div className="text-xs text-muted-foreground mt-1 flex items-center gap-3">
                  <span>License: {activeReadingResource.openLicense}</span>
                  <span>Verified: {activeReadingResource.verifiedBy}</span>
                </div>
              </div>
              <button
                onClick={() => {
                  speech.stop();
                  setActiveReadingResource(null);
                }}
                className="rounded-xl border border-border p-2 text-muted-foreground hover:text-foreground hover:bg-secondary transition"
              >
                ✕
              </button>
            </header>

            {/* Audio Speech Controls */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 py-2.5 text-xs bg-muted/30 px-3 rounded-lg my-3">
              <div className="flex items-center gap-2">
                <Volume2 className="h-4 w-4 text-primary" />
                <span className="font-medium">Listen to Lesson (Voice):</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  disabled={speech.speaking}
                  onClick={() =>
                    speech.speak(
                      activeReadingResource.content,
                      activeReadingResource.language === "hi" ? "hi-IN" : "en-IN"
                    )
                  }
                  className="rounded-lg border border-border bg-background px-3 py-1 text-xs font-medium hover:bg-secondary transition disabled:opacity-50"
                >
                  <Play className="inline h-3 w-3 mr-1" /> Play
                </button>
                {speech.speaking && (
                  <button
                    onClick={speech.paused ? speech.resume : speech.pause}
                    className="rounded-lg border border-border bg-background px-3 py-1 text-xs font-medium hover:bg-secondary transition"
                  >
                    {speech.paused ? "Resume" : "Pause"}
                  </button>
                )}
                {speech.speaking && (
                  <button
                    onClick={speech.stop}
                    className="rounded-lg border border-destructive/40 text-destructive px-3 py-1 text-xs font-medium hover:bg-destructive/10 transition"
                  >
                    Stop
                  </button>
                )}
              </div>
            </div>

            {/* Markdown Text Body */}
            <div className="flex-1 overflow-y-auto pr-2 text-sm leading-relaxed whitespace-pre-wrap font-sans selection:bg-primary/20">
              {activeReadingResource.content}
            </div>

            <footer className="mt-4 pt-3 border-t border-border flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">
                Works 100% offline once saved. Zero data required.
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleDownloadTxt(activeReadingResource)}
                  className="rounded-xl border border-border px-3 py-1.5 text-xs font-medium hover:bg-secondary transition"
                >
                  Export .txt
                </button>
                <button
                  onClick={() => {
                    speech.stop();
                    setActiveReadingResource(null);
                  }}
                  className="rounded-xl brand-bg px-4 py-1.5 text-xs font-semibold text-white shadow-glow hover:opacity-90 transition"
                >
                  Close
                </button>
              </div>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// TAB 2: GENUINE OFFLINE READER & STORAGE MANAGER
// =============================================================================

function OfflineReaderTab({
  storageUsage,
  isOffline,
  onToggleSimulation,
  isSimulated,
}: {
  storageUsage: ReturnType<typeof getOfflineStorageUsage>;
  isOffline: boolean;
  onToggleSimulation: () => void;
  isSimulated: boolean;
}) {
  const [offlineNotes, setOfflineNotes] = useState<OfflineResourceRecord[]>([]);
  const [selectedNote, setSelectedNote] = useState<OfflineResourceRecord | null>(null);
  const speech = useSpeech();

  const loadOfflineNotes = () => {
    const list = getOfflineResources();
    setOfflineNotes(list);
    if (list.length > 0 && !selectedNote) {
      setSelectedNote(list[0]);
    }
  };

  useEffect(() => {
    loadOfflineNotes();
    window.addEventListener("udaan:offline_updated", loadOfflineNotes);
    return () => window.removeEventListener("udaan:offline_updated", loadOfflineNotes);
  }, []);

  const handleDelete = (id: string) => {
    removeOfflineResource(id);
    const updated = offlineNotes.filter((n) => n.id !== id);
    setOfflineNotes(updated);
    if (selectedNote?.id === id) {
      setSelectedNote(updated[0] || null);
    }
    toast.success("Lesson removed from device storage.");
  };

  return (
    <div className="space-y-6">
      {/* Offline Status & Integrity Notification */}
      <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-[var(--shadow-card)] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              className={`grid h-10 w-10 place-items-center rounded-xl ${
                isOffline ? "bg-amber-500/20 text-amber-300" : "bg-brand-emerald/20 text-brand-emerald"
              }`}
            >
              {isOffline ? <WifiOff className="h-5 w-5" /> : <Wifi className="h-5 w-5" />}
            </span>
            <div>
              <h3 className="font-semibold text-base">
                {isOffline ? "Offline Learning Active" : "Online — Connected to Network"}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isOffline
                  ? "Zero network used. All saved lessons below open instantly without an active internet connection."
                  : "Save any lesson from the Digital School Bag to make it permanently accessible offline."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onToggleSimulation}
              className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                isSimulated
                  ? "border-amber-500 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"
                  : "border-border bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              {isSimulated ? "Disable Offline Simulation" : "Test Simulated Offline"}
            </button>
          </div>
        </div>

        {/* Honest Truthful Disclaimer */}
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200/90 leading-relaxed">
          <strong>Honest Offline Integrity Notice:</strong> Only lessons you have explicitly saved to your device are readable without internet. Reopening this web application if browser cache is cleared, streaming live 3D classrooms, and contacting mentors still require network access. We never falsely claim the entire cloud ecosystem works offline.
        </div>

        {/* Device Storage Meter */}
        <div className="space-y-2 pt-2 border-t border-border/40">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>
              Device Storage: <strong>{storageUsage.formattedUsed}</strong> of {storageUsage.formattedQuota} web budget
            </span>
            <span>{storageUsage.percentUsed}% used</span>
          </div>
          <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                storageUsage.percentUsed > 80 ? "bg-amber-500" : "brand-bg"
              }`}
              style={{ width: `${Math.max(2, storageUsage.percentUsed)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Offline Reader Workspace */}
      {offlineNotes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center space-y-3">
          <HardDrive className="h-10 w-10 text-muted-foreground mx-auto" />
          <h3 className="font-semibold text-lg">Your Offline School Bag is Empty</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Browse the Free Digital School Bag and tap "Save" on any chapter. Saved notes stay privately on this phone or laptop and open with zero data.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-[280px_1fr]">
          {/* Saved Lessons Sidebar */}
          <aside className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
              Saved Offline Lessons ({offlineNotes.length})
            </h4>
            <div className="space-y-2">
              {offlineNotes.map((note) => {
                const isSelected = selectedNote?.id === note.id;
                return (
                  <button
                    key={note.id}
                    onClick={() => {
                      speech.stop();
                      setSelectedNote(note);
                    }}
                    className={`w-full rounded-xl border p-3 text-left transition ${
                      isSelected
                        ? "border-primary bg-primary/10 shadow-sm"
                        : "border-border/70 bg-card hover:bg-secondary/50"
                    }`}
                  >
                    <div className="text-[11px] font-semibold text-primary">{note.subject}</div>
                    <div className="text-sm font-medium line-clamp-1 mt-0.5">{note.title}</div>
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-2">
                      <span>{(note.fileSizeBytes / 1024).toFixed(1)} KB</span>
                      <span>Offline Ready</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Reader Content Pane */}
          {selectedNote ? (
            <article className="rounded-2xl border border-border/80 bg-card p-6 space-y-4 shadow-[var(--shadow-card)]">
              <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border/50 pb-4">
                <div>
                  <div className="flex items-center gap-2 text-xs font-medium text-primary">
                    <span>{selectedNote.classGrade}</span>
                    <span>•</span>
                    <span>{selectedNote.subject}</span>
                    <span>•</span>
                    <span>{selectedNote.chapter}</span>
                  </div>
                  <h2 className="text-2xl font-bold mt-1">{selectedNote.title}</h2>
                  <div className="text-xs text-muted-foreground mt-1">
                    Saved on this device: {new Date(selectedNote.downloadedAt).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDelete(selectedNote.id)}
                    className="flex items-center gap-1.5 rounded-xl border border-destructive/40 bg-destructive/10 text-destructive px-3 py-1.5 text-xs font-medium hover:bg-destructive/20 transition"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Remove from Device
                  </button>
                </div>
              </header>

              {/* Offline Voice Assist */}
              <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/40 p-3 text-xs">
                <div className="flex items-center gap-2">
                  <Volume2 className="h-4 w-4 text-primary" />
                  <span>Speech works offline using your device's installed voices.</span>
                </div>
                <div className="flex gap-1.5">
                  <button
                    disabled={speech.speaking}
                    onClick={() =>
                      speech.speak(
                        selectedNote.content,
                        selectedNote.language === "hi" ? "hi-IN" : "en-IN"
                      )
                    }
                    className="rounded-lg brand-bg text-white px-3 py-1 text-xs font-semibold shadow-glow hover:opacity-90 transition disabled:opacity-40"
                  >
                    <Play className="inline h-3 w-3 mr-1" /> Listen
                  </button>
                  {speech.speaking && (
                    <button
                      onClick={speech.stop}
                      className="rounded-lg border border-border px-3 py-1 text-xs font-medium hover:bg-secondary transition"
                    >
                      Stop
                    </button>
                  )}
                </div>
              </div>

              {/* Lesson Markdown */}
              <div className="pt-2 text-sm leading-relaxed whitespace-pre-wrap font-sans selection:bg-primary/20">
                {selectedNote.content}
              </div>
            </article>
          ) : null}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// TAB 3: FREE LEARNING ASSISTANT
// =============================================================================

function FreeAssistantTab({ isOffline }: { isOffline: boolean }) {
  const [query, setQuery] = useState("");
  const [language, setLanguage] = useState<"en" | "hi">("en");
  const [response, setResponse] = useState<UdaanAssistantResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPracticeHint, setShowPracticeHint] = useState(false);
  const [showPracticeAnswer, setShowPracticeAnswer] = useState(false);

  const samplePrompts = [
    { text: "Explain Newton's 1st Law with a bus example", sub: "Physics" },
    { text: "How to balance chemical equations step by step?", sub: "Chemistry" },
    { text: "Explain binary search algorithm in simple words", sub: "Coding" },
    { text: "Why do plant cells have cell walls but animal cells don't?", sub: "Biology" },
    { text: "What is power rule in calculus derivatives?", sub: "Mathematics" },
  ];

  const handleAsk = async (textToAsk?: string) => {
    const q = (textToAsk || query).trim();
    if (!q) return;

    setLoading(true);
    setShowPracticeHint(false);
    setShowPracticeAnswer(false);

    try {
      const res = await fetch("/api/udaan/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q, language }),
      });

      if (res.ok) {
        const data = await res.json();
        setResponse(data);
      } else {
        throw new Error("Assistant service currently busy");
      }
    } catch {
      // Local zero-token offline curriculum fallback
      const qLower = q.toLowerCase();
      let key = "kinematics";
      if (qLower.includes("newton") || qLower.includes("inertia")) key = "newton";
      if (qLower.includes("reaction") || qLower.includes("balance")) key = "chemistry";
      if (qLower.includes("derivative") || qLower.includes("calculus")) key = "calculus";
      if (qLower.includes("cell") || qLower.includes("plant")) key = "biology";
      if (qLower.includes("binary") || qLower.includes("search") || qLower.includes("code")) key = "coding";

      const fb = VERIFIED_KNOWLEDGE_EXPLANATIONS[key] || VERIFIED_KNOWLEDGE_EXPLANATIONS["kinematics"];
      setResponse({
        query: q,
        answer: `### ${fb.title}\n\n${fb.explanation}`,
        isLiveAi: false,
        source: "verified_curriculum_knowledge_bank",
        statusBadge: "Curriculum Knowledge Bank — Verified Prewritten Explanation (Zero API Tokens Used, 100% Free & Offline-Ready)",
        stepByStepGuidance: fb.steps,
        practiceQuestion: fb.practiceQuestion,
        offlineAvailable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header card */}
      <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-[var(--shadow-card)] space-y-3">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl brand-bg text-white shadow-glow">
            <Sparkles className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-xl font-bold">Free Learning Assistant</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Clear, step-by-step doubt solving with zero token limits or paywalls. Accessible in Hindi and English.
            </p>
          </div>
        </div>

        {/* Query Input */}
        <div className="space-y-3 pt-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAsk()}
              placeholder="Ask any study doubt or formula (e.g. How does photosynthesis work?)..."
              className="flex-1 rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
            <button
              onClick={() => handleAsk()}
              disabled={loading || !query.trim()}
              className="flex items-center gap-2 rounded-xl brand-bg text-white px-5 py-3 text-sm font-semibold shadow-glow hover:opacity-95 transition disabled:opacity-50"
            >
              {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              <span>Ask</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Language:</span>
              <button
                onClick={() => setLanguage("en")}
                className={`rounded-lg px-2.5 py-1 font-medium transition ${
                  language === "en" ? "brand-bg text-white" : "border border-border bg-secondary"
                }`}
              >
                English
              </button>
              <button
                onClick={() => setLanguage("hi")}
                className={`rounded-lg px-2.5 py-1 font-medium transition ${
                  language === "hi" ? "brand-bg text-white" : "border border-border bg-secondary"
                }`}
              >
                हिन्दी (Hindi)
              </button>
            </div>

            <span className="text-[11px] text-muted-foreground">
              Always free. Fallback content is clearly tagged for honesty.
            </span>
          </div>
        </div>

        {/* Quick sample prompt chips */}
        <div className="pt-2 border-t border-border/40 space-y-1.5">
          <div className="text-[11px] font-semibold text-muted-foreground">Quick Practice Doubts:</div>
          <div className="flex flex-wrap gap-1.5">
            {samplePrompts.map((s) => (
              <button
                key={s.text}
                onClick={() => {
                  setQuery(s.text);
                  handleAsk(s.text);
                }}
                className="rounded-lg border border-border/80 bg-background/80 hover:bg-secondary px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground transition text-left"
              >
                <span className="font-semibold text-primary mr-1">[{s.sub}]</span> {s.text}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Assistant Explanation Response Card */}
      {response && (
        <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-[var(--shadow-card)] space-y-4">
          {/* Honest Status Badge */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border/40">
            <div className="flex items-center gap-2">
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold flex items-center gap-1.5 ${
                  response.isLiveAi
                    ? "bg-brand-emerald/10 text-brand-emerald border border-brand-emerald/30"
                    : "bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/30"
                }`}
              >
                {response.isLiveAi ? <Sparkles className="h-3 w-3" /> : <ShieldCheck className="h-3 w-3" />}
                <span>{response.statusBadge}</span>
              </span>
            </div>

            <span className="text-[11px] text-muted-foreground">
              Query: <strong className="text-foreground">"{response.query}"</strong>
            </span>
          </div>

          {/* Explanation Body */}
          <div className="text-sm leading-relaxed whitespace-pre-wrap font-sans selection:bg-primary/20">
            {response.answer}
          </div>

          {/* Step-by-Step Methodology Accordion */}
          {response.stepByStepGuidance && response.stepByStepGuidance.length > 0 && (
            <div className="rounded-xl border border-border/60 bg-muted/40 p-4 space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <SlidersHorizontal className="h-3.5 w-3.5 text-primary" /> Step-by-Step Solving Logic:
              </div>
              <ol className="list-decimal pl-5 space-y-1 text-xs text-foreground/90">
                {response.stepByStepGuidance.map((step, idx) => (
                  <li key={idx}>{step}</li>
                ))}
              </ol>
            </div>
          )}

          {/* Embedded Practice Question */}
          {response.practiceQuestion && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-primary">
                <CheckCircle2 className="h-4 w-4" /> Try It Yourself (Concept Check)
              </div>
              <p className="text-sm font-medium">{response.practiceQuestion.question}</p>

              {response.practiceQuestion.options && (
                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  {response.practiceQuestion.options.map((opt, i) => (
                    <div key={i} className="rounded-lg border border-border/60 bg-background p-2">
                      {opt}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2 pt-1 text-xs">
                <button
                  onClick={() => setShowPracticeHint(!showPracticeHint)}
                  className="rounded-lg border border-border bg-background px-3 py-1 font-medium hover:bg-secondary transition"
                >
                  {showPracticeHint ? "Hide Hint" : "Need a Hint?"}
                </button>
                <button
                  onClick={() => setShowPracticeAnswer(!showPracticeAnswer)}
                  className="rounded-lg brand-bg text-white px-3 py-1 font-semibold hover:opacity-90 transition"
                >
                  {showPracticeAnswer ? "Hide Solution" : "Check Solution"}
                </button>
              </div>

              {showPracticeHint && (
                <div className="text-xs text-muted-foreground bg-muted/60 p-2.5 rounded-lg border border-border/40">
                  💡 <strong>Hint:</strong> {response.practiceQuestion.hint}
                </div>
              )}

              {showPracticeAnswer && (
                <div className="text-xs text-brand-emerald bg-brand-emerald/10 p-2.5 rounded-lg border border-brand-emerald/30">
                  ✅ <strong>Solution:</strong> {response.practiceQuestion.answer}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// TAB 4: COMMUNITY LEARNING BANK
// =============================================================================

function CommunityLearningBankTab() {
  const [listings, setListings] = useState<UdaanCommunityItem[]>(SEED_COMMUNITY_LISTINGS);
  const [category, setCategory] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [requestingItem, setRequestingItem] = useState<UdaanCommunityItem | null>(null);
  const [reportingItem, setReportingItem] = useState<UdaanCommunityItem | null>(null);

  // Form states for adding listing
  const [title, setTitle] = useState("");
  const [cat, setCat] = useState<UdaanCommunityItem["category"]>("books");
  const [condition, setCondition] = useState<UdaanCommunityItem["itemCondition"]>("Gently Used");
  const [generalArea, setGeneralArea] = useState("");
  const [safeHandoverPoint, setSafeHandoverPoint] = useState("");
  const [description, setDescription] = useState("");
  const [listedByRole, setListedByRole] = useState<UdaanCommunityItem["listedByRole"]>("Student");
  const [submitting, setSubmitting] = useState(false);

  // Request form state
  const [pickupPoint, setPickupPoint] = useState("");
  const [requestMsg, setRequestMsg] = useState("");
  const [reqRole, setReqRole] = useState<"Student" | "Parent/Guardian" | "Teacher">("Student");

  // Report form state
  const [reportReason, setReportReason] = useState<string>("inappropriate_content");
  const [reportDetails, setReportDetails] = useState("");

  const filtered = useMemo(() => {
    return listings.filter((item) => {
      if (category !== "all" && item.category !== category) return false;
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      if (search.trim()) {
        const s = search.toLowerCase();
        if (
          !item.title.toLowerCase().includes(s) &&
          !item.generalArea.toLowerCase().includes(s) &&
          !item.safeHandoverPoint.toLowerCase().includes(s)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [listings, category, statusFilter, search]);

  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch("/api/udaan/community-bank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          category: cat,
          itemCondition: condition,
          generalArea,
          safeHandoverPoint,
          description,
          listedByRole,
        }),
      });

      const body = await res.json();
      if (!res.ok) {
        throw new Error(body.error?.message || "Failed to create listing.");
      }

      setListings([body.listing, ...listings]);
      toast.success("Listing created! Thank you for sharing resources with community learners.");
      setShowAddModal(false);
      setTitle("");
      setGeneralArea("");
      setSafeHandoverPoint("");
      setDescription("");
    } catch (err: any) {
      toast.error(err.message || "Could not create listing. Ensure no private phone numbers are entered.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmHandover = async (item: UdaanCommunityItem) => {
    try {
      const res = await fetch(`/api/udaan/community-bank/${item.id}/confirm-handover`, {
        method: "POST",
      });
      if (res.ok) {
        const body = await res.json();
        setListings(listings.map((l) => (l.id === item.id ? body.listing : l)));
        toast.success("Handover confirmed! Thank you for supporting a fellow student.");
      }
    } catch {
      // Optimistic update
      setListings(
        listings.map((l) =>
          l.id === item.id ? { ...l, status: "Handed Over", confirmedHandoverAt: new Date().toISOString() } : l
        )
      );
      toast.success("Handover confirmed.");
    }
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestingItem) return;

    try {
      const res = await fetch(`/api/udaan/community-bank/${requestingItem.id}/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preferredSafePoint: pickupPoint || requestingItem.safeHandoverPoint,
          message: requestMsg || "I am studying this subject and would be grateful to use this learning resource.",
          requesterRole: reqRole,
        }),
      });

      if (!res.ok) throw new Error("Request could not be submitted.");

      setListings(
        listings.map((l) => (l.id === requestingItem.id ? { ...l, status: "Requested" } : l))
      );
      toast.success("Request sent. Handover will be coordinated at the designated safe point.");
      setRequestingItem(null);
      setPickupPoint("");
      setRequestMsg("");
    } catch (err: any) {
      toast.error(err.message || "Failed to request item.");
    }
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportingItem) return;

    try {
      await fetch(`/api/udaan/community-bank/${reportingItem.id}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reportReason, details: reportDetails || "Reported by user" }),
      });
      toast.success("Report submitted for moderation. Thank you for safeguarding our community.");
      setReportingItem(null);
      setReportDetails("");
    } catch {
      toast.success("Report submitted for moderation.");
      setReportingItem(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-[var(--shadow-card)] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-brand-pink/20 text-brand-pink">
                <HeartHandshake className="h-4 w-4" />
              </span>
              <h2 className="text-xl font-bold">Community Learning Bank</h2>
            </div>
            <p className="text-xs text-muted-foreground mt-1 max-w-2xl">
              Share or request physical textbooks, scientific calculators, stationery, and reusable study devices.
              To protect student safety and dignity, all handovers occur at public safe points (schools or libraries). Raw phone numbers are strictly prohibited.
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 rounded-xl brand-bg text-white px-4 py-2.5 text-xs font-semibold shadow-glow hover:opacity-90 transition"
          >
            <Package className="h-4 w-4" />
            <span>List an Item to Share</span>
          </button>
        </div>

        {/* Safety & Dignity Guardrail Card */}
        <div className="rounded-xl border border-brand-cyan/30 bg-brand-cyan/10 p-3.5 text-xs text-brand-cyan space-y-1">
          <div className="font-semibold flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4" /> Safety & Dignity Guardrails:
          </div>
          <p className="text-[11px] leading-relaxed text-brand-cyan/90">
            • Direct unmediated contact between unknown adults and minors is strictly prohibited. <br />
            • Handovers must take place exclusively at public school gates, libraries, or community centers with teacher or guardian awareness. <br />
            • Never disclose private residential addresses or personal phone numbers.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl border border-border/60 bg-card p-4 space-y-3">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search items by title, city, locality (e.g. NCERT, Calculator, Delhi, Bengaluru)..."
              className="w-full rounded-xl border border-border bg-background py-2 pl-10 pr-4 text-xs outline-none focus:border-primary"
            />
          </div>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-xl border border-border bg-background px-3 py-2 text-xs"
          >
            <option value="all">All Categories</option>
            <option value="books">Textbooks & Notes</option>
            <option value="calculator">Scientific Calculators</option>
            <option value="stationery">Stationery & Kits</option>
            <option value="device">Reusable Study Devices</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-border bg-background px-3 py-2 text-xs"
          >
            <option value="all">All Statuses</option>
            <option value="Available">Available</option>
            <option value="Requested">Requested</option>
            <option value="Handed Over">Handed Over</option>
          </select>
        </div>
      </div>

      {/* Listings Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="flex flex-col justify-between rounded-2xl border border-border/70 bg-card p-5 shadow-[var(--shadow-card)] space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="rounded-md bg-secondary px-2 py-0.5 text-[11px] font-semibold uppercase text-secondary-foreground">
                  {item.category}
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                    item.status === "Available"
                      ? "bg-brand-emerald/10 text-brand-emerald border border-brand-emerald/30"
                      : item.status === "Requested"
                      ? "bg-amber-500/10 text-amber-300 border border-amber-500/30"
                      : "bg-muted text-muted-foreground border border-border"
                  }`}
                >
                  {item.status}
                </span>
              </div>

              <div>
                <h3 className="font-semibold text-base leading-snug">{item.title}</h3>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-border/40 text-xs text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>Condition:</span>
                  <strong className="text-foreground">{item.itemCondition}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>General Area:</span>
                  <span className="text-foreground">{item.generalArea}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Safe Handover Point:</span>
                  <span className="text-foreground text-right truncate max-w-[170px]" title={item.safeHandoverPoint}>
                    {item.safeHandoverPoint}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span>Listed By:</span>
                  <span>{item.listedByRole}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-border/40 flex items-center justify-between gap-2">
              {item.status === "Available" ? (
                <button
                  onClick={() => setRequestingItem(item)}
                  className="flex-1 rounded-xl brand-bg text-white py-2 text-xs font-semibold shadow-glow hover:opacity-95 transition"
                >
                  Request Item
                </button>
              ) : item.status === "Requested" ? (
                <button
                  onClick={() => handleConfirmHandover(item)}
                  className="flex-1 rounded-xl border border-brand-emerald bg-brand-emerald/10 text-brand-emerald py-2 text-xs font-semibold hover:bg-brand-emerald/20 transition"
                >
                  Confirm Handover Completed
                </button>
              ) : (
                <span className="text-xs text-muted-foreground italic flex-1 text-center py-2">
                  Handed Over to Scholar
                </span>
              )}

              <button
                onClick={() => setReportingItem(item)}
                title="Report inappropriate listing or privacy violation"
                className="rounded-xl border border-border p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition"
              >
                <AlertTriangle className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Listing Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleCreateListing}
            className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-3xl border border-border bg-card p-6 shadow-2xl overflow-y-auto space-y-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold">List a Learning Resource to Share</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Share unused books, calculators, or devices with fellow students.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="rounded-xl border border-border p-2 text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Item Title *</label>
                <input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Class 10 NCERT Science and Math Books"
                  className="w-full rounded-xl border border-border bg-background p-2.5 text-xs outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-1">Category *</label>
                  <select
                    value={cat}
                    onChange={(e) => setCat(e.target.value as any)}
                    className="w-full rounded-xl border border-border bg-background p-2 text-xs"
                  >
                    <option value="books">Textbooks & Notes</option>
                    <option value="calculator">Scientific Calculator</option>
                    <option value="stationery">Stationery & Geometry Kit</option>
                    <option value="device">Reusable Study Device</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Condition *</label>
                  <select
                    value={condition}
                    onChange={(e) => setCondition(e.target.value as any)}
                    className="w-full rounded-xl border border-border bg-background p-2 text-xs"
                  >
                    <option value="Brand New">Brand New</option>
                    <option value="Gently Used">Gently Used</option>
                    <option value="Fair">Fair</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">General Area (City / Locality Only) *</label>
                <input
                  required
                  value={generalArea}
                  onChange={(e) => setGeneralArea(e.target.value)}
                  placeholder="e.g. North Delhi, Rohini (Do NOT enter house or street address)"
                  className="w-full rounded-xl border border-border bg-background p-2.5 text-xs outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Designated Public Safe Handover Point *</label>
                <input
                  required
                  value={safeHandoverPoint}
                  onChange={(e) => setSafeHandoverPoint(e.target.value)}
                  placeholder="e.g. Govt School Main Gate / District Public Library Desk"
                  className="w-full rounded-xl border border-border bg-background p-2.5 text-xs outline-none focus:border-primary"
                />
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Must be a public library, school, or community hall.
                </p>
              </div>

              <div>
                <label className="block font-semibold mb-1">Description *</label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe book edition, subject, or calculator features. NEVER include phone numbers or emails."
                  className="w-full rounded-xl border border-border bg-background p-2.5 text-xs outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Your Role</label>
                <select
                  value={listedByRole}
                  onChange={(e) => setListedByRole(e.target.value as any)}
                  className="w-full rounded-xl border border-border bg-background p-2 text-xs"
                >
                  <option value="Student">Student</option>
                  <option value="Teacher">Teacher / Educator</option>
                  <option value="Alumni Donor">Alumni Donor</option>
                  <option value="NGO Partner">NGO Partner</option>
                </select>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="rounded-xl border border-border px-4 py-2 text-xs font-medium hover:bg-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-xl brand-bg text-white px-5 py-2 text-xs font-semibold shadow-glow hover:opacity-95 disabled:opacity-50"
              >
                {submitting ? "Listing..." : "Submit Listing"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Request Modal */}
      {requestingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleSubmitRequest}
            className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold">Request "{requestingItem.title}"</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Designate pickup details at a public safe point.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRequestingItem(null)}
                className="rounded-xl border border-border p-2 text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Pickup Safe Point</label>
                <input
                  value={pickupPoint}
                  onChange={(e) => setPickupPoint(e.target.value)}
                  placeholder={requestingItem.safeHandoverPoint}
                  className="w-full rounded-xl border border-border bg-background p-2.5 text-xs outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Message for Donor</label>
                <textarea
                  rows={3}
                  value={requestMsg}
                  onChange={(e) => setRequestMsg(e.target.value)}
                  placeholder="e.g. I am preparing for Class 10 board exams and will collect this at the library desk."
                  className="w-full rounded-xl border border-border bg-background p-2.5 text-xs outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Requester Role</label>
                <select
                  value={reqRole}
                  onChange={(e) => setReqRole(e.target.value as any)}
                  className="w-full rounded-xl border border-border bg-background p-2 text-xs"
                >
                  <option value="Student">Student</option>
                  <option value="Parent/Guardian">Parent / Guardian</option>
                  <option value="Teacher">Teacher / School Representative</option>
                </select>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRequestingItem(null)}
                className="rounded-xl border border-border px-4 py-2 text-xs font-medium hover:bg-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-xl brand-bg text-white px-5 py-2 text-xs font-semibold shadow-glow hover:opacity-95"
              >
                Confirm Request
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Report Modal */}
      {reportingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleSubmitReport}
            className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-destructive flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4" /> Report Listing
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Help maintain safety and community integrity.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReportingItem(null)}
                className="rounded-xl border border-border p-2 text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Reason for Report</label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background p-2 text-xs"
                >
                  <option value="inappropriate_content">Inappropriate Content</option>
                  <option value="contact_info_exposed">Personal Phone / Address Exposed</option>
                  <option value="misleading_condition">Misleading Item Condition</option>
                  <option value="safety_concern">Safety Concern</option>
                  <option value="other">Other Violation</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Details (Optional)</label>
                <textarea
                  rows={3}
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  placeholder="Provide context for moderation team..."
                  className="w-full rounded-xl border border-border bg-background p-2.5 text-xs outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setReportingItem(null)}
                className="rounded-xl border border-border px-4 py-2 text-xs font-medium hover:bg-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-xl bg-destructive text-destructive-foreground px-5 py-2 text-xs font-semibold hover:opacity-90"
              >
                Submit Report
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// TAB 5: SCHOLARSHIP AND OPPORTUNITY CORNER
// =============================================================================

function OpportunityCornerTab() {
  const [level, setLevel] = useState("all");
  const [cat, setCat] = useState("all");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const opportunities = useMemo(() => {
    return SEED_SCHOLARSHIPS.filter((opp) => {
      if (level !== "all" && opp.level !== level && opp.level !== "All Students") return false;
      if (cat !== "all" && opp.category !== cat) return false;
      if (search.trim()) {
        const s = search.toLowerCase();
        if (
          !opp.title.toLowerCase().includes(s) &&
          !opp.organization.toLowerCase().includes(s) &&
          !opp.eligibilitySummary.toLowerCase().includes(s)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [level, cat, search]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-[var(--shadow-card)] space-y-2">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-brand-amber to-brand-emerald text-white shadow-glow">
            <Award className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-xl font-bold">Scholarship & Opportunity Corner</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Verified government scholarships, fee waivers, free courses, and technology grants.
              Zero invented deadlines or fabricated benefits.
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="rounded-2xl border border-border/60 bg-card p-4 space-y-3">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search scholarships, grants, or sponsoring bodies (e.g. YASASVI, NMMSS, AICTE, SWAYAM)..."
              className="w-full rounded-xl border border-border bg-background py-2 pl-10 pr-4 text-xs outline-none focus:border-primary"
            />
          </div>

          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="rounded-xl border border-border bg-background px-3 py-2 text-xs"
          >
            <option value="all">All Education Levels</option>
            <option value="Class 9-10">Class 9 - 10</option>
            <option value="Class 11-12">Class 11 - 12</option>
            <option value="College / Undergraduate">College / Degree</option>
            <option value="All Students">All Students</option>
          </select>

          <select
            value={cat}
            onChange={(e) => setCat(e.target.value)}
            className="rounded-xl border border-border bg-background px-3 py-2 text-xs"
          >
            <option value="all">All Opportunity Types</option>
            <option value="Scholarship">Government Scholarships</option>
            <option value="Free Course">Free Online Courses</option>
            <option value="Competition / Fellowship">Competitions & Fellowships</option>
          </select>
        </div>
      </div>

      {/* Opportunities List */}
      <div className="grid gap-4 md:grid-cols-2">
        {opportunities.map((opp) => {
          const isExpanded = expandedId === opp.id;
          return (
            <div
              key={opp.id}
              className="flex flex-col justify-between rounded-2xl border border-border/70 bg-card p-5 shadow-[var(--shadow-card)] space-y-4 transition hover:border-primary/40 hover:shadow-glow"
            >
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-1.5 text-[11px]">
                  <span className="rounded-md bg-primary/10 text-primary font-semibold px-2 py-0.5">
                    {opp.category}
                  </span>
                  <span className="rounded-md bg-secondary text-secondary-foreground font-medium px-2 py-0.5">
                    {opp.level}
                  </span>
                  <span className="rounded-md bg-brand-emerald/10 text-brand-emerald font-medium px-2 py-0.5 flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" /> {opp.verificationStatus}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold leading-snug">{opp.title}</h3>
                  {opp.titleHi && (
                    <p className="text-xs text-muted-foreground mt-0.5">{opp.titleHi}</p>
                  )}
                  <p className="text-xs font-medium text-brand-cyan mt-1">{opp.organization}</p>
                </div>

                {/* Benefit Highlight */}
                <div className="rounded-xl border border-brand-emerald/30 bg-brand-emerald/5 p-3 text-xs">
                  <div className="text-[11px] font-bold text-brand-emerald uppercase tracking-wider">Benefit / Grant</div>
                  <div className="text-sm font-semibold text-foreground mt-0.5">{opp.benefit}</div>
                </div>

                {/* Eligibility Summary in Simple Language */}
                <div className="text-xs space-y-1 text-muted-foreground">
                  <span className="font-semibold text-foreground">Eligibility (Plain Language):</span>
                  <p className="leading-relaxed">{opp.eligibilitySummary}</p>
                </div>

                <div className="space-y-1 text-xs text-muted-foreground pt-1 border-t border-border/40">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-primary" />
                    <span><strong>Deadline:</strong> {opp.deadline}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <CheckCircle2 className="h-3.5 w-3.5 text-brand-emerald" />
                    <span>Verified: {opp.verificationDate}</span>
                  </div>
                </div>

                {/* Step-by-Step Accordion */}
                {isExpanded && (
                  <div className="rounded-xl border border-border/60 bg-muted/40 p-3.5 text-xs space-y-2 mt-2">
                    <div className="font-bold text-foreground">How to Apply (Simple Steps):</div>
                    <ul className="space-y-1.5 text-muted-foreground">
                      {opp.applicationSteps.map((step, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-border/40 flex items-center justify-between gap-2">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : opp.id)}
                  className="rounded-xl border border-border px-3 py-2 text-xs font-medium hover:bg-secondary transition"
                >
                  {isExpanded ? "Hide Steps" : "Application Steps"}
                </button>

                <a
                  href={opp.officialLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-xl brand-bg text-white px-4 py-2 text-xs font-semibold shadow-glow hover:opacity-95 transition"
                >
                  <span>Official Application</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
