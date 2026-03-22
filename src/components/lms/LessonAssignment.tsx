"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { FileText, Upload } from "lucide-react";

interface Assignment {
  id: string;
  title: string;
  instructions: string;
  submissions: {
    id: string;
    content: string | null;
    fileUrl: string | null;
    grade: number | null;
    feedback: string | null;
    submittedAt: Date;
  }[];
}

interface LessonAssignmentProps {
  assignment: Assignment;
  onSubmitted?: () => void;
}

export function LessonAssignment({ assignment, onSubmitted }: LessonAssignmentProps) {
  const [content, setContent] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(assignment.submissions.length > 0);

  const mySubmission = assignment.submissions[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!content.trim() && !fileUrl.trim()) {
      setError("Add text or a file link");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignmentId: assignment.id,
          content: content.trim() || undefined,
          fileUrl: fileUrl.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed");
        return;
      }
      setSubmitted(true);
      onSubmitted?.();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <h3 className="font-semibold flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Assignment: {assignment.title}
        </h3>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
          {assignment.instructions}
        </p>

        {(mySubmission || submitted) ? (
          <div className="rounded-lg border p-4 bg-muted/30">
            <p className="text-sm font-medium mb-2">Your submission</p>
            {mySubmission ? (
              <>
            {mySubmission.content && (
              <p className="text-sm text-muted-foreground mb-2">
                {mySubmission.content}
              </p>
            )}
            {mySubmission.fileUrl && (
              <a
                href={mySubmission.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline block mb-2"
              >
                View uploaded file
              </a>
            )}
            {mySubmission.grade != null && (
              <p className="text-sm font-medium">
                Grade: {mySubmission.grade}%
                {mySubmission.feedback && (
                  <span className="text-muted-foreground block mt-1">
                    {mySubmission.feedback}
                  </span>
                )}
              </p>
            )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Submitted successfully. Refreshing...</p>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <div className="space-y-2">
              <Label>Your response (text)</Label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Type your submission here..."
                rows={4}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label>Or paste a file URL (Google Drive, Dropbox, etc.)</Label>
              <Input
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
                placeholder="https://..."
                disabled={loading}
              />
            </div>
            <Button type="submit" disabled={loading}>
              <Upload className="h-4 w-4 mr-2" />
              Submit assignment
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
