"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle } from "lucide-react";

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

interface LessonQuizProps {
  quiz: Quiz;
  enrollmentId: string;
  attempts: { score: number; passed: boolean }[];
}

export function LessonQuiz({
  quiz,
  enrollmentId,
  attempts,
}: LessonQuizProps) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ score: number; passed: boolean } | null>(null);

  const lastAttempt = attempts.length > 0 ? attempts[attempts.length - 1] : null;
  const canAttempt =
    quiz.maxAttempts == null || attempts.length < quiz.maxAttempts;

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const payload = { enrollmentId, quizId: quiz.id, answers };
      const res = await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setResult({ score: data.score, passed: data.passed });
      router.refresh();
    } catch {
      setResult(null);
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    return (
      <div className="mt-6 p-4 rounded-lg border bg-muted/30">
        <h3 className="font-semibold mb-3">{quiz.title}</h3>
        <div
          className={`flex items-center gap-2 p-3 rounded ${
            result.passed ? "bg-green-500/10 text-green-700" : "bg-red-500/10 text-red-700"
          }`}
        >
          {result.passed ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <XCircle className="h-5 w-5" />
          )}
          <span className="font-medium">
            Score: {result.score}% - {result.passed ? "Passed!" : "Try again"}
          </span>
        </div>
      </div>
    );
  }

  if (lastAttempt?.passed && !canAttempt) {
    return (
      <div className="mt-6 p-4 rounded-lg border bg-muted/30">
        <h3 className="font-semibold mb-3">{quiz.title}</h3>
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle className="h-5 w-5" />
          <span>You passed (Score: {lastAttempt.score}%)</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 p-4 rounded-lg border bg-muted/30">
      <h3 className="font-semibold mb-3">{quiz.title}</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Pass score: {quiz.passScore}% | Attempts: {attempts.length}
        {quiz.maxAttempts != null ? ` / ${quiz.maxAttempts}` : ""}
      </p>
      <div className="space-y-4">
        {quiz.questions.map((q) => (
          <div key={q.id}>
            <Label className="text-base">{q.question}</Label>
            <div className="mt-2 space-y-2">
              {q.options.map((opt, i) => (
                <label
                  key={i}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="radio"
                    name={q.id}
                    checked={answers[q.id] === i}
                    onChange={() =>
                      setAnswers((prev) => ({ ...prev, [q.id]: i }))
                    }
                  />
                  {opt}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
      <Button
        className="mt-4"
        onClick={handleSubmit}
        disabled={
          submitting ||
          !canAttempt ||
          Object.keys(answers).length !== quiz.questions.length
        }
      >
        {submitting ? "Submitting..." : "Submit quiz"}
      </Button>
    </div>
  );
}
