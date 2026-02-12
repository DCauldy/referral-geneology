import { SupabaseProvider } from "@/components/providers/supabase-provider";
import { OrgProvider } from "@/components/providers/org-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { ToastProvider } from "@/components/providers/toast-provider";
import { AdminShell } from "@/components/admin/admin-shell";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <SupabaseProvider>
      <ThemeProvider>
        <OrgProvider>
          <ToastProvider>
            <AdminShell>{children}</AdminShell>
          </ToastProvider>
        </OrgProvider>
      </ThemeProvider>
    </SupabaseProvider>
  );
}
