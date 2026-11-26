import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';
import { PromptAppEngine, escapeHtml, getObjectPosition } from '/preview-core/core.js';
import { ICONS, renderDetailModal, closeDetailModal, renderArticleView, renderSupportView, renderProfileView, openAuthModal, openAddModal } from '/preview-core/ui-kit.js';

let rotY = 0;

function initGoldenDust() {
  const canvas = document.getElementById('orb-bg');
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.z = 6;
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(450 * 3);
  for (let i = 0; i < pos.length; i++) pos[i] = (Math.random() - 0.5) * 16;
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xf59e0b, size: 0.05, transparent: true, opacity: 0.5 }));
  scene.add(pts);
  function anim() { requestAnimationFrame(anim); pts.rotation.y += 0.001; renderer.render(scene, camera); }
  anim();
}

const adapter = {
  mountShell(engine) {
    initGoldenDust();
    document.getElementById('app').innerHTML = `
      <div class="orb-shell">
        <header class="orb-hud-top">
          <div class="orb-title" id="orb-logo">Orbit Gallery 3D</div>
          <div style="flex:1;max-width:340px;position:relative;display:flex;align-items:center;">
            <span style="position:absolute;left:12px;width:15px;height:15px;color:var(--text-muted);">${ICONS.search}</span>
            <input class="uk-input" id="orb-search" type="search" placeholder="Tìm tác phẩm..." style="padding-left:36px;border-radius:999px;" />
          </div>
          <div style="display:flex;gap:8px;align-items:center;">
            <button class="uk-btn orb-hide-mob" id="orb-sup">${ICONS.heart} Ủng hộ</button>
            <button class="uk-btn uk-btn-primary orb-hide-mob" id="orb-add">${ICONS.plus} Thêm</button>
            <div id="orb-auth"></div>
          </div>
        </header>
        <main id="orb-main" style="flex:1;display:flex;flex-direction:column;justify-content:center;">
          <div class="orb-stage" id="orb-stage">
            <div class="orb-carousel" id="orb-ring"></div>
          </div>
          <div class="orb-hud-bottom">
            <div style="display:flex;gap:10px;align-items:center;">
              <button class="uk-btn" id="orb-prev">◀ Xoay trái</button>
              <span style="font-size:12.5px;color:var(--text-muted);">Kéo hoặc cuộn để xoay vòng 3D</span>
              <button class="uk-btn uk-btn-primary" id="orb-next">Xoay phải ▶</button>
            </div>
            <div class="orb-cats" id="orb-cats"></div>
            <div id="orb-more"></div>
          </div>
        </main>
        <nav class="pc-mobile-dock" style="background:rgba(15,14,19,0.92);border-top:1px solid var(--border);">
          <button class="uk-btn" style="background:none;border:none;flex-direction:column;gap:2px;font-size:10px;" data-nav="home">${ICONS.home}<span>Vũ trụ 3D</span></button>
          <button class="uk-btn uk-btn-primary" style="width:44px;height:44px;border-radius:999px;margin:0 auto;padding:0;" id="orb-mob-add">${ICONS.plus}</button>
          <button class="uk-btn" style="background:none;border:none;flex-direction:column;gap:2px;font-size:10px;" data-nav="support">${ICONS.heart}<span>Ủng hộ</span></button>
          <button class="uk-btn" style="background:none;border:none;flex-direction:column;gap:2px;font-size:10px;" data-nav="profile">${ICONS.user}<span>Cá nhân</span></button>
        </nav>
      </div>
    `;
    document.getElementById('orb-logo').onclick = () => engine.setCategory('all');
    document.getElementById('orb-sup').onclick = () => engine.setPage('support');
    document.getElementById('orb-add').onclick = () => openAddModal(engine);
    document.getElementById('orb-mob-add').onclick = () => openAddModal(engine);
    let t;
    document.getElementById('orb-search').addEventListener('input', (e) => { clearTimeout(t); t = setTimeout(() => engine.setSearch(e.target.value), 180); });
    document.querySelectorAll('[data-nav]').forEach(b => b.onclick = () => {
      if (b.dataset.nav === 'profile' && !engine.state.currentUser) openAuthModal(engine, 'login');
      else engine.setPage(b.dataset.nav);
    });
  },
  renderAuth(engine) {
    const s = document.getElementById('orb-auth'); const u = engine.state.currentUser;
    s.innerHTML = u ? `<button class="uk-btn" id="orb-u">${ICONS.user} ${escapeHtml(u.username)}</button>` : `<button class="uk-btn orb-hide-mob" id="orb-l">Đăng nhập</button>`;
    if (u) s.querySelector('#orb-u').onclick = () => engine.setPage('profile');
    else s.querySelector('#orb-l').onclick = () => openAuthModal(engine, 'login');
  },
  renderLoading(engine, l) {
    if (l) document.getElementById('orb-ring').innerHTML = `<div style="color:var(--text-muted);text-align:center;padding-top:120px;">Đang xoay quỹ đạo 3D...</div>`;
  },
  renderCategories(engine) {
    const w = document.getElementById('orb-cats'); if (!w) return;
    const { categories, selectedCategory } = engine.state;
    w.innerHTML = [`<button class="orb-pill ${selectedCategory === 'all' ? 'active' : ''}" data-cat="all">Tất cả</button>`,
      ...categories.map(c => `<button class="orb-pill ${selectedCategory === c.id ? 'active' : ''}" data-cat="${c.id}">${escapeHtml(c.name)}</button>`)].join('');
    w.querySelectorAll('[data-cat]').forEach(b => b.onclick = () => engine.setCategory(b.dataset.cat === 'all' ? 'all' : Number(b.dataset.cat)));
  },
  renderGallery(engine) {
    const ring = document.getElementById('orb-ring');
    const stage = document.getElementById('orb-stage');
    const more = document.getElementById('orb-more');
    if (!ring || !stage) return;

    const items = engine.state.loadedImages.slice(0, 12);
    const step = 360 / Math.max(1, items.length);
    const radius = window.innerWidth < 768 ? 290 : 440;

    ring.innerHTML = items.map((img, i) => `
      <div class="orb-item" data-id="${img.id}" style="transform:rotateY(${i * step}deg) translateZ(${radius}px)">
        <img src="${escapeHtml(img.thumbnail_url || img.image_url)}" alt="${escapeHtml(img.title)}" style="object-position:${getObjectPosition(img)}" />
        <div style="position:absolute;inset:auto 0 0 0;padding:18px 10px 8px;background:linear-gradient(to top,rgba(15,14,19,0.92),transparent);font-size:12px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(img.title)}</div>
      </div>
    `).join('');

    const applyRot = () => { ring.style.transform = `rotateY(${rotY}deg)`; };
    applyRot();

    document.getElementById('orb-prev').onclick = () => { rotY += step; applyRot(); };
    document.getElementById('orb-next').onclick = () => { rotY -= step; applyRot(); };
    let dragging = false, startX = 0;
    stage.onpointerdown = (e) => { dragging = true; startX = e.clientX; };
    window.onpointermove = (e) => { if (dragging) { rotY += (e.clientX - startX) * 0.35; startX = e.clientX; applyRot(); } };
    window.onpointerup = () => { dragging = false; };

    ring.querySelectorAll('.orb-item').forEach(el => el.onclick = () => {
      const item = items.find(i => i.id === Number(el.dataset.id));
      if (item) engine.openModal(item, el);
    });
    more.innerHTML = engine.state.hasMore ? `<button class="uk-btn" id="orb-more-btn">Nạp thêm vòng mới (${engine.state.filteredImages.length - engine.state.loadedImages.length})</button>` : '';
    if (engine.state.hasMore) more.querySelector('#orb-more-btn').onclick = () => engine.loadMore();
  },
  renderPage(engine) {
    const main = document.getElementById('orb-main');
    if (engine.state.currentPage === 'article' && engine.state.activePost) renderArticleView(main, engine, engine.state.activePost);
    else if (engine.state.currentPage === 'support') renderSupportView(main, engine);
    else if (engine.state.currentPage === 'profile') renderProfileView(main, engine);
    else {
      main.innerHTML = `<div class="orb-stage" id="orb-stage"><div class="orb-carousel" id="orb-ring"></div></div><div class="orb-hud-bottom"><div style="display:flex;gap:10px;align-items:center;"><button class="uk-btn" id="orb-prev">◀ Xoay trái</button><span style="font-size:12.5px;color:var(--text-muted);">Kéo để xoay vòng 3D</span><button class="uk-btn uk-btn-primary" id="orb-next">Xoay phải ▶</button></div><div class="orb-cats" id="orb-cats"></div><div id="orb-more"></div></div>`;
      this.renderCategories(engine); this.renderGallery(engine);
    }
  },
  openDetailModal(engine, image) { renderDetailModal(engine, image); },
  closeDetailModal() { closeDetailModal(); }
};
new PromptAppEngine(adapter).init();
