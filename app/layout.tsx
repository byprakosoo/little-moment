import type { Metadata } from "next";
import "./globals.css";
import { DemoProvider } from "@/components/demo-store";

export const metadata: Metadata = {
  title: "Little Moment",
  description: "Jurnal privat untuk momen kecil keluarga.",
  icons: {
    icon: "/little-moment.svg",
    shortcut: "/little-moment.svg",
    apple: "/little-moment.svg",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>
        <DemoProvider>{children}</DemoProvider>
      </body>
    </html>
  );
}
