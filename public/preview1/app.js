import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';
import gsap from 'https://cdn.jsdelivr.net/npm/gsap@3.12.5/index.js';
import { PromptAppEngine, escapeHtml, getObjectPosition, copyText } from '/preview-core/core.js';
import { ICONS, renderDetailModal, closeDetailModal, renderArticleView, renderSupportView, renderProfileView, openAuthModal, openAddModal } from '/preview-core/ui-kit.js';

const LOGO_SVG = `
<svg class="os-logo-svg" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="prismGrad" x1="4" y1="4" x2="36" y2="36" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#38BDF8"/>
      <stop offset="50%" stop-color="#A855F7"/>
      <stop offset="100%" stop-color="#F472B6"/>
    </linearGradient>
  </defs>
  <rect x="2" y="2" width="36" height="36" rx="11" fill="url(#prismGrad)" fill-opacity="0.18" stroke="url(#prismGrad)" stroke-width="1.6"/>
  <path d="M20 7L31 15.5L26.5 31H13.5L9 15.5L20 7Z" fill="url(#prismGrad)" fill-opacity="0.28" stroke="#FFFFFF" stroke-opacity="0.75" stroke-width="1.4" stroke-linejoin="round"/>
  <path d="M20 7V31M9 15.5H31M13.5 31L20 15.5L26.5 31" stroke="#38BDF8" stroke-opacity="0.8" stroke-width="1.2"/>
  <circle cx="20" cy="15.5" r="2.6" fill="#FFFFFF"/>
</svg>`;

