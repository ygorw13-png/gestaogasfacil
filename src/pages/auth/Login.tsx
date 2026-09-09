import { useCsrfProtection } from '@/utils/csrfProtection';
import LoginForm from '@/components/auth/LoginForm';
import { useLoginForm } from '@/hooks/useLoginForm';
import { validateEmail } from '@/utils/inputValidation';
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import p13Img from '@/assets/botijao-p13.png';
import p20Img from '@/assets/botijao-p20.png';
import p45Img from '@/assets/botijao-p45.png';
import waterImg from '@/assets/galao-agua.png';

function ProductShowcase({ className = '' }: { className?: string }) {
  return (
    <div className={`relative w-full ${className}`}>
      <div className="absolute inset-x-[15%] bottom-1 h-6 rounded-[50%] bg-black/50 blur-2xl sm:h-10" />
      <div className="relative flex h-[38vw] max-h-[300px] min-h-[130px] items-end justify-center gap-[3%] lg:h-[340px] lg:max-h-none">
        {/* P45 - fundo esquerda */}
        <img
          src={p45Img}
          alt="Botijão de gás P45"
          loading="lazy"
          className="h-[62%] w-auto max-w-[22%] origin-bottom object-contain object-bottom opacity-80 drop-shadow-[0_18px_35px_rgba(0,0,0,0.55)] animate-[float_9s_ease-in-out_infinite]"
        />
        {/* P13 - principal */}
        <img
          src={p13Img}
          alt="Botijão de gás P13"
          className="relative z-10 h-[80%] w-auto max-w-[34%] object-contain object-bottom drop-shadow-[0_28px_60px_rgba(0,0,0,0.65)] animate-[float_6s_ease-in-out_infinite]"
        />
        {/* P20 - fundo direita */}
        <img
          src={p20Img}
          alt="Botijão de gás P20"
          loading="lazy"
          className="h-[58%] w-auto max-w-[18%] origin-bottom object-contain object-bottom opacity-80 drop-shadow-[0_18px_35px_rgba(0,0,0,0.55)] animate-[float_11s_ease-in-out_infinite_reverse]"
        />
        {/* Galão de água */}
        <img
          src={waterImg}
          alt="Galão de água 20 litros"
          className="relative z-10 h-[72%] w-auto max-w-[26%] object-contain object-bottom drop-shadow-[0_24px_50px_rgba(0,0,0,0.6)] animate-[float_7s_ease-in-out_infinite_reverse]"
        />
      </div>
    </div>
  );
}


export default function Login() {
  const { loading, error, user, handleSubmit } = useLoginForm();
  const { csrfToken } = useCsrfProtection();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (user) {
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [user, navigate, location]);

  const handleFormSubmit = async (email: string, password: string): Promise<void> => {
    const validatedEmail = validateEmail(email);
    return await handleSubmit(validatedEmail, password, csrfToken);
  };

  if (user) return null;

  return (
    <div className="relative flex min-h-[100dvh] w-full overflow-x-hidden bg-[#0b1220]">
      {/* Animated gradient background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(249,115,22,0.25),transparent_55%),radial-gradient(circle_at_80%_70%,rgba(56,189,248,0.25),transparent_55%),radial-gradient(circle_at_50%_100%,rgba(139,92,246,0.18),transparent_60%)] animate-[pulse_8s_ease-in-out_infinite]" />
        {/* Floating orbs */}
        <div className="absolute top-1/4 left-1/3 h-48 w-48 rounded-full bg-orange-500/20 blur-3xl animate-[float_10s_ease-in-out_infinite] sm:h-72 sm:w-72" />
        <div className="absolute bottom-1/4 right-1/4 h-56 w-56 rounded-full bg-sky-500/20 blur-3xl animate-[float_12s_ease-in-out_infinite_reverse] sm:h-80 sm:w-80" />
      </div>

      <div
        className="m-auto grid w-full max-w-6xl grid-cols-1 items-center gap-8 px-4 py-8 sm:px-6 sm:py-12 lg:grid-cols-2 lg:gap-10"
        style={{
          paddingTop: 'max(2rem, env(safe-area-inset-top))',
          paddingBottom: 'max(2rem, env(safe-area-inset-bottom))',
        }}
      >
        {/* Hero image side */}
        <div className="relative hidden lg:flex flex-col items-center justify-center animate-[fade-in_0.8s_ease-out]">
          <div className="relative w-full max-w-xl">
            <div className="absolute inset-0 bg-gradient-to-t from-orange-500/25 via-transparent to-sky-400/20 blur-3xl scale-110" />
            <ProductShowcase />
          </div>
          <div className="mt-8 text-center animate-[fade-in_1s_ease-out_0.3s_both]">
            <h2 className="text-2xl font-semibold text-white/90">Gás & Água</h2>
            <p className="mt-2 text-sm text-white/60">Gestão completa para sua distribuidora</p>
          </div>
        </div>

        {/* Form side */}
        <div className="flex w-full flex-col items-center animate-[fade-in_0.8s_ease-out_0.2s_both]">
          {/* Mobile hero */}
          <ProductShowcase className="mb-4 max-w-[340px] sm:mb-6 lg:hidden" />

          <h1 className="mb-2 text-center text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Gás<span className="bg-gradient-to-r from-orange-400 to-sky-400 bg-clip-text text-transparent">Fácil</span>
          </h1>
          <p className="mb-6 text-center text-sm text-white/60 sm:mb-8">
            Sistema de gestão para distribuição de gás e água
          </p>

          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:border-white/20 sm:p-8">
            <LoginForm
              onSubmit={handleFormSubmit}
              loading={loading}
              error={error?.message || null}
              csrfToken={csrfToken}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

