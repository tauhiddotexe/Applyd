import { useState, useMemo } from 'react';

const SPECIAL_DOMAINS = {
  'google': 'google.com',
  'meta': 'meta.com',
  'facebook': 'facebook.com',
  'microsoft': 'microsoft.com',
  'apple': 'apple.com',
  'amazon': 'amazon.com',
  'netflix': 'netflix.com',
  'spotify': 'spotify.com',
  'slack': 'slack.com',
  'twitter': 'x.com',
  'x': 'x.com',
  'linkedin': 'linkedin.com',
  'github': 'github.com',
  'gitlab': 'gitlab.com',
  'figma': 'figma.com',
  'notion': 'notion.so',
  'vercel': 'vercel.com',
  'stripe': 'stripe.com',
  'shopify': 'shopify.com',
  'airbnb': 'airbnb.com',
  'uber': 'uber.com',
  'lyft': 'lyft.com',
  'doordash': 'doordash.com',
  'instacart': 'instacart.com',
  'datadog': 'datadoghq.com',
  'cloudflare': 'cloudflare.com',
  'digitalocean': 'digitalocean.com',
  'hashicorp': 'hashicorp.com',
  'mongodb': 'mongodb.com',
  'redis': 'redis.io',
  'discord': 'discord.com',
  'twitch': 'twitch.tv',
  'zoom': 'zoom.us',
  'square': 'squareup.com',
  'paypal': 'paypal.com',
  'coinbase': 'coinbase.com',
  'robinhood': 'robinhood.com',
  'tesla': 'tesla.com',
  'nvidia': 'nvidia.com',
  'amd': 'amd.com',
  'intel': 'intel.com',
  'ibm': 'ibm.com',
  'oracle': 'oracle.com',
  'salesforce': 'salesforce.com',
  'adobe': 'adobe.com',
  'atlassian': 'atlassian.com',
  'twilio': 'twilio.com',
  'sentry': 'sentry.io',
  'okta': 'okta.com',
  'auth0': 'auth0.com',
  'clerk': 'clerk.com',
  'supabase': 'supabase.com',
};

function resolveDomain(company, link) {
  if (link) {
    try {
      const parsed = new URL(link);
      return parsed.hostname.replace(/^www\./, '');
    } catch {}
  }

  const clean = company?.toLowerCase().trim();
  if (!clean) return null;
  if (SPECIAL_DOMAINS[clean]) return SPECIAL_DOMAINS[clean];

  const slug = clean.replace(/[^a-z0-9]/g, '');
  return slug.length > 1 ? slug + '.com' : null;
}

const PADDING = { sm: '6px', md: '10px', lg: '14px' };
const FONT_SIZE = { sm: 'text-xs', md: 'text-lg', lg: 'text-2xl' };

export default function CompanyLogo({ company, link, className = '', size = 'md' }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  const domain = useMemo(() => resolveDomain(company, link), [company, link]);
  const initials = useMemo(
    () => company?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?',
    [company]
  );

  return (
    <div className={`relative rounded-2xl bg-white dark:bg-white/[0.04] border border-slate-100 dark:border-white/[0.08] flex items-center justify-center overflow-hidden shrink-0 shadow-sm ${className}`}>
      {domain && !failed && (
        <img
          src={`https://logo.clearbit.com/${domain}`}
          alt={company}
          className="h-full w-full object-contain absolute inset-0 z-10 transition-opacity duration-300"
          style={{ padding: PADDING[size], opacity: loaded ? 1 : 0 }}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
      )}
      <span className={`font-black text-primary ${FONT_SIZE[size]} ${loaded ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}>
        {initials}
      </span>
    </div>
  );
}
