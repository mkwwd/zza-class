import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ZZA Video',
  description: '짧은 드라마를 고르고 이어보는 ZZA Video',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
