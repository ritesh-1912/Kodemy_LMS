"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FileText } from "lucide-react";

interface LessonNotesProps {
  lessonId: string;
  initialContent: string;
}

export function LessonNotes({ lessonId, initialContent }: LessonNotesProps) {
  const [content, setContent] = useState(initialContent);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setContent(initialContent);
  }, [lessonId, initialContent]);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId, content }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setSaved(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-6 p-4 rounded-lg border bg-muted/30">
      <h3 className="font-semibold mb-3 flex items-center gap-2">
        <FileText className="h-4 w-4" />
        My Notes
      </h3>
      <Textarea
        placeholder="Take notes for this lesson..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={4}
        className="mb-2"
      />
      <Button size="sm" onClick={handleSave} disabled={saving}>
        {saving ? "Saving..." : saved ? "Saved!" : "Save notes"}
      </Button>
    </div>
  );
}
