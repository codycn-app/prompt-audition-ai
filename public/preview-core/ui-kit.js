/**
 * Shared Theme-Aware UI Kit for Preview 1..10
 * Renders full-featured Detail Modal (Mechanism 1), Article View (Mechanism 2),
 * Auth Modals, Add Post Modal, Guide Modal, Support Page, and Profile Page
 * using the active theme's CSS variables & hooks.
 */
import { escapeHtml, getObjectPosition, getRankInfo, copyText, showToast, getDisplayViews, saveCmsConfig, saveBrokenIds, INITIAL_RANKS, analyzeImageTone, suggestHashtagsFromPost } from './core.js';

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
  edit: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>`,
  back: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>`,
  sun: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>`,
  moon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>`,
  gear: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z"/></svg>`,
  bell: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>`,
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
      position: relative; overflow: hidden;
      display: inline-flex; align-items: center; justify-content: center; gap: 7px;
      padding: 9px 16px; border-radius: var(--btn-radius, 12px); font-size: 13px; font-weight: 600;
      cursor: pointer; border: 1px solid var(--border, rgba(255,255,255,0.18));
      background: var(--surface-2, rgba(255,255,255,0.08)); color: var(--text, #fff);
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.15), 0 4px 14px rgba(0,0,0,0.22);
      backdrop-filter: blur(12px);
      transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.25s ease, background 0.25s ease, border-color 0.25s ease;
      white-space: nowrap; text-decoration: none;
    }
    .uk-btn::after {
      content: ''; position: absolute; top: 0; left: -120%; width: 65%; height: 100%;
      background: linear-gradient(110deg, transparent, rgba(255,255,255,0.28), transparent);
      transform: skewX(-20deg); transition: left 0.55s ease; pointer-events: none;
    }
    .uk-btn:hover::after { left: 150%; }
    .uk-btn svg { width: 15px; height: 15px; flex-shrink: 0; }
    .uk-btn:hover { transform: translateY(-2px) scale(1.02); border-color: var(--accent, #38bdf8); background: rgba(56,189,248,0.16); box-shadow: inset 0 1px 0 rgba(255,255,255,0.25), 0 8px 24px rgba(56,189,248,0.28); }
    .uk-btn:active { transform: scale(0.94); }
    .uk-btn-primary {
      background: linear-gradient(135deg, var(--accent, #38bdf8), var(--accent-2, #e879f9));
      background-size: 180% 180%; animation: ukGradShift 4s ease infinite;
      color: var(--on-accent, #ffffff); border-color: rgba(255,255,255,0.3);
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.4), 0 8px 26px var(--accent-glow, rgba(56,189,248,0.42));
    }
    .uk-btn-primary:hover { filter: brightness(1.1); box-shadow: inset 0 1px 0 rgba(255,255,255,0.5), 0 12px 34px var(--accent-glow, rgba(56,189,248,0.6)); }
    @keyframes ukGradShift { 0%,100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
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

function renderAvatar(user, size = 38) {
  const letter = escapeHtml((user?.username || '?')[0].toUpperCase());
  const fallback = `<div style="width:${size}px;height:${size}px;border-radius:999px;display:grid;place-items:center;font-weight:700;font-size:${Math.round(size * 0.42)}px;background:linear-gradient(135deg,var(--accent),var(--accent-2));color:#fff;flex-shrink:0;">${letter}</div>`;
  if (!user?.avatarUrl) return fallback;
  return `<img src="${escapeHtml(user.avatarUrl)}" alt="" style="width:${size}px;height:${size}px;border-radius:999px;object-fit:cover;border:1px solid rgba(255,255,255,0.2);flex-shrink:0;" onerror="const d=document.createElement('div');d.style.cssText='width:${size}px;height:${size}px;border-radius:999px;display:grid;place-items:center;font-weight:700;font-size:${Math.round(size * 0.42)}px;background:linear-gradient(135deg,var(--accent),var(--accent-2));color:#fff;flex-shrink:0;';d.textContent='${letter}';this.replaceWith(d);" />`;
}

function renderTopicHashtags(image) {
  const tags = Array.isArray(image?.hashtags) ? image.hashtags.filter(Boolean).slice(0, 10) : [];
  if (!tags.length) return '';
  return `
    <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;">
      ${tags.map(t => {
        const clean = String(t).replace(/^#/, '').trim();
        return `<button type="button" class="uk-chip" data-tag-search="${escapeHtml(clean)}" style="padding:4px 10px;font-size:11.5px;background:rgba(56,189,248,0.1);border-color:rgba(56,189,248,0.3);color:#7dd3fc;">${escapeHtml(clean)}</button>`;
      }).join('')}
    </div>
  `;
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
    <div class="pc-modal-card pc-split uk-modal-shell" style="max-width:1060px;border-radius:24px;border:1px solid rgba(255,255,255,0.16);background:rgba(12,16,28,0.96);backdrop-filter:blur(28px);box-shadow:0 32px 90px rgba(0,0,0,0.75), inset 0 1px 0 rgba(255,255,255,0.14);">
      <button class="uk-close-btn" id="uk-modal-close" aria-label="Đóng" style="top:14px;right:14px;width:38px;height:38px;background:rgba(255,255,255,0.08);backdrop-filter:blur(10px);">${ICONS.close}</button>

      <div class="uk-modal-media" style="flex:1.3;background:radial-gradient(circle at center, #111827 0%, #05070c 100%);display:flex;align-items:center;justify-content:center;min-height:220px;overflow:hidden;position:relative;padding:12px;border-right:1px solid rgba(255,255,255,0.08);">
        <div style="position:absolute;top:14px;left:14px;display:flex;align-items:center;gap:8px;z-index:2;">
          <span style="padding:4px 10px;border-radius:999px;font-size:11.5px;font-weight:600;background:rgba(5,7,14,0.78);border:1px solid rgba(255,255,255,0.16);color:#7dd3fc;backdrop-filter:blur(8px);display:inline-flex;align-items:center;gap:5px;">${ICONS.eye.replace('<svg', '<svg style="width:13px;height:13px;"')} ${getDisplayViews(image)}</span>
        </div>
        <img class="uk-modal-img" src="${escapeHtml(image.image_url)}" alt="${escapeHtml(image.title)}" style="width:100%;height:100%;object-fit:contain;border-radius:12px;filter:drop-shadow(0 16px 36px rgba(0,0,0,0.65));" />
      </div>

      <div class="uk-modal-body" style="flex:1;padding:20px 20px;display:flex;flex-direction:column;gap:14px;overflow-y:auto;">
        <div style="padding-right:34px;">
          <h2 style="margin:0;font-size:21px;line-height:1.25;font-weight:700;font-family:var(--font-display, inherit);color:#fff;">${escapeHtml(image.title)}</h2>
        </div>

        <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:11px 14px;border-radius:14px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.09);">
          <div style="display:flex;align-items:center;gap:10px;min-width:0;">
            ${renderAvatar(author, 38)}
            <div style="min-width:0;">
              <div style="font-weight:700;font-size:14px;color:${rank.color};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(author?.username || 'Thành viên Audition AI')}</div>
              <div style="font-size:12px;color:var(--text-muted);">${escapeHtml(rank.name)}</div>
            </div>
          </div>
          ${catsHtml ? `<div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:flex-end;">${catsHtml}</div>` : ''}
        </div>

        <div style="display:flex;flex-direction:column;flex:1;min-height:170px;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
            <span style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--accent);">Câu lệnh (Prompt)</span>
            <span style="font-size:11px;color:var(--text-muted);">${(image.prompt || '').length} ký tự</span>
          </div>
          <div class="uk-prompt-box" id="uk-prompt-text" style="flex:1;min-height:135px;max-height:220px;background:rgba(5,7,14,0.75);border:1px solid rgba(56,189,248,0.22);border-radius:14px;padding:14px 16px;font-size:13.5px;line-height:1.68;color:#e2e8f0;">${escapeHtml(image.prompt)}</div>
          ${renderTopicHashtags(image)}
        </div>

        <div style="display:flex;flex-direction:column;gap:9px;">
          <button class="uk-btn uk-btn-primary" id="uk-copy-prompt" style="width:100%;padding:12px 18px;font-size:14px;border-radius:14px;">${ICONS.copy} <span>Sao chép Prompt</span></button>
          <div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:8px;">
            <button class="uk-btn" id="uk-copy-link" style="padding:9px 10px;font-size:12.5px;">${ICONS.link} <span>Chép Link</span></button>
            <button class="uk-btn" id="uk-open-article" style="padding:9px 10px;font-size:12.5px;">${ICONS.article} <span>Bài viết</span></button>
            <button class="uk-btn" id="uk-open-guide" style="padding:9px 10px;font-size:12.5px;">${ICONS.info} <span>Hướng dẫn</span></button>
          </div>
        </div>

        <div style="display:flex;align-items:center;justify-content:space-between;padding-top:10px;border-top:1px solid rgba(255,255,255,0.08);font-size:12px;color:var(--text-muted);gap:8px;flex-wrap:wrap;">
          <span>Đăng lúc: ${new Date(image.created_at).toLocaleString('vi-VN')}</span>
          ${canDelete ? `
            <div style="display:flex;gap:8px;align-items:center;">
              <button class="uk-btn" id="uk-edit-post" style="padding:5px 11px;color:#7dd3fc;border-color:rgba(56,189,248,0.35);">${ICONS.edit} Sửa</button>
              <button class="uk-btn" id="uk-delete-post" style="padding:5px 10px;color:#f87171;border-color:rgba(248,113,113,0.3);">${ICONS.trash} Xóa</button>
            </div>
          ` : ''}
        </div>
      </div>
    </div>
  `;

  if (window.innerWidth >= 768) {
    modal.querySelector('.pc-modal-card').style.height = 'min(680px, 90vh)';
    modal.querySelector('.uk-modal-media').style.maxHeight = 'none';
  } else {
    const card = modal.querySelector('.pc-modal-card');
    const media = modal.querySelector('.uk-modal-media');
    const imgEl = modal.querySelector('.uk-modal-img');
    card.style.maxHeight = '92vh';
    card.style.overflowY = 'auto';
    media.style.flex = 'none';
    media.style.maxHeight = 'none';
    media.style.height = 'auto';
    media.style.borderRight = 'none';
    if (imgEl) {
      imgEl.style.width = '100%';
      imgEl.style.height = 'auto';
      imgEl.style.maxHeight = '72vh';
    }
    modal.querySelector('.uk-modal-body').style.overflowY = 'visible';
    modal.querySelector('.uk-modal-body').style.flex = 'none';
  }

  document.body.appendChild(modal);

  if (opts.onModalMount) opts.onModalMount(modal);

  modal.addEventListener('click', (e) => { if (e.target === modal) engine.closeModal(); });
  modal.querySelector('#uk-modal-close').onclick = () => engine.closeModal();
  modal.querySelector('#uk-copy-prompt').onclick = async (e) => {
    const btn = e.currentTarget;
    const ok = await copyText(image.prompt);
    if (ok && btn) {
      engine.recordView(image);
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
  modal.querySelectorAll('[data-tag-search]').forEach(btn => {
    btn.onclick = () => {
      const q = btn.dataset.tagSearch;
      const sInp = document.getElementById('os-search');
      if (sInp) sInp.value = q;
      engine.closeModal();
      engine.setSearch(q);
    };
  });
  const editBtn = modal.querySelector('#uk-edit-post');
  if (editBtn) editBtn.onclick = () => openAddModal(engine, image);
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
    <article class="uk-article-wrap" style="max-width:980px;padding:18px 16px 96px;">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:14px;">
        <button class="uk-btn" id="uk-art-back" style="padding:7px 14px;">${ICONS.back} <span>Quay lại thư viện</span></button>
        <div style="font-size:12.5px;color:var(--text-muted);display:flex;align-items:center;gap:10px;">
          <span style="display:inline-flex;align-items:center;gap:4px;">${ICONS.eye.replace('<svg', '<svg style="width:14px;height:14px;"')} ${getDisplayViews(image)} lượt xem</span>
        </div>
      </div>

      <div class="uk-article-grid uk-modal-shell" style="padding:18px;border-radius:22px;gap:22px;">
        <div style="background:radial-gradient(circle at center,#111827,#05070c);border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.1);padding:10px;display:flex;align-items:center;justify-content:center;">
          <img src="${escapeHtml(image.image_url)}" alt="${escapeHtml(image.title)}" style="width:100%;max-height:62vh;object-fit:contain;display:block;border-radius:10px;" />
        </div>

        <div style="display:flex;flex-direction:column;gap:14px;">
          <h1 style="margin:0;font-size:24px;line-height:1.25;font-family:var(--font-display,inherit);">${escapeHtml(image.title)}</h1>

          <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;padding:10px 12px;border-radius:12px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);">
            <div style="display:flex;align-items:center;gap:10px;">
              ${renderAvatar(author, 36)}
              <div>
                <div style="font-weight:700;font-size:13.5px;color:${rank.color}">${escapeHtml(author?.username || 'Thành viên Audition AI')}</div>
                <div style="font-size:11.5px;color:var(--text-muted);">${escapeHtml(rank.name)} • ${new Date(image.created_at).toLocaleDateString('vi-VN')}</div>
              </div>
            </div>
            ${image.categories?.length ? `<div style="display:flex;flex-wrap:wrap;gap:6px;">${image.categories.map(c => `<button class="uk-chip" data-art-cat="${c.id}" style="padding:4px 10px;font-size:11.5px;">${escapeHtml(c.name)}</button>`).join('')}</div>` : ''}
          </div>

          <div>
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
              <span style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:var(--accent);">Câu lệnh (Prompt)</span>
              <button type="button" id="uk-art-toggle-prompt" style="background:none;border:none;color:var(--accent);font-size:11.5px;font-weight:600;cursor:pointer;padding:0;">Mở rộng</button>
            </div>
            <div class="uk-prompt-box" id="uk-art-prompt-box" style="max-height:165px;font-size:13px;line-height:1.6;">${escapeHtml(image.prompt)}</div>
            ${renderTopicHashtags(image)}
          </div>

          <div style="display:flex;flex-direction:column;gap:8px;margin-top:auto;">
            <button class="uk-btn uk-btn-primary" id="uk-art-copy" style="width:100%;padding:11px;">${ICONS.copy} <span>Sao chép Prompt</span></button>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
              <button class="uk-btn" id="uk-art-share">${ICONS.link} <span>Chép Link bài viết</span></button>
              <button class="uk-btn" id="uk-art-guide">${ICONS.info} <span>Hướng dẫn</span></button>
            </div>
          </div>
        </div>
      </div>

      ${fallbackRelated.length ? `
        <section style="margin-top:28px;">
          <h3 style="margin:0 0 12px;font-size:17px;font-family:var(--font-display,inherit);">Prompt liên quan</h3>
          <div class="uk-related-grid">
            ${fallbackRelated.map(r => `
              <div class="uk-modal-shell" data-rel-id="${r.id}" style="border-radius:14px;overflow:hidden;cursor:pointer;">
                <div style="aspect-ratio:4/5;overflow:hidden;background:#0a0a0c;">
                  <img src="${escapeHtml(r.thumbnail_url || r.image_url)}" alt="${escapeHtml(r.title)}" style="width:100%;height:100%;object-fit:cover;object-position:${getObjectPosition(r)};" loading="lazy" />
                </div>
              </div>
            `).join('')}
          </div>
        </section>
      ` : ''}
    </article>
  `;

  const pBox = container.querySelector('#uk-art-prompt-box');
  const pToggle = container.querySelector('#uk-art-toggle-prompt');
  pToggle.onclick = () => {
    const expanded = pBox.style.maxHeight === 'none';
    pBox.style.maxHeight = expanded ? '165px' : 'none';
    pToggle.textContent = expanded ? 'Mở rộng' : 'Thu gọn';
  };

  container.querySelector('#uk-art-back').onclick = () => engine.setPage('home');
  container.querySelector('#uk-art-copy').onclick = () => copyText(image.prompt);
  container.querySelector('#uk-art-share').onclick = () => copyText(engine.getShareUrl(image, true), 'Đã sao chép link bài viết!');
  container.querySelector('#uk-art-guide').onclick = () => openGuideModal();
  container.querySelectorAll('[data-art-cat]').forEach(b => b.onclick = () => engine.setCategory(Number(b.dataset.artCat)));
  container.querySelectorAll('[data-tag-search]').forEach(b => b.onclick = () => {
    const q = b.dataset.tagSearch;
    const sInp = document.getElementById('os-search');
    if (sInp) sInp.value = q;
    engine.setSearch(q);
  });
  container.querySelectorAll('[data-rel-id]').forEach(card => {
    card.onclick = () => engine.openArticle(Number(card.dataset.relId));
  });
}

