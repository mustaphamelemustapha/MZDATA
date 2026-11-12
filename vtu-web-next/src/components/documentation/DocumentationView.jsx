'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { getActiveBrand } from '@/lib/brand';
import { formatMoney } from '@/lib/format';
import {
  Copy,
  Check,
  Search,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Key,
  Wallet,
  Wifi,
  Phone,
  Code2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Layers,
  ArrowRight,
  Download,
  Smartphone,
  ChevronRight,
  Send,
  Zap,
} from 'lucide-react';

/* ── Fallback Plans for Instant Reseller View ── */
const FALLBACK_PLANS = [
  { id: 401, network: 'MTN', plan_name: '500MB SME Data', data_size: '500MB', validity: '30 Days', price: 130, data_type: 'SME' },
  { id: 402, network: 'MTN', plan_name: '1.0 GB SME Data', data_size: '1GB', validity: '30 Days', price: 259, data_type: 'SME' },
  { id: 403, network: 'MTN', plan_name: '2.0 GB SME Data', data_size: '2GB', validity: '30 Days', price: 518, data_type: 'SME' },
  { id: 404, network: 'MTN', plan_name: '3.0 GB SME Data', data_size: '3GB', validity: '30 Days', price: 777, data_type: 'SME' },
  { id: 405, network: 'MTN', plan_name: '5.0 GB SME Data', data_size: '5GB', validity: '30 Days', price: 1295, data_type: 'SME' },
  { id: 406, network: 'MTN', plan_name: '10.0 GB SME Data', data_size: '10GB', validity: '30 Days', price: 2590, data_type: 'SME' },
  { id: 411, network: 'MTN', plan_name: '1.0 GB Corporate Gifting', data_size: '1GB', validity: '30 Days', price: 265, data_type: 'Corporate Gifting' },
  { id: 412, network: 'MTN', plan_name: '2.0 GB Corporate Gifting', data_size: '2GB', validity: '30 Days', price: 530, data_type: 'Corporate Gifting' },
  { id: 413, network: 'MTN', plan_name: '5.0 GB Corporate Gifting', data_size: '5GB', validity: '30 Days', price: 1325, data_type: 'Corporate Gifting' },
  { id: 421, network: 'AIRTEL', plan_name: '500MB Corporate Gifting', data_size: '500MB', validity: '30 Days', price: 135, data_type: 'Corporate Gifting' },
  { id: 422, network: 'AIRTEL', plan_name: '1.0 GB Corporate Gifting', data_size: '1GB', validity: '30 Days', price: 265, data_type: 'Corporate Gifting' },
  { id: 423, network: 'AIRTEL', plan_name: '2.0 GB Corporate Gifting', data_size: '2GB', validity: '30 Days', price: 530, data_type: 'Corporate Gifting' },
  { id: 424, network: 'AIRTEL', plan_name: '5.0 GB Corporate Gifting', data_size: '5GB', validity: '30 Days', price: 1325, data_type: 'Corporate Gifting' },
  { id: 425, network: 'AIRTEL', plan_name: '10.0 GB Corporate Gifting', data_size: '10GB', validity: '30 Days', price: 2650, data_type: 'Corporate Gifting' },
  { id: 431, network: 'GLO', plan_name: '500MB Corporate Gifting', data_size: '500MB', validity: '30 Days', price: 135, data_type: 'Corporate Gifting' },
  { id: 432, network: 'GLO', plan_name: '1.0 GB Corporate Gifting', data_size: '1GB', validity: '30 Days', price: 260, data_type: 'Corporate Gifting' },
  { id: 433, network: 'GLO', plan_name: '2.0 GB Corporate Gifting', data_size: '2GB', validity: '30 Days', price: 520, data_type: 'Corporate Gifting' },
  { id: 434, network: 'GLO', plan_name: '5.0 GB Corporate Gifting', data_size: '5GB', validity: '30 Days', price: 1300, data_type: 'Corporate Gifting' },
  { id: 441, network: '9MOBILE', plan_name: '500MB Corporate Gifting', data_size: '500MB', validity: '30 Days', price: 120, data_type: 'Corporate Gifting' },
  { id: 442, network: '9MOBILE', plan_name: '1.0 GB Corporate Gifting', data_size: '1GB', validity: '30 Days', price: 210, data_type: 'Corporate Gifting' },
  { id: 443, network: '9MOBILE', plan_name: '2.0 GB Corporate Gifting', data_size: '2GB', validity: '30 Days', price: 420, data_type: 'Corporate Gifting' },
  { id: 444, network: '9MOBILE', plan_name: '5.0 GB Corporate Gifting', data_size: '5GB', validity: '30 Days', price: 1050, data_type: 'Corporate Gifting' },
];

const NETWORK_COLORS = {
  MTN: 'bg-amber-400/10 text-amber-500 border-amber-400/30',
  AIRTEL: 'bg-rose-500/10 text-rose-500 border-rose-500/30',
  GLO: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
  '9MOBILE': 'bg-teal-500/10 text-teal-400 border-teal-500/30',
};

