import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ??
    requestHeaders.get("host") ??
    "localhost:3001";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";
  const metadataBase = new URL(`${protocol}://${host}`);

  return {
    metadataBase,
    title: "Branchline - Visual AI Workflows",
    description:
      "Build and run durable YES/NO AI decision workflows on a visual canvas.",
    openGraph: {
      title: "Branchline - Visual AI Workflows",
      description: "Connect binary AI decisions and watch every branch execute.",
      type: "website",
      images: [{ url: "/og.png", width: 1536, height: 1024, alt: "Branchline visual AI workflow canvas" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Branchline - Visual AI Workflows",
      description: "Connect binary AI decisions and watch every branch execute.",
      images: ["/og.png"],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