export function renderSupportView(container, engine) {
  ensureKitStyles();
  const sup = engine.state.cmsConfig.support;
  container.innerHTML = `
    <div style="max-width:680px;margin:28px auto 96px;padding:0 16px;">
      <div class="uk-modal-shell" style="padding:28px;border-radius:22px;text-align:center;">
        <button class="uk-btn" id="uk-sup-back" style="margin-bottom:18px;">${ICONS.back} Quay lại</button>
        <h2 style="margin:0 0 8px;font-size:26px;font-family:var(--font-display,inherit);">${escapeHtml(sup.title)}</h2>
        <p style="color:var(--text-muted);font-size:14px;line-height:1.6;">${escapeHtml(sup.description)}</p>
        <div style="margin:22px auto;padding:20px;border-radius:16px;background:var(--surface-2);border:1px solid var(--border);max-width:380px;">
          ${sup.qrImageUrl ? `<div style="margin:0 auto 14px;max-width:220px;border-radius:14px;overflow:hidden;background:#fff;padding:8px;"><img src="${escapeHtml(sup.qrImageUrl)}" alt="Mã QR Ủng hộ" style="width:100%;height:auto;display:block;border-radius:8px;" /></div>` : ''}
          <div style="font-weight:700;font-size:16px;color:var(--accent);">${escapeHtml(sup.bankName)}</div>
          <div style="font-size:23px;font-weight:800;margin:8px 0;letter-spacing:1px;">${escapeHtml(sup.accountNumber)}</div>
          <div style="font-size:13px;color:var(--text-muted);">Chủ tài khoản: ${escapeHtml(sup.accountHolder)}</div>
          <button class="uk-btn uk-btn-primary" id="uk-copy-bank" style="margin-top:14px;">${ICONS.copy} Sao chép STK</button>
        </div>
      </div>
    </div>
  `;
  container.querySelector('#uk-sup-back').onclick = () => engine.setPage('home');
  container.querySelector('#uk-copy-bank').onclick = () => copyText(sup.accountNumber, 'Đã sao chép số tài khoản!');
}

