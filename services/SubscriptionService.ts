import { adapty, AdaptyPaywallProduct, AdaptyProfile } from 'react-native-adapty';

// In Expo Go the SDK runs in mock mode on its own: purchases succeed without
// charging and grant the "premium" access level, so the paywall can be tested.
const API_KEY = process.env.EXPO_PUBLIC_ADAPTY_KEY ?? '';
const PLACEMENT_ID = process.env.EXPO_PUBLIC_ADAPTY_PLACEMENT ?? 'main';
const ACCESS_LEVEL = 'premium';

let activation: Promise<void> | null = null;

const hasAccess = (profile: AdaptyProfile) => !!profile.accessLevels?.[ACCESS_LEVEL]?.isActive;

export const SubscriptionService = {
  activate(): Promise<void> {
    activation ??= adapty
      .activate(API_KEY, { __ignoreActivationOnFastRefresh: true })
      .catch((error) => {
        activation = null;
        throw error;
      });
    return activation;
  },

  async isPremium(): Promise<boolean> {
    await this.activate();
    return hasAccess(await adapty.getProfile());
  },

  /** The products configured for the paywall placement in the Adapty dashboard. */
  async getProducts(): Promise<AdaptyPaywallProduct[]> {
    await this.activate();
    const flow = await adapty.getFlow(PLACEMENT_ID);
    adapty.logShowFlow(flow).catch(() => {});
    return adapty.getPaywallProducts(flow);
  },

  /** True once the purchase has granted access; false if cancelled or pending. */
  async purchase(product: AdaptyPaywallProduct): Promise<boolean> {
    const result = await adapty.makePurchase(product);
    return result.type === 'success' && hasAccess(result.profile);
  },

  async restore(): Promise<boolean> {
    await this.activate();
    return hasAccess(await adapty.restorePurchases());
  },

  /** Ties the Adapty profile to the backend account, so a webhook can find it. */
  async identify(userId: string) {
    await this.activate();
    await adapty.identify(userId);
  },
};

export const periodUnit = (product: AdaptyPaywallProduct) =>
  product.subscription?.subscriptionPeriod.unit ?? null;
