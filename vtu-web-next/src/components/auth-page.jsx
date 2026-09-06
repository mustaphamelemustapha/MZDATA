'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiFetch, clearAuth, getToken, loginRequest, registerRequest, setAuthTokens, setProfile, warmBackend } from '@/lib/api';

/* ─── Nigerian states ─── */
const STATES = [
  'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno',
  'Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT','Gombe','Imo',
  'Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos','Nasarawa',
  'Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba',
  'Yobe','Zamfara'
];

/* ─── Icon components (inline SVG — no library dependency) ─── */
const UserIcon = () => (
  <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
  </svg>
);
const PhoneIcon = () => (
  <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
  </svg>
);
const LockIcon = () => (
  <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
  </svg>
);
const EyeIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);
const EyeOffIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
  </svg>
);
const MapPinIcon = () => (
  <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
  </svg>
);
const MailIcon = () => (
  <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
  </svg>
);
const LoginIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
  </svg>
);
const CreateIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
  </svg>
);

/* ─── Shared input wrapper with icon ─── */
function InputField({ icon, children, label }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[13px] font-medium text-slate-300">{label}</label>
      <div className="relative">
        <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2">
          {icon}
        </div>
        {children}
      </div>
    </div>
  );
}

export function AuthPage({ initialMode, refCode: presetRef }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ref = presetRef || searchParams?.get('ref') || '';

  const mode = initialMode || 'login';
  const isRegister = mode === 'register';

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [form, setForm] = useState({
    full_name: '',
    phone_number: '',
    email: '',
    password: '',
    state: '',
    referral_code: ref,
  });

  useEffect(() => {
    if (getToken()) router.replace('/dashboard');
  }, [router]);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (ref) setForm((p) => ({ ...p, referral_code: ref }));
  }, [ref]);

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await warmBackend();
      if (isRegister) {
        const data = await registerRequest({
          full_name: form.full_name.trim(),
          email: form.email || null,
          phone_number: form.phone_number || null,
          password: form.password,
          referral_code: form.referral_code || null,
        });
        const access = data?.access_token || data?.token;
        const refresh = data?.refresh_token;
        if (access) {
          setAuthTokens(access, refresh, true);
          const me = await apiFetch('/auth/me');
          setProfile(me);
          router.push('/dashboard');
          return;
        }
        const loginData = await loginRequest(form.phone_number || form.email, form.password);
        setAuthTokens(loginData?.access_token || loginData?.token, loginData?.refresh_token, true);
        const me = await apiFetch('/auth/me');
        setProfile(me);
        router.push('/dashboard');
      } else {
        const identifier = form.phone_number || form.email;
        const data = await loginRequest(identifier, form.password);
        setAuthTokens(data?.access_token || data?.token, data?.refresh_token, true);
        const me = await apiFetch('/auth/me');
        setProfile(me);
        router.push('/dashboard');
      }
    } catch (err) {
      clearAuth();
      setError(err?.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /* shared input classes */
  const inputCls =
    'w-full h-[46px] rounded-lg border border-slate-700 bg-slate-800/60 pl-10 pr-4 text-[14px] text-slate-100 placeholder:text-slate-500 caret-blue-400 shadow-none outline-none transition-all duration-150 hover:border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">

      {/* ─── Minimal navbar (register page only — Amigo style) ─── */}
      {isRegister ? null : (
        <header className="border-b border-slate-800/60 bg-slate-900/40 backdrop-blur-md">
          <div className="mx-auto flex h-12 max-w-md items-center justify-between px-4">
            <Link href="/" className="text-[15px] font-bold text-white tracking-tight">
              Mele Data
            </Link>
            <div className="flex items-center gap-2">
              <Link
                href="/register"
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-[12px] font-semibold text-white transition-all hover:bg-blue-500 active:scale-[0.97]"
              >
                <CreateIcon /> Create account
              </Link>
            </div>
          </div>
        </header>
      )}

      {/* ─── Centered form ─── */}
      <div
        className={`flex min-h-[calc(100vh-49px)] items-center justify-center px-4 py-10 transition-all duration-200 ease-out ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
        }`}
      >
        <div className="w-full max-w-[420px]">

          {/* ─── Card ─── */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 px-6 py-8 shadow-2xl shadow-black/30 sm:px-8 sm:py-10">

            {/* Logo + heading */}
            <div className="text-center mb-7">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800 ring-1 ring-slate-700">
                <img src="/brand/meledata-icon.png" alt="Mele Data" className="h-8 w-8 object-contain" />
              </div>
              <h1 className="text-[22px] font-semibold text-white tracking-[-0.02em]">
                {isRegister ? 'Create your account' : 'Welcome back'}
              </h1>
              <p className="mt-1 text-[13px] text-slate-400">
                {isRegister ? "A few details and you're in" : 'Sign in to your Mele Data account'}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={submit} className="space-y-4">

              {isRegister ? (
                <>
                  {/* Full name */}
                  <InputField label="Full name" icon={<UserIcon />}>
                    <input
                      className={inputCls}
                      value={form.full_name}
                      onChange={set('full_name')}
                      placeholder="e.g. John Doe"
                      autoComplete="name"
                      required
                    />
                  </InputField>

                  {/* Phone */}
                  <InputField label="Phone number" icon={<PhoneIcon />}>
                    <input
                      className={inputCls}
                      value={form.phone_number}
                      onChange={set('phone_number')}
                      placeholder="0803 000 0000"
                      autoComplete="tel"
                      inputMode="tel"
                      required
                    />
                  </InputField>

                  {/* Email */}
                  <InputField label="Email" icon={<MailIcon />}>
                    <input
                      className={inputCls}
                      value={form.email}
                      onChange={set('email')}
                      placeholder="you@example.com"
                      autoComplete="email"
                      type="email"
                    />
                  </InputField>

                  {/* Password */}
                  <InputField label="Password" icon={<LockIcon />}>
                    <input
                      className={`${inputCls} !pr-11`}
                      value={form.password}
                      onChange={set('password')}
                      placeholder="At least 6 characters"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </InputField>

                  {/* Referral code */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[13px] font-medium text-slate-300">Referral code</label>
                      <span className="text-[11px] text-slate-500 font-medium">Optional</span>
                    </div>
                    <div className="relative">
                      <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2">
                        <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                        </svg>
                      </div>
                      <input
                        className={inputCls}
                        value={form.referral_code}
                        onChange={set('referral_code')}
                        placeholder="Enter a friend's code"
                        autoComplete="off"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Phone, username or name */}
                  <InputField label="Phone, username or name" icon={<UserIcon />}>
                    <input
                      className={inputCls}
                      value={form.phone_number || form.email}
                      onChange={(e) => {
                        const v = e.target.value;
                        // If it looks like a number, put it in phone_number, otherwise email
                        if (/^\d/.test(v)) {
                          setForm((p) => ({ ...p, phone_number: v, email: '' }));
                        } else {
                          setForm((p) => ({ ...p, email: v, phone_number: '' }));
                        }
                      }}
                      placeholder="e.g. 0803... or your name"
                      autoComplete="username"
                      required
                    />
                  </InputField>

                  {/* Password */}
                  <InputField label="Password" icon={<LockIcon />}>
                    <input
                      className={`${inputCls} !pr-11`}
                      value={form.password}
                      onChange={set('password')}
                      placeholder="••••••••"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </InputField>

                  {/* Trouble signing in */}
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="text-slate-500">Trouble signing in?</span>
                    <Link href="/forgot-password" className="text-blue-400 hover:text-blue-300 transition-colors font-medium">
                      Forgot password
                    </Link>
                  </div>
                </>
              )}

              {/* Error */}
              {error && (
                <div className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-4 py-2.5 text-[13px] text-rose-300">
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 h-[46px] text-[14px] font-semibold text-white shadow-lg shadow-blue-600/20 transition-all duration-150 hover:bg-blue-500 hover:shadow-blue-500/25 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : isRegister ? (
                  <CreateIcon />
                ) : (
                  <LoginIcon />
                )}
                {isRegister ? 'Create account' : 'Sign in'}
              </button>
            </form>

            {/* Footer text */}
            <div className="mt-5 text-center text-[12px] text-slate-400 leading-5">
              {isRegister ? (
                <>
                  By creating an account you agree to our{' '}
                  <Link href="/terms" className="text-blue-400 hover:text-blue-300 transition-colors">terms</Link>.
                  <br />
                  Already have one?{' '}
                  <Link href="/login" className="text-blue-400 hover:text-blue-300 transition-colors font-medium">Sign in</Link>
                </>
              ) : (
                <>
                  New to Mele Data?{' '}
                  <Link href="/register" className="text-blue-400 hover:text-blue-300 transition-colors font-medium">Create an account</Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
