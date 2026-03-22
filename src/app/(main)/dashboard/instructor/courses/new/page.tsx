"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";

const CATEGORIES = [
  "Web Development",
  "Backend Development",
  "Mobile Development",
  "Data Science",
  "Design",
  "Business",
];

interface VideoInput {
  title: string;
  youtubeUrl: string;
  durationSeconds: string;
}

interface SectionInput {
  title: string;
  videos: VideoInput[];
}

export default function NewCoursePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("0");
  const [sections, setSections] = useState<SectionInput[]>([
    { title: "", videos: [{ title: "", youtubeUrl: "", durationSeconds: "" }] },
  ]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const addSection = () => {
    setSections([...sections, { title: "", videos: [{ title: "", youtubeUrl: "", durationSeconds: "" }] }]);
  };

  const removeSection = (i: number) => {
    setSections(sections.filter((_, idx) => idx !== i));
  };

  const addVideo = (sectionIdx: number) => {
    const next = [...sections];
    next[sectionIdx].videos.push({ title: "", youtubeUrl: "", durationSeconds: "" });
    setSections(next);
  };

  const removeVideo = (sectionIdx: number, videoIdx: number) => {
    const next = [...sections];
    next[sectionIdx].videos = next[sectionIdx].videos.filter((_, i) => i !== videoIdx);
    setSections(next);
  };

  const updateSection = (i: number, field: "title", value: string) => {
    const next = [...sections];
    next[i] = { ...next[i], [field]: value };
    setSections(next);
  };

  const updateVideo = (
    sectionIdx: number,
    videoIdx: number,
    field: keyof VideoInput,
    value: string
  ) => {
    const next = [...sections];
    next[sectionIdx].videos[videoIdx] = {
      ...next[sectionIdx].videos[videoIdx],
      [field]: value,
    };
    setSections(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Course title is required");
      return;
    }
    if (!category) {
      setError("Category is required");
      return;
    }

    const hasValidSection = sections.some(
      (s) => s.title.trim() && s.videos.some((v) => v.title.trim() && v.youtubeUrl.trim())
    );
    if (!hasValidSection) {
      setError("Add at least one section with a video (title and video URL required)");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          thumbnail: thumbnail.trim() || null,
          category,
          price: parseFloat(price) || 0,
          sections: sections
            .filter((s) => s.title.trim())
            .map((s, sectionOrderIndex) => ({
              title: s.title.trim(),
              orderIndex: sectionOrderIndex,
              videos: s.videos
                .filter((v) => v.title.trim() && v.youtubeUrl.trim())
                .map((v, videoOrderIndex) => ({
                  title: v.title.trim(),
                  youtubeUrl: v.youtubeUrl.trim(),
                  durationSeconds: parseInt(v.durationSeconds) || null,
                  orderIndex: videoOrderIndex,
                })),
            }))
            .filter((s) => s.videos.length > 0),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create course");
        setLoading(false);
        return;
      }
      router.push(`/dashboard/instructor/courses`);
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-3xl py-8">
      <h1 className="text-2xl font-bold mb-6">Create a new course</h1>
      <form onSubmit={handleSubmit} className="space-y-8">
        {error && (
          <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
            {error}
          </div>
        )}

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Basic information</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Course title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. React - The Complete Guide"
                disabled={loading}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What will students learn?"
                rows={4}
                disabled={loading}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={(v) => setCategory(v ?? "")} required disabled={loading}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price ($)</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="thumbnail">Thumbnail URL</Label>
              <Input
                id="thumbnail"
                value={thumbnail}
                onChange={(e) => setThumbnail(e.target.value)}
                placeholder="https://..."
                disabled={loading}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <h2 className="text-lg font-semibold">Curriculum</h2>
            <Button type="button" variant="outline" size="sm" onClick={addSection} disabled={loading}>
              <Plus className="h-4 w-4 mr-1" />
              Add section
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {sections.map((section, si) => (
              <div
                key={si}
                className="border rounded-lg p-4 space-y-4 bg-muted/30"
              >
                <div className="flex gap-2">
                  <Input
                    placeholder="Section title"
                    value={section.title}
                    onChange={(e) => updateSection(si, "title", e.target.value)}
                    disabled={loading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeSection(si)}
                    disabled={loading || sections.length <= 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2 pl-4">
                  {section.videos.map((video, vi) => (
                    <div key={vi} className="flex gap-2 items-start">
                      <div className="flex-1 grid gap-2">
                        <Input
                          placeholder="Video title"
                          value={video.title}
                          onChange={(e) => updateVideo(si, vi, "title", e.target.value)}
                          disabled={loading}
                        />
                        <Input
                          placeholder="Video URL (YouTube, Vimeo, or direct MP4)"
                          value={video.youtubeUrl}
                          onChange={(e) => updateVideo(si, vi, "youtubeUrl", e.target.value)}
                          disabled={loading}
                        />
                        <Input
                          placeholder="Duration (seconds)"
                          type="number"
                          min="0"
                          value={video.durationSeconds}
                          onChange={(e) => updateVideo(si, vi, "durationSeconds", e.target.value)}
                          disabled={loading}
                          className="w-32"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeVideo(si, vi)}
                        disabled={loading || section.videos.length <= 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addVideo(si)}
                    disabled={loading}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add video
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create course"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
