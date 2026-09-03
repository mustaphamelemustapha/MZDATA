'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  CircleDollarSign,
  Clock3,
  GraduationCap,
  Layers3,
  RefreshCw,
  Smartphone,
  Tv2,
  Wifi,
  Zap,
  Gift,
  ReceiptText,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { formatMoney } from '@/lib/format';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/page-header';
import { cn } from '@/lib/utils';

const NETWORK_ORDER = ['mtn', 'airtel', 'glo', '9mobile'];

const serviceCards = [
  {
    title: 'Buy Data',
    description: 'Browse live bundles grouped by network and price.',
    icon: Wifi,
    href: '/buy-data',
    cta: 'Open data workspace',
    note: 'Live plans',
  },
  {
    title: 'Airtime',
    description: 'Top up supported Nigerian networks from the same wallet.',
    icon: Smartphone,
    href: '/airtime',
    cta: 'Open airtime workspace',
    note: 'Live',
  },
  {
    title: 'Electricity',
    description: 'Pay supported discos and keep the token receipt.',
    icon: Zap,
    href: '/electricity',
    cta: 'Open electricity workspace',
    note: 'Live',
  },
  {
    title: 'Cable TV',
    description: 'Renew supported subscription packages from the catalog.',
    icon: Tv2,
    href: '/cable-tv',
    cta: 'Open cable workspace',
    note: 'Live',
  },
  {
    title: 'Exam PINs',
    description: 'Buy supported exam bodies when provider options are available.',
    icon: GraduationCap,
    href: '/exam-pins',
    cta: 'Open exam PIN workspace',
    note: 'Live',
  },
  {
    title: 'Wallet Funding',
    description: 'Fund your wallet through your dedicated virtual account.',
    icon: CircleDollarSign,
    href: '/wallet',
    cta: 'Open wallet',
    note: 'Live',
  },
  {
    title: 'History & Receipts',
    description: 'Review transactions and keep receipts in one place.',
    icon: Clock3,
    href: '/history',
    cta: 'Open history',
    note: 'Live',
  },
  {
    title: 'Referrals',
    description: 'Share your referral code and monitor reward progress.',
    icon: Gift,
    href: '/referrals',
    cta: 'Open referrals',
    note: 'Live',
  },
];

function normalizeNetwork(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) return '';
  if (raw === '9' || raw === 'etisalat') return '9mobile';
  return raw;
}

function networkLabel(value) {
  const normalized = normalizeNetwork(value);
  if (!normalized) return 'Other';
  if (normalized === '9mobile') return '9mobile';
  return normalized.toUpperCase();
}

function stringifyList(items) {
  return Array.isArray(items) ? items.filter(Boolean).map((item) => String(item).trim()).filter(Boolean) : [];
}

function parsePlansResponse(raw) {
  if (Array.isArray(raw)) return raw;
  if (!raw || typeof raw !== 'object') return [];
  const list = raw.data ?? raw.plans ?? raw.items;
  return Array.isArray(list) ? list : [];
}

function groupPlans(rows) {
  const grouped = new Map();
  for (const row of rows) {
    if (!row || typeof row !== 'object') continue;
    const key = normalizeNetwork(row.network) || 'other';
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(row);
  }

  const sortByPrice = (a, b) => Number(a?.price || Number.POSITIVE_INFINITY) - Number(b?.price || Number.POSITIVE_INFINITY);
  for (const list of grouped.values()) list.sort(sortByPrice);
  return grouped;
}

function statValue(value, loading) {
  if (loading) return '...';
  if (typeof value === 'number') return value.toLocaleString('en-NG');
  return value || '—';
}

