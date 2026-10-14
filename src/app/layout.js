import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Hotel Khuji — Transit Hotel PMS",
  description:
    "Hyper-fast Property Management System for transit hotels near Ashkona Airport. Manage rooms, walk-ins, and online bookings in one place.",
  keywords: ["hotel", "PMS", "transit", "Ashkona", "airport", "booking"],
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-surface-0 text-zinc-50">
        {children}
      </body>
    </html>
  );
}
