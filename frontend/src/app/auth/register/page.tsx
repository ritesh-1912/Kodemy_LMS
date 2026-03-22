"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuthStore } from "@/store/authStore";
import { API_BASE_URL } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Minimum 6 characters"),
});

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const onSubmit = async (data: FormData) => {
    setServerError("");
    try {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
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
        setServerError(body.error || "Registration failed");
        return;
      }
      if (!body.access_token) {
        setServerError("No access token returned");
        return;
      }
      setAuth(
        body.user ?? { id: "", name: data.name, email: data.email },
        body.access_token
      );
      router.push("/");
      router.refresh();
    } catch {
      setServerError("Network error. Try again.");
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex flex-1 items-center justify-center bg-surface border-r border-border p-12">
        <div className="max-w-md space-y-4">
          <Link
            href="/"
            className="font-heading text-3xl font-bold text-primary"
          >
            Kodemy
          </Link>
          <p className="text-muted-foreground text-lg leading-relaxed">
            &ldquo;First, solve the problem. Then, write the code.&rdquo;
          </p>
          <p className="text-sm text-muted-foreground">— John Johnson</p>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm space-y-8">
          <div className="lg:hidden mb-6">
            <Link
              href="/"
              className="font-heading text-2xl font-bold text-primary"
            >
              Kodemy
            </Link>
          </div>
          <div>
            <h1 className="font-heading text-2xl font-bold tracking-tight">
              Create your account
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Start learning with strict-order courses
            </p>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {serverError && (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {serverError}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Your name"
                autoComplete="name"
                className="bg-surface border-border focus:ring-primary"
                {...register("name")}
              />
              {errors.name && (
                <p className="text-xs text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>
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
                <p className="text-xs text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
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
              {isSubmitting ? "Creating account..." : "Create account"}
            </Button>
          </form>
          <p className="text-sm text-muted-foreground text-center">
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="text-primary font-medium hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
