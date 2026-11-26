import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';
import { PromptAppEngine, escapeHtml, getObjectPosition, copyText } from '/preview-core/core.js';
import { ICONS, renderDetailModal, closeDetailModal, renderArticleView, renderSupportView, renderProfileView, openAuthModal, openAddModal } from '/preview-core/ui-kit.js';

function initStarfield() {
  const canvas = document.getElementById('os-stars');
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.z = 5;

  const count = window.innerWidth < 768 ? 350 : 900;
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count * 3; i++) pos[i] = (Math.random() - 0.5) * 20;
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0x38bdf8, size: 0.045, transparent: true, opacity: 0.65 }));
  scene.add(pts);

  let mx = 0, my = 0;
  window.addEventListener('pointermove', (e) => { mx = (e.clientX / window.innerWidth - 0.5) * 0.4; my = (e.clientY / window.innerHeight - 0.5) * 0.4; });
  function anim() {
    requestAnimationFrame(anim);
    pts.rotation.y += 0.0006;
    pts.rotation.x += (my - pts.rotation.x) * 0.03;
    pts.rotation.y += (mx - pts.rotation.y) * 0.015;
    renderer.render(scene, camera);
  }
  anim();
}

function openSpotlightSearch(engine) {
  document.getElementById('os-cmd')?.remove();
  const el = document.createElement('div');
  el.id = 'os-cmd';
  el.className = 'os-cmd-overlay';
  el.innerHTML = `
    <div class="os-cmd-box">
      <div style="display:flex;align-items:center;gap:10px;border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:10px;">
        <span style="width:18px;height:18px;color:var(--accent);">${ICONS.search}</span>
        <input id="os-cmd-in" type="search" value="${escapeHtml(engine.state.searchQuery)}" placeholder="Nhập từ khóa tìm prompt (Enter để lọc)..." style="flex:1;background:none;border:none;color:#fff;font-size:15px;outline:none;" autofocus />
        <button class="uk-btn" id="os-cmd-clear" style="padding:4px 10px;font-size:12px;">Xóa lọc</button>
      </div>
      <div style="margin-top:10px;font-size:12px;color:var(--text-muted);">Gợi ý: "Chân dung", "Couple", "3D", "Áo dài"...</div>
    </div>
  `;
  document.body.appendChild(el);
  const inp = el.querySelector('#os-cmd-in');
  inp.focus();
  inp.addEventListener('input', (e) => engine.setSearch(e.target.value));
  inp.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === 'Escape') el.remove(); });
  el.querySelector('#os-cmd-clear').onclick = () => { engine.setSearch(''); el.remove(); };
  el.onclick = (e) => { if (e.target === el) el.remove(); };
}

