import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { Link } from "wouter";
import type { ChatLog } from "@shared/schema";

export function ChatLogs() {
  const { data: chatLogs = [] } = useQuery({
    queryKey: ["/api/chat-logs"],
    queryFn: () => fetch("/api/chat-logs?limit=10").then(res => res.json()),
  });

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getUserColor = (username: string) => {
    if (username.toLowerCase().includes("admin")) return "text-yellow-500";
    if (username.toLowerCase().includes("system")) return "text-red-500";
    return "text-blue-400";
  };

  return (
    <Card className="discord-card border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-white">Recent Chat</CardTitle>
          <Link href="/chat-logs">
            <Button variant="ghost" size="sm" className="text-secondary hover:text-white">
              <ExternalLink className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {chatLogs.length > 0 ? (
            chatLogs.map((log: ChatLog) => (
              <div key={log.id} className="text-sm">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`font-medium ${getUserColor(log.username)}`}>
                    {log.username}
                  </span>
                  <span className="text-xs text-secondary">
                    {formatTime(log.timestamp!)}
                  </span>
                </div>
                <p className="text-secondary">{log.message}</p>
              </div>
            ))
          ) : (
            <p className="text-secondary text-center py-4">No chat messages yet</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