export function renderProfileView(container, engine) {
  ensureKitStyles();
  const u = engine.state.currentUser;
  if (!u) { openAuthModal(engine, 'login'); engine.setPage('home'); return; }
  const rank = getRankInfo(u);
  const isAdmin = u.role === 'admin';
  const nextRank = INITIAL_RANKS.filter(r => r.requiredExp > (u.exp || 0)).sort((a,b) => a.requiredExp - b.requiredExp)[0];
  const pct = nextRank ? Math.min(100, Math.round(((u.exp || 0) / nextRank.requiredExp) * 100)) : 100;

  container.innerHTML = `
    <div style="max-width:920px;margin:24px auto 96px;padding:0 16px;">
      <div class="uk-modal-shell" style="padding:24px;border-radius:22px;">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:20px;">
          <button class="uk-btn" id="uk-prof-back">${ICONS.back} Trang chủ</button>
          <button class="uk-btn" id="uk-prof-logout" style="color:#f87171;">Đăng xuất</button>
        </div>

        <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;padding:16px;border-radius:16px;background:rgba(255,255,255,0.03);border:1px solid var(--border);margin-bottom:18px;">
          ${renderAvatar(u, 68)}
          <div style="flex:1;min-width:200px;">
            <h2 style="margin:0;font-size:22px;color:${rank.color}">${escapeHtml(u.username)}</h2>
            <div style="font-size:13px;color:var(--text-muted);margin-top:3px;">${escapeHtml(rank.name)} • ${escapeHtml(u.email)}</div>
            <div style="margin-top:10px;">
              <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:5px;color:var(--text-muted);">
                <span>Kinh nghiệm: <strong style="color:#fff;">${u.exp || 0} EXP</strong></span>
                <span>${nextRank ? `Mục tiêu: ${nextRank.name} (${nextRank.requiredExp})` : 'Cấp tối đa'}</span>
              </div>
              <div style="height:7px;border-radius:999px;background:rgba(255,255,255,0.1);overflow:hidden;">
                <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,var(--accent),var(--accent-2));"></div>
              </div>
            </div>
          </div>
        </div>

        <div style="display:flex;gap:8px;flex-wrap:wrap;border-bottom:1px solid var(--border);padding-bottom:12px;margin-bottom:16px;" id="uk-prof-tabs">
          <button class="uk-btn uk-btn-primary" data-ptab="profile">Hồ sơ cá nhân</button>
          <button class="uk-btn" data-ptab="security">Đổi mật khẩu</button>
          ${isAdmin ? `
            <button class="uk-btn" data-ptab="r2">Ảnh lỗi R2 / Private</button>
            <button class="uk-btn" data-ptab="cats">Chuyên mục</button>
            <button class="uk-btn" data-ptab="users">Thành viên</button>
            <button class="uk-btn" data-ptab="support">Trang Ủng hộ</button>
            <button class="uk-btn" data-ptab="welcome">Thông báo</button>
            <button class="uk-btn" data-ptab="seo">Cấu hình SEO</button>
          ` : ''}
        </div>

        <div id="uk-prof-body"></div>
      </div>
    </div>
  `;

  container.querySelector('#uk-prof-back').onclick = () => engine.setPage('home');
  container.querySelector('#uk-prof-logout').onclick = () => engine.logout();

  const body = container.querySelector('#uk-prof-body');
  const tabs = container.querySelectorAll('[data-ptab]');

  const renderProfileTab = () => {
    body.innerHTML = `
      <form id="uk-prof-edit-form" style="display:flex;flex-direction:column;gap:14px;max-width:520px;">
        <label style="font-size:12.5px;color:var(--text-muted);">Tên hiển thị
          <input class="uk-input" id="uk-prof-name" value="${escapeHtml(u.username || '')}" required style="margin-top:6px;" />
        </label>
        <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding:12px;border-radius:12px;background:rgba(255,255,255,0.03);border:1px solid var(--border);">
          <div style="flex:1;min-width:180px;">
            <div style="font-size:12.5px;color:var(--text-muted);margin-bottom:6px;">Ảnh đại diện (URL hoặc tải lên)</div>
            <input class="uk-input" id="uk-prof-avatar-url" value="${escapeHtml(u.avatarUrl || '')}" placeholder="https://..." />
          </div>
          <label class="uk-btn" style="cursor:pointer;">
            Chọn ảnh
            <input type="file" accept="image/*" id="uk-prof-avatar-file" style="display:none;" />
          </label>
        </div>
        <button class="uk-btn uk-btn-primary" type="submit" id="uk-prof-save">Lưu thay đổi</button>
      </form>
    `;
    let selectedFile = null;
    body.querySelector('#uk-prof-avatar-file').onchange = (e) => {
      selectedFile = e.target.files?.[0] || null;
      if (selectedFile) showToast(`Đã chọn ảnh: ${selectedFile.name}. Bấm Lưu thay đổi để tải lên.`);
    };
    body.querySelector('#uk-prof-edit-form').onsubmit = async (e) => {
      e.preventDefault();
      const btn = body.querySelector('#uk-prof-save');
      btn.disabled = true; btn.textContent = 'Đang lưu...';
      try {
        await engine.updateProfile({
          username: body.querySelector('#uk-prof-name').value,
          avatarUrl: body.querySelector('#uk-prof-avatar-url').value.trim(),
          avatarFile: selectedFile,
        });
        renderProfileView(container, engine);
      } catch (err) {
        showToast(err.message, 'error');
        btn.disabled = false; btn.textContent = 'Lưu thay đổi';
      }
    };
  };

  const renderSecurityTab = () => {
    body.innerHTML = `
      <form id="uk-prof-pass-form" style="display:flex;flex-direction:column;gap:14px;max-width:460px;">
        <label style="font-size:12.5px;color:var(--text-muted);">Mật khẩu mới (tối thiểu 6 ký tự)
          <input class="uk-input" type="password" id="uk-new-pass" required minlength="6" style="margin-top:6px;" />
        </label>
        <label style="font-size:12.5px;color:var(--text-muted);">Xác nhận mật khẩu mới
          <input class="uk-input" type="password" id="uk-confirm-pass" required minlength="6" style="margin-top:6px;" />
        </label>
        <button class="uk-btn uk-btn-primary" type="submit">Đổi mật khẩu</button>
      </form>
    `;
    body.querySelector('#uk-prof-pass-form').onsubmit = async (e) => {
      e.preventDefault();
      const p1 = body.querySelector('#uk-new-pass').value;
      const p2 = body.querySelector('#uk-confirm-pass').value;
      if (p1 !== p2) { showToast('Mật khẩu xác nhận không khớp.', 'error'); return; }
      try {
        await engine.changePassword(p1);
        e.target.reset();
      } catch (err) { showToast(err.message, 'error'); }
    };
  };

  const selectTab = (tabName) => {
    tabs.forEach(x => x.classList.toggle('uk-btn-primary', x.dataset.ptab === tabName));
    if (tabName === 'profile') renderProfileTab();
    else if (tabName === 'security') renderSecurityTab();
    else if (isAdmin) mountAdminTabBody(body, tabName, engine);
  };

  tabs.forEach(t => t.onclick = () => selectTab(t.dataset.ptab));
  selectTab('profile');
}

