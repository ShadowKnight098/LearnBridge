import type { Metadata } from "next";
import "./globals.css";
import { I18nProvider } from "../lib/i18n";

export const metadata: Metadata = {
  title: "LearnBridge — Empowering Every Learner",
  description: "Trilingual adaptive foundational learning platform for students, teachers, and schools.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-purple-200">
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
