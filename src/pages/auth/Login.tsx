import { useCsrfProtection } from '@/utils/csrfProtection';
import LoginForm from '@/components/auth/LoginForm';
import { useLoginForm } from '@/hooks/useLoginForm';
import { validateEmail } from '@/utils/inputValidation';
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import p13Asset from '@/assets/botijao-p13.png.asset.json';
import p20Asset from '@/assets/botijao-p20.png.asset.json';
import p45Asset from '@/assets/botijao-p45.png.asset.json';
import waterAsset from '@/assets/galao-agua.png.asset.json';

function ProductShowcase({ className = '' }: { className?: string }) {
  return (
    <div className={`relative w-full ${className}`}>
      <div className="absolute inset-x-6 bottom-2 h-10 rounded-[50%] bg-black/50 blur-2xl" />
      <div className="relative flex items-end justify-center gap-[2%]">
        {/* P45 - fundo esquerda */}
        <img
          src={p45Asset.url}
          alt="Botijão de gás P45"
          loading="lazy"
          className="w-[20%] origin-bottom translate-y-1 scale-95 opacity-70 blur-[1px] drop-shadow-[0_18px_35px_rgba(0,0,0,0.55)] animate-[float_9s_ease-in-out_infinite]"
        />
        {/* P13 - principal */}
        <img
          src={p13Asset.url}
          alt="Botijão de gás P13"
          className="relative z-10 w-[34%] drop-shadow-[0_28px_60px_rgba(0,0,0,0.65)] animate-[float_6s_ease-in-out_infinite]"
        />
        {/* P20 - fundo direita */}
        <img
          src={p20Asset.url}
          alt="Botijão de gás P20"
          loading="lazy"
          className="w-[15%] origin-bottom translate-y-1 scale-95 opacity-70 blur-[1px] drop-shadow-[0_18px_35px_rgba(0,0,0,0.55)] animate-[float_11s_ease-in-out_infinite_reverse]"
        />
        {/* Galão de água */}
        <img
          src={waterAsset.url}
          alt="Galão de água 20 litros"
          className="relative z-10 w-[26%] drop-shadow-[0_24px_50px_rgba(0,0,0,0.6)] animate-[float_7s_ease-in-out_infinite_reverse]"
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
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [user, navigate, location]);

  const handleFormSubmit = async (email: string, password: string): Promise<void> => {
    const validatedEmail = validateEmail(email);
    return await handleSubmit(validatedEmail, password, csrfToken);
  };

  if (user) return null;

  return (
    <div className="relative flex min-h-screen w-full overflow-hidden bg-[#0b1220]">
      {/* Animated gradient background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(249,115,22,0.25),transparent_55%),radial-gradient(circle_at_80%_70%,rgba(56,189,248,0.25),transparent_55%),radial-gradient(circle_at_50%_100%,rgba(139,92,246,0.18),transparent_60%)] animate-[pulse_8s_ease-in-out_infinite]" />
        {/* Floating orbs */}
        <div className="absolute top-1/4 left-1/3 h-72 w-72 rounded-full bg-orange-500/20 blur-3xl animate-[float_10s_ease-in-out_infinite]" />
        <div className="absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full bg-sky-500/20 blur-3xl animate-[float_12s_ease-in-out_infinite_reverse]" />
      </div>

      <div className="m-auto grid w-full max-w-6xl grid-cols-1 items-center gap-10 px-6 py-12 lg:grid-cols-2">
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
        <div className="flex flex-col items-center w-full animate-[fade-in_0.8s_ease-out_0.2s_both]">
          {/* Mobile hero */}
          <ProductShowcase className="lg:hidden max-w-xs mb-6" />

          <h1 className="text-4xl font-bold text-center text-white mb-2 tracking-tight">
            GasFlow <span className="bg-gradient-to-r from-orange-400 to-sky-400 bg-clip-text text-transparent">Aqua</span>
          </h1>
          <p className="text-white/60 mb-8 text-center text-sm">
            Sistema de gestão para distribuição de gás e água
          </p>

          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:border-white/20">
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
