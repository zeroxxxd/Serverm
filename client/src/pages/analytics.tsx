import { ActivityChart } from "@/components/dashboard/activity-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";

export default function Analytics() {
  const { data: stats } = useQuery({
    queryKey: ["/api/stats"],
  });

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <p className="text-secondary">View detailed bot analytics and statistics</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="discord-card border">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white">Total Uptime</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">89.2%</div>
            <p className="text-secondary">Last 30 days</p>
          </CardContent>
        </Card>

        <Card className="discord-card border">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white">Messages Sent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">1,247</div>
            <p className="text-secondary">Total messages</p>
          </CardContent>
        </Card>

        <Card className="discord-card border">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white">Reconnections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">12</div>
            <p className="text-secondary">This month</p>
          </CardContent>
        </Card>
      </div>

      <ActivityChart />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <Card className="discord-card border">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white">Server Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-secondary">Average Response Time</span>
                <span className="text-white">45ms</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-secondary">Connection Success Rate</span>
                <span className="text-green-500">98.3%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-secondary">Peak Online Time</span>
                <span className="text-white">18:30 - 22:00</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="discord-card border">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white">Activity Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-secondary">Total Sessions</span>
                <span className="text-white">156</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-secondary">Average Session Duration</span>
                <span className="text-white">2h 34m</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-secondary">Longest Session</span>
                <span className="text-white">8h 12m</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
