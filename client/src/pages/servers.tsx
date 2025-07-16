import { ServerList } from "@/components/dashboard/server-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function Servers() {
  return (
    <div>
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Servers</h1>
            <p className="text-secondary">Manage your Minecraft servers</p>
          </div>
          <Button className="discord-button">
            <Plus className="w-4 h-4 mr-2" />
            Add New Server
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ServerList />
        
        <Card className="discord-card border">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white">Server Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-secondary">Total Servers:</span>
                <span className="text-white">3</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary">Active Servers:</span>
                <span className="text-green-500">1</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary">Offline Servers:</span>
                <span className="text-red-500">2</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary">Last Connection:</span>
                <span className="text-white">2 minutes ago</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
