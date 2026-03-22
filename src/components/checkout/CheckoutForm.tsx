"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface CheckoutFormProps {
  courseId: string;
  courseSlug: string;
}

export function CheckoutForm({ courseId, courseSlug }: CheckoutFormProps) {
  const router = useRouter();
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!cardNumber || !expiry || !cvc) {
      setError("Please fill in all fields");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Enrollment failed");
        setLoading(false);
        return;
      }
      router.push(`/learn/${courseSlug}?enrolled=1`);
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold">Payment (Mock)</h2>
        <p className="text-sm text-muted-foreground">
          This is a demo. No real payment will be processed.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="cardNumber">Card number</Label>
            <Input
              id="cardNumber"
              placeholder="4242 4242 4242 4242"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expiry">Expiry (MM/YY)</Label>
              <Input
                id="expiry"
                placeholder="12/25"
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cvc">CVC</Label>
              <Input
                id="cvc"
                placeholder="123"
                value={cvc}
                onChange={(e) => setCvc(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Processing..." : "Complete purchase"}
            </Button>
            <Button type="button" variant="outline" asChild disabled={loading}>
              <Link href="/browse">Cancel</Link>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
