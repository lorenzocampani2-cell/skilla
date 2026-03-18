"use client";
// ============================================================
// SKILLA — App Layout (area autenticata)
// Struttura principale: sidebar + content + bottom nav mobile.
// ============================================================

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/lib/store/useAppStore";
import { useAuth } from "@/components/providers/AuthProvider";
import { BottomNav } from "@/components/layout/BottomNav";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { InterfaceModeSwitcher } from "@/components/ui/InterfaceModeSwitcher";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isLoading } = useAuth();
  const { currentUser, sidebarOpen, interfaceMode } = useAppStore();
  const router = useRouter();

  // Redirect al login se non autenticato
  useEffect(() => {
    if (!isLoading && !currentUser) {
      router.push("/");
    }
  }, [currentUser, isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="text-5xl animate-bounce">⛷️</div>
          <p className="font-semibold" style={{ color: "var(--text-secondary)" }}>
            Caricamento SKILLA...
          </p>
        </div>
      </div>
    );
  }

  if (!currentUser) return null;

  // In modalità Emergency: layout massimamente semplificato
  if (interfaceMode === "emergency") {
    return (
      <div className="min-h-screen flex flex-col">
        <InterfaceModeSwitcher />
        <main className="flex-1 overflow-auto p-4">
          {children}
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex overflow-hidden">

      {/* Sidebar — solo desktop */}
      <aside className="hidden md:flex">
        <Sidebar />
      </aside>

      {/* Sidebar mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
              onClick={() => useAppStore.getState().setSidebarOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="md:hidden fixed left-0 top-0 bottom-0 z-50 w-72"
            >
              <Sidebar />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Contenuto principale */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar />

        <main className="flex-1 overflow-auto touch-scroll">
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {children}
          </motion.div>
        </main>

        {/* Bottom nav — solo mobile */}
        <div className="md:hidden">
          <BottomNav />
        </div>
      </div>
    </div>
  );
}