function ServiceCard({ item }) {
  const Icon = item.icon;
  const hasLink = Boolean(item.href);

  return (
    <Card className="h-full border-border bg-card shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
      <CardContent className="flex h-full flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-primary">
            <Icon className="h-5 w-5" />
          </div>
          <Badge tone="neutral" className="border-border bg-secondary text-muted-foreground">
            {item.note}
          </Badge>
        </div>

        <div className="mt-5 space-y-2">
          <h3 className="text-base font-semibold tracking-tight text-foreground">{item.title}</h3>
          <p className="text-sm leading-6 text-muted-foreground">{item.description}</p>
        </div>

        <div className="mt-6 pt-1">
          {hasLink ? (
            <Button asChild variant="secondary" className="w-full border-border bg-card text-muted-foreground hover:bg-secondary">
              <Link href={item.href}>
                {item.cta}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-secondary px-4 py-3 text-sm text-muted-foreground">
              Available in the app
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function CatalogCard({ title, description, items, emptyLabel, accent = false }) {
  const list = stringifyList(items);

  return (
    <Card className={cn('border-border bg-card shadow-[0_8px_24px_rgba(15,23,42,0.04)]', accent && 'border-blue-200 bg-blue-50/50')}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle>{title}</CardTitle>
          <Badge tone="neutral" className="border-border bg-card text-muted-foreground">
            {list.length ? `${list.length} option${list.length === 1 ? '' : 's'}` : 'Available in app'}
          </Badge>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {list.length ? (
          <div className="flex flex-wrap gap-2">
            {list.map((item) => (
              <Badge key={item} tone="neutral" className="border-border bg-secondary text-muted-foreground">
                {item}
              </Badge>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-secondary px-4 py-4 text-sm text-muted-foreground">
            {emptyLabel || 'This option is available in the app, but provider data is not exposed here yet.'}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PlanCard({ plan }) {
  const network = normalizeNetwork(plan?.network);
  const planName = String(plan?.plan_name || plan?.plan_code || 'Plan').trim();
  const size = String(plan?.data_size || '').trim();
  const validity = String(plan?.validity || '').trim();
  const price = Number(plan?.price || 0);

  return (
    <Card className="h-full border-border bg-card shadow-[0_8px_24px_rgba(15,23,42,0.04)] transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
      <CardContent className="flex h-full flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="text-sm font-semibold text-foreground">{planName}</div>
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{plan?.plan_code || '—'}</div>
          </div>
          <Badge tone="neutral" className="border-border bg-secondary text-muted-foreground">
            {networkLabel(network)}
          </Badge>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-2xl border border-border bg-secondary p-3">
            <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Size</div>
            <div className="mt-1 font-medium text-foreground">{size || '—'}</div>
          </div>
          <div className="rounded-2xl border border-border bg-secondary p-3">
            <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Validity</div>
            <div className="mt-1 font-medium text-foreground">{validity || '—'}</div>
          </div>
        </div>

        <div className="mt-4 flex items-end justify-between gap-3">
          <div>
            <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Price</div>
            <div className="text-xl font-semibold tracking-tight text-foreground">₦{formatMoney(price)}</div>
          </div>
          <Button asChild variant="secondary" size="sm" className="border-border bg-card text-muted-foreground hover:bg-secondary">
            <Link href="/buy-data">
              Buy
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ServicesPage() {
  const [catalog, setCatalog] = useState(null);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState('');
  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [plansError, setPlansError] = useState('');
  const [activeNetwork, setActiveNetwork] = useState('all');

  const reload = useCallback(async () => {
    setCatalogLoading(true);
    setPlansLoading(true);
    setCatalogError('');
    setPlansError('');

    try {
      const [catalogRes, plansRes] = await Promise.allSettled([
        apiFetch('/services/catalog'),
        apiFetch('/data/plans'),
      ]);

      if (catalogRes.status === 'fulfilled' && catalogRes.value && typeof catalogRes.value === 'object') {
        setCatalog(catalogRes.value);
      } else if (catalogRes.status === 'rejected') {
        setCatalogError('Unable to load the live service catalog right now.');
      }

      if (plansRes.status === 'fulfilled') {
        setPlans(parsePlansResponse(plansRes.value));
      } else {
        setPlansError('Unable to load live data plans right now.');
      }
    } finally {
      setCatalogLoading(false);
      setPlansLoading(false);
    }
  }, []);

  useEffect(() => {
    reload().catch(() => {});
  }, [reload]);

  const plansByNetwork = useMemo(() => groupPlans(plans), [plans]);

  const availableNetworks = useMemo(() => {
    const keys = Array.from(plansByNetwork.keys());
    const ordered = [
      ...NETWORK_ORDER.filter((key) => plansByNetwork.has(key)),
      ...keys.filter((key) => !NETWORK_ORDER.includes(key) && key !== 'other'),
    ];
    if (plansByNetwork.has('other')) ordered.push('other');
    return ordered;
  }, [plansByNetwork]);

  useEffect(() => {
    if (activeNetwork !== 'all' && !plansByNetwork.has(activeNetwork)) {
      setActiveNetwork('all');
    }
  }, [activeNetwork, plansByNetwork]);

  const activePlans = useMemo(() => {
    if (activeNetwork === 'all') return plans;
    return plansByNetwork.get(activeNetwork) || [];
  }, [activeNetwork, plans, plansByNetwork]);

  const airtimeNetworks = stringifyList(catalog?.airtime_networks);
  const cableProviders = Array.isArray(catalog?.cable_providers)
    ? catalog.cable_providers
        .map((item) => String(item?.name || item?.id || '').trim())
        .filter(Boolean)
    : [];
  const electricityDiscos = stringifyList(catalog?.electricity_discos);
  const examTypes = stringifyList(catalog?.exam_types);

  const heroStats = [
    { label: 'Data plans', value: plans.length, muted: 'From the live backend catalog' },
    { label: 'Airtime networks', value: airtimeNetworks.length, muted: 'Supported on the catalog' },
    { label: 'Cable providers', value: cableProviders.length, muted: 'Shown when exposed by API' },
    { label: 'Exam bodies', value: examTypes.length, muted: 'Available in the app' },
  ];

  return (
    <div className="space-y-8 pb-10">
      <PageHeader
        eyebrow="Services"
        title="MZDATA Services"
        description="Everything you need for data, airtime, bills, wallet funding, and transaction tracking in one simple platform."
        actions={(
          <>
            <Button variant="secondary" onClick={reload} className="border-border bg-card text-muted-foreground hover:bg-secondary">
              <RefreshCw className={cn('h-4 w-4', (catalogLoading || plansLoading) && 'animate-spin')} />
              Refresh
            </Button>
            <Button asChild>
              <Link href="/buy-data">
                Buy Data
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </>
        )}
      />

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="border-border bg-card shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
          <CardContent className="space-y-6 p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-primary">
                <Layers3 className="h-5 w-5" />
              </div>
              <div className="space-y-2">
                <div className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                  Live catalog
                </div>
                <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                  A clearer view of the MZDATA service stack
                </h2>
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                  The web app now reflects the same product surface used in Flutter:
                  data, airtime, electricity, cable TV, exam PINs, wallet funding,
                  receipts, and referrals.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {heroStats.map((item) => (
                <div key={item.label} className="rounded-3xl border border-border bg-secondary p-4">
                  <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">{item.label}</div>
                  <div className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
                    {statValue(item.value, catalogLoading || plansLoading)}
                  </div>
                  <div className="mt-1 text-sm leading-6 text-muted-foreground">{item.muted}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
          <CardHeader>
            <CardTitle>What is live here</CardTitle>
            <CardDescription>Only services that exist in the app and backend catalog are shown.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              'Live data plans from /data/plans',
              'Airtime, cable TV, electricity, and exam purchase flows',
              'Dedicated wallet funding, transaction history, and receipts',
              'Referral tracking from a dedicated referral workspace',
            ].map((line) => (
              <div key={line} className="flex items-start gap-3 rounded-2xl border border-border bg-secondary p-3 text-sm text-muted-foreground">
                <div className="mt-0.5 h-2 w-2 rounded-full bg-primary" />
                <span>{line}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <section className="space-y-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="axis-label">Service overview</div>
            <h2 className="text-xl font-semibold tracking-tight text-foreground">Real MZDATA services</h2>
            <p className="text-sm leading-6 text-muted-foreground">A clean catalog of the modules available in the Flutter app.</p>
          </div>
          <Badge tone="neutral" className="w-fit border-border bg-card text-muted-foreground">
            {serviceCards.length} services
          </Badge>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {serviceCards.map((item) => (
            <ServiceCard key={item.title} item={item} />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="axis-label">Data plans</div>
            <h2 className="text-xl font-semibold tracking-tight text-foreground">Live network bundles</h2>
            <p className="text-sm leading-6 text-muted-foreground">
              Plans are fetched from the backend and grouped by network. Validity and price are shown exactly as returned.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={reload} className="border-border bg-card text-muted-foreground hover:bg-secondary">
              <RefreshCw className={cn('h-4 w-4', plansLoading && 'animate-spin')} />
              Reload plans
            </Button>
          </div>
        </div>

        {plansError ? (
          <Card className="border-amber-200 bg-amber-50/70 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
            <CardContent className="flex items-center justify-between gap-4 p-4">
              <div className="text-sm text-amber-900">{plansError}</div>
              <Button variant="secondary" onClick={reload} className="border-amber-200 bg-card text-amber-800 hover:bg-amber-50">
                Retry
              </Button>
            </CardContent>
          </Card>
        ) : null}

        <Card className="border-border bg-card shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
          <CardHeader className="pb-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <CardTitle>Plan groups</CardTitle>
                <CardDescription>Select a network to narrow the catalog.</CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setActiveNetwork('all')}
                  className={cn(
                    'rounded-full border px-4 py-2 text-sm font-medium transition',
                    activeNetwork === 'all'
                      ? 'border-blue-200 bg-blue-50 text-foreground'
                      : 'border-border bg-card text-muted-foreground hover:bg-secondary'
                  )}
                >
                  All
                  <span className="ml-2 text-xs text-muted-foreground">{plans.length}</span>
                </button>
                {availableNetworks.map((network) => {
                  const count = plansByNetwork.get(network)?.length || 0;
                  const active = activeNetwork === network;
                  return (
                    <button
                      key={network}
                      type="button"
                      onClick={() => setActiveNetwork(network)}
                      className={cn(
                        'rounded-full border px-4 py-2 text-sm font-medium transition',
                        active
                          ? 'border-blue-200 bg-blue-50 text-foreground'
                          : 'border-border bg-card text-muted-foreground hover:bg-secondary'
                      )}
                    >
                      {networkLabel(network)}
                      <span className="ml-2 text-xs text-muted-foreground">{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {plansLoading && !plans.length ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <div key={idx} className="h-44 animate-pulse rounded-3xl border border-border bg-secondary" />
                ))}
              </div>
            ) : activePlans.length ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {activePlans.map((plan) => (
                  <PlanCard key={plan.plan_code || `${plan.network}-${plan.plan_name}`} plan={plan} />
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-border bg-secondary px-5 py-6 text-sm text-muted-foreground">
                {plansError ? 'No live plans could be loaded.' : 'No plans available right now.'}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <div>
          <div className="axis-label">Coverage</div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">Other real services in the app</h2>
          <p className="text-sm leading-6 text-muted-foreground">
            These cards stay honest. When the backend exposes options, they appear here. When it does not, we keep the page simple.
          </p>
        </div>

        {catalogError ? (
          <div className="rounded-3xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
            {catalogError}
          </div>
        ) : null}

        <div className="grid gap-4 xl:grid-cols-2">
          <CatalogCard
            title="Airtime"
            description="Instant airtime top-up for supported networks."
            items={airtimeNetworks}
            emptyLabel="Airtime is available in the app. Provider data is not exposed here yet."
          />
          <CatalogCard
            title="Electricity"
            description="Pay supported electricity bills from the wallet."
            items={electricityDiscos}
            emptyLabel="Electricity bill payment is available in the app. Disco options are not exposed here yet."
          />
          <CatalogCard
            title="Cable TV"
            description="Renew supported TV subscriptions from the live catalog."
            items={cableProviders}
            emptyLabel="Cable TV is available in the app. Provider packages are not exposed here yet."
          />
          <CatalogCard
            title="Exam PINs"
            description="Buy supported exam PINs when the provider catalog is available."
            items={examTypes}
            emptyLabel="Exam PINs are available in the app. Supported bodies are not exposed here yet."
          />
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <div className="axis-label">Account features</div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">Wallet, history, and referrals</h2>
          <p className="text-sm leading-6 text-muted-foreground">The rest of the product surface stays available as clean navigation paths.</p>
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          <Card className="border-border bg-card shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-primary">
                  <CircleDollarSign className="h-5 w-5" />
                </div>
                <Badge tone="neutral" className="border-border bg-secondary text-muted-foreground">Live</Badge>
              </div>
              <CardTitle>Wallet funding</CardTitle>
              <CardDescription>
                Fund your wallet through the dedicated virtual account and continue purchasing without leaving the platform.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/wallet">
                  Open wallet
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border bg-card shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-primary">
                  <ReceiptText className="h-5 w-5" />
                </div>
                <Badge tone="neutral" className="border-border bg-secondary text-muted-foreground">Live</Badge>
              </div>
              <CardTitle>History & receipts</CardTitle>
              <CardDescription>
                Review transaction records, track purchase status, and open clean receipts from the history screen.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="secondary" className="w-full border-border bg-card text-muted-foreground hover:bg-secondary">
                <Link href="/history">
                  Open history
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border bg-card shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-primary">
                  <Gift className="h-5 w-5" />
                </div>
                <Badge tone="neutral" className="border-border bg-secondary text-muted-foreground">Live</Badge>
              </div>
              <CardTitle>Referrals</CardTitle>
              <CardDescription>
                Share your code and track referral progress without leaving the app.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="secondary" className="w-full border-border bg-card text-muted-foreground hover:bg-secondary">
                <Link href="/referrals">
                  Open referrals
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
