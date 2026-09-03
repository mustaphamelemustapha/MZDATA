'use client';

import { useState } from 'react';
import Link from 'next/link';

/* ───────── helpers ───────── */
const Badge = ({ method }) => {
  const colors = {
    GET: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    POST: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    NEW: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  };
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${colors[method] || colors.GET}`}>
      {method}
    </span>
  );
};

const CodeBlock = ({ title, badge, children, lang = 'JSON' }) => (
  <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
    <div className="bg-slate-950 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between">
      <span className="text-[11px] font-semibold text-slate-400">{title}</span>
      {badge && <span className={`text-[10px] font-mono ${badge === 'JSON' ? 'text-emerald-400' : 'text-slate-500'}`}>{badge}</span>}
    </div>
    <pre className="p-4 font-mono text-[11px] text-slate-300 overflow-x-auto leading-5 whitespace-pre">
      {children}
    </pre>
  </div>
);

const FieldTable = ({ fields }) => (
  <div className="mt-4 overflow-x-auto border border-slate-800 rounded-xl">
    <table className="min-w-full divide-y divide-slate-800 text-sm text-left">
      <thead className="bg-slate-900/60">
        <tr>
          <th className="px-4 py-2.5 font-semibold text-slate-300 font-mono text-xs">Field</th>
          <th className="px-4 py-2.5 font-semibold text-slate-300 text-xs">Type</th>
          <th className="px-4 py-2.5 font-semibold text-slate-300 text-xs">Notes</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-800 text-slate-400 text-xs">
        {fields.map((f, i) => (
          <tr key={i}>
            <td className="px-4 py-2.5 font-mono text-blue-400">{f.field}</td>
            <td className="px-4 py-2.5 text-slate-300">{f.type}</td>
            <td className="px-4 py-2.5">{f.notes}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const SideLink = ({ href, children, isNew }) => (
  <a href={href} className="group flex items-center gap-2 py-1 text-sm text-slate-400 hover:text-blue-400 transition-colors">
    <span>{children}</span>
    {isNew && <span className="text-[9px] font-bold bg-violet-500/15 text-violet-400 px-1.5 py-0.5 rounded-full">New</span>}
  </a>
);

/* ───────── main ───────── */
export default function DevDocs() {
  const [codeLang, setCodeLang] = useState('curl');

  const BASE_URL = 'https://mzdata.org/api/v1/developer';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-blue-500 selection:text-white font-sans">

      {/* ─── Navbar ─── */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-lg font-bold tracking-tight text-white hover:text-blue-500 transition-colors">
              MZDATA <span className="text-blue-500">Developers</span>
            </Link>
            <nav className="hidden md:flex items-center gap-4 text-sm text-slate-400">
              <a href="#getting-started" className="hover:text-white transition-colors">Getting started</a>
              <a href="#data-api" className="hover:text-white transition-colors">Data API</a>
              <a href="#airtime-api" className="hover:text-white transition-colors">Airtime API</a>
            </nav>
          </div>
          <div className="flex gap-3">
            <Link href="/login" className="text-sm font-medium text-slate-300 hover:text-white transition-colors py-2 px-3">
              Login
            </Link>
            <Link href="/register" className="text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-full py-2 px-4 transition-all">
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* ─── Body ─── */}
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:grid lg:grid-cols-[200px_1fr] gap-10">

        {/* ─── Sidebar ─── */}
        <aside className="hidden lg:block space-y-6 h-fit sticky top-20">
          <div className="space-y-1.5">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Getting started</h3>
            <SideLink href="#getting-started">Get started</SideLink>
            <SideLink href="#overview">Overview</SideLink>
            <SideLink href="#authentication">Authentication</SideLink>
            <SideLink href="#wallet-balance" isNew>Wallet balance</SideLink>
            <SideLink href="#errors">Errors</SideLink>
            <SideLink href="#idempotency">Idempotency</SideLink>
          </div>
          <div className="space-y-1.5">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Data API</h3>
            <SideLink href="#data-quickstart">Quickstart</SideLink>
            <SideLink href="#live-plan-catalog">Live plan catalog</SideLink>
            <SideLink href="#post-data">POST /data/purchase</SideLink>
            <SideLink href="#data-status" isNew>Status (requery)</SideLink>
          </div>
          <div className="space-y-1.5">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Airtime API</h3>
            <SideLink href="#post-airtime">POST /airtime/purchase</SideLink>
          </div>
        </aside>

        {/* ─── Content ─── */}
        <main className="space-y-20 max-w-4xl">

          {/* ━━━ GETTING STARTED ━━━ */}
          <section id="getting-started" className="scroll-mt-20">
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
              Get started
            </h1>
            <p className="mt-4 text-base text-slate-400 leading-7 max-w-2xl">
              The MZDATA API lets you sell mobile-data top-ups and airtime across every Nigerian network — MTN, Glo, Airtel, and 9mobile — straight from your backend. Token auth, idempotent retries, and a shared wallet that any of your apps can debit.
            </p>

            {/* Feature cards */}
            <div className="mt-8 grid sm:grid-cols-2 gap-4">
              {[
                { title: 'Token auth', desc: 'Bearer token via X-API-Key or Authorization header.' },
                { title: 'Idempotent retries', desc: 'Safe retries with unique reference strings.' },
                { title: 'Shared wallet', desc: 'One balance debited per call — check it via /wallet/.' },
                { title: 'Data + Airtime', desc: 'Buy data plans or send airtime in one API call.' },
              ].map((f) => (
                <div key={f.title} className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                  <h4 className="text-sm font-bold text-white">{f.title}</h4>
                  <p className="text-xs text-slate-400 mt-1 leading-5">{f.desc}</p>
                </div>
              ))}
            </div>

            {/* First call */}
            <div className="mt-8">
              <p className="text-sm text-slate-400 mb-3">Your first call — buy 1GB of MTN data:</p>
              <CodeBlock title="cURL" badge="bash">
{`curl --location '${BASE_URL}/data/purchase' \\
--header 'X-API-Key: mele_live_xxxxxxxxxxxxxxxxxxxx' \\
--header 'Content-Type: application/json' \\
--data '{
  "network": "MTN",
  "phone_number": "09012345678",
  "plan_id": 1,
  "reference": "order_001"
}'`}
              </CodeBlock>
            </div>
          </section>


          {/* ━━━ OVERVIEW ━━━ */}
          <section id="overview" className="scroll-mt-20">
            <h2 className="text-2xl font-bold text-white border-b border-slate-800 pb-2">Overview</h2>
            <p className="mt-4 text-sm text-slate-400 leading-7">
              MZDATA Developers gives you two product APIs:
            </p>
            <ul className="mt-3 space-y-2 text-sm text-slate-400 list-disc list-inside leading-7">
              <li><strong className="text-white">Data API</strong> — buy mobile data on MTN, Glo, Airtel, and 9mobile. Per-plan pricing, idempotent retries.</li>
              <li><strong className="text-white">Airtime API</strong> — send airtime to any Nigerian number. Per-network discounts for resellers.</li>
              <li><strong className="text-white">Wallet balance</strong> <Badge method="NEW" /> — a lightweight <code className="font-mono text-blue-400">GET /wallet/</code> that returns your current balance, so your backend can check funds before queuing a buy.</li>
              <li><strong className="text-white">Status requery</strong> <Badge method="NEW" /> — <code className="font-mono text-blue-400">GET /data/status/?ref=…</code> to look up any past purchase.</li>
            </ul>
            <p className="mt-4 text-sm text-slate-400 leading-7">
              <strong className="text-white">Base URL:</strong> <code className="font-mono text-blue-400">{BASE_URL}</code>. All responses are JSON. Money is Naira (₦) with up to 2 decimal places.
            </p>
          </section>


          {/* ━━━ AUTHENTICATION ━━━ */}
          <section id="authentication" className="scroll-mt-20">
            <h2 className="text-2xl font-bold text-white border-b border-slate-800 pb-2">Authentication</h2>
            <p className="mt-4 text-sm text-slate-400 leading-7">
              Pass your API key in any of these headers — whichever your HTTP client makes easiest:
            </p>
            <CodeBlock title="Authentication headers" badge="bash">
{`X-API-Key: mele_live_xxxxxxxxxxxxxxxxxxxxxxxx
# --or--
Authorization: Token mele_live_xxxxxxxxxxxxxxxxxxxxxxxx
# --or--
Authorization: Bearer mele_live_xxxxxxxxxxxxxxxxxxxxxxxx`}
            </CodeBlock>
            <p className="mt-4 text-sm text-slate-400 leading-7">
              Each token belongs to a single MZDATA user. The token identifies whose wallet gets debited.
            </p>
            <div className="mt-4 bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
              <p className="text-xs text-amber-400 font-semibold">⚠️ Security</p>
              <p className="text-xs text-slate-400 mt-1 leading-5">
                Keep tokens out of source control. Generate one per environment and rotate immediately if leaked. Your secret key is only shown once when generated — store it safely.
              </p>
            </div>

            {/* Networks */}
            <h3 className="mt-8 text-lg font-bold text-white">Supported Networks</h3>
            <p className="mt-2 text-sm text-slate-400">Use these exact string values for the <code className="font-mono text-blue-400">network</code> field:</p>
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {['MTN', 'GLO', 'AIRTEL', '9MOBILE'].map((net) => (
                <div key={net} className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center font-mono text-sm font-bold text-slate-200">
                  {net}
                </div>
              ))}
            </div>
          </section>


          {/* ━━━ WALLET BALANCE ━━━ */}
          <section id="wallet-balance" className="scroll-mt-20">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-2">
              <h2 className="text-2xl font-bold text-white">Wallet balance</h2>
              <Badge method="NEW" />
            </div>
            <p className="mt-4 text-sm text-slate-400 leading-7">
              Check the balance your token can spend. Useful for showing a low-balance warning in your dashboard, gating a data buy before you call <code className="font-mono text-blue-400">/data/purchase</code>, or reconciling against your own ledger.
            </p>

            <div className="mt-4 flex items-center gap-3">
              <Badge method="GET" />
              <code className="font-mono text-sm text-slate-200">/wallet/</code>
              <span className="text-[10px] text-slate-500 border border-slate-700 px-2 py-0.5 rounded-full">Live + test</span>
            </div>

            <div className="mt-4 space-y-4">
              <CodeBlock title="Request" badge="bash">
{`curl "${BASE_URL}/wallet/" \\
  -H "X-API-Key: $TOKEN"`}
              </CodeBlock>
              <CodeBlock title="Response" badge="JSON">
{`{
  "success": true,
  "data": {
    "balance":  14250.50,
    "display":  "₦14,250.50",
    "currency": "NGN",
    "livemode": true,
    "mode":     "live"
  }
}`}
              </CodeBlock>
            </div>

            <FieldTable fields={[
              { field: 'balance', type: 'number', notes: 'Naira, up to 2 decimal places.' },
              { field: 'display', type: 'string', notes: 'Pre-formatted for UI, e.g. "₦14,250.50".' },
              { field: 'currency', type: 'string', notes: 'Always "NGN" today.' },
              { field: 'livemode', type: 'boolean', notes: 'true for live tokens, false for test.' },
              { field: 'mode', type: 'string', notes: '"live" or "test" — convenience over livemode.' },
            ]} />
          </section>


          {/* ━━━ ERRORS ━━━ */}
          <section id="errors" className="scroll-mt-20">
            <h2 className="text-2xl font-bold text-white border-b border-slate-800 pb-2">Errors</h2>
            <p className="mt-4 text-sm text-slate-400 leading-7">
              Every non-2xx response uses the same envelope:
            </p>
            <CodeBlock title="Error envelope" badge="JSON">
{`{
  "success": false,
  "error":   "insufficient_balance",
  "message": "Wallet balance is below the order total."
}`}
            </CodeBlock>

            <div className="mt-6 overflow-x-auto border border-slate-800 rounded-xl">
              <table className="min-w-full divide-y divide-slate-800 text-sm text-left">
                <thead className="bg-slate-900/60">
                  <tr>
                    <th className="px-4 py-2.5 font-mono text-xs font-semibold text-slate-300">HTTP</th>
                    <th className="px-4 py-2.5 font-mono text-xs font-semibold text-slate-300">error</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-slate-300">When</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-xs text-slate-400">
                  {[
                    ['401', 'invalid_token', 'Missing, expired, or revoked token.'],
                    ['403', 'account_inactive', 'Developer account is deactivated.'],
                    ['404', 'not_found', 'Plan, transaction, or endpoint doesn\'t exist.'],
                    ['400', 'invalid_request', 'Body validation failed; message explains.'],
                    ['400', 'insufficient_balance', 'Wallet is below the order total.'],
                    ['409', 'duplicate_reference', 'Reference was already used (idempotency).'],
                    ['429', 'rate_limited', 'Too many requests in this minute window.'],
                    ['500', 'server_error', 'Unexpected. Logged on our end; retry with backoff.'],
                  ].map(([code, error, when]) => (
                    <tr key={error}>
                      <td className={`px-4 py-2.5 font-mono ${code.startsWith('2') ? 'text-emerald-400' : code.startsWith('4') ? 'text-blue-400' : 'text-red-400'}`}>{code}</td>
                      <td className="px-4 py-2.5 font-mono text-slate-300">{error}</td>
                      <td className="px-4 py-2.5">{when}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>


          {/* ━━━ IDEMPOTENCY ━━━ */}
          <section id="idempotency" className="scroll-mt-20">
            <h2 className="text-2xl font-bold text-white border-b border-slate-800 pb-2">Idempotency</h2>
            <p className="mt-4 text-sm text-slate-400 leading-7">
              Every <code className="font-mono text-blue-400">POST</code> purchase endpoint requires a unique <code className="font-mono text-blue-400">reference</code> string in the request body. Retry with the same reference and you get back the original response — no double-debit, no duplicate work.
            </p>
            <CodeBlock title="Example — reference-based idempotency" badge="JSON">
{`{
  "network": "MTN",
  "phone_number": "09012345678",
  "plan_id": 1,
  "reference": "order-2026-06-27-7f3a"   ← unique per purchase
}`}
            </CodeBlock>
            <p className="mt-3 text-xs text-slate-500">
              References are scoped per-token; reuse across tokens has no effect. Keep references under 80 characters.
            </p>
          </section>


          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          {/* ━━━ DATA API ━━━ */}
          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}

          <section id="data-api" className="scroll-mt-20">
            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              Data API
            </h1>
            <p className="mt-2 text-sm text-slate-400">Mobile data top-ups</p>
          </section>


          {/* ━━━ QUICKSTART ━━━ */}
          <section id="data-quickstart" className="scroll-mt-20">
            <h2 className="text-2xl font-bold text-white border-b border-slate-800 pb-2">Quickstart</h2>
            <p className="mt-4 text-sm text-slate-400 leading-7">
              One endpoint: <code className="font-mono text-blue-400">POST /data/purchase</code>. Pick a plan from the live catalog below, send it with the customer&apos;s mobile number, and we route the top-up through the carrier.
            </p>

            {/* Language tabs */}
            <div className="mt-6 flex border-b border-slate-800">
              {['curl', 'javascript', 'php'].map((lang) => (
                <button
                  key={lang}
                  onClick={() => setCodeLang(lang)}
                  className={`px-4 py-2 text-xs font-semibold capitalize transition-all border-b-2 -mb-[2px] ${
                    codeLang === lang
                      ? 'border-blue-500 text-blue-500'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {lang === 'curl' ? 'cURL' : lang === 'javascript' ? 'JavaScript' : 'PHP'}
                </button>
              ))}
            </div>

            <div className="mt-4">
              {codeLang === 'curl' && (
                <CodeBlock title="cURL" badge="bash">
{`curl --location '${BASE_URL}/data/purchase' \\
--header 'X-API-Key: mele_live_xxxxxxxxxxxxxxxxxxxx' \\
--header 'Content-Type: application/json' \\
--data '{
  "network": "MTN",
  "phone_number": "09012345678",
  "plan_id": 1,
  "reference": "unique_ref_001"
}'`}
                </CodeBlock>
              )}
              {codeLang === 'javascript' && (
                <CodeBlock title="JavaScript (fetch)" badge="JS">
{`const res = await fetch('${BASE_URL}/data/purchase', {
  method: 'POST',
  headers: {
    'X-API-Key': 'mele_live_xxxxxxxxxxxxxxxxxxxx',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    network: 'MTN',
    phone_number: '09012345678',
    plan_id: 1,
    reference: 'unique_ref_001',
  }),
});
const data = await res.json();
console.log(data);`}
                </CodeBlock>
              )}
              {codeLang === 'php' && (
                <CodeBlock title="PHP (cURL)" badge="PHP">
{`<?php
$ch = curl_init('${BASE_URL}/data/purchase');
curl_setopt_array($ch, [
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_POST => true,
  CURLOPT_HTTPHEADER => [
    'X-API-Key: mele_live_xxxxxxxxxxxxxxxxxxxx',
    'Content-Type: application/json',
  ],
  CURLOPT_POSTFIELDS => json_encode([
    'network'      => 'MTN',
    'phone_number' => '09012345678',
    'plan_id'      => 1,
    'reference'    => 'unique_ref_001',
  ]),
]);
echo curl_exec($ch);`}
                </CodeBlock>
              )}
            </div>
          </section>


          {/* ━━━ LIVE PLAN CATALOG ━━━ */}
          <section id="live-plan-catalog" className="scroll-mt-20">
            <h2 className="text-2xl font-bold text-white border-b border-slate-800 pb-2">Live plan catalog</h2>
            <p className="mt-4 text-sm text-slate-400 leading-7">
              Fetch all available plans programmatically via <code className="font-mono text-blue-400">GET /data/plans</code>. Use the <code className="font-mono text-blue-400">plan_id</code> column when calling <code className="font-mono text-blue-400">POST /data/purchase</code>.
            </p>

            <div className="mt-4 flex items-center gap-3">
              <Badge method="GET" />
              <code className="font-mono text-sm text-slate-200">/data/plans</code>
            </div>

            <div className="mt-4 space-y-4">
              <CodeBlock title="Request" badge="bash">
{`curl "${BASE_URL}/data/plans" \\
  -H "X-API-Key: $TOKEN"`}
              </CodeBlock>
              <CodeBlock title="Response" badge="JSON">
{`{
  "plans": [
    {
      "plan_id":   1,
      "plan_code": "MTN_1GB_SME",
      "network":   "MTN",
      "plan_name": "MTN SME 1GB",
      "data_size": "1GB",
      "validity":  "30 days",
      "price":     290.00
    },
    {
      "plan_id":   5,
      "plan_code": "GLO_2GB",
      "network":   "GLO",
      "plan_name": "GLO 2GB",
      "data_size": "2GB",
      "validity":  "30 days",
      "price":     480.00
    }
  ]
}`}
              </CodeBlock>
            </div>

            <FieldTable fields={[
              { field: 'plan_id', type: 'int', notes: 'Use this when calling POST /data/purchase.' },
              { field: 'plan_code', type: 'string', notes: 'Human-readable plan code.' },
              { field: 'network', type: 'string', notes: 'MTN, GLO, AIRTEL, or 9MOBILE.' },
              { field: 'plan_name', type: 'string', notes: 'Display name of the plan.' },
              { field: 'data_size', type: 'string', notes: 'e.g. "1GB", "500MB".' },
              { field: 'validity', type: 'string', notes: 'e.g. "30 days", "7 days".' },
              { field: 'price', type: 'number', notes: 'Your reseller price in Naira.' },
            ]} />
          </section>


          {/* ━━━ POST /data/purchase ━━━ */}
          <section id="post-data" className="scroll-mt-20">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-2">
              <h2 className="text-2xl font-bold text-white">POST /data/purchase</h2>
              <span className="text-[10px] text-slate-500 border border-slate-700 px-2 py-0.5 rounded-full">Idempotent</span>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <Badge method="POST" />
              <code className="font-mono text-sm text-slate-200">/data/purchase</code>
            </div>

            <div className="mt-4 space-y-4">
              <CodeBlock title="Request body" badge="JSON">
{`{
  "network":      "MTN",           // MTN, GLO, AIRTEL, 9MOBILE
  "phone_number": "09012345678",   // recipient
  "plan_id":      1,               // from GET /data/plans
  "reference":    "order_001"      // unique per purchase
}`}
              </CodeBlock>
              <CodeBlock title="Response (success)" badge="JSON">
{`{
  "status":    "success",
  "reference": "DEV_DATA_order_001",
  "amount":    290.00,
  "message":   "Transaction successful"
}`}
              </CodeBlock>
              <CodeBlock title="Response (failed — auto-refunded)" badge="JSON">
{`{
  "status":    "failed",
  "reference": "DEV_DATA_order_001",
  "amount":    290.00,
  "message":   "Provider error: plan temporarily unavailable"
}`}
              </CodeBlock>
            </div>

            <FieldTable fields={[
              { field: 'network', type: 'string', notes: 'Required. MTN, GLO, AIRTEL, or 9MOBILE.' },
              { field: 'phone_number', type: 'string', notes: 'Required. 11-digit Nigerian mobile number.' },
              { field: 'plan_id', type: 'int', notes: 'Required. From the plan catalog.' },
              { field: 'reference', type: 'string', notes: 'Required. Unique idempotency key (max 80 chars).' },
            ]} />

            <div className="mt-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
              <p className="text-xs text-emerald-400 font-semibold">✓ Auto-refund on failure</p>
              <p className="text-xs text-slate-400 mt-1 leading-5">
                If the carrier rejects the top-up, your wallet is automatically refunded. The response will show <code className="font-mono text-blue-400">status: &quot;failed&quot;</code> with a human-readable message.
              </p>
            </div>
          </section>


          {/* ━━━ STATUS REQUERY ━━━ */}
          <section id="data-status" className="scroll-mt-20">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-2">
              <h2 className="text-2xl font-bold text-white">Status (requery)</h2>
              <Badge method="NEW" />
            </div>
            <p className="mt-4 text-sm text-slate-400 leading-7">
              Look up the current state of a single data purchase you already made. Use this when the original <code className="font-mono text-blue-400">POST /data/purchase</code> response was delayed or you want to reconcile against your own ledger.
            </p>

            <div className="mt-4 flex items-center gap-3">
              <Badge method="GET" />
              <code className="font-mono text-sm text-slate-200">/data/status/?ref=DEV_DATA_…</code>
              <span className="text-[10px] text-slate-500 border border-slate-700 px-2 py-0.5 rounded-full">Live + test</span>
            </div>

            <p className="mt-3 text-xs text-slate-500">
              Scope: a token only sees purchases it owns. Requests for a reference that belongs to another user return a clean <code className="font-mono">404</code>.
            </p>

            <div className="mt-4 space-y-4">
              <CodeBlock title="Request" badge="bash">
{`curl "${BASE_URL}/data/status/?ref=DEV_DATA_order_001" \\
  -H "X-API-Key: $TOKEN"`}
              </CodeBlock>
              <CodeBlock title="Response" badge="JSON">
{`{
  "success": true,
  "data": {
    "reference":      "DEV_DATA_order_001",
    "status":         "delivered",
    "network":        "MTN",
    "mobile_number":  "09012345678",
    "plan":           "MTN_1GB_SME",
    "amount_charged": 290.00,
    "message":        "Data plan delivered to 09012345678 successfully.",
    "purchased_at":   "2026-06-27T10:58:02+00:00",
    "queried_at":     "2026-06-27T11:34:59+00:00",
    "livemode":       true,
    "mode":           "live"
  }
}`}
              </CodeBlock>
            </div>

            <FieldTable fields={[
              { field: 'reference', type: 'string', notes: 'The reference from the original POST /data/purchase.' },
              { field: 'status', type: 'string', notes: '"delivered" or "failed".' },
              { field: 'network', type: 'string', notes: 'Network of the purchase.' },
              { field: 'mobile_number', type: 'string', notes: 'The recipient phone number.' },
              { field: 'plan', type: 'string', notes: 'The plan code from the catalog.' },
              { field: 'amount_charged', type: 'number', notes: 'Naira debited. 0 for failed transactions.' },
              { field: 'message', type: 'string', notes: 'Human-readable summary, safe to show end users.' },
              { field: 'purchased_at', type: 'string', notes: 'ISO 8601 UTC timestamp of the original purchase.' },
              { field: 'queried_at', type: 'string', notes: 'ISO 8601 UTC timestamp of this requery call.' },
            ]} />
          </section>


          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          {/* ━━━ AIRTIME API ━━━ */}
          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}

          <section id="airtime-api" className="scroll-mt-20">
            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              Airtime API
            </h1>
            <p className="mt-2 text-sm text-slate-400">Mobile airtime top-ups</p>
          </section>


          {/* ━━━ POST /airtime/purchase ━━━ */}
          <section id="post-airtime" className="scroll-mt-20">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-2">
              <h2 className="text-2xl font-bold text-white">POST /airtime/purchase</h2>
              <span className="text-[10px] text-slate-500 border border-slate-700 px-2 py-0.5 rounded-full">Idempotent</span>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <Badge method="POST" />
              <code className="font-mono text-sm text-slate-200">/airtime/purchase</code>
            </div>

            <div className="mt-4 space-y-4">
              <CodeBlock title="Request body" badge="JSON">
{`{
  "network":      "MTN",           // MTN, GLO, AIRTEL, 9MOBILE
  "phone_number": "08098765432",   // recipient
  "amount":       500,             // Naira (minimum ₦100)
  "reference":    "airtime_001"    // unique per purchase
}`}
              </CodeBlock>
              <CodeBlock title="Response (success)" badge="JSON">
{`{
  "status":    "success",
  "reference": "DEV_AIRTIME_airtime_001",
  "amount":    485.00,
  "message":   "Airtime topup succeeded"
}`}
              </CodeBlock>
            </div>

            <FieldTable fields={[
              { field: 'network', type: 'string', notes: 'Required. MTN, GLO, AIRTEL, or 9MOBILE.' },
              { field: 'phone_number', type: 'string', notes: 'Required. 11-digit Nigerian mobile number.' },
              { field: 'amount', type: 'number', notes: 'Required. Naira amount (minimum ₦100).' },
              { field: 'reference', type: 'string', notes: 'Required. Unique idempotency key.' },
            ]} />

            <div className="mt-4 bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
              <p className="text-xs text-blue-400 font-semibold">💡 Reseller discounts</p>
              <p className="text-xs text-slate-400 mt-1 leading-5">
                As a MZDATA developer, you get reseller-tier pricing on airtime. The <code className="font-mono text-blue-400">amount</code> in the response reflects your discounted charge — not the face value sent to the customer.
              </p>
            </div>
          </section>


          {/* ━━━ Footer ━━━ */}
          <footer className="border-t border-slate-800 pt-8 mt-16 pb-12">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-white">MZDATA Developers</p>
                <p className="text-xs text-slate-500 mt-1">Data, airtime, and wallet APIs for Nigerian builders.</p>
              </div>
              <div className="flex gap-4 text-xs text-slate-400">
                <Link href="/register" className="hover:text-blue-500 transition-colors">Create account</Link>
                <Link href="/login" className="hover:text-blue-500 transition-colors">Login</Link>
                <Link href="/" className="hover:text-blue-500 transition-colors">MZDATA home</Link>
              </div>
            </div>
          </footer>

        </main>
      </div>
    </div>
  );
}
