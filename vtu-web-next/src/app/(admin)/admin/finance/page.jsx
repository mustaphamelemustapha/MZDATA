'use client';

import { useState, useEffect } from 'react';
import { adminGetFinanceOverview } from '@/lib/api';
import { 
  Banknote, 
  Building,
  Scale,
  AlertTriangle,
  Info
} from 'lucide-react';

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount || 0);
}

export default function FinancePage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const res = await adminGetFinanceOverview();
      setData(res);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load finance data');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <h3 className="text-sm font-medium text-red-800">Error</h3>
        <div className="mt-2 text-sm text-red-700">{error}</div>
        <button onClick={fetchData} className="mt-4 text-sm font-medium text-red-800 hover:text-red-700">Try again</button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Financial Position</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Strict accounting overview separating revenue, operating costs, and liabilities.
          </p>
        </div>
        <button onClick={fetchData} className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-white dark:ring-gray-700 dark:hover:bg-gray-700">
          Refresh
        </button>
      </div>

      {/* DATA QUALITY WARNING */}
      <div className="rounded-md bg-blue-50 p-4 dark:bg-blue-900/20">
        <div className="flex">
          <div className="flex-shrink-0">
            <Info className="h-5 w-5 text-blue-400" aria-hidden="true" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">Data Quality & Estimations</h3>
            <div className="mt-2 text-sm text-blue-700 dark:text-blue-200">
              <ul className="list-disc space-y-1 pl-5">
                <li>Historical COGS: <strong>{data.cogs.is_estimated ? 'ESTIMATED' : 'ACTUAL'}</strong> (Uses current DataPlan.base_price and assumed Airtime discount)</li>
                <li>Payment Fees: <strong>{data.payment_fees.is_estimated ? 'ESTIMATED' : 'ACTUAL'}</strong> (Calculated from wallet funds)</li>
                <li>Wallet Liability: <strong>ACTUAL</strong> (Live sum of user wallets)</li>
                <li>Provider Balances: <strong>LIVE</strong> (Fetched from external APIs)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* P&L SECTION */}
        <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-800">
          <div className="border-b border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-800 dark:bg-gray-800/50">
            <h3 className="text-base font-semibold leading-6 text-gray-900 dark:text-white flex items-center">
              <Banknote className="mr-2 h-5 w-5 text-gray-400" />
              Profit & Loss (P&L)
            </h3>
          </div>
          <div className="px-6 py-6">
            <dl className="space-y-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500 dark:text-gray-400 font-medium">Service Revenue</dt>
                <dd className="text-gray-900 dark:text-white font-semibold">{formatCurrency(data.revenue.actual)}</dd>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-4 dark:border-gray-800 relative group">
                <dt className="text-gray-500 dark:text-gray-400 flex items-center">
                  Estimated COGS (Provider Cost)
                  <span className="ml-2 inline-flex items-center rounded-md bg-yellow-50 px-1.5 py-0.5 text-xs font-medium text-yellow-800 ring-1 ring-inset ring-yellow-600/20 dark:bg-yellow-900/30 dark:text-yellow-500">ESTIMATED</span>
                </dt>
                <dd className="text-red-600 dark:text-red-400 font-medium">-{formatCurrency(data.cogs.total)}</dd>
              </div>
              
              <div className="flex justify-between pt-2">
                <dt className="text-gray-900 dark:text-white font-bold text-base">Gross Margin</dt>
                <dd className="text-gray-900 dark:text-white font-bold text-base">{formatCurrency(data.gross_margin)}</dd>
              </div>
              
              <div className="flex justify-between pt-4">
                <dt className="text-gray-500 dark:text-gray-400">Promotional Rewards (Agent)</dt>
                <dd className="text-red-600 dark:text-red-400 font-medium">-{formatCurrency(data.promotional_expense)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500 dark:text-gray-400">Referral Rewards</dt>
                <dd className="text-red-600 dark:text-red-400 font-medium">-{formatCurrency(data.referral_expense)}</dd>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-4 dark:border-gray-800">
                <dt className="text-gray-500 dark:text-gray-400 flex items-center">
                  Estimated Payment Fees
                  <span className="ml-2 inline-flex items-center rounded-md bg-yellow-50 px-1.5 py-0.5 text-xs font-medium text-yellow-800 ring-1 ring-inset ring-yellow-600/20 dark:bg-yellow-900/30 dark:text-yellow-500">ESTIMATED</span>
                </dt>
                <dd className="text-red-600 dark:text-red-400 font-medium">-{formatCurrency(data.payment_fees.total)}</dd>
              </div>

              <div className="flex justify-between pt-2">
                <dt className="text-green-600 dark:text-green-400 font-bold text-lg flex flex-col">
                  Net Profit
                  {data.is_net_profit_estimated && (
                    <span className="text-xs font-normal text-gray-500 mt-1">Includes estimated costs</span>
                  )}
                </dt>
                <dd className="text-green-600 dark:text-green-400 font-bold text-lg">{formatCurrency(data.net_profit)}</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* FINANCIAL POSITION SECTION */}
        <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-800">
          <div className="border-b border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-800 dark:bg-gray-800/50 flex justify-between items-center">
            <h3 className="text-base font-semibold leading-6 text-gray-900 dark:text-white flex items-center">
              <Scale className="mr-2 h-5 w-5 text-gray-400" />
              Financial Position (Balance Sheet)
            </h3>
          </div>
          <div className="px-6 py-6">
            <dl className="space-y-4 text-sm">
              {/* ASSETS */}
              <div className="flex justify-between text-base font-semibold text-gray-900 dark:text-white border-b border-gray-100 pb-2 dark:border-gray-800">
                <dt>Assets</dt>
                <dd>{formatCurrency(data.company_assets.total + data.receivables)}</dd>
              </div>
              <div className="flex justify-between pl-4">
                <dt className="text-gray-500 dark:text-gray-400">Company Assets (Providers)</dt>
                <dd className="text-gray-900 dark:text-white font-medium">{formatCurrency(data.company_assets.total)}</dd>
              </div>
              <div className="flex justify-between pl-4 pb-4">
                <dt className="text-gray-500 dark:text-gray-400">Receivables</dt>
                <dd className="text-gray-900 dark:text-white font-medium">{formatCurrency(data.receivables)}</dd>
              </div>

              {/* LIABILITIES */}
              <div className="flex justify-between text-base font-semibold text-gray-900 dark:text-white border-b border-gray-100 pb-2 pt-2 dark:border-gray-800">
                <dt>Liabilities</dt>
                <dd>{formatCurrency(data.customer_wallet_liability + data.business_debts)}</dd>
              </div>
              <div className="flex justify-between pl-4">
                <dt className="text-gray-500 dark:text-gray-400">Customer Wallet Liability</dt>
                <dd className="text-red-600 dark:text-red-400 font-medium">{formatCurrency(data.customer_wallet_liability)}</dd>
              </div>
              <div className="flex justify-between pl-4 pb-4">
                <dt className="text-gray-500 dark:text-gray-400">Business Debts</dt>
                <dd className="text-red-600 dark:text-red-400 font-medium">{formatCurrency(data.business_debts)}</dd>
              </div>

              {/* EQUITY */}
              <div className="flex justify-between text-base font-semibold text-gray-900 dark:text-white border-b border-gray-100 pb-2 pt-2 dark:border-gray-800">
                <dt>Equity</dt>
                <dd>{formatCurrency(data.net_equity)}</dd>
              </div>
              <div className="flex justify-between pl-4">
                <dt className="text-gray-500 dark:text-gray-400">Owner Capital</dt>
                <dd className="text-gray-900 dark:text-white font-medium">{formatCurrency(data.owner_capital)}</dd>
              </div>
              <div className="flex justify-between pl-4">
                <dt className="text-gray-500 dark:text-gray-400">Accumulated Profit</dt>
                <dd className="text-gray-900 dark:text-white font-medium">{formatCurrency(data.net_profit)}</dd>
              </div>
            </dl>
          </div>
          
          {/* RECONCILIATION GAP */}
          <div className={`px-6 py-4 border-t ${Math.abs(data.reconciliation_gap) > 1 ? 'bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-900/50' : 'bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-900/50'}`}>
             <div className="flex items-start">
              <div className="flex-shrink-0 mt-0.5">
                {Math.abs(data.reconciliation_gap) > 1 ? (
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                ) : (
                  <Info className="h-5 w-5 text-green-500" />
                )}
              </div>
              <div className="ml-3">
                <h3 className={`text-sm font-medium ${Math.abs(data.reconciliation_gap) > 1 ? 'text-red-800 dark:text-red-400' : 'text-green-800 dark:text-green-400'}`}>
                  Reconciliation Gap: {formatCurrency(data.reconciliation_gap)}
                </h3>
                {Math.abs(data.reconciliation_gap) > 1 && (
                  <p className="mt-1 text-xs text-red-700 dark:text-red-300">
                    Difference between observed assets and expected assets. Causes: missing historical expenses, unrecorded capital/withdrawals, or COGS estimation errors.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* PROVIDER ASSETS TABLE */}
      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-800">
        <div className="border-b border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-800 dark:bg-gray-800/50">
          <h3 className="text-base font-semibold leading-6 text-gray-900 dark:text-white flex items-center">
            <Building className="mr-2 h-5 w-5 text-gray-400" />
            Company Assets (Provider Balances)
          </h3>
        </div>
        <ul role="list" className="divide-y divide-gray-100 dark:divide-gray-800">
          {data.company_assets.providers.map((provider, index) => (
            <li key={index} className="flex items-center justify-between gap-x-6 px-6 py-4">
              <div className="min-w-0">
                <div className="flex items-start gap-x-3">
                  <p className="text-sm font-semibold leading-6 text-gray-900 dark:text-white">{provider.name}</p>
                  <p className={`rounded-md whitespace-nowrap mt-0.5 px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset ${provider.type === 'ERROR' ? 'bg-red-50 text-red-700 ring-red-600/20' : 'bg-green-50 text-green-700 ring-green-600/20'}`}>
                    {provider.type}
                  </p>
                </div>
                {provider.error && <p className="mt-1 truncate text-xs leading-5 text-red-500">{provider.error}</p>}
              </div>
              <div className="flex flex-none items-center gap-x-4">
                <p className="text-sm font-medium leading-6 text-gray-900 dark:text-white">{formatCurrency(provider.balance)}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

    </div>
  );
}
