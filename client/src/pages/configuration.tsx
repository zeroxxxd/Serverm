import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Save } from "lucide-react";

export default function Configuration() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: config, isLoading } = useQuery({
    queryKey: ["/api/bot/config"],
  });

  const [formData, setFormData] = useState({
    username: "",
    password: "",
    authType: "mojang",
    autoReconnect: true,
    antiAfk: true,
    chatMessages: true,
    chatMessagesRepeat: true,
    chatMessagesDelay: 60,
    autoAuth: false,
    autoAuthPassword: "",
  });

  // Update form data when config loads
  useState(() => {
    if (config) {
      setFormData({
        username: config.username || "",
        password: config.password || "",
        authType: config.authType || "mojang",
        autoReconnect: config.autoReconnect || true,
        antiAfk: config.antiAfk || true,
        chatMessages: config.chatMessages || true,
        chatMessagesRepeat: config.chatMessagesRepeat || true,
        chatMessagesDelay: config.chatMessagesDelay || 60,
        autoAuth: config.autoAuth || false,
        autoAuthPassword: config.autoAuthPassword || "",
      });
    }
  });

  const updateConfigMutation = useMutation({
    mutationFn: (data: any) => apiRequest("PUT", "/api/bot/config", data),
    onSuccess: () => {
      toast({
        title: "Configuration Saved",
        description: "Bot configuration has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/bot/config"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateConfigMutation.mutate(formData);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  if (isLoading) {
    return <div className="text-white">Loading configuration...</div>;
  }

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-white">Configuration</h1>
        <p className="text-secondary">Configure your bot settings</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="discord-card border">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-white">Account Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-white">Username</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => handleInputChange("username", e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white"
                  placeholder="Enter your Minecraft username"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white"
                  placeholder="Enter your password (optional)"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="authType" className="text-white">Authentication Type</Label>
                <Select value={formData.authType} onValueChange={(value) => handleInputChange("authType", value)}>
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mojang">Mojang</SelectItem>
                    <SelectItem value="microsoft">Microsoft</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="discord-card border">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-white">Bot Behavior</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="autoReconnect" className="text-white">Auto-reconnect</Label>
                <Switch
                  id="autoReconnect"
                  checked={formData.autoReconnect}
                  onCheckedChange={(checked) => handleInputChange("autoReconnect", checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="antiAfk" className="text-white">Anti-AFK</Label>
                <Switch
                  id="antiAfk"
                  checked={formData.antiAfk}
                  onCheckedChange={(checked) => handleInputChange("antiAfk", checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="chatMessages" className="text-white">Chat Messages</Label>
                <Switch
                  id="chatMessages"
                  checked={formData.chatMessages}
                  onCheckedChange={(checked) => handleInputChange("chatMessages", checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="chatMessagesRepeat" className="text-white">Repeat Messages</Label>
                <Switch
                  id="chatMessagesRepeat"
                  checked={formData.chatMessagesRepeat}
                  onCheckedChange={(checked) => handleInputChange("chatMessagesRepeat", checked)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="chatMessagesDelay" className="text-white">
                  Message Delay (seconds)
                </Label>
                <Input
                  id="chatMessagesDelay"
                  type="number"
                  value={formData.chatMessagesDelay}
                  onChange={(e) => handleInputChange("chatMessagesDelay", parseInt(e.target.value))}
                  className="bg-gray-800 border-gray-700 text-white"
                  min="10"
                  max="3600"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="discord-card border">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-white">Authentication</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="autoAuth" className="text-white">Auto-authenticate</Label>
                <Switch
                  id="autoAuth"
                  checked={formData.autoAuth}
                  onCheckedChange={(checked) => handleInputChange("autoAuth", checked)}
                />
              </div>
              
              {formData.autoAuth && (
                <div className="space-y-2">
                  <Label htmlFor="autoAuthPassword" className="text-white">
                    Auth Password
                  </Label>
                  <Input
                    id="autoAuthPassword"
                    type="password"
                    value={formData.autoAuthPassword}
                    onChange={(e) => handleInputChange("autoAuthPassword", e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white"
                    placeholder="Enter server auth password"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end">
          <Button
            type="submit"
            className="discord-button"
            disabled={updateConfigMutation.isPending}
          >
            <Save className="w-4 h-4 mr-2" />
            Save Configuration
          </Button>
        </div>
      </form>
    </div>
  );
}
