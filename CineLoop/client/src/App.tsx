import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import Search from "@/pages/search";
import Create from "@/pages/create";
import Profile from "@/pages/profile";
import Title from "@/pages/title";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/search" component={Search} />
          <Route path="/create" component={Create} />
          <Route path="/profile/:username?" component={Profile} />
          <Route path="/title/:id" component={Title} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-cine-black text-cine-text font-inter">
          <Toaster />
          <Router />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Router, Route, Switch } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "next-themes";

import LandingPage from "@/pages/landing";
import HomePage from "@/pages/home";
import SearchPage from "@/pages/search";
import CreatePage from "@/pages/create";
import ProfilePage from "@/pages/profile";
import TitlePage from "@/pages/title";
import NotFoundPage from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <Router>
          <div className="min-h-screen bg-background text-foreground">
            <Switch>
              <Route path="/" component={LandingPage} />
              <Route path="/home" component={HomePage} />
              <Route path="/search" component={SearchPage} />
              <Route path="/create" component={CreatePage} />
              <Route path="/profile" component={ProfilePage} />
              <Route path="/title/:id" component={TitlePage} />
              <Route component={NotFoundPage} />
            </Switch>
          </div>
        </Router>
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
