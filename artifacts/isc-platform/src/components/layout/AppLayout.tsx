import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";
import { Show } from "@clerk/react";
import { ChatbotWidget } from "@/components/ChatbotWidget";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Show when="signed-in">
          <Sidebar />
        </Show>
        <main className="flex-1 overflow-y-auto relative">
          {children}
          <ChatbotWidget />
        </main>
      </div>
    </div>
  );
}
