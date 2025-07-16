import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Server, Plus, MoreVertical } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Server as ServerType } from "@shared/schema";

export function ServerList() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: servers = [] } = useQuery({
    queryKey: ["/api/servers"],
  });

  const activateServerMutation = useMutation({
    mutationFn: (serverId: number) => apiRequest("POST", `/api/servers/${serverId}/activate`),
    onSuccess: () => {
      toast({
        title: "Server Activated",
        description: "Server has been activated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/servers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleActivateServer = (serverId: number) => {
    activateServerMutation.mutate(serverId);
  };

  return (
    <Card className="discord-card border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-white">Servers</CardTitle>
          <Button className="discord-button" size="sm">
            <Plus className="w-4 h-4 mr-1" />
            Add Server
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {servers.map((server: ServerType) => (
          <div
            key={server.id}
            className="flex items-center justify-between p-3 hover-card rounded-lg transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                server.isActive ? "bg-green-500" : "bg-gray-600"
              }`}>
                <Server className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-white font-medium">{server.name}</p>
                <p className="text-xs text-secondary">
                  Port: {server.port} | v{server.version}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={server.isActive ? "default" : "secondary"}
                className={server.isActive ? "bg-green-500/20 text-green-500" : ""}
              >
                {server.isActive ? "Active" : "Inactive"}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleActivateServer(server.id)}
                disabled={server.isActive || activateServerMutation.isPending}
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
