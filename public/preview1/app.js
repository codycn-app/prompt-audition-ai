import gsap from 'https://cdn.jsdelivr.net/npm/gsap@3.12.5/index.js';
import { PromptAppEngine, escapeHtml, getObjectPosition, getDisplayViews } from '/preview-core/core.js';
import {
  ICONS, renderDetailModal, closeDetailModal, renderArticleView,
  renderSupportView, renderProfileView, openAuthModal, openAddModal,
  openWelcomeModal, openAdminSettingsModal
} from '/preview-core/ui-kit.js';

const LOGO_SVG = `
<div class="os-logo-wrap" aria-hidden="true">
  <svg class="os-logo-svg" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="cGrad" x1="4" y1="4" x2="36" y2="36" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="#38BDF8"/>
        <stop offset="50%" stop-color="#E879F9"/>
        <stop offset="100%" stop-color="#FBBF24"/>
      </linearGradient>
    </defs>
    <rect x="2" y="2" width="36" height="36" rx="11" fill="rgba(10,15,30,0.85)" stroke="rgba(56,189,248,0.28)" stroke-width="1.2"/>
    <g class="os-logo-ring">
      <circle cx="20" cy="20" r="15.5" stroke="url(#cGrad)" stroke-width="1.8" stroke-dasharray="26 10 8 10" stroke-linecap="round"/>
    </g>
    <g class="os-logo-c">
      <path d="M25.8 14.3C24.3 12.6 22.3 11.7 19.9 11.7C15.2 11.7 11.8 15.2 11.8 20C11.8 24.8 15.2 28.3 19.9 28.3C22.4 28.3 24.4 27.3 25.9 25.5" stroke="url(#cGrad)" stroke-width="4.2" stroke-linecap="round"/>
      <circle cx="26.5" cy="14" r="1.8" fill="#38BDF8"/>
    </g>
  </svg>
</div>`;

