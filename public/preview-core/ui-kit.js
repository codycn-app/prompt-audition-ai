/**
 * Shared Theme-Aware UI Kit for Preview 1..10
 * Renders full-featured Detail Modal (Mechanism 1), Article View (Mechanism 2),
 * Auth Modals, Add Post Modal, Guide Modal, Support Page, and Profile Page
 * using the active theme's CSS variables & hooks.
 */
import { escapeHtml, getObjectPosition, getRankInfo, copyText, showToast, INITIAL_RANKS } from './core.js';

export const ICONS = {
  search: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>`,
  copy: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`,
  check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`,
  link: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`,
  article: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>`,
  close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`,
  plus: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>`,
  heart: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>`,
  home: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
  user: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  info: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>`,
  eye: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>`,
  sparkles: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3Z"/></svg>`,
  trash: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>`,
  back: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>`,
  sun: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>`,
  moon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>`,
  cube: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m21 16-9 5-9-5V8l9-5 9 5z"/><path d="m3.27 6.96 8.73 5.05 8.73-5.05"/><path d="M12 22.08V12"/></svg>`,
};

export function ensureKitStyles() {
  if (document.getElementById('pc-kit-styles')) return;
  const style = document.createElement('style');
  style.id = 'pc-kit-styles';
  style.textContent = `
    .uk-modal-shell {
      background: var(--surface, #14161D); color: var(--text, #F4F4F5);
      border: 1px solid var(--border, rgba(255,255,255,0.12));
      box-shadow: 0 24px 80px rgba(0,0,0,0.55);
      font-family: var(--font-body, 'Be Vietnam Pro', sans-serif);
    }
    .uk-btn {
      display: inline-flex; align-items: center; justify-content: center; gap: 7px;
      padding: 9px 16px; border-radius: var(--btn-radius, 12px); font-size: 13px; font-weight: 600;
      cursor: pointer; border: 1px solid var(--border, rgba(255,255,255,0.16));
      background: var(--surface-2, rgba(255,255,255,0.07)); color: var(--text, #fff);
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.12), 0 4px 12px rgba(0,0,0,0.18);
      backdrop-filter: blur(10px);
      transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease, background 0.2s ease, border-color 0.2s ease;
      white-space: nowrap; text-decoration: none;
    }
    .uk-btn svg { width: 15px; height: 15px; flex-shrink: 0; }
    .uk-btn:hover { transform: translateY(-2px); border-color: var(--accent, #38bdf8); background: rgba(255,255,255,0.12); box-shadow: inset 0 1px 0 rgba(255,255,255,0.2), 0 8px 20px rgba(0,0,0,0.28); }
    .uk-btn:active { transform: scale(0.95); }
    .uk-btn-primary {
      background: linear-gradient(135deg, var(--accent, #38bdf8), var(--accent-2, #c084fc));
      color: var(--on-accent, #ffffff); border-color: rgba(255,255,255,0.22);
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.35), 0 6px 22px var(--accent-glow, rgba(56,189,248,0.38));
    }
    .uk-btn-primary:hover { background: linear-gradient(135deg, var(--accent, #38bdf8), var(--accent-2, #c084fc)); filter: brightness(1.08); box-shadow: inset 0 1px 0 rgba(255,255,255,0.45), 0 10px 30px var(--accent-glow, rgba(56,189,248,0.52)); }
    .uk-prompt-box {
      background: var(--bg, #0B0C10); border: 1px solid var(--border, rgba(255,255,255,0.1));
      border-radius: 12px; padding: 14px; font-size: 13.5px; line-height: 1.65;
      color: var(--text-muted, #CBD5E1); white-space: pre-wrap; word-break: break-word;
      max-height: 220px; overflow-y: auto;
    }
    .uk-input {
      width: 100%; padding: 10px 14px; border-radius: 10px;
      background: var(--bg, #0B0C10); color: var(--text, #fff);
      border: 1px solid var(--border, rgba(255,255,255,0.14));
      font-size: 14px; outline: none; font-family: inherit;
    }
    .uk-input:focus { border-color: var(--accent, #FF3B7F); }
    .uk-chip {
      display: inline-flex; align-items: center; gap: 5px; padding: 5px 11px;
      border-radius: 999px; font-size: 12px; font-weight: 600;
      background: var(--surface-2, rgba(255,255,255,0.08));
      border: 1px solid var(--border, rgba(255,255,255,0.12));
      color: var(--accent-2, #22D3EE); cursor: pointer;
    }
    .uk-article-wrap { max-width: 1120px; margin: 0 auto; padding: 24px 16px 96px; }
    .uk-article-grid { display: grid; grid-template-columns: 1fr; gap: 28px; }
    @media (min-width: 900px) { .uk-article-grid { grid-template-columns: 1.15fr 0.85fr; align-items: start; } }
    .uk-related-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; margin-top: 16px; }
    @media (min-width: 768px) { .uk-related-grid { grid-template-columns: repeat(4, 1fr); } }
    .uk-close-btn {
      position: absolute; top: 12px; right: 12px; z-index: 10;
      width: 36px; height: 36px; border-radius: 999px;
      display: grid; place-items: center; cursor: pointer;
      background: rgba(0,0,0,0.55); color: #fff; border: 1px solid rgba(255,255,255,0.18);
    }
    .uk-close-btn svg { width: 18px; height: 18px; }
    .uk-close-btn:hover { background: var(--accent, #FF3B7F); }
  `;
  document.head.appendChild(style);
}

