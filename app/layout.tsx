import { Inter } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/layout/header';
import { Provider } from 'jotai';
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: '지게차 렌탈 통합 운영 시스템',
  description: '지게차 렌탈 사업을 위한 렌탈사, 지게차, 계약, 정산, 계정 등을 관리하는 통합 운영 시스템입니다.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <Provider>
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow container mx-auto px-4 py-8 md:px-6 lg:px-8">
              {children}
            </main>
            <Toaster richColors position="top-right" />
          </div>
        </Provider>
      </body>
    </html>
  );
}