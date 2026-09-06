import React from 'react';

export const metadata = {
  title: 'Privacy Policy | Mele Data',
  description: 'Privacy Policy for Mele Data mobile application and services.',
};

export default function PrivacyPolicy() {
  return (
    <main className="max-w-4xl mx-auto px-6 py-12 font-sans text-slate-800 dark:text-slate-200">
      <h1 className="text-4xl font-black mb-8 text-blue-600 dark:text-blue-400">Privacy Policy</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">Last Updated: April 28, 2026</p>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-slate-100">1. Introduction</h2>
        <p className="mb-4 leading-relaxed text-slate-700 dark:text-slate-300">
          Welcome to Mele Data. We are committed to protecting your personal information and your right to privacy. 
          This Privacy Policy explains how we collect, use, and safeguard your data when you use our mobile application and web services.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-slate-100">2. Information We Collect</h2>
        <p className="mb-4 leading-relaxed text-slate-700 dark:text-slate-300">
          We collect information that you provide directly to us, such as:
        </p>
        <ul className="list-disc ml-6 mb-4 space-y-2 text-slate-700 dark:text-slate-300">
          <li>Name and contact information (Email, Phone Number)</li>
          <li>Transaction details for VTU, data, and bill payments</li>
          <li>Wallet funding information and payment references</li>
          <li>Device information and app usage statistics</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-slate-100">3. How We Use Your Information</h2>
        <p className="mb-4 leading-relaxed text-slate-700 dark:text-slate-300">
          We use the collected data to:
        </p>
        <ul className="list-disc ml-6 mb-4 space-y-2 text-slate-700 dark:text-slate-300">
          <li>Process your transactions and deliver services instantly</li>
          <li>Manage your wallet and secure your payments</li>
          <li>Provide customer support and resolve technical issues</li>
          <li>Improve our app performance and user experience</li>
          <li>Send important service updates and notifications</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-slate-100">4. Data Security</h2>
        <p className="mb-4 leading-relaxed text-slate-700 dark:text-slate-300">
          We implement a variety of security measures to maintain the safety of your personal information. 
          All transactions are processed through secure gateways and we do not store sensitive payment card details on our servers.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-slate-100">5. Third-Party Services</h2>
        <p className="mb-4 leading-relaxed text-slate-700 dark:text-slate-300">
          We may share information with third-party service providers (such as payment processors and network operators) 
          only to the extent necessary to fulfill your transaction requests.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-slate-100">6. Contact Us</h2>
        <p className="mb-4 leading-relaxed text-slate-700 dark:text-slate-300">
          If you have any questions about this Privacy Policy, please contact us at mzdata@gmail.com.
        </p>
      </section>

      <footer className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800 text-center text-slate-500 dark:text-slate-400 text-sm">
        &copy; 2026 Mele Data. Powered by MMTECHGLOBE.
      </footer>
    </main>
  );
}
