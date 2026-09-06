import React from 'react';

export const metadata = {
  title: 'Terms & Conditions | Mele Data',
  description: 'Terms and Conditions of Service for Mele Data application and web portal.',
};

export default function TermsAndConditions() {
  return (
    <main className="max-w-4xl mx-auto px-6 py-12 font-sans text-slate-800 dark:text-slate-200">
      <h1 className="text-4xl font-black mb-8 text-blue-600 dark:text-blue-400">Terms &amp; Conditions</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">Last Updated: April 28, 2026</p>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-slate-100">1. Agreement to Terms</h2>
        <p className="mb-4 leading-relaxed text-slate-700 dark:text-slate-300">
          By accessing or using Mele Data, you agree to be bound by these Terms and Conditions. 
          If you do not agree with any part of these terms, you must not access or use our services.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-slate-100">2. Account Registration and Wallet Safety</h2>
        <p className="mb-4 leading-relaxed text-slate-700 dark:text-slate-300">
          To purchase services, you must register and fund your digital wallet. You are responsible for:
        </p>
        <ul className="list-disc ml-6 mb-4 space-y-2 text-slate-700 dark:text-slate-300">
          <li>Providing accurate and complete registration info.</li>
          <li>Maintaining the confidentiality of your account credentials and 4-digit transaction PIN.</li>
          <li>All transactions carried out under your account.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-slate-100">3. Services and Purchases</h2>
        <p className="mb-4 leading-relaxed text-slate-700 dark:text-slate-300">
          Mele Data provides mobile airtime, data packages, utility bill payments, and educational PINs. 
          All transactions are final once processed. 
          If a transaction fails due to provider downtime, the system will automatically refund the debited amount to your wallet balance.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-slate-100">4. Wallet Funding</h2>
        <p className="mb-4 leading-relaxed text-slate-700 dark:text-slate-300">
          Wallet balances are funded via bank transfers to virtual accounts assigned to you. 
          We do not charge deposit fees (0% deposit charges), but any third-party gateway fees are subject to their respective terms.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-slate-100">5. Prohibited Uses</h2>
        <p className="mb-4 leading-relaxed text-slate-700 dark:text-slate-300">
          You agree not to use the services for any unlawful activities, fraudulent transactions, or attempts to disrupt the security or integrity of our systems. 
          Any suspicious activity will lead to immediate account suspension and review.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-slate-100">6. Contact Us</h2>
        <p className="mb-4 leading-relaxed text-slate-700 dark:text-slate-300">
          For any clarifications regarding these Terms and Conditions, please contact our support desk at mzdata@gmail.com.
        </p>
      </section>

      <footer className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800 text-center text-slate-500 dark:text-slate-400 text-sm">
        &copy; 2026 Mele Data. Powered by MMTECHGLOBE.
      </footer>
    </main>
  );
}
