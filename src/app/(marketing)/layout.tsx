import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

/**
 * Route group (marketing): agrupa landing, catálogo de plantillas y precios
 * bajo un shell visual común (Header/Footer) sin afectar las URLs — sigue
 * viviendo en "/", "/plantillas", "/precios". El wizard, el dashboard y la
 * página pública de invitación quedan fuera a propósito: no necesitan
 * navegación de marketing.
 */
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  );
}
