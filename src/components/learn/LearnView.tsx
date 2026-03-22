"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { VideoPlayer } from "@/components/course/VideoPlayer";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ChevronRight, Check, Lock } from "lucide-react";
import { markVideoComplete } from "@/app/(main)/learn/[slug]/actions";
import { LessonResources } from "@/components/lms/LessonResources";
import { LessonNotes } from "@/components/lms/LessonNotes";
import { LessonQuiz } from "@/components/lms/LessonQuiz";
import { LessonAssignment } from "@/components/lms/LessonAssignment";
import { useRef, useState } from "react";

interface Resource {
  id: string;
  title: string;
  url: string;
  type: string;
}

interface QuizQuestion {
  id: string;
  question: string;
  type: string;
  options: string[];
  correct: number;
}

interface Quiz {
  id: string;
  title: string;
  passScore: number;
  maxAttempts: number | null;
  questions: QuizQuestion[];
}

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

interface Video {
  id: string;
  title: string;
  youtubeUrl: string;
  orderIndex: number;
  durationSeconds?: number | null;
  resources?: Resource[];
  quiz?: Quiz | null;
  assignment?: Assignment | null;
}

interface Section {
  id: string;
  title: string;
  orderIndex: number;
  videos: Video[];
}

interface Course {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  sections: Section[];
}

interface LearnViewProps {
  course: Course;
  currentLesson: Video;
  completedLessonIds: string[];
  lockedLessonReasons: Record<string, string>;
  currentLessonLocked: boolean;
  currentUnlockReason?: string;
  lastPositionSeconds: number;
  progressPct: number;
  enrollmentId: string;
  userNote?: string;
  quizAttempts?: { score: number; passed: boolean }[];
  quiz?: Quiz | null;
  assignment?: Assignment | null;
}

