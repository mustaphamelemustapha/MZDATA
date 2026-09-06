'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Copy, RefreshCw, Trash2, Code2 } from 'lucide-react';

export default function DeveloperPage() {
  const [developerState, setDeveloperState] = useState({
    is_developer: false,
    developer_status: 'none',
    api_public_key: null,
    has_keys: false
  });
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [rawSecretKey, setRawSecretKey] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const devRes = await apiFetch('/developer/status');
      setDeveloperState(devRes);
      
      // If approved, fetch webhook config too
      if (devRes.developer_status === 'approved') {
        const webhookRes = await apiFetch('/developer/webhook/config');
        setWebhookUrl(webhookRes.webhook_url || '');
        setWebhookSecret(webhookRes.webhook_secret || '');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  const applyForDeveloper = async () => {
    setActionLoading(true);
    try {
      const data = await apiFetch('/developer/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ additional_info: '' })
      });
      setDeveloperState(data);
    } finally {
      setActionLoading(false);
    }
  };

  const generateKeys = async () => {
    setActionLoading(true);
    try {
      const data = await apiFetch('/developer/keys/generate', { method: 'POST' });
      setRawSecretKey(data.api_secret_key);
      setDeveloperState(prev => ({
        ...prev,
        api_public_key: data.api_public_key,
        has_keys: true
      }));
    } finally {
      setActionLoading(false);
    }
  };

  const revokeKeys = async () => {
    if (!window.confirm("Are you sure you want to revoke your API keys? This will immediately break any active integrations!")) return;
    setActionLoading(true);
    try {
      const data = await apiFetch('/developer/keys/revoke', { method: 'POST' });
      setDeveloperState(data);
      setRawSecretKey(null);
    } finally {
      setActionLoading(false);
    }
  };

  const saveWebhook = async () => {
    setActionLoading(true);
    try {
      const data = await apiFetch('/developer/webhook/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhook_url: webhookUrl })
      });
      setWebhookUrl(data.webhook_url || '');
      setWebhookSecret(data.webhook_secret || '');
      alert('Webhook URL saved successfully!');
    } catch (e) {
      alert('Failed to save webhook configuration.');
    } finally {
      setActionLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading developer portal...</div>;
  }

  // Derive sandbox public key by replacing live_ with test_
  const sandboxPublicKey = developerState.api_public_key ? developerState.api_public_key.replace('live_', 'test_') : null;

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Developer API"
        description="Manage your API credentials, endpoints, and webhooks for system integrations."
      />

      <div className="flex justify-between items-center bg-card border border-border p-4 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-full">
            <Code2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Application Status</h3>
            <p className="text-xs text-muted-foreground">Your current API access level</p>
          </div>
        </div>
        <Badge variant={developerState.developer_status === 'approved' ? 'success' : developerState.developer_status === 'applied' ? 'warning' : 'secondary'} className="px-3 py-1 text-sm capitalize">
          {developerState.developer_status}
        </Badge>
      </div>

      {developerState.developer_status === 'none' && (
        <Card className="border-dashed border-2 bg-muted/30">
          <CardContent className="flex flex-col items-center py-10 space-y-4">
            <Code2 className="w-12 h-12 text-muted-foreground/50" />
            <div className="text-center">
              <h3 className="text-lg font-medium mb-1">Build with MZDATA API</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
                Automate your data and airtime purchases by integrating directly with our powerful JSON API.
              </p>
              <Button onClick={applyForDeveloper} disabled={actionLoading} size="lg">
                {actionLoading ? 'Submitting Application...' : 'Apply for Developer Access'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {developerState.developer_status === 'applied' && (
        <div className="rounded-2xl bg-blue-500/10 border border-blue-500/20 p-5 text-sm text-blue-400 flex gap-3 items-start">
          <CheckCircle2 className="w-5 h-5 mt-0.5" />
          <div>
            <p className="font-medium text-blue-300">Application Received</p>
            <p className="mt-1 opacity-90">Your application is currently under review by our admin team. We will verify and update your status shortly.</p>
          </div>
        </div>
      )}

      {developerState.developer_status === 'approved' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Live API Keys</CardTitle>
              <CardDescription>Use these keys to authenticate API requests for real transactions on your production environment.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {!developerState.has_keys ? (
                <div className="text-center py-6 border rounded-xl bg-secondary/50">
                  <p className="text-sm text-muted-foreground mb-4">
                    Your application has been approved! Generate your credentials to begin integrations.
                  </p>
                  <Button onClick={generateKeys} disabled={actionLoading}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    {actionLoading ? 'Generating...' : 'Generate API Keys'}
                  </Button>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-sm font-medium leading-none text-muted-foreground">Public Key</label>
                    <div className="flex gap-2">
                      <Input readOnly value={developerState.api_public_key} className="font-mono text-sm bg-secondary" />
                      <Button variant="secondary" size="icon" onClick={() => copyToClipboard(developerState.api_public_key)}>
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {rawSecretKey ? (
                    <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-4 space-y-3">
                      <label className="text-sm font-medium leading-none text-emerald-400 font-semibold block">Secret Key (Copy now!)</label>
                      <div className="flex gap-2">
                        <Input readOnly value={rawSecretKey} className="font-mono text-sm bg-black/40 border-emerald-500/50 text-emerald-300" />
                        <Button variant="outline" className="border-emerald-500/50 hover:bg-emerald-500/20 text-emerald-300" size="icon" onClick={() => copyToClipboard(rawSecretKey)}>
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-emerald-500 leading-normal font-medium">
                        For security reasons, this key will not be shown again. Save it somewhere secure.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className="text-sm font-medium leading-none text-muted-foreground">Secret Key</label>
                      <Input readOnly value="****************************************" className="font-mono text-sm bg-secondary text-muted-foreground" />
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <Button variant="secondary" onClick={generateKeys} disabled={actionLoading}>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Regenerate Keys
                    </Button>
                    <Button variant="destructive" onClick={revokeKeys} disabled={actionLoading}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Revoke Access
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {developerState.has_keys && (
            <Card>
              <CardHeader>
                <CardTitle>Test (Sandbox) Keys</CardTitle>
                <CardDescription>Use these keys to simulate transactions without being charged. Perfect for testing your integration.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none text-muted-foreground">Test Public Key</label>
                  <div className="flex gap-2">
                    <Input readOnly value={sandboxPublicKey} className="font-mono text-sm bg-secondary" />
                    <Button variant="secondary" size="icon" onClick={() => copyToClipboard(sandboxPublicKey)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none text-muted-foreground">Test Secret Key</label>
                  <div className="flex gap-2">
                    <Input readOnly value={rawSecretKey ? rawSecretKey.replace('live_', 'test_') : "****************************************"} className="font-mono text-sm bg-secondary text-muted-foreground" />
                    {rawSecretKey && (
                      <Button variant="secondary" size="icon" onClick={() => copyToClipboard(rawSecretKey.replace('live_', 'test_'))}>
                        <Copy className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Webhook Configuration</CardTitle>
              <CardDescription>We will send HTTP POST requests to this URL when transactions succeed or fail.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none text-foreground">Webhook URL</label>
                <div className="flex gap-3">
                  <Input 
                    value={webhookUrl} 
                    onChange={(e) => setWebhookUrl(e.target.value)} 
                    placeholder="https://your-domain.com/webhook/mele" 
                    className="font-mono text-sm"
                  />
                  <Button onClick={saveWebhook} disabled={actionLoading}>Save</Button>
                </div>
              </div>

              {webhookSecret && (
                <div className="space-y-2 pt-2">
                  <label className="text-sm font-medium leading-none text-muted-foreground">Webhook Secret Hash</label>
                  <div className="flex gap-2">
                    <Input readOnly value={webhookSecret} className="font-mono text-sm bg-secondary text-muted-foreground" />
                    <Button variant="secondary" size="icon" onClick={() => copyToClipboard(webhookSecret)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Use this secret to verify the `x-mele-signature` header in incoming webhooks.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