export default function DocumentationView() {
  const brand = getActiveBrand();
  const [activeTab, setActiveTab] = useState('curl');
  const [copiedKey, setCopiedKey] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNetwork, setSelectedNetwork] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');

  // Live data plans
  const [livePlans, setLivePlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(true);

  const apiBase = brand.key === 'mzdata' ? 'https://api.mzdata.org/api/v1' : 'https://api.meledata.ng/api/v1';
  const siteUrl = brand.url || 'https://meledata.ng';

  // Load public plans
  const fetchPublicPlans = useCallback(async () => {
    setPlansLoading(true);
    try {
      const res = await fetch(`${apiBase}/data/plans`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        const items = Array.isArray(data) ? data : (data?.items || data?.data || data?.plans || []);
        if (items.length > 0) {
          setLivePlans(items);
          return;
        }
      }
    } catch {
      // Fallback silently
    } finally {
      setPlansLoading(false);
    }
  }, [apiBase]);

  useEffect(() => {
    fetchPublicPlans();
  }, [fetchPublicPlans]);

  const allPlans = useMemo(() => {
    const source = livePlans.length > 0 ? livePlans : FALLBACK_PLANS;
    return source.map((p) => {
      const net = String(p.network || 'MTN').toUpperCase();
      let type = p.data_type || 'SME';
      const name = String(p.plan_name || '');
      if (name.toLowerCase().includes('corporate') || name.toLowerCase().includes('c.g') || name.toLowerCase().includes('cg')) {
        type = 'Corporate Gifting';
      } else if (name.toLowerCase().includes('gift')) {
        type = 'Gifting';
      } else if (name.toLowerCase().includes('sme')) {
        type = 'SME';
      }
      return {
        id: p.id,
        network: net,
        plan_name: p.plan_name || `${p.data_size} Data`,
        data_size: p.data_size || '1GB',
        validity: p.validity || '30 Days',
        price: Number(p.api_price || p.price || 0),
        data_type: type,
      };
    });
  }, [livePlans]);

  // Filter plans
  const filteredPlans = useMemo(() => {
    return allPlans.filter((p) => {
      if (selectedNetwork !== 'ALL' && p.network !== selectedNetwork) return false;
      if (selectedType !== 'ALL') {
        if (selectedType === 'SME' && !p.data_type.includes('SME')) return false;
        if (selectedType === 'CG' && !p.data_type.includes('Corporate')) return false;
        if (selectedType === 'GIFTING' && !p.data_type.includes('Gifting')) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = p.plan_name.toLowerCase().includes(q);
        const matchesSize = p.data_size.toLowerCase().includes(q);
        const matchesId = String(p.id).includes(q);
        const matchesNet = p.network.toLowerCase().includes(q);
        return matchesName || matchesSize || matchesId || matchesNet;
      }
      return true;
    });
  }, [allPlans, selectedNetwork, selectedType, searchQuery]);

  const handleCopy = (text, id) => {
    if (!text) return;
    navigator.clipboard.writeText(String(text));
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(''), 2000);
  };

  const copyAllJson = () => {
    const jsonStr = JSON.stringify(filteredPlans, null, 2);
    handleCopy(jsonStr, 'all_json');
  };

  return (
    <div className="min-h-screen bg-[#090b10] text-zinc-100 selection:bg-blue-600 selection:text-white">
      {/* ── Top Header Navigation ── */}
      <header className="sticky top-0 z-50 border-b border-zinc-800/80 bg-[#0c0e16]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 font-extrabold text-white text-base shadow-lg shadow-blue-500/20">
                {brand.name.charAt(0)}
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold tracking-tight text-white text-base leading-none">
                  {brand.name}
                </span>
                <span className="text-[10px] font-bold tracking-widest uppercase text-blue-400 mt-0.5">
                  API Docs & Reseller Hub
                </span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-5 text-xs font-semibold text-zinc-400">
              <a href="#quick-setup" className="hover:text-white transition-colors">Quick Setup</a>
              <a href="#plan-ids" className="hover:text-blue-400 text-blue-400/90 transition-colors flex items-center gap-1">
                <Zap className="h-3.5 w-3.5 text-amber-400" /> Plan IDs Table
              </a>
              <a href="#data-endpoint" className="hover:text-white transition-colors">Data API</a>
              <a href="#airtime-endpoint" className="hover:text-white transition-colors">Airtime API</a>
              <a href="#balance-endpoint" className="hover:text-white transition-colors">Check Balance</a>
            </nav>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            {brand.whatsappLink && (
              <a
                href={brand.whatsappLink}
                target="_blank"
                rel="noreferrer"
                className="hidden sm:inline-flex items-center gap-1.5 h-9 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 text-xs font-bold text-emerald-400 hover:bg-emerald-500/20 transition-all"
              >
                <Smartphone className="h-3.5 w-3.5" />
                WhatsApp API Help
              </a>
            )}
            <Link
              href="/login"
              className="h-9 rounded-xl border border-zinc-700/70 bg-zinc-800/60 px-3.5 text-xs font-bold text-zinc-200 hover:bg-zinc-700/60 transition-all flex items-center"
            >
              Sign In
            </Link>
            <Link
              href="/developer"
              className="h-9 rounded-xl bg-blue-600 hover:bg-blue-500 text-white px-4 text-xs font-bold shadow-md shadow-blue-600/25 transition-all flex items-center gap-1.5"
            >
              <Key className="h-3.5 w-3.5" />
              Get API Key
            </Link>
          </div>
        </div>
      </header>

      {/* ── Main Layout with Sidebar ── */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:grid lg:grid-cols-[250px_1fr] gap-10">
        {/* ── Left Navigation Sidebar ── */}
        <aside className="hidden lg:block space-y-8 sticky top-24 h-fit max-h-[calc(100vh-7rem)] overflow-y-auto pr-3">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-2 px-2">
              Getting Started
            </div>
            <div className="space-y-1">
              <a href="#quick-setup" className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-800/50 transition-colors">
                <Zap className="h-3.5 w-3.5 text-amber-400" />
                3-Step Connection Guide
              </a>
              <a href="#authentication" className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-colors">
                <Key className="h-3.5 w-3.5" />
                Authentication & Headers
              </a>
              <a href="#base-urls" className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-colors">
                <ExternalLink className="h-3.5 w-3.5" />
                Base URLs
              </a>
            </div>
          </div>

          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-blue-400 mb-2 px-2 flex items-center justify-between">
              <span>Live Plan Catalog</span>
              <span className="text-[9px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded-md font-mono">Live</span>
            </div>
            <div className="space-y-1">
              <a href="#plan-ids" className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-bold text-white bg-blue-600/15 border border-blue-500/30">
                <Layers className="h-3.5 w-3.5 text-blue-400" />
                Plan IDs & Pricing Table
              </a>
            </div>
          </div>

          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-2 px-2">
              Core Endpoints
            </div>
            <div className="space-y-1">
              <a href="#balance-endpoint" className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-colors">
                <span className="flex items-center gap-2">
                  <Wallet className="h-3.5 w-3.5 text-emerald-400" />
                  Check Wallet Balance
                </span>
                <span className="text-[9px] font-mono px-1 rounded bg-emerald-500/20 text-emerald-400">GET</span>
              </a>
              <a href="#data-endpoint" className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-colors">
                <span className="flex items-center gap-2">
                  <Wifi className="h-3.5 w-3.5 text-blue-400" />
                  Purchase Data Bundle
                </span>
                <span className="text-[9px] font-mono px-1 rounded bg-blue-500/20 text-blue-400">POST</span>
              </a>
              <a href="#airtime-endpoint" className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-colors">
                <span className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-purple-400" />
                  Purchase Airtime
                </span>
                <span className="text-[9px] font-mono px-1 rounded bg-blue-500/20 text-blue-400">POST</span>
              </a>
              <a href="#status-endpoint" className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-colors">
                <span className="flex items-center gap-2">
                  <RefreshCw className="h-3.5 w-3.5 text-amber-400" />
                  Query Transaction
                </span>
                <span className="text-[9px] font-mono px-1 rounded bg-emerald-500/20 text-emerald-400">GET</span>
              </a>
            </div>
          </div>

          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-2 px-2">
              Advanced & Support
            </div>
            <div className="space-y-1">
              <a href="#webhooks" className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-colors">
                <Send className="h-3.5 w-3.5" />
                Webhooks (Instant Delivery)
              </a>
              <a href="#error-codes" className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-colors">
                <AlertCircle className="h-3.5 w-3.5" />
                Error & Status Codes
              </a>
              <a href="#faq" className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-colors">
                <HelpCircle className="h-3.5 w-3.5" />
                Frequently Asked Questions
              </a>
            </div>
          </div>
        </aside>

        {/* ── Main Content Area ── */}
        <main className="space-y-16 min-w-0">
          {/* ━━━ HERO SECTION ━━━ */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-xs font-bold mb-4">
              <Zap className="h-3.5 w-3.5" /> Official API & Reseller Integration Guide
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Connect to {brand.name} API
            </h1>
            <p className="mt-3 text-sm sm:text-base text-zinc-400 leading-relaxed max-w-2xl">
              Vend automated MTN, Airtel, Glo, and 9mobile data bundles and airtime directly from your WordPress VTU plugin, custom script, or portal. Simple setup, instant automated delivery, and low wholesale prices.
            </p>

            {/* Quick Copy Base URL */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-[#12141e] px-3.5 py-2 text-xs font-mono text-zinc-300">
                <span className="text-zinc-500 font-bold">BASE URL:</span>
                <span className="text-blue-400 font-semibold">{apiBase}/developer</span>
                <button
                  type="button"
                  onClick={() => handleCopy(`${apiBase}/developer`, 'base_url')}
                  className="ml-2 text-zinc-400 hover:text-white transition-colors"
                  title="Copy Base URL"
                >
                  {copiedKey === 'base_url' ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>

              <Link
                href="/developer"
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 px-4 py-2 text-xs font-bold text-white shadow-sm transition-all"
              >
                <Key className="h-3.5 w-3.5" /> Copy My API Key
              </Link>
            </div>
          </div>

          {/* ━━━ SECTION 1: QUICK 3-STEP SETUP (FOR RESELLERS & NON-DEV) ━━━ */}
          <section id="quick-setup" className="scroll-mt-24">
            <div className="rounded-3xl border border-blue-500/30 bg-gradient-to-b from-blue-950/20 to-zinc-900/40 p-6 sm:p-8 backdrop-blur-xl">
              <div className="flex items-center gap-2.5 text-blue-400 font-bold text-sm uppercase tracking-wider mb-2">
                <Smartphone className="h-4 w-4" /> Non-Technical Guide
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
                Connecting from WordPress or a VTU Website? (3 Easy Steps)
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed mb-6 max-w-2xl">
                Most VTU owners use ready-made software (like WordPress VTU plugins, Smart Recharge, or Monster VTU). You do not need to write code — just follow these 3 simple steps:
              </p>

              <div className="grid sm:grid-cols-3 gap-4">
                <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/60 p-5 space-y-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white font-extrabold text-sm">
                    1
                  </div>
                  <h3 className="font-bold text-sm text-white">Get Your API Key</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Log in to <Link href="/login" className="text-blue-400 underline">your account</Link>, go to the <strong>Developer / API</strong> tab, and click <strong>Generate API Key</strong>. Copy your live key (<code className="text-zinc-300 font-mono text-[10px]">mele_live_...</code>).
                  </p>
                </div>

                <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/60 p-5 space-y-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white font-extrabold text-sm">
                    2
                  </div>
                  <h3 className="font-bold text-sm text-white">Fund Your Wallet</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Transfer funds into your dedicated virtual account. Whenever your customers buy data on your site, your {brand.name} wallet is automatically debited at wholesale cost.
                  </p>
                </div>

                <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/60 p-5 space-y-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white font-extrabold text-sm">
                    3
                  </div>
                  <h3 className="font-bold text-sm text-white">Paste Plan IDs</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    In your VTU plugin settings, enter our Base URL and match your data packages with the numerical <strong>Plan IDs</strong> in the table below. That is all!
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ━━━ SECTION 2: LIVE PLAN IDs & PRICING TABLE (THE STAR) ━━━ */}
          <section id="plan-ids" className="scroll-mt-24">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-400 mb-1">
                  <Zap className="h-3.5 w-3.5" /> Reseller Mapping Catalog
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                  Live Plan IDs & Pricing
                </h2>
                <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                  Click the <strong>Copy ID</strong> button on any plan to paste the ID directly into your VTU portal or plugin.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={copyAllJson}
                  className="h-9 px-3 rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition-all flex items-center gap-1.5"
                  title="Copy full plan catalog as JSON"
                >
                  {copiedKey === 'all_json' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Download className="h-3.5 w-3.5" />}
                  Copy JSON Catalog
                </button>
                <button
                  type="button"
                  onClick={fetchPublicPlans}
                  className="h-9 w-9 rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center transition-all"
                  title="Refresh live plan catalog"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${plansLoading ? 'animate-spin text-blue-400' : ''}`} />
                </button>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="rounded-2xl border border-zinc-800 bg-[#12141e] p-3 sm:p-4 mb-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
              {/* Network Pills */}
              <div className="flex flex-wrap items-center gap-1.5">
                {['ALL', 'MTN', 'AIRTEL', 'GLO', '9MOBILE'].map((net) => (
                  <button
                    key={net}
                    type="button"
                    onClick={() => setSelectedNetwork(net)}
                    className={`h-8 px-3 rounded-lg text-xs font-bold transition-all ${
                      selectedNetwork === net
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800'
                    }`}
                  >
                    {net}
                  </button>
                ))}
              </div>

              {/* Type Pills & Search */}
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-1 border border-zinc-800 rounded-lg bg-zinc-900/60 p-0.5">
                  {[
                    { key: 'ALL', label: 'All Types' },
                    { key: 'SME', label: 'SME' },
                    { key: 'CG', label: 'Corp Gift' },
                  ].map((t) => (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => setSelectedType(t.key)}
                      className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                        selectedType === t.key
                          ? 'bg-zinc-700 text-white'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                <div className="relative flex-1 sm:w-60">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Search 1GB, 2GB, SME..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-8 w-full rounded-lg border border-zinc-800 bg-zinc-900 pl-8 pr-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Catalog Table */}
            <div className="rounded-2xl border border-zinc-800 bg-[#0c0e16] overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-zinc-800 bg-zinc-900/70 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                    <tr>
                      <th className="py-3 px-4">Network</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Plan Name & Size</th>
                      <th className="py-3 px-4">PLAN ID (For Your Script)</th>
                      <th className="py-3 px-4">Validity</th>
                      <th className="py-3 px-4 text-right">Reseller Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 font-medium">
                    {filteredPlans.map((plan) => (
                      <tr key={plan.id} className="hover:bg-zinc-900/40 transition-colors">
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold border uppercase tracking-wider ${
                              NETWORK_COLORS[plan.network] || 'bg-zinc-800 text-zinc-400 border-zinc-700'
                            }`}
                          >
                            {plan.network}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-[11px] text-zinc-400 font-mono">
                            {plan.data_type}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-white">
                          {plan.plan_name}
                        </td>
                        <td className="py-3 px-4">
                          <div className="inline-flex items-center gap-1.5">
                            <span className="font-mono font-extrabold text-blue-400 bg-blue-500/10 border border-blue-500/25 px-2.5 py-1 rounded-md text-xs">
                              {plan.id}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy(plan.id, `plan_${plan.id}`)}
                              className="h-7 px-2 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors flex items-center gap-1 text-[11px] font-semibold"
                              title={`Copy Plan ID ${plan.id}`}
                            >
                              {copiedKey === `plan_${plan.id}` ? (
                                <>
                                  <Check className="h-3 w-3 text-emerald-400" />
                                  <span className="text-emerald-400">Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3 w-3" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-zinc-400">
                          {plan.validity}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400 text-sm">
                          ₦{formatMoney(plan.price)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredPlans.length === 0 && (
                <div className="p-8 text-center text-zinc-500 text-xs">
                  No data plans found matching &quot;{searchQuery}&quot;. Clear search or switch network filter.
                </div>
              )}
            </div>
          </section>

          {/* ━━━ SECTION 3: AUTHENTICATION ━━━ */}
          <section id="authentication" className="scroll-mt-24 space-y-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Key className="h-5 w-5 text-blue-400" /> Authentication
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Every request to the {brand.name} developer endpoints requires your API Key. Pass it in your HTTP headers using either the standard <code className="bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded text-zinc-200 font-mono text-xs">Authorization</code> header or the <code className="bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded text-zinc-200 font-mono text-xs">X-API-Key</code> header:
            </p>

            <div className="rounded-2xl border border-zinc-800 bg-[#0c0e16] p-4 font-mono text-xs text-zinc-300 space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80 text-[11px] text-zinc-500 uppercase font-bold">
                <span>Standard Header Formats</span>
                <button
                  type="button"
                  onClick={() => handleCopy('Authorization: Token YOUR_API_KEY', 'auth_header')}
                  className="text-zinc-400 hover:text-white flex items-center gap-1"
                >
                  {copiedKey === 'auth_header' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  Copy
                </button>
              </div>
              <div className="text-blue-400">Authorization: Token YOUR_API_KEY</div>
              <div className="text-zinc-400">Authorization: Bearer YOUR_API_KEY</div>
              <div className="text-zinc-400">X-API-Key: YOUR_API_KEY</div>
            </div>
          </section>

          {/* ━━━ SECTION 4: CHECK BALANCE ENDPOINT ━━━ */}
          <section id="balance-endpoint" className="scroll-mt-24 space-y-4">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 font-mono text-xs font-bold">GET</span>
              <h2 className="text-xl sm:text-2xl font-bold text-white">Check Wallet Balance</h2>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Check your available wallet balance to ensure you have sufficient funds before dispatching orders.
            </p>

            <div className="rounded-xl border border-zinc-800 bg-[#12141e] px-4 py-2.5 font-mono text-xs text-zinc-300 flex items-center justify-between">
              <div>
                <span className="text-emerald-400 font-bold mr-2">GET</span>
                <span>{apiBase}/developer/user</span>
                <span className="text-zinc-500 ml-2">(or /developer/wallet)</span>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(`${apiBase}/developer/user`, 'balance_url')}
                className="text-zinc-400 hover:text-white"
              >
                {copiedKey === 'balance_url' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>

            {/* Response Box */}
            <div className="rounded-2xl border border-zinc-800 bg-[#0c0e16] p-4 font-mono text-xs">
              <div className="text-[11px] font-bold uppercase text-zinc-500 mb-2">Sample 200 Success Response</div>
              <pre className="text-emerald-400 overflow-x-auto whitespace-pre">
{`{
  "status": "success",
  "user": {
    "username": "reseller@example.com",
    "wallet_balance": 45200.00
  },
  "data": {
    "balance": 45200.00,
    "currency": "NGN"
  }
}`}
              </pre>
            </div>
          </section>

          {/* ━━━ SECTION 5: PURCHASE DATA ENDPOINT ━━━ */}
          <section id="data-endpoint" className="scroll-mt-24 space-y-4">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/25 text-blue-400 font-mono text-xs font-bold">POST</span>
              <h2 className="text-xl sm:text-2xl font-bold text-white">Purchase Data Bundle</h2>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Vends a specific data plan to the recipient&apos;s phone number. Delivery takes between 2 to 10 seconds.
            </p>

            <div className="rounded-xl border border-zinc-800 bg-[#12141e] px-4 py-2.5 font-mono text-xs text-zinc-300 flex items-center justify-between">
              <div>
                <span className="text-blue-400 font-bold mr-2">POST</span>
                <span>{apiBase}/developer/data</span>
                <span className="text-zinc-500 ml-2">(or /developer/data/purchase)</span>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(`${apiBase}/developer/data`, 'data_post_url')}
                className="text-zinc-400 hover:text-white"
              >
                {copiedKey === 'data_post_url' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>

            {/* Request Parameters Table */}
            <div className="rounded-2xl border border-zinc-800 bg-[#0c0e16] overflow-hidden">
              <div className="p-3 bg-zinc-900/60 border-b border-zinc-800 text-xs font-bold text-zinc-300 uppercase tracking-wider">
                Request Body (JSON)
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-zinc-800 text-[11px] text-zinc-500 uppercase">
                    <tr>
                      <th className="p-3">Field</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">Required</th>
                      <th className="p-3">Description & Aliases</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 font-medium">
                    <tr>
                      <td className="p-3 font-mono text-blue-400">phone</td>
                      <td className="p-3 text-zinc-400">String</td>
                      <td className="p-3"><span className="text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded text-[10px] font-bold">YES</span></td>
                      <td className="p-3 text-zinc-300">Recipient 11-digit phone number (e.g. <code className="text-zinc-400 font-mono">08012345678</code>). Aliases: <code className="text-zinc-500 font-mono">phone_number</code>, <code className="text-zinc-500 font-mono">mobile_number</code>.</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono text-blue-400">plan</td>
                      <td className="p-3 text-zinc-400">Integer</td>
                      <td className="p-3"><span className="text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded text-[10px] font-bold">YES</span></td>
                      <td className="p-3 text-zinc-300">The numerical <strong>Plan ID</strong> from the catalog table above (e.g. <code className="text-zinc-400 font-mono">402</code>). Alias: <code className="text-zinc-500 font-mono">plan_id</code>.</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono text-blue-400">network</td>
                      <td className="p-3 text-zinc-400">String / Int</td>
                      <td className="p-3"><span className="text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded text-[10px] font-bold">YES</span></td>
                      <td className="p-3 text-zinc-300">Network identifier: <code className="text-zinc-400 font-mono">1</code> or <code className="text-zinc-400 font-mono">&quot;MTN&quot;</code>, <code className="text-zinc-400 font-mono">2</code> or <code className="text-zinc-400 font-mono">&quot;GLO&quot;</code>, <code className="text-zinc-400 font-mono">3</code> or <code className="text-zinc-400 font-mono">&quot;9MOBILE&quot;</code>, <code className="text-zinc-400 font-mono">4</code> or <code className="text-zinc-400 font-mono">&quot;AIRTEL&quot;</code>.</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono text-blue-400">bypass</td>
                      <td className="p-3 text-zinc-400">Boolean</td>
                      <td className="p-3"><span className="text-zinc-500 text-[10px]">Optional</span></td>
                      <td className="p-3 text-zinc-300">Set to <code className="text-zinc-400 font-mono">true</code> if number is ported across carriers. Alias: <code className="text-zinc-500 font-mono">Ported_number</code>.</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono text-blue-400">request-id</td>
                      <td className="p-3 text-zinc-400">String</td>
                      <td className="p-3"><span className="text-zinc-500 text-[10px]">Optional</span></td>
                      <td className="p-3 text-zinc-300">Unique reference string from your portal for idempotency. Alias: <code className="text-zinc-500 font-mono">reference</code>.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Code Tabs */}
            <div className="rounded-2xl border border-zinc-800 bg-[#0c0e16] overflow-hidden shadow-lg">
              <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-950 px-4 py-2">
                <div className="flex items-center gap-1">
                  {['curl', 'php', 'python', 'javascript'].map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => setActiveTab(lang)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold uppercase transition-all ${
                        activeTab === lang
                          ? 'bg-blue-600 text-white'
                          : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
                      }`}
                    >
                      {lang === 'javascript' ? 'Node.JS' : lang}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const code = activeTab === 'curl'
                      ? `curl -X POST "${apiBase}/developer/data" \\\n  -H "Authorization: Token YOUR_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "network": "MTN",\n    "phone": "08012345678",\n    "plan": 402,\n    "request-id": "ORD_${Date.now()}"\n  }'`
                      : activeTab === 'php'
                      ? `<?php\n$ch = curl_init('${apiBase}/developer/data');\ncurl_setopt_array($ch, [\n  CURLOPT_RETURNTRANSFER => true,\n  CURLOPT_POST => true,\n  CURLOPT_HTTPHEADER => [\n    'Authorization: Token YOUR_API_KEY',\n    'Content-Type: application/json'\n  ],\n  CURLOPT_POSTFIELDS => json_encode([\n    'network' => 'MTN',\n    'phone' => '08012345678',\n    'plan' => 402,\n    'request-id' => 'ORD_' . time()\n  ])\n]);\n$response = json_decode(curl_exec($ch), true);\ncurl_close($ch);\nprint_r($response);`
                      : activeTab === 'python'
                      ? `import requests\n\nurl = "${apiBase}/developer/data"\nheaders = {\n    "Authorization": "Token YOUR_API_KEY",\n    "Content-Type": "application/json"\n}\npayload = {\n    "network": "MTN",\n    "phone": "08012345678",\n    "plan": 402,\n    "request-id": "ORD_12345"\n}\nresponse = requests.post(url, json=payload, headers=headers)\nprint(response.json())`
                      : `const res = await fetch('${apiBase}/developer/data', {\n  method: 'POST',\n  headers: {\n    'Authorization': 'Token YOUR_API_KEY',\n    'Content-Type': 'application/json'\n  },\n  body: JSON.stringify({\n    network: 'MTN',\n    phone: '08012345678',\n    plan: 402,\n    'request-id': 'ORD_' + Date.now()\n  })\n});\nconst data = await res.json();\nconsole.log(data);`;
                    handleCopy(code, 'tab_code');
                  }}
                  className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 font-semibold"
                >
                  {copiedKey === 'tab_code' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  Copy Code
                </button>
              </div>

              <div className="p-4 font-mono text-xs text-zinc-300 overflow-x-auto leading-relaxed">
                {activeTab === 'curl' && (
                  <pre>{`curl -X POST "${apiBase}/developer/data" \\
  -H "Authorization: Token YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "network": "MTN",
    "phone": "08012345678",
    "plan": 402,
    "request-id": "ORD_17849201"
  }'`}</pre>
                )}
                {activeTab === 'php' && (
                  <pre>{`<?php
$ch = curl_init('${apiBase}/developer/data');
curl_setopt_array($ch, [
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_POST => true,
  CURLOPT_HTTPHEADER => [
    'Authorization: Token YOUR_API_KEY',
    'Content-Type: application/json'
  ],
  CURLOPT_POSTFIELDS => json_encode([
    'network' => 'MTN',
    'phone' => '08012345678',
    'plan' => 402,
    'request-id' => 'ORD_' . time()
  ])
]);
$response = json_decode(curl_exec($ch), true);
curl_close($ch);
print_r($response);`}</pre>
                )}
                {activeTab === 'python' && (
                  <pre>{`import requests

url = "${apiBase}/developer/data"
headers = {
    "Authorization": "Token YOUR_API_KEY",
    "Content-Type": "application/json"
}
payload = {
    "network": "MTN",
    "phone": "08012345678",
    "plan": 402,
    "request-id": "ORD_12345"
}

response = requests.post(url, json=payload, headers=headers)
print(response.json())`}</pre>
                )}
                {activeTab === 'javascript' && (
                  <pre>{`const res = await fetch('${apiBase}/developer/data', {
  method: 'POST',
  headers: {
    'Authorization': 'Token YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    network: 'MTN',
    phone: '08012345678',
    plan: 402,
    'request-id': 'ORD_' + Date.now()
  })
});

const data = await res.json();
console.log(data);`}</pre>
                )}
              </div>
            </div>

            {/* Sample Success Response */}
            <div className="rounded-2xl border border-zinc-800 bg-[#0c0e16] p-4 font-mono text-xs">
              <div className="text-[11px] font-bold uppercase text-zinc-500 mb-2">Sample 200 Success Response</div>
              <pre className="text-emerald-400 overflow-x-auto whitespace-pre">
{`{
  "status": true,
  "message": "Transaction successful",
  "data": {
    "status": "success",
    "reference": "ORD_17849201",
    "amount": 259.0,
    "network": "MTN",
    "phone_number": "08012345678"
  }
}`}
              </pre>
            </div>
          </section>

          {/* ━━━ SECTION 6: PURCHASE AIRTIME ENDPOINT ━━━ */}
          <section id="airtime-endpoint" className="scroll-mt-24 space-y-4">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/25 text-purple-400 font-mono text-xs font-bold">POST</span>
              <h2 className="text-xl sm:text-2xl font-bold text-white">Purchase Airtime Topup</h2>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Instant airtime recharge for MTN, Airtel, Glo, and 9mobile with wholesale discount.
            </p>

            <div className="rounded-xl border border-zinc-800 bg-[#12141e] px-4 py-2.5 font-mono text-xs text-zinc-300 flex items-center justify-between">
              <div>
                <span className="text-purple-400 font-bold mr-2">POST</span>
                <span>{apiBase}/developer/topup</span>
                <span className="text-zinc-500 ml-2">(or /developer/airtime/purchase)</span>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(`${apiBase}/developer/topup`, 'airtime_url')}
                className="text-zinc-400 hover:text-white"
              >
                {copiedKey === 'airtime_url' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-[#0c0e16] p-4 font-mono text-xs">
              <div className="text-[11px] font-bold uppercase text-zinc-500 mb-2">Sample Request Payload</div>
              <pre className="text-zinc-300 overflow-x-auto whitespace-pre">
{`{
  "network": "MTN",
  "phone": "08012345678",
  "amount": 500,
  "reference": "AIR_992182"
}`}
              </pre>
            </div>
          </section>

          {/* ━━━ SECTION 7: QUERY STATUS ENDPOINT ━━━ */}
          <section id="status-endpoint" className="scroll-mt-24 space-y-4">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 font-mono text-xs font-bold">GET</span>
              <h2 className="text-xl sm:text-2xl font-bold text-white">Query Transaction Status</h2>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              In case of carrier network delays or server timeouts, re-query the transaction by passing your unique reference.
            </p>

            <div className="rounded-xl border border-zinc-800 bg-[#12141e] px-4 py-2.5 font-mono text-xs text-zinc-300 flex items-center justify-between">
              <div>
                <span className="text-emerald-400 font-bold mr-2">GET</span>
                <span>{apiBase}/developer/data/status?ref=YOUR_REFERENCE</span>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(`${apiBase}/developer/data/status?ref=YOUR_REFERENCE`, 'status_url')}
                className="text-zinc-400 hover:text-white"
              >
                {copiedKey === 'status_url' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
          </section>

          {/* ━━━ SECTION 8: ERROR & STATUS CODES ━━━ */}
          <section id="error-codes" className="scroll-mt-24 space-y-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-400" /> HTTP Status & Error Codes
            </h2>
            <div className="rounded-2xl border border-zinc-800 bg-[#0c0e16] overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-zinc-800 bg-zinc-900/60 text-[11px] font-bold text-zinc-400 uppercase">
                  <tr>
                    <th className="p-3">Status Code</th>
                    <th className="p-3">Meaning</th>
                    <th className="p-3">How to Resolve</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 font-medium">
                  <tr>
                    <td className="p-3 font-mono font-bold text-emerald-400">200 OK</td>
                    <td className="p-3 text-zinc-300">Transaction Successful or Processing</td>
                    <td className="p-3 text-zinc-400">Order placed and dispatched to telecom network.</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono font-bold text-amber-400">400 Bad Request</td>
                    <td className="p-3 text-zinc-300">Insufficient Wallet Balance or Invalid Phone</td>
                    <td className="p-3 text-zinc-400">Fund your {brand.name} wallet or verify phone number is 11 digits.</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono font-bold text-rose-400">401 Unauthorized</td>
                    <td className="p-3 text-zinc-300">Invalid or Missing API Key</td>
                    <td className="p-3 text-zinc-400">Verify your <code className="text-zinc-300 font-mono">Authorization: Token ...</code> header.</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono font-bold text-rose-400">404 Not Found</td>
                    <td className="p-3 text-zinc-300">Plan ID Not Found</td>
                    <td className="p-3 text-zinc-400">Check the Plan IDs table above and ensure the plan ID is correct for the network.</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono font-bold text-purple-400">429 Rate Limited</td>
                    <td className="p-3 text-zinc-300">Too Many Requests</td>
                    <td className="p-3 text-zinc-400">Maximum 30 requests per minute per IP/account.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* ━━━ SECTION 9: RESELLER FAQ ━━━ */}
          <section id="faq" className="scroll-mt-24 space-y-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-blue-400" /> Reseller Frequently Asked Questions
            </h2>
            <div className="space-y-3">
              {[
                {
                  q: 'Do I get debited if an order fails?',
                  a: 'No. If a telecom network rejects an order or times out, the system automatically marks the transaction as failed and refunds your wallet balance immediately with 0 deduction.',
                },
                {
                  q: 'Where do I find my API Key?',
                  a: 'Log into your Mele Data account, click on the Developer or API menu on the left (or your Profile), and click "Generate API Key". Your live secret key will be displayed once.',
                },
                {
                  q: 'Can I test without spending real money?',
                  a: 'Yes! Prefix your API key with mele_test_ (e.g. mele_test_pub_... or mele_test_live_...). Test mode provides a simulated ₦1,000,000 sandbox wallet and simulates real delivery without charging real funds.',
                },
                {
                  q: 'Which WordPress / VTU plugins are compatible?',
                  a: 'Any WordPress VTU plugin or script that supports standard token headers and custom plan ID mapping (such as Monster VTU, Smart Recharge, VTU Auto, or Telecomabode-compatible integrations) works out of the box.',
                },
              ].map((item, idx) => (
                <div key={idx} className="rounded-2xl border border-zinc-800 bg-[#0c0e16] p-5 space-y-1.5">
                  <h3 className="font-bold text-sm text-white flex items-center gap-2">
                    <ChevronRight className="h-4 w-4 text-blue-400 shrink-0" />
                    {item.q}
                  </h3>
                  <p className="text-xs text-zinc-400 pl-6 leading-relaxed">
                    {item.a}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* ━━━ FOOTER CTA ━━━ */}
          <div className="rounded-3xl border border-zinc-800 bg-gradient-to-r from-blue-900/30 via-zinc-900 to-zinc-900 p-8 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">Need help connecting your website?</h3>
              <p className="text-xs text-zinc-400">Our integration team is available to assist you with API keys, plan IDs, and plugin setup.</p>
            </div>
            <div className="flex items-center gap-3">
              {brand.whatsappLink && (
                <a
                  href={brand.whatsappLink}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 text-xs font-bold transition-all shadow-md shadow-emerald-600/20"
                >
                  Chat with Onboarding Team
                </a>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
