type SharedPost = {
  id: number;
  title: string;
  prompt: string;
  image_url: string;
  thumbnail_url?: string | null;
};

const escapeHtml = (value: string) => value
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const textForMeta = (value: string, limit: number) => {
  const normalized = value.replace(/\s+/g, ' ').trim();
  return normalized.length > limit ? `${normalized.slice(0, limit - 3).trimEnd()}...` : normalized;
};

const toAbsoluteUrl = (value: string | null | undefined, siteUrl: string) => {
  if (!value) return `${siteUrl}/seo/prompt-audition-ai-social-preview.png`;
  try {
    return new URL(value, siteUrl).toString();
  } catch {
    return `${siteUrl}/seo/prompt-audition-ai-social-preview.png`;
  }
};

const siteUrlFromEvent = (event: any) => {
  const configuredUrl = process.env.SITE_URL || process.env.URL || process.env.DEPLOY_PRIME_URL;
  if (configuredUrl) return configuredUrl.replace(/\/$/, '');

  const host = event.headers?.['x-forwarded-host'] || event.headers?.host;
  const protocol = event.headers?.['x-forwarded-proto'] || 'https';
  return host ? `${protocol}://${host}` : 'https://auditionai.io.vn';
};

export const handler = async (event: any) => {
  const id = event.queryStringParameters?.id;
  const siteUrl = siteUrlFromEvent(event);
  const fallbackUrl = `${siteUrl}/`;

  if (!id || !/^\d+$/.test(id)) {
    return { statusCode: 302, headers: { Location: fallbackUrl }, body: '' };
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  let post: SharedPost | null = null;

  if (supabaseUrl && supabaseKey) {
    try {
      const response = await fetch(
        `${supabaseUrl.replace(/\/$/, '')}/rest/v1/images?select=id,title,prompt,image_url,thumbnail_url&id=eq.${id}&limit=1`,
        { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } },
      );
      if (response.ok) {
        const rows = await response.json() as SharedPost[];
        post = rows[0] || null;
      }
    } catch (error) {
      console.error('Could not load shared post metadata:', error);
    }
  }

  if (!post) {
    return { statusCode: 302, headers: { Location: fallbackUrl }, body: '' };
  }

  const canonicalUrl = `${siteUrl}/posts/${post.id}`;
  const title = `${textForMeta(post.title, 90)} | Prompt Audition AI`;
  const description = textForMeta(post.prompt, 190) || 'Khám phá câu lệnh AI được chia sẻ trên Prompt Audition AI.';
  // A shared post must advertise its own artwork, not the generic site thumbnail.
  const imageUrl = toAbsoluteUrl(post.image_url || post.thumbnail_url, siteUrl);
  const appUrl = `${siteUrl}/?post=${post.id}`;

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=300',
    },
    body: `<!doctype html>
<html lang="vi">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}">
    <meta name="robots" content="index, follow">
    <link rel="canonical" href="${escapeHtml(canonicalUrl)}">
    <meta property="og:locale" content="vi_VN">
    <meta property="og:type" content="article">
    <meta property="og:site_name" content="Prompt Audition AI">
    <meta property="og:title" content="${escapeHtml(title)}">
    <meta property="og:description" content="${escapeHtml(description)}">
    <meta property="og:url" content="${escapeHtml(canonicalUrl)}">
    <meta property="og:image" content="${escapeHtml(imageUrl)}">
    <meta property="og:image:secure_url" content="${escapeHtml(imageUrl)}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(title)}">
    <meta name="twitter:description" content="${escapeHtml(description)}">
    <meta name="twitter:image" content="${escapeHtml(imageUrl)}">
    <script>window.location.replace(${JSON.stringify(appUrl)});</script>
  </head>
  <body>
    <p>Đang mở bài đăng...</p>
  </body>
</html>`,
  };
};
