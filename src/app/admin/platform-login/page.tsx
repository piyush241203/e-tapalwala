'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2, Lock, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { getErrorMessage } from '@/lib/utils';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function PlatformLoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      const res = await api.post('/admin/auth/login', data);
      const { user, accessToken, refreshToken } = res.data;
      setAuth(user, accessToken, refreshToken);
      router.push('/super-admin/dashboard');
      // Intentionally keep isLoading true during route transition
    } catch (err) {
      toast.error(getErrorMessage(err));
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle grid background */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
      {/* Corner glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-red-900/20 blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-sm">
        {/* Warning Badge */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="flex items-center gap-2 bg-red-950/60 border border-red-800/40 text-red-400 text-xs font-medium px-3 py-1.5 rounded-full">
            <ShieldAlert size={12} />
            Authorized Personnel Only
          </div>
        </div>

        {/* Card */}
        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/8 rounded-2xl shadow-2xl overflow-hidden">
          {/* Header stripe */}
          <div className="bg-red-950/30 border-b border-red-900/30 px-7 py-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-red-900/50 border border-red-700/40 flex items-center justify-center">
                <Lock size={16} className="text-red-400" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-white">Platform Administration</h1>
                <p className="text-xs text-slate-500">Internal access only</p>
              </div>
            </div>
          </div>

          <div className="p-7 space-y-4">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5" htmlFor="admin-email">
                  Administrator Email
                </label>
                <input
                  id="admin-email"
                  type="email"
                  placeholder="admin@etapalwala.gov.in"
                  autoComplete="off"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-red-700/60 focus:bg-white/8 transition-all"
                  {...register('email')}
                />
                {errors.email && (
                  <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5" htmlFor="admin-password">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="admin-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••••••"
                    autoComplete="current-password"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-red-700/60 focus:bg-white/8 transition-all pr-10"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                id="btn-platform-login"
                className="w-full bg-red-900 hover:bg-red-800 border border-red-700/50 text-white font-semibold py-2.5 rounded-lg mt-2 flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    <Lock size={14} />
                    Access Platform
                  </>
                )}
              </button>
            </form>

            <p className="text-center text-xs text-slate-700 pt-2">
              All access attempts are logged and monitored.
            </p>
          </div>
        </div>

        {/* No branding — intentionally minimal */}
        <p className="text-center text-xs text-slate-800 mt-4">
          E-Tapalwala · Restricted Area
        </p>
      </div>
    </div>
  );
}
