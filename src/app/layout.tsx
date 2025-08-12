import type { Metadata } from "next";
import './globals.css'
import { Rubik, Rubik_Bubbles } from "next/font/google";
import "./globals.css";

const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["latin"],
});

const rubikBubbles = Rubik_Bubbles({
  variable: "--font-rubik-bubbles",
  subsets: ["latin"],
  weight: "400",
});

export const metadata = {
  title: "SMP Post Scheduler", 
  description: "Schedule and manage your posts easily.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${rubik.variable} ${rubikBubbles.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