export function renderDetailModal(engine, image, opts = {}) {
  ensureKitStyles();
  closeDetailModal();

  const author = image.profiles;
  const rank = getRankInfo(author);
  const canDelete = engine.state.currentUser && (engine.state.currentUser.id === image.user_id || engine.state.currentUser.role === 'admin');
  const catsHtml = (image.categories || []).map(c =>
    `<button class="uk-chip" data-filter-cat="${c.id}">${escapeHtml(c.name)}</button>`
  ).join('');

  const modal = document.createElement('div');
  modal.id = 'uk-detail-modal';
  modal.className = 'pc-modal-backdrop';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.innerHTML = `
    <div class="pc-modal-card pc-split uk-modal-shell">
      <button class="uk-close-btn" id="uk-modal-close" aria-label="Đóng">${ICONS.close}</button>
      <div style="flex:1.25;background:#050507;display:flex;align-items:center;justify-content:center;min-height:260px;max-height:46vh;overflow:hidden;position:relative;" class="uk-modal-media">
        <img src="${escapeHtml(image.image_url)}" alt="${escapeHtml(image.title)}" style="width:100%;height:100%;object-fit:contain;" />
      </div>
      <div style="flex:1;padding:22px;display:flex;flex-direction:column;gap:14px;overflow-y:auto;">
        <div>
          <div style="display:flex;align-items:center;gap:8px;font-size:12px;color:var(--text-muted);margin-bottom:6px;">
            <span>#${image.id}</span>
            <span>•</span>
            <span style="display:inline-flex;align-items:center;gap:4px;">${ICONS.eye.replace('<svg', '<svg style="width:13px;height:13px;"')} ${image.views || 0} lượt xem</span>
          </div>
          <h2 style="margin:0;font-size:21px;font-weight:700;font-family:var(--font-display, inherit);">${escapeHtml(image.title)}</h2>
        </div>

        <div style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:12px;background:var(--surface-2,rgba(255,255,255,0.04));border:1px solid var(--border,rgba(255,255,255,0.08));">
          ${author?.avatarUrl
            ? `<img src="${escapeHtml(author.avatarUrl)}" alt="" style="width:36px;height:36px;border-radius:999px;object-fit:cover;">`
            : `<div style="width:36px;height:36px;border-radius:999px;display:grid;place-items:center;font-weight:700;background:linear-gradient(135deg,var(--accent),var(--accent-2));color:#fff;">${escapeHtml((author?.username || '?')[0].toUpperCase())}</div>`}
          <div style="min-width:0;">
            <div style="font-weight:600;font-size:14px;color:${rank.color}">${escapeHtml(author?.username || 'Thành viên Audition AI')}</div>
            <div style="font-size:12px;color:var(--text-muted);">${escapeHtml(rank.name)}</div>
          </div>
        </div>

        <div>
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:var(--accent);margin-bottom:6px;">Câu lệnh (Prompt)</div>
          <div class="uk-prompt-box" id="uk-prompt-text">${escapeHtml(image.prompt)}</div>
        </div>

        <div style="display:flex;flex-wrap:wrap;gap:8px;">
          <button class="uk-btn uk-btn-primary" id="uk-copy-prompt">${ICONS.copy} <span>Sao chép Prompt</span></button>
          <button class="uk-btn" id="uk-copy-link">${ICONS.link} <span>Sao chép Link</span></button>
          <button class="uk-btn" id="uk-open-article">${ICONS.article} <span>Mở bài viết</span></button>
          <button class="uk-btn" id="uk-open-guide">${ICONS.info} <span>Hướng dẫn</span></button>
        </div>

        ${catsHtml ? `<div style="display:flex;flex-wrap:wrap;gap:6px;">${catsHtml}</div>` : ''}

        <div style="margin-top:auto;display:flex;align-items:center;justify-content:space-between;padding-top:10px;border-top:1px solid var(--border,rgba(255,255,255,0.08));font-size:12px;color:var(--text-muted);">
          <span>Tạo lúc: ${new Date(image.created_at).toLocaleString('vi-VN')}</span>
          ${canDelete ? `<button class="uk-btn" id="uk-delete-post" style="padding:6px 10px;color:#f87171;border-color:rgba(248,113,113,0.3);">${ICONS.trash} Xóa</button>` : ''}
        </div>
      </div>
    </div>
  `;

  if (window.innerWidth >= 768) {
    modal.querySelector('.uk-modal-media').style.maxHeight = 'none';
  }

  document.body.appendChild(modal);

  if (opts.onModalMount) opts.onModalMount(modal);

  modal.addEventListener('click', (e) => { if (e.target === modal) engine.closeModal(); });
  modal.querySelector('#uk-modal-close').onclick = () => engine.closeModal();
  modal.querySelector('#uk-copy-prompt').onclick = async (e) => {
    const btn = e.currentTarget;
    const ok = await copyText(image.prompt);
    if (ok && btn) {
      btn.innerHTML = `${ICONS.check} <span>Đã sao chép!</span>`;
      if (opts.onCopyEffect) opts.onCopyEffect(btn);
      setTimeout(() => { if (btn.isConnected) btn.innerHTML = `${ICONS.copy} <span>Sao chép Prompt</span>`; }, 1800);
    }
  };
  modal.querySelector('#uk-copy-link').onclick = () => copyText(engine.getShareUrl(image, true), 'Đã sao chép link bài viết!');
  modal.querySelector('#uk-open-article').onclick = () => engine.openArticle(image);
  modal.querySelector('#uk-open-guide').onclick = () => openGuideModal();
  modal.querySelectorAll('[data-filter-cat]').forEach(btn => {
    btn.onclick = () => { engine.closeModal(); engine.setCategory(Number(btn.dataset.filterCat)); };
  });
  const delBtn = modal.querySelector('#uk-delete-post');
  if (delBtn) delBtn.onclick = () => { if (confirm('Xóa ảnh và câu lệnh này?')) engine.deletePost(image); };
}

