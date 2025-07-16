import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw, Plus, Trash2, Settings, Users, Timer, AlertCircle } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface BotRotationStatus {
  enabled: boolean;
  rotationInProgress: boolean;
  currentUsername: string | null;
  usernamePool: string[];
  usernameRecentlyUsed: string[];
  lastHeartbeat: Date | null;
}

interface BotConfig {
  enableBotRotation: boolean;
  offlineTimeout: number;
  rotationDelay: number;
  rotationDelayVariation: number;
  botActiveTime: number;
  botActiveTimeVariation: number;
  usernamePool: string[];
}

export default function BotRotation() {
  const [newUsername, setNewUsername] = useState('');
  const [settings, setSettings] = useState({
    offlineTimeout: 10,
    rotationDelay: 50,
    rotationDelayVariation: 20,
    botActiveTime: 12.5,
    botActiveTimeVariation: 2.5,
  });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: rotationStatus, isLoading: statusLoading } = useQuery<BotRotationStatus>({
    queryKey: ['/api/bot/rotation/status'],
    refetchInterval: 2000,
  });

  const { data: botConfig, isLoading: configLoading } = useQuery<BotConfig>({
    queryKey: ['/api/bot/config'],
    refetchInterval: 5000,
  });

  useEffect(() => {
    if (botConfig) {
      setSettings({
        offlineTimeout: botConfig.offlineTimeout || 10,
        rotationDelay: botConfig.rotationDelay || 50,
        rotationDelayVariation: botConfig.rotationDelayVariation || 20,
        botActiveTime: botConfig.botActiveTime || 12.5,
        botActiveTimeVariation: botConfig.botActiveTimeVariation || 2.5,
      });
    }
  }, [botConfig]);

  const enableRotationMutation = useMutation({
    mutationFn: async (usernames: string[]) => {
      return await apiRequest('/api/bot/rotation/enable', {
        method: 'POST',
        body: { usernames },
      });
    },
    onSuccess: () => {
      toast({
        title: 'Bot rotation enabled',
        description: 'Bot failover system is now active',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/bot/rotation/status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/bot/config'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to enable bot rotation',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const disableRotationMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/bot/rotation/disable', {
        method: 'POST',
      });
    },
    onSuccess: () => {
      toast({
        title: 'Bot rotation disabled',
        description: 'Bot failover system is now inactive',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/bot/rotation/status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/bot/config'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to disable bot rotation',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: any) => {
      return await apiRequest('/api/bot/rotation/settings', {
        method: 'PUT',
        body: newSettings,
      });
    },
    onSuccess: () => {
      toast({
        title: 'Settings updated',
        description: 'Bot rotation settings have been saved',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/bot/config'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to update settings',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleAddUsername = () => {
    if (newUsername.trim() && !rotationStatus?.usernamePool.includes(newUsername.trim())) {
      const updatedPool = [...(rotationStatus?.usernamePool || []), newUsername.trim()];
      enableRotationMutation.mutate(updatedPool);
      setNewUsername('');
    }
  };

  const handleRemoveUsername = (username: string) => {
    const updatedPool = rotationStatus?.usernamePool.filter(u => u !== username) || [];
    enableRotationMutation.mutate(updatedPool);
  };

  const handleToggleRotation = () => {
    if (rotationStatus?.enabled) {
      disableRotationMutation.mutate();
    } else {
      if (rotationStatus?.usernamePool.length === 0) {
        toast({
          title: 'No usernames configured',
          description: 'Please add at least one username to enable rotation',
          variant: 'destructive',
        });
        return;
      }
      enableRotationMutation.mutate(rotationStatus.usernamePool);
    }
  };

  const handleSaveSettings = () => {
    updateSettingsMutation.mutate(settings);
  };

  const formatTime = (seconds: number) => {
    return seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'enabled': return 'bg-green-500';
      case 'disabled': return 'bg-gray-500';
      case 'rotating': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getRotationStatus = () => {
    if (!rotationStatus) return { text: 'Loading...', color: 'bg-gray-500' };
    if (rotationStatus.rotationInProgress) return { text: 'Rotating', color: 'bg-yellow-500' };
    if (rotationStatus.enabled) return { text: 'Enabled', color: 'bg-green-500' };
    return { text: 'Disabled', color: 'bg-gray-500' };
  };

  const status = getRotationStatus();
  const loading = statusLoading || configLoading;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Bot Rotation System</h1>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${status.color}`} />
          <span className="text-sm font-medium">{status.text}</span>
        </div>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          The bot rotation system automatically detects when a bot goes offline and brings a new bot online with a different username. 
          This helps maintain continuity and avoid detection patterns.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Status Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5" />
              Status Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Rotation System</span>
              <Switch
                checked={rotationStatus?.enabled || false}
                onCheckedChange={handleToggleRotation}
                disabled={loading || enableRotationMutation.isPending || disableRotationMutation.isPending}
              />
            </div>
            
            <Separator />
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Current Bot</p>
                <p className="font-medium">{rotationStatus?.currentUsername || 'None'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Heartbeat</p>
                <p className="font-medium">
                  {rotationStatus?.lastHeartbeat 
                    ? new Date(rotationStatus.lastHeartbeat).toLocaleTimeString()
                    : 'Never'
                  }
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">Recently Used</p>
              <div className="flex flex-wrap gap-1">
                {rotationStatus?.usernameRecentlyUsed.map((username, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {username}
                  </Badge>
                ))}
                {(rotationStatus?.usernameRecentlyUsed.length === 0) && (
                  <span className="text-xs text-muted-foreground">None</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Username Pool Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Username Pool ({rotationStatus?.usernamePool.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Add new username..."
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddUsername()}
                className="flex-1"
              />
              <Button
                onClick={handleAddUsername}
                disabled={!newUsername.trim() || enableRotationMutation.isPending}
                size="sm"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            <div className="max-h-48 overflow-y-auto space-y-2">
              {rotationStatus?.usernamePool.map((username, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-muted rounded-lg"
                >
                  <span className="font-medium">{username}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveUsername(username)}
                    disabled={enableRotationMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              {(rotationStatus?.usernamePool.length === 0) && (
                <div className="text-center py-8 text-muted-foreground">
                  No usernames configured
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Rotation Settings */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Rotation Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="offlineTimeout">Offline Detection Timeout</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      id="offlineTimeout"
                      type="number"
                      min="1"
                      max="60"
                      value={settings.offlineTimeout}
                      onChange={(e) => setSettings(prev => ({ ...prev, offlineTimeout: parseInt(e.target.value) || 10 }))}
                      className="w-24"
                    />
                    <span className="text-sm text-muted-foreground">seconds</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    How long to wait before considering bot offline
                  </p>
                </div>

                <div>
                  <Label htmlFor="rotationDelay">Rotation Delay</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      id="rotationDelay"
                      type="number"
                      min="10"
                      max="300"
                      value={settings.rotationDelay}
                      onChange={(e) => setSettings(prev => ({ ...prev, rotationDelay: parseInt(e.target.value) || 50 }))}
                      className="w-24"
                    />
                    <span className="text-sm text-muted-foreground">± {settings.rotationDelayVariation}s</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Average wait time before starting new bot ({formatTime(settings.rotationDelay - settings.rotationDelayVariation)} - {formatTime(settings.rotationDelay + settings.rotationDelayVariation)})
                  </p>
                </div>

                <div>
                  <Label htmlFor="rotationDelayVariation">Delay Variation</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      id="rotationDelayVariation"
                      type="number"
                      min="0"
                      max="60"
                      value={settings.rotationDelayVariation}
                      onChange={(e) => setSettings(prev => ({ ...prev, rotationDelayVariation: parseInt(e.target.value) || 20 }))}
                      className="w-24"
                    />
                    <span className="text-sm text-muted-foreground">seconds</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Random variation in delay timing for realistic behavior
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="botActiveTime">Bot Active Time</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      id="botActiveTime"
                      type="number"
                      min="5"
                      max="60"
                      step="0.5"
                      value={settings.botActiveTime}
                      onChange={(e) => setSettings(prev => ({ ...prev, botActiveTime: parseFloat(e.target.value) || 12.5 }))}
                      className="w-24"
                    />
                    <span className="text-sm text-muted-foreground">± {settings.botActiveTimeVariation}s</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    How long each bot stays active ({formatTime(settings.botActiveTime - settings.botActiveTimeVariation)} - {formatTime(settings.botActiveTime + settings.botActiveTimeVariation)})
                  </p>
                </div>

                <div>
                  <Label htmlFor="botActiveTimeVariation">Active Time Variation</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      id="botActiveTimeVariation"
                      type="number"
                      min="0"
                      max="10"
                      step="0.5"
                      value={settings.botActiveTimeVariation}
                      onChange={(e) => setSettings(prev => ({ ...prev, botActiveTimeVariation: parseFloat(e.target.value) || 2.5 }))}
                      className="w-24"
                    />
                    <span className="text-sm text-muted-foreground">seconds</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Random variation in active time for unpredictable patterns
                  </p>
                </div>

                <div className="pt-4">
                  <Button
                    onClick={handleSaveSettings}
                    disabled={updateSettingsMutation.isPending}
                    className="w-full"
                  >
                    {updateSettingsMutation.isPending ? 'Saving...' : 'Save Settings'}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}