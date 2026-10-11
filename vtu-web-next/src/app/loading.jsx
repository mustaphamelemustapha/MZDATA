'use client';

import { BrandLoader } from '@/components/brand-loader';

export default function Loading() {
  return <BrandLoader message="Loading workspace" subtitle="Preparing your secure session..." />;
}
