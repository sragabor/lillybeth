import { FrontendLanguageProvider } from '@/contexts/FrontendLanguageContext';
import { BookingCartProvider } from '@/contexts/BookingCartContext';
import { Header, Footer } from '@/components/frontend/layout';

export default function FrontendLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FrontendLanguageProvider>
      <BookingCartProvider>
        <div className="min-h-screen flex flex-col bg-white">
          <Header />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </div>
      </BookingCartProvider>
    </FrontendLanguageProvider>
  );
}
