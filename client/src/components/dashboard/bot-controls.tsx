import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Play, Square, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export function BotControls() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: botConfig } = useQuery({
    queryKey: ["/api/bot/config"],
  });

  const { data: botStatus } = useQuery({
    queryKey: ["/api/bot/status"],
  });

  const startBotMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/bot/start"),
    onSuccess: () => {
      toast({
        title: "Bot Started",
        description: "The bot has been started successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/bot/status"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const stopBotMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/bot/stop"),
    onSuccess: () => {
      toast({
        title: "Bot Stopped",
        description: "The bot has been stopped successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/bot/status"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const restartBotMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/bot/restart"),
    onSuccess: () => {
      toast({
        title: "Bot Restarted",
        description: "The bot has been restarted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/bot/status"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateConfigMutation = useMutation({
    mutationFn: (config: any) => apiRequest("PUT", "/api/bot/config", config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bot/config"] });
    },
  });

  const handleToggleChange = (field: string, value: boolean) => {
    if (botConfig) {
      updateConfigMutation.mutate({
        ...botConfig,
        [field]: value,
      });
    }
  };

  const isRunning = botStatus?.isRunning;

  return (
    <Card className="discord-card border">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-white">Bot Controls</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Button
            className="flex-1 success-button"
            onClick={() => startBotMutation.mutate()}
            disabled={isRunning || startBotMutation.isPending}
          >
            <Play className="w-4 h-4 mr-2" />
            Start Bot
          </Button>
          <Button
            className="flex-1 error-button"
            onClick={() => stopBotMutation.mutate()}
            disabled={!isRunning || stopBotMutation.isPending}
          >
            <Square className="w-4 h-4 mr-2" />
            Stop Bot
          </Button>
        </div>
        
        <Button
          className="w-full warning-button"
          onClick={() => restartBotMutation.mutate()}
          disabled={restartBotMutation.isPending}
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Restart Bot
        </Button>

        <div className="border-t border-gray-700 pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-secondary">Auto-reconnect</span>
            <Switch
              checked={botConfig?.autoReconnect || false}
              onCheckedChange={(checked) => handleToggleChange("autoReconnect", checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-secondary">Anti-AFK</span>
            <Switch
              checked={botConfig?.antiAfk || false}
              onCheckedChange={(checked) => handleToggleChange("antiAfk", checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-secondary">Chat Messages</span>
            <Switch
              checked={botConfig?.chatMessages || false}
              onCheckedChange={(checked) => handleToggleChange("chatMessages", checked)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
