
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/footer';
import { Toaster } from "@/components/ui/toaster";
import { AppProviders } from '@/components/layout/app-providers';
import { APP_NAME } from '@/lib/constants'; // Import APP_NAME

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },
  description: 'Tracking Nepali politicians, parties, and governance for a transparent democracy.',
  icons: {
    icon: [
      { url: '/logo.png', type: 'image/png', sizes: 'any' },
    ],
    shortcut: ['/logo.png'],
    apple: ['/logo.png'],
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body 
        className={`${geistSans.variable} ${geistMono.variable} font-sans flex flex-col min-h-screen`}
        suppressHydrationWarning={true} // Keep this if you still have hydration issues from extensions
      >
        <AppProviders>
          <Header />
          <main className="flex-grow">
            {children}
          </main>
          <Footer />
          <Toaster />
        </AppProviders>
      </body>
    </html>
  );
}
