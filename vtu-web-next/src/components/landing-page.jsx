'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  BadgeCheck,
  Banknote,
  ChevronDown,
  CreditCard,
  FileText,
  Headphones,
  Menu,
  MessageCircle,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Tv2,
  X,
  Wifi,
  Wallet,
  History,
  BookOpen,
  Zap,
  Copy,
  Check,
  Search,
  ExternalLink,
  Layers,
  Activity,
  Clock,
  CheckCircle2,
  Terminal,
  Code2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { getActiveBrand } from '@/lib/brand';
import { apiFetch } from '@/lib/api';

const navLinks = [
  { label: 'Services', href: '#services' },
  { label: 'Live Pricing', href: '#pricing' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'API Docs', href: '/documentation' },
  { label: 'Why Us', href: '#trust' },
  { label: 'FAQ', href: '#faq' },
];

const heroPoints = [
  'Instant Sub-Second Delivery',
  'Automated Virtual Accounts',
  'Wholesale API Rates',
  'Auto-Refund on Failure',
];

const services = [
  {
    icon: Wifi,
    title: 'Buy Data',
    text: 'Purchase mobile data through a guided flow that keeps the steps simple and clear.',
  },
  {
    icon: Smartphone,
    title: 'Buy Airtime',
    text: 'Top up your own line or send airtime to another number with a few taps.',
  },
  {
    icon: Wallet,
    title: 'Fund Wallet',
    text: 'Transfer money to your dedicated account and use the balance for everyday services.',
  },
  {
    icon: CreditCard,
    title: 'Transaction History',
    text: 'Review purchases, receipts, and wallet activity from one organised view.',
  },
  {
    icon: Zap,
    title: 'Electricity',
    text: 'Pay electricity bills in a calm, structured flow when the service is available.',
  },
  {
    icon: Tv2,
    title: 'Cable TV',
    text: 'Renew cable subscriptions in one place without switching between screens.',
  },
  {
    icon: BookOpen,
    title: 'Education PINs',
    text: 'Handle exam and education PIN purchases where that service is enabled.',
  },
  {
    icon: Banknote,
    title: 'Account Funding',
    text: 'Use your dedicated virtual account to fund your wallet and keep the record clear.',
  },
];

const trustPoints = [
  {
    icon: ShieldCheck,
    title: 'Secure wallet system',
    text: 'Wallet activity stays structured and easy to review.',
  },
  {
    icon: BadgeCheck,
    title: 'Transaction PIN',
    text: 'Sensitive actions can be protected with a PIN before confirmation.',
  },
  {
    icon: FileText,
    title: 'Clean receipts',
    text: 'Each payment keeps a record that is easy to revisit later.',
  },
  {
    icon: History,
    title: 'Reliable records',
    text: 'Users can follow what happened without digging through noise.',
  },
];

const aboutBullets = [
  'A simple VTU and payments experience for everyday use',
  'Designed for individuals, small businesses, and resellers',
  'Built around clarity, reliability, and clean account management',
];

const faqs = [
  {
    q: 'How do I fund my wallet?',
    a: "It's super easy! Just transfer money to the dedicated virtual account displayed on your dashboard. Once the transfer is done, your wallet balance will fund automatically and instantly.",
  },
  {
    q: 'How fast is mobile data delivery?',
    a: 'Almost instant! As soon as you confirm your purchase, we process it and the data plan is delivered to your phone line within seconds.',
  },
  {
    q: 'What happens if a transaction fails?',
    a: 'No need to worry. If a transaction fails for any reason (like provider downtime), your money is automatically and instantly refunded back to your wallet balance. You can see the full refund record in your transaction history.',
  },
  {
    q: 'Is my wallet balance safe?',
    a: 'Absolutely. We take security very seriously. Your account and wallet transactions are protected by industry-standard encryption, secure passwords, and active session tokens, ensuring only you can access and spend your funds.',
  },
  {
    q: 'Can I view receipts?',
    a: 'Yes! Every single purchase generates a clean, downloadable receipt detailing your transaction. You can view, download, or share your receipts directly from your transaction history page at any time.',
  },
];

const motionFadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] },
  }),
};

