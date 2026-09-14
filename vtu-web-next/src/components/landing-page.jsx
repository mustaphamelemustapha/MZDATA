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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

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
              <a
                href="https://play.google.com/store/apps/details?id=com.mmtech.mzdata&pcampaignid=web_share"
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
                  <a href="mailto:mzdatamzdata2@gmail.com">Email Support</a>
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

function PricingPreviewSection() {
  const mtnPlans = [
    { id: 5000, size: '500MB', days: '30d', price: '₦300' },
    { id: 1881, size: '1GB', days: '30d', price: '₦399' },
    { id: 6666, size: '2GB', days: '30d', price: '₦800' },
    { id: 3333, size: '3GB', days: '30d', price: '₦1200' },
    { id: 9999, size: '5GB', days: '30d', price: '₦1900' },

  ];

  const gloPlans = [
    { id: 199, size: '1GB', days: '30d', price: '₦399' },
    { id: 198, size: '2GB', days: '30d', price: '₦800' },
    { id: 194, size: '5GB', days: '30d', price: '₦1,900' },
    { id: 195, size: '10GB', days: '30d', price: '₦4,000' },
  ];

  const airtelPlans = [
    { id: 163, size: '1GB', days: '30d', price: '₦280' },
    { id: 145, size: '2GB', days: '30d', price: '₦560' },
    { id: 146, size: '5GB', days: '30d', price: '₦1,400' },
    { id: 147, size: '10GB', days: '30d', price: '₦2,800' },
  ];

  return (
    <section id="pricing" className="bg-card px-4 py-24 sm:px-6 lg:px-8 border-t border-white/5">
      <div className="mx-auto max-w-7xl">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="axis-label text-primary">Live Pricing Preview</div>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Mobile data across every Nigerian network
          </h2>
          <p className="mt-4 text-slate-400 text-sm leading-6">
            MTN, Glo, Airtel, 9mobile. Live plan prices below — the same catalog your integration calls. Plans are rated for reliability so you can pick what's safe for production traffic.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* MTN Column */}
          <div className="bg-slate-900/60 border border-border rounded-3xl p-6 shadow-xl backdrop-blur-sm">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-yellow-500" />
                <span className="font-bold text-foreground">MTN</span>
              </div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">network 1</span>
            </div>
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="text-[10px] text-slate-500 uppercase border-b border-border/80 pb-2">
                  <th className="py-2">Size</th>
                  <th className="py-2">Days</th>
                  <th className="py-2 text-right">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-slate-300 font-medium">
                {mtnPlans.map((p) => (
                  <tr key={p.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 text-foreground">{p.size}</td>
                    <td className="py-3 text-slate-500">{p.days}</td>
                    <td className="py-3 text-right text-foreground font-bold">{p.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Glo Column */}
          <div className="bg-slate-900/60 border border-border rounded-3xl p-6 shadow-xl backdrop-blur-sm">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                <span className="font-bold text-foreground">GLO</span>
              </div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">network 2</span>
            </div>
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="text-[10px] text-slate-500 uppercase border-b border-border/80 pb-2">
                  <th className="py-2">Size</th>
                  <th className="py-2">Days</th>
                  <th className="py-2 text-right">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-slate-300 font-medium">
                {gloPlans.map((p) => (
                  <tr key={p.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 text-foreground">{p.size}</td>
                    <td className="py-3 text-slate-500">{p.days}</td>
                    <td className="py-3 text-right text-foreground font-bold">{p.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Airtel Column */}
          <div className="bg-slate-900/60 border border-border rounded-3xl p-6 shadow-xl backdrop-blur-sm">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-red-500" />
                <span className="font-bold text-foreground">Airtel</span>
              </div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">network 4</span>
            </div>
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="text-[10px] text-slate-500 uppercase border-b border-border/80 pb-2">
                  <th className="py-2">Size</th>
                  <th className="py-2">Days</th>
                  <th className="py-2 text-right">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-slate-300 font-medium">
                {airtelPlans.map((p) => (
                  <tr key={p.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 text-foreground">{p.size}</td>
                    <td className="py-3 text-slate-500">{p.days}</td>
                    <td className="py-3 text-right text-foreground font-bold">{p.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