export function openGuideModal() {
  ensureKitStyles();
  document.getElementById('uk-guide-modal')?.remove();
  const m = document.createElement('div');
  m.id = 'uk-guide-modal';
  m.className = 'pc-modal-backdrop';
  m.style.zIndex = '1100';

  const steps = [
    {
      num: '01',
      title: 'Chọn mẫu & Sao chép Prompt',
      desc: 'Duyệt thư viện hoặc tìm theo hashtag chủ đề (vd: #ảnh nữ xinh, #ảnh couple, #ảnh nhóm), sau đó bấm nút "Sao chép Prompt".',
      color: '#38bdf8',
    },
    {
      num: '02',
      title: 'Mở ứng dụng AUDITION AI',
      desc: 'Truy cập công cụ tạo ảnh chuyên dụng tại auditionai.io.vn (hoặc bấm nút "Mở AUDITION AI" bên dưới để mở nhanh).',
      color: '#e879f9',
    },
    {
      num: '03',
      title: 'Tải ảnh mẫu & Dán câu lệnh',
      desc: 'Tải lên ảnh nhân vật/khuôn mặt tham chiếu của bạn (đúng số người với prompt đơn/couple/nhóm) rồi dán câu lệnh vừa chép.',
      color: '#a78bfa',
    },
    {
      num: '04',
      title: 'Chọn tỷ lệ & Nhấn Tạo ảnh',
      desc: 'Chọn tỷ lệ khung hình 4:5 hoặc 3:4 cho ảnh chân dung, nhấn Tạo ảnh và tải về thành quả sắc nét.',
      color: '#34d399',
    },
  ];

  m.innerHTML = `
    <div class="pc-modal-card uk-modal-shell" style="max-width:640px;max-height:90vh;overflow-y:auto;padding:26px 24px;border-radius:24px;border:1px solid rgba(56,189,248,0.32);background:linear-gradient(155deg,rgba(13,21,44,0.97),rgba(20,14,38,0.97));box-shadow:0 32px 90px rgba(0,0,0,0.78),0 0 40px rgba(56,189,248,0.16);">
      <button class="uk-close-btn" id="uk-g-close" aria-label="Đóng">${ICONS.close}</button>

      <div style="display:flex;align-items:center;gap:14px;padding-right:36px;margin-bottom:18px;">
        <div style="width:46px;height:46px;border-radius:14px;flex-shrink:0;display:grid;place-items:center;background:linear-gradient(135deg,rgba(56,189,248,0.22),rgba(232,121,249,0.22));border:1px solid rgba(56,189,248,0.45);color:#7dd3fc;">
          ${ICONS.sparkles.replace('<svg', '<svg style="width:24px;height:24px;"')}
        </div>
        <div>
          <h3 style="margin:0;font-size:20px;font-weight:700;font-family:var(--font-display,inherit);background:linear-gradient(90deg,#fff,#7dd3fc,#f0abfc);-webkit-background-clip:text;color:transparent;">Hướng dẫn tạo ảnh với AUDITION AI</h3>
          <div style="font-size:12.5px;color:var(--text-muted);margin-top:3px;">4 bước đơn giản để biến câu lệnh mẫu thành ảnh AI sắc nét</div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr;gap:10px;margin-bottom:16px;">
        ${steps.map(s => `
          <div style="display:flex;align-items:flex-start;gap:12px;padding:12px 14px;border-radius:14px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.09);">
            <div style="min-width:34px;height:34px;border-radius:10px;display:grid;place-items:center;font-weight:800;font-size:12.5px;background:rgba(255,255,255,0.06);border:1px solid ${s.color};color:${s.color};flex-shrink:0;">${s.num}</div>
            <div style="min-width:0;">
              <div style="font-weight:700;font-size:14px;color:#f8fafc;margin-bottom:3px;">${escapeHtml(s.title)}</div>
              <div style="font-size:12.8px;line-height:1.55;color:#cbd5e1;">${escapeHtml(s.desc)}</div>
            </div>
          </div>
        `).join('')}
      </div>

      <div style="padding:12px 14px;border-radius:14px;background:rgba(56,189,248,0.08);border:1px solid rgba(56,189,248,0.28);margin-bottom:18px;">
        <div style="font-size:12px;font-weight:700;color:#7dd3fc;margin-bottom:5px;text-transform:uppercase;letter-spacing:0.05em;">Mẹo để ảnh đẹp &amp; giống mẫu nhất</div>
        <ul style="margin:0;padding-left:18px;font-size:12.5px;line-height:1.65;color:#cbd5e1;">
          <li>Chọn ảnh khuôn mặt rõ nét, ánh sáng đều, không bị che khuất.</li>
          <li>Có thể sửa trực tiếp màu tóc, trang phục hoặc bối cảnh trong câu lệnh trước khi tạo.</li>
        </ul>
      </div>

      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
        <a href="https://auditionai.io.vn/" target="_blank" rel="noopener noreferrer" class="uk-btn uk-btn-primary" style="flex:1;min-width:210px;padding:12px 18px;font-size:14px;border-radius:14px;">
          ${ICONS.article.replace('<svg', '<svg style="width:16px;height:16px;"')}
          <span>Mở ứng dụng AUDITION AI</span>
        </a>
        <button class="uk-btn" id="uk-g-ok" style="padding:12px 20px;border-radius:14px;">Đã hiểu</button>
      </div>
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
          <input class="uk-input" type="text" id="uk-a-username" placeholder="Tên hiển thị" autocomplete="nickname" />
        </div>
        <input class="uk-input" type="email" id="uk-a-email" placeholder="Email" autocomplete="email" required />
        <div style="position:relative;">
          <input class="uk-input" type="password" id="uk-a-pass" placeholder="Mật khẩu" autocomplete="current-password" style="padding-right:42px;" required />
          <button type="button" id="uk-a-toggle-pass" title="Hiện/Ẩn mật khẩu" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;color:#94a3b8;cursor:pointer;padding:4px;display:grid;place-items:center;">${ICONS.eye.replace('<svg', '<svg style="width:18px;height:18px;"')}</button>
        </div>
        <div id="uk-a-err" style="font-size:13px;color:#f87171;display:none;"></div>
        <button class="uk-btn uk-btn-primary" type="submit" id="uk-a-submit">${mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}</button>
      </form>
      <div style="margin-top:12px;font-size:13px;display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;color:var(--text-muted);">
        <button type="button" id="uk-a-switch" style="background:none;border:none;color:var(--accent-2);cursor:pointer;font-weight:600;">
          ${mode === 'login' ? 'Chưa có tài khoản? Đăng ký ngay' : 'Đã có tài khoản? Đăng nhập'}
        </button>
        <button type="button" id="uk-a-forgot" style="background:none;border:none;color:var(--accent);cursor:pointer;font-size:12.5px;display:${mode === 'login' ? 'inline-block' : 'none'};">
          Quên mật khẩu?
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(m);
  let curMode = mode;
  const close = () => m.remove();
  m.onclick = (e) => { if (e.target === m) close(); };
  m.querySelector('#uk-a-close').onclick = close;
  m.querySelector('#uk-a-toggle-pass').onclick = () => {
    const p = m.querySelector('#uk-a-pass');
    p.type = p.type === 'password' ? 'text' : 'password';
  };
  m.querySelector('#uk-a-forgot').onclick = async () => {
    const email = m.querySelector('#uk-a-email').value.trim();
    const errEl = m.querySelector('#uk-a-err');
    if (!email) {
      errEl.textContent = 'Vui lòng nhập email trước khi bấm Quên mật khẩu.';
      errEl.style.display = 'block';
      return;
    }
    try {
      await engine.resetPassword(email);
    } catch (err) {
      errEl.textContent = err.message || 'Không thể gửi email đặt lại mật khẩu.';
      errEl.style.display = 'block';
    }
  };
  m.querySelector('#uk-a-switch').onclick = () => {
    curMode = curMode === 'login' ? 'signup' : 'login';
    m.querySelector('#uk-a-title').textContent = curMode === 'login' ? 'Đăng nhập' : 'Đăng ký tài khoản';
    m.querySelector('#uk-a-user-wrap').style.display = curMode === 'signup' ? 'block' : 'none';
    m.querySelector('#uk-a-forgot').style.display = curMode === 'login' ? 'inline-block' : 'none';
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

export function openAddModal(engine, editImage = null) {
  if (!engine.state.currentUser) { openAuthModal(engine, 'login'); return; }
  ensureKitStyles();
  document.getElementById('uk-add-modal')?.remove();
  const isEdit = Boolean(editImage);
  const selectedCatIds = new Set((editImage?.categories || []).map(c => c.id));
  const initialTags = Array.isArray(editImage?.hashtags) ? editImage.hashtags.join(', ') : '';
  const m = document.createElement('div');
  m.id = 'uk-add-modal';
  m.className = 'pc-modal-backdrop';
  m.style.zIndex = '1120';
  m.innerHTML = `
    <div class="pc-modal-card uk-modal-shell" style="max-width:860px;max-height:92vh;overflow-y:auto;padding:24px;border-radius:24px;border:1px solid rgba(56,189,248,0.32);background:linear-gradient(155deg,rgba(12,18,36,0.97),rgba(18,12,34,0.97));box-shadow:0 32px 90px rgba(0,0,0,0.78),0 0 40px rgba(56,189,248,0.16);">
      <button class="uk-close-btn" id="uk-add-close" aria-label="Đóng">${ICONS.close}</button>

      <div style="display:flex;align-items:center;gap:12px;margin-bottom:18px;padding-right:36px;">
        <div style="width:42px;height:42px;border-radius:13px;display:grid;place-items:center;background:linear-gradient(135deg,rgba(56,189,248,0.22),rgba(232,121,249,0.22));border:1px solid rgba(56,189,248,0.42);color:#7dd3fc;flex-shrink:0;">
          ${(isEdit ? ICONS.edit : ICONS.plus).replace('<svg', '<svg style="width:20px;height:20px;"')}
        </div>
        <div>
          <h3 style="margin:0;font-size:20px;font-weight:700;font-family:var(--font-display,inherit);background:linear-gradient(90deg,#fff,#7dd3fc,#f0abfc);-webkit-background-clip:text;color:transparent;">${isEdit ? 'Chỉnh sửa Prompt &amp; Ảnh' : 'Đăng Prompt &amp; Ảnh mới'}</h3>
          <div style="font-size:12.5px;color:var(--text-muted);margin-top:2px;">${isEdit ? 'Cập nhật tiêu đề, ảnh, câu lệnh, chuyên mục và tối đa 10 từ khóa' : 'Tải ảnh lên, nhập câu lệnh và nhận ngay +50 EXP đóng góp cộng đồng'}</div>
        </div>
      </div>

      <form id="uk-add-form" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(270px,1fr));gap:18px;align-items:start;">
        <div style="display:flex;flex-direction:column;gap:10px;">
          <div id="uk-add-dropzone" style="position:relative;aspect-ratio:4/5;border-radius:18px;border:1.5px dashed rgba(56,189,248,0.45);background:rgba(5,7,14,0.65);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;cursor:pointer;overflow:hidden;text-align:center;padding:16px;transition:border-color 0.2s,background 0.2s;user-select:none;">
            <img id="uk-add-preview" alt="" draggable="false" src="${isEdit ? escapeHtml(editImage.image_url) : ''}" style="display:${isEdit ? 'block' : 'none'};position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:${isEdit ? getObjectPosition(editImage) : '50% 50%'};background:#05070e;cursor:grab;" />
            <div id="uk-add-crop-hint" style="display:${isEdit ? 'block' : 'none'};position:absolute;bottom:10px;left:50%;transform:translateX(-50%);z-index:3;padding:4px 10px;border-radius:999px;background:rgba(5,7,14,0.82);border:1px solid rgba(56,189,248,0.4);font-size:11px;font-weight:600;color:#7dd3fc;white-space:nowrap;pointer-events:none;">Kéo lướt để căn khung thumbnail 4:5</div>
            <div id="uk-add-placeholder" style="display:${isEdit ? 'none' : 'flex'};flex-direction:column;align-items:center;gap:8px;color:var(--text-muted);">
              <div style="width:48px;height:48px;border-radius:14px;background:rgba(56,189,248,0.14);border:1px solid rgba(56,189,248,0.35);display:grid;place-items:center;color:#7dd3fc;">
                ${ICONS.plus.replace('<svg', '<svg style="width:22px;height:22px;"')}
              </div>
              <div style="font-weight:700;font-size:13.5px;color:#e2e8f0;">Bấm hoặc kéo thả ảnh vào đây</div>
              <div style="font-size:11.5px;">Khung xem trước căn thumbnail 4:5 — Ảnh gốc (vd 9:16) vẫn giữ nguyên kích thước khi tải lên</div>
            </div>
            <input type="file" id="uk-add-file" accept="image/*" style="display:none;" ${isEdit ? '' : 'required'} />
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
            <div id="uk-add-file-info" style="font-size:12px;color:var(--text-muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${isEdit ? 'Đang dùng ảnh hiện tại (có thể kéo căn lại hoặc đổi ảnh mới)' : 'Chưa chọn ảnh'}</div>
            <button type="button" id="uk-add-change-img" class="uk-btn" style="display:${isEdit ? 'inline-flex' : 'none'};padding:4px 10px;font-size:11.5px;flex-shrink:0;">Đổi ảnh</button>
          </div>
        </div>

        <div style="display:flex;flex-direction:column;gap:12px;">
          <div>
            <label style="display:block;font-size:12px;font-weight:600;color:var(--text-muted);margin-bottom:5px;">Tiêu đề bức ảnh</label>
            <input class="uk-input" type="text" id="uk-add-title" value="${isEdit ? escapeHtml(editImage.title || '') : ''}" placeholder="Ví dụ: Chân dung nữ cá tính neon..." required />
          </div>

          <div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px;">
              <label style="font-size:12px;font-weight:600;color:var(--text-muted);">Câu lệnh (Prompt)</label>
              <span id="uk-add-char" style="font-size:11px;color:var(--text-muted);">${isEdit ? (editImage.prompt || '').length : 0} ký tự</span>
            </div>
            <textarea class="uk-input" id="uk-add-prompt" rows="5" placeholder="Dán toàn bộ câu lệnh tạo ảnh AI..." required style="resize:vertical;line-height:1.55;">${isEdit ? escapeHtml(editImage.prompt || '') : ''}</textarea>
          </div>

          <div>
            <div style="font-size:12px;font-weight:600;color:var(--text-muted);margin-bottom:6px;">Chuyên mục</div>
            <div style="display:flex;flex-wrap:wrap;gap:6px;" id="uk-add-cats">
              ${engine.state.categories.map(c => `<label class="uk-chip" style="padding:5px 11px;"><input type="checkbox" value="${c.id}" ${selectedCatIds.has(c.id) ? 'checked' : ''} data-cat-name="${escapeHtml(c.name)}" style="accent-color:var(--accent);"> ${escapeHtml(c.name)}</label>`).join('')}
            </div>
          </div>

          <div style="padding:12px;border-radius:14px;background:rgba(56,189,248,0.07);border:1px solid rgba(56,189,248,0.24);">
            <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:8px;">
              <span style="font-size:12px;font-weight:700;color:#7dd3fc;">Từ khóa chủ đề (Tối đa 10 từ khóa)</span>
              <button type="button" id="uk-add-retag" class="uk-btn" style="padding:4px 10px;font-size:11.5px;">${ICONS.sparkles.replace('<svg', '<svg style="width:13px;height:13px;"')} Gợi ý lại</button>
            </div>
            <input class="uk-input" type="text" id="uk-add-tags" value="${escapeHtml(initialTags)}" placeholder="Tự động điền khi nhập tiêu đề, prompt &amp; ảnh..." style="font-size:12.5px;" />
            <div style="font-size:11px;color:var(--text-muted);margin-top:5px;">Ngăn cách nhau bằng dấu phẩy (tối đa 10 từ khóa, có thể tự sửa).</div>
          </div>

          <button class="uk-btn uk-btn-primary" type="submit" id="uk-add-submit" style="padding:12px 18px;font-size:14px;border-radius:14px;margin-top:4px;">${isEdit ? ICONS.check : ICONS.plus} <span>${isEdit ? 'Lưu thay đổi' : 'Đăng bài ngay (+50 EXP)'}</span></button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(m);
  m.onclick = (e) => { if (e.target === m) m.remove(); };
  m.querySelector('#uk-add-close').onclick = () => m.remove();

  const fileInput = m.querySelector('#uk-add-file');
  const previewImg = m.querySelector('#uk-add-preview');
  const cropHint = m.querySelector('#uk-add-crop-hint');
  const changeImgBtn = m.querySelector('#uk-add-change-img');
  const placeholder = m.querySelector('#uk-add-placeholder');
  const fileInfo = m.querySelector('#uk-add-file-info');
  const titleEl = m.querySelector('#uk-add-title');
  const promptEl = m.querySelector('#uk-add-prompt');
  const tagsEl = m.querySelector('#uk-add-tags');
  const charEl = m.querySelector('#uk-add-char');
  let detectedTone = '';
  let userEditedTags = isEdit && Boolean(initialTags);
  let posX = 50, posY = 50, natW = editImage?.original_width || 0, natH = editImage?.original_height || 0;
  if (isEdit && editImage?.thumbnail_crop_data && natW && natH) {
    const c = editImage.thumbnail_crop_data;
    posX = Math.max(0, Math.min(100, ((c.x + c.width / 2) / natW) * 100));
    posY = Math.max(0, Math.min(100, ((c.y + c.height / 2) / natH) * 100));
  }

  const refreshSuggestedTags = (force = false) => {
    if (userEditedTags && !force) return;
    const categoryNames = [...m.querySelectorAll('#uk-add-cats input:checked')].map(i => i.dataset.catName || '');
    const tags = suggestHashtagsFromPost({
      title: titleEl.value,
      prompt: promptEl.value,
      categoryNames,
      toneTag: detectedTone,
    });
    tagsEl.value = tags.join(', ');
  };

  tagsEl.addEventListener('input', () => { userEditedTags = true; });
  titleEl.addEventListener('input', () => refreshSuggestedTags(false));
  promptEl.addEventListener('input', () => {
    charEl.textContent = `${promptEl.value.length} ký tự`;
    refreshSuggestedTags(false);
  });
  m.querySelectorAll('#uk-add-cats input').forEach(cb => cb.addEventListener('change', () => refreshSuggestedTags(false)));
  m.querySelector('#uk-add-retag').onclick = () => { userEditedTags = false; refreshSuggestedTags(true); };

  const handleFileSelect = async (file) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    posX = 50; posY = 50;
    previewImg.onload = () => {
      natW = previewImg.naturalWidth || 0;
      natH = previewImg.naturalHeight || 0;
      fileInfo.textContent = `${file.name} (${natW}×${natH} • ${Math.round(file.size / 1024)} KB)`;
    };
    previewImg.src = url;
    previewImg.style.objectPosition = '50% 50%';
    previewImg.style.display = 'block';
    cropHint.style.display = 'block';
    changeImgBtn.style.display = 'inline-flex';
    placeholder.style.display = 'none';
    detectedTone = await analyzeImageTone(file) || '';
    refreshSuggestedTags(false);
  };

  const dz = m.querySelector('#uk-add-dropzone');
  dz.onclick = (e) => {
    if (e.target === previewImg) return;
    fileInput.click();
  };
  changeImgBtn.onclick = () => fileInput.click();

  let draggingCrop = false, dragSX = 0, dragSY = 0;
  previewImg.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    draggingCrop = true;
    dragSX = e.clientX;
    dragSY = e.clientY;
    previewImg.style.cursor = 'grabbing';
  });
  window.addEventListener('pointermove', (e) => {
    if (!draggingCrop) return;
    const dx = e.clientX - dragSX;
    const dy = e.clientY - dragSY;
    dragSX = e.clientX; dragSY = e.clientY;
    posX = Math.max(0, Math.min(100, posX - dx * 0.35));
    posY = Math.max(0, Math.min(100, posY - dy * 0.35));
    previewImg.style.objectPosition = `${posX.toFixed(1)}% ${posY.toFixed(1)}%`;
  });
  window.addEventListener('pointerup', () => {
    if (!draggingCrop) return;
    draggingCrop = false;
    previewImg.style.cursor = 'grab';
  });

  fileInput.onchange = () => handleFileSelect(fileInput.files?.[0]);
  dz.addEventListener('dragover', (e) => { e.preventDefault(); dz.style.borderColor = '#e879f9'; });
  dz.addEventListener('dragleave', () => { dz.style.borderColor = 'rgba(56,189,248,0.45)'; });
  dz.addEventListener('drop', (e) => {
    e.preventDefault();
    dz.style.borderColor = 'rgba(56,189,248,0.45)';
    const f = e.dataTransfer?.files?.[0];
    if (f) {
      const dt = new DataTransfer();
      dt.items.add(f);
      fileInput.files = dt.files;
      handleFileSelect(f);
    }
  });

  m.querySelector('#uk-add-form').onsubmit = async (e) => {
    e.preventDefault();
    const file = fileInput.files?.[0] || null;
    if (!isEdit && !file) { showToast('Vui lòng chọn ảnh để đăng.', 'error'); return; }
    const btn = m.querySelector('#uk-add-submit');
    btn.disabled = true; btn.textContent = isEdit ? 'Đang lưu...' : 'Đang tải lên...';
    try {
      const title = titleEl.value.trim();
      const prompt = promptEl.value.trim();
      const categoryIds = [...m.querySelectorAll('#uk-add-cats input:checked')].map(i => Number(i.value));
      const hashtags = tagsEl.value.split(',').map(s => s.replace(/^#/, '').trim()).filter(Boolean).slice(0, 10);
      const w = natW || previewImg.naturalWidth || 0;
      const h = natH || previewImg.naturalHeight || 0;
      let cropData = null;
      if (w && h) {
        const targetRatio = 4 / 5;
        const srcRatio = w / h;
        const cw = srcRatio > targetRatio ? Math.round(h * targetRatio) : w;
        const ch = srcRatio > targetRatio ? h : Math.round(w / targetRatio);
        cropData = {
          x: Math.round(((w - cw) * posX) / 100),
          y: Math.round(((h - ch) * posY) / 100),
          width: cw,
          height: ch,
        };
      }
      if (isEdit) {
        await engine.updatePost(editImage.id, { title, prompt, categoryIds, file, hashtags, cropData, originalWidth: w, originalHeight: h });
      } else {
        await engine.createPost({ title, prompt, categoryIds, file, hashtags, cropData, originalWidth: w, originalHeight: h });
      }
      m.remove();
    } catch (err) {
      showToast(err.message, 'error');
      btn.disabled = false; btn.innerHTML = `${isEdit ? ICONS.check : ICONS.plus} <span>${isEdit ? 'Lưu thay đổi' : 'Đăng bài ngay (+50 EXP)'}</span>`;
    }
  };
}

export function openWelcomeModal(engine, force = false) {
  const cfg = engine.state.cmsConfig.welcome;
  if (!force) {
    if (!cfg.enabled) return;
    try {
      if (sessionStorage.getItem('os_welcome_seen') === '1') return;
    } catch {}
  }
  ensureKitStyles();
  document.getElementById('uk-welcome-modal')?.remove();
  const totalCount = engine.state.allImagesMeta.length || 1700;
  const m = document.createElement('div');
  m.id = 'uk-welcome-modal';
  m.className = 'pc-modal-backdrop';
  m.style.zIndex = '1150';
  m.innerHTML = `
    <div class="pc-modal-card uk-modal-shell" style="max-width:560px;padding:28px 26px;text-align:center;border-radius:24px;border:1px solid rgba(56,189,248,0.35);background:linear-gradient(145deg, rgba(13,21,44,0.96), rgba(24,14,42,0.96));box-shadow:0 30px 90px rgba(0,0,0,0.75), 0 0 40px rgba(56,189,248,0.18);">
      <button class="uk-close-btn" id="uk-w-close" aria-label="Đóng">${ICONS.close}</button>
      <div style="width:56px;height:56px;margin:0 auto 14px;border-radius:16px;background:linear-gradient(135deg,rgba(56,189,248,0.22),rgba(232,121,249,0.22));border:1px solid rgba(56,189,248,0.45);display:grid;place-items:center;color:#7dd3fc;">
        ${ICONS.sparkles.replace('<svg', '<svg style="width:28px;height:28px;"')}
      </div>
      <div style="display:inline-flex;align-items:center;gap:6px;padding:4px 12px;border-radius:999px;background:rgba(56,189,248,0.14);border:1px solid rgba(56,189,248,0.32);font-size:11.5px;font-weight:700;color:#7dd3fc;margin:0 auto 10px;">
        ${escapeHtml(cfg.badge)} • ${totalCount}+ Prompts
      </div>
      <h2 style="margin:0 0 10px;font-size:24px;line-height:1.25;font-family:var(--font-display,inherit);background:linear-gradient(90deg,#fff,#7dd3fc,#f0abfc);-webkit-background-clip:text;color:transparent;">${escapeHtml(cfg.title)}</h2>
      <p style="margin:0 0 20px;font-size:13.5px;line-height:1.65;color:#cbd5e1;">${escapeHtml(cfg.description)}</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px;">
        <a href="${escapeHtml(cfg.fbUrl)}" target="_blank" rel="noopener" class="uk-btn">Facebook</a>
        <a href="${escapeHtml(cfg.tiktokUrl)}" target="_blank" rel="noopener" class="uk-btn">TikTok</a>
        <a href="${escapeHtml(cfg.appUrl)}" target="_blank" rel="noopener" class="uk-btn" style="grid-column:1/-1;border-color:rgba(56,189,248,0.4);color:#7dd3fc;">${ICONS.sparkles} Mở ứng dụng AUDITION AI</a>
      </div>
      <button class="uk-btn uk-btn-primary" id="uk-w-go" style="width:100%;padding:12px;font-size:14px;border-radius:14px;">Bắt đầu khám phá</button>
    </div>
  `;
  document.body.appendChild(m);
  const close = () => {
    try { sessionStorage.setItem('os_welcome_seen', '1'); } catch {}
    m.remove();
  };
  m.onclick = (e) => { if (e.target === m) close(); };
  m.querySelector('#uk-w-close').onclick = close;
  m.querySelector('#uk-w-go').onclick = close;
}

function mountAdminTabBody(body, tabName, engine) {
  const renderR2Tab = () => {
    const privateSet = new Set([...(engine.state.cmsConfig.privateIds || []), ...engine.state.brokenIds]);
    const list = engine.state.allImagesMeta.filter(i => privateSet.has(Number(i.id)));
    body.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:14px;">
        <div style="font-size:13px;color:var(--text-muted);">Đang ẩn (Private / Lỗi R2): <strong>${list.length}</strong> ảnh</div>
        <button class="uk-btn uk-btn-primary" id="uk-scan-r2">Quét toàn bộ ảnh lỗi R2</button>
      </div>
      <div id="uk-scan-status" style="font-size:12.5px;color:var(--accent);margin-bottom:10px;"></div>
      <div style="display:flex;flex-direction:column;gap:10px;max-height:420px;overflow-y:auto;">
        ${list.length === 0 ? '<div style="padding:24px;text-align:center;color:var(--text-muted);">Chưa có ảnh nào trong danh sách Private / Lỗi R2.</div>' : list.map(img => `
          <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px;border-radius:12px;background:rgba(255,255,255,0.04);border:1px solid var(--border);flex-wrap:wrap;">
            <div style="min-width:0;flex:1;">
              <div style="font-weight:700;font-size:13px;">#${img.id} — ${escapeHtml(img.title)}</div>
              <div style="font-size:11px;color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(img.thumbnail_url || img.image_url)}</div>
            </div>
            <div style="display:flex;gap:6px;align-items:center;">
              <label class="uk-btn uk-btn-primary" style="padding:6px 10px;font-size:12px;cursor:pointer;">
                Thay ảnh mới
                <input type="file" accept="image/*" data-replace-id="${img.id}" style="display:none;" />
              </label>
              <button class="uk-btn" data-restore-id="${img.id}" style="padding:6px 10px;font-size:12px;">Khôi phục</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    body.querySelector('#uk-scan-r2').onclick = async (e) => {
      const btn = e.currentTarget;
      btn.disabled = true; btn.textContent = 'Đang quét...';
      const status = body.querySelector('#uk-scan-status');
      const items = engine.state.allImagesMeta;
      let idx = 0, brokenCount = 0;
      const probe = (url) => new Promise(res => {
        if (!url) return res(false);
        const im = new Image();
        const tm = setTimeout(() => { im.onload = im.onerror = null; res(false); }, 6000);
        im.onload = () => { clearTimeout(tm); res(im.naturalWidth > 0); };
        im.onerror = () => { clearTimeout(tm); res(false); };
        im.src = url;
      });
      const worker = async () => {
        while (idx < items.length) {
          const cur = items[idx++];
          const ok = await probe(cur.thumbnail_url || cur.image_url);
          if (!ok) { engine.markImageBroken(cur.id); brokenCount++; }
          if (idx % 20 === 0 || idx === items.length) status.textContent = `Đã quét ${idx}/${items.length} ảnh — phát hiện ${brokenCount} ảnh lỗi...`;
        }
      };
      await Promise.all(Array.from({ length: 6 }, worker));
      engine.applyFilters();
      showToast(`Hoàn tất! Phát hiện ${brokenCount} ảnh lỗi đã chuyển về Private.`);
      renderR2Tab();
    };

    body.querySelectorAll('[data-replace-id]').forEach(inp => inp.onchange = async () => {
      const file = inp.files?.[0];
      if (!file) return;
      try {
        await engine.replaceImageFile(Number(inp.dataset.replaceId), file);
        renderR2Tab();
      } catch (err) { showToast(err.message, 'error'); }
    });

    body.querySelectorAll('[data-restore-id]').forEach(btn => btn.onclick = () => {
      const id = Number(btn.dataset.restoreId);
      engine.state.brokenIds.delete(id);
      saveBrokenIds(engine.state.brokenIds);
      engine.state.cmsConfig.privateIds = (engine.state.cmsConfig.privateIds || []).filter(x => x !== id);
      saveCmsConfig(engine.state.cmsConfig);
      engine.applyFilters();
      showToast(`Đã khôi phục ảnh #${id} về Public!`);
      renderR2Tab();
    });
  };

  const renderCatsTab = () => {
    const cats = engine.state.categories || [];
    body.innerHTML = `
      <form id="uk-adm-cat-form" style="display:flex;gap:8px;margin-bottom:14px;">
        <input class="uk-input" id="uk-adm-cat-name" placeholder="Tên chuyên mục mới..." required />
        <button class="uk-btn uk-btn-primary" type="submit">${ICONS.plus} Thêm</button>
      </form>
      <div style="display:flex;flex-direction:column;gap:8px;max-height:380px;overflow-y:auto;">
        ${cats.map(c => `
          <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;border-radius:12px;background:rgba(255,255,255,0.04);border:1px solid var(--border);">
            <span style="font-weight:600;font-size:13.5px;">${escapeHtml(c.name)}</span>
            <button class="uk-btn" data-del-cat="${c.id}" style="padding:5px 10px;color:#f87171;">${ICONS.trash} Xóa</button>
          </div>
        `).join('')}
      </div>
    `;
    body.querySelector('#uk-adm-cat-form').onsubmit = async (e) => {
      e.preventDefault();
      const name = body.querySelector('#uk-adm-cat-name').value.trim();
      if (!name) return;
      try { await engine.createCategoryAdmin(name); renderCatsTab(); } catch (err) { showToast(err.message, 'error'); }
    };
    body.querySelectorAll('[data-del-cat]').forEach(b => b.onclick = async () => {
      if (!confirm('Xóa chuyên mục này?')) return;
      try { await engine.deleteCategoryAdmin(Number(b.dataset.delCat)); renderCatsTab(); } catch (err) { showToast(err.message, 'error'); }
    });
  };

  const renderUsersTab = async () => {
    body.innerHTML = `<div style="padding:20px;text-align:center;color:var(--text-muted);">Đang tải danh sách thành viên...</div>`;
    try {
      const users = await engine.fetchAllUsersAdmin();
      body.innerHTML = `
        <div style="font-size:12.5px;color:var(--text-muted);margin-bottom:10px;">Tổng thành viên: <strong>${users.length}</strong></div>
        <div style="display:flex;flex-direction:column;gap:8px;max-height:420px;overflow-y:auto;">
          ${users.map(usr => `
            <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;padding:10px 12px;border-radius:12px;background:rgba(255,255,255,0.04);border:1px solid var(--border);">
              <div style="display:flex;align-items:center;gap:10px;min-width:160px;">
                ${renderAvatar(usr, 34)}
                <div>
                  <div style="font-weight:700;font-size:13px;color:${escapeHtml(usr.customTitleColor || '#fff')};">${escapeHtml(usr.username || 'User')}</div>
                  <div style="font-size:11px;color:var(--text-muted);">${usr.exp || 0} EXP • ${escapeHtml(usr.role || 'user')}</div>
                </div>
              </div>
              <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;">
                <select class="uk-input" data-u-role="${usr.id}" style="width:auto;padding:5px 8px;font-size:12px;">
                  <option value="user" ${usr.role !== 'admin' ? 'selected' : ''}>User</option>
                  <option value="admin" ${usr.role === 'admin' ? 'selected' : ''}>Admin</option>
                </select>
                <input class="uk-input" data-u-title="${usr.id}" value="${escapeHtml(usr.customTitle || '')}" placeholder="Danh hiệu..." style="width:120px;padding:5px 8px;font-size:12px;" />
                <button class="uk-btn uk-btn-primary" data-u-save="${usr.id}" style="padding:5px 10px;font-size:12px;">Lưu</button>
              </div>
            </div>
          `).join('')}
        </div>
      `;
      body.querySelectorAll('[data-u-save]').forEach(btn => btn.onclick = async () => {
        const uid = btn.dataset.uSave;
        const role = body.querySelector(`[data-u-role="${uid}"]`).value;
        const customTitle = body.querySelector(`[data-u-title="${uid}"]`).value.trim();
        try {
          await engine.updateUserAdmin(uid, { role, customTitle: customTitle || null });
          renderUsersTab();
        } catch (err) { showToast(err.message, 'error'); }
      });
    } catch (err) {
      body.innerHTML = `<div style="color:#f87171;">${escapeHtml(err.message)}</div>`;
    }
  };

  const renderSupportTab = () => {
    const s = engine.state.cmsConfig.support;
    body.innerHTML = `
      <form id="uk-adm-sup-form" style="display:flex;flex-direction:column;gap:12px;">
        <label style="font-size:12px;color:var(--text-muted);">Tiêu đề trang ủng hộ<input class="uk-input" name="title" value="${escapeHtml(s.title)}" /></label>
        <label style="font-size:12px;color:var(--text-muted);">Mô tả<textarea class="uk-input" name="description" rows="3">${escapeHtml(s.description)}</textarea></label>
        <label style="font-size:12px;color:var(--text-muted);">Tên ngân hàng<input class="uk-input" name="bankName" value="${escapeHtml(s.bankName)}" /></label>
        <label style="font-size:12px;color:var(--text-muted);">Số tài khoản<input class="uk-input" name="accountNumber" value="${escapeHtml(s.accountNumber)}" /></label>
        <label style="font-size:12px;color:var(--text-muted);">Chủ tài khoản<input class="uk-input" name="accountHolder" value="${escapeHtml(s.accountHolder)}" /></label>
        <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding:10px;border-radius:12px;background:rgba(255,255,255,0.04);border:1px solid var(--border);">
          <div style="flex:1;min-width:180px;">
            <div style="font-size:12px;color:var(--text-muted);margin-bottom:6px;">Ảnh mã QR Ủng hộ</div>
            <input class="uk-input" name="qrImageUrl" id="uk-qr-url" value="${escapeHtml(s.qrImageUrl || '')}" placeholder="Dán link hoặc tải ảnh QR..." />
          </div>
          <label class="uk-btn" style="cursor:pointer;">
            Tải ảnh QR
            <input type="file" accept="image/*" id="uk-qr-file" style="display:none;" />
          </label>
        </div>
        <button class="uk-btn uk-btn-primary" type="submit">Lưu Trang Ủng hộ</button>
      </form>
    `;
    body.querySelector('#uk-qr-file').onchange = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        showToast('Đang tải ảnh QR lên R2...');
        const url = await engine.uploadQrImage(file);
        body.querySelector('#uk-qr-url').value = url;
        showToast('Đã tải ảnh QR thành công! Bấm Lưu để áp dụng.');
      } catch (err) { showToast(err.message, 'error'); }
    };
    body.querySelector('#uk-adm-sup-form').onsubmit = async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const next = { ...engine.state.cmsConfig, support: Object.fromEntries(fd.entries()) };
      await engine.saveRemoteCmsConfig(next);
      showToast('Đã lưu nội dung & QR Trang Ủng hộ!');
    };
  };

  const renderWelcomeTab = () => {
    const w = engine.state.cmsConfig.welcome;
    body.innerHTML = `
      <form id="uk-adm-wel-form" style="display:flex;flex-direction:column;gap:12px;">
        <label style="display:flex;align-items:center;gap:8px;font-size:13px;"><input type="checkbox" name="enabled" ${w.enabled ? 'checked' : ''} /> Hiển thị thông báo khi vào trang</label>
        <label style="font-size:12px;color:var(--text-muted);">Nhãn nhỏ (Badge)<input class="uk-input" name="badge" value="${escapeHtml(w.badge)}" /></label>
        <label style="font-size:12px;color:var(--text-muted);">Tiêu đề chính<input class="uk-input" name="title" value="${escapeHtml(w.title)}" /></label>
        <label style="font-size:12px;color:var(--text-muted);">Nội dung thông báo<textarea class="uk-input" name="description" rows="3">${escapeHtml(w.description)}</textarea></label>
        <label style="font-size:12px;color:var(--text-muted);">Link Facebook<input class="uk-input" name="fbUrl" value="${escapeHtml(w.fbUrl)}" /></label>
        <label style="font-size:12px;color:var(--text-muted);">Link TikTok<input class="uk-input" name="tiktokUrl" value="${escapeHtml(w.tiktokUrl)}" /></label>
        <label style="font-size:12px;color:var(--text-muted);">Link App AUDITION AI<input class="uk-input" name="appUrl" value="${escapeHtml(w.appUrl)}" /></label>
        <div style="display:flex;gap:8px;">
          <button class="uk-btn uk-btn-primary" type="submit" style="flex:1;">Lưu Thông báo</button>
          <button class="uk-btn" type="button" id="uk-wel-preview">Xem thử</button>
        </div>
      </form>
    `;
    body.querySelector('#uk-adm-wel-form').onsubmit = async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const next = { ...engine.state.cmsConfig, welcome: { ...Object.fromEntries(fd.entries()), enabled: e.target.enabled.checked } };
      await engine.saveRemoteCmsConfig(next);
      showToast('Đã lưu Thông báo chào mừng!');
    };
    body.querySelector('#uk-wel-preview').onclick = () => openWelcomeModal(engine, true);
  };

  const renderSeoTab = () => {
    const seo = engine.state.cmsConfig.seo || {};
    body.innerHTML = `
      <form id="uk-adm-seo-form" style="display:flex;flex-direction:column;gap:12px;">
        <label style="font-size:12px;color:var(--text-muted);">Tiêu đề SEO Trang chủ (Title)<input class="uk-input" name="siteTitle" value="${escapeHtml(seo.siteTitle || '')}" /></label>
        <label style="font-size:12px;color:var(--text-muted);">Mô tả SEO (Meta Description)<textarea class="uk-input" name="siteDescription" rows="3">${escapeHtml(seo.siteDescription || '')}</textarea></label>
        <label style="font-size:12px;color:var(--text-muted);">Từ khóa SEO (Meta Keywords)<input class="uk-input" name="keywords" value="${escapeHtml(seo.keywords || '')}" /></label>
        <label style="font-size:12px;color:var(--text-muted);">Canonical Base URL<input class="uk-input" name="canonicalBase" value="${escapeHtml(seo.canonicalBase || '')}" /></label>
        <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding:10px;border-radius:12px;background:rgba(255,255,255,0.04);border:1px solid var(--border);">
          <div style="flex:1;min-width:180px;">
            <div style="font-size:12px;color:var(--text-muted);margin-bottom:6px;">Ảnh đại diện SEO (OG Image)</div>
            <input class="uk-input" name="ogImage" id="uk-seo-og-url" value="${escapeHtml(seo.ogImage || '')}" />
          </div>
          <label class="uk-btn" style="cursor:pointer;">
            Tải ảnh OG
            <input type="file" accept="image/*" id="uk-seo-og-file" style="display:none;" />
          </label>
        </div>
        <button class="uk-btn uk-btn-primary" type="submit">Lưu Cấu hình SEO</button>
      </form>
    `;
    body.querySelector('#uk-seo-og-file').onchange = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        showToast('Đang tải ảnh SEO lên R2...');
        const url = await engine.uploadQrImage(file);
        body.querySelector('#uk-seo-og-url').value = url;
        showToast('Đã tải ảnh SEO! Bấm Lưu Cấu hình SEO để áp dụng.');
      } catch (err) { showToast(err.message, 'error'); }
    };
    body.querySelector('#uk-adm-seo-form').onsubmit = async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const next = { ...engine.state.cmsConfig, seo: Object.fromEntries(fd.entries()) };
      await engine.saveRemoteCmsConfig(next);
      engine.updateSeoMeta(engine.state.activePost || null);
      showToast('Đã lưu và áp dụng cấu hình SEO!');
    };
  };

  if (tabName === 'r2') renderR2Tab();
  else if (tabName === 'cats') renderCatsTab();
  else if (tabName === 'users') renderUsersTab();
  else if (tabName === 'support') renderSupportTab();
  else if (tabName === 'welcome') renderWelcomeTab();
  else if (tabName === 'seo') renderSeoTab();
}

export function openAdminSettingsModal(engine) {
  engine.setPage('profile');
}

// Auto-inject kit styles immediately on module load so header/card buttons are styled from frame 1
if (typeof document !== 'undefined') {
  ensureKitStyles();
}