function BrandLogo({ className = '' }) {
  const brand = getActiveBrand();
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`.trim()}>
      <img src={brand.logo} alt={`${brand.name} logo`} className="h-10 w-10 rounded-2xl object-cover shadow-sm" />
      <span className="text-lg font-semibold tracking-tight text-foreground">{brand.name}</span>
    </span>
  );
}

function PageSection({ eyebrow, title, description, align = 'left' }) {
  return (
    <div className={align === 'center' ? 'mx-auto max-w-3xl text-center' : 'max-w-3xl'}>
      <div className="axis-label text-primary">{eyebrow}</div>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{title}</h2>
      {description ? <p className="mt-4 text-lg leading-8 text-muted-foreground">{description}</p> : null}
    </div>
  );
}

function MobileMenu({ open, onClose }) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-slate-950/30 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22 }}
            className="absolute inset-x-4 top-4 rounded-3xl border border-border bg-card p-4 shadow-[0_20px_60px_rgba(15,23,42,0.12)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <BrandLogo className="[&_img]:h-8 [&_img]:w-8 [&_span]:text-base" />
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border text-muted-foreground"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 grid gap-2">
              {navLinks.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={onClose}
                  className="rounded-2xl border border-border px-4 py-3 text-sm font-medium text-muted-foreground transition hover:border-blue-200 hover:bg-blue-50 hover:text-foreground"
                >
                  {item.label}
                </a>
              ))}
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Button asChild variant="secondary" className="h-11 rounded-full border-border bg-card text-muted-foreground">
                <Link href="/login" onClick={onClose}>
                  Sign In
                </Link>
              </Button>
              <Button asChild className="h-11 rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
                <Link href="/register" onClick={onClose}>
                  Get Started
                </Link>
              </Button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <header
        className={`sticky top-0 z-40 border-b bg-card/85 backdrop-blur-xl transition-shadow ${scrolled ? 'border-border shadow-[0_8px_30px_rgba(15,23,42,0.05)]' : 'border-transparent'
          }`}
      >
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <BrandLogo className="[&_img]:h-9 [&_img]:w-9 sm:[&_img]:h-10 sm:[&_img]:w-10" />
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground lg:flex">
            {navLinks.map((item) => (
              <a key={item.label} href={item.href} className="transition hover:text-foreground">
                {item.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-4 sm:flex">
            <Link
              href="/documentation"
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-colors mr-1"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Developer API</span>
            </Link>
            <Button asChild variant="secondary" className="h-11 rounded-full border-border bg-card px-5 text-muted-foreground hover:bg-secondary">
              <Link href="/login">Sign In</Link>
            </Button>
            <Button asChild className="h-11 rounded-full bg-primary px-5 text-primary-foreground shadow-sm shadow-blue-200 hover:bg-primary/90">
              <Link href="/register">Get Started</Link>
            </Button>
          </div>

          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border text-muted-foreground lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>
      <MobileMenu open={open} onClose={() => setOpen(false)} />
    </>
  );
}

function Hero() {
  const brand = getActiveBrand();
  return (
    <section className="bg-background relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[450px] bg-primary/20 blur-[130px] rounded-full pointer-events-none" />
      
      <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-16 sm:px-6 lg:px-8 lg:pb-28 lg:pt-20">
        <div className="flex flex-col-reverse lg:grid lg:grid-cols-2 gap-12 items-center">
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
            <motion.div
              variants={motionFadeUp}
              initial="hidden"
              animate="show"
              custom={0}
              className="inline-flex items-center gap-2.5 rounded-full border border-primary/30 bg-primary/10 backdrop-blur-md px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary shadow-sm"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>{brand.name} • Official Telecom & VTU Switch Engine</span>
            </motion.div>

            <motion.h1
              variants={motionFadeUp}
              initial="hidden"
              animate="show"
              custom={0.08}
              className="mt-6 max-w-3xl text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl xl:text-7xl leading-[1.1]"
            >
              Instant VTU & Telecom Infrastructure for Nigeria
            </motion.h1>

            <motion.p
              variants={motionFadeUp}
              initial="hidden"
              animate="show"
              custom={0.16}
              className="mt-6 max-w-2xl text-base sm:text-lg lg:text-xl leading-relaxed text-muted-foreground"
            >
              Vending high-speed data across MTN, Airtel, Glo, and 9mobile at rock-bottom wholesale prices. Built with a lightning-fast REST API for developers and a frictionless portal for retail users.
            </motion.p>

            <motion.div
              variants={motionFadeUp}
              initial="hidden"
              animate="show"
              custom={0.24}
              className="mt-8 flex flex-wrap gap-4 items-center justify-center lg:justify-start"
            >
              <Button asChild className="h-14 rounded-full bg-primary px-8 text-base font-semibold text-primary-foreground shadow-lg shadow-blue-500/25 hover:bg-primary/90 transition-all hover:scale-105">
                <Link href="/register" className="inline-flex items-center gap-2">
                  <span>Create Free Account</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-14 rounded-full border-white/10 bg-slate-900/80 hover:bg-slate-800 text-white px-7 text-base font-semibold shadow-md backdrop-blur-md transition-all hover:scale-105">
                <Link href="/documentation" className="inline-flex items-center gap-2">
                  <Code2 className="h-4 w-4 text-emerald-400" />
                  <span>Developer API & Docs</span>
                </Link>
              </Button>
              {brand.playStoreLink && (
                <a
                  href={brand.playStoreLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-14 items-center justify-center rounded-full border border-border bg-card/50 backdrop-blur-md px-6 hover:border-blue-300 hover:bg-secondary/80 transition duration-200"
                >
                  <div className="flex items-center gap-2.5 text-left">
                    <svg className="h-6 w-6 text-primary" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M5.002 3c-.116 0-.23.018-.342.049L13.882 12 4.66 20.951c.112.03.226.049.342.049.278 0 .546-.076.784-.216l12.44-7.108c.556-.317.9-.9.9-1.547 0-.647-.344-1.23-.9-1.547L5.786 3.216a1.564 1.564 0 0 0-.784-.216zm-1.042.825V20.18L13.06 12 3.96 3.825z" />
                    </svg>
                    <div>
                      <div className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground leading-none">Get it on</div>
                      <div className="text-sm font-bold text-foreground leading-tight mt-0.5">Google Play</div>
                    </div>
                  </div>
                </a>
              )}
              {brand.appStoreLink && (
                <a
                  href={brand.appStoreLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-14 items-center justify-center rounded-full border border-border bg-card/50 backdrop-blur-md px-6 hover:border-blue-300 hover:bg-secondary/80 transition duration-200"
                >
                  <div className="flex items-center gap-2.5 text-left">
                    <svg className="h-6 w-6 text-primary" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.21.67-2.93 1.49-.62.69-1.16 1.84-1.01 2.96 1.12.09 2.27-.58 2.95-1.39z" />
                    </svg>
                    <div>
                      <div className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground leading-none">Download on the</div>
                      <div className="text-sm font-bold text-foreground leading-tight mt-0.5">App Store</div>
                    </div>
                  </div>
                </a>
              )}
            </motion.div>

            <motion.div
              variants={motionFadeUp}
              initial="hidden"
              animate="show"
              custom={0.32}
              className="mt-10 flex flex-wrap justify-center lg:justify-start gap-3"
            >
              {heroPoints.map((point) => (
                <div key={point} className="flex items-center gap-2 rounded-full border border-border/60 bg-card/50 backdrop-blur-sm px-4 py-2 text-xs sm:text-sm font-medium text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>{point}</span>
                </div>
              ))}
            </motion.div>
          </div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative h-[420px] lg:h-[620px] w-full mt-8 lg:mt-0"
          >
            {/* Animated Bubbles behind */}
            <motion.div 
              animate={{ y: [0, -20, 0], opacity: [0.5, 0.8, 0.5] }} 
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="absolute top-[10%] left-[10%] w-24 h-24 rounded-full bg-primary/20 blur-xl"
            />
            <motion.div 
              animate={{ y: [0, 30, 0], x: [0, 20, 0], opacity: [0.3, 0.7, 0.3] }} 
              transition={{ repeat: Infinity, duration: 6, ease: "easeInOut", delay: 1 }}
              className="absolute bottom-[20%] right-[10%] w-40 h-40 rounded-full bg-blue-500/20 blur-2xl"
            />

            {/* Floating Live Transaction Pill (Top-Right) */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="absolute top-6 sm:top-10 -right-2 sm:right-4 z-20 rounded-2xl bg-slate-900/90 border border-emerald-500/30 p-3 shadow-2xl backdrop-blur-xl flex items-center gap-3"
            >
              <div className="h-9 w-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="text-[11px] font-bold text-white flex items-center gap-1.5">
                  <span>MTN 1GB SME Vended</span>
                  <span className="text-[9px] font-mono bg-emerald-500/20 text-emerald-400 px-1 rounded">1.2s</span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono">0803 •••• 567 • ₦259</div>
              </div>
            </motion.div>

            {/* Floating Live Switch Uptime Pill (Top-Left) */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="absolute top-24 -left-2 sm:left-4 z-20 rounded-2xl bg-slate-900/90 border border-blue-500/30 p-2.5 shadow-2xl backdrop-blur-xl flex items-center gap-2.5"
            >
              <div className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </div>
              <div className="text-left text-[11px] font-bold text-white">
                <span>Switch Status: 99.9%</span>
                <span className="block text-[9px] font-mono text-slate-400">All 4 Networks Operational</span>
              </div>
            </motion.div>

            {/* Floating API Response Chip (Bottom-Left) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0, duration: 0.6 }}
              className="absolute bottom-10 -left-2 sm:left-6 z-20 rounded-2xl bg-slate-900/90 border border-purple-500/30 p-3 shadow-2xl backdrop-blur-xl flex items-center gap-3"
            >
              <div className="h-8 w-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                <Terminal className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="text-[10px] font-mono text-purple-300 font-bold">POST /developer/data</div>
                <div className="text-[9px] font-mono text-emerald-400 flex items-center gap-1">
                  <span>● 200 OK</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-400">Instant Switch Delivery</span>
                </div>
              </div>
            </motion.div>
            
            {/* Customer Photo */}
            <img 
              src="/brand/hero_woman.png" 
              alt={`Customer using ${brand.name}`} 
              className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[105%] w-auto object-contain object-bottom drop-shadow-2xl z-10"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function StatsStrip() {
  const stats = [
    { label: 'Gateway Switch Uptime', value: '99.9%', sub: 'High-availability switch SLA', icon: Activity },
    { label: 'Average Vending Speed', value: '< 2.0s', sub: 'Sub-second direct gateway execution', icon: Clock },
    { label: 'Active Plan Catalog', value: '58+', sub: 'MTN, Airtel, Glo, 9mobile', icon: Layers },
    { label: 'API Integration Fee', value: '₦0.00', sub: 'Instant keys & ₦1M test sandbox', icon: Zap },
  ];

  return (
    <div className="border-y border-white/5 bg-[#0a0d14]/70 backdrop-blur-md py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center md:text-left">
          {stats.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div key={idx} className="flex flex-col md:flex-row items-center md:items-start gap-3 p-2">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{s.value}</div>
                  <div className="text-xs font-semibold text-slate-300 mt-0.5">{s.label}</div>
                  <div className="text-[11px] text-slate-500 font-mono">{s.sub}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ServicesSection() {
  const brand = getActiveBrand();
  return (
    <section id="services" className="bg-card px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <PageSection
          eyebrow={`What you can do with ${brand.name}`}
          title="The actions are clear, familiar, and easy to scan"
          description="A visitor should understand the product in a few seconds and know exactly where to begin."
        />

        <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {services.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                variants={motionFadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.2 }}
                custom={index * 0.05}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
              >
                <div className="h-full rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-xl backdrop-blur-xl hover:border-primary/40 hover:bg-slate-900/90 transition-all duration-300 flex flex-col justify-between group">
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                        <Icon className="h-6 w-6" />
                      </div>
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/5 text-slate-400 border border-white/5">
                        Active
                      </span>
                    </div>
                    <h3 className="mt-5 text-lg font-bold text-white group-hover:text-primary transition-colors">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-400">{item.text}</p>
                  </div>
                  <div className="mt-6 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-500 font-medium group-hover:text-slate-300 transition-colors">
                    <span>Instant Execution</span>
                    <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const brand = getActiveBrand();
  const [role, setRole] = useState('retail');

  const retailSteps = [
    {
      num: '01',
      title: 'Create Your Account',
      desc: 'Register in 30 seconds with just your name, email, and phone. No paperwork or verification wait time.',
      tag: 'Fast Onboarding',
    },
    {
      num: '02',
      title: 'Fund Dedicated Account',
      desc: 'Transfer directly to your Monnify or PalmPay virtual account displayed on your dashboard. Auto-credit within seconds.',
      tag: 'Instant Auto-Credit',
    },
    {
      num: '03',
      title: 'Top Up & Print Receipts',
      desc: 'Pick your data bundle or airtime, enter the recipient phone number, and receive instant delivery with downloadable receipt.',
      tag: 'Sub-Second Vending',
    },
  ];

  const developerSteps = [
    {
      num: '01',
      title: 'Grab Your API Token',
      desc: 'Navigate to Developer Portal, copy your live Bearer token, and test in sandbox mode with ₦1,000,000 in simulated wallet credits.',
      tag: 'Instant Token & Sandbox',
    },
    {
      num: '02',
      title: 'Pick Exact Plan IDs',
      desc: 'Query /developer/data_plans or use our live catalog (e.g. MTN 1GB SME = #530) to specify your requested bundle in your payload.',
      tag: '58+ Active Plan IDs',
    },
    {
      num: '03',
      title: 'Send REST Request',
      desc: 'POST to /api/v1/developer/data with phone, plan, and network. Receive instant JSON confirmation and webhook callbacks.',
      tag: 'cURL, PHP, Python, JS',
    },
  ];

  const steps = role === 'retail' ? retailSteps : developerSteps;

  return (
    <section id="how-it-works" className="bg-[#090c14] px-4 py-24 sm:px-6 lg:px-8 border-t border-white/5">
      <div className="mx-auto max-w-7xl">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary mb-3">
            <span>Simple 3-Step Process</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Get up and running in minutes
          </h2>
          <p className="mt-4 text-slate-400 text-sm sm:text-base leading-relaxed">
            Whether you are selling data bundles to friends and family, or automating your entire VTU website through our gateway switch.
          </p>

          {/* Toggle between Retail and Developer */}
          <div className="mt-8 inline-flex p-1.5 rounded-2xl bg-slate-900 border border-white/10 shadow-lg">
            <button
              type="button"
              onClick={() => setRole('retail')}
              className={`px-5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                role === 'retail'
                  ? 'bg-primary text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              For Everyday Users & Resellers
            </button>
            <button
              type="button"
              onClick={() => setRole('developer')}
              className={`px-5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                role === 'developer'
                  ? 'bg-primary text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              For Developers & VTU Portals
            </button>
          </div>
        </div>

        {/* 3 Step Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          {steps.map((s, idx) => (
            <div
              key={idx}
              className="relative rounded-3xl bg-slate-900/70 border border-white/10 p-8 shadow-xl backdrop-blur-xl hover:border-primary/40 hover:bg-slate-900/90 transition-all duration-300 group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="text-4xl font-extrabold text-white/20 group-hover:text-primary/60 font-mono transition-colors">
                    {s.num}
                  </span>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                    {s.tag}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{s.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Action beneath steps */}
        <div className="mt-12 text-center">
          {role === 'retail' ? (
            <Button asChild className="rounded-full bg-primary text-white hover:bg-primary/90 px-8 h-12 text-sm font-semibold shadow-lg shadow-blue-500/20">
              <Link href="/register">Create Free Retail Account →</Link>
            </Button>
          ) : (
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Button asChild className="rounded-full bg-primary text-white hover:bg-primary/90 px-8 h-12 text-sm font-semibold shadow-lg shadow-blue-500/20">
                <Link href="/documentation">Open Full API Documentation →</Link>
              </Button>
              <Button asChild variant="outline" className="rounded-full border-white/10 bg-white/5 hover:bg-white/10 text-white px-6 h-12 text-sm font-semibold">
                <Link href="/register">Get Free Sandbox API Key</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function TrustSection() {
  const brand = getActiveBrand();
  return (
    <section id="trust" className="bg-background px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <motion.div variants={motionFadeUp} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} custom={0}>
            <PageSection
              eyebrow="Why choose us"
              title="A calmer VTU experience for everyday use"
              description={`${brand.name} is built for people who want speed without confusion, and structure without a crowded interface.`}
            />
            <div className="mt-6 grid gap-3">
              {aboutBullets.map((bullet) => (
                <div key={bullet} className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground shadow-[0_8px_24px_rgba(15,23,42,0.03)]">
                  <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{bullet}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <div className="grid gap-5 sm:grid-cols-2">
            {trustPoints.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  variants={motionFadeUp}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, amount: 0.2 }}
                  custom={index * 0.06}
                  whileHover={{ y: -2 }}
                >
                  <Card className="h-full border-border bg-card shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
                    <CardContent className="p-6">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                      <h3 className="mt-5 text-lg font-semibold text-foreground">{item.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.text}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function AboutSection() {
  const brand = getActiveBrand();
  return (
    <section id="about" className="bg-card px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
        <motion.div variants={motionFadeUp} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.25 }} custom={0}>
          <div className="axis-label text-primary">About {brand.name}</div>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            A simple platform for airtime, data, wallet funding, and utility payments
          </h2>
          <p className="mt-5 text-lg leading-8 text-muted-foreground">
            {brand.name} is a Nigerian VTU and payments platform designed to help people handle ordinary account tasks without friction. It brings top-ups, wallet funding, receipts, and transaction history into one clear web experience.
          </p>
          <p className="mt-5 text-lg leading-8 text-muted-foreground">
            The goal is straightforward: keep the interface human, the flow reliable, and the account details easy to understand.
          </p>
        </motion.div>

        <motion.div
          variants={motionFadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.25 }}
          custom={0.08}
          className="grid gap-5 sm:grid-cols-2"
        >
          <Card className="border-border bg-secondary shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
            <CardContent className="p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-primary">
                <MessageCircle className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-foreground">Human support flow</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">The product keeps support and contact points easy to find when users need help.</p>
            </CardContent>
          </Card>
          <Card className="border-border bg-secondary shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
            <CardContent className="p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-primary">
                <Headphones className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-foreground">Built for trust</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Clear records, predictable actions, and a calm layout help the product feel official.</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}

function FaqSection() {
  const brand = getActiveBrand();
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <section id="faq" className="bg-background px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <PageSection
          eyebrow="FAQ / Support"
          title="Helpful answers before you get started"
          description="A few common questions users usually ask before opening an account or funding their wallet."
          align="center"
        />

        <div className="mt-12 space-y-4">
          {faqs.map((item, index) => {
            const open = activeIndex === index;
            return (
              <Card key={item.q} className="overflow-hidden border-border bg-card shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
                <button
                  type="button"
                  onClick={() => setActiveIndex(open ? -1 : index)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left sm:px-6"
                >
                  <span className="text-base font-semibold text-foreground sm:text-lg">{item.q}</span>
                  <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }} className="text-blue-500">
                    <ChevronDown className="h-5 w-5" />
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {open ? (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22, ease: 'easeOut' }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 pt-0 text-sm leading-7 text-muted-foreground sm:px-6">{item.a}</div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </Card>
            );
          })}
        </div>

        <motion.div
          variants={motionFadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="mt-10"
        >
          <Card className="border-blue-200 bg-card shadow-[0_12px_35px_rgba(234,115,69,0.05)]">
            <CardContent className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
              <div>
                <div className="flex items-center gap-3">
                  <BrandLogo className="[&_img]:h-7 [&_img]:w-7 [&_span]:text-sm" />
                  <div className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">Support</div>
                </div>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
                  If you need help, reach out through email and the team can guide you from there. The goal is to keep the process simple and direct.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button asChild className="h-11 rounded-full bg-primary px-5 text-primary-foreground hover:bg-primary/90">
                  <a href={`mailto:${brand.supportEmail}`}>Email Support</a>
                </Button>
                <Button asChild variant="secondary" className="h-11 rounded-full border-border bg-card px-5 text-muted-foreground hover:bg-secondary">
                  <Link href="/login">Log in</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}

function Footer() {
  const brand = getActiveBrand();
  return (
    <footer className="border-t border-white/10 bg-black px-4 py-16 text-slate-300 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <BrandLogo className="[&_span]:text-white" />
            <p className="mt-5 max-w-xl text-sm leading-7 text-slate-300">
              {brand.name} helps users buy airtime, data, and everyday utility services while keeping wallet funding and transaction records clear.
            </p>
            <div className="mt-5 flex items-center gap-3 text-sm text-slate-200">
              <span className="h-2 w-2 rounded-full bg-primary" />
              <a href={`mailto:${brand.supportEmail}`} className="hover:text-white">{brand.supportEmail}</a>
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-2">
            <div>
              <div className="text-sm font-semibold text-white">{brand.name}</div>
              <div className="mt-4 space-y-3 text-sm">
                <div><a href="#services" className="hover:text-white">What you can do</a></div>
                <div><a href="#trust" className="hover:text-white">Why choose us</a></div>
                <div><a href="#about" className="hover:text-white">About</a></div>
                <div><a href="#faq" className="hover:text-white">FAQ</a></div>
                <div><Link href="/developer/docs" className="hover:text-white">Developer Docs</Link></div>
              </div>
            </div>
            <div>
              <div className="text-sm font-semibold text-white">Policies</div>
              <div className="mt-4 space-y-3 text-sm">
                <div><Link href="/terms" className="hover:text-white">Terms &amp; Conditions</Link></div>
                <div><Link href="/privacy" className="hover:text-white">Privacy Policy</Link></div>
              </div>
            </div>
          </div>
        </div>
        <Separator className="my-10 bg-white/10" />
        <div className="flex flex-col gap-4 text-sm text-slate-400 md:flex-row md:items-center md:justify-between">
          <div>© 2026 {brand.name}. Powered by {brand.publisher}.</div>
          <div className="flex gap-4">
            <span>Official web platform</span>
            <span>Nigerian VTU services</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

const NETWORK_CONFIG = {
  mtn: {
    id: 1,
    name: 'MTN Nigeria',
    short: 'MTN',
    networkId: 1,
    badgeBg: 'bg-[#FFCC00] text-black font-extrabold',
    accentColor: '#FFCC00',
    glow: 'from-amber-500/20 via-yellow-400/5 to-transparent',
    border: 'border-amber-500/30 hover:border-amber-400/60',
    dot: 'bg-[#FFCC00]',
    badgeLabel: 'Instant SME & Gifting',
  },
  airtel: {
    id: 4,
    name: 'Airtel Nigeria',
    short: 'Airtel',
    networkId: 4,
    badgeBg: 'bg-[#ED1C24] text-white font-extrabold',
    accentColor: '#ED1C24',
    glow: 'from-rose-500/20 via-red-500/5 to-transparent',
    border: 'border-rose-500/30 hover:border-rose-400/60',
    dot: 'bg-[#ED1C24]',
    badgeLabel: 'Fast 4G Corporate',
  },
  glo: {
    id: 2,
    name: 'GLO Nigeria',
    short: 'GLO',
    networkId: 2,
    badgeBg: 'bg-[#00843D] text-white font-extrabold',
    accentColor: '#00843D',
    glow: 'from-emerald-500/20 via-green-500/5 to-transparent',
    border: 'border-emerald-500/30 hover:border-emerald-400/60',
    dot: 'bg-[#00843D]',
    badgeLabel: 'High-Volume Gifting',
  },
  '9mobile': {
    id: 3,
    name: '9mobile Nigeria',
    short: '9mobile',
    networkId: 3,
    badgeBg: 'bg-[#00573F] text-[#00E575] font-extrabold',
    accentColor: '#00E575',
    glow: 'from-lime-500/20 via-teal-500/5 to-transparent',
    border: 'border-lime-500/30 hover:border-lime-400/60',
    dot: 'bg-[#00E575]',
    badgeLabel: 'Lowest Cost (C.G)',
  },
};

const FALLBACK_PLANS = {
  mtn: [
    { id: 546, name: '500MB(SME)', size: '500MB', days: '30d', type: 'SME', price: 130 },
    { id: 530, name: '1GB (SME)', size: '1GB', days: '30d', type: 'SME', price: 259 },
    { id: 531, name: '2GB (SME)', size: '2GB', days: '30d', type: 'SME', price: 518 },
    { id: 539, name: '3GB (SME)', size: '3GB', days: '30d', type: 'SME', price: 777 },
    { id: 529, name: '5GB (SME)', size: '5GB', days: '30d', type: 'SME', price: 1295 },
    { id: 591, name: '10GB', size: '10GB', days: '30d', type: 'SME', price: 2590 },
  ],
  airtel: [
    { id: 448, name: '600MB (SME)', size: '600MB', days: '30d', type: 'SME', price: 160 },
    { id: 571, name: '1GB (GIFTING)', size: '1GB', days: '30d', type: 'GIFTING', price: 265 },
    { id: 451, name: '1.5GB (SME)', size: '1.5GB', days: '30d', type: 'SME', price: 395 },
    { id: 454, name: '2GB (SME)', size: '2GB', days: '30d', type: 'SME', price: 530 },
    { id: 455, name: '5GB (SME)', size: '5GB', days: '30d', type: 'SME', price: 1325 },
    { id: 449, name: '10GB (SME)', size: '10GB', days: '30d', type: 'SME', price: 2650 },
  ],
  glo: [
    { id: 570, name: '500MB (C.G)', size: '500MB', days: '30d', type: 'C.G', price: 135 },
    { id: 587, name: '1GB(C.G)', size: '1GB', days: '30d', type: 'C.G', price: 260 },
    { id: 588, name: '2GB(C.G)', size: '2GB', days: '30d', type: 'C.G', price: 520 },
    { id: 589, name: '3GB(C.G)', size: '3GB', days: '30d', type: 'C.G', price: 780 },
    { id: 590, name: '5GB(C.G)', size: '5GB', days: '30d', type: 'C.G', price: 1300 },
    { id: 580, name: '10GB (C.G)', size: '10GB', days: '30d', type: 'C.G', price: 2600 },
  ],
  '9mobile': [
    { id: 510, name: '500MB (C.G)', size: '500MB', days: '30d', type: 'C.G', price: 115 },
    { id: 595, name: '1GB [Corporate]', size: '1GB', days: '30d', type: 'Corp', price: 210 },
    { id: 512, name: '2GB (C.G)', size: '2GB', days: '30d', type: 'C.G', price: 420 },
    { id: 513, name: '3GB (C.G)', size: '3GB', days: '30d', type: 'C.G', price: 630 },
    { id: 514, name: '5GB (C.G)', size: '5GB', days: '30d', type: 'C.G', price: 1050 },
    { id: 515, name: '10GB (C.G)', size: '10GB', days: '30d', type: 'C.G', price: 2100 },
  ],
};

function parseApiPlans(rawPlans) {
  const result = { mtn: [], airtel: [], glo: [], '9mobile': [] };
  if (!Array.isArray(rawPlans)) return result;

  rawPlans.forEach((p) => {
    const net = String(p.network || '').toLowerCase().trim();
    let key = null;
    if (net.includes('mtn')) key = 'mtn';
    else if (net.includes('airtel')) key = 'airtel';
    else if (net.includes('glo')) key = 'glo';
    else if (net.includes('9mobile') || net.includes('etisalat')) key = '9mobile';

    // Prioritize developer/wholesale api_price if set by admin, then fall back to regular price
    const rawApiPrice = p.api_price !== null && p.api_price !== undefined ? Number(p.api_price) : null;
    const finalPrice = (rawApiPrice !== null && !isNaN(rawApiPrice) && rawApiPrice > 0)
      ? rawApiPrice
      : Number(p.price || 0);

    if (key && p.id && finalPrice > 0) {
      result[key].push({
        id: p.id,
        name: p.plan_name || `${p.data_size || ''} Plan`,
        size: p.data_size || p.plan_name || 'Bundle',
        days: p.validity ? p.validity.replace(/days?/i, 'd').trim() : '30d',
        type: p.data_type || (p.plan_name?.includes('SME') ? 'SME' : p.plan_name?.includes('GIFT') ? 'GIFT' : 'C.G'),
        price: finalPrice,
        retailPrice: Number(p.price || 0),
        apiPrice: rawApiPrice,
      });
    }
  });

  Object.keys(result).forEach((k) => {
    result[k].sort((a, b) => a.price - b.price);
  });

  return result;
}

function PricingPreviewSection() {
  const brand = getActiveBrand();
  const [plans, setPlans] = useState(FALLBACK_PLANS);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadPlans() {
      try {
        const raw = await apiFetch('/data/plans?role=developer', { cache: 'no-store' });
        const list = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
        if (list.length > 0 && isMounted) {
          const parsed = parseApiPlans(list);
          const hasAny = Object.values(parsed).some((arr) => arr.length > 0);
          if (hasAny) {
            setPlans(parsed);
            setIsLive(true);
          }
        }
      } catch {
        // Gracefully stay on curated production fallback plans
      }
    }
    loadPlans();
    return () => {
      isMounted = false;
    };
  }, []);

  const copyPlanId = (id, e) => {
    e?.stopPropagation?.();
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(String(id));
      setCopiedId(id);
      setTimeout(() => {
        setCopiedId((curr) => (curr === id ? null : curr));
      }, 2000);
    }
  };

  const totalPlansCount = Object.values(plans).reduce((acc, curr) => acc + (curr?.length || 0), 0);

  const getTopPlans = (netKey) => {
    const list = plans[netKey] || [];
    if (list.length <= 6) return list;
    return list.slice(0, 6);
  };

  const networks = ['mtn', 'airtel', 'glo', '9mobile'];

  return (
    <section id="pricing" className="relative bg-[#07090E] px-4 py-24 sm:px-6 lg:px-8 border-t border-white/5 overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-96 bg-gradient-to-b from-blue-500/10 via-emerald-500/5 to-transparent blur-3xl pointer-events-none" />

      <div className="relative mx-auto max-w-7xl">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/[0.04] border border-white/10 text-xs font-semibold text-emerald-400 mb-4 backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="tracking-wide uppercase font-mono text-[11px]">
              {isLive ? 'Live Production Switch Catalog' : 'Verified Wholesale Rate Card'}
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400 font-mono text-[11px]">{totalPlansCount || 58}+ Active Plans</span>
          </div>

          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Live Pricing & Numerical Plan IDs
          </h2>
          <p className="mt-4 text-slate-400 text-sm sm:text-base leading-relaxed">
            Real-time wholesale prices across all four Nigerian networks. Click any Plan ID to copy it instantly for developer API integration or retail vending on {brand.name}.
          </p>

          {/* Interactive Network Filter Tabs */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => {
                setActiveTab('all');
                setSearchQuery('');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 border ${
                activeTab === 'all'
                  ? 'bg-white/15 text-white border-white/30 shadow-lg backdrop-blur-md'
                  : 'bg-white/[0.03] text-slate-400 border-white/5 hover:bg-white/[0.07] hover:text-slate-200'
              }`}
            >
              All Networks (4)
            </button>

            {networks.map((netKey) => {
              const cfg = NETWORK_CONFIG[netKey];
              const count = plans[netKey]?.length || 0;
              const isSelected = activeTab === netKey;
              return (
                <button
                  key={netKey}
                  type="button"
                  onClick={() => {
                    setActiveTab(netKey);
                    setSearchQuery('');
                  }}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 border ${
                    isSelected
                      ? 'bg-white/15 text-white border-white/30 shadow-lg backdrop-blur-md'
                      : 'bg-white/[0.03] text-slate-400 border-white/5 hover:bg-white/[0.07] hover:text-slate-200'
                  }`}
                >
                  <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />
                  <span>{cfg.short}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/10 text-slate-300">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* View Mode 1: 4-Network Overview Grid */}
        {activeTab === 'all' && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {networks.map((netKey) => {
              const cfg = NETWORK_CONFIG[netKey];
              const displayPlans = getTopPlans(netKey);
              const totalNetPlans = plans[netKey]?.length || 0;

              return (
                <div
                  key={netKey}
                  className="group relative rounded-3xl bg-slate-900/70 border border-white/10 p-5 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:border-white/20 hover:bg-slate-900/90 flex flex-col justify-between"
                >
                  {/* Subtle Top Network Glow */}
                  <div className={`absolute inset-x-0 top-0 h-1 rounded-t-3xl bg-gradient-to-r ${cfg.glow}`} />

                  <div>
                    {/* Network Card Header */}
                    <div className="flex items-center justify-between mb-5 pb-3 border-b border-white/5">
                      <div className="flex items-center gap-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-wider ${cfg.badgeBg}`}>
                          {cfg.short}
                        </span>
                        <div className="flex flex-col">
                          <span className="font-bold text-white text-sm">{cfg.name}</span>
                          <span className="text-[10px] text-slate-500 font-mono">{cfg.tag}</span>
                        </div>
                      </div>
                      <span className="text-[9px] font-mono text-emerald-400/90 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                        ● Instant
                      </span>
                    </div>

                    {/* Pricing Table */}
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="text-[10px] text-slate-500 uppercase tracking-wider font-mono border-b border-white/5">
                          <th className="pb-2">Plan ID</th>
                          <th className="pb-2">Size</th>
                          <th className="pb-2">Type</th>
                          <th className="pb-2 text-right">Wholesale</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.04]">
                        {displayPlans.map((p) => {
                          const isCopied = copiedId === p.id;
                          return (
                            <tr
                              key={p.id}
                              className="group/row hover:bg-white/[0.04] transition-colors cursor-pointer"
                              onClick={(e) => copyPlanId(p.id, e)}
                              title="Click to copy Plan ID"
                            >
                              <td className="py-2.5">
                                <span
                                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-mono font-bold transition-all ${
                                    isCopied
                                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                      : 'bg-white/5 text-slate-300 border border-white/10 group-hover/row:border-white/20 group-hover/row:text-white'
                                  }`}
                                >
                                  #{p.id}
                                  {isCopied ? (
                                    <Check className="w-2.5 h-2.5 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-2.5 h-2.5 text-slate-500 group-hover/row:text-slate-300" />
                                  )}
                                </span>
                              </td>
                              <td className="py-2.5 font-bold text-white text-xs">{p.size}</td>
                              <td className="py-2.5 text-[10px] text-slate-400 font-mono">
                                {p.type || '30d'}
                              </td>
                              <td className="py-2.5 text-right font-bold text-emerald-400 text-xs">
                                ₦{p.price.toLocaleString()}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Card Bottom CTA */}
                  <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setActiveTab(netKey)}
                      className="text-xs text-slate-400 hover:text-white inline-flex items-center gap-1 font-medium transition-colors"
                    >
                      <span>View all {totalNetPlans} plans</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                    <span className="text-[10px] text-slate-500 font-mono">30 Days</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* View Mode 2: Deep-Dive Single Network Table */}
        {activeTab !== 'all' && (
          <div className="rounded-3xl bg-slate-900/80 border border-white/10 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
            {(() => {
              const cfg = NETWORK_CONFIG[activeTab];
              const allPlans = plans[activeTab] || [];
              const filtered = allPlans.filter((p) => {
                if (!searchQuery.trim()) return true;
                const q = searchQuery.toLowerCase();
                return (
                  String(p.id).includes(q) ||
                  p.name?.toLowerCase().includes(q) ||
                  p.size?.toLowerCase().includes(q) ||
                  p.type?.toLowerCase().includes(q) ||
                  String(p.price).includes(q)
                );
              });

              return (
                <div>
                  {/* Top Bar for Single Network */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-1 rounded text-xs uppercase tracking-wider ${cfg.badgeBg}`}>
                        {cfg.short}
                      </span>
                      <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                          <span>{cfg.name}</span>
                          <span className="text-xs font-mono font-normal text-slate-400">
                            ({filtered.length} plans available)
                          </span>
                        </h3>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">
                          API Parameter: <code className="text-emerald-400">network={cfg.networkId}</code> • Sub-second Switch Delivery
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search size, price, ID..."
                          className="pl-9 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-white/30 w-full sm:w-60 font-mono"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('all');
                          setSearchQuery('');
                        }}
                        className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-white font-medium border border-white/10 transition-colors whitespace-nowrap"
                      >
                        ← Back to All
                      </button>
                    </div>
                  </div>

                  {/* Dense Detailed Plan Table */}
                  <div className="mt-6 overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="text-[11px] text-slate-400 uppercase tracking-wider font-mono border-b border-white/10 pb-3">
                          <th className="py-3 px-3">Numerical Plan ID</th>
                          <th className="py-3 px-3">Bundle Name</th>
                          <th className="py-3 px-3">Data Size</th>
                          <th className="py-3 px-3">Package Type</th>
                          <th className="py-3 px-3">Validity</th>
                          <th className="py-3 px-3 text-right">Wholesale Price</th>
                          <th className="py-3 px-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {filtered.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-8 text-center text-slate-400">
                              No plans matching &quot;{searchQuery}&quot; found.
                            </td>
                          </tr>
                        ) : (
                          filtered.map((p) => {
                            const isCopied = copiedId === p.id;
                            return (
                              <tr key={p.id} className="hover:bg-white/[0.03] transition-colors">
                                <td className="py-3 px-3">
                                  <button
                                    type="button"
                                    onClick={(e) => copyPlanId(p.id, e)}
                                    className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-mono font-bold transition-all ${
                                      isCopied
                                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                        : 'bg-white/5 text-slate-200 border border-white/10 hover:border-white/25 hover:text-white'
                                    }`}
                                  >
                                    <span>#{p.id}</span>
                                    {isCopied ? (
                                      <Check className="w-3 h-3 text-emerald-400" />
                                    ) : (
                                      <Copy className="w-3 h-3 text-slate-400" />
                                    )}
                                  </button>
                                </td>
                                <td className="py-3 px-3 font-medium text-white">{p.name}</td>
                                <td className="py-3 px-3 font-bold text-white font-mono">{p.size}</td>
                                <td className="py-3 px-3">
                                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/5 text-slate-300 border border-white/10">
                                    {p.type}
                                  </span>
                                </td>
                                <td className="py-3 px-3 text-slate-400 font-mono">{p.days}</td>
                                <td className="py-3 px-3 text-right font-extrabold text-emerald-400 text-sm font-mono">
                                  ₦{p.price.toLocaleString()}
                                </td>
                                <td className="py-3 px-3 text-right">
                                  <button
                                    type="button"
                                    onClick={(e) => copyPlanId(p.id, e)}
                                    className="text-[11px] font-medium text-slate-400 hover:text-white transition-colors"
                                  >
                                    {isCopied ? 'Copied!' : 'Copy ID'}
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Developer & Reseller Integration Banner */}
        <div className="mt-12 rounded-3xl bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-slate-950/90 border border-white/10 p-6 sm:p-8 backdrop-blur-xl shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Developer API & Reseller Portal</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white">
              Automate your VTU website with these exact Plan IDs
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
              Standardized JSON endpoints, sub-second delivery, automatic webhook callbacks, and ₦1,000,000 sandbox test balance. No developer expertise required to plug in.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 w-full lg:w-auto">
            <Button
              asChild
              className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 px-5 h-11 text-xs font-semibold shadow-lg"
            >
              <Link href="/documentation" className="inline-flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                <span>Open API Documentation</span>
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="rounded-xl border-white/10 bg-white/5 hover:bg-white/10 text-white px-5 h-11 text-xs font-semibold"
            >
              <Link href="/register" className="inline-flex items-center gap-2">
                <span>Get API Token</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function WorkspaceSection() {
  const brand = getActiveBrand();
  const [codeTab, setCodeTab] = useState('curl');
  const [copiedCode, setCopiedCode] = useState(false);

  const codeSnippets = {
    curl: `curl -X POST https://api.meledata.ng/api/v1/developer/data \\
  -H "Authorization: Bearer YOUR_API_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "network": 1,
    "plan": 530,
    "phone": "08031234567"
  }'`,
    php: `<?php
$curl = curl_init();
curl_setopt_array($curl, [
  CURLOPT_URL => "https://api.meledata.ng/api/v1/developer/data",
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_POST => true,
  CURLOPT_POSTFIELDS => json_encode([
    "network" => 1,
    "plan" => 530,
    "phone" => "08031234567"
  ]),
  CURLOPT_HTTPHEADER => [
    "Authorization: Bearer YOUR_API_TOKEN",
    "Content-Type: application/json"
  ],
]);
$response = curl_exec($curl);
echo $response;`,
    python: `import requests

url = "https://api.meledata.ng/api/v1/developer/data"
headers = {
    "Authorization": "Bearer YOUR_API_TOKEN",
    "Content-Type": "application/json"
}
payload = {
    "network": 1,      # 1=MTN, 2=GLO, 3=9Mobile, 4=Airtel
    "plan": 530,       # MTN 1GB SME
    "phone": "08031234567"
}
response = requests.post(url, json=payload, headers=headers)
print(response.json())`,
    javascript: `const res = await fetch("https://api.meledata.ng/api/v1/developer/data", {
  method: "POST",
  headers: {
    "Authorization": "Bearer YOUR_API_TOKEN",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    network: 1,
    plan: 530,
    phone: "08031234567"
  })
});
const data = await res.json();
console.log(data);`
  };

  const copyCode = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(codeSnippets[codeTab]);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  return (
    <section className="bg-background px-4 py-24 sm:px-6 lg:px-8 border-t border-white/5">
      <div className="mx-auto max-w-7xl">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="axis-label text-primary font-semibold">Dual Workspace</div>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Whether you are building it or buying it
          </h2>
          <p className="mt-4 text-slate-400 text-sm sm:text-base leading-relaxed">
            {brand.name} serves as both an ultra-reliable consumer web app for everyday Nigerians and a battle-tested infrastructure platform for developers.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Everyday Resellers */}
          <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-8 flex flex-col justify-between hover:border-primary/40 transition-all duration-300">
            <div>
              <span className="text-xs font-semibold tracking-widest text-primary uppercase">For retail resellers</span>
              <h3 className="mt-4 text-2xl font-bold text-white">Top up data, send airtime, print receipts</h3>
              <p className="mt-4 text-slate-400 text-sm leading-relaxed">
                Mobile-friendly dashboard, automated virtual accounts, transaction history filters, and immediate customer service. Built for Nigerians who want to sell or buy VTU services without code.
              </p>

              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-3 text-sm text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Dedicated Monnify / PalmPay account for instant auto-credit</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Sub-second airtime & mobile data vending</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Automatic instant refund if a third-party gateway fails</span>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-4 items-center">
              <Button asChild className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 px-6 h-11 text-xs font-semibold shadow-md">
                <Link href="/register">Create Retail Account</Link>
              </Button>
              <Button asChild variant="ghost" className="text-slate-300 hover:text-white px-4 h-11 text-xs">
                <Link href="/login">Sign In →</Link>
              </Button>
            </div>
          </div>

          {/* Developers */}
          <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-8 flex flex-col justify-between hover:border-emerald-500/40 transition-all duration-300">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold tracking-widest text-emerald-400 uppercase font-mono">For Developers & VTU Portals</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">REST API v1</span>
              </div>
              <h3 className="text-2xl font-bold text-white">One token. Live Plan IDs. Free Sandbox.</h3>
              <p className="mt-3 text-slate-400 text-sm leading-relaxed">
                Automate airtime distributions and data bundles directly from your backend. Free sandbox mode with ₦1,000,000 in test wallet credits to validate your API integrations before going live.
              </p>

              {/* Code snippet tabs */}
              <div className="mt-5 rounded-2xl bg-black/60 border border-white/10 overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 bg-white/5 border-b border-white/5">
                  <div className="flex items-center gap-1">
                    {['curl', 'php', 'python', 'javascript'].map((lang) => (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => setCodeTab(lang)}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold uppercase transition-colors ${
                          codeTab === lang ? 'bg-white/15 text-white' : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={copyCode}
                    className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-400 hover:text-white transition-colors"
                  >
                    {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCode ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="p-3 text-[11px] font-mono text-slate-300 overflow-x-auto leading-relaxed">
                  <code>{codeSnippets[codeTab]}</code>
                </pre>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-4 items-center">
              <Button asChild className="rounded-full bg-emerald-600 hover:bg-emerald-500 text-white px-6 h-11 text-xs font-semibold shadow-md">
                <Link href="/documentation">Open Full API Documentation →</Link>
              </Button>
              <Button asChild variant="ghost" className="text-slate-300 hover:text-white px-4 h-11 text-xs">
                <Link href="/register">Get API Token</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FloatingWhatsApp() {
  const brand = getActiveBrand();
  if (!brand.whatsappLink) return null;

  return (
    <a
      href={brand.whatsappLink}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-full bg-[#25D366] text-white shadow-2xl hover:scale-105 hover:bg-[#20ba59] transition-all duration-200 group border border-white/20"
      aria-label="Chat on WhatsApp"
    >
      <MessageCircle className="w-5 h-5 fill-current" />
      <span className="text-xs font-bold tracking-wide hidden sm:inline-block">
        Chat with Support
      </span>
    </a>
  );
}

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <Hero />
      <StatsStrip />
      <ServicesSection />
      <HowItWorksSection />
      <PricingPreviewSection />
      <WorkspaceSection />
      <TrustSection />
      <AboutSection />
      <FaqSection />
      <Footer />
      <FloatingWhatsApp />
    </div>
  );
}
