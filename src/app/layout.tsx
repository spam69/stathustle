
import type {Metadata} from 'next';
import './globals.css';
import { Providers } from '@/components/providers'; // Import the new Providers component
import GlobalCommentsModal from '@/components/global-comments-modal';

export const metadata: Metadata = {
  title: 'StatHustle Social',
  description: 'Social and analytics platform for fantasy sports enthusiasts.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <Providers>
          {children}
          <GlobalCommentsModal />
        </Providers>
      </body>
    </html>
  );
}
