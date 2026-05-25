import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { hasSupabaseEnv } from '../lib/env';
import {
  buildEntitlementSnapshot,
  EntitlementSnapshot,
  getMonthStartIso,
  getNextMonthStartIso,
  isActivePaidSubscription,
  isPaidBillingInvoice,
  readCachedEntitlement,
  writeCachedEntitlement,
} from '../lib/entitlements';

const EMPTY_USAGE = {
  aiGenerationsThisMonth: 0,
  savedTexts: 0,
  savedSessions: 0,
};

export function useEntitlements(user: User | null) {
  const [entitlements, setEntitlements] = useState<EntitlementSnapshot>(() =>
    buildEntitlementSnapshot({ isPro: false, usage: EMPTY_USAGE, resolved: false }),
  );
  const [loadingEntitlements, setLoadingEntitlements] = useState(Boolean(user));

  async function refreshEntitlements() {
    if (!user || !hasSupabaseEnv()) {
      setEntitlements(buildEntitlementSnapshot({ isPro: false, usage: EMPTY_USAGE, resolved: true }));
      setLoadingEntitlements(false);
      return;
    }

    setLoadingEntitlements(true);
    const cachedPlan = readCachedEntitlement(user.id);
    if (cachedPlan) {
      setEntitlements(buildEntitlementSnapshot({ isPro: cachedPlan === 'pro', usage: entitlements.usage, resolved: false }));
    }

    const monthStart = getMonthStartIso();
    const nextMonthStart = getNextMonthStartIso();
    try {
      const [subscriptionResult, invoiceResult, usageEventsResult, generatedResult, savedTextsResult, sessionsResult] = await Promise.all([
        supabase
          .from('user_subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10),
        supabase
          .from('billing_invoices')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10),
        supabase
          .from('usage_events')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('feature_key', 'ai_generation')
          .gte('created_at', monthStart)
          .lt('created_at', nextMonthStart),
        supabase
          .from('generated_texts')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', monthStart)
          .lt('created_at', nextMonthStart),
        supabase.from('saved_texts').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('dictation_sessions').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      ]);

      const aiGenerationsThisMonth = Math.max(usageEventsResult.count ?? 0, generatedResult.count ?? 0);
      const subscriptionIsPro = subscriptionResult.data?.some((subscription) => isActivePaidSubscription(subscription)) ?? false;
      const invoiceIsPro = invoiceResult.data?.some((invoice) => isPaidBillingInvoice(invoice)) ?? false;
      const billingReadSucceeded = !subscriptionResult.error && !invoiceResult.error;
      const isPro = subscriptionIsPro || invoiceIsPro || cachedPlan === 'pro';

      if (billingReadSucceeded || isPro) {
        writeCachedEntitlement(user.id, isPro);
      }
      setEntitlements(
        buildEntitlementSnapshot({
          isPro,
          usage: {
            aiGenerationsThisMonth,
            savedTexts: savedTextsResult.count ?? 0,
            savedSessions: sessionsResult.count ?? 0,
          },
          resolved: true,
        }),
      );
    } finally {
      setLoadingEntitlements(false);
    }
  }

  useEffect(() => {
    if (user) {
      const cachedPlan = readCachedEntitlement(user.id);
      setEntitlements(buildEntitlementSnapshot({ isPro: cachedPlan === 'pro', usage: EMPTY_USAGE, resolved: false }));
      setLoadingEntitlements(true);
    }

    void refreshEntitlements();
  }, [user?.id]);

  return { entitlements, loadingEntitlements, refreshEntitlements };
}