const CAT_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>`;

function initStarfield() {
  const canvas = document.getElementById('os-stars');
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.z = 5;

  const count = window.innerWidth < 768 ? 400 : 1000;
  const pos = new Float32Array(count * 3);
  const cols = new Float32Array(count * 3);
  const c1 = new THREE.Color('#38bdf8'), c2 = new THREE.Color('#e879f9');
  for (let i = 0; i < count; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 22;
    pos[i * 3 + 1] = (Math.random() - 0.5) * 14;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 14;
    const c = Math.random() > 0.5 ? c1 : c2;
    cols[i * 3] = c.r; cols[i * 3 + 1] = c.g; cols[i * 3 + 2] = c.b;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.045, vertexColors: true, transparent: true, opacity: 0.72 }));
  scene.add(pts);

  let mx = 0, my = 0;
  window.addEventListener('pointermove', (e) => { mx = (e.clientX / window.innerWidth - 0.5) * 0.45; my = (e.clientY / window.innerHeight - 0.5) * 0.35; });
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
  function anim() {
    requestAnimationFrame(anim);
    pts.rotation.y += 0.0007;
    pts.rotation.x += (my - pts.rotation.x) * 0.03;
    pts.rotation.y += (mx - pts.rotation.y) * 0.015;
    renderer.render(scene, camera);
  }
  anim();
}

function initBanner3D() {
  const canvas = document.getElementById('os-banner-3d');
  if (!canvas) return;
  const r = canvas.parentElement.getBoundingClientRect();
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setSize(r.width, r.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, r.width / r.height, 0.1, 100);
  camera.position.z = 5;

  const knot = new THREE.Mesh(
    new THREE.TorusKnotGeometry(1.15, 0.32, 90, 14),
    new THREE.MeshBasicMaterial({ color: 0x38bdf8, wireframe: true, transparent: true, opacity: 0.28 })
  );
  knot.position.set(-1.6, 0, 0);
  scene.add(knot);

  function anim() {
    if (!document.getElementById('os-banner-3d')) return;
    requestAnimationFrame(anim);
    knot.rotation.y += 0.006;
    knot.rotation.x += 0.004;
    renderer.render(scene, camera);
  }
  anim();
}

const adapter = {
  mountShell(engine) {
    initStarfield();
    document.getElementById('app').innerHTML = `
      <div class="os-root">
        <header class="os-menubar">
          <div class="os-brand" id="os-logo">
            ${LOGO_SVG}
            <span class="os-brand-text">Prompt Audition AI</span>
          </div>
          <div class="os-top-search">
            ${ICONS.search}
            <input id="os-search" type="search" placeholder="Tìm câu lệnh, phong cách..." />
            <span class="os-kbd">Ctrl K</span>
          </div>
          <div style="display:flex;align-items:center;gap:8px;">
            <button class="uk-btn os-hide-mob" id="os-sup">${ICONS.heart} <span>Ủng hộ</span></button>
            <button class="uk-btn uk-btn-primary os-hide-mob" id="os-add">${ICONS.plus} <span>Thêm mới</span></button>
            <div id="os-auth-top"></div>
          </div>
        </header>

        <main class="os-desktop" id="os-main">
          <section class="os-hero-banner">
            <div class="os-hero-inner">
              <canvas id="os-banner-3d"></canvas>
              <div class="os-hero-copy">
                <div class="os-hero-badge"><span class="os-hero-dot"></span> <span id="os-count-label">Kho câu lệnh AI cộng đồng</span></div>
                <h1 style="margin:0 0 10px;font-family:var(--font-display);font-size:clamp(24px,3.2vw,36px);line-height:1.15;">Khám phá & Chia sẻ Câu Lệnh Tạo Ảnh AI</h1>
                <p style="margin:0 0 18px;font-size:14px;color:var(--text-muted);line-height:1.6;max-width:540px;">Bấm vào ảnh để mở xem kích thước gốc kèm câu lệnh chi tiết, hoặc mở dạng bài viết để chia sẻ link trực tiếp cho bạn bè.</p>
                <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;">
                  <button class="uk-btn uk-btn-primary" id="os-hero-add">${ICONS.plus} Đóng góp Prompt</button>
                  <select class="uk-input" id="os-sort" style="width:auto;padding:9px 14px;border-radius:999px;font-size:13px;">
                    <option value="newest">Mới nhất</option>
                    <option value="views">Xem nhiều nhất</option>
                  </select>
                </div>
              </div>
              <div class="os-featured-strip" id="os-featured"></div>
            </div>
          </section>

          <section class="os-library-win">
            <div class="os-cat-bar">
              <div class="os-cats-scroll" id="os-cats"></div>
            </div>
            <div class="os-grid" id="os-grid"></div>
            <div id="os-more" style="text-align:center;padding:8px 18px 24px;"></div>
          </section>
        </main>

        <div class="os-dock-wrap">
          <div class="os-dock-popover pc-hidden" id="os-cat-popover"></div>
          <nav class="os-dock" aria-label="Thanh điều hướng nhanh">
            <button class="os-dock-item" title="Trang chủ" data-dock="home">${ICONS.home}</button>
            <button class="os-dock-item" title="Chọn chuyên mục" id="os-dock-cats">${CAT_ICON}</button>
            <div class="os-dock-sep"></div>
            <button class="os-dock-item primary" title="Thêm Prompt mới" id="os-dock-add">${ICONS.plus}</button>
            <div class="os-dock-sep"></div>
            <button class="os-dock-item" title="Ủng hộ" data-dock="support">${ICONS.heart}</button>
            <button class="os-dock-item" title="Tài khoản" data-dock="profile">${ICONS.user}</button>
          </nav>
        </div>
      </div>
    `;

    initBanner3D();
    this.bindControls(engine);
  },

  bindControls(engine) {
    document.getElementById('os-logo').onclick = () => engine.setCategory('all');
    document.getElementById('os-sup').onclick = () => engine.setPage('support');
    document.getElementById('os-add').onclick = () => openAddModal(engine);
    document.getElementById('os-hero-add').onclick = () => openAddModal(engine);
    document.getElementById('os-dock-add').onclick = () => openAddModal(engine);
    document.getElementById('os-sort').onchange = (e) => engine.setSort(e.target.value);

    const pop = document.getElementById('os-cat-popover');
    document.getElementById('os-dock-cats').onclick = () => pop.classList.toggle('pc-hidden');

    const searchInput = document.getElementById('os-search');
    let t;
    searchInput.addEventListener('input', (e) => { clearTimeout(t); t = setTimeout(() => engine.setSearch(e.target.value), 180); });
    window.addEventListener('keydown', (e) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); searchInput.focus(); } });

    document.querySelectorAll('[data-dock]').forEach(b => b.onclick = () => {
      pop.classList.add('pc-hidden');
      if (b.dataset.dock === 'profile' && !engine.state.currentUser) openAuthModal(engine, 'login');
      else engine.setPage(b.dataset.dock);
    });
  },

  renderAuth(engine) {
    const s = document.getElementById('os-auth-top'); const u = engine.state.currentUser;
    s.innerHTML = u
      ? `<button class="uk-btn" id="os-u">${ICONS.user} <span>${escapeHtml(u.username)}</span></button>`
      : `<button class="uk-btn os-hide-mob" id="os-l">Đăng nhập</button>`;
    if (u) s.querySelector('#os-u').onclick = () => engine.setPage('profile');
    else s.querySelector('#os-l').onclick = () => openAuthModal(engine, 'login');
  },

  renderLoading(engine, l) {
    if (!l) return;
    document.getElementById('os-grid').innerHTML = Array.from({ length: 12 }, () => `<div class="os-tile" style="opacity:0.35;"></div>`).join('');
  },

  renderCategories(engine) {
    const { categories, selectedCategory, allImagesMeta } = engine.state;
    const html = [
      `<button class="os-cat-pill ${selectedCategory === 'all' ? 'active' : ''}" data-cat="all">Tất cả (${allImagesMeta.length})</button>`,
      ...categories.map(c => `<button class="os-cat-pill ${selectedCategory === c.id ? 'active' : ''}" data-cat="${c.id}">${escapeHtml(c.name)}</button>`)
    ].join('');

    const bar = document.getElementById('os-cats');
    const pop = document.getElementById('os-cat-popover');
    if (bar) {
      bar.innerHTML = html;
      bar.querySelectorAll('[data-cat]').forEach(b => b.onclick = () => engine.setCategory(b.dataset.cat === 'all' ? 'all' : Number(b.dataset.cat)));
    }
    if (pop) {
      pop.innerHTML = html;
      pop.querySelectorAll('[data-cat]').forEach(b => b.onclick = () => {
        pop.classList.add('pc-hidden');
        engine.setCategory(b.dataset.cat === 'all' ? 'all' : Number(b.dataset.cat));
      });
    }
  },

  renderGallery(engine) {
    const lbl = document.getElementById('os-count-label');
    if (lbl) lbl.textContent = `${engine.state.allImagesMeta.length} Câu lệnh AI đang hoạt động`;

    const feat = document.getElementById('os-featured');
    if (feat && engine.state.allImagesMeta.length) {
      const top3 = [...engine.state.allImagesMeta].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 3);
      feat.innerHTML = top3.map((img, idx) => `
        <div class="os-feat-card" data-fid="${img.id}">
          <img src="${escapeHtml(img.thumbnail_url || img.image_url)}" alt="${escapeHtml(img.title)}" style="object-position:${getObjectPosition(img)}" />
          <span class="os-feat-rank">#${idx + 1} HOT</span>
        </div>`).join('');
      feat.querySelectorAll('.os-feat-card').forEach(c => c.onclick = () => {
        const item = top3.find(i => i.id === Number(c.dataset.fid));
        if (item) engine.openModal(item, c);
      });
    }

    const g = document.getElementById('os-grid'); const m = document.getElementById('os-more');
    if (!g) return;
    const { loadedImages, hasMore, filteredImages } = engine.state;
    if (!loadedImages.length) {
      g.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:56px 16px;color:var(--text-muted);">Không tìm thấy câu lệnh nào phù hợp.</div>`;
      m.innerHTML = '';
      return;
    }

    g.innerHTML = loadedImages.map(img => `
      <div class="os-tile" data-id="${img.id}">
        <img src="${escapeHtml(img.thumbnail_url || img.image_url)}" alt="${escapeHtml(img.title)}" style="object-position:${getObjectPosition(img)}" loading="lazy" />
        <div class="os-tile-foot">
          <span style="font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(img.title)}</span>
          <button class="uk-btn" data-copy="${img.id}" style="padding:6px 8px;border-radius:999px;" title="Sao chép nhanh">${ICONS.copy}</button>
        </div>
      </div>`).join('');

    gsap.fromTo('.os-tile', { opacity: 0, y: 16, scale: 0.96 }, { opacity: 1, y: 0, scale: 1, duration: 0.4, stagger: 0.02, ease: 'power3.out' });

    g.querySelectorAll('.os-tile').forEach(card => {
      card.addEventListener('pointermove', (e) => {
        if (window.innerWidth < 768) return;
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width;
        const y = (e.clientY - r.top) / r.height;
        card.style.setProperty('--mx', `${e.clientX - r.left}px`);
        card.style.setProperty('--my', `${e.clientY - r.top}px`);
        card.style.transform = `perspective(700px) rotateX(${(0.5 - y) * 7}deg) rotateY(${(x - 0.5) * 7}deg) translateY(-4px)`;
      });
      card.addEventListener('pointerleave', () => { card.style.transform = ''; });
      card.onclick = (e) => {
        if (e.target.closest('[data-copy]')) return;
        const item = loadedImages.find(i => i.id === Number(card.dataset.id));
        if (item) engine.openModal(item, card);
      };
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
        <section class="os-hero-banner"><div class="os-hero-inner"><canvas id="os-banner-3d"></canvas><div class="os-hero-copy"><div class="os-hero-badge"><span class="os-hero-dot"></span> <span id="os-count-label">Kho câu lệnh AI cộng đồng</span></div><h1 style="margin:0 0 10px;font-family:var(--font-display);font-size:clamp(24px,3.2vw,36px);line-height:1.15;">Khám phá & Chia sẻ Câu Lệnh Tạo Ảnh AI</h1><p style="margin:0 0 18px;font-size:14px;color:var(--text-muted);line-height:1.6;max-width:540px;">Bấm vào ảnh để mở xem kích thước gốc kèm câu lệnh chi tiết, hoặc mở dạng bài viết để chia sẻ link trực tiếp cho bạn bè.</p><div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;"><button class="uk-btn uk-btn-primary" id="os-hero-add">${ICONS.plus} Đóng góp Prompt</button><select class="uk-input" id="os-sort" style="width:auto;padding:9px 14px;border-radius:999px;font-size:13px;"><option value="newest" ${engine.state.sortBy === 'newest' ? 'selected' : ''}>Mới nhất</option><option value="views" ${engine.state.sortBy === 'views' ? 'selected' : ''}>Xem nhiều nhất</option></select></div></div><div class="os-featured-strip" id="os-featured"></div></div></section>
        <section class="os-library-win"><div class="os-cat-bar"><div class="os-cats-scroll" id="os-cats"></div></div><div class="os-grid" id="os-grid"></div><div id="os-more" style="text-align:center;padding:8px 18px 24px;"></div></section>
      `;
      initBanner3D();
      main.querySelector('#os-hero-add').onclick = () => openAddModal(engine);
      main.querySelector('#os-sort').onchange = (e) => engine.setSort(e.target.value);
      this.renderCategories(engine);
      this.renderGallery(engine);
    }
  },

  openDetailModal(engine, image) {
    renderDetailModal(engine, image, {
      onModalMount(modal) {
        gsap.fromTo(modal.querySelector('.pc-modal-card'), { scale: 0.9, opacity: 0, y: 18 }, { scale: 1, opacity: 1, y: 0, duration: 0.34, ease: 'back.out(1.4)' });
      }
    });
  },
  closeDetailModal() { closeDetailModal(); }
};

new PromptAppEngine(adapter).init();
