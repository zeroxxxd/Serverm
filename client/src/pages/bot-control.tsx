import { BotControls } from "@/components/dashboard/bot-controls";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function BotControl() {
  return (
    <div>
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-white">Bot Control</h1>
        <p className="text-secondary">Control and configure your Minecraft AFK bot</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BotControls />
        
        <Card className="discord-card border">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white">Bot Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-secondary">Version:</span>
                <span className="text-white">v2.1</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary">Minecraft Version:</span>
                <span className="text-white">1.12.1</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary">Library:</span>
                <span className="text-white">Mineflayer</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary">Status:</span>
                <span className="text-green-500">Ready</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
