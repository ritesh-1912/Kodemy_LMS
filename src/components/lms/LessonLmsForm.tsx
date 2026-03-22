"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { FileText, HelpCircle, BookOpen } from "lucide-react";
import Link from "next/link";

interface LessonResource {
  id: string;
  title: string;
  url: string;
  type: string;
}

interface QuizQuestion {
  id: string;
  question: string;
  options: string;
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
}

interface Lesson {
  id: string;
  title: string;
  resources: LessonResource[];
  quiz: Quiz | null;
  assignment: Assignment | null;
}

interface LessonLmsFormProps {
  lesson: Lesson;
  courseSlug: string;
}

export function LessonLmsForm({ lesson, courseSlug }: LessonLmsFormProps) {
  const hasContent =
    lesson.resources.length > 0 || lesson.quiz || lesson.assignment;

  return (
    <Card className="border rounded-lg overflow-hidden">
      <CardHeader className="pb-2">
        <h3 className="font-semibold text-base">{lesson.title}</h3>
        <p className="text-sm text-muted-foreground">
          {hasContent
            ? "LMS content for this lesson"
            : "No resources, quiz, or assignment yet"}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {lesson.resources.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Resources
            </h4>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              {lesson.resources.map((r) => (
                <li key={r.id}>
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {r.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {lesson.quiz && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <HelpCircle className="h-4 w-4" />
              Quiz: {lesson.quiz.title}
            </h4>
            <p className="text-sm text-muted-foreground">
              {lesson.quiz.questions.length} question(s) · Pass score:{" "}
              {lesson.quiz.passScore}%
              {lesson.quiz.maxAttempts != null &&
                ` · Max attempts: ${lesson.quiz.maxAttempts}`}
            </p>
          </div>
        )}

        {lesson.assignment && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Assignment: {lesson.assignment.title}
            </h4>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {lesson.assignment.instructions}
            </p>
          </div>
        )}

        {!hasContent && (
          <p className="text-sm text-muted-foreground italic">
            Use the course creation flow to add lesson content, or extend this
            form with add/edit APIs.
          </p>
        )}

        <Link
          href={`/learn/${courseSlug}`}
          className="text-sm text-primary hover:underline block"
        >
          View in learning player →
        </Link>
      </CardContent>
    </Card>
  );
}
