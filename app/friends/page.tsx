"use client";

import { useEffect, useState } from "react";
import FriendsSidebar from "../components/friends/FriendsSidebar";
import ChatWindow from "../components/chat/ChatWindow";
import FriendRequests from "../components/friends/FriendRequests";
import AddFriend from "../components/friends/AddFriend";
import { Friend } from "../../types/friends";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import Link from "next/link";
import { api, setAccessToken } from "@/lib/api";
import { useAuth } from "@/context/AuthProvider";
import { useRouter } from "next/navigation";

type Tab = "chat" | "requests" | "add";

export default function FriendsPage() {
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [tab, setTab] = useState<Tab>("chat");
  const [open, setOpen] = useState(false);
  const { setAuthed } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    const handler = () => {
      if (media.matches) setOpen(false);
    };
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, []);

  async function logout() {
    try {
      await api.post("/auth/logout");
    } catch {}
    localStorage.removeItem("wsToken");
    setAccessToken(null);
    setAuthed(false);
    router.push("/auth/login");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0a0a] text-[#e8e0d0]">
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateX(-6px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-in { animation: fadeIn 0.3s ease both; }
        .slide-up { animation: slideUp 0.3s ease both; }
        .thin-scroll::-webkit-scrollbar { width: 3px; }
        .thin-scroll::-webkit-scrollbar-track { background: transparent; }
        .thin-scroll::-webkit-scrollbar-thumb { background: #1e1e1e; border-radius: 2px; }
        .thin-scroll::-webkit-scrollbar-thumb:hover { background: #2a2a2a; }
      `}</style>

      {/* ── COLUMN 1: Icon rail ── */}
      <nav className="hidden md:flex flex-col items-center w-16 py-4 bg-[#060606] border-r border-[#0f0f0f] shrink-0">
        {/* Logo */}
        <Link
          href="/"
          className="w-10 h-10 flex items-center justify-center mb-2 hover:opacity-70 transition-opacity"
          title="Home"
        >
          <span
            className="text-2xl select-none text-[#c8a96e]"
            style={{ filter: "drop-shadow(0 0 8px rgba(200,169,110,0.3))" }}
          >
            ♔
          </span>
        </Link>

        <div className="w-5 h-px bg-[#161616] mb-2" />

        {/* Main Nav */}
        <div className="flex flex-col items-center gap-3">
          {[
            {
              href: "/play",
              title: "Play",
              icon: (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="w-5 h-5"
                >
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              ),
            },
            {
              href: "/friends",
              title: "Friends",
              active: true,
              icon: (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="w-5 h-5"
                >
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              ),
            },
            {
              href: "/replay",
              title: "Replay",
              icon: (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="w-5 h-5"
                >
                  <polyline points="1 4 1 10 7 10" />
                  <path d="M3.51 15a9 9 0 1 0 .49-5.49" />
                </svg>
              ),
            },
            {
              href: "/profile",
              title: "Profile",
              icon: (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="w-5 h-5"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              ),
            },
          ].map((item) => (
            <a
              key={item.title}
              href={item.href}
              title={item.title}
              className={`relative w-10 h-10 flex items-center justify-center transition-all duration-150 ${
                item.active ? "text-[#c8a96e]" : "text-[#6a6a6a] hover:text-[#d0c8b8]"
              }`}
            >
              {item.active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[#c8a96e]" />
              )}
              {item.icon}
            </a>
          ))}
        </div>

        <div className="flex-1 text-[#6c6868]" />

        <div className="w-5 h-px bg-[#161616] mb-3" />

        {/* Logout Button */}
        <button
          onClick={logout}
          title="Logout"
          className="relative w-10 h-10 flex items-center justify-center text-[#883f3f] hover:text-[#df2c2c] transition-all duration-150"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            className="w-5 h-5"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </nav>

      {/* ── COLUMN 2: Friends panel ── */}
      <aside className="hidden md:flex flex-col w-80 bg-[#080808] border-r border-[#0f0f0f] shrink-0">
        {/* Header */}
        <div className="px-4 pt-5 pb-0 shrink-0">
          <p className="text-[#c8a96e] text-xs tracking-[0.22em] uppercase font-light mb-4">
            Friends
          </p>

          {/* Tab strip */}
          <div className="flex border-b border-[#111]">
            {[
              { key: "chat" as Tab, label: "All" },
              { key: "requests" as Tab, label: "Requests" },
              { key: "add" as Tab, label: "Add" },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => {
                  setTab(t.key);
                  if (t.key !== "chat") setSelectedFriend(null);
                }}
                className={`flex-1 pb-2 text-xs tracking-widest uppercase font-light border-b-2 transition-all duration-150 -mb-px ${
                  tab === t.key
                    ? "text-[#c8a96e] border-[#c8a96e]"
                    : "text-[#8a8888] border-transparent hover:text-[#c3c0c0]"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Panel content */}
        <div className="flex-1 overflow-y-auto thin-scroll">
          {tab === "chat" && (
            <FriendsSidebar
              onSelect={(friend) => {
                setSelectedFriend(friend);
              }}
            />
          )}
          {tab === "requests" && (
            <div className="p-4">
              <FriendRequests />
            </div>
          )}
          {tab === "add" && (
            <div className="p-4">
              <AddFriend />
            </div>
          )}
        </div>
      </aside>

      {/* ── COLUMN 3: Chat area ── */}
      <Sheet open={open} onOpenChange={setOpen}>
        {/* Mobile sheet */}
        <SheetContent
          side="left"
          className="p-0 w-72 bg-[#080808] border-r border-[#0f0f0f]"
        >
          <SheetTitle className="sr-only">Friends</SheetTitle>
          <div className="px-4 pt-5 pb-3 border-b border-[#111]">
            <p className="text-[#c8a96e] text-xs tracking-[0.2em] uppercase font-light">
              Friends
            </p>
          </div>
          <FriendsSidebar
            onSelect={(friend) => {
              setSelectedFriend(friend);
              setOpen(false);
            }}
          />
        </SheetContent>

        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Topbar */}
          <header className="flex items-center gap-3 px-5 h-12 border-b border-[#0f0f0f] shrink-0 bg-[#0a0a0a]">
            {/* Mobile trigger */}
            <SheetTrigger asChild>
              <button className="md:hidden flex flex-col gap-1 w-5 justify-center shrink-0">
                <span className="block h-px w-full bg-[#878383]" />
                <span className="block h-px w-3/4 bg-[#878383]" />
                <span className="block h-px w-full bg-[#878383]" />
              </button>
            </SheetTrigger>

            {selectedFriend ? (
              <>
                {/* Avatar */}
                <div className="w-6 h-6 border border-[#1e1e1e] bg-[#0e0e0e] flex items-center justify-center shrink-0">
                  <span className="text-[10px] text-[#545151] font-light">
                    {selectedFriend.name?.[0]?.toUpperCase() ?? "?"}
                  </span>
                </div>

                <h2
                  className="text-sm font-light text-[#e8e0d0] truncate"
                  style={{ fontFamily: "Georgia, serif" }}
                >
                  {selectedFriend.name}
                </h2>

                {/* Divider */}
                <span className="text-[#878383] text-xs">|</span>

                {/* Status */}
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{
                      background:
                        selectedFriend.status === "online"
                          ? "#4a8a4a"
                          : selectedFriend.status === "playing"
                            ? "#c8a96e"
                            : "#2a2a2a",
                    }}
                  />
                  <span className="text-[#878383] text-xs font-light capitalize">
                    {selectedFriend.status === "playing"
                      ? "In a game"
                      : (selectedFriend.status ?? "Offline")}
                  </span>
                </div>

                {/* Rating badge */}
                {selectedFriend.rating && (
                  <div className="ml-auto flex items-center gap-1.5 border border-[#1a1a1a] px-2 py-0.5">
                    <span className="text-[#878383] text-[10px] tracking-widest">
                      ELO
                    </span>
                    <span
                      className="text-[#c8a96e] text-xs font-light"
                      style={{ fontFamily: "Georgia, serif" }}
                    >
                      {selectedFriend.rating}
                    </span>
                  </div>
                )}
              </>
            ) : (
              <span className="text-[#222] text-xs tracking-[0.15em] uppercase font-light">
                {tab === "requests"
                  ? "Requests"
                  : tab === "add"
                    ? "Add friend"
                    : "Select a conversation"}
              </span>
            )}
          </header>

          {/* Chat / empty state */}
          <main className="flex-1 min-h-0 overflow-hidden">
            {selectedFriend && tab === "chat" ? (
              <div className="h-full fade-in">
                <ChatWindow selectedFriend={selectedFriend} />
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center gap-5 slide-up">
                <div className="w-16 h-16 border border-[#6e6d6d] bg-[#080808] flex items-center justify-center">
                  <span
                    className="select-none text-3xl"
                    style={{ color: "#878383", opacity: 0.4 }}
                  >
                    ♛
                  </span>
                </div>
                <div className="text-center">
                  <div className="flex items-center gap-3 justify-center mb-1.5">
                    <span className="block w-5 h-px bg-[#878383]" />
                    <span className="text-[#878383] text-xs tracking-[0.2em] uppercase">
                      {tab === "chat"
                        ? "No conversation open"
                        : tab === "requests"
                          ? "Manage requests in the panel"
                          : "Search for a player"}
                    </span>
                    <span className="block w-5 h-px bg-[#878383]" />
                  </div>
                  <p className="text-[#777575] text-xs font-light">
                    {tab === "chat"
                      ? "Select a friend from the left"
                      : "Use the panel on the left"}
                  </p>
                </div>
              </div>
            )}
          </main>
        </div>
      </Sheet>
    </div>
  );
}
