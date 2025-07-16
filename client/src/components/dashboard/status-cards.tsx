import { Card, CardContent } from "@/components/ui/card";
import { Bot, Server, MessageCircle, Clock } from "lucide-react";

interface StatusCardsProps {
  stats?: any;
  botStatus?: any;
}

export function StatusCards({ stats, botStatus }: StatusCardsProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "text-green-500";
      case "connecting":
        return "text-yellow-500";
      case "offline":
      default:
        return "text-red-500";
    }
  };

  const getStatusDot = (status: string) => {
    switch (status) {
      case "online":
        return "bg-green-500";
      case "connecting":
        return "bg-yellow-500 animate-pulse";
      case "offline":
      default:
        return "bg-red-500";
    }
  };

  const formatUptime = (uptime: number) => {
    const hours = Math.floor(uptime / (1000 * 60 * 60));
    const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <Card className="discord-card border">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-secondary text-sm">Bot Status</p>
              <p className={`text-2xl font-bold ${getStatusColor(botStatus?.stats?.status || "offline")}`}>
                {botStatus?.stats?.status || "Offline"}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
              <Bot className="text-green-500 w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${getStatusDot(botStatus?.stats?.status || "offline")}`} />
            <span className="text-xs text-secondary">
              {botStatus?.uptime ? `Active for ${formatUptime(botStatus.uptime)}` : "Not active"}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="discord-card border">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-secondary text-sm">Current Server</p>
              <p className="text-2xl font-bold text-white">
                {stats?.activeServer?.name || "None"}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Server className="text-blue-500 w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${stats?.activeServer ? "bg-green-500" : "bg-red-500"}`} />
            <span className="text-xs text-secondary">
              {stats?.activeServer ? "Connected" : "Disconnected"}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="discord-card border">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-secondary text-sm">Chat Messages</p>
              <p className="text-2xl font-bold text-white">
                {stats?.botStats?.chatMessageCount || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
              <MessageCircle className="text-yellow-500 w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="text-xs text-green-500">+{stats?.recentChatMessages || 0}</span>
            <span className="text-xs text-secondary">recent</span>
          </div>
        </CardContent>
      </Card>

      <Card className="discord-card border">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-secondary text-sm">Reconnects</p>
              <p className="text-2xl font-bold text-white">
                {stats?.botStats?.reconnectCount || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
              <Clock className="text-green-500 w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="text-xs text-green-500">Stable</span>
            <span className="text-xs text-secondary">connection</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
