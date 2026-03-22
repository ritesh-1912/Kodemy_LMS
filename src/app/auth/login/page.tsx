"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useState } from "react";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type FormData = z.infer<typeof schema>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const setAuth = useAuthStore((s) => s.setAuth);
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: FormData) => {
    setServerError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      const body = (await res.json().catch(() => ({}))) as {
        access_token?: string;
        user?: { id: string; name: string; email: string };
        error?: string;
      };
      if (!res.ok) {
        setServerError(body.error || "Invalid credentials");
        return;
      }
      if (!body.access_token) {
        setServerError("No access token returned");
        return;
      }
      setAuth(
        body.user ?? { id: "", name: "", email: data.email },
        body.access_token
      );
      router.push(callbackUrl);
      router.refresh();
    } catch {
      setServerError("Network error. Try again.");
    }
  };

  return (
    <div className="w-full max-w-sm space-y-8">
      <div className="lg:hidden mb-6">
        <Link href="/" className="font-heading text-2xl font-bold text-primary">
          Kodemy
        </Link>
      </div>

      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          Welcome back
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Sign in to continue learning
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {serverError && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {serverError}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            className="bg-surface border-border focus:ring-primary"
            {...register("email")}
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            className="bg-surface border-border focus:ring-primary"
            {...register("password")}
          />
          {errors.password && (
            <p className="text-xs text-destructive">
              {errors.password.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full bg-primary hover:bg-primary/90"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : null}
          {isSubmitting ? "Signing in..." : "Sign in"}
        </Button>
      </form>

      <p className="text-sm text-muted-foreground text-center">
        Don&apos;t have an account?{" "}
        <Link
          href="/auth/register"
          className="text-primary font-medium hover:underline"
        >
          Create one
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
