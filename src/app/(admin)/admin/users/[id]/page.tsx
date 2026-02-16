"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeftIcon,
  ShieldCheckIcon,
  EnvelopeIcon,
  PhoneIcon,
  BriefcaseIcon,
  CalendarIcon,
  ClockIcon,
  GlobeAltIcon,
  MapPinIcon,
  BuildingOffice2Icon,
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon,
  StarIcon,
} from "@heroicons/react/24/outline";
import {
  formatDate,
  formatPhone,
  getInitials,
} from "@/lib/utils/format";

interface Membership {
  org_id: string;
  role: string;
  org_name: string | null;
  plan: string | null;
  slug: string | null;
  contacts: number;
  deals: number;
  referrals: number;
}

interface DirectoryProfile {
  display_name: string;
  company_name: string | null;
  industry: string | null;
  location: string | null;
  bio: string | null;
  specialties: string[];
  referral_categories: string[];
  accepts_referrals: boolean;
  is_visible: boolean;
  avatar_url: string | null;
}

interface TrustScore {
  trust_rating: number;
  acceptance_rate: number;
  conversion_rate: number;
  responsiveness: number;
  avg_response_hours: number;
  total_sent: number;
  sent_accepted: number;
  sent_declined: number;
  sent_converted: number;
  total_received: number;
  received_accepted: number;
  received_declined: number;
  received_converted: number;
}

interface UserDetail {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  job_title: string | null;
  is_platform_admin: boolean;
  active_org_id: string | null;
  created_at: string;
  updated_at: string;
  email: string | null;
  last_sign_in_at: string | null;
  memberships: Membership[];
  directory_profile: DirectoryProfile | null;
  trust_score: TrustScore | null;
}

