import {
  BarChart3,
  Bell,
  CircleDollarSign,
  Clock3,
  Gauge,
  Gift,
  GraduationCap,
  Layers3,
  Package2,
  Smartphone,
  Tv2,
  UserCircle2,
  Zap,
  MessageCircle,
  Code2,
} from 'lucide-react';

export const appNav = [
  { label: 'Dashboard', href: '/dashboard', icon: Gauge },
  { label: 'Services', href: '/services', icon: Layers3 },
  { label: 'Buy Data', href: '/buy-data', icon: Package2 },
  { label: 'Airtime', href: '/airtime', icon: Smartphone },
  { label: 'Electricity', href: '/electricity', icon: Zap },
  { label: 'Cable TV', href: '/cable-tv', icon: Tv2 },
  { label: 'Exam PINs', href: '/exam-pins', icon: GraduationCap },
  { label: 'Wallet', href: '/wallet', icon: CircleDollarSign },
  { label: 'Referrals', href: '/referrals', icon: Gift },
  { label: 'Notifications', href: '/notifications', icon: Bell },
  { label: 'History', href: '/history', icon: Clock3 },
  { label: 'Developer API', href: '/developer', icon: Code2 },
  { label: 'Profile', href: '/profile', icon: UserCircle2 },
];

export const quickActions = [
  { label: 'Buy Data', href: '/buy-data', icon: Package2 },
  { label: 'Airtime', href: '/airtime', icon: Smartphone },
  { label: 'Fund Wallet', href: '/wallet', icon: CircleDollarSign },
  { label: 'View History', href: '/history', icon: BarChart3 },
  { label: 'Referrals', href: '/referrals', icon: Gift },
  { label: 'Profile', href: '/profile', icon: UserCircle2 },
];
