import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Calendar, Puzzle, Settings } from "lucide-react";

const quickActions = [
  {
    name: "Export Logs",
    icon: Download,
    color: "text-blue-500",
    action: () => {
      // TODO: Implement export functionality
      console.log("Export logs");
    },
  },
  {
    name: "Schedule",
    icon: Calendar,
    color: "text-yellow-500",
    action: () => {
      // TODO: Implement scheduling
      console.log("Schedule");
    },
  },
  {
    name: "Plugins",
    icon: Puzzle,
    color: "text-green-500",
    action: () => {
      // TODO: Implement plugins
      console.log("Plugins");
    },
  },
  {
    name: "Settings",
    icon: Settings,
    color: "text-secondary",
    action: () => {
      // TODO: Implement settings
      console.log("Settings");
    },
  },
];

export function QuickActions() {
  return (
    <Card className="mt-8 discord-card border">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-white">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Button
              key={action.name}
              variant="ghost"
              className="flex flex-col items-center gap-2 p-4 hover-card h-auto"
              onClick={action.action}
            >
              <action.icon className={`w-5 h-5 ${action.color}`} />
              <span className="text-sm text-secondary">{action.name}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
