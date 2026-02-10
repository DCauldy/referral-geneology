import { SupabaseProvider } from "@/components/providers/supabase-provider";
import { OrgProvider } from "@/components/providers/org-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { ToastProvider } from "@/components/providers/toast-provider";
import { AppShell } from "@/components/layout/app-shell";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SupabaseProvider>
      <ThemeProvider>
        <OrgProvider>
          <ToastProvider>
            <AppShell>{children}</AppShell>
          </ToastProvider>
        </OrgProvider>
      </ThemeProvider>
    </SupabaseProvider>
  );
}
