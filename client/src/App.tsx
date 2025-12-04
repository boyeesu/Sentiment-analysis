import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import interswitchLogo from "@assets/interswitch_logo_(2)_1764834997796.png";

import interswitch_logo__2_ from "@assets/interswitch_logo (2).png";

function Header() {
  return (
    <header className="sticky top-0 z-50 w-full h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between gap-4">
        <div className="flex items-center gap-2" data-testid="container-logo">
          <img src={interswitch_logo__2_} alt="Interswitch" className="h-6" />
        </div>
        <nav className="flex items-center gap-4">
          <span className="text-sm font-medium uppercase tracking-wide text-primary" data-testid="text-nav-title">
            Sentiment Analysis
          </span>
        </nav>
      </div>
    </header>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-1">
            <Router />
          </main>
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