export default function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [impersonating, setImpersonating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${id}`);
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to load user");
        return;
      }
      setUser(await res.json());
    } catch {
      setError("Failed to load user");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleImpersonate() {
    if (!user || user.memberships.length === 0) return;
    const org = user.memberships[0];

    setImpersonating(true);
    try {
      const res = await fetch("/api/admin/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId: org.org_id }),
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem(
          "impersonating_org",
          JSON.stringify({
            orgName: data.orgName,
            originalOrgId: data.originalOrgId,
            userId: user!.id,
          })
        );
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      console.error("Failed to impersonate:", err);
    } finally {
      setImpersonating(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-6 w-48 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-48 animate-pulse rounded-xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900"
          />
        ))}
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="space-y-4">
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
        >
          <ArrowLeftIcon className="size-4" />
          Back to Users
        </Link>
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-900 dark:bg-red-950/30">
          <p className="text-sm text-red-600 dark:text-red-400">
            {error || "User not found"}
          </p>
        </div>
      </div>
    );
  }

  const nameParts = user.full_name?.split(" ") || [];
  const initials = getInitials(nameParts[0], nameParts.slice(1).join(" "));

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
      >
        <ArrowLeftIcon className="size-4" />
        Back to Users
      </Link>

      {/* Header Card */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt=""
                className="size-16 rounded-full object-cover"
              />
            ) : (
              <div className="flex size-16 items-center justify-center rounded-full bg-zinc-200 text-lg font-semibold text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
                {initials}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {user.full_name || "Unnamed User"}
                </h1>
                {user.is_platform_admin && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-300">
                    <ShieldCheckIcon className="size-3" />
                    ADMIN
                  </span>
                )}
              </div>
              {user.job_title && (
                <p className="mt-0.5 text-sm text-zinc-500">{user.job_title}</p>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-zinc-500">
                {user.email && (
                  <span className="flex items-center gap-1">
                    <EnvelopeIcon className="size-3.5" />
                    {user.email}
                  </span>
                )}
                {user.phone && (
                  <span className="flex items-center gap-1">
                    <PhoneIcon className="size-3.5" />
                    {formatPhone(user.phone)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Impersonate button */}
          {user.memberships.length > 0 && !user.is_platform_admin && (
            <button
              onClick={handleImpersonate}
              disabled={impersonating}
              className="rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {impersonating ? "Switching..." : "Impersonate"}
            </button>
          )}
        </div>

        {/* Dates */}
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 border-t border-zinc-100 pt-4 text-sm text-zinc-500 dark:border-zinc-800">
          <span className="flex items-center gap-1">
            <CalendarIcon className="size-3.5" />
            Joined {formatDate(user.created_at)}
          </span>
          {user.last_sign_in_at && (
            <span className="flex items-center gap-1">
              <ClockIcon className="size-3.5" />
              Last sign-in {formatDate(user.last_sign_in_at)}
            </span>
          )}
        </div>
      </div>

      {/* Org Memberships */}
      <div className="rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="border-b border-zinc-100 px-6 py-4 dark:border-zinc-800">
          <h2 className="font-serif text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Organization Memberships
          </h2>
        </div>
        {user.memberships.length === 0 ? (
          <div className="px-6 py-8 text-center text-sm text-zinc-400">
            No organization memberships.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                    Organization
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                    Plan
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">
                    Contacts
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">
                    Deals
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">
                    Referrals
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {user.memberships.map((m) => (
                  <tr key={m.org_id}>
                    <td className="whitespace-nowrap px-6 py-3 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {m.org_name || "—"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-3 text-sm capitalize text-zinc-500">
                      {m.role}
                    </td>
                    <td className="whitespace-nowrap px-6 py-3">
                      <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium capitalize text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                        {m.plan || "—"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-3 text-right text-sm text-zinc-500">
                      {m.contacts}
                    </td>
                    <td className="whitespace-nowrap px-6 py-3 text-right text-sm text-zinc-500">
                      {m.deals}
                    </td>
                    <td className="whitespace-nowrap px-6 py-3 text-right text-sm text-zinc-500">
                      {m.referrals}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Directory Profile */}
      {user.directory_profile && (
        <div className="rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="border-b border-zinc-100 px-6 py-4 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Directory Profile
              </h2>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                  user.directory_profile.is_visible
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                    : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                }`}
              >
                {user.directory_profile.is_visible ? (
                  <EyeIcon className="size-3" />
                ) : (
                  <EyeSlashIcon className="size-3" />
                )}
                {user.directory_profile.is_visible ? "Visible" : "Hidden"}
              </span>
            </div>
          </div>
          <div className="grid gap-4 p-6 sm:grid-cols-2">
            <InfoRow
              icon={GlobeAltIcon}
              label="Display Name"
              value={user.directory_profile.display_name}
            />
            <InfoRow
              icon={BuildingOffice2Icon}
              label="Company"
              value={user.directory_profile.company_name}
            />
            <InfoRow
              icon={BriefcaseIcon}
              label="Industry"
              value={user.directory_profile.industry}
            />
            <InfoRow
              icon={MapPinIcon}
              label="Location"
              value={user.directory_profile.location}
            />
            {user.directory_profile.bio && (
              <div className="sm:col-span-2">
                <p className="text-xs font-medium uppercase text-zinc-400">
                  Bio
                </p>
                <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
                  {user.directory_profile.bio}
                </p>
              </div>
            )}
            {user.directory_profile.specialties.length > 0 && (
              <div className="sm:col-span-2">
                <p className="text-xs font-medium uppercase text-zinc-400">
                  Specialties
                </p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {user.directory_profile.specialties.map((s) => (
                    <span
                      key={s}
                      className="rounded-full bg-primary-100 px-2 py-0.5 text-xs text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {user.directory_profile.referral_categories.length > 0 && (
              <div className="sm:col-span-2">
                <p className="text-xs font-medium uppercase text-zinc-400">
                  Referral Categories
                </p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {user.directory_profile.referral_categories.map((c) => (
                    <span
                      key={c}
                      className="rounded-full bg-tan-100 px-2 py-0.5 text-xs text-tan-700 dark:bg-tan-900/30 dark:text-tan-300"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div>
              <p className="text-xs font-medium uppercase text-zinc-400">
                Accepts Referrals
              </p>
              <p className="mt-1 flex items-center gap-1 text-sm text-zinc-700 dark:text-zinc-300">
                {user.directory_profile.accepts_referrals ? (
                  <>
                    <CheckCircleIcon className="size-4 text-green-500" />
                    Yes
                  </>
                ) : (
                  "No"
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Trust Score */}
      {user.trust_score && (
        <div className="rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="border-b border-zinc-100 px-6 py-4 dark:border-zinc-800">
            <h2 className="font-serif text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Exchange Trust Score
            </h2>
          </div>
          <div className="p-6">
            {/* Score metrics */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <ScoreCard
                label="Trust Rating"
                value={Number(user.trust_score.trust_rating).toFixed(1)}
                icon={StarIcon}
              />
              <ScoreCard
                label="Acceptance Rate"
                value={`${Math.round(Number(user.trust_score.acceptance_rate))}%`}
              />
              <ScoreCard
                label="Conversion Rate"
                value={`${Math.round(Number(user.trust_score.conversion_rate))}%`}
              />
              <ScoreCard
                label="Responsiveness"
                value={`${Math.round(Number(user.trust_score.responsiveness))}%`}
              />
            </div>

            {/* Exchange totals */}
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-zinc-100 p-4 dark:border-zinc-800">
                <p className="text-xs font-medium uppercase text-zinc-400">
                  Sent
                </p>
                <p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
                  {user.trust_score.total_sent}
                </p>
                <div className="mt-2 flex gap-3 text-xs text-zinc-500">
                  <span>Accepted: {user.trust_score.sent_accepted}</span>
                  <span>Declined: {user.trust_score.sent_declined}</span>
                  <span>Converted: {user.trust_score.sent_converted}</span>
                </div>
              </div>
              <div className="rounded-lg border border-zinc-100 p-4 dark:border-zinc-800">
                <p className="text-xs font-medium uppercase text-zinc-400">
                  Received
                </p>
                <p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
                  {user.trust_score.total_received}
                </p>
                <div className="mt-2 flex gap-3 text-xs text-zinc-500">
                  <span>Accepted: {user.trust_score.received_accepted}</span>
                  <span>Declined: {user.trust_score.received_declined}</span>
                  <span>Converted: {user.trust_score.received_converted}</span>
                </div>
              </div>
            </div>

            {user.trust_score.avg_response_hours > 0 && (
              <p className="mt-4 text-sm text-zinc-500">
                Average response time:{" "}
                <span className="font-medium text-zinc-700 dark:text-zinc-300">
                  {Number(user.trust_score.avg_response_hours).toFixed(1)} hours
                </span>
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | null | undefined;
}) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs font-medium uppercase text-zinc-400">{label}</p>
      <p className="mt-1 flex items-center gap-1.5 text-sm text-zinc-700 dark:text-zinc-300">
        <Icon className="size-3.5 text-zinc-400" />
        {value}
      </p>
    </div>
  );
}

function ScoreCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-lg border border-zinc-100 p-3 text-center dark:border-zinc-800">
      <p className="text-xs font-medium uppercase text-zinc-400">{label}</p>
      <p className="mt-1 flex items-center justify-center gap-1 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
        {Icon && <Icon className="size-5 text-tan-500" />}
        {value}
      </p>
    </div>
  );
}
