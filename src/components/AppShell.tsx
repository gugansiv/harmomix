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
    <div className="flex h-screen w-screen overflow-hidden bg-black text-foreground">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((c) => !c)}
      />

      {/* Main column: takes remaining width, never overflows */}
      <div className="flex min-w-0 flex-1 flex-col">
        <main
          id="main-content"
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
          role="main"
        >
          <header className="sticky top-0 z-20 border-b border-border bg-black/80 px-6 py-4 backdrop-blur-xl">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
              <h1 className="text-2xl font-bold tracking-tight">Harmonix</h1>
              <div className="flex items-center gap-3">
                <button
                  className="rounded-full p-2 text-subtext transition-colors hover:bg-hover"
                  aria-label="Notifications"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                  </svg>
                </button>
                <button
                  className="rounded-full p-2 text-subtext transition-colors hover:bg-hover"
                  aria-label="Profile"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-accent to-emerald-700 font-bold text-black">
                    H
                  </div>
                </button>
              </div>
            </div>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto p-6 pb-[120px]">
            <div className="mx-auto max-w-7xl">{children}</div>
          </div>
        </main>

        <PlayerBar />
      </div>
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
