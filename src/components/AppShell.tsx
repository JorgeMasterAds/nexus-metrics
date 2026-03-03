import { createContext, useContext, useState, ReactNode } from "react";
import AppSidebar from "./AppSidebar";
import SaleCelebration from "./SaleCelebration";

interface ShellContextType {
  toggleMobile: () => void;
}

const ShellContext = createContext<ShellContextType>({ toggleMobile: () => {} });

export const useShell = () => useContext(ShellContext);

export default function AppShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <ShellContext.Provider value={{ toggleMobile: () => setMobileOpen((v) => !v) }}>
      <div className="min-h-screen flex flex-col dark-gradient">
        <SaleCelebration />
        <div className="flex flex-1">
          <AppSidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
          <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
            {children}
          </div>
        </div>
      </div>
    </ShellContext.Provider>
  );
}
