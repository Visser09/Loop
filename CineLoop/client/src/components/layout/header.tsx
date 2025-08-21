import { Button } from "@/components/ui/button";
import { Search, Bell, ArrowLeft } from "lucide-react";

interface HeaderProps {
  onSearchClick: () => void;
  onNotificationsClick: () => void;
  title?: string;
  showSearch?: boolean;
  showBack?: boolean;
}

export default function Header({ 
  onSearchClick, 
  onNotificationsClick, 
  title = "CineLoop",
  showSearch = true,
  showBack = false
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 cine-backdrop-blur border-b border-cine-gray/30">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-3">
          {showBack ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.history.back()}
              className="p-2 hover:bg-cine-gray/30 rounded-full"
            >
              <ArrowLeft className="w-5 h-5 text-cine-text" />
            </Button>
          ) : (
            <div className="w-8 h-8 cine-gradient rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">C</span>
            </div>
          )}
          <h1 className="text-xl font-bold text-cine-text">{title}</h1>
        </div>

        <div className="flex items-center space-x-2">
          {showSearch && (
            <Button 
              variant="ghost"
              size="sm"
              onClick={onSearchClick}
              className="p-2 hover:bg-cine-gray/30 rounded-full transition-colors"
            >
              <Search className="w-5 h-5 text-cine-text" />
            </Button>
          )}
          <Button 
            variant="ghost"
            size="sm"
            onClick={onNotificationsClick}
            className="p-2 hover:bg-cine-gray/30 rounded-full transition-colors"
          >
            <Bell className="w-5 h-5 text-cine-text" />
          </Button>
        </div>
      </div>
    </header>
  );
}