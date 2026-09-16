import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export function getUserInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || "??";
}

type UserAvatarProps = {
  name: string;
  photoURL?: string | null;
  size?: "sm" | "default" | "lg";
  className?: string;
};

const sizeClass: Record<NonNullable<UserAvatarProps["size"]>, string> = {
  sm: "size-6",
  default: "size-8",
  lg: "size-16",
};

const fallbackClass: Record<NonNullable<UserAvatarProps["size"]>, string> = {
  sm: "text-[10px]",
  default: "text-xs",
  lg: "text-lg",
};

export function UserAvatar({
  name,
  photoURL,
  size = "default",
  className,
}: UserAvatarProps) {
  const initials = getUserInitials(name);

  return (
    <Avatar className={cn(sizeClass[size], className)} size={size === "lg" ? "lg" : size}>
      {photoURL ? <AvatarImage src={photoURL} alt={name} /> : null}
      <AvatarFallback className={fallbackClass[size]}>{initials}</AvatarFallback>
    </Avatar>
  );
}

type UserLabelProps = {
  name: string;
  photoURL?: string | null;
  size?: "sm" | "default";
  className?: string;
  nameClassName?: string;
};

export function UserLabel({
  name,
  photoURL,
  size = "sm",
  className,
  nameClassName,
}: UserLabelProps) {
  return (
    <span className={cn("inline-flex min-w-0 items-center gap-2", className)}>
      <UserAvatar name={name} photoURL={photoURL} size={size} />
      <span className={cn("truncate", nameClassName)}>{name}</span>
    </span>
  );
}
