"use client";

import { useState, useEffect } from "react";
import { ReactNode } from "react";
import Sidebar from "./Sidebar";
import PlayerBar from "./PlayerBar";
import { PlayerProvider, usePlayer } from "@/lib/player-context";

function MainContent({ children }: { children: ReactNode }) {
  const { currentTrack, status } = usePlayer();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-full min-h-screen">
      <Sidebar />

      <main
        id="main-content"
        className={`
          flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-out
          ${sidebarCollapsed ? "ml-[72px]" : "ml-[256px]"}
        `}
        role="main"
      >
        <header className="sticky top-0 z-20 bg-black/80 backdrop-blur-xl border-b border-border px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <h1 className="text-2xl font-bold tracking-tight">Harmonix</h1>
            <div className="flex items-center gap-3">
              <button
                className="p-2 rounded-full hover:bg-hover text-subtext transition-colors"
                aria-label="Notifications"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </button>
              <button
                className="p-2 rounded-full hover:bg-hover text-subtext transition-colors"
                aria-label="Profile"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-emerald-700 flex items-center justify-center font-bold text-black">
                  H
                </div>
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 pb-[130px]">
          <div className="max-w-7xl mx-auto">{children}</div>
        </div>
      </main>

      <PlayerBar />
    </div>
  );
}

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <PlayerProvider>
      <MainContent>{children}</MainContent>
    </PlayerProvider>
  );
}