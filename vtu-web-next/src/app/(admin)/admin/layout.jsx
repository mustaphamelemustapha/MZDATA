'use client';

import { useState } from 'react';
import { AdminGuard } from '@/components/admin/admin-guard';
import { AdminShell } from '@/components/admin/admin-shell';

export default function AdminLayout({ children }) {
  const [profile, setProfile] = useState(null);

  return (
    <AdminGuard onProfile={setProfile}>
      <AdminShell profile={profile}>{children}</AdminShell>
    </AdminGuard>
  );
}
