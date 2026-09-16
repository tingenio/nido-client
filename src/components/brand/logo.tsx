import { cn } from "@/lib/utils";

type LogoProps = {
  variant?: "full" | "mark";
  size?: "sm" | "md" | "lg";
  className?: string;
};

const markSizes = {
  sm: "size-8",
  md: "size-10",
  lg: "size-14",
};

const textSizes = {
  sm: "text-xl",
  md: "text-2xl",
  lg: "text-3xl",
};

function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M50 14 L86 48 L14 48 Z"
        className="fill-primary stroke-primary"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M22 52 Q50 88 78 52"
        className="stroke-primary"
        strokeWidth="7"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="36" cy="58" r="5" className="fill-[var(--brand-sage)]" />
      <circle cx="50" cy="62" r="5" className="fill-[var(--brand-sage)]" />
      <circle cx="64" cy="58" r="5" className="fill-[var(--brand-sage)]" />
    </svg>
  );
}

export function Logo({ variant = "full", size = "md", className }: LogoProps) {
  if (variant === "mark") {
    return (
      <LogoMark className={cn(markSizes[size], className)} />
    );
  }

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <LogoMark className={markSizes[size]} />
      <span
        className={cn(
          "font-semibold tracking-tight text-foreground",
          textSizes[size],
        )}
      >
        Nido
      </span>
    </div>
  );
}
