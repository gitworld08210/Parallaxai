import { NavLink, useLocation } from "react-router-dom";
import { Home, Search, Sparkles, Bell, Mail } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = { unreadNotif?: number; unreadDm?: number };

export const MobileNav = ({ unreadNotif = 0, unreadDm = 0 }: Props) => {
  const loc = useLocation();

  if (loc.pathname.startsWith("/auth")) return null;

  const items = [
    { to: "/", icon: Home, label: "Home", end: true },
    { to: "/discover", icon: Search, label: "Search" },
    { to: "/live", icon: Sparkles, label: "Spaces" },
    { to: "/notifications", icon: Bell, label: "Notifications", badge: unreadNotif },
    { to: "/messages", icon: Mail, label: "Messages", badge: unreadDm },
  ];

  return (
    <nav
      aria-label="Primary"
      className="absolute bottom-0 inset-x-0 z-50 border-t border-border bg-background"
    >
      <ul className="flex items-stretch justify-around px-1 pb-[env(safe-area-inset-bottom)]">
        {items.map(({ to, icon: Icon, label, end, badge }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={end}
            >
              {({ isActive }) => (
                <div className={cn(
                  "relative flex flex-col items-center justify-center py-3 transition-colors",
                  isActive ? "text-foreground" : "text-muted-foreground"
                )}>
                  <span className="relative">
                    <Icon
                      className="h-[26px] w-[26px]"
                      strokeWidth={isActive ? 2.5 : 1.8}
                      fill={isActive ? "currentColor" : "none"}
                    />
                    {badge !== undefined && badge > 0 && (
                      <span className="absolute -right-1.5 -top-1 min-w-[16px] h-4 rounded-full bg-primary px-1 text-[9px] font-bold flex items-center justify-center text-white">
                        {badge > 99 ? "99+" : badge}
                      </span>
                    )}
                  </span>
                  <span className="sr-only">{label}</span>
                </div>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default MobileNav;
