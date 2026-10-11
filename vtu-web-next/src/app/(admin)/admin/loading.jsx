'use client';

import { BrandLoader } from '@/components/brand-loader';

export default function AdminLoading() {
  return <BrandLoader message="Loading admin workspace" subtitle="Preparing management dashboard..." />;
}
