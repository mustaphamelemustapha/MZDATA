export const ADMIN_PLACEHOLDER = {
  referrals: [
    {
      id: 'ref-001',
      referral_code: 'AX8',
      referrer: 'Sample Referrer',
      referred_user: 'Sample User',
      first_deposit_amount: 10000,
      reward_amount: 200,
      status: 'pending',
      rewarded_at: null,
    },
  ],
  support: [
    {
      id: 'ticket-001',
      user: 'user@example.com',
      subject: 'Transaction complaint',
      message: 'User reported delayed fulfillment. Awaiting provider callback.',
      status: 'open',
      created_at: null,
    },
  ],
};

export const ADMIN_NOTES = {
  referrals: 'Referrals admin endpoint is not exposed yet. This panel is display-only until backend support is added.',
  walletAdjustments: 'Manual wallet adjustment is protected. Use only with traceable reason and follow internal finance approval steps.',
};