const CAT_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>`;

function initSmoothAuroraCanvas() {
  const canvas = document.getElementById('os-aurora-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let w = 0, h = 0;
  const resize = () => {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  };
  resize();
  window.addEventListener('resize', resize, { passive: true });

  const waves = [
    { amp: 55, freq: 0.0022, speed: 0.014, yRatio: 0.28, color: 'rgba(56, 189, 248, 0.22)', lw: 2.2 },
    { amp: 70, freq: 0.0018, speed: -0.011, yRatio: 0.48, color: 'rgba(232, 121, 249, 0.18)', lw: 2.4 },
    { amp: 45, freq: 0.0028, speed: 0.018, yRatio: 0.72, color: 'rgba(99, 102, 241, 0.2)', lw: 1.8 },
  ];

  const motes = Array.from({ length: window.innerWidth < 768 ? 16 : 32 }, () => ({
    x: Math.random(), y: Math.random(),
    r: 1.5 + Math.random() * 3.5,
    vy: 0.00025 + Math.random() * 0.00045,
    color: Math.random() > 0.5 ? 'rgba(56, 189, 248, 0.55)' : 'rgba(232, 121, 249, 0.5)'
  }));

  let mx = 0.5, my = 0.5, t = 0;
  window.addEventListener('pointermove', (e) => {
    mx = e.clientX / (w || 1);
    my = e.clientY / (h || 1);
  }, { passive: true });

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function draw() {
    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'lighter';

    const cg = ctx.createRadialGradient(mx * w, my * h, 0, mx * w, my * h, Math.max(w, h) * 0.35);
    cg.addColorStop(0, 'rgba(56, 189, 248, 0.12)');
    cg.addColorStop(1, 'rgba(5, 7, 14, 0)');
    ctx.fillStyle = cg;
    ctx.fillRect(0, 0, w, h);

    waves.forEach((wv, idx) => {
      ctx.beginPath();
      const baseY = wv.yRatio * h + (my - 0.5) * 35;
      for (let x = 0; x <= w; x += 18) {
        const y = baseY + Math.sin(x * wv.freq + t * wv.speed * 60 + idx) * wv.amp;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = wv.color;
      ctx.lineWidth = wv.lw;
      ctx.stroke();
    });

    motes.forEach(m => {
      if (!prefersReduced) {
        m.y -= m.vy;
        if (m.y < -0.05) { m.y = 1.05; m.x = Math.random(); }
      }
      const cx = m.x * w, cy = m.y * h;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, m.r * 3);
      g.addColorStop(0, m.color);
      g.addColorStop(1, 'rgba(5, 7, 14, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, m.r * 3, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.globalCompositeOperation = 'source-over';
    t += 0.016;
    if (!prefersReduced) requestAnimationFrame(draw);
  }
  draw();
}

// Deterministic Daily Seeded Shuffle: Top 100 -> Random 10 per day
function getDailyTop10(publicImages) {
  if (!publicImages.length) return [];
  const top100 = [...publicImages].sort((a, b) => getDisplayViews(b) - getDisplayViews(a)).slice(0, 100);
  const d = new Date();
  let seed = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  const rand = () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
  for (let i = top100.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [top100[i], top100[j]] = [top100[j], top100[i]];
  }
  return top100.slice(0, 10);
}

function getHashtag(img) {
  const cat = img.categories?.[0]?.name || '';
  const lower = cat.toLowerCase();
  if (lower.includes('couple') || lower.includes('đôi')) return { label: 'Couple', color: '#f472b6' };
  const groupMatch = lower.match(/nhóm\s*(\d+)/i);
  if (groupMatch) return { label: `Group ${groupMatch[1]}`, color: '#a78bfa' };
  if (lower.includes('nhóm')) return { label: 'Group', color: '#a78bfa' };
  if (lower.includes('nam') || lower.includes('nữ') || lower.includes('đơn')) return { label: 'Single', color: '#38bdf8' };
  if (cat) return { label: cat, color: '#34d399' };
  return { label: 'Prompt', color: '#38bdf8' };
}

function attachSafeImageFallback(imgEl, item, containerEl, engine) {
  let triedOriginal = false;
  imgEl.addEventListener('error', () => {
    if (!triedOriginal && item.image_url && imgEl.src !== item.image_url) {
      triedOriginal = true;
      imgEl.src = item.image_url;
    } else {
      engine.markImageBroken(item.id);
      containerEl?.remove();
    }
  });
}

const adapter = {
  mountShell(engine) {
    initSmoothAuroraCanvas();
    document.getElementById('app').innerHTML = `
      <div class="os-root">
        <header class="os-menubar">
          <div class="os-brand" id="os-logo">
            ${LOGO_SVG}
            <span class="os-brand-text os-brand-desktop">Câu Lệnh Audition AI</span>
            <span class="os-brand-text os-brand-mobile">Câu Lệnh Au</span>
          </div>
          <div class="os-top-search">
            ${ICONS.search}
            <input id="os-search" type="search" placeholder="Tìm câu lệnh, phong cách..." />
            <span class="os-kbd">Ctrl K</span>
          </div>
          <div style="display:flex;align-items:center;gap:8px;">
            <button class="uk-btn" id="os-noti-btn" title="Thông báo" style="padding:8px 10px;">${ICONS.bell}</button>
            <button class="uk-btn os-hide-mob" id="os-sup">${ICONS.heart} <span>Ủng hộ</span></button>
            <button class="uk-btn uk-btn-primary os-hide-mob pc-hidden" id="os-add">${ICONS.plus} <span>Thêm mới</span></button>
            <div id="os-auth-top"></div>
          </div>
        </header>

        <main class="os-desktop" id="os-main">
          <section class="os-hero-banner">
            <div class="os-hero-inner">
              <div class="os-hero-head">
                <div class="os-hero-badge"><span class="os-hero-dot"></span> <span id="os-count-label">Top 10 Tuyển Chọn Hôm Nay</span></div>
              </div>
              <div class="os-slide-viewport">
                <div class="os-slide-track" id="os-featured"></div>
              </div>
            </div>
          </section>

          <section class="os-library-win">
            <div class="os-cat-bar">
              <div class="os-cats-scroll" id="os-cats"></div>
            </div>
            <div class="os-grid" id="os-grid"></div>
            <div id="os-more" style="text-align:center;padding:10px 18px 26px;"></div>
          </section>
        </main>

        <div class="os-dock-wrap">
          <nav class="os-dock" aria-label="Thanh điều hướng nhanh">
            <button class="os-dock-item" title="Trang chủ" data-dock="home">${ICONS.home}</button>
            <div class="os-dock-sep pc-hidden" id="os-dock-add-sep"></div>
            <button class="os-dock-item primary pc-hidden" title="Thêm Prompt mới" id="os-dock-add">${ICONS.plus}</button>
            <div class="os-dock-sep"></div>
            <button class="os-dock-item" title="Ủng hộ" data-dock="support">${ICONS.heart}</button>
            <button class="os-dock-item" title="Tài khoản" data-dock="profile">${ICONS.user}</button>
          </nav>
        </div>
      </div>
    `;

    this.bindControls(engine);
  },

  bindControls(engine) {
    document.getElementById('os-logo').onclick = () => engine.setCategory('all');
    document.getElementById('os-noti-btn').onclick = () => openWelcomeModal(engine, true);
    document.getElementById('os-sup').onclick = () => engine.setPage('support');
    document.getElementById('os-add').onclick = () => openAddModal(engine);
    document.getElementById('os-dock-add').onclick = () => openAddModal(engine);

    const searchInput = document.getElementById('os-search');
    let t;
    searchInput.addEventListener('input', (e) => { clearTimeout(t); t = setTimeout(() => engine.setSearch(e.target.value), 180); });
    window.addEventListener('keydown', (e) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); searchInput.focus(); } });

    document.querySelectorAll('[data-dock]').forEach(b => b.onclick = () => {
      if (b.dataset.dock === 'profile' && !engine.state.currentUser) openAuthModal(engine, 'login');
      else engine.setPage(b.dataset.dock);
    });
  },

  renderAuth(engine) {
    const s = document.getElementById('os-auth-top');
    const u = engine.state.currentUser;
    const isLoggedIn = Boolean(u);

    document.getElementById('os-add')?.classList.toggle('pc-hidden', !isLoggedIn);
    document.getElementById('os-dock-add')?.classList.toggle('pc-hidden', !isLoggedIn);
    document.getElementById('os-dock-add-sep')?.classList.toggle('pc-hidden', !isLoggedIn);

    s.innerHTML = u
      ? `<button class="uk-btn" id="os-u" title="${escapeHtml(u.username)}" style="padding:8px 10px;">${ICONS.user}</button>`
      : `<button class="uk-btn os-hide-mob" id="os-l">Đăng nhập</button>`;
    if (u) s.querySelector('#os-u').onclick = () => engine.setPage('profile');
    else s.querySelector('#os-l').onclick = () => openAuthModal(engine, 'login');
  },

  renderLoading(engine, l) {
    if (!l) return;
    document.getElementById('os-grid').innerHTML = Array.from({ length: 14 }, () => `<div class="os-tile-wrap"><div class="os-tile" style="opacity:0.35;"></div></div>`).join('');
  },

  renderCategories(engine) {
    const { categories, selectedCategory } = engine.state;
    const publicCount = engine.getPublicImages().length;
    const html = [
      `<button class="os-cat-pill ${selectedCategory === 'all' ? 'active' : ''}" data-cat="all">Tất cả (${publicCount})</button>`,
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
    const pub = engine.getPublicImages();
    const lbl = document.getElementById('os-count-label');
    if (lbl) lbl.textContent = `Top 10 Tuyển Chọn Hôm Nay • ${pub.length} Prompts`;

    if (!this._welcomeShown && pub.length) {
      this._welcomeShown = true;
      openWelcomeModal(engine, false);
    }

    const feat = document.getElementById('os-featured');
    if (feat && pub.length && !feat.dataset.ready) {
      const daily10 = getDailyTop10(pub);
      const looped = [...daily10, ...daily10];
      feat.innerHTML = looped.map((img, i) => {
        const hotNum = (i % daily10.length) + 1;
        return `
          <div class="os-slide-wrap" data-fid="${img.id}">
            <span class="os-hot-pill"><span class="os-hot-dot"></span>HOT ${hotNum}</span>
            <div class="os-slide-card">
              <img src="${escapeHtml(img.thumbnail_url || img.image_url)}" alt="${escapeHtml(img.title)}" draggable="false" style="object-position:${getObjectPosition(img)}" decoding="async" fetchpriority="high" />
              <span class="os-slide-views">👁 ${getDisplayViews(img)}</span>
            </div>
          </div>`;
      }).join('');
      feat.dataset.ready = '1';

      const viewport = feat.closest('.os-slide-viewport');
      let offset = 0;
      let isHovering = false;
      let isDragging = false;
      let startX = 0;
      let dragMoved = 0;
      let rafId = null;

      const wrapOffset = () => {
        const half = feat.scrollWidth / 2;
        if (half <= 0) return;
        while (offset <= -half) offset += half;
        while (offset > 0) offset -= half;
        feat.style.transform = `translate3d(${offset}px, 0, 0)`;
      };

      const step = () => {
        if (!feat.isConnected) { cancelAnimationFrame(rafId); return; }
        if (!isHovering && !isDragging) {
          offset -= 0.55;
          wrapOffset();
        }
        rafId = requestAnimationFrame(step);
      };
      rafId = requestAnimationFrame(step);

      if (viewport) {
        viewport.addEventListener('pointerenter', () => { isHovering = true; });
        viewport.addEventListener('pointerleave', () => { isHovering = false; });
        viewport.addEventListener('pointerdown', (e) => {
          if (e.button !== 0) return;
          isDragging = true;
          startX = e.clientX;
          dragMoved = 0;
          viewport.classList.add('is-dragging');
        });
        window.addEventListener('pointermove', (e) => {
          if (!isDragging) return;
          const dx = e.clientX - startX;
          startX = e.clientX;
          dragMoved += Math.abs(dx);
          offset += dx;
          wrapOffset();
        });
        const stopDrag = () => {
          if (!isDragging) return;
          isDragging = false;
          viewport.classList.remove('is-dragging');
        };
        window.addEventListener('pointerup', stopDrag);
        window.addEventListener('pointercancel', stopDrag);
        viewport.addEventListener('wheel', (e) => {
          const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
          if (delta !== 0) {
            e.preventDefault();
            offset -= delta * 0.85;
            wrapOffset();
          }
        }, { passive: false });
      }

      feat.querySelectorAll('.os-slide-wrap').forEach(c => {
        const item = daily10.find(i => i.id === Number(c.dataset.fid));
        if (!item) return;
        attachSafeImageFallback(c.querySelector('img'), item, c, engine);
        c.onclick = () => {
          if (dragMoved > 6) return;
          engine.openModal(item, c);
        };
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

    g.innerHTML = loadedImages.map((img, idx) => {
      const tag = getHashtag(img);
      const eager = idx < 7 ? 'fetchpriority="high"' : 'loading="lazy"';
      return `
        <div class="os-tile-wrap" data-id="${img.id}">
          <span class="os-tag-pill" style="--tag-c:${tag.color};"><span class="os-tag-dot"></span>${escapeHtml(tag.label)}</span>
          <div class="os-tile">
            <img src="${escapeHtml(img.thumbnail_url || img.image_url)}" alt="${escapeHtml(img.title)}" style="object-position:${getObjectPosition(img)}" decoding="async" ${eager} />
            <div class="os-tile-glare"></div>
            <button class="os-copy-pill" data-copy="${img.id}" title="Sao chép Prompt">${ICONS.copy}<span>Copy Prompt</span></button>
          </div>
        </div>`;
    }).join('');

    gsap.fromTo('.os-tile-wrap', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.3, stagger: 0.015, ease: 'power2.out' });

    g.querySelectorAll('.os-tile-wrap').forEach(card => {
      const item = loadedImages.find(i => i.id === Number(card.dataset.id));
      if (item) attachSafeImageFallback(card.querySelector('img'), item, card, engine);

      card.addEventListener('pointermove', (e) => {
        if (window.innerWidth < 768) return;
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width;
        const y = (e.clientY - r.top) / r.height;
        card.style.setProperty('--gx', `${x * 100}%`);
        card.style.setProperty('--gy', `${y * 100}%`);
        card.style.transform = `perspective(800px) rotateX(${(0.5 - y) * 7}deg) rotateY(${(x - 0.5) * 7}deg) translateY(-5px)`;
      }, { passive: true });
      card.addEventListener('pointerleave', () => { card.style.transform = ''; }, { passive: true });
      card.onclick = (e) => {
        if (e.target.closest('[data-copy]')) return;
        if (item) engine.openModal(item, card);
      };
    });

    g.querySelectorAll('[data-copy]').forEach(b => b.onclick = async (e) => {
      e.stopPropagation();
      const ok = await engine.copyPromptById(Number(b.dataset.copy));
      if (ok) {
        b.innerHTML = `${ICONS.check}<span>Đã chép!</span>`;
        setTimeout(() => { if (b.isConnected) b.innerHTML = `${ICONS.copy}<span>Copy Prompt</span>`; }, 1500);
      }
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
        <section class="os-hero-banner"><div class="os-hero-inner"><div class="os-hero-head"><div class="os-hero-badge"><span class="os-hero-dot"></span> <span id="os-count-label">Top 10 Tuyển Chọn Hôm Nay</span></div></div><div class="os-slide-viewport"><div class="os-slide-track" id="os-featured"></div></div></div></section>
        <section class="os-library-win"><div class="os-cat-bar"><div class="os-cats-scroll" id="os-cats"></div></div><div class="os-grid" id="os-grid"></div><div id="os-more" style="text-align:center;padding:10px 18px 26px;"></div></section>
      `;
      this.renderCategories(engine);
      this.renderGallery(engine);
    }
  },

  openDetailModal(engine, image) {
    renderDetailModal(engine, image, {
      onModalMount(modal) {
        gsap.fromTo(modal.querySelector('.pc-modal-card'), { scale: 0.92, opacity: 0, y: 16 }, { scale: 1, opacity: 1, y: 0, duration: 0.3, ease: 'power3.out' });
      }
    });
  },
  closeDetailModal() { closeDetailModal(); }
};

new PromptAppEngine(adapter).init();