export function closeDetailModal() {
  document.getElementById('uk-detail-modal')?.remove();
}

export function renderArticleView(container, engine, image) {
  ensureKitStyles();
  const author = image.profiles;
  const rank = getRankInfo(author);
  const related = engine.state.allImagesMeta
    .filter(i => i.id !== image.id && i.categories.some(c => image.categories.some(ic => ic.id === c.id)))
    .slice(0, 4);
  const fallbackRelated = related.length ? related : engine.state.allImagesMeta.filter(i => i.id !== image.id).slice(0, 4);

  container.innerHTML = `
    <article class="uk-article-wrap">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:20px;">
        <button class="uk-btn" id="uk-art-back">${ICONS.back} <span>Quay lại thư viện</span></button>
        <div style="font-size:13px;color:var(--text-muted);">Bài viết Prompt #${image.id}</div>
      </div>

      <div class="uk-article-grid uk-modal-shell" style="padding:20px;border-radius:20px;">
        <div style="background:#050507;border-radius:14px;overflow:hidden;border:1px solid var(--border);">
          <img src="${escapeHtml(image.image_url)}" alt="${escapeHtml(image.title)}" style="width:100%;max-height:75vh;object-fit:contain;display:block;" />
        </div>
        <div style="display:flex;flex-direction:column;gap:16px;">
          <h1 style="margin:0;font-size:28px;line-height:1.25;font-family:var(--font-display,inherit);">${escapeHtml(image.title)}</h1>

          <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;padding:12px 14px;border-radius:14px;background:var(--surface-2);border:1px solid var(--border);">
            <div style="display:flex;align-items:center;gap:10px;">
              ${author?.avatarUrl
                ? `<img src="${escapeHtml(author.avatarUrl)}" style="width:40px;height:40px;border-radius:999px;object-fit:cover;">`
                : `<div style="width:40px;height:40px;border-radius:999px;display:grid;place-items:center;font-weight:700;background:linear-gradient(135deg,var(--accent),var(--accent-2));color:#fff;">${escapeHtml((author?.username || '?')[0].toUpperCase())}</div>`}
              <div>
                <div style="font-weight:700;color:${rank.color}">${escapeHtml(author?.username || 'Thành viên Audition AI')}</div>
                <div style="font-size:12px;color:var(--text-muted);">${escapeHtml(rank.name)} • ${new Date(image.created_at).toLocaleDateString('vi-VN')}</div>
              </div>
            </div>
            <div style="font-size:13px;color:var(--text-muted);display:flex;align-items:center;gap:5px;">
              ${ICONS.eye.replace('<svg', '<svg style="width:15px;height:15px;"')} ${image.views || 0} lượt xem
            </div>
          </div>

          <div>
            <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:var(--accent);margin-bottom:8px;">Câu lệnh tạo ảnh (Prompt)</div>
            <div class="uk-prompt-box" style="max-height:none;">${escapeHtml(image.prompt)}</div>
          </div>

          <div style="display:flex;flex-wrap:wrap;gap:10px;">
            <button class="uk-btn uk-btn-primary" id="uk-art-copy">${ICONS.copy} <span>Sao chép Prompt</span></button>
            <button class="uk-btn" id="uk-art-share">${ICONS.link} <span>Sao chép Link bài viết</span></button>
            <button class="uk-btn" id="uk-art-guide">${ICONS.info} <span>Hướng dẫn dùng</span></button>
          </div>

          ${image.categories?.length ? `<div style="display:flex;flex-wrap:wrap;gap:8px;">${image.categories.map(c => `<button class="uk-chip" data-art-cat="${c.id}">${escapeHtml(c.name)}</button>`).join('')}</div>` : ''}
        </div>
      </div>

      ${fallbackRelated.length ? `
        <section style="margin-top:36px;">
          <h3 style="margin:0 0 12px;font-size:18px;font-family:var(--font-display,inherit);">Prompt liên quan</h3>
          <div class="uk-related-grid">
            ${fallbackRelated.map(r => `
              <div class="uk-modal-shell" data-rel-id="${r.id}" style="border-radius:14px;overflow:hidden;cursor:pointer;">
                <div style="aspect-ratio:3/4;overflow:hidden;background:#0a0a0c;">
                  <img src="${escapeHtml(r.thumbnail_url || r.image_url)}" alt="${escapeHtml(r.title)}" style="width:100%;height:100%;object-fit:cover;object-position:${getObjectPosition(r)};" loading="lazy" />
                </div>
                <div style="padding:10px;font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(r.title)}</div>
              </div>
            `).join('')}
          </div>
        </section>
      ` : ''}
    </article>
  `;

  container.querySelector('#uk-art-back').onclick = () => engine.setPage('home');
  container.querySelector('#uk-art-copy').onclick = () => copyText(image.prompt);
  container.querySelector('#uk-art-share').onclick = () => copyText(engine.getShareUrl(image, true), 'Đã sao chép link bài viết!');
  container.querySelector('#uk-art-guide').onclick = () => openGuideModal();
  container.querySelectorAll('[data-art-cat]').forEach(b => b.onclick = () => engine.setCategory(Number(b.dataset.artCat)));
  container.querySelectorAll('[data-rel-id]').forEach(card => {
    card.onclick = () => engine.openArticle(Number(card.dataset.relId));
  });
}

