import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Download, Trash2 } from "lucide-react";
import { useState } from "react";
import type { ChatLog } from "@shared/schema";

export default function ChatLogs() {
  const [searchTerm, setSearchTerm] = useState("");
  
  const { data: chatLogs = [] } = useQuery({
    queryKey: ["/api/chat-logs"],
    queryFn: () => fetch("/api/chat-logs?limit=100").then(res => res.json()),
  });

  const filteredLogs = chatLogs.filter((log: ChatLog) => 
    log.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.message.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getUserColor = (username: string) => {
    if (username.toLowerCase().includes("admin")) return "text-yellow-500";
    if (username.toLowerCase().includes("system")) return "text-red-500";
    return "text-blue-400";
  };

  return (
    <div>
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Chat Logs</h1>
            <p className="text-secondary">View and manage chat history</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm">
              <Trash2 className="w-4 h-4 mr-2" />
              Clear
            </Button>
          </div>
        </div>
      </header>

      <Card className="discord-card border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-white">Chat History</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-secondary" />
              <Input
                placeholder="Search messages..."
                className="pl-10 bg-gray-800 border-gray-700 text-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredLogs.length > 0 ? (
              filteredLogs.map((log: ChatLog) => (
                <div key={log.id} className="p-3 hover-card rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`font-medium ${getUserColor(log.username)}`}>
                      {log.username}
                    </span>
                    <span className="text-xs text-secondary">
                      {formatTime(log.timestamp!)}
                    </span>
                  </div>
                  <p className="text-white">{log.message}</p>
                </div>
              ))
            ) : (
              <p className="text-secondary text-center py-8">No chat messages found</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
