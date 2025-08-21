import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { 
  Home, 
  Search, 
  Plus, 
  Activity, 
  User 
} from "lucide-react";

export default function BottomNav() {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();

  const navItems = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/search", icon: Search, label: "Search" },
    { path: "/create", icon: Plus, label: "Create", isSpecial: true },
    { path: "/notifications", icon: Activity, label: "Activity" },
    { path: `/profile/${user?.username}`, icon: User, label: "Profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 cine-backdrop-blur border-t border-cine-gray/30 safe-area-bottom">
      <div className="flex items-center justify-around py-3 px-4">
        {navItems.map((item) => {
          const isActive = location === item.path;
          const Icon = item.icon;

          if (item.isSpecial) {
            return (
              <Button
                key={item.path}
                onClick={() => setLocation(item.path)}
                className="cine-gradient p-3 rounded-full shadow-lg transform hover:scale-105 transition-transform"
              >
                <Icon className="w-6 h-6 text-white" />
              </Button>
            );
          }

          return (
            <Button
              key={item.path}
              variant="ghost"
              size="sm"
              onClick={() => setLocation(item.path)}
              className={`flex flex-col items-center space-y-1 p-2 transition-colors ${
                isActive 
                  ? "text-cine-gold" 
                  : "text-cine-muted hover:text-cine-text"
              }`}
            >
              {item.path === `/profile/${user?.username}` ? (
                <img
                  src={user?.profileImageUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop&crop=face"}
                  alt="Profile"
                  className={`w-6 h-6 rounded-full object-cover ${
                    isActive ? "border-2 border-cine-gold" : "border border-cine-muted"
                  }`}
                />
              ) : (
                <Icon className="w-6 h-6" />
              )}
              <span className="text-xs">{item.label}</span>
            </Button>
          );
        })}
      </div>
    </nav>
  );
}