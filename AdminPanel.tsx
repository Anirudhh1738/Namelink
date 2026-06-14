import React, { useState } from "react";
import { LinkEntry } from "../types";
import { Check, ShieldCheck, Lock, Trash2, Globe, Server, Activity, ArrowUpRight, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface AdminPanelProps {
  links: LinkEntry[];
  onApprove: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  isAdmin: boolean;
  setIsAdmin: (value: boolean) => void;
}

export default function AdminPanel({ links, onApprove, onDelete, isAdmin, setIsAdmin }: AdminPanelProps) {
  const [passphrase, setPassphrase] = useState("");
  const [passError, setPassError] = useState("");

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passphrase === "admin123") {
      setIsAdmin(true);
      setPassphrase("");
      setPassError("");
    } else {
      setPassError("Invalid admin access key. Try 'admin123' for standard testing.");
    }
  };

  const pendingLinks = links.filter((link) => !link.approved);
  const activeLinksCount = links.filter((link) => link.approved).length;

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 relative z-30 font-sans">
      
      {/* If current user is NOT authenticated as Admin */}
      <AnimatePresence mode="wait">
        {!isAdmin ? (
          <motion.div
            key="auth-gate"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="max-w-md mx-auto mt-12 p-8 rounded-3xl bg-white border border-gray-100 shadow-2xl relative"
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-black rounded-xl flex items-center justify-center text-white shadow-lg">
              <Lock className="w-5 h-5" />
            </div>

            <div className="text-center mt-6">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">Operator Console</h2>
              <h3 className="text-lg font-bold text-[#1D1D1F] tracking-tight">
                Admin Panel Access
              </h3>
              <p className="text-xs text-gray-400 font-light mt-1 max-w-xs mx-auto">
                Authenticate using standard development passcode to override mappings
              </p>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-4 mt-6">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
                  Admin Passkey
                </label>
                <input
                  id="admin-passcode-input"
                  type="password"
                  value={passphrase}
                  onChange={(e) => {
                    setPassphrase(e.target.value);
                    setPassError("");
                  }}
                  placeholder="Enter passcode (admin123)"
                  className="w-full px-4 py-3 text-sm border border-gray-100 rounded-xl bg-[#FBFBFD] focus:outline-none focus:bg-white text-center font-mono tracking-widest text-[#1D1D1F]"
                />
                {passError && (
                  <p className="text-xs text-rose-600 font-light mt-1.5 text-center">
                    {passError}
                  </p>
                )}
              </div>

              <button
                type="submit"
                id="admin-auth-submit"
                className="w-full py-3 bg-black hover:bg-neutral-800 text-white rounded-xl text-sm font-semibold transition-all shadow-xs active:scale-[0.98] cursor-pointer"
              >
                Authenticate Console
              </button>
            </form>

            <div className="mt-6 border-t border-gray-100 pt-4.5 text-center">
              <span className="text-[11px] text-gray-400 font-light">
                Prototype authentication key is configured as: <code className="px-1.5 py-0.5 bg-neutral-100 border border-neutral-200 rounded font-mono text-[10px] text-neutral-600 font-semibold">admin123</code>
              </span>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="admin-workspace"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8"
          >
            {/* Admin Header Info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">Administrative Operations</h2>
                <h3 className="text-2xl font-bold text-[#1D1D1F] tracking-tight flex items-center gap-2">
                  Operator Security Console
                </h3>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-mono px-2.5 py-1 bg-green-50 border border-green-200 text-green-700 rounded-xl font-light">
                  Active Session: Root Operator
                </span>
                <button
                  id="lock-console-button"
                  onClick={() => setIsAdmin(false)}
                  className="px-3.5 py-1.5 border border-gray-150 hover:bg-gray-50 text-xs text-gray-500 hover:text-black rounded-xl transition-colors font-medium cursor-pointer"
                >
                  Lock Console
                </button>
              </div>
            </div>

            {/* Micro Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {/* Stat Card 1 */}
              <div className="p-6 rounded-2xl border border-gray-100 bg-[#FBFBFD] shadow-2xl shadow-gray-200/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Review Queue
                  </span>
                  <Activity className="w-4 h-4 text-gray-400 hover:text-amber-500 transition-colors" />
                </div>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-bold text-[#1D1D1F] font-sans">
                    {pendingLinks.length}
                  </span>
                  <span className="text-xs text-gray-400 font-sans">
                    Pending reviews
                  </span>
                </div>
              </div>

              {/* Stat Card 2 */}
              <div className="p-6 rounded-2xl border border-gray-100 bg-[#FBFBFD] shadow-2xl shadow-gray-200/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Active Registries
                  </span>
                  <Globe className="w-4 h-4 text-gray-400" />
                </div>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-bold text-[#1D1D1F] font-sans">
                    {activeLinksCount}
                  </span>
                  <span className="text-xs text-gray-400 font-sans">
                    Resolving requests
                  </span>
                </div>
              </div>

              {/* Stat Card 3 */}
              <div className="p-6 rounded-2xl border border-gray-100 bg-[#FBFBFD] shadow-2xl shadow-gray-200/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Total Database
                  </span>
                  <Server className="w-4 h-4 text-gray-400" />
                </div>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-bold text-[#1D1D1F] font-sans">
                    {links.length}
                  </span>
                  <span className="text-xs text-gray-400 font-sans">
                    Allocated maps
                  </span>
                </div>
              </div>
            </div>

            {/* Approval Action Workspace */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                Pending Approval Inbox
              </h3>

              <AnimatePresence mode="popLayout">
                {pendingLinks.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-12 rounded-2xl border border-dashed border-gray-200 text-center text-gray-400 font-light text-sm bg-white"
                  >
                    <CheckCircle2 className="w-6 h-6 text-green-500 mx-auto mb-3 animate-bounce" />
                    All submissions cleared! The DNS mapping queue is empty.
                  </motion.div>
                ) : (
                  <div className="space-y-3.5">
                    {pendingLinks.map((link) => (
                      <motion.div
                        key={link.id}
                        layout
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="p-5 rounded-2xl border border-gray-100 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-200 hover:border-blue-200 shadow-2xl shadow-gray-150/20"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <span className="text-[11px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-bold uppercase tracking-wider font-mono">
                              {link.name}
                            </span>
                            <span className="text-gray-400 font-light font-sans text-xs">redirects to</span>
                            <span className="font-mono text-sm font-semibold text-gray-400">
                              {link.ip}
                            </span>
                          </div>
                          {link.description ? (
                            <p className="text-xs text-gray-400 font-normal italic mt-1 leading-snug">
                              &ldquo;{link.description}&rdquo;
                            </p>
                          ) : (
                            <p className="text-[11px] text-gray-300 font-light mt-1">
                              No description configured by author
                            </p>
                          )}
                          <div className="text-[10px] text-gray-400 font-mono mt-1 font-light">
                            Registered on: {new Date(link.createdAt).toLocaleString()}
                          </div>
                        </div>

                        {/* Actions block */}
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            id={`approve-btn-${link.id}`}
                            onClick={() => onApprove(link.id)}
                            className="flex items-center gap-1.5 px-4.5 py-2 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-all active:scale-[0.98] cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Approve target
                          </button>
                          
                          <button
                            id={`admin-reject-btn-${link.id}`}
                            onClick={() => onDelete(link.id)}
                            className="p-2 border border-rose-100 bg-rose-50/50 hover:bg-rose-50 text-rose-600 rounded-xl transition-all cursor-pointer"
                            title="Reject and delete submission"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </AnimatePresence>
            </div>

            {/* General Admin Warning/Safety Footer */}
            <div className="p-5 rounded-2xl border border-gray-100 bg-[#FBFBFD] text-gray-400 text-xs font-light leading-relaxed">
              <strong className="font-semibold text-gray-500 uppercase tracking-widest text-[10px] block mb-1">Operator Directive</strong> 
              These custom NameLink assignments bypass domain cost structures for internal projects. Please verify that connection targets do not conflict with reserved local gateway network hosts, such as standard system loops (<code className="font-mono text-[10px]">127.0.0.1</code>) or standard internal router gateways. Under the sandbox model, you may safely test mapping outputs instantly.
            </div>

          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
