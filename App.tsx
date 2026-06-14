import React, { useState, useEffect } from "react";
import { LinkEntry, SearchErrorState } from "./types";
import SearchBar from "./components/SearchBar";
import AddModal from "./components/AddModal";
import Dashboard from "./components/Dashboard";
import AdminPanel from "./components/AdminPanel";
import { Globe, Plus, Cpu, ArrowUpRight, CheckCircle2, ShieldAlert, Wifi, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const [links, setLinks] = useState<LinkEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"directory" | "admin">("directory");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Bridging Redirection visual loading state
  const [redirectingEntry, setRedirectingEntry] = useState<LinkEntry | null>(null);
  const [redirectProgress, setRedirectProgress] = useState(0);

  // Incoming redirect lookup notification banners
  const [errorBanner, setErrorBanner] = useState<SearchErrorState>({ type: null });

  // Load DNS links from Server Database
  const fetchLinks = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/all-links");
      if (res.ok) {
        const data = await res.json();
        setLinks(data as LinkEntry[]);
      }
    } catch (err) {
      console.error("Connection failed while loading DNS databases:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLinks();

    // Parse shortlink resolution URL redirect parameters if any
    const params = new URLSearchParams(window.location.search);
    const errorType = params.get("error");
    const nameParam = params.get("name");

    if (errorType === "not_found") {
      setErrorBanner({ type: "not_found", name: nameParam || "" });
    } else if (errorType === "pending") {
      setErrorBanner({ type: "pending", name: nameParam || "" });
    } else if (errorType === "internal_redirect") {
      setErrorBanner({ type: "internal" });
    }
  }, []);

  // Bridge navigation animation triggers
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (redirectingEntry) {
      setRedirectProgress(0);
      interval = setInterval(() => {
        setRedirectProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            // Execute the physical redirection redirecting through backend DNS router
            window.location.href = `/r/${redirectingEntry.name}`;
            return 100;
          }
          return prev + 12; // Speed of bridging animation
        });
      }, 150);
    }
    return () => clearInterval(interval);
  }, [redirectingEntry]);

  // CRUD Handlers connected to real full-stack node services
  const handleEdit = async (id: string, name: string, ip: string, description?: string) => {
    const res = await fetch(`/api/links/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, ip, description }),
    });

    if (!res.ok) {
      const result = await res.json();
      throw new Error(result.error || "Failed to update record.");
    }

    await fetchLinks();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you absolutely sure you want to permanently discard this DNS namespace reservation?")) {
      return;
    }

    const res = await fetch(`/api/links/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const result = await res.json();
      alert(result.error || "Failed to drop database entry.");
      return;
    }

    await fetchLinks();
  };

  const handleApprove = async (id: string) => {
    const res = await fetch(`/api/links/${id}/approve`, {
      method: "PUT",
    });

    if (!res.ok) {
      const result = await res.json();
      alert(result.error || "Approval override failed.");
      return;
    }

    await fetchLinks();
  };

  const handleSuccessNewLink = (newLink: LinkEntry) => {
    setLinks((prev) => [newLink, ...prev]);
    fetchLinks();
  };

  const activeLinks = links.filter((l) => l.approved);
  const activeNames = links.map((l) => l.name);

  return (
    <div className="min-h-screen bg-[#FBFBFD] text-[#1D1D1F] relative overflow-x-hidden selection:bg-neutral-200">
      
      {/* Background Soft Ambient Light Gradients for clean minimalism look */}
      <div className="absolute top-0 left-0 right-0 h-[450px] bg-gradient-to-b from-[#f2f2f7]/50 to-[#FBFBFD] -z-10" />

      {/* Main Top Header Navbar */}
      <header className="sticky top-0 z-40 bg-white/70 backdrop-blur-md border-b border-gray-100 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          
          {/* Brand Logo Group */}
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setActiveTab("directory")}>
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center shadow-xs">
              <div className="w-4 h-4 border-2 border-white rounded-full"></div>
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-[#1D1D1F] font-display uppercase">
                NameLink
              </h1>
              <p className="text-[9px] text-gray-400 font-mono tracking-widest uppercase font-light">
                Secure Namespace Router
              </p>
            </div>
          </div>

          {/* Navigation Panel Tabs */}
          <div className="flex items-center gap-1.5 bg-gray-150/60 p-0.5 rounded-xl text-xs font-semibold">
            <button
              id="nav-tab-directory"
              onClick={() => setActiveTab("directory")}
              className={`px-3.5 py-1.5 rounded-lg transition-all ${
                activeTab === "directory" ? "bg-white text-black shadow-xs border border-gray-100" : "text-gray-500 hover:text-black"
              }`}
            >
              Directory
            </button>
            <button
              id="nav-tab-admin"
              onClick={() => setActiveTab("admin")}
              className={`px-3.5 py-1.5 rounded-lg transition-all ${
                activeTab === "admin" ? "bg-white text-black shadow-xs border border-gray-100" : "text-gray-500 hover:text-black"
              }`}
            >
              Admin Panel
            </button>
          </div>

          {/* Nav Right: Submission trigger */}
          <button
            id="open-registrar-modal"
            onClick={() => setAddModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-black hover:bg-neutral-800 text-white font-medium rounded-xl text-xs tracking-wider shadow-xs transition-all duration-150 active:scale-[0.98]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Endpoint</span>
          </button>
        </div>
      </header>

      {/* Dynamic Pending Approvals Admin Status Bar */}
      {links.filter((l) => !l.approved).length > 0 && (
        <div className="relative mt-4 flex justify-center z-30">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-amber-50 border border-amber-100 px-4 py-2 rounded-full flex items-center gap-2 cursor-pointer shadow-xs hover:bg-amber-100/50 transition-colors"
            onClick={() => setActiveTab("admin")}
          >
            <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-amber-800 font-medium font-sans">
              {links.filter((l) => !l.approved).length} entries pending admin approval
            </span>
          </motion.div>
        </div>
      )}

      {/* Main Container Area */}
      <main className="pb-24">
        
        {/* Dynamic Warning Notification Banners */}
        <AnimatePresence>
          {errorBanner.type && (
            <div className="max-w-4xl mx-auto mt-6 px-4">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className={`p-4 rounded-2xl border flex items-start gap-3.5 shadow-xs ${
                  errorBanner.type === "not_found"
                    ? "border-rose-200 bg-rose-50 text-rose-800"
                    : errorBanner.type === "pending"
                    ? "border-amber-200 bg-amber-50 text-amber-800"
                    : "border-neutral-200 bg-neutral-50 text-neutral-700"
                }`}
              >
                <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="flex-1 text-xs leading-relaxed font-sans">
                  {errorBanner.type === "not_found" ? (
                    <>
                      <strong className="font-semibold">Nameserver Resolution Error:</strong> The custom name{" "}
                      <code className="font-mono bg-rose-100 px-1 py-0.5 rounded text-rose-900">
                        {errorBanner.name}
                      </code>{" "}
                      is not registered on this DNS system. You can create it immediately by clicking the 
                      &ldquo;Add Endpoint&rdquo; button.
                    </>
                  ) : errorBanner.type === "pending" ? (
                    <>
                      <strong className="font-semibold">Redirection Restricted:</strong> The custom name{" "}
                      <code className="font-mono bg-amber-100 px-1 py-0.5 rounded text-amber-900">
                        {errorBanner.name}
                      </code>{" "}
                      is awaiting administrator review. Head over to the <strong className="font-semibold tracking-tight font-display">Admin Panel</strong>.
                    </>
                  ) : (
                    <>
                      <strong className="font-semibold">Engine System Warning:</strong> An issue occurred while attempting to resolve the destination host link.
                    </>
                  )}
                </div>
                <button
                  id="close-error-banner"
                  onClick={() => setErrorBanner({ type: null })}
                  className="p-1 hover:bg-neutral-200/50 rounded-lg text-neutral-500 transition-colors shrink-0"
                >
                  Dismiss
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Dynamic tab contents switching */}
        {activeTab === "directory" ? (
          <div className="space-y-4">
            
            {/* Minimal Modern Apple Hero banner */}
            <div className="text-center max-w-2xl mx-auto pt-16 px-4 mb-2">
              <h2 className="text-4xl sm:text-6xl font-bold text-[#1D1D1F] tracking-tight font-sans mb-4 leading-none">
                The DNS for <span className="text-blue-600">everything.</span>
              </h2>
              <p className="text-base sm:text-xl font-sans font-light text-gray-400 max-w-lg mx-auto">
                Connect custom local names to any IP address in seconds. No domains, no cost, no friction.
              </p>
            </div>

            {/* Apple Centered Search widget */}
            <SearchBar activeLinks={activeLinks} onRedirecting={(entry) => setRedirectingEntry(entry)} />

            {/* Directory Cards listing */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-neutral-400 font-light text-sm">
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Synchronizing DNS lists...</span>
              </div>
            ) : (
              <Dashboard
                links={links}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onApprove={handleApprove}
                isAdminMode={isAdmin}
              />
            )}

          </div>
        ) : (
          /* Admin Panel tab content */
          <AdminPanel
            links={links}
            onApprove={handleApprove}
            onDelete={handleDelete}
            isAdmin={isAdmin}
            setIsAdmin={setIsAdmin}
          />
        )}

      </main>

      {/* Floating Action Circular trigger */}
      <button
        id="floating-action-add-trigger"
        onClick={() => setAddModalOpen(true)}
        className="fixed bottom-8 right-8 w-16 h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-2xl shadow-blue-300 flex items-center justify-center cursor-pointer transition-transform hover:scale-110 active:scale-95 z-40 group"
        title="Add new mapping"
      >
        <Plus className="w-7 h-7 stroke-[2.5]" />
      </button>

      {/* Bridge resolution loading overlay (DNS Resolution Handshake) */}
      <AnimatePresence>
        {redirectingEntry && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#fafbfc] flex flex-col items-center justify-center p-6 selection:bg-neutral-200"
          >
            {/* Center card visualizer */}
            <motion.div
              initial={{ scale: 0.96, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0 }}
              transition={{ delay: 0.1, duration: 0.25 }}
              className="w-full max-w-md p-8 rounded-3xl bg-white border border-neutral-200/80 shadow-2xl space-y-6 text-center"
            >
              
              {/* Handshake visual loop */}
              <div className="flex justify-center items-center gap-5">
                <div className="p-3 bg-neutral-900 border border-neutral-800 text-white rounded-2xl animate-bounce">
                  <Globe className="w-6 h-6" />
                </div>
                <div className="flex gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-neutral-300 animate-ping" />
                  <span className="w-1.5 h-1.5 rounded-full bg-neutral-300 animate-ping delay-75" />
                  <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-ping delay-150" />
                </div>
                <div className="p-3 bg-neutral-50 border border-neutral-200 text-neutral-800 rounded-2xl shadow-xs">
                  <Cpu className="w-6 h-6" />
                </div>
              </div>

              {/* Loader description text */}
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-neutral-900 tracking-tight font-display uppercase">
                  NameLink Resolver
                </h3>
                <p className="text-xs text-neutral-400 font-sans font-light">
                  Querying local hostnames and binding virtual endpoints...
                </p>
              </div>

              {/* Resolved mapping visualizer */}
              <div className="py-4 px-5 rounded-2xl bg-neutral-50/50 border border-neutral-100 font-mono text-center space-y-1.5">
                <div className="text-xs text-neutral-400">DNS ROUTE MATCH</div>
                <div className="flex items-center justify-center gap-2 text-sm font-semibold text-neutral-800 flex-wrap">
                  <span className="px-2 py-0.5 bg-neutral-100 rounded-lg text-neutral-900 border border-neutral-200/60 shadow-2xs">
                    {redirectingEntry.name}
                  </span>
                  <span>➜</span>
                  <span className="text-neutral-700 font-light">{redirectingEntry.ip}</span>
                </div>
              </div>

              {/* Progress loading percentage bar */}
              <div className="space-y-1.5">
                <div className="h-1 w-full bg-neutral-100 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-neutral-900 rounded-full"
                    animate={{ width: `${redirectProgress}%` }}
                    transition={{ ease: "easeInOut" }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-neutral-400 font-mono tracking-widest uppercase">
                  <span>Resolving Handshake</span>
                  <span>{redirectProgress}%</span>
                </div>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Absolute Bottom minimal branding */}
      <footer className="py-8 text-center text-xs text-neutral-400 font-light font-sans mt-12 border-t border-neutral-200/30">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span>&copy; {new Date().getFullYear()} NameLink. Local Intranet DNS & Mapping router.</span>
          <div className="flex items-center justify-center gap-1 text-[10px] font-mono leading-none">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
            <span>NAMESERVER RUNNING PORT: 3000</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
