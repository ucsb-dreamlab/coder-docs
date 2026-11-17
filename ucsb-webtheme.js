/**
 * UCSB Web Theme — Bootstrap 5 Vanilla JS Base (ucsb-webtheme.js)
 * Ported from https://webtheme-demo.brand.ucsb.edu/themes/ucsbweb/js/scripts.js
 *
 * Replaces jQuery & Drupal.behaviors with clean, dependency-free DOM code
 * compatible with Bootstrap 5 and Quarto static sites:
 * - Header & Footer hoisting and dynamic body topOffset()
 * - Sticky header shrink on scroll > 150px (logoSize / body.scroll)
 * - Eyebrow Quick Links dropdown toggle (quickLinks)
 * - Eyebrow Search drawer toggle + Quarto search integration (searchForm)
 * - Mobile navbar collapse toggle (subMenuFixed)
 * - Secondary / local navigation toggle (secondaryNav)
 * - Escape key & outside-click menu closing (closeMenus)
 * - Automatic external-link SVG icon injection (offsiteLink)
 * - Smooth anchor jumplink scrolling accounting for fixed header (jumplink)
 * - Accessible iframe titles & Quarto relative path resolution
 */
(function () {
  'use strict';

  var OFFSITE_SVG =
    '<svg class="offsite" width="12px" height="12px" viewBox="0 0 12 12" version="1.1" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="(external link)">' +
    '<title>(external link)</title>' +
    '<g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">' +
    '<polygon fill="#005AA3" fill-rule="nonzero" points="2 2 5 2 5 3.45703125 3.4375 3.45703125 3.4375 8.5625 8.5625 8.5625 8.5625 7 10 7 10 10 2 10"></polygon>' +
    '<polygon fill="#005AA3" fill-rule="nonzero" points="6.17317708 2 10 2 10 5.82682292 8.70833333 4.53515625 6.46940104 6.77408854 5.22591146 5.53059896 7.46484375 3.29166667"></polygon>' +
    '</g></svg>';

  var GUIDE_TITLES = {
    'getting-started': 'Getting Started',
    'ai-gateway': 'AI Gateway',
    'managing-workspaces': 'Managing Workspaces',
    'troubleshooting-FAQ': 'Troubleshooting',
    'courses': 'For Courses & TAs',
    'gpu-cuda': 'GPU & CUDA Guide',
    'docker': 'Docker in Workspaces',
    'ssh-local-ide': 'Local VS Code & SSH',
    'sharing-ports': 'Sharing Apps & Ports',
    'github-git': 'Git & GitHub Setup',
    'storage-files': 'Storage & Files'
  };

  function getOffset() {
    var meta = document.querySelector('meta[name="quarto:offset"]');
    return meta ? meta.getAttribute('content') || './' : './';
  }

  function resolveHref(relPath) {
    var offset = getOffset();
    if (offset.slice(-1) !== '/') {
      offset += '/';
    }
    return offset + relPath.replace(/^\.\//, '');
  }

  function isDesktop() {
    return window.innerWidth >= 768;
  }

  /* 1. Hoist UCSB Header (#navbar) and Footer (#ucsb-site-footer) to <body> */
  function hoistHeaderAndFooter() {
    var header = document.getElementById('navbar');
    var footer = document.getElementById('ucsb-site-footer');

    if (header && header.parentElement !== document.body) {
      document.body.insertBefore(header, document.body.firstChild);
    }
    if (footer && footer.parentElement !== document.body) {
      document.body.appendChild(footer);
    }
    document.body.classList.add('navbar-is-fixed-top', 'logo-size-1');
  }

  /* 2. Rewrite relative links using quarto:offset and highlight active nav item */
  function initNavigationLinks() {
    var logoLink = document.querySelector('#navbar a.logo');
    if (logoLink) {
      logoLink.setAttribute('href', resolveHref('index.html'));
    }

    var path = window.location.pathname;
    var activeNav = 'home';

    if (path.indexOf('/faq') !== -1) {
      activeNav = 'faq';
    } else if (path.indexOf('/coder') !== -1 || path.indexOf('/callback') !== -1) {
      activeNav = 'coder';
    } else if (path.indexOf('/guides/getting-started') !== -1) {
      activeNav = 'getting-started';
    } else if (path.indexOf('/guides/ai-gateway') !== -1 || path.indexOf('/transcribe') !== -1) {
      activeNav = 'ai-gateway';
    } else if (path.indexOf('/guides') !== -1) {
      activeNav = 'guides';
    }

    var relLinks = document.querySelectorAll('[data-rel-href]');
    relLinks.forEach(function (link) {
      var rel = link.getAttribute('data-rel-href');
      if (rel) {
        link.setAttribute('href', resolveHref(rel));
      }
      var navId = link.getAttribute('data-nav');
      if (navId && navId === activeNav) {
        link.classList.add('is-active', 'active');
        link.setAttribute('aria-current', 'page');
        var li = link.closest('li');
        if (li) {
          li.classList.add('active');
        }
      }
    });
  }

  /* 3. Dynamic topOffset calculation for fixed header (#navbar) */
  function getStickyHeaderHeight() {
    var navbar = document.getElementById('navbar');
    if (!navbar) return 0;

    var secondaryNav = document.querySelector('.secondary-navigation');
    if (isDesktop()) {
      var navHeight = navbar.offsetHeight;
      var secHeight = secondaryNav ? secondaryNav.offsetHeight : 0;
      return navHeight + secHeight;
    }

    var headerBar = navbar.querySelector('.navbar-header');
    return headerBar ? headerBar.offsetHeight : 60;
  }

  function updateScrollPadding() {
    var stickyHeight = getStickyHeaderHeight();
    if (stickyHeight > 0) {
      document.documentElement.style.scrollPaddingTop = stickyHeight + 24 + 'px';
    }
  }

  function topOffset() {
    var navbar = document.getElementById('navbar');
    if (!navbar) return;

    var secondaryNav = document.querySelector('.secondary-navigation');
    var docHero = document.querySelector('body > .doc-hero');
    var quartoContent = document.getElementById('quarto-content') || document.getElementById('body');
    var topTarget = docHero || quartoContent;

    if (isDesktop()) {
      document.body.classList.remove('mobile-menu');
      document.body.classList.add('no-menu');
      var navHeight = navbar.offsetHeight;
      var secHeight = secondaryNav ? secondaryNav.offsetHeight : 0;
      if (secondaryNav) {
        secondaryNav.style.top = navHeight + 'px';
      }
      if (docHero && quartoContent) {
        docHero.style.marginTop = navHeight + secHeight + 'px';
        quartoContent.style.marginTop = '0px';
      } else if (topTarget) {
        topTarget.style.marginTop = navHeight + secHeight + 'px';
      }
    } else {
      var headerBar = navbar.querySelector('.navbar-header');
      var mobileHeight = headerBar ? headerBar.offsetHeight : 60;
      if (secondaryNav) {
        secondaryNav.style.top = '0px';
      }
      if (docHero && quartoContent) {
        docHero.style.marginTop = mobileHeight + 'px';
        quartoContent.style.marginTop = '0px';
      } else if (topTarget) {
        topTarget.style.marginTop = mobileHeight + 'px';
      }
    }

    updateScrollPadding();
  }

  /* 4. Shrink logo on scroll > 150px (logoSize) */
  function logoSize() {
    var scrollTop = window.pageYOffset || document.documentElement.scrollTop || 0;
    var navbar = document.getElementById('navbar');
    var secondaryNav = document.querySelector('.secondary-navigation');

    if (scrollTop > 150) {
      if (!document.body.classList.contains('scroll')) {
        document.body.classList.add('scroll');
        if (navbar && isDesktop()) {
          setTimeout(function () {
            if (secondaryNav) {
              secondaryNav.style.top = navbar.offsetHeight + 'px';
            }
            updateScrollPadding();
          }, 260);
        }
      }
    } else {
      if (document.body.classList.contains('scroll')) {
        document.body.classList.remove('scroll');
        if (navbar && isDesktop()) {
          setTimeout(function () {
            if (secondaryNav) {
              secondaryNav.style.top = navbar.offsetHeight + 'px';
            }
            updateScrollPadding();
          }, 260);
        }
      }
    }
  }

  /* 5. Close Quick Links / Search / Mobile menus */
  function closeQuickLinks() {
    var ql = document.querySelector('#eyebrow .quick-links');
    if (!ql) return;
    ql.classList.remove('expanded');
    var link = ql.querySelector('a');
    if (link) link.setAttribute('aria-expanded', 'false');
    var menu = ql.querySelector('ul.menu');
    if (menu) menu.setAttribute('aria-hidden', 'true');
  }

  function closeSearch() {
    var eyebrow = document.getElementById('eyebrow');
    var search = document.querySelector('#eyebrow .search');
    if (!search) return;
    search.classList.remove('expanded');
    if (eyebrow) eyebrow.classList.remove('search-expanded');
    var block = search.querySelector('.block-search-form-block');
    if (block) block.setAttribute('aria-hidden', 'true');
  }

  function closeMobileMenu() {
    var collapse = document.getElementById('navbar-collapse');
    var toggle = document.querySelector('#navbar .navbar-toggle');
    if (collapse) {
      collapse.classList.remove('in', 'show');
    }
    if (toggle) {
      toggle.classList.add('collapsed');
      toggle.setAttribute('aria-expanded', 'false');
    }
    document.body.classList.remove('mobile-menu');
    document.body.classList.add('no-menu');
  }

  /* 6. Eyebrow Quick Links toggle (quickLinks) */
  function initQuickLinks() {
    var ql = document.querySelector('#eyebrow .quick-links');
    if (!ql) return;
    var trigger = ql.querySelector(':scope > a');
    var chevron = ql.querySelector(':scope > svg');
    var menu = ql.querySelector('ul.menu');

    function toggleQL(e) {
      e.preventDefault();
      e.stopPropagation();
      var isExpanded = ql.classList.contains('expanded');
      closeSearch();
      if (isExpanded) {
        closeQuickLinks();
      } else {
        ql.classList.add('expanded');
        if (trigger) trigger.setAttribute('aria-expanded', 'true');
        if (menu) menu.setAttribute('aria-hidden', 'false');
      }
    }

    if (trigger) trigger.addEventListener('click', toggleQL);
    if (chevron) chevron.addEventListener('click', toggleQL);
  }

  /* 7. Eyebrow Search button -> Quarto Autocomplete Search overlay */
  function triggerQuartoSearch(queryText) {
    // Open Quarto's built-in Fuse.js search overlay if available
    var quartoBtn = document.querySelector('#quarto-search button.aa-DetachedSearchButton');
    if (quartoBtn) {
      closeSearch();
      quartoBtn.click();
      setTimeout(function () {
        var input = document.querySelector('.aa-Input');
        if (input) {
          if (queryText) {
            input.value = queryText;
            input.dispatchEvent(new Event('input', { bubbles: true }));
          }
          input.focus();
        }
      }, 80);
      return true;
    }
    return false;
  }

  function initSearchForm() {
    var btn = document.getElementById('search-toggle-container');
    if (!btn) return;

    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      closeQuickLinks();
      closeSearch();
      if (!triggerQuartoSearch('')) {
        window.location.href = resolveHref('index.html?show-results=1');
      }
    });
  }

  /* 8. Mobile Navbar Toggle (subMenuFixed) */
  function initMobileMenu() {
    var toggle = document.querySelector('#navbar .navbar-toggle');
    var collapse = document.getElementById('navbar-collapse');
    if (!toggle || !collapse) return;

    toggle.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      var isOpen = collapse.classList.contains('in') || collapse.classList.contains('show');
      if (isOpen) {
        closeMobileMenu();
      } else {
        collapse.classList.add('in', 'show');
        toggle.classList.remove('collapsed');
        toggle.setAttribute('aria-expanded', 'true');
        document.body.classList.add('mobile-menu');
        document.body.classList.remove('no-menu');
      }
    });
  }

  /* 9. Escape key & outside click handlers (closeMenus) */
  function initDismissHandlers() {
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' || e.keyCode === 27) {
        var search = document.querySelector('#eyebrow .search.expanded');
        var ql = document.querySelector('#eyebrow .quick-links.expanded');
        var mobileOpen = document.body.classList.contains('mobile-menu');

        if (search) {
          closeSearch();
        } else if (ql) {
          closeQuickLinks();
        } else if (mobileOpen) {
          closeMobileMenu();
        }
      }
    });

    document.addEventListener('click', function (e) {
      var ql = document.querySelector('#eyebrow .quick-links.expanded');
      if (ql && !ql.contains(e.target)) {
        closeQuickLinks();
      }
      var search = document.querySelector('#eyebrow .search.expanded');
      if (search && !search.contains(e.target)) {
        closeSearch();
      }
    });
  }

  /* 10. Automatic external-link SVG icon injection (offsiteLink) */
  function initOffsiteLinks() {
    // 1. Explicit .offsite links in header/footer/content
    var explicit = document.querySelectorAll('a.offsite, a.offsite-quick-link');
    explicit.forEach(function (a) {
      if (
        !a.querySelector('svg.offsite') &&
        !(
          a.nextElementSibling &&
          a.nextElementSibling.tagName &&
          a.nextElementSibling.tagName.toLowerCase() === 'svg' &&
          a.nextElementSibling.classList.contains('offsite')
        )
      ) {
        a.insertAdjacentHTML('beforeend', OFFSITE_SVG);
      }
    });

    // 2. External links in main prose content (not buttons or nav links)
    var contentLinks = document.querySelectorAll(
      '#quarto-document-content a[href^="http"]:not(.btn):not(.ucsb-button):not(.home-button):not(.home-link):not(.card-heading-link)'
    );
    contentLinks.forEach(function (a) {
      if (a.hostname && a.hostname === window.location.hostname) return;
      if (a.closest('.home-help__links') || a.closest('.doc-pagination')) return;
      if (a.querySelector('svg') || a.querySelector('img')) return;
      a.classList.add('offsite');
      a.insertAdjacentHTML('beforeend', OFFSITE_SVG);
    });
  }

  /* 11. Smooth anchor jumplinks accounting for fixed #navbar height (jumplink) */
  function findAnchorTarget(hash) {
    if (!hash || hash.charAt(0) !== '#' || hash.length < 2) return null;
    var id = hash.slice(1);
    try {
      id = decodeURIComponent(id);
    } catch (e) {
      // keep raw id
    }
    return document.getElementById(id) || document.getElementsByName(id)[0] || null;
  }

  function scrollToHash(hash, smooth) {
    var target = findAnchorTarget(hash);
    if (!target) return false;
    var offset = getStickyHeaderHeight() + 24;
    var y = target.getBoundingClientRect().top + window.pageYOffset - offset;
    window.scrollTo({
      top: Math.max(0, y),
      behavior: smooth ? 'smooth' : 'instant'
    });
    return true;
  }

  function initJumpLinks() {
    document.addEventListener('click', function (e) {
      var a = e.target.closest ? e.target.closest('a[href*="#"]') : null;
      if (!a || a.hasAttribute('data-bs-toggle')) return;
      var rawHref = a.getAttribute('href');
      if (!rawHref || rawHref === '#' || rawHref.indexOf('javascript:') === 0) return;

      var hash = a.hash;
      if (!hash || hash.length < 2) return;

      // Only intercept links pointing to the current page
      if (
        a.origin !== window.location.origin ||
        a.pathname !== window.location.pathname ||
        a.search !== window.location.search
      ) {
        return;
      }

      if (!findAnchorTarget(hash)) return;
      e.preventDefault();
      scrollToHash(hash, true);
      if (window.location.hash !== hash) {
        history.pushState(null, '', hash);
      }
    });

    window.addEventListener('hashchange', function () {
      if (window.location.hash) {
        scrollToHash(window.location.hash, true);
      }
    });
  }

  /* 12. Quarto Documentation Layout Enhancements (Hero, 3-col Sidebar, Pagination, Code headers, Screenshots) */
  function initQuartoDocsEnhancements() {
    var path = window.location.pathname;
    var activeNav = 'home';
    if (path.indexOf('/faq') !== -1) {
      activeNav = 'faq';
    } else if (path.indexOf('/coder') !== -1) {
      activeNav = 'coder';
    } else if (path.indexOf('/guides/getting-started') !== -1) {
      activeNav = 'getting-started';
    } else if (path.indexOf('/guides/ai-gateway') !== -1) {
      activeNav = 'ai-gateway';
    } else if (path.indexOf('/guides') !== -1) {
      activeNav = 'guides';
    }

    var isFullPage =
      document.body.classList.contains('full-page-custom') ||
      Boolean(document.querySelector('.home-intro, .faq-page, .guides-hub-page'));
    var titleBlock = document.getElementById('title-block-header');
    var quartoContent = document.getElementById('quarto-content');

    if (!isFullPage && titleBlock && quartoContent) {
      document.body.classList.add('is-doc-page');
      var h1 = titleBlock.querySelector('h1.title');
      var pageTitle = h1 ? h1.textContent.trim() : document.title;
      var subtitleEl = titleBlock.querySelector('.subtitle, p.subtitle');
      var pageSubtitle = subtitleEl ? subtitleEl.textContent.trim() : '';

      var eyebrowText = 'Documentation';
      var parentCrumbHtml = '';
      if (activeNav === 'getting-started') {
        eyebrowText = 'Getting Started';
        parentCrumbHtml =
          '<a href="' +
          resolveHref('guides/index.html') +
          '">Guides</a><span aria-hidden="true">/</span>';
      } else if (activeNav === 'ai-gateway') {
        eyebrowText = 'AI Services';
      } else if (activeNav === 'coder') {
        eyebrowText = 'Coder Workspaces';
      } else if (activeNav === 'guides') {
        eyebrowText = 'Guides';
        parentCrumbHtml =
          '<a href="' +
          resolveHref('guides/index.html') +
          '">Guides</a><span aria-hidden="true">/</span>';
      }

      var heroBanner = document.createElement('div');
      heroBanner.className = 'doc-hero background-color-dae6e6';
      heroBanner.innerHTML =
        '<div class="site-grid">' +
        '<nav class="breadcrumbs" aria-label="Breadcrumb">' +
        '<a href="' +
        resolveHref('index.html') +
        '">Home</a>' +
        '<span aria-hidden="true">/</span>' +
        parentCrumbHtml +
        '<span aria-current="page">' +
        pageTitle +
        '</span>' +
        '</nav>' +
        '<div class="doc-hero__heading">' +
        '<div>' +
        '<p class="eyebrow label">' +
        eyebrowText +
        '</p>' +
        '<h1>' +
        pageTitle +
        '</h1>' +
        (pageSubtitle ? '<p class="doc-hero__subtitle">' + pageSubtitle + '</p>' : '') +
        '</div>' +
        '</div>' +
        '</div>';

      quartoContent.parentNode.insertBefore(heroBanner, quartoContent);
      titleBlock.remove();

      var marginSidebar = document.getElementById('quarto-margin-sidebar');
      if (marginSidebar) {
        quartoContent.appendChild(marginSidebar);
      }
      document
        .querySelectorAll('.quarto-sidebar-toggle-contents, .quarto-alternate-notebooks')
        .forEach(function (el) {
          el.remove();
        });

      var guideItems = [
        { title: 'Overview', href: 'coder.html' },
        { title: 'Getting Started', href: 'guides/getting-started.html' },
        { title: 'Transferring Files', href: 'guides/file-transfer.html' },
        { title: 'RStudio', href: 'guides/rstudio.html' },
        { title: 'Marimo Notebooks', href: 'guides/marimo.html' },
        { title: 'Using AI Coding Agents', href: 'guides/ai-agents.html' },
        { title: 'DREAM Lab AI Gateway', href: 'guides/ai-gateway.html' },
        { title: 'UCSB AI Commons API', href: 'guides/ucsb_ai_commons.html' }
      ];

      var sidebarAside = document.createElement('aside');
      sidebarAside.className = 'docs-sidebar';
      var navHtml =
        '<nav aria-label="Documentation pages"><p class="docs-sidebar__title">Documentation</p>';
      var currentIdx = -1;

      guideItems.forEach(function (item, idx) {
        var resolved = resolveHref(item.href);
        var isCurrent =
          path.slice(-item.href.length) === item.href ||
          path.indexOf(item.href.replace('.html', '')) !== -1;
        if (isCurrent) currentIdx = idx;
        var num = String(idx + 1).padStart(2, '0');
        navHtml +=
          '<a class="' +
          (isCurrent ? 'is-current' : '') +
          '" href="' +
          resolved +
          '"' +
          (isCurrent ? ' aria-current="page"' : '') +
          '>' +
          '<span>' +
          num +
          '</span>' +
          item.title +
          '</a>';
      });
      navHtml += '</nav>';
      navHtml +=
        '<div class="sidebar-help">' +
        '<strong>Need a hand?</strong>' +
        '<p>DREAM Lab staff can help you configure your workspace or workflow.</p>' +
        '<a href="mailto:dreamlab@library.ucsb.edu">Contact support</a>' +
        '</div>';
      sidebarAside.innerHTML = navHtml;

      quartoContent.insertBefore(sidebarAside, quartoContent.firstChild);

      var mainEl = document.getElementById('quarto-document-content');
      if (mainEl && currentIdx !== -1) {
        var prevItem =
          currentIdx > 0
            ? guideItems[currentIdx - 1]
            : { title: 'Cloud Services Home', href: 'index.html' };
        var nextItem =
          currentIdx < guideItems.length - 1
            ? guideItems[currentIdx + 1]
            : { title: 'Frequently Asked Questions', href: 'faq.html' };
        var pagNav = document.createElement('nav');
        pagNav.className = 'doc-pagination';
        pagNav.setAttribute('aria-label', 'Guide pagination');
        pagNav.innerHTML =
          '<a href="' +
          resolveHref(prevItem.href) +
          '">' +
          '<span>Previous</span>' +
          '<strong>' +
          prevItem.title +
          '</strong>' +
          '</a>' +
          '<a href="' +
          resolveHref(nextItem.href) +
          '" class="doc-pagination__next">' +
          '<span>Next</span>' +
          '<strong>' +
          nextItem.title +
          '</strong>' +
          '</a>';
        mainEl.appendChild(pagNav);
      }
    }

    // Enhance code blocks with UCSB terminal/language header bar
    var codeScaffolds = document.querySelectorAll(
      '.code-copy-outer-scaffold, div.sourceCode'
    );
    var processedScaffolds = new Set();
    codeScaffolds.forEach(function (el) {
      var container = el.classList.contains('code-copy-outer-scaffold')
        ? el
        : el.closest('.code-copy-outer-scaffold') || el;
      if (processedScaffolds.has(container)) return;
      processedScaffolds.add(container);

      var codeEl = container.querySelector('code');
      var lang = 'Terminal';
      if (codeEl) {
        var classes = (codeEl.className || '').split(/\s+/);
        for (var i = 0; i < classes.length; i++) {
          var c = classes[i];
          if (c && c !== 'sourceCode') {
            if (c === 'sh' || c === 'bash' || c === 'zsh') lang = 'Terminal';
            else if (c === 'python' || c === 'py') lang = 'Python';
            else if (c === 'r') lang = 'R';
            else if (c === 'json') lang = 'JSON';
            else if (c === 'yaml' || c === 'yml') lang = 'YAML';
            else if (c === 'text' || c === 'txt') lang = 'Config';
            else lang = c.toUpperCase();
            break;
          }
        }
      }

      container.classList.add('ucsb-code-block');
      var headerBar = document.createElement('div');
      headerBar.className = 'code-block__header';
      var langSpan = document.createElement('span');
      langSpan.textContent = lang;
      headerBar.appendChild(langSpan);

      var copyBtn = container.querySelector('.code-copy-button');
      if (copyBtn) {
        copyBtn.innerHTML =
          '<span class="copy-icon" aria-hidden="true"></span><span class="copy-label">Copy</span>';
        copyBtn.setAttribute('aria-label', 'Copy code to clipboard');
        // Quarto's clipboard.js handler expects the button to sit beside the
        // <code>; since we move it into the header, handle copying ourselves.
        copyBtn.classList.remove('code-copy-button');
        copyBtn.classList.add('ucsb-copy-button');
        copyBtn.addEventListener('click', function (ev) {
          ev.preventDefault();
          var code = container.querySelector('pre code') || container.querySelector('code');
          if (!code) return;
          var clone = code.cloneNode(true);
          clone.querySelectorAll('.code-annotation-anchor, button').forEach(function (n) { n.remove(); });
          var text = clone.textContent;
          if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text);
          } else {
            var ta = document.createElement('textarea');
            ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
            document.body.appendChild(ta); ta.select();
            try { document.execCommand('copy'); } catch (e) {}
            ta.remove();
          }
          var lbl = copyBtn.querySelector('.copy-label');
          if (lbl) {
            lbl.textContent = 'Copied';
            setTimeout(function () {
              lbl.textContent = 'Copy';
            }, 1800);
          }
        });
        headerBar.appendChild(copyBtn);
      }
      container.insertBefore(headerBar, container.firstChild);
    });

    // Frame documentation figures with the UCSB browser bar style
    var figures = document.querySelectorAll(
      '#quarto-document-content figure.figure'
    );
    figures.forEach(function (fig) {
      var img = fig.querySelector('img');
      if (!img || fig.closest('.no-browser-frame')) return;
      fig.classList.add('screenshot');
      var canvas = document.createElement('div');
      canvas.className = 'screenshot__canvas';
      var browserBar = document.createElement('div');
      browserBar.className = 'screenshot__browser';
      browserBar.setAttribute('aria-hidden', 'true');
      browserBar.innerHTML =
        '<i></i><i></i><i></i><span>coder.dreamlab.ucsb.edu</span>';
      canvas.appendChild(browserBar);
      var imgWrapper =
        img.parentElement.tagName === 'P' ? img.parentElement : img;
      canvas.appendChild(imgWrapper);
      fig.insertBefore(canvas, fig.firstChild);
    });

    // Accessible iframe titles (from ucsbweb scripts.js)
    document.querySelectorAll('iframe').forEach(function (iframe) {
      if (!iframe.getAttribute('title')) {
        var src = iframe.getAttribute('src') || 'Embedded content';
        iframe.setAttribute('title', src);
      }
    });
  }

  function init() {
    hoistHeaderAndFooter();
    initNavigationLinks();
    initQuickLinks();
    initSearchForm();
    initMobileMenu();
    initDismissHandlers();
    initQuartoDocsEnhancements();
    initOffsiteLinks();
    initJumpLinks();
    topOffset();
    logoSize();

    if (window.location.hash) {
      scrollToHash(window.location.hash, false);
      logoSize();
    }

    window.addEventListener('scroll', logoSize, { passive: true });
    window.addEventListener('resize', topOffset);
    window.addEventListener('load', function () {
      topOffset();
      if (window.location.hash) {
        scrollToHash(window.location.hash, false);
        logoSize();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
