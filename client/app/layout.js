import "./globals.css";
import { Providers } from "./providers";

export const metadata = {
  title: "IELTS Scholar - Master the Academic IELTS",
  description:
    "Structured practice, AI-powered scoring, and expert feedback in one place. Prepare with a platform designed for serious academic success.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen antialiased" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