export function LearnView({
  course,
  currentLesson,
  completedLessonIds,
  lockedLessonReasons,
  currentLessonLocked,
  currentUnlockReason = "Complete the previous lesson to unlock this lesson.",
  lastPositionSeconds,
  progressPct,
  enrollmentId,
  userNote = "",
  quizAttempts = [],
  quiz = null,
  assignment = null,
}: LearnViewProps) {
  const router = useRouter();
  const isCompleted = Boolean(
    currentLesson && completedLessonIds.includes(currentLesson.id)
  );
  const [error, setError] = useState<string | null>(null);

  const latestPlayedSecondsRef = useRef<number>(lastPositionSeconds);
  const lastUploadAtRef = useRef<number>(0);
  const uploadInFlightRef = useRef<boolean>(false);

  const allVideos = course.sections.flatMap((s) => s.videos);
  const currentIndex = allVideos.findIndex(
    (l) => l.id === (currentLesson && currentLesson.id)
  );
  const nextLesson: Video | null =
    currentIndex >= 0 && currentIndex < allVideos.length - 1
      ? allVideos[currentIndex + 1]
      : null;

  const updateProgress = async (playedSeconds: number) => {
    // Keep client lightweight: upload at most once every few seconds.
    const now = Date.now();
    if (now - lastUploadAtRef.current < 5000) return;
    if (uploadInFlightRef.current) return;
    if (currentLessonLocked && !isCompleted) return;

    uploadInFlightRef.current = true;
    lastUploadAtRef.current = now;
    try {
      await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enrollmentId,
          lessonId: currentLesson.id,
          last_position_seconds: Math.floor(
            Math.max(0, playedSeconds)
          ),
        }),
      });
    } catch {
      // Non-fatal; resume will still work next time.
    } finally {
      uploadInFlightRef.current = false;
    }
  };

  const handlePlayerProgress = (playedSeconds: number) => {
    latestPlayedSecondsRef.current = playedSeconds;
    updateProgress(playedSeconds);
  };

  const handleMarkComplete = async () => {
    setError(null);
    if (!currentLesson || isCompleted || currentLessonLocked) return;

    try {
      await markVideoComplete(
        enrollmentId,
        currentLesson.id,
        latestPlayedSecondsRef.current
      );
      // Auto-advance after completion.
      if (nextLesson) {
        router.push(`/learn/${course.slug}?lesson=${nextLesson.id}`);
      } else {
        router.push(`/course/${course.slug}`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to mark complete");
    }
  };

  const handleVideoEnded = async () => {
    if (!isCompleted && !currentLessonLocked) {
      await handleMarkComplete();
    }
  };

  const lessonTitle = currentLesson ? currentLesson.title : "";
  const lessonVideoUrl = currentLesson ? currentLesson.youtubeUrl : "";

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-3.5rem)]">
      <div className="flex-1 p-4 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <Progress value={progressPct} className="mb-6 h-2" />
          <h1 className="text-2xl font-bold mb-4">{course.title}</h1>
          <h2 className="text-lg font-medium mb-4">{lessonTitle}</h2>

          <div className="mb-6">
            {!currentLessonLocked ? (
              <VideoPlayer
                url={lessonVideoUrl}
                startSeconds={Math.max(0, lastPositionSeconds - 5)}
                onProgress={handlePlayerProgress}
                onEnded={handleVideoEnded}
              />
            ) : (
              <div className="p-6 rounded-lg border bg-muted/30 flex items-start gap-3">
                <Lock className="h-5 w-5 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="font-medium mb-1">Locked</p>
                  <p className="text-sm text-muted-foreground">
                    {currentUnlockReason}
                  </p>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md mb-4">
              {error}
            </div>
          )}

          <div className="flex gap-4 items-center">
            {isCompleted ? (
              <span className="flex items-center gap-2 text-green-600 font-medium">
                <Check className="h-5 w-5" />
                Completed
              </span>
            ) : (
              <Button onClick={handleMarkComplete} disabled={currentLessonLocked}>
                Mark as complete
              </Button>
            )}
            {isCompleted && nextLesson ? (
              <Button variant="outline" asChild>
                <Link href={`/learn/${course.slug}?lesson=${nextLesson.id}`}>
                  Next lesson
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            ) : isCompleted ? (
              <Button asChild>
                <Link href={`/course/${course.slug}`}>Back to course</Link>
              </Button>
            ) : null}
          </div>

          {course.description && (
            <div className="mt-8 p-4 rounded-lg bg-muted/50">
              <h3 className="font-semibold mb-2">About this lesson</h3>
              <p className="text-muted-foreground text-sm whitespace-pre-wrap">
                {course.description}
              </p>
            </div>
          )}

          {!currentLessonLocked && (
            <>
              {currentLesson?.resources && currentLesson.resources.length > 0 && (
                <LessonResources resources={currentLesson.resources} />
              )}

              <LessonNotes
                lessonId={currentLesson?.id ?? ""}
                initialContent={userNote}
              />

              {quiz && (
                <LessonQuiz
                  quiz={quiz}
                  enrollmentId={enrollmentId}
                  attempts={quizAttempts}
                />
              )}

              {assignment && (
                <LessonAssignment
                  assignment={assignment}
                  onSubmitted={() => router.refresh()}
                />
              )}
            </>
          )}
        </div>
      </div>

      <aside className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l bg-muted/20 p-4">
        <h3 className="font-semibold mb-4">Course content</h3>
        <div className="space-y-4">
          {course.sections.map((section) => (
            <div key={section.id}>
              <p className="font-medium text-sm mb-2">{section.title}</p>
              <ul className="space-y-1">
                {section.videos.map((video) => {
                  const done = completedLessonIds.includes(video.id);
                  const active = currentLesson && currentLesson.id === video.id;
                  const locked = !done && Boolean(lockedLessonReasons[video.id]);
                  return (
                    <li key={video.id}>
                      {locked ? (
                        <span
                          className={`flex items-center gap-2 py-1.5 px-2 rounded text-sm ${
                            active
                              ? "bg-primary/10 text-primary font-medium"
                              : "text-muted-foreground"
                          }`}
                          aria-disabled="true"
                        >
                          <Lock className="h-4 w-4 shrink-0" />
                          <span className="truncate">{video.title}</span>
                          {video.durationSeconds ? (
                            <span className="text-muted-foreground text-xs ml-auto">
                              {Math.round(video.durationSeconds / 60)} min
                            </span>
                          ) : null}
                        </span>
                      ) : (
                        <Link
                          href={`/learn/${course.slug}?lesson=${video.id}`}
                          className={`flex items-center gap-2 py-1.5 px-2 rounded text-sm hover:bg-muted/50 ${
                            active ? "bg-primary/10 text-primary font-medium" : ""
                          }`}
                        >
                          {done ? (
                            <Check className="h-4 w-4 text-green-600 shrink-0" />
                          ) : (
                            <span className="w-4 h-4 rounded-full border shrink-0" />
                          )}
                          <span className="truncate">{video.title}</span>
                          {video.durationSeconds ? (
                            <span className="text-muted-foreground text-xs ml-auto">
                              {Math.round(video.durationSeconds / 60)} min
                            </span>
                          ) : null}
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}
