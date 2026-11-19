// freegraha.in — page behaviour
(function () {
    'use strict';

    var $ = function (id) { return document.getElementById(id); };

    /* ---------- Starfield (same as webgraha.com) ---------- */
    (function () {
        var field = $('starfield');
        if (!field) return;
        var count = parseInt(field.getAttribute('data-star-count'), 10) || 130;
        var frag = document.createDocumentFragment();
        for (var i = 0; i < count; i++) {
            var star = document.createElement('span');
            var size = (Math.random() * 1.8 + 0.6).toFixed(2);
            star.className = 'star';
            star.style.left = (Math.random() * 100) + '%';
            star.style.top = (Math.random() * 100) + '%';
            star.style.width = size + 'px';
            star.style.height = size + 'px';
            star.style.animationDuration = (Math.random() * 3.5 + 2) + 's';
            star.style.animationDelay = (Math.random() * 4) + 's';
            frag.appendChild(star);
        }
        field.appendChild(frag);
    })();

    /* ---------- Mobile menu ---------- */
    (function () {
        var btn = $('menu-btn'), menu = $('mobile-menu'), icon = $('menu-icon');
        if (!btn || !menu) return;
        function setOpen(open) {
            menu.hidden = !open;
            btn.setAttribute('aria-expanded', String(open));
            btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
            icon.className = open ? 'fa-solid fa-xmark' : 'fa-solid fa-bars';
        }
        btn.addEventListener('click', function (e) { e.stopPropagation(); setOpen(menu.hidden); });
        menu.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { setOpen(false); }); });
        document.addEventListener('click', function (e) { if (!menu.contains(e.target)) setOpen(false); });
        document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setOpen(false); });
    })();

    /* ---------- Project directory ----------
       Cards are pre-rendered into the HTML by scripts/build.mjs (so search
       engines and AI crawlers can read them); this only filters them. */
    (function () {
        var grid = $('projects-grid'), search = $('project-search'),
            countEl = $('project-count'), empty = $('projects-empty');
        if (!grid) return;
        var cards = Array.prototype.slice.call(grid.querySelectorAll('.project-card'));
        var total = cards.length;
        var initialCount = countEl.innerHTML;

        function render() {
            var q = (search.value || '').trim().toLowerCase();
            var shown = 0;
            cards.forEach(function (c) {
                var match = !q || (c.getAttribute('data-search') || '').indexOf(q) !== -1;
                c.hidden = !match;
                if (match) shown++;
            });

            countEl.innerHTML = q && total
                ? '<strong>' + shown + '</strong> of ' + total + ' projects'
                : initialCount;

            empty.hidden = shown > 0;
            if (!shown) {
                var searching = total > 0;
                $('empty-title').textContent = searching ? 'Nothing in this orbit' : 'First launches incoming';
                $('empty-text').textContent = searching
                    ? 'No projects match “' + search.value.trim() + '”. Try another name or tag.'
                    : 'Projects built by WebGraha will appear here as they go live.';
                $('empty-cta').hidden = searching;
            }
        }

        search.addEventListener('input', render);
        render();
    })();

    /* ---------- Scroll reveal ---------- */
    (function () {
        var items = document.querySelectorAll('.reveal');
        if (!('IntersectionObserver' in window)) {
            items.forEach(function (n) { n.classList.add('is-visible'); });
            return;
        }
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    io.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
        items.forEach(function (n) { io.observe(n); });
    })();

    /* ---------- Floating pill: hide over the hero ---------- */
    (function () {
        var pill = $('float-pill'), hero = $('top');
        if (!pill || !hero || !('IntersectionObserver' in window)) return;
        new IntersectionObserver(function (e) {
            pill.classList.toggle('is-hidden', e[0].intersectionRatio > 0.5);
        }, { threshold: [0, 0.5, 1] }).observe(hero);
    })();

    var year = $('year');
    if (year) year.textContent = new Date().getFullYear();
})();
