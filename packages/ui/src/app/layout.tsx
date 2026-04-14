import type { Metadata } from "next";
import "./globals.css";

// Force all routes to render dynamically (no SSG) so the build doesn't try to
// statically pre-render pages — which would require connecting to the sandbox.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ZK Card",
  description: "Proving payment card ownership with Aztec ZK Notes",
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
