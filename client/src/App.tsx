import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/dashboard";
import BotControl from "@/pages/bot-control";
import BotRotation from "@/pages/bot-rotation";
import Servers from "@/pages/servers";
import ChatLogs from "@/pages/chat-logs";
import Configuration from "@/pages/configuration";
import Analytics from "@/pages/analytics";
import NotFound from "@/pages/not-found";
import { AppSidebar } from "@/components/ui/sidebar";
import { useTheme } from "@/hooks/use-theme";

function Router() {
  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <main className="flex-1 ml-64 p-6">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/bot-control" component={BotControl} />
          <Route path="/bot-rotation" component={BotRotation} />
          <Route path="/servers" component={Servers} />
          <Route path="/chat-logs" component={ChatLogs} />
          <Route path="/configuration" component={Configuration} />
          <Route path="/analytics" component={Analytics} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  const { theme } = useTheme();
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className={theme}>
          <Toaster />
          <Router />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
