/**
 * Shared Theme-Aware UI Kit for Preview 1..10
 * Renders full-featured Detail Modal (Mechanism 1), Article View (Mechanism 2),
 * Auth Modals, Add Post Modal, Guide Modal, Support Page, and Profile Page
 * using the active theme's CSS variables & hooks.
 */
import { escapeHtml, getObjectPosition, getRankInfo, copyText, showToast, getDisplayViews, saveCmsConfig, saveBrokenIds, INITIAL_RANKS } from './core.js';

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
  const tags = Array.isArray(image?.hashtags) ? image.hashtags.filter(Boolean).slice(0, 5) : [];
  if (!tags.length) return '';
  return `
    <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;">
      ${tags.map(t => {
        const clean = String(t).replace(/^#/, '').trim();
        return `<button type="button" class="uk-chip" data-tag-search="${escapeHtml(clean)}" style="padding:4px 10px;font-size:11.5px;background:rgba(56,189,248,0.1);border-color:rgba(56,189,248,0.3);color:#7dd3fc;">#${escapeHtml(clean)}</button>`;
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

      <div class="uk-modal-media" style="flex:1.3;background:radial-gradient(circle at center, #111827 0%, #05070c 100%);display:flex;align-items:center;justify-content:center;min-height:280px;max-height:46vh;overflow:hidden;position:relative;padding:14px;border-right:1px solid rgba(255,255,255,0.08);">
        <div style="position:absolute;top:14px;left:14px;display:flex;align-items:center;gap:8px;z-index:2;">
          <span style="padding:4px 10px;border-radius:999px;font-size:11.5px;font-weight:600;background:rgba(5,7,14,0.78);border:1px solid rgba(255,255,255,0.16);color:#7dd3fc;backdrop-filter:blur(8px);display:inline-flex;align-items:center;gap:5px;">${ICONS.eye.replace('<svg', '<svg style="width:13px;height:13px;"')} ${getDisplayViews(image)}</span>
        </div>
        <img src="${escapeHtml(image.image_url)}" alt="${escapeHtml(image.title)}" style="width:100%;height:100%;object-fit:contain;border-radius:12px;filter:drop-shadow(0 16px 36px rgba(0,0,0,0.65));" />
      </div>

      <div style="flex:1;padding:24px 26px;display:flex;flex-direction:column;gap:16px;overflow-y:auto;">
        <div style="padding-right:34px;">
          <h2 style="margin:0;font-size:23px;line-height:1.25;font-weight:700;font-family:var(--font-display, inherit);color:#fff;">${escapeHtml(image.title)}</h2>
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

        <div style="display:flex;flex-direction:column;flex:1;min-height:140px;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
            <span style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--accent);">Câu lệnh (Prompt)</span>
            <span style="font-size:11px;color:var(--text-muted);">${(image.prompt || '').length} ký tự</span>
          </div>
          <div class="uk-prompt-box" id="uk-prompt-text" style="flex:1;max-height:220px;background:rgba(5,7,14,0.75);border:1px solid rgba(56,189,248,0.22);border-radius:14px;padding:14px 16px;font-size:13.5px;line-height:1.68;color:#e2e8f0;">${escapeHtml(image.prompt)}</div>
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

        <div style="display:flex;align-items:center;justify-content:space-between;padding-top:10px;border-top:1px solid rgba(255,255,255,0.08);font-size:12px;color:var(--text-muted);">
          <span>Đăng lúc: ${new Date(image.created_at).toLocaleString('vi-VN')}</span>
          ${canDelete ? `<button class="uk-btn" id="uk-delete-post" style="padding:5px 10px;color:#f87171;border-color:rgba(248,113,113,0.3);">${ICONS.trash} Xóa</button>` : ''}
        </div>
      </div>
    </div>
  `;

  if (window.innerWidth >= 768) {
    modal.querySelector('.pc-modal-card').style.height = 'min(680px, 90vh)';
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
          <div style="margin:0 auto 12px;display:flex;justify-content:center;">
            ${renderAvatar(u, 76)}
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

export function openAdminSettingsModal(engine) {
  if (engine.state.currentUser?.role !== 'admin') {
    showToast('Chỉ Quản trị viên mới có quyền truy cập.', 'error');
    return;
  }
  ensureKitStyles();
  document.getElementById('uk-admin-modal')?.remove();
  const m = document.createElement('div');
  m.id = 'uk-admin-modal';
  m.className = 'pc-modal-backdrop';
  m.style.zIndex = '1120';
  m.innerHTML = `
    <div class="pc-modal-card uk-modal-shell" style="max-width:760px;height:min(680px,90vh);padding:22px;display:flex;flex-direction:column;gap:14px;">
      <button class="uk-close-btn" id="uk-adm-close">${ICONS.close}</button>
      <div style="display:flex;align-items:center;gap:10px;">
        <span style="color:var(--accent);">${ICONS.gear}</span>
        <h3 style="margin:0;font-size:19px;font-family:var(--font-display,inherit);">Quản trị Hệ thống & Giao diện</h3>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;border-bottom:1px solid var(--border);padding-bottom:10px;">
        <button class="uk-btn uk-btn-primary" data-tab="r2">Ảnh lỗi R2 / Private</button>
        <button class="uk-btn" data-tab="support">Sửa Trang Ủng hộ</button>
        <button class="uk-btn" data-tab="welcome">Sửa Thông báo</button>
        <button class="uk-btn" data-tab="seo">Sửa SEO</button>
      </div>
      <div id="uk-adm-body" style="flex:1;overflow-y:auto;padding-right:4px;"></div>
    </div>
  `;
  document.body.appendChild(m);
  m.onclick = (e) => { if (e.target === m) m.remove(); };
  m.querySelector('#uk-adm-close').onclick = () => m.remove();

  const body = m.querySelector('#uk-adm-body');
  const tabs = m.querySelectorAll('[data-tab]');

  const renderR2Tab = () => {
    const privateSet = new Set([...(engine.state.cmsConfig.privateIds || []), ...engine.state.brokenIds]);
    const list = engine.state.allImagesMeta.filter(i => privateSet.has(Number(i.id)));
    body.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:14px;">
        <div style="font-size:13px;color:var(--text-muted);">Đang ẩn (Private / Lỗi R2): <strong>${list.length}</strong> ảnh</div>
        <button class="uk-btn uk-btn-primary" id="uk-scan-r2">Quét toàn bộ ảnh lỗi R2</button>
      </div>
      <div id="uk-scan-status" style="font-size:12.5px;color:var(--accent);margin-bottom:10px;"></div>
      <div style="display:flex;flex-direction:column;gap:10px;">
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

  tabs.forEach(t => t.onclick = () => {
    tabs.forEach(x => x.classList.remove('uk-btn-primary'));
    t.classList.add('uk-btn-primary');
    if (t.dataset.tab === 'r2') renderR2Tab();
    else if (t.dataset.tab === 'support') renderSupportTab();
    else if (t.dataset.tab === 'welcome') renderWelcomeTab();
    else renderSeoTab();
  });
  renderR2Tab();
}

// Auto-inject kit styles immediately on module load so header/card buttons are styled from frame 1
if (typeof document !== 'undefined') {
  ensureKitStyles();
}
