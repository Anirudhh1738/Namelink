import React, { useState } from "react";
import { X, Globe, Plus, AlertCircle, Info } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { LinkEntry } from "../types";

interface AddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newLink: LinkEntry) => void;
  existingNames: string[];
}

export default function AddModal({ isOpen, onClose, onSuccess, existingNames }: AddModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    ip: "",
    description: "",
  });

  const [loading, setLoading] = useState(false);
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    // Strip space for name fields
    const cleanValue = name === "name" ? value.replace(/\s+/g, "").toLowerCase() : value;

    setFormData((prev) => ({ ...prev, [name]: cleanValue }));
    // Clear validation error on change
    if (clientErrors[name]) {
      setClientErrors((prev) => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }
    setGeneralError("");
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // 1. Validate custom name layout
    const cleanName = formData.name.trim().toLowerCase();
    if (!cleanName) {
      errors.name = "Custom Name field is required.";
    } else if (!/^[a-z0-9-_]{1,30}$/.test(cleanName)) {
      errors.name = "Custom Name must be between 1 and 30 characters and alphanumeric (dashes/underscores allowed).";
    } else if (existingNames.includes(cleanName)) {
      errors.name = `The custom name '${cleanName}' is already reserved.`;
    }

    // 2. Validate IP targets (both IPv4 and optional port formats)
    const cleanIp = formData.ip.trim();
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(?::\d{1,5})?$/;
    if (!cleanIp) {
      errors.ip = "An IP Target address is required.";
    } else if (!ipRegex.test(cleanIp)) {
      errors.ip = "Invalid connection target format. Must be a valid IPv4 address (e.g. 192.168.1.100), optional with port (e.g. 10.0.0.2:80).";
    }

    setClientErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setGeneralError("");

    try {
      const response = await fetch("/api/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to save the NameLink record.");
      }

      onSuccess(result as LinkEntry);
      // Reset form variables
      setFormData({ name: "", ip: "", description: "" });
      onClose();
    } catch (err: any) {
      setGeneralError(err.message || "An unexpected network error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop screen overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.35 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-neutral-900"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="w-full max-w-lg overflow-hidden rounded-3xl bg-white border border-gray-100 shadow-2xl relative z-10 animate-fade-in"
          >
            {/* Header branding */}
            <div className="border-b border-gray-100 px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white shadow-xs">
                  <div className="w-4 h-4 border-2 border-white rounded-full"></div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#1D1D1F] tracking-tight">
                    Add Endpoint
                  </h3>
                  <p className="text-xs text-gray-400 font-light font-sans tracking-tight mt-0.5">
                    Map custom names to virtual local IP addresses
                  </p>
                </div>
              </div>
              <button
                id="close-modal-button"
                onClick={onClose}
                className="p-1.5 rounded-xl hover:bg-gray-50 text-gray-400 hover:text-black transition-colors cursor-pointer"
                aria-label="Close registrar form"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Registrar form space */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 font-sans">
              
              {/* Custom Website Name Input */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
                  Custom Domain Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4.5 top-1/2 -translate-y-1/2 text-gray-400 font-mono text-sm font-light select-none">
                    namelink.local/r/
                  </span>
                  <input
                    id="new-link-name-input"
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="myshop"
                    className={`w-full bg-[#FBFBFD] border rounded-xl py-3 pl-32 pr-4 text-sm font-mono focus:outline-none focus:bg-white transition-all ${
                      clientErrors.name
                        ? "border-rose-300 ring-2 ring-rose-50 focus:border-rose-400"
                        : "border-gray-100 focus:border-neutral-300"
                    }`}
                    disabled={loading}
                    required
                  />
                </div>
                {clientErrors.name ? (
                  <p className="text-xs text-rose-600 font-light mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    {clientErrors.name}
                  </p>
                ) : (
                  <p className="text-[11px] text-gray-400 font-light mt-1.5">
                    Lowercase letters, numbers, dashes only. Uniquely represents your redirection tag.
                  </p>
                )}
              </div>

              {/* IP Address Targets */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
                  Destination Target IP <span className="text-rose-500">*</span>
                </label>
                <input
                  id="new-link-ip-input"
                  type="text"
                  name="ip"
                  value={formData.ip}
                  onChange={handleInputChange}
                  placeholder="e.g. 192.168.1.100 or 10.0.0.12:8080"
                  className={`w-full bg-[#FBFBFD] border rounded-xl px-4.5 py-3 text-sm font-mono focus:outline-none focus:bg-white transition-all ${
                    clientErrors.ip
                      ? "border-rose-300 ring-2 ring-rose-50 focus:border-rose-400"
                      : "border-gray-100 focus:border-neutral-300"
                  }`}
                  disabled={loading}
                  required
                />
                {clientErrors.ip ? (
                  <p className="text-xs text-rose-600 font-light mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    {clientErrors.ip}
                  </p>
                ) : (
                  <p className="text-[11px] text-gray-400 font-light mt-1.5">
                    Enter any LAN IPv4 address. You can append an optional colon port (e.g., :3000).
                  </p>
                )}
              </div>

              {/* Redirection Description Info */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
                  Optional Resource Description
                </label>
                <textarea
                  id="new-link-description-input"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Explain what this micro-project does (e.g. Raspberry Pi thermal sensor log UI)"
                  rows={3}
                  maxLength={200}
                  className="w-full bg-[#FBFBFD] border border-gray-100 rounded-xl px-4.5 py-3 text-sm focus:outline-none focus:bg-white focus:border-neutral-300 transition-all font-light leading-relaxed placeholder-gray-300"
                  disabled={loading}
                />
                <div className="flex justify-between mt-1 text-[11px] text-gray-400 font-light">
                  <span>Describe scope to aid coworkers or visitors.</span>
                  <span>{formData.description.length}/200</span>
                </div>
              </div>

              {/* Admin Approval System Notice */}
              <div className="p-3.5 rounded-xl border border-blue-100 bg-blue-50/30 flex gap-2.5">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-[11px] leading-relaxed text-blue-800 font-normal">
                  <strong className="font-semibold">Security Authorization Panel:</strong> Submitted entries default to <strong className="font-semibold">Review</strong> state. Go to the Admin Panel in the navigation bar to approve them so they can be securely resolved!
                </div>
              </div>

              {/* General errors summary */}
              {generalError && (
                <div className="p-4 rounded-xl border border-rose-100 bg-rose-50/50 text-rose-700 text-xs font-light flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{generalError}</span>
                </div>
              )}

              {/* Submission CTA trigger */}
              <div className="border-t border-gray-100 pt-5 flex items-center justify-end gap-3">
                <button
                  type="button"
                  id="cancel-modal-button"
                  onClick={onClose}
                  className="px-4.5 py-2.5 border border-gray-150 hover:bg-gray-50 text-gray-500 rounded-xl text-sm font-medium transition-colors cursor-pointer"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="save-link-button"
                  className="flex items-center gap-2 px-6 py-2.5 bg-black hover:bg-neutral-800 text-white rounded-xl text-sm font-medium tracking-wide shadow-xs transition-all active:scale-[0.98] cursor-pointer"
                  disabled={loading}
                >
                  {loading ? (
                    <span>Registering...</span>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Save Link
                    </>
                  )}
                </button>
              </div>

            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
