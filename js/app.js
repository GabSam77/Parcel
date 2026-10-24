/* =========================================================================
   Location Intelligence — app shell: state, router, shared UI helpers
   Views: #home, #explore (map)  →  #build (steps 1–5)  →  #generating  →  #report
   ========================================================================= */

(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* ---------- global state ---------- */
  PF.state = {
    site: null,          // snapshot object from PF.snapshot()
    category: null,      // taxonomy id
    subtype: null,       // subtype name
    sections: new Set(), // section ids
    step: 1,
    generated: false,
    ref: null,
  };

  /* ---------- icons: fill every [data-icon] ---------- */
  PF.paintIcons = (root = document) => $$('[data-icon]', root).forEach(el => {
    if (!el.querySelector('svg')) el.insertAdjacentHTML('afterbegin', PF.icon(el.dataset.icon));
  });

  /* ---------- toast ---------- */
  let toastT;
  PF.toast = msg => {
    const t = $('#toast'); t.textContent = msg; t.hidden = false;
    t.style.animation = 'none'; void t.offsetWidth; t.style.animation = '';
    clearTimeout(toastT); toastT = setTimeout(() => (t.hidden = true), 2600);
  };

  /* ---------- router ---------- */
  const views = ['home', 'explore', 'build', 'generating', 'report'];
  /* Show the view directly (never depend on the hashchange event, which some embeds suppress),
     then record it in the address bar so Back / refresh still work. */
  let lastShown = null;
  PF.go = (view, opts = {}) => {
    show(view, opts); lastShown = document.body.dataset.route;
    try { if (location.hash.replace('#', '') !== lastShown) history.pushState(null, '', '#' + lastShown); } catch (e) { /* sandboxed: fine */ }
  };
  function show(view, opts = {}) {
    if (!views.includes(view)) view = 'home';
    if (view === 'report' && !PF.state.generated) view = 'build';
    if (view === 'generating' && !PF._generating) view = 'build';
    $$('.view').forEach(v => v.classList.toggle('is-active', v.dataset.view === view));
    document.body.dataset.route = view;
    if (!opts.keepScroll) window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
    if (view === 'home') PF.home && PF.home.onShow(); else PF.home && PF.home.onHide && PF.home.onHide();
    if (view !== 'generating' && PF._genCity) PF._genCity.stop();
    if (view === 'explore') PF.home && PF.home.onExploreShow();
    if (view === 'build') PF.builder && PF.builder.onShow(opts);
    if (view === 'report') PF.report && PF.report.onShow();
    if (opts.scrollTo) setTimeout(() => PF.scrollToId(opts.scrollTo), 60);
  }
  const fromUrl = () => { const v = location.hash.replace('#', '') || 'home'; if (v !== document.body.dataset.route) show(v, {}); };
  window.addEventListener('popstate', fromUrl);
  window.addEventListener('hashchange', fromUrl);

  PF.scrollToId = id => {
    const el = document.getElementById(id); if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - (parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 68) + 1;
    window.scrollTo({ top: y, behavior: 'smooth' });
  };

  /* ---------- global click delegation ---------- */
  document.addEventListener('click', e => {
    const go = e.target.closest('[data-go]');
    if (go) {
      e.preventDefault();
      const v = go.dataset.go;
      if (v === 'build' && go.closest('#view-home, .nav, .mobile-cta')) { PF.state.step = 1; PF.state.generated = false; }
      PF.go(v);
      return;
    }
    const sc = e.target.closest('[data-scroll]');
    if (sc) {
      e.preventDefault();
      if (document.body.dataset.route !== 'home') PF.go('home', { scrollTo: sc.dataset.scroll });
      else PF.scrollToId(sc.dataset.scroll);
    }
  });

  /* ---------- mobile CTA hides while the explorer / final CTA is on screen ---------- */
  const mcta = $('#mobileCta');
  if ('IntersectionObserver' in window && mcta) {
    const seen = new Set();
    const io = new IntersectionObserver(es => {
      es.forEach(en => en.isIntersecting ? seen.add(en.target) : seen.delete(en.target));
      mcta.classList.toggle('is-hidden', seen.size > 0);
    }, { threshold: 0.25 });
    ['.hero-actions', '#view-explore'].forEach(s => { const el = $(s); el && io.observe(el); });
  }

  /* ---------- boot ---------- */
  document.addEventListener('DOMContentLoaded', () => {
    PF.paintIcons();
    PF.state.site = PF.snapshot(PF.places[0], PF.places[0].name);
    PF.loc && PF.loc.init();
    PF.home && PF.home.init();
    PF.builder && PF.builder.init();
    PF.report && PF.report.init();
    show(location.hash.replace('#', '') || 'home', { keepScroll: true });
  });
})();
