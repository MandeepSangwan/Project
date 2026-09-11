import type { Metadata } from "next";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "FixFleet — On-Demand Technician Marketplace",
  description:
    "Connect with verified technicians for industrial repair, maintenance, and everyday service needs. Get matched in minutes, not days.",
  keywords: [
    "technician",
    "repair",
    "maintenance",
    "factory",
    "on-demand",
    "marketplace",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
