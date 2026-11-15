import { CLINICIAN_LINE } from "@/lib/safety";

export function SafetyNote({ className = "" }: { className?: string }) {
  return (
    <p className={`text-base leading-relaxed text-muted-foreground ${className}`}>
      {CLINICIAN_LINE} Harbor does not tell you what illness you have, what to eat, or what medicine to take.
    </p>
  );
}
