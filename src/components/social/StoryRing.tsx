import { gradientFor, initialsOf } from "@/lib/format";

interface StoryRingProps {
  avatarUrl: string | null;
  username: string;
  displayName: string;
  hasUnseen: boolean;
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
}

const sizeMap = {
  sm: { outer: "h-10 w-10", text: "text-[10px]" },
  md: { outer: "h-16 w-16", text: "text-xs" },
  lg: { outer: "h-20 w-20", text: "text-sm" },
};

export const StoryRing = ({
  avatarUrl,
  username,
  displayName,
  hasUnseen,
  size = "md",
  onClick,
}: StoryRingProps) => {
  const { outer, text } = sizeMap[size];

  const ringStyle = hasUnseen
    ? { background: "conic-gradient(from 180deg, hsl(268 92% 60%), hsl(300 85% 65%), hsl(320 92% 60%), hsl(268 92% 60%))" }
    : { background: "hsl(var(--border))" };

  return (
    <div className={`${outer} rounded-full p-[2px] cursor-pointer`} style={ringStyle} onClick={onClick}>
      <div className="h-full w-full rounded-full bg-background p-[2px]">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            className="h-full w-full rounded-full object-cover"
            alt={username}
          />
        ) : (
          <div
            className={`h-full w-full rounded-full grid place-items-center ${text} font-semibold text-primary-foreground`}
            style={{ backgroundImage: gradientFor(username) }}
          >
            {initialsOf(displayName || username)}
          </div>
        )}
      </div>
    </div>
  );
};
