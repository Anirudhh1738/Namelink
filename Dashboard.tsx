import React, { useState } from "react";
import { LinkEntry } from "../types";
import { Calendar, Globe, Trash2, Edit2, Check, X, ShieldAlert, Copy, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface DashboardProps {
  links: LinkEntry[];
  onEdit: (id: string, name: string, ip: string, description?: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onApprove?: (id: string) => Promise<void>;
  isAdminMode: boolean;
}

export default function Dashboard({ links, onEdit, onDelete, onApprove, isAdminMode }: DashboardProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", ip: "", description: "" });
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "pending">("all");
  const [actionError, setActionError] = useState<string | null>(null);

  const startEdit = (entry: LinkEntry) => {
    setEditingId(entry.id);
    setEditForm({
      name: entry.name,
      ip: entry.ip,
      description: entry.description || "",
    });
    setActionError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setActionError(null);
  };

  const handleSave = async (id: string) => {
    const cleanName = editForm.name.trim().toLowerCase();
    const cleanIp = editForm.ip.trim();

    // Small client validations before processing
    if (!cleanName || !cleanIp) {
      setActionError("Custom name and IP target address cannot be empty.");
      return;
    }

    if (!/^[a-z0-9-_]{1,30}$/.test(cleanName)) {
      setActionError("Custom Name must be alphanumeric (dashes/underscores allowed) and 1-30 chars.");
      return;
    }

    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(?::\d{1,5})?$/;
    if (!ipRegex.test(cleanIp)) {
      setActionError("IP Target must follow standard IPv4 validation rules (e.g. 192.168.1.100).");
      return;
    }

    try {
      await onEdit(id, cleanName, cleanIp, editForm.description);
      setEditingId(null);
      setActionError(null);
    } catch (err: any) {
      setActionError(err.message || "Failed to edit record.");
    }
  };

  const copyShortlink = (name: string, id: string) => {
    const shortlink = `${window.location.origin}/r/${name}`;
    navigator.clipboard.writeText(shortlink).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const formatDate = (isoStr: string) => {
    const d = new Date(isoStr);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Filter lists based on tab & dynamic text matches
  const filteredLinks = links.filter((link) => {
    const searchMatch =
      link.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      link.ip.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (link.description && link.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const statusMatch =
      filterStatus === "all" ||
      (filterStatus === "active" && link.approved) ||
      (filterStatus === "pending" && !link.approved);

    return searchMatch && statusMatch;
  });

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 relative z-30 font-sans">
      
      {/* Header section with search + tabs filter */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 border-b border-gray-100 pb-5">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">Dashboard</h2>
          <h3 className="text-2xl font-bold text-[#1D1D1F] tracking-tight">Recently Registered</h3>
        </div>

        {/* Filters control block */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Internal search filter bar */}
          <input
            id="directory-filter-input"
            type="text"
            placeholder="Filter by name / IP..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3.5 py-1.5 bg-gray-50 hover:bg-gray-100/80 focus:bg-white text-xs text-neutral-800 border border-gray-150 rounded-xl focus:outline-none focus:ring-1 focus:ring-neutral-400 transition-all font-light placeholder-gray-300 w-full sm:w-48"
          />

          {/* Filter Status Pills */}
          <div className="flex bg-gray-100/85 p-0.5 rounded-xl text-[11px] font-medium text-gray-500 border border-gray-100">
            <button
              id="filter-status-all"
              onClick={() => setFilterStatus("all")}
              className={`px-3 py-1 rounded-lg transition-all ${
                filterStatus === "all" ? "bg-white text-black shadow-xs" : "hover:text-black"
              }`}
            >
              All ({links.length})
            </button>
            <button
              id="filter-status-active"
              onClick={() => setFilterStatus("active")}
              className={`px-3 py-1 rounded-lg transition-all ${
                filterStatus === "active" ? "bg-white text-black shadow-xs" : "hover:text-black"
              }`}
            >
              Active ({links.filter((l) => l.approved).length})
            </button>
            <button
              id="filter-status-pending"
              onClick={() => setFilterStatus("pending")}
              className={`px-3 py-1 rounded-lg transition-all ${
                filterStatus === "pending" ? "bg-white text-black shadow-xs" : "hover:text-black"
              }`}
            >
              Pending ({links.filter((l) => !l.approved).length})
            </button>
          </div>
        </div>
      </div>

      {actionError && (
        <div className="mb-4 p-3 rounded-xl border border-rose-100 bg-rose-50 text-rose-700 text-xs flex items-center gap-1.5">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Grid listing */}
      <AnimatePresence mode="popLayout">
        {filteredLinks.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-12 text-center text-neutral-400 font-light text-sm"
          >
            No matching NameLink reservations found in directory.
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredLinks.map((entry) => {
              const isEditing = editingId === entry.id;

              return (
                <motion.div
                  key={entry.id}
                  layoutId={`card-${entry.id}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className={`rounded-2xl bg-white border border-gray-100 p-6 flex flex-col justify-between transition-colors hover:border-blue-200 shadow-2xl shadow-gray-150/50 group ${
                    isEditing ? "border-blue-500 ring-2 ring-blue-50" : ""
                  }`}
                >
                  <div className="space-y-4">
                    {/* Entry Header: Link Namespace + Copy Status button */}
                    <div className="flex items-start justify-between gap-2">
                       {isEditing ? (
                        <div className="w-full">
                          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                            Namespace
                          </label>
                          <input
                            id={`edit-name-input-${entry.id}`}
                            type="text"
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value.toLowerCase() })}
                            className="w-full px-3 py-1.5 text-sm font-mono border border-gray-100 rounded-xl bg-[#FBFBFD]"
                          />
                        </div>
                      ) : (
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-sans font-bold text-lg text-[#1D1D1F] tracking-tight leading-none">
                              {entry.name}
                            </span>
                            {/* Copy Clip Widget */}
                            <button
                              id={`copy-button-${entry.id}`}
                              onClick={() => copyShortlink(entry.name, entry.id)}
                              className="p-1 rounded-md bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-black transition-colors"
                              title="Copy resolving shortlink"
                            >
                              {copiedId === entry.id ? (
                                <span className="text-[10px] px-1 text-green-600 font-semibold">Copied!</span>
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                            {/* Redirect Direct link */}
                            {entry.approved && (
                              <a
                                href={`/r/${entry.name}`}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1 rounded-md bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-blue-600 transition-colors flex items-center justify-center"
                                title="Open redirect target"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                          
                          {/* Short DNS link visualizer */}
                          <span className="text-[11px] text-gray-400 font-mono mt-1">
                            /r/{entry.name}
                          </span>
                        </div>
                      )}
 
                      {/* Status Badges */}
                      {!isEditing && (
                        <div className="shrink-0">
                          {entry.approved ? (
                            <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                              Active
                            </span>
                          ) : (
                            <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                              Review
                            </span>
                          )}
                        </div>
                      )}
                    </div>
 
                    {/* Target IP Block */}
                    <div>
                      {isEditing ? (
                        <div className="w-full mt-2">
                          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                            IP Address
                          </label>
                          <input
                            id={`edit-ip-input-${entry.id}`}
                            type="text"
                            value={editForm.ip}
                            onChange={(e) => setEditForm({ ...editForm, ip: e.target.value })}
                            className="w-full px-3 py-1.5 text-sm font-mono border border-gray-100 rounded-xl bg-[#FBFBFD]"
                          />
                        </div>
                      ) : (
                        <div className="flex flex-col gap-0.5 mt-2">
                          <span className="text-xs text-gray-400 font-mono">
                            {entry.ip}
                          </span>
                        </div>
                      )}
                    </div>
 
                    {/* Description Section */}
                    <div>
                      {isEditing ? (
                        <div className="w-full mt-2">
                          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                            Description
                          </label>
                          <textarea
                            id={`edit-description-input-${entry.id}`}
                            value={editForm.description}
                            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                            rows={2}
                            maxLength={200}
                            className="w-full px-3 py-1.5 text-xs border border-gray-100 rounded-xl bg-[#FBFBFD]"
                          />
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 font-normal leading-relaxed line-clamp-2 h-8">
                          {entry.description || (
                            <span className="italic text-gray-300">
                              No description configured.
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                  </div>
 
                  {/* Metadata bottom bar */}
                  <div className="border-t border-gray-100 pt-3.5 mt-5 flex items-center justify-between text-xs text-gray-400">
                    <div>
                      <span>Created {formatDate(entry.createdAt)}</span>
                    </div>

                    {/* Action buttons (Edit/Delete controls) */}
                    <div className="flex items-center gap-1.5">
                      {isEditing ? (
                        <>
                          <button
                            id={`cancel-edit-btn-${entry.id}`}
                            onClick={cancelEdit}
                            className="p-1 px-2.5 border border-gray-150 hover:bg-gray-50 text-gray-500 rounded-lg text-[11px] font-medium transition-colors cursor-pointer"
                          >
                            <X className="w-3 h-3 inline mr-1" />
                            Cancel
                          </button>
                          <button
                            id={`save-edit-btn-${entry.id}`}
                            onClick={() => handleSave(entry.id)}
                            className="p-1 px-2.5 bg-black hover:bg-neutral-800 text-white rounded-lg text-[11px] font-medium transition-colors cursor-pointer"
                          >
                            <Check className="w-3 h-3 inline mr-1" />
                            Save
                          </button>
                        </>
                      ) : (
                        <>
                          {/* Admin Only Instant Approve option directly on pending cards */}
                          {isAdminMode && !entry.approved && onApprove && (
                            <button
                              id={`admin-approve-btn-${entry.id}`}
                              onClick={() => onApprove(entry.id)}
                              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-medium transition-colors cursor-pointer"
                            >
                              Approve
                            </button>
                          )}
                          <button
                            id={`edit-btn-${entry.id}`}
                            onClick={() => startEdit(entry)}
                            className="p-1.5 bg-gray-50/50 hover:bg-gray-50 border border-gray-100 hover:border-gray-200 text-gray-400 hover:text-[#1D1D1F] rounded-lg transition-all cursor-pointer"
                            title="Edit entry details"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            id={`delete-btn-${entry.id}`}
                            onClick={() => onDelete(entry.id)}
                            className="p-1.5 bg-rose-50/50 hover:bg-rose-50 border border-rose-100 hover:border-rose-200 text-rose-400 hover:text-rose-600 rounded-lg transition-all cursor-pointer"
                            title="Archival deletion"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
