'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Copy, Terminal } from 'lucide-react';
import { useState } from 'react';

export default function ApiDocsPage() {
  const [copiedText, setCopiedText] = useState(null);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const CodeBlock = ({ code, language = 'json' }) => (
    <div className="relative rounded-lg border border-border/50 bg-black/90 p-4">
      <button 
        onClick={() => copyToClipboard(code)}
        className="absolute right-3 top-3 text-muted-foreground hover:text-white transition-colors"
      >
        <Copy className="h-4 w-4" />
      </button>
      <pre className="text-sm font-mono text-zinc-300 overflow-x-auto">
        <code>{code}</code>
      </pre>
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 p-4 pb-20 md:p-8">
      <PageHeader
        title="API Documentation"
        description="Integrate MZDATA's data and airtime services into your application using our REST API."
      />

      {/* Authentication */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Authentication</h2>
        <p className="text-sm text-muted-foreground">Add your API key to each request using the <code className="bg-secondary px-1.5 py-0.5 rounded text-foreground">X-API-Key</code> or <code className="bg-secondary px-1.5 py-0.5 rounded text-foreground">Authorization</code> header.</p>
        <div className="rounded-xl border border-border bg-card p-4">
          <code className="text-sm font-mono text-foreground">Authorization: Bearer YOUR_API_KEY</code>
        </div>
      </section>

      {/* Base URL */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Base URL</h2>
        <div className="rounded-xl border border-border bg-card p-4">
          <code className="text-sm font-mono text-foreground">https://mzdata-1.onrender.com/api/v1</code>
        </div>
      </section>

      {/* Network IDs */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Network IDs</h2>
        <p className="text-sm text-muted-foreground">Use these IDs when submitting network in requests (or pass the network name directly in lowercase).</p>
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Network</TableHead>
                <TableHead>ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium text-foreground">MTN</TableCell>
                <TableCell className="text-muted-foreground">1 (or "mtn")</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-foreground">AIRTEL</TableCell>
                <TableCell className="text-muted-foreground">2 (or "airtel")</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-foreground">GLO</TableCell>
                <TableCell className="text-muted-foreground">3 (or "glo")</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-foreground">9MOBILE</TableCell>
                <TableCell className="text-muted-foreground">4 (or "9mobile")</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </section>

      {/* Endpoints */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Endpoints</h2>
        <Tabs defaultValue="data" className="w-full">
          <TabsList className="w-full justify-start rounded-xl border border-border bg-card p-1">
            <TabsTrigger value="data" className="flex-1 rounded-lg data-[state=active]:bg-secondary">Data Purchase</TabsTrigger>
            <TabsTrigger value="airtime" className="flex-1 rounded-lg data-[state=active]:bg-secondary">Airtime Purchase</TabsTrigger>
            <TabsTrigger value="wallet" className="flex-1 rounded-lg data-[state=active]:bg-secondary">Check Wallet</TabsTrigger>
            <TabsTrigger value="status" className="flex-1 rounded-lg data-[state=active]:bg-secondary">Check Status</TabsTrigger>
          </TabsList>

          <TabsContent value="data" className="mt-4 space-y-6">
            <div className="rounded-xl border border-border bg-card p-6 space-y-6">
              <div>
                <h3 className="text-lg font-medium">POST /developer/data/purchase</h3>
                <p className="text-sm text-muted-foreground mt-1">Purchase a data bundle for a specific number.</p>
              </div>

              <div className="rounded-lg border border-border bg-secondary p-3 flex justify-between items-center">
                <code className="text-sm font-mono text-foreground">https://mzdata-1.onrender.com/api/v1/developer/data/purchase</code>
                <button onClick={() => copyToClipboard('https://mzdata-1.onrender.com/api/v1/developer/data/purchase')} className="text-muted-foreground hover:text-foreground">
                  <Copy className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-medium">Request Payload</h4>
                </div>
                <CodeBlock code={`{
  "network": "mtn",
  "phone_number": "09095263835",
  "plan_id": 500,
  "reference": "REF_123456789"
}`} />
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium">Parameters</h4>
                <div className="overflow-hidden rounded-lg border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent bg-secondary/50">
                        <TableHead>Field</TableHead>
                        <TableHead>Description</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium text-foreground">network</TableCell>
                        <TableCell className="text-muted-foreground">Network string ("mtn", "glo", etc.)</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium text-foreground">phone_number</TableCell>
                        <TableCell className="text-muted-foreground">Phone number (10-13 digits)</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium text-foreground">plan_id</TableCell>
                        <TableCell className="text-muted-foreground">The data plan ID</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium text-foreground">reference</TableCell>
                        <TableCell className="text-muted-foreground">Unique transaction reference</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium">Sample Response</h4>
                <CodeBlock code={`{
  "status": "pending",
  "reference": "REF_123456789",
  "amount": 500.0,
  "message": "Data purchase initiated successfully."
}`} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="airtime" className="mt-4 space-y-6">
            <div className="rounded-xl border border-border bg-card p-6 space-y-6">
              <div>
                <h3 className="text-lg font-medium">POST /developer/airtime/purchase</h3>
                <p className="text-sm text-muted-foreground mt-1">Purchase VTU airtime.</p>
              </div>

              <div className="rounded-lg border border-border bg-secondary p-3 flex justify-between items-center">
                <code className="text-sm font-mono text-foreground">https://mzdata-1.onrender.com/api/v1/developer/airtime/purchase</code>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium">Request Payload</h4>
                <CodeBlock code={`{
  "network": "mtn",
  "phone_number": "09095263835",
  "amount": 100.00,
  "reference": "REF_123456789"
}`} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="wallet" className="mt-4 space-y-6">
            <div className="rounded-xl border border-border bg-card p-6 space-y-6">
              <div>
                <h3 className="text-lg font-medium">GET /developer/wallet</h3>
                <p className="text-sm text-muted-foreground mt-1">Check your API wallet balance.</p>
              </div>

              <div className="rounded-lg border border-border bg-secondary p-3 flex justify-between items-center">
                <code className="text-sm font-mono text-foreground">https://mzdata-1.onrender.com/api/v1/developer/wallet</code>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium">Sample Response</h4>
                <CodeBlock code={`{
  "success": true,
  "data": {
    "balance": 15000.00,
    "display": "₦15,000.00",
    "currency": "NGN",
    "livemode": true,
    "mode": "live"
  }
}`} />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="status" className="mt-4 space-y-6">
            <div className="rounded-xl border border-border bg-card p-6 space-y-6">
              <div>
                <h3 className="text-lg font-medium">GET /developer/data/status?ref=YOUR_REF</h3>
                <p className="text-sm text-muted-foreground mt-1">Check the status of a past transaction by your reference.</p>
              </div>

              <div className="rounded-lg border border-border bg-secondary p-3 flex justify-between items-center">
                <code className="text-sm font-mono text-foreground">https://mzdata-1.onrender.com/api/v1/developer/data/status?ref=REF_123456789</code>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium">Sample Response</h4>
                <CodeBlock code={`{
  "success": true,
  "data": {
    "reference": "REF_123456789",
    "status": "delivered",
    "network": "mtn",
    "mobile_number": "09095263835",
    "amount_charged": 500.0,
    "message": "Data purchase successful."
  }
}`} />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </section>

      {/* Error Codes */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Error Codes</h2>
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Code</TableHead>
                <TableHead>Meaning</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium text-foreground">400</TableCell>
                <TableCell className="text-muted-foreground">Bad Request - Invalid parameters or insufficient balance</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-foreground">401</TableCell>
                <TableCell className="text-muted-foreground">Unauthorized - Invalid API key</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-foreground">403</TableCell>
                <TableCell className="text-muted-foreground">Forbidden - Developer access suspended</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-foreground">404</TableCell>
                <TableCell className="text-muted-foreground">Not Found - Plan or Network not found</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-foreground">422</TableCell>
                <TableCell className="text-muted-foreground">Validation Error - Invalid phone number format</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-foreground">500</TableCell>
                <TableCell className="text-muted-foreground">Server Error - Internal API error</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </section>

      {/* Getting Started */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Getting Started</h2>
        <div className="rounded-xl border border-border bg-card p-6 space-y-4 text-sm text-muted-foreground">
          <ol className="list-decimal pl-5 space-y-2 text-foreground">
            <li>Generate your API key in dashboard settings (Upgrade to Developer if you haven't).</li>
            <li>Fund your wallet via the dashboard before making API requests.</li>
            <li>Send requests to data or airtime endpoints with your API key.</li>
            <li>Use <code className="bg-secondary px-1 py-0.5 rounded text-xs font-mono">mz_test_...</code> keys for sandbox testing without debiting real funds.</li>
          </ol>
        </div>
      </section>

    </div>
  );
}
