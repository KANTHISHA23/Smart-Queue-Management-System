import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { SocketProvider } from "@/context/SocketContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ToastProvider from "@/components/ToastProvider";

const SITE_TITLE = "SmartQueue - Smart Queue Management System";
const SITE_DESCRIPTION =
  "Book digital tokens remotely and skip long waiting lines. Real-time queue tracking for hospitals, clinics, and offices.";
const SITE_KEYWORDS =
  "queue management, digital token, hospital queue, smart queue, online booking";

/**
 * Avoid `export const metadata` / streaming Metadata tree: extensions (e.g. pronunciation /
 * read-aloud tools) inject nodes like `pronounceRootElement` + `<audio>` into Next's hidden
 * metadata placeholder before hydration, which causes React "Hydration failed" in dev.
 * Static <head> keeps server and client markup aligned.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
    >
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{SITE_TITLE}</title>
        <meta name="description" content={SITE_DESCRIPTION} />
        <meta name="keywords" content={SITE_KEYWORDS} />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        <AuthProvider>
          <ToastProvider>
            <SocketProvider>
              <div className="min-h-screen flex flex-col" suppressHydrationWarning>
                <Navbar />
                <main className="flex-grow">{children}</main>
                <Footer />
              </div>
            </SocketProvider>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