export function renderSupportView(container, engine) {
  ensureKitStyles();
  container.innerHTML = `
    <div style="max-width:680px;margin:28px auto 96px;padding:0 16px;">
      <div class="uk-modal-shell" style="padding:28px;border-radius:20px;text-align:center;">
        <button class="uk-btn" id="uk-sup-back" style="margin-bottom:18px;">${ICONS.back} Quay lại</button>
        <h2 style="margin:0 0 8px;font-size:26px;font-family:var(--font-display,inherit);">Ủng hộ Prompt Audition AI</h2>
        <p style="color:var(--text-muted);font-size:14px;line-height:1.6;">Mỗi sự đóng góp của bạn giúp duy trì máy chủ lưu trữ ảnh chất lượng cao và cập nhật thêm nhiều câu lệnh mới mỗi ngày.</p>
        <div style="margin:22px auto;padding:18px;border-radius:16px;background:var(--surface-2);border:1px solid var(--border);max-width:360px;">
          <div style="font-weight:700;font-size:16px;color:var(--accent-2);">Ngân hàng Vietcombank</div>
          <div style="font-size:22px;font-weight:800;margin:8px 0;letter-spacing:1px;">9968682001</div>
          <div style="font-size:13px;color:var(--text-muted);">Chủ tài khoản: NGUYEN CONG CUONG</div>
          <button class="uk-btn uk-btn-primary" id="uk-copy-bank" style="margin-top:14px;">${ICONS.copy} Sao chép STK</button>
        </div>
      </div>
    </div>
  `;
  container.querySelector('#uk-sup-back').onclick = () => engine.setPage('home');
  container.querySelector('#uk-copy-bank').onclick = () => copyText('9968682001', 'Đã sao chép số tài khoản!');
}

