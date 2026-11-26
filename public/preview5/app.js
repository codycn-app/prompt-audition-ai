import { PromptAppEngine, escapeHtml, getObjectPosition, copyText } from '/preview-core/core.js';
import { ICONS, renderDetailModal, closeDetailModal, renderArticleView, renderSupportView, renderProfileView, openAuthModal, openAddModal } from '/preview-core/ui-kit.js';

const BENTO_PATTERN = ['hero', 'tall', '', 'wide', '', 'tall', '', ''];

const adapter = {
  mountShell(engine) {
    document.getElementById('app').innerHTML = `
      <header class="mag-masthead">
        <div class="mag-logo" id="mag-logo">AUDITION.MAGAZINE</div>
        <div style="flex:1;max-width:360px;position:relative;display:flex;align-items:center;">
          <span style="position:absolute;left:12px;width:15px;height:15px;">${ICONS.search}</span>
          <input class="uk-input" id="mag-search" type="search" placeholder="Tìm bài viết & prompt..." style="padding-left:36px;background:#fff;color:#18181b;border:2px solid #18181b;" />
        </div>
        <div style="display:flex;gap:8px;align-items:center;">
          <button class="uk-btn mag-hide-mob" id="mag-sup" style="background:#fff;color:#18181b;border:2px solid #18181b;">${ICONS.heart} Ủng hộ</button>
          <button class="uk-btn uk-btn-primary mag-hide-mob" id="mag-add" style="border:2px solid #18181b;box-shadow:3px 3px 0 #18181b;">${ICONS.plus} Đăng bài</button>
          <div id="mag-auth"></div>
        </div>
      </header>
      <main id="mag-main">
        <section class="mag-feature" id="mag-feature"></section>
        <div class="mag-cats" id="mag-cats"></div>
        <div class="mag-bento" id="mag-grid"></div>
        <div id="mag-more" style="text-align:center;margin-top:20px;padding-bottom:84px;"></div>
      </main>
      <nav class="pc-mobile-dock" style="background:#faf7f2;border-top:2px solid #18181b;">
        <button class="uk-btn" style="background:none;border:none;color:#18181b;flex-direction:column;gap:2px;font-size:10px;" data-nav="home">${ICONS.home}<span>Tạp chí</span></button>
        <button class="uk-btn uk-btn-primary" style="width:44px;height:44px;border-radius:10px;margin:0 auto;padding:0;border:2px solid #18181b;" id="mag-mob-add">${ICONS.plus}</button>
        <button class="uk-btn" style="background:none;border:none;color:#18181b;flex-direction:column;gap:2px;font-size:10px;" data-nav="support">${ICONS.heart}<span>Ủng hộ</span></button>
        <button class="uk-btn" style="background:none;border:none;color:#18181b;flex-direction:column;gap:2px;font-size:10px;" data-nav="profile">${ICONS.user}<span>Cá nhân</span></button>
      </nav>
    `;
    document.getElementById('mag-logo').onclick = () => engine.setCategory('all');
    document.getElementById('mag-sup').onclick = () => engine.setPage('support');
    document.getElementById('mag-add').onclick = () => openAddModal(engine);
    document.getElementById('mag-mob-add').onclick = () => openAddModal(engine);
    let t;
    document.getElementById('mag-search').addEventListener('input', (e) => { clearTimeout(t); t = setTimeout(() => engine.setSearch(e.target.value), 180); });
    document.querySelectorAll('[data-nav]').forEach(b => b.onclick = () => {
      if (b.dataset.nav === 'profile' && !engine.state.currentUser) openAuthModal(engine, 'login');
      else engine.setPage(b.dataset.nav);
    });
  },
  renderAuth(engine) {
    const s = document.getElementById('mag-auth'); const u = engine.state.currentUser;
    s.innerHTML = u ? `<button class="uk-btn" id="mag-u" style="background:#fff;color:#18181b;border:2px solid #18181b;">${ICONS.user} ${escapeHtml(u.username)}</button>` : `<button class="uk-btn mag-hide-mob" id="mag-l" style="background:#fff;color:#18181b;border:2px solid #18181b;">Đăng nhập</button>`;
    if (u) s.querySelector('#mag-u').onclick = () => engine.setPage('profile');
    else s.querySelector('#mag-l').onclick = () => openAuthModal(engine, 'login');
  },
  renderLoading(engine, l) {
    if (l) document.getElementById('mag-grid').innerHTML = Array.from({ length: 8 }, () => `<div class="mag-cell" style="opacity:0.4;"></div>`).join('');
  },
  renderCategories(engine) {
    const w = document.getElementById('mag-cats'); if (!w) return;
    const { categories, selectedCategory } = engine.state;
    w.innerHTML = [`<button class="mag-pill ${selectedCategory === 'all' ? 'active' : ''}" data-cat="all">Tất cả</button>`,
      ...categories.map(c => `<button class="mag-pill ${selectedCategory === c.id ? 'active' : ''}" data-cat="${c.id}">${escapeHtml(c.name)}</button>`)].join('');
    w.querySelectorAll('[data-cat]').forEach(b => b.onclick = () => engine.setCategory(b.dataset.cat === 'all' ? 'all' : Number(b.dataset.cat)));
  },
  renderGallery(engine) {
    const feat = document.getElementById('mag-feature');
    const all = engine.state.allImagesMeta;
    if (feat && all.length >= 5) {
      const top = [...all].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5);
      const lead = top[0];
      feat.innerHTML = `
        <div class="mag-hero-card" data-fid="${lead.id}">
          <img src="${escapeHtml(lead.image_url)}" alt="${escapeHtml(lead.title)}" />
          <div style="position:absolute;inset:auto 0 0 0;padding:30px 18px 16px;background:linear-gradient(to top,rgba(0,0,0,0.9),transparent);color:#fff;">
            <span style="background:var(--accent);padding:3px 9px;border-radius:4px;font-size:11px;font-weight:700;">NỔI BẬT #${lead.id}</span>
            <h2 style="margin:6px 0 0;font-family:var(--font-display);font-size:22px;">${escapeHtml(lead.title)}</h2>
          </div>
        </div>
        <div class="mag-top-list">
          <div style="font-family:var(--font-display);font-weight:800;font-size:15px;">TOP XEM NHIỀU</div>
          ${top.slice(1).map((item, idx) => `
            <div class="mag-list-row" data-fid="${item.id}">
              <span style="font-weight:800;color:var(--accent);width:18px;">0${idx + 2}</span>
              <img src="${escapeHtml(item.thumbnail_url || item.image_url)}" alt="" />
              <div style="min-width:0;flex:1;">
                <div style="font-size:13px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(item.title)}</div>
                <div style="font-size:11px;color:var(--text-muted);">${item.views || 0} lượt xem</div>
              </div>
            </div>
          `).join('')}
        </div>
        <div class="mag-top-list" style="background:#18181b;color:#fff;">
          <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#ff4d6d;font-weight:700;">Prompt của ngày</div>
          <div style="font-size:13px;line-height:1.55;color:#e4e4e7;flex:1;overflow:hidden;display:-webkit-box;-webkit-line-clamp:5;-webkit-box-orient:vertical;">${escapeHtml(lead.prompt)}</div>
          <button class="uk-btn uk-btn-primary" id="mag-feat-copy">${ICONS.copy} Sao chép Prompt này</button>
        </div>
      `;
      feat.querySelectorAll('[data-fid]').forEach(el => el.onclick = () => {
        const it = top.find(i => i.id === Number(el.dataset.fid));
        if (it) engine.openArticle(it);
      });
      feat.querySelector('#mag-feat-copy').onclick = () => copyText(lead.prompt);
    }

    const g = document.getElementById('mag-grid'); const m = document.getElementById('mag-more');
    if (!g) return;
    const { loadedImages, hasMore, filteredImages } = engine.state;
    g.innerHTML = loadedImages.map((img, i) => `
      <div class="mag-cell ${BENTO_PATTERN[i % BENTO_PATTERN.length]}" data-id="${img.id}">
        <img src="${escapeHtml(img.thumbnail_url || img.image_url)}" alt="${escapeHtml(img.title)}" style="object-position:${getObjectPosition(img)}" loading="lazy" />
        <div style="position:absolute;inset:auto 0 0 0;padding:24px 10px 8px;background:linear-gradient(to top,rgba(0,0,0,0.88),transparent);color:#fff;display:flex;justify-content:space-between;align-items:center;gap:6px;">
          <span style="font-size:12px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(img.title)}</span>
          <button class="uk-btn" data-copy="${img.id}" style="padding:4px 7px;background:#fff;color:#18181b;">${ICONS.copy}</button>
        </div>
      </div>`).join('');
    g.querySelectorAll('.mag-cell').forEach(c => c.onclick = (e) => {
      if (e.target.closest('[data-copy]')) return;
      const item = loadedImages.find(i => i.id === Number(c.dataset.id));
      if (item) engine.openModal(item, c);
    });
    g.querySelectorAll('[data-copy]').forEach(b => b.onclick = (e) => {
      e.stopPropagation();
      const item = loadedImages.find(i => i.id === Number(b.dataset.copy));
      if (item) copyText(item.prompt);
    });
    m.innerHTML = hasMore ? `<button class="uk-btn uk-btn-primary" id="mag-more-btn" style="border:2px solid #18181b;box-shadow:4px 4px 0 #18181b;">Xem thêm (${filteredImages.length - loadedImages.length})</button>` : '';
    if (hasMore) m.querySelector('#mag-more-btn').onclick = () => engine.loadMore();
  },
  renderPage(engine) {
    const main = document.getElementById('mag-main');
    if (engine.state.currentPage === 'article' && engine.state.activePost) renderArticleView(main, engine, engine.state.activePost);
    else if (engine.state.currentPage === 'support') renderSupportView(main, engine);
    else if (engine.state.currentPage === 'profile') renderProfileView(main, engine);
    else {
      main.innerHTML = `<section class="mag-feature" id="mag-feature"></section><div class="mag-cats" id="mag-cats"></div><div class="mag-bento" id="mag-grid"></div><div id="mag-more" style="text-align:center;margin-top:20px;padding-bottom:84px;"></div>`;
      this.renderCategories(engine); this.renderGallery(engine);
    }
  },
  openDetailModal(engine, image) { renderDetailModal(engine, image); },
  closeDetailModal() { closeDetailModal(); }
};
new PromptAppEngine(adapter).init();
