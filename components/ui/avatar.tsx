import { cn } from "@/lib/utils";

interface AvatarProps {
  name: string;
  avatarUrl?: string | null;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

const sizes = {
  xs: "w-5 h-5 text-[10px]",
  sm: "w-7 h-7 text-xs",
  md: "w-8 h-8 text-sm",
  lg: "w-10 h-10 text-base",
};

const colors = [
  "bg-blue-500",
  "bg-purple-500",
  "bg-green-500",
  "bg-amber-500",
  "bg-red-500",
  "bg-pink-500",
  "bg-indigo-500",
  "bg-teal-500",
];

function getColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function Avatar({ name, avatarUrl, size = "md", className }: AvatarProps) {
  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={name}
        className={cn("rounded-full object-cover ring-2 ring-white", sizes[size], className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center text-white font-semibold ring-2 ring-white",
        sizes[size],
        getColor(name),
        className
      )}
      title={name}
    >
      {getInitials(name)}
    </div>
  );
}

interface AvatarStackProps {
  users: Array<{ name: string; avatarUrl?: string | null }>;
  max?: number;
  size?: "xs" | "sm" | "md";
}

export function AvatarStack({ users, max = 4, size = "sm" }: AvatarStackProps) {
  const shown = users.slice(0, max);
  const extra = users.length - max;

  return (
    <div className="flex -space-x-2">
      {shown.map((user, i) => (
        <Avatar key={i} name={user.name} avatarUrl={user.avatarUrl} size={size} />
      ))}
      {extra > 0 && (
        <div
          className={cn(
            "rounded-full flex items-center justify-center text-white font-semibold bg-navy-600 ring-2 ring-white text-xs",
            sizes[size]
          )}
        >
          +{extra}
        </div>
      )}
    </div>
  );
}
