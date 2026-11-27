/**
 * Batch AI Hashtag Generator (Gemini Vision + Prompt Analysis)
 * Reads each image from Supabase (photo + full prompt + title),
 * asks Gemini Vision to generate 5 accurate Vietnamese topic hashtags,
 * and saves them into `public.images.hashtags`.
 *
 * Usage:
 *   GEMINI_API_KEY=your_key SUPABASE_SERVICE_ROLE_KEY=your_service_key node scripts/generate-hashtags.mjs
 */

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://awovbdypluazfcfvnmym.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const CONCURRENCY = Number(process.env.CONCURRENCY || 4);

if (!SUPABASE_KEY || !GEMINI_API_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY or GEMINI_API_KEY.');
  process.exit(1);
}

async function fetchUntaggedImages() {
  const rows = [];
  for (let from = 0; ; from += 500) {
    const url = `${SUPABASE_URL}/rest/v1/images?select=id,title,prompt,image_url,thumbnail_url,hashtags&or=(hashtags.is.null,hashtags.eq.{})&order=id.asc&offset=${from}&limit=500`;
    const res = await fetch(url, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
    });
    if (!res.ok) throw new Error(`Supabase fetch error: ${res.status} ${await res.text()}`);
    const chunk = await res.json();
    rows.push(...chunk);
    if (chunk.length < 500) break;
  }
  return rows;
}

async function imageToBase64(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Image fetch failed (${res.status})`);
  const mimeType = res.headers.get('content-type') || 'image/jpeg';
  const buf = Buffer.from(await res.arrayBuffer());
  return { mimeType, data: buf.toString('base64') };
}

async function analyzeWithGemini(item) {
  const imgData = await imageToBase64(item.thumbnail_url || item.image_url);
  const promptText = `Hãy nhìn trực tiếp vào bức ảnh đính kèm KẾT HỢP với tiêu đề và câu lệnh (prompt) bên dưới, sau đó trả về ĐÚNG 5 hashtag tiếng Việt ngắn gọn, chính xác nhất mô tả:
1. Đối tượng & giới tính/số lượng (ví dụ: ảnh nam đơn, ảnh nữ xinh, ảnh couple, ảnh nhóm nữ, ảnh nhóm nam, ảnh nhóm bạn...)
2. Chủ đề / hành động / bối cảnh (ví dụ: nữ đua xe, du lịch biển, sinh nhật, dã ngoại, đường phố đêm...)
3. Phong cách / thần thái (ví dụ: phong cách ngầu, dễ thương, cá tính, sang trọng, cổ điển...)
4. Tông màu / ánh sáng chủ đạo (ví dụ: tông màu tối, neon rực rỡ, ánh nắng ấm, pastel nhẹ...)
5. Trang phục / chi tiết nổi bật (ví dụ: váy dạ hội, áo khoác da, đồng phục, tóc bạch kim...)

YÊU CẦU NGHIÊM NGẶT:
- Chỉ trả về JSON array gồm đúng 5 chuỗi tiếng Việt ngắn (2-5 từ mỗi chuỗi, không có dấu # ở đầu), ví dụ: ["ảnh nữ xinh","nữ đua xe","phong cách ngầu","tông màu tối","áo khoác da"]
- Không bịa đặt chi tiết không có trong ảnh và prompt.

Tiêu đề: ${item.title || ''}
Prompt: ${(item.prompt || '').slice(0, 1200)}`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { inline_data: { mime_type: imgData.mimeType, data: imgData.data } },
            { text: promptText }
          ]
        }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.2 }
      })
    }
  );
  if (!res.ok) throw new Error(`Gemini error ${res.status}: ${await res.text()}`);
  const json = await res.json();
  const raw = json?.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed) || parsed.length === 0) throw new Error('Invalid hashtag array');
  return parsed.slice(0, 5).map(t => String(t).replace(/^#/, '').trim()).filter(Boolean);
}

async function saveHashtags(id, hashtags) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/images?id=eq.${id}`, {
    method: 'PATCH',
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal'
    },
    body: JSON.stringify({ hashtags })
  });
  if (!res.ok) throw new Error(`Supabase patch error: ${res.status}`);
}

async function main() {
  const items = await fetchUntaggedImages();
  console.log(`Found ${items.length} images without hashtags.`);
  let idx = 0, ok = 0, fail = 0;

  async function worker() {
    while (idx < items.length) {
      const cur = items[idx++];
      try {
        const tags = await analyzeWithGemini(cur);
        await saveHashtags(cur.id, tags);
        ok++;
        console.log(`[${ok + fail}/${items.length}] #${cur.id} -> ${tags.join(', ')}`);
      } catch (err) {
        fail++;
        console.error(`[FAIL #${cur.id}] ${err.message}`);
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  console.log(`Done! Success: ${ok}, Failed: ${fail}`);
}

main().catch(err => { console.error(err); process.exit(1); });
