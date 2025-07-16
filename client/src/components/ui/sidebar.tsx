import { Link, useLocation } from "wouter";
import { 
  Bot, 
  BarChart3, 
  Server, 
  MessageCircle, 
  Settings, 
  TrendingUp, 
  User,
  LogOut,
  Sun,
  Moon,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";

const navigation = [
  {
    name: "Dashboard",
    href: "/",
    icon: BarChart3,
  },
  {
    name: "Bot Control",
    href: "/bot-control",
    icon: Bot,
  },
  {
    name: "Bot Rotation",
    href: "/bot-rotation",
    icon: RefreshCw,
  },
  {
    name: "Servers",
    href: "/servers",
    icon: Server,
  },
  {
    name: "Chat Logs",
    href: "/chat-logs",
    icon: MessageCircle,
  },
  {
    name: "Configuration",
    href: "/configuration",
    icon: Settings,
  },
  {
    name: "Analytics",
    href: "/analytics",
    icon: TrendingUp,
  },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { theme, toggleTheme } = useTheme();

  return (
    <aside className="w-64 discord-sidebar fixed h-full z-10 border-r">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 discord-button rounded-lg flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">AFK Bot</h1>
            <p className="text-xs text-secondary">Dashboard v2.1</p>
          </div>
        </div>

        <nav className="space-y-2">
          {navigation.map((item) => {
            const isActive = location === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? "bg-blue-500/20 text-blue-400"
                    : "text-secondary hover:bg-gray-700 hover:text-white"
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-700">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-black" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-white">Player123</p>
            <p className="text-xs text-secondary">Online</p>
          </div>
          <button className="text-secondary hover:text-white">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-xs text-secondary">Theme</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="text-secondary hover:text-white p-1"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </aside>
  );
}
