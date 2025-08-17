import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from './AuthProvider';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Initialize message reset service
if (typeof window === 'undefined') {
  import('@/lib/messageResetService').then(({ initializeMessageResetService }) => {
    initializeMessageResetService();
  }).catch(console.error);
}

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: "RealAnima AI",
  description: "Chat with your favorite anime characters",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className} suppressHydrationWarning={true}>
        <AuthProvider>
          {children}
        </AuthProvider>
        <ToastContainer />
      </body>
    </html>
  );
}