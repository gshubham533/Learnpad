import type { Metadata } from "next";
import { Toaster } from "sonner";
import { Nav } from "@/components/Nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "Learnpad",
  description: "A launchpad for learning by building",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <Nav />
        <main className="mx-auto max-w-6xl p-4 md:p-6">{children}</main>
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
