import { useQuery } from "@tanstack/react-query";
import { useWebSocket } from "@/hooks/use-websocket";
import { StatusCards } from "@/components/dashboard/status-cards";
import { BotControls } from "@/components/dashboard/bot-controls";
import { ServerList } from "@/components/dashboard/server-list";
import { ActivityChart } from "@/components/dashboard/activity-chart";
import { ChatLogs } from "@/components/dashboard/chat-logs";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { Bell, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { isConnected, lastMessage } = useWebSocket("/ws");
  
  const { data: stats, refetch: refetchStats } = useQuery({
    queryKey: ["/api/stats"],
    refetchInterval: 5000,
  });

  const { data: botStatus } = useQuery({
    queryKey: ["/api/bot/status"],
    refetchInterval: 2000,
  });

  return (
    <div>
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Bot Dashboard</h1>
            <p className="text-secondary">Monitor and control your Minecraft AFK bot</p>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" className="text-secondary hover:text-white">
              <Bell className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-secondary hover:text-white"
              onClick={() => refetchStats()}
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
            <div className="discord-card px-3 py-2 rounded-lg border">
              <span className="text-xs text-secondary">Last Update:</span>
              <span className="text-sm font-medium text-white ml-1">
                {isConnected ? "Connected" : "Disconnected"}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Status Cards */}
      <StatusCards stats={stats} botStatus={botStatus} />

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <BotControls />
        <ServerList />
      </div>

      {/* Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ActivityChart />
        </div>
        <ChatLogs />
      </div>

      {/* Quick Actions */}
      <QuickActions />
    </div>
  );
}