const adapter = {
  mountShell(engine) {
    initStarfield();
    document.getElementById('app').innerHTML = `
      <div class="os-root">
        <div class="os-menubar">
          <div class="os-menubar-left">
            <span style="display:inline-flex;align-items:center;gap:6px;cursor:pointer;" id="os-logo"><span class="os-status-dot"></span> <strong>AuditionOS</strong></span>
            <span style="color:var(--text-muted);" id="os-count-label">Đang kết nối...</span>
          </div>
          <div class="os-menubar-right">
            <span id="os-clock" style="color:var(--text-muted);"></span>
            <div id="os-auth-top"></div>
          </div>
        </div>

        <div class="os-desktop" id="os-main">
          <section class="os-window" id="os-spotlight-win">
            <div class="os-win-bar">
              <div class="os-dots"><span></span><span></span><span></span></div>
              <div style="font-size:12px;font-weight:700;color:var(--text-muted);">Spotlight Showcase — Top Prompt Nổi Bật</div>
              <button class="uk-btn" id="os-cmd-btn" style="padding:4px 10px;font-size:12px;">${ICONS.search} Tìm (Ctrl+K)</button>
            </div>
            <div class="os-spotlight-body">
              <div class="os-featured-strip" id="os-featured"></div>
              <div>
                <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:var(--accent);">Không gian Sáng tạo AI</div>
                <h1 style="margin:6px 0 10px;font-family:var(--font-display);font-size:26px;">Kho Câu Lệnh Prompt Audition AI</h1>
                <p style="margin:0 0 16px;font-size:13.5px;color:var(--text-muted);line-height:1.6;">Trải nghiệm dạng cửa sổ hệ điều hành: bấm ảnh để mở cửa sổ chi tiết, hoặc mở dạng bài viết để chia sẻ link trực tiếp.</p>
                <div style="display:flex;gap:8px;flex-wrap:wrap;">
                  <button class="uk-btn uk-btn-primary" id="os-add-btn">${ICONS.plus} Đăng Prompt Mới</button>
                  <select class="uk-input" id="os-sort" style="width:auto;padding:8px 12px;font-size:13px;">
                    <option value="newest">Mới nhất</option><option value="views">Xem nhiều nhất</option>
                  </select>
                </div>
              </div>
            </div>
          </section>

          <section class="os-window">
            <div class="os-win-bar">
              <div class="os-dots"><span></span><span></span><span></span></div>
              <div style="font-size:12px;font-weight:700;color:var(--text-muted);">Thư viện Ảnh & Câu lệnh</div>
              <div style="width:48px;"></div>
            </div>
            <div class="os-folder-tabs" id="os-cats"></div>
            <div class="os-grid" id="os-grid"></div>
            <div id="os-more" style="text-align:center;padding:0 18px 22px;"></div>
          </section>
        </div>

        <div class="os-dock-wrap">
          <div class="os-dock">
            <button class="os-dock-item" title="Trang chủ" data-dock="home">${ICONS.home}</button>
            <button class="os-dock-item" title="Tìm kiếm (Ctrl+K)" id="os-dock-search">${ICONS.search}</button>
            <div class="os-dock-sep"></div>
            <button class="os-dock-item primary" title="Thêm Prompt mới" id="os-dock-add">${ICONS.plus}</button>
            <div class="os-dock-sep"></div>
            <button class="os-dock-item" title="Ủng hộ" data-dock="support">${ICONS.heart}</button>
            <button class="os-dock-item" title="Tài khoản" data-dock="profile">${ICONS.user}</button>
          </div>
        </div>
      </div>
    `;

    const updClock = () => { const c = document.getElementById('os-clock'); if (c) c.textContent = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }); };
    updClock(); setInterval(updClock, 30000);

    document.getElementById('os-logo').onclick = () => engine.setCategory('all');
    document.getElementById('os-cmd-btn').onclick = () => openSpotlightSearch(engine);
    document.getElementById('os-dock-search').onclick = () => openSpotlightSearch(engine);
    document.getElementById('os-add-btn').onclick = () => openAddModal(engine);
    document.getElementById('os-dock-add').onclick = () => openAddModal(engine);
    document.getElementById('os-sort').onchange = (e) => engine.setSort(e.target.value);
    window.addEventListener('keydown', (e) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openSpotlightSearch(engine); } });
    document.querySelectorAll('[data-dock]').forEach(b => b.onclick = () => {
      if (b.dataset.dock === 'profile' && !engine.state.currentUser) openAuthModal(engine, 'login');
      else engine.setPage(b.dataset.dock);
    });
  },
  renderAuth(engine) {
    const s = document.getElementById('os-auth-top'); const u = engine.state.currentUser;
    s.innerHTML = u ? `<button class="uk-btn" id="os-u" style="padding:3px 10px;font-size:12px;">${escapeHtml(u.username)}</button>` : `<button class="uk-btn" id="os-l" style="padding:3px 10px;font-size:12px;">Đăng nhập</button>`;
    if (u) s.querySelector('#os-u').onclick = () => engine.setPage('profile');
    else s.querySelector('#os-l').onclick = () => openAuthModal(engine, 'login');
  },
  renderLoading(engine, l) {
    if (!l) return;
    document.getElementById('os-grid').innerHTML = Array.from({ length: 10 }, () => `<div class="os-tile" style="opacity:0.35;"></div>`).join('');
  },
  renderCategories(engine) {
    const w = document.getElementById('os-cats'); if (!w) return;
    const { categories, selectedCategory } = engine.state;
    w.innerHTML = [`<button class="os-ftab ${selectedCategory === 'all' ? 'active' : ''}" data-cat="all">Tất cả</button>`,
      ...categories.map(c => `<button class="os-ftab ${selectedCategory === c.id ? 'active' : ''}" data-cat="${c.id}">${escapeHtml(c.name)}</button>`)].join('');
    w.querySelectorAll('[data-cat]').forEach(b => b.onclick = () => engine.setCategory(b.dataset.cat === 'all' ? 'all' : Number(b.dataset.cat)));
  },
  renderGallery(engine) {
    const lbl = document.getElementById('os-count-label');
    if (lbl) lbl.textContent = `${engine.state.allImagesMeta.length} Prompts`;
    const feat = document.getElementById('os-featured');
    if (feat && engine.state.allImagesMeta.length) {
      const top3 = [...engine.state.allImagesMeta].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 3);
      feat.innerHTML = top3.map(img => `
        <div class="os-feat-card" data-fid="${img.id}">
          <img src="${escapeHtml(img.thumbnail_url || img.image_url)}" alt="${escapeHtml(img.title)}" style="object-position:${getObjectPosition(img)}" />
        </div>`).join('');
      feat.querySelectorAll('.os-feat-card').forEach(c => c.onclick = () => {
        const item = top3.find(i => i.id === Number(c.dataset.fid));
        if (item) engine.openModal(item, c);
      });
    }

    const g = document.getElementById('os-grid'); const m = document.getElementById('os-more');
    if (!g) return;
    const { loadedImages, hasMore, filteredImages } = engine.state;
    g.innerHTML = loadedImages.map(img => `
      <div class="os-tile" data-id="${img.id}">
        <img src="${escapeHtml(img.thumbnail_url || img.image_url)}" alt="${escapeHtml(img.title)}" style="object-position:${getObjectPosition(img)}" loading="lazy" />
        <div style="position:absolute;inset:auto 0 0 0;padding:24px 10px 8px;background:linear-gradient(to top,rgba(7,9,18,0.94),transparent);display:flex;justify-content:space-between;align-items:center;gap:6px;">
          <span style="font-size:12.5px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(img.title)}</span>
          <button class="uk-btn" data-copy="${img.id}" style="padding:5px 8px;">${ICONS.copy}</button>
        </div>
      </div>`).join('');
    g.querySelectorAll('.os-tile').forEach(c => c.onclick = (e) => {
      if (e.target.closest('[data-copy]')) return;
      const item = loadedImages.find(i => i.id === Number(c.dataset.id));
      if (item) engine.openModal(item, c);
    });
    g.querySelectorAll('[data-copy]').forEach(b => b.onclick = (e) => {
      e.stopPropagation();
      const item = loadedImages.find(i => i.id === Number(b.dataset.copy));
      if (item) copyText(item.prompt);
    });
    m.innerHTML = hasMore ? `<button class="uk-btn uk-btn-primary" id="os-more-btn">Xem thêm (${filteredImages.length - loadedImages.length})</button>` : '';
    if (hasMore) m.querySelector('#os-more-btn').onclick = () => engine.loadMore();
  },
  renderPage(engine) {
    const main = document.getElementById('os-main');
    if (engine.state.currentPage === 'article' && engine.state.activePost) renderArticleView(main, engine, engine.state.activePost);
    else if (engine.state.currentPage === 'support') renderSupportView(main, engine);
    else if (engine.state.currentPage === 'profile') renderProfileView(main, engine);
    else {
      main.innerHTML = `
        <section class="os-window" id="os-spotlight-win">
          <div class="os-win-bar"><div class="os-dots"><span></span><span></span><span></span></div><div style="font-size:12px;font-weight:700;color:var(--text-muted);">Spotlight Showcase</div><button class="uk-btn" id="os-cmd-btn" style="padding:4px 10px;font-size:12px;">${ICONS.search} Tìm (Ctrl+K)</button></div>
          <div class="os-spotlight-body"><div class="os-featured-strip" id="os-featured"></div><div><div style="font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:var(--accent);">Không gian Sáng tạo AI</div><h1 style="margin:6px 0 10px;font-family:var(--font-display);font-size:26px;">Kho Câu Lệnh Prompt Audition AI</h1><p style="margin:0 0 16px;font-size:13.5px;color:var(--text-muted);">Bấm ảnh để mở cửa sổ chi tiết, hoặc mở dạng bài viết chia sẻ link trực tiếp.</p><div style="display:flex;gap:8px;flex-wrap:wrap;"><button class="uk-btn uk-btn-primary" id="os-add-btn">${ICONS.plus} Đăng Prompt Mới</button><select class="uk-input" id="os-sort" style="width:auto;padding:8px 12px;font-size:13px;"><option value="newest">Mới nhất</option><option value="views">Xem nhiều nhất</option></select></div></div></div>
        </section>
        <section class="os-window"><div class="os-win-bar"><div class="os-dots"><span></span><span></span><span></span></div><div style="font-size:12px;font-weight:700;color:var(--text-muted);">Thư viện Ảnh & Câu lệnh</div><div style="width:48px;"></div></div><div class="os-folder-tabs" id="os-cats"></div><div class="os-grid" id="os-grid"></div><div id="os-more" style="text-align:center;padding:0 18px 22px;"></div></section>
      `;
      main.querySelector('#os-cmd-btn').onclick = () => openSpotlightSearch(engine);
      main.querySelector('#os-add-btn').onclick = () => openAddModal(engine);
      main.querySelector('#os-sort').onchange = (e) => engine.setSort(e.target.value);
      this.renderCategories(engine); this.renderGallery(engine);
    }
  },
  openDetailModal(engine, image) { renderDetailModal(engine, image); },
  closeDetailModal() { closeDetailModal(); }
};
new PromptAppEngine(adapter).init();
