
import { Helmet } from 'react-helmet-async';

export const SecurityHeaders: React.FC = () => {
  return (
    <Helmet>
      {/* HTTP Strict Transport Security */}
      <meta httpEquiv="Strict-Transport-Security" content="max-age=31536000; includeSubDomains; preload" />
      
      {/* Content Security Policy para prevenir XSS */}
      <meta httpEquiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.gpteng.co; connect-src 'self' https://*.supabase.co; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; font-src 'self' data:;" />
      
      {/* Prevenir clickjacking */}
      <meta httpEquiv="X-Frame-Options" content="DENY" />
      
      {/* Evitar MIME type sniffing */}
      <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
      
      {/* Referrer Policy */}
      <meta httpEquiv="Referrer-Policy" content="strict-origin-when-cross-origin" />
      
      {/* Desativar cache para conteúdo sensível */}
      <meta httpEquiv="Cache-Control" content="no-store, no-cache, must-revalidate, proxy-revalidate" />
      <meta httpEquiv="Pragma" content="no-cache" />
      <meta httpEquiv="Expires" content="0" />
    </Helmet>
  );
};
