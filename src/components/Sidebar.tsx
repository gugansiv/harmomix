"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePlayer } from "@/lib/player-context";
import { usePlaylists, useLiked, useRecent } from "@/lib/playlists";

const navItems = [
  { href: "/", label: "Home", icon: HomeIcon },
  { href: "/search", label: "Search", icon: SearchIcon },
  { href: "/library", label: "Your Library", icon: LibraryIcon },
] as const;

const playlistItems = [
  { id: "liked", label: "Liked Songs", icon: HeartIcon, count: 0 },
  { id: "recent", label: "Recently Played", icon: ClockIcon, count: 0 },
] as const;

function HomeIcon({ active, className }: { active: boolean; className?: string }) {
  return <svg className={className} fill={active ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
}
function SearchIcon({ active, className }: { active: boolean; className?: string }) {
  return <svg className={className} fill={active ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
}
function LibraryIcon({ active, className }: { active: boolean; className?: string }) {
  return <svg className={className} fill={active ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v12a2 2 0 01-2 2h-2a2 2 0 01-2-2V6z" /></svg>;
}
function HeartIcon({ active, className }: { active: boolean; className?: string }) {
  return <svg className={className} fill={active ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>;
}
function ClockIcon({ active, className }: { active: boolean; className?: string }) {
  return <svg className={className} fill={active ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
}
function PlusIcon({ active }: { active: boolean }) {
  return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>;
}
function ChevronLeftIcon() {
  return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>;
}
function ChevronRightIcon() {
  return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>;
}
function LogoIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.521 17.34c-.18.36-.54.54-.835.406-3.225-1.537-5.708-3.89-7.287-6.836-.18-.333-.04-.75.31-.89.316-.156.704-.03.885.31 1.95 3.67 5.034 6.588 8.76 7.84.33.114.49.39.34.73z"/></svg>;
}

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { queue } = usePlayer();
  const { playlists } = usePlaylists();
  const { liked } = useLiked();
  const { recent } = useRecent();

  return (
    <aside
      className={`
        fixed left-0 top-0 z-40 h-full flex flex-col bg-sidebar
        transition-all duration-300 ease-out
        border-r border-border
        ${collapsed ? "w-[72px]" : "w-[256px]"}
      `}
      aria-label="Main navigation"
    >
      {/* Top: Logo + Main Nav */}
      <div className="flex flex-col flex-1 overflow-y-auto p-4 space-y-1">
        {/* Logo */}
        <Link
          href="/"
          className={`
            flex items-center gap-3 px-3 py-2.5 rounded-xl
            transition-colors duration-150
            ${pathname === "/" ? "bg-hover text-accent" : "text-subtext hover:bg-hover hover:text-foreground"}
            group
          `}
          aria-label="Harmonix Home"
        >
          <LogoIcon className="flex-shrink-0" aria-hidden="true" />
          {!collapsed && <span className="font-bold text-lg tracking-tight">Harmonix</span>}
        </Link>

        {/* Main Nav */}
        <nav aria-label="Main navigation">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl
                  transition-all duration-150
                  ${isActive
                    ? "bg-hover text-accent"
                    : "text-subtext hover:bg-hover hover:text-foreground"}
                  group
                `}
                aria-current={isActive ? "page" : undefined}
              >
                <item.icon active={isActive} className="flex-shrink-0" aria-hidden="true" />
                {!collapsed && <span className="font-medium">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Divider */}
        {!collapsed && (
          <div className="my-3 border-t border-border" />
        )}

        {/* Your Library / Playlists */}
        {!collapsed && (
          <div className="space-y-1">
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-subtext">
                Your Library
              </span>
              <Link
                href="/library"
                className="p-1 rounded-lg text-subtext hover:text-foreground hover:bg-hover transition-colors"
                aria-label="Create playlist"
              >
                <PlusIcon active={false} />
              </Link>
            </div>

            {playlistItems.map((item) => {
              const count = item.id === "liked" ? liked.length : recent.length;
              return (
                <Link
                  key={item.id}
                  href={`/library/${item.id}`}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 ${pathname === `/library/${item.id}` ? "bg-hover text-accent" : "text-subtext hover:bg-hover hover:text-foreground"}`}
                  aria-current={pathname === `/library/${item.id}` ? "page" : undefined}
                >
                  <item.icon active={pathname === `/library/${item.id}`} aria-hidden="true" />
                  <span className="font-medium truncate">{item.label}</span>
                  {count > 0 && <span className="ml-auto text-xs text-subtext">{count}</span>}
                </Link>
              );
            })}

            {playlists.length > 0 && (
              <div className="mt-2 space-y-0.5 border-t border-border pt-2">
                {playlists.map((pl) => (
                  <Link
                    key={pl.id}
                    href={`/playlist/${pl.id}`}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-150 ${pathname === `/playlist/${pl.id}` ? "bg-hover text-accent" : "text-subtext hover:bg-hover hover:text-foreground"}`}
                    aria-current={pathname === `/playlist/${pl.id}` ? "page" : undefined}
                  >
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2zm12-3c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2z" />
                    </svg>
                    <span className="font-medium truncate">{pl.name}</span>
                    <span className="ml-auto text-xs text-subtext">{pl.tracks.length}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom: Collapse toggle + User profile */}
      <div className="p-4 border-t border-border">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`
            w-full flex items-center justify-center gap-3 px-3 py-2.5 rounded-xl
            text-subtext hover:bg-hover hover:text-foreground transition-colors
          `}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!collapsed}
        >
          {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          {!collapsed && <span className="font-medium">Collapse</span>}
        </button>
      </div>
    </aside>
  );
}