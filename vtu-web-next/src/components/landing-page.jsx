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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { getActiveBrand } from '@/lib/brand';
import { apiFetch } from '@/lib/api';

const navLinks = [
  { label: 'What you can do', href: '#services' },
  { label: 'Why choose us', href: '#trust' },
  { label: 'About', href: '#about' },
  { label: 'FAQ', href: '#faq' },
];

const heroPoints = ['Instant purchases', 'Wallet funding', 'Clear receipts'];

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
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`.trim()}>
      <img src="/brand/meledata-icon.png" alt="MZDATA logo" className="h-10 w-10 rounded-2xl object-contain" />
      <span className="text-lg font-semibold tracking-tight text-foreground">MZDATA</span>
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
  return (
    <section className="bg-background relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-[400px] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-20 sm:px-6 lg:px-8 lg:pb-32 lg:pt-24">
        <div className="flex flex-col-reverse lg:grid lg:grid-cols-2 gap-12 items-center">
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
            <motion.div
              variants={motionFadeUp}
              initial="hidden"
              animate="show"
              custom={0}
              className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-card/80 backdrop-blur-md px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-primary shadow-sm"
            >
              <Sparkles className="h-3.5 w-3.5" />
              MZDATA for everyday payments
            </motion.div>

            <motion.h1
              variants={motionFadeUp}
              initial="hidden"
              animate="show"
              custom={0.08}
              className="mt-8 max-w-3xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl xl:text-7xl"
            >
              Buy Airtime, Data & Pay Bills in Seconds
            </motion.h1>

            <motion.p
              variants={motionFadeUp}
              initial="hidden"
              animate="show"
              custom={0.16}
              className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl"
            >
              Top up any network, fund your wallet, and manage everyday payments with a simple, reliable MZDATA account.
            </motion.p>

            <motion.div
              variants={motionFadeUp}
              initial="hidden"
              animate="show"
              custom={0.24}
              className="mt-10 flex flex-wrap gap-4 items-center justify-center lg:justify-start"
            >
              <Button asChild className="h-14 rounded-full bg-primary px-8 text-lg text-primary-foreground shadow-md shadow-blue-500/20 hover:bg-primary/90 transition-all hover:scale-105">
                <Link href="/register">
                  Get Started
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Link>
              </Button>
              <Button asChild variant="secondary" className="h-14 rounded-full border-border bg-card/50 backdrop-blur-md px-8 text-lg text-muted-foreground hover:bg-secondary transition-all hover:scale-105">
                <Link href="/login">Log in</Link>
              </Button>

            </motion.div>

            <motion.div
              variants={motionFadeUp}
              initial="hidden"
              animate="show"
              custom={0.32}
              className="mt-12 flex flex-wrap justify-center lg:justify-start gap-4"
            >
              {heroPoints.map((point) => (
                <div key={point} className="flex items-center gap-2 rounded-full border border-border/50 bg-card/40 backdrop-blur-sm px-5 py-2.5 text-sm font-medium text-muted-foreground">
                  <BadgeCheck className="h-4 w-4 text-primary" />
                  {point}
                </div>
              ))}
            </motion.div>
          </div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative h-[400px] lg:h-[600px] w-full mt-8 lg:mt-0"
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
            <motion.div 
              animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.9, 0.4] }} 
              transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 2 }}
              className="absolute top-[40%] right-[20%] w-16 h-16 rounded-full bg-primary/30 blur-lg border border-primary/50"
            />
            <motion.div 
              animate={{ y: [0, -40, 0], x: [0, -20, 0], opacity: [0.2, 0.6, 0.2] }} 
              transition={{ repeat: Infinity, duration: 7, ease: "easeInOut" }}
              className="absolute top-[60%] left-[5%] w-32 h-32 rounded-full border-2 border-primary/20"
            />
            
            {/* Woman Image */}
            <img 
              src="/brand/hero_woman.png" 
              alt="Woman using MZDATA" 
              className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[110%] w-auto object-contain object-bottom drop-shadow-2xl z-10"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function ServicesSection() {
  return (
    <section id="services" className="bg-card px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <PageSection
          eyebrow="What you can do with MZDATA"
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
                whileHover={{ y: -2 }}
                transition={{ duration: 0.2 }}
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
    </section>
  );
}

function TrustSection() {
  return (
    <section id="trust" className="bg-background px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <motion.div variants={motionFadeUp} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} custom={0}>
            <PageSection
              eyebrow="Why choose us"
              title="A calmer VTU experience for everyday use"
              description="MZDATA is built for people who want speed without confusion, and structure without a crowded interface."
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
  return (
    <section id="about" className="bg-card px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
        <motion.div variants={motionFadeUp} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.25 }} custom={0}>
          <div className="axis-label text-primary">About MZDATA</div>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            A simple platform for airtime, data, wallet funding, and utility payments
          </h2>
          <p className="mt-5 text-lg leading-8 text-muted-foreground">
            MZDATA is a Nigerian VTU and payments platform designed to help people handle ordinary account tasks without friction. It brings top-ups, wallet funding, receipts, and transaction history into one clear web experience.
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
                  <a href="https://wa.me/2349067054672" target="_blank" rel="noopener noreferrer">WhatsApp Support</a>
                </Button>
                <Button asChild variant="outline" className="h-11 rounded-full border-border bg-card px-5 text-foreground hover:bg-secondary">
                  <a href="tel:09067054672">Call: 09067054672</a>
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
  return (
    <footer className="border-t border-white/10 bg-black px-4 py-16 text-slate-300 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <BrandLogo className="[&_span]:text-white" />
            <p className="mt-5 max-w-xl text-sm leading-7 text-slate-300">
              MZDATA helps users buy airtime, data, and everyday utility services while keeping wallet funding and transaction records clear.
            </p>
            <div className="mt-5 flex items-center gap-3 text-sm text-slate-200">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <a href="https://wa.me/2349067054672" target="_blank" rel="noopener noreferrer" className="hover:text-white">09067054672 (WhatsApp / Call)</a>
            </div>
            <div className="mt-2 flex items-center gap-3 text-sm text-slate-200">
              <span className="h-2 w-2 rounded-full bg-primary" />
              <a href="mailto:mzdatamzdata2@gmail.com" className="hover:text-white">mzdatamzdata2@gmail.com</a>
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-2">
            <div>
              <div className="text-sm font-semibold text-white">MZDATA</div>
              <div className="mt-4 space-y-3 text-sm">
                <div><a href="#services" className="hover:text-white">What you can do</a></div>
                <div><a href="#trust" className="hover:text-white">Why choose us</a></div>
                <div><a href="#about" className="hover:text-white">About</a></div>
                <div><a href="#faq" className="hover:text-white">FAQ</a></div>

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
          <div>© 2026 MZDATA. Powered by MMTECHGLOBE.</div>
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

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <Hero />
      <ServicesSection />
      <PricingPreviewSection />
      <TrustSection />
      <AboutSection />
      <FaqSection />
      <Footer />
    </div>
  );
}
