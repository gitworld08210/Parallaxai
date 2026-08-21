import { NavLink, useLocation } from "react-router-dom";
import { Home, Search, PlusSquare, Heart, User, Wallet } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthProvider";
import { AuraAvatar } from "@/components/vibe/AuraAvatar";
import { gradientFor, initialsOf } from "@/lib/format";
import { useState } from "react";
import { UnifiedCreationSheet } from "@/components/compose/UnifiedCreationSheet";

type Props = { unreadNotif?: number; unreadDm?: number };

export const MobileNav = ({ unreadNotif = 0, unreadDm = 0 }: Props) => {
  const loc = useLocation();
  const { profile } = useAuth();
  const [createOpen, setCreateOpen] = useState(false);
  
  if (loc.pathname.startsWith("/auth")) return null;

  const items = [
    { to: "/", icon: Home, label: "Home", end: true },
    { to: "/discover", icon: Search, label: "Explore" },
    { to: "#create", icon: PlusSquare, label: "Create", action: () => setCreateOpen(true) },
    { to: "/wallet", icon: Wallet, label: "Wallet" },
    { to: "/profile", icon: User, label: "Profile" },
  ];

  // Determine active item for layoutId indicator
  const activeItem = items.find((item) => {
    if (item.action) return false;
    if (item.end) return loc.pathname === item.to;
    return loc.pathname.startsWith(item.to);
  });

  return (
    <>
      <nav
        aria-label="Primary"
        className="absolute bottom-0 inset-x-0 z-50 border-t border-border/50 bg-background/80 backdrop-blur-2xl"
      >
        <ul className="flex items-stretch justify-around px-1 pb-[env(safe-area-inset-bottom)]">
          {items.map(({ to, icon: Icon, label, end, action }) => {
            const badge = label === "Alerts" ? unreadNotif : 0;
            const isCreate = label === "Create";
            
            return (
              <li key={to} className="flex-1">
                {action ? (
                  <button
                    onClick={action}
                    className="w-full relative flex flex-col items-center gap-0.5 py-3 transition-colors text-muted-foreground hover:text-foreground"
                  >
                    <span className="h-11 w-11 rounded-full bg-gradient-to-br from-primary to-primary/70 grid place-items-center shadow-lg shadow-primary/25">
                      <Icon className="h-[22px] w-[22px] text-primary-foreground" strokeWidth={2.2} />
                    </span>
                    <span className="sr-only">{label}</span>
                  </button>
                ) : (
                  <NavLink
                    to={to}
                    end={end}
                  >
                    {({ isActive }) => (
                      <div className={cn(
                        "relative flex flex-col items-center gap-0.5 py-3 transition-colors",
                        isActive ? "text-primary" : "text-muted-foreground"
                      )}>
                        <span className="relative">
                          {label === "Profile" && profile ? (
                            <div className={cn(
                              "h-[24px] w-[24px] rounded-full overflow-hidden ring-1 ring-white/20 transition-all",
                              isActive && "ring-primary ring-2"
                            )}>
                              {profile.avatar_url ? (
                                <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                              ) : (
                                <AuraAvatar gradient={gradientFor(profile.username)} initials={initialsOf(profile.display_name || profile.username)} />
                              )}
                            </div>
                          ) : (
                            <Icon className="h-[26px] w-[26px]" strokeWidth={isActive ? 2.5 : 2} />
                          )}
                          {badge > 0 && (
                            <span className="absolute -right-1 -top-1 min-w-[16px] h-4 rounded-full bg-rose-500 px-1 text-[9px] font-bold flex items-center justify-center text-white ring-2 ring-background">
                              {badge > 99 ? "99+" : badge}
                            </span>
                          )}
                        </span>
                        {/* Animated active indicator pill */}
                        {isActive && (
                          <motion.span
                            layoutId="nav-active-indicator"
                            className="absolute -bottom-0.5 h-1 w-5 rounded-full bg-primary"
                            transition={{ type: "spring", stiffness: 500, damping: 35 }}
                          />
                        )}
                        <span className="sr-only">{label}</span>
                      </div>
                    )}
                  </NavLink>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
      
      <UnifiedCreationSheet open={createOpen} onClose={() => setCreateOpen(false)} />
    </>
  );
};

export default MobileNav;