export function renderProfileView(container, engine) {
  ensureKitStyles();
  const u = engine.state.currentUser;
  if (!u) { openAuthModal(engine, 'login'); engine.setPage('home'); return; }
  const rank = getRankInfo(u);
  const nextRank = INITIAL_RANKS.filter(r => r.requiredExp > (u.exp || 0)).sort((a,b) => a.requiredExp - b.requiredExp)[0];
  const pct = nextRank ? Math.min(100, Math.round(((u.exp || 0) / nextRank.requiredExp) * 100)) : 100;

  container.innerHTML = `
    <div style="max-width:640px;margin:28px auto 96px;padding:0 16px;">
      <div class="uk-modal-shell" style="padding:28px;border-radius:20px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
          <button class="uk-btn" id="uk-prof-back">${ICONS.back} Trang chủ</button>
          <button class="uk-btn" id="uk-prof-logout" style="color:#f87171;">Đăng xuất</button>
        </div>
        <div style="text-align:center;">
          <div style="width:76px;height:76px;border-radius:999px;margin:0 auto 12px;display:grid;place-items:center;font-size:28px;font-weight:800;background:linear-gradient(135deg,var(--accent),var(--accent-2));color:#fff;">
            ${u.avatarUrl ? `<img src="${escapeHtml(u.avatarUrl)}" style="width:100%;height:100%;border-radius:999px;object-fit:cover;">` : escapeHtml((u.username || 'U')[0].toUpperCase())}
          </div>
          <h2 style="margin:0;color:${rank.color}">${escapeHtml(u.username)}</h2>
          <div style="font-size:13px;color:var(--text-muted);margin-top:4px;">${escapeHtml(rank.name)} • ${escapeHtml(u.email)}</div>
        </div>
        <div style="margin-top:22px;padding:16px;border-radius:14px;background:var(--surface-2);border:1px solid var(--border);">
          <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:8px;">
            <span>Kinh nghiệm: <strong>${u.exp || 0} EXP</strong></span>
            <span>${nextRank ? `Mục tiêu: ${nextRank.name} (${nextRank.requiredExp})` : 'Cấp tối đa'}</span>
          </div>
          <div style="height:8px;border-radius:999px;background:rgba(255,255,255,0.1);overflow:hidden;">
            <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,var(--accent),var(--accent-2));"></div>
          </div>
        </div>
      </div>
    </div>
  `;
  container.querySelector('#uk-prof-back').onclick = () => engine.setPage('home');
  container.querySelector('#uk-prof-logout').onclick = () => engine.logout();
}

