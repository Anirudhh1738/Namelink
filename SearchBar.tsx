import React, { useState, useEffect, useRef } from "react";
import { Search, ArrowRight, CornerDownLeft } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { LinkEntry } from "../types";

interface SearchBarProps {
  activeLinks: LinkEntry[];
  onRedirecting: (entry: LinkEntry) => void;
}

export default function SearchBar({ activeLinks, onRedirecting }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<LinkEntry[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [errorMessage, setErrorMessage] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  // Close suggestions box on clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter autocomplete suggestions in real-time
  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      setSelectedIndex(-1);
      setErrorMessage("");
      return;
    }

    const cleanQuery = query.trim().toLowerCase();
    const filtered = activeLinks.filter(
      (link) =>
        link.name.includes(cleanQuery) ||
        (link.description && link.description.toLowerCase().includes(cleanQuery))
    );

    setSuggestions(filtered.slice(0, 5));
    setSelectedIndex(-1);
    setErrorMessage("");
  }, [query, activeLinks]);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const cleanQuery = query.trim().toLowerCase();
    if (!cleanQuery) return;

    // Check if we have selected an item from keyboard arrow suggestions
    if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
      triggerRedirect(suggestions[selectedIndex]);
      return;
    }

    // Try exact matches first
    const exactMatch = activeLinks.find((link) => link.name === cleanQuery);
    if (exactMatch) {
      triggerRedirect(exactMatch);
    } else {
      // Try fuzzy or partial matches
      const partialMatch = activeLinks.find((link) => link.name.startsWith(cleanQuery));
      if (partialMatch) {
        triggerRedirect(partialMatch);
      } else {
        setErrorMessage(
          `No active mapping found for '${cleanQuery}'. Submit a new registry using the '+' button above.`
        );
      }
    }
  };

  const triggerRedirect = (entry: LinkEntry) => {
    onRedirecting(entry);
    setQuery("");
    setSuggestions([]);
    setIsFocused(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === "Escape") {
      setIsFocused(false);
    }
  };

  return (
    <div ref={containerRef} className="w-full max-w-2xl mx-auto mt-12 relative z-40 px-4">
      <form onSubmit={handleSearchSubmit} className="relative">
        <div
          className={`w-full flex items-center gap-2 p-2 rounded-2xl bg-white border border-gray-100 transition-all duration-300 ${
            isFocused
              ? "shadow-2xl shadow-gray-200/80 scale-[1.01] border-neutral-300"
              : "shadow-2xl shadow-gray-200/50"
          }`}
        >
          <div className="pl-4 text-gray-400">
            <Search className="w-5 h-5" />
          </div>

          <input
            id="dns-search-input"
            type="text"
            className="flex-1 py-4 text-lg outline-none bg-transparent placeholder:text-gray-300 font-sans font-light text-[#1D1D1F] focus:outline-none"
            placeholder="Search custom namespace (e.g. myshop)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            aria-label="DNS Namespace Search"
          />

          <button
            type="submit"
            id="search-go-button"
            className="bg-black text-white px-8 py-4 rounded-xl font-medium hover:bg-neutral-800 transition-all active:scale-[0.98] cursor-pointer text-sm tracking-wide"
          >
            Redirect
          </button>
        </div>
      </form>

      {/* Autocomplete Suggestions Panel */}
      <AnimatePresence>
        {isFocused && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute left-4 right-4 mt-2 overflow-hidden rounded-2xl glass-panel border border-neutral-200 shadow-xl"
          >
            <div className="py-2.5">
              <div className="px-4 py-1.5 text-xs font-semibold text-neutral-400 tracking-wider uppercase font-sans">
                Suggested Targets
              </div>
              {suggestions.map((entry, index) => (
                <div
                  key={entry.id}
                  onClick={() => triggerRedirect(entry)}
                  className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-colors duration-150 ${
                    index === selectedIndex
                      ? "bg-neutral-100"
                      : "hover:bg-neutral-50"
                  }`}
                >
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-semibold text-neutral-900 px-1.5 py-0.5 bg-neutral-100 rounded-md border border-neutral-200/80">
                        {entry.name}
                      </span>
                      <span className="text-xs text-neutral-400 font-mono">
                        → {entry.ip}
                      </span>
                    </div>
                    {entry.description && (
                      <span className="text-xs text-neutral-400 font-sans font-light mt-1 truncate max-w-md">
                        {entry.description}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 text-neutral-400">
                    <span className="text-xs font-light font-mono hidden sm:inline">Navigate</span>
                    <CornerDownLeft className="w-3.5 h-3.5 opacity-65" />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick search statistics or prompt guidance */}
      <AnimatePresence>
        {!errorMessage && !isFocused && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            className="text-center text-xs font-sans font-light text-neutral-500 mt-4 tracking-wide"
          >
            Type any reserved namespace and press Enter to instantly route. 
            Try <code className="px-1.5 py-0.5 bg-neutral-100 border border-neutral-200 rounded font-mono text-[10px] text-neutral-700 italic">myshop</code>
          </motion.p>
        )}
      </AnimatePresence>

      {/* Real-time Dynamic Error alerts */}
      <AnimatePresence>
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="mt-4 p-4 rounded-xl border border-rose-100 bg-rose-50/60 text-rose-700 text-sm font-light leading-relaxed flex items-center justify-between shadow-sm"
          >
            <span>{errorMessage}</span>
            <button
              id="clear-error-button"
              type="button"
              onClick={() => setErrorMessage("")}
              className="text-xs bg-rose-100 hover:bg-rose-200 text-rose-800 px-2.5 py-1 rounded-lg transition-colors"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
