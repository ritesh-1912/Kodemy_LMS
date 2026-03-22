"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { API_BASE_URL } from "@/lib/config";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, LogOut, BookOpen, Menu, X } from "lucide-react";
import { useState } from "react";

export function Navbar() {
  const router = useRouter();
  const { isAuthenticated, user, logout, hydrated } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } finally {
      logout();
      router.push("/");
      router.refresh();
    }
  };

  const initial =
    user?.name?.[0]?.toUpperCase() ||
    user?.email?.[0]?.toUpperCase() ||
    "K";

  return (
    <header className="sticky top-0 z-50 w-full glass">
      <div className="container flex h-14 items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="font-heading text-xl font-bold tracking-tight text-primary"
          >
            Kodemy
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
            >
              <Link href="/">Subjects</Link>
            </Button>
          </nav>
        </div>

        <button
          type="button"
          className="md:hidden text-foreground"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>

        <div className="hidden md:flex items-center gap-2">
          {!hydrated ? (
            <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
          ) : isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="relative h-9 w-9 rounded-full border border-border bg-surface hover:bg-surface-hover transition-colors outline-none">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-primary/20 text-primary text-sm font-semibold">
                    {initial}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-52 bg-surface border-border"
              >
                {user?.name && (
                  <div className="px-3 py-2 border-b border-border">
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                )}
                <DropdownMenuItem onClick={() => router.push("/profile")}>
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/")}>
                  <BookOpen className="h-4 w-4 mr-2" />
                  Subjects
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
              >
                <Link href="/auth/login">Sign in</Link>
              </Button>
              <Button
                asChild
                size="sm"
                className="bg-primary hover:bg-primary/90"
              >
                <Link href="/auth/register">Sign up</Link>
              </Button>
            </>
          )}
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-surface p-4 space-y-2 animate-fade-in">
          <Link
            href="/"
            className="block py-2 px-3 rounded-md hover:bg-surface-hover text-sm"
            onClick={() => setMobileOpen(false)}
          >
            Subjects
          </Link>
          {hydrated && isAuthenticated ? (
            <>
              <Link
                href="/profile"
                className="block py-2 px-3 rounded-md hover:bg-surface-hover text-sm"
                onClick={() => setMobileOpen(false)}
              >
                Profile
              </Link>
              <button
                onClick={() => {
                  setMobileOpen(false);
                  handleLogout();
                }}
                className="block w-full text-left py-2 px-3 rounded-md hover:bg-surface-hover text-sm text-destructive"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="block py-2 px-3 rounded-md hover:bg-surface-hover text-sm"
                onClick={() => setMobileOpen(false)}
              >
                Sign in
              </Link>
              <Link
                href="/auth/register"
                className="block py-2 px-3 rounded-md bg-primary text-primary-foreground text-sm text-center"
                onClick={() => setMobileOpen(false)}
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