export function openGuideModal() {
  ensureKitStyles();
  document.getElementById('uk-guide-modal')?.remove();
  const m = document.createElement('div');
  m.id = 'uk-guide-modal';
  m.className = 'pc-modal-backdrop';
  m.style.zIndex = '1100';
  m.innerHTML = `
    <div class="pc-modal-card uk-modal-shell" style="max-width:520px;padding:24px;">
      <button class="uk-close-btn" id="uk-g-close">${ICONS.close}</button>
      <h3 style="margin:0 0 14px;font-size:19px;color:var(--accent-2);display:flex;align-items:center;gap:8px;">${ICONS.info} Hướng dẫn sử dụng</h3>
      <ol style="margin:0;padding-left:20px;line-height:1.75;font-size:14px;color:var(--text-muted);">
        <li><strong>B1:</strong> Bấm nút <em>Sao chép Prompt</em> để lấy toàn bộ câu lệnh mẫu.</li>
        <li><strong>B2:</strong> Mở ứng dụng <strong>APP AUDITION AI</strong> hoặc trình tạo ảnh AI yêu thích của bạn.</li>
        <li><strong>B3:</strong> Dán câu lệnh, tải ảnh khuôn mặt tham chiếu (nếu cần) và nhấn Tạo ảnh.</li>
      </ol>
      <button class="uk-btn uk-btn-primary" id="uk-g-ok" style="margin-top:20px;align-self:flex-end;">Đã hiểu</button>
    </div>
  `;
  document.body.appendChild(m);
  m.onclick = (e) => { if (e.target === m) m.remove(); };
  m.querySelector('#uk-g-close').onclick = () => m.remove();
  m.querySelector('#uk-g-ok').onclick = () => m.remove();
}

