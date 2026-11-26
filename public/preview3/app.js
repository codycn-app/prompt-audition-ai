import { PromptAppEngine, escapeHtml, getObjectPosition, copyText } from '/preview-core/core.js';
import { ICONS, renderDetailModal, closeDetailModal, renderArticleView, renderSupportView, renderProfileView, openAuthModal, openAddModal } from '/preview-core/ui-kit.js';

let activeIdx = 0;

function renderCoverflow(engine) {
  const track = document.getElementById('cin-track');
  const info = document.getElementById('cin-info');
  const strip = document.getElementById('cin-strip');
  if (!track || !info || !strip) return;

  const list = engine.state.loadedImages;
  if (!list.length) {
    track.innerHTML = `<div style="color:var(--text-muted);">Không có kết quả phù hợp.</div>`;
    info.innerHTML = ''; strip.innerHTML = '';
    return;
  }
  if (activeIdx >= list.length) activeIdx = 0;

  track.innerHTML = list.map((img, i) => {
    const offset = i - activeIdx;
    if (Math.abs(offset) > 4) return '';
    const tx = offset * 185;
    const tz = -Math.abs(offset) * 140;
    const ry = offset * -24;
    const op = Math.max(0.2, 1 - Math.abs(offset) * 0.24);
    const z = 20 - Math.abs(offset);
    return `
      <div class="cin-slide" data-idx="${i}" style="transform:translateX(${tx}px) translateZ(${tz}px) rotateY(${ry}deg);opacity:${op};z-index:${z};${offset !== 0 ? 'filter:brightness(0.65);' : ''}">
        <img src="${escapeHtml(img.thumbnail_url || img.image_url)}" alt="${escapeHtml(img.title)}" style="object-position:${getObjectPosition(img)}" />
      </div>`;
  }).join('');

  const cur = list[activeIdx];
  info.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;">
      <div>
        <div style="font-size:11px;color:var(--accent-2);">#${cur.id} • ${activeIdx + 1}/${list.length}</div>
        <strong style="font-family:var(--font-display);font-size:18px;">${escapeHtml(cur.title)}</strong>
      </div>
      <div style="display:flex;gap:6px;">
        <button class="uk-btn" id="cin-prev" style="padding:7px 12px;">◀</button>
        <button class="uk-btn" id="cin-next" style="padding:7px 12px;">▶</button>
      </div>
    </div>
    <div style="font-size:13px;color:var(--text-muted);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${escapeHtml(cur.prompt)}</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;">
      <button class="uk-btn uk-btn-primary" id="cin-copy">${ICONS.copy} Sao chép Prompt</button>
      <button class="uk-btn" id="cin-modal">${ICONS.eye} Xem chi tiết</button>
      <button class="uk-btn" id="cin-art">${ICONS.article} Mở bài viết</button>
    </div>
  `;

  strip.innerHTML = list.map((img, i) => `
    <div class="cin-thumb ${i === activeIdx ? 'active' : ''}" data-sidx="${i}">
      <img src="${escapeHtml(img.thumbnail_url || img.image_url)}" alt="" />
    </div>
  `).join('') + (engine.state.hasMore ? `<button class="uk-btn" id="cin-more" style="flex-shrink:0;">+ Tải thêm</button>` : '');

  track.querySelectorAll('.cin-slide').forEach(s => s.onclick = () => {
    const idx = Number(s.dataset.idx);
    if (idx === activeIdx) engine.openModal(list[idx], s);
    else { activeIdx = idx; renderCoverflow(engine); }
  });
  strip.querySelectorAll('.cin-thumb').forEach(t => t.onclick = () => { activeIdx = Number(t.dataset.sidx); renderCoverflow(engine); });
  if (engine.state.hasMore) strip.querySelector('#cin-more').onclick = () => engine.loadMore();

  info.querySelector('#cin-prev').onclick = () => { activeIdx = Math.max(0, activeIdx - 1); renderCoverflow(engine); };
  info.querySelector('#cin-next').onclick = () => { activeIdx = Math.min(list.length - 1, activeIdx + 1); renderCoverflow(engine); };
  info.querySelector('#cin-copy').onclick = () => copyText(cur.prompt);
  info.querySelector('#cin-modal').onclick = () => engine.openModal(cur);
  info.querySelector('#cin-art').onclick = () => engine.openArticle(cur);
}

const adapter = {
  mountShell(engine) {
    document.getElementById('app').innerHTML = `
      <div class="cin-shell">
        <header class="cin-top">
          <div class="cin-brand" id="cin-logo">CINEMA.AUDITION</div>
          <div style="flex:1;max-width:360px;position:relative;display:flex;align-items:center;">
            <span style="position:absolute;left:12px;width:15px;height:15px;color:var(--text-muted);">${ICONS.search}</span>
            <input class="uk-input" id="cin-search" type="search" placeholder="Tìm cảnh, câu lệnh..." style="padding-left:36px;border-radius:999px;" />
          </div>
          <div style="display:flex;gap:8px;align-items:center;">
            <button class="uk-btn cin-hide-mob" id="cin-sup">${ICONS.heart} Ủng hộ</button>
            <button class="uk-btn uk-btn-primary cin-hide-mob" id="cin-add">${ICONS.plus} Thêm</button>
            <div id="cin-auth"></div>
          </div>
        </header>
        <main id="cin-main" style="flex:1;display:flex;flex-direction:column;">
          <div class="cin-cats" id="cin-cats"></div>
          <div class="cin-stage">
            <div class="cin-track" id="cin-track"></div>
            <div class="cin-focus-info" id="cin-info"></div>
          </div>
          <div class="cin-filmstrip" id="cin-strip"></div>
        </main>
        <nav class="pc-mobile-dock" style="background:rgba(8,8,10,0.92);backdrop-filter:blur(16px);border-top:1px solid var(--border);">
          <button class="uk-btn" style="background:none;border:none;flex-direction:column;gap:2px;font-size:10px;" data-nav="home">${ICONS.home}<span>Rạp phim</span></button>
          <button class="uk-btn uk-btn-primary" style="width:44px;height:44px;border-radius:999px;margin:0 auto;padding:0;" id="cin-mob-add">${ICONS.plus}</button>
          <button class="uk-btn" style="background:none;border:none;flex-direction:column;gap:2px;font-size:10px;" data-nav="support">${ICONS.heart}<span>Ủng hộ</span></button>
          <button class="uk-btn" style="background:none;border:none;flex-direction:column;gap:2px;font-size:10px;" data-nav="profile">${ICONS.user}<span>Cá nhân</span></button>
        </nav>
      </div>
    `;
    document.getElementById('cin-logo').onclick = () => engine.setCategory('all');
    document.getElementById('cin-sup').onclick = () => engine.setPage('support');
    document.getElementById('cin-add').onclick = () => openAddModal(engine);
    document.getElementById('cin-mob-add').onclick = () => openAddModal(engine);
    let tm;
    document.getElementById('cin-search').addEventListener('input', (e) => { clearTimeout(tm); tm = setTimeout(() => { activeIdx = 0; engine.setSearch(e.target.value); }, 180); });
    window.addEventListener('keydown', (e) => {
      if (engine.state.currentPage !== 'home') return;
      if (e.key === 'ArrowRight') { activeIdx = Math.min(engine.state.loadedImages.length - 1, activeIdx + 1); renderCoverflow(engine); }
      if (e.key === 'ArrowLeft') { activeIdx = Math.max(0, activeIdx - 1); renderCoverflow(engine); }
    });
    document.querySelectorAll('[data-nav]').forEach(b => b.onclick = () => {
      if (b.dataset.nav === 'profile' && !engine.state.currentUser) openAuthModal(engine, 'login');
      else engine.setPage(b.dataset.nav);
    });
  },
  renderAuth(engine) {
    const s = document.getElementById('cin-auth'); const u = engine.state.currentUser;
    s.innerHTML = u ? `<button class="uk-btn" id="cin-u">${ICONS.user} ${escapeHtml(u.username)}</button>` : `<button class="uk-btn cin-hide-mob" id="cin-l">Đăng nhập</button>`;
    if (u) s.querySelector('#cin-u').onclick = () => engine.setPage('profile');
    else s.querySelector('#cin-l').onclick = () => openAuthModal(engine, 'login');
  },
  renderLoading(engine, l) {
    if (l) document.getElementById('cin-track').innerHTML = `<div style="color:var(--text-muted);">Đang dựng rạp chiếu 3D...</div>`;
  },
  renderCategories(engine) {
    const w = document.getElementById('cin-cats'); if (!w) return;
    const { categories, selectedCategory } = engine.state;
    w.innerHTML = [`<button class="cin-cat ${selectedCategory === 'all' ? 'active' : ''}" data-cat="all">Tất cả</button>`,
      ...categories.map(c => `<button class="cin-cat ${selectedCategory === c.id ? 'active' : ''}" data-cat="${c.id}">${escapeHtml(c.name)}</button>`)].join('');
    w.querySelectorAll('[data-cat]').forEach(b => b.onclick = () => { activeIdx = 0; engine.setCategory(b.dataset.cat === 'all' ? 'all' : Number(b.dataset.cat)); });
  },
  renderGallery(engine) { renderCoverflow(engine); },
  renderPage(engine) {
    const main = document.getElementById('cin-main');
    if (engine.state.currentPage === 'article' && engine.state.activePost) renderArticleView(main, engine, engine.state.activePost);
    else if (engine.state.currentPage === 'support') renderSupportView(main, engine);
    else if (engine.state.currentPage === 'profile') renderProfileView(main, engine);
    else {
      main.innerHTML = `<div class="cin-cats" id="cin-cats"></div><div class="cin-stage"><div class="cin-track" id="cin-track"></div><div class="cin-focus-info" id="cin-info"></div></div><div class="cin-filmstrip" id="cin-strip"></div>`;
      this.renderCategories(engine); renderCoverflow(engine);
    }
  },
  openDetailModal(engine, image) { renderDetailModal(engine, image); },
  closeDetailModal() { closeDetailModal(); }
};
new PromptAppEngine(adapter).init();
