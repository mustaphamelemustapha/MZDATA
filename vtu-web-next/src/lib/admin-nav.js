import {
  Activity,
  BadgeDollarSign,
  CircleDollarSign,
  Headset,
  LayoutDashboard,
  PackageSearch,
  Settings,
  Users,
  ReceiptText,
  Gift,
  Briefcase,
  Award,
  Ticket,
  Plug,
  Code,
} from "lucide-react";

export const adminNav = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard },
  { label: "Finance", href: "/admin/finance", icon: BadgeDollarSign },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Agents", href: "/admin/agents", icon: Briefcase },
  { label: "Ambassadors", href: "/admin/ambassadors", icon: Award },
  { label: "API Users", href: "/admin/api-users", icon: Code },
  { label: "Transactions", href: "/admin/transactions", icon: ReceiptText },
  { label: "Wallets", href: "/admin/wallets", icon: CircleDollarSign },
  { label: "Services", href: "/admin/services", icon: Activity },
  { label: "Data Plans", href: "/admin/data-plans", icon: PackageSearch },
  { label: "Referrals", href: "/admin/referrals", icon: Gift },
  { label: "Promos", href: "/admin/promos", icon: Ticket },
  { label: "Integrations", href: "/admin/integrations", icon: Plug },
  { label: "Support", href: "/admin/support", icon: Headset },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

export const adminQuickLinks = [
  { label: "Users", href: "/admin/users" },
  { label: "Transactions", href: "/admin/transactions" },
  { label: "Support Inbox", href: "/admin/support" },
  { label: "Settings", href: "/admin/settings" },
];

export const statusTones = {
  success: "success",
  completed: "success",
  active: "success",
  verified: "success",
  resolved: "success",
  rewarded: "success",
  enabled: "success",
  pending: "warning",
  unverified: "danger",
  open: "warning",
  inactive: "warning",
  queued: "warning",
  in_review: "warning",
  inreview: "warning",
  processing: "warning",
  draft: "warning",
  failed: "danger",
  suspended: "danger",
  disabled: "danger",
  refunded: "danger",
  rejected: "danger",
};

export const ROLE_ADMIN = "admin";