export function openAuthModal(engine, mode = 'login') {
  ensureKitStyles();
  document.getElementById('uk-auth-modal')?.remove();
  const m = document.createElement('div');
  m.id = 'uk-auth-modal';
  m.className = 'pc-modal-backdrop';
  m.innerHTML = `
    <div class="pc-modal-card uk-modal-shell" style="max-width:420px;padding:26px;">
      <button class="uk-close-btn" id="uk-a-close">${ICONS.close}</button>
      <h3 style="margin:0 0 16px;font-size:21px;font-family:var(--font-display,inherit);" id="uk-a-title">${mode === 'login' ? 'Đăng nhập' : 'Đăng ký tài khoản'}</h3>
      <form id="uk-a-form" style="display:flex;flex-direction:column;gap:12px;">
        <div id="uk-a-user-wrap" style="display:${mode === 'signup' ? 'block' : 'none'}">
          <input class="uk-input" type="text" id="uk-a-username" placeholder="Tên hiển thị" />
        </div>
        <input class="uk-input" type="email" id="uk-a-email" placeholder="Email" required />
        <input class="uk-input" type="password" id="uk-a-pass" placeholder="Mật khẩu" required />
        <div id="uk-a-err" style="font-size:13px;color:#f87171;display:none;"></div>
        <button class="uk-btn uk-btn-primary" type="submit" id="uk-a-submit">${mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}</button>
      </form>
      <div style="margin-top:14px;font-size:13px;text-align:center;color:var(--text-muted);">
        <button type="button" id="uk-a-switch" style="background:none;border:none;color:var(--accent-2);cursor:pointer;font-weight:600;">
          ${mode === 'login' ? 'Chưa có tài khoản? Đăng ký ngay' : 'Đã có tài khoản? Đăng nhập'}
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(m);
  let curMode = mode;
  const close = () => m.remove();
  m.onclick = (e) => { if (e.target === m) close(); };
  m.querySelector('#uk-a-close').onclick = close;
  m.querySelector('#uk-a-switch').onclick = () => {
    curMode = curMode === 'login' ? 'signup' : 'login';
    m.querySelector('#uk-a-title').textContent = curMode === 'login' ? 'Đăng nhập' : 'Đăng ký tài khoản';
    m.querySelector('#uk-a-user-wrap').style.display = curMode === 'signup' ? 'block' : 'none';
    m.querySelector('#uk-a-submit').textContent = curMode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản';
    m.querySelector('#uk-a-switch').textContent = curMode === 'login' ? 'Chưa có tài khoản? Đăng ký ngay' : 'Đã có tài khoản? Đăng nhập';
  };
  m.querySelector('#uk-a-form').onsubmit = async (e) => {
    e.preventDefault();
    const errEl = m.querySelector('#uk-a-err');
    errEl.style.display = 'none';
    try {
      const email = m.querySelector('#uk-a-email').value.trim();
      const pass = m.querySelector('#uk-a-pass').value;
      const username = m.querySelector('#uk-a-username').value.trim();
      if (curMode === 'login') await engine.login(email, pass);
      else await engine.signup(email, pass, username || email.split('@')[0]);
      close();
    } catch (err) {
      errEl.textContent = err.message || 'Có lỗi xảy ra.';
      errEl.style.display = 'block';
    }
  };
}

export function openAddModal(engine) {
  if (!engine.state.currentUser) { openAuthModal(engine, 'login'); return; }
  ensureKitStyles();
  document.getElementById('uk-add-modal')?.remove();
  const m = document.createElement('div');
  m.id = 'uk-add-modal';
  m.className = 'pc-modal-backdrop';
  m.innerHTML = `
    <div class="pc-modal-card uk-modal-shell" style="max-width:540px;padding:24px;overflow-y:auto;">
      <button class="uk-close-btn" id="uk-add-close">${ICONS.close}</button>
      <h3 style="margin:0 0 16px;font-size:20px;font-family:var(--font-display,inherit);">Đăng Prompt & Ảnh mới</h3>
      <form id="uk-add-form" style="display:flex;flex-direction:column;gap:12px;">
        <input class="uk-input" type="text" id="uk-add-title" placeholder="Tiêu đề bức ảnh..." required />
        <textarea class="uk-input" id="uk-add-prompt" rows="4" placeholder="Nhập câu lệnh (Prompt)..." required></textarea>
        <input class="uk-input" type="file" id="uk-add-file" accept="image/*" required />
        <div style="display:flex;flex-wrap:wrap;gap:6px;">
          ${engine.state.categories.map(c => `<label class="uk-chip"><input type="checkbox" value="${c.id}" style="accent-color:var(--accent);"> ${escapeHtml(c.name)}</label>`).join('')}
        </div>
        <button class="uk-btn uk-btn-primary" type="submit" id="uk-add-submit">${ICONS.plus} Đăng bài (+50 EXP)</button>
      </form>
    </div>
  `;
  document.body.appendChild(m);
  m.onclick = (e) => { if (e.target === m) m.remove(); };
  m.querySelector('#uk-add-close').onclick = () => m.remove();
  m.querySelector('#uk-add-form').onsubmit = async (e) => {
    e.preventDefault();
    const btn = m.querySelector('#uk-add-submit');
    btn.disabled = true; btn.textContent = 'Đang tải lên...';
    try {
      const title = m.querySelector('#uk-add-title').value.trim();
      const prompt = m.querySelector('#uk-add-prompt').value.trim();
      const file = m.querySelector('#uk-add-file').files[0];
      const categoryIds = [...m.querySelectorAll('input[type=checkbox]:checked')].map(i => Number(i.value));
      await engine.createPost({ title, prompt, categoryIds, file });
      m.remove();
    } catch (err) {
      showToast(err.message, 'error');
      btn.disabled = false; btn.innerHTML = `${ICONS.plus} Đăng bài (+50 EXP)`;
    }
  };
}

// Auto-inject kit styles immediately on module load so header/card buttons are styled from frame 1
if (typeof document !== 'undefined') {
  ensureKitStyles();
}
