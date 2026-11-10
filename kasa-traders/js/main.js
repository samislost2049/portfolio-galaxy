/**
 * KASA TRADERS - Luxury UAE-India Trading House
 * Core JavaScript Engine: Transitions, Reveals, Stats, Filters, and Micro-interactions
 */

document.addEventListener('DOMContentLoaded', () => {
  initHeader();
  initPageTransitions();
  initScrollReveals();
  initStatCounters();
  initTimelineProgress();
  initCategoryFilters();
  initCategoryShowcase();
  initSpecModal();
  initContactForm();
});

/* --------------------------------------------------------------------------
   1. HEADER SCROLL & MOBILE MENU
   -------------------------------------------------------------------------- */
function initHeader() {
  const header = document.querySelector('.site-header');
  const toggleBtn = document.querySelector('.mobile-toggle');
  const drawer = document.querySelector('.mobile-nav-drawer');
  const overlay = document.querySelector('.mobile-drawer-overlay');

  if (header) {
    const handleScroll = () => {
      if (window.scrollY > 30) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
  }

  if (toggleBtn && drawer && overlay) {
    const toggleMenu = (open) => {
      const isOpen = open !== undefined ? open : !drawer.classList.contains('open');
      drawer.classList.toggle('open', isOpen);
      overlay.classList.toggle('active', isOpen);
      toggleBtn.classList.toggle('is-active', isOpen);
      toggleBtn.setAttribute('aria-expanded', isOpen.toString());
      document.body.style.overflow = isOpen ? 'hidden' : '';
    };

    toggleBtn.addEventListener('click', () => toggleMenu());
    overlay.addEventListener('click', () => toggleMenu(false));

    // Close on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && drawer.classList.contains('open')) {
        toggleMenu(false);
      }
    });

    // Close when navigating via drawer link
    drawer.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => toggleMenu(false));
    });
  }
}

/* --------------------------------------------------------------------------
   2. PAGE TRANSITIONS (CROSS-DOCUMENT WITH REFINED FALLBACK)
   -------------------------------------------------------------------------- */
function initPageTransitions() {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Gracefully remove any lingering transition state on page load/show/focus
  const clearTransition = () => {
    document.body.classList.remove('page-transitioning');
  };
  clearTransition();
  window.addEventListener('pageshow', clearTransition);
  window.addEventListener('focus', clearTransition);

  if (prefersReducedMotion || window.location.protocol === 'file:') return;

  // Intercept local page links for a smooth luxury fade-out
  document.querySelectorAll('a[href]').forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');

      // Skip external links, hashes, mailto, tel, target _blank, or modifier key clicks
      if (!href || 
          href.startsWith('#') || 
          href.startsWith('mailto:') || 
          href.startsWith('tel:') || 
          href.startsWith('javascript:') ||
          link.getAttribute('target') === '_blank' ||
          link.getAttribute('target') === '_self' ||
          link.closest('.site-header') ||
          e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
        return;
      }

      // Check if it points to an internal page
      try {
        const currentUrl = new URL(window.location.href);
        const targetUrl = new URL(link.href, window.location.href);

        if ((currentUrl.origin === targetUrl.origin || window.location.protocol === 'file:') && currentUrl.pathname !== targetUrl.pathname) {
          // If native cross-document view transitions are active, let the browser handle it
          if ('startViewTransition' in document && document.viewTransition) {
            return;
          }

          e.preventDefault();
          document.body.classList.add('page-transitioning');

          setTimeout(() => {
            window.location.href = href;
            setTimeout(clearTransition, 350);
          }, 100);
        }
      } catch (err) {
        // Fallback to normal navigation
      }
    });
  });
}

/* --------------------------------------------------------------------------
   3. SCROLL REVEALS (INTERSECTION OBSERVER)
   -------------------------------------------------------------------------- */
function initScrollReveals() {
  const reveals = document.querySelectorAll('.reveal-on-scroll, .stagger-group');
  if (!reveals.length) return;

  const revealEl = (el) => {
    el.classList.add('is-revealed');
  };

  // Immediately reveal any elements in the initial viewport
  reveals.forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.top <= window.innerHeight * 0.92) {
      revealEl(el);
    }
  });

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        revealEl(entry.target);
        obs.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.05,
    rootMargin: '40px 0px 0px 0px'
  });

  reveals.forEach(el => {
    if (!el.classList.contains('is-revealed')) {
      observer.observe(el);
    }
  });
}

/* --------------------------------------------------------------------------
   4. ANIMATED STAT COUNTERS
   -------------------------------------------------------------------------- */
function initStatCounters() {
  const statSection = document.querySelector('.stats-section');
  const statNumbers = document.querySelectorAll('.stat-count');
  if (!statSection || !statNumbers.length) return;

  let hasAnimated = false;

  const formatNumber = (num) => {
    return num.toLocaleString('en-US');
  };

  const runCounters = () => {
    if (hasAnimated) return;
    hasAnimated = true;

    statNumbers.forEach(stat => {
      const target = parseFloat(stat.getAttribute('data-target') || '0');
      const prefix = stat.getAttribute('data-prefix') || '';
      const suffix = stat.getAttribute('data-suffix') || '';
      const duration = 800;
      const startTime = performance.now();

      const updateCount = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Luxury cubic out easing
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const currentVal = Math.floor(easeOut * target);

        stat.textContent = `${prefix}${formatNumber(currentVal)}${suffix}`;

        if (progress < 1) {
          requestAnimationFrame(updateCount);
        } else {
          stat.textContent = `${prefix}${formatNumber(target)}${suffix}`;
        }
      };

      requestAnimationFrame(updateCount);
    });
  };

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        runCounters();
        obs.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.25
  });

  observer.observe(statSection);
}

/* --------------------------------------------------------------------------
   5. TIMELINE PROGRESSIVE REVEAL (ABOUT PAGE)
   -------------------------------------------------------------------------- */
function initTimelineProgress() {
  const timeline = document.querySelector('.timeline-wrap');
  const items = document.querySelectorAll('.timeline-item');
  const progressBar = document.querySelector('.timeline-spine-progress');

  if (!timeline || !items.length) return;

  // Reveal milestone cards on scroll
  const itemObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
      }
    });
  }, {
    threshold: 0.2,
    rootMargin: '0px 0px -80px 0px'
  });

  items.forEach(item => itemObserver.observe(item));

  // Animate the vertical line progress based on scroll
  if (progressBar) {
    const updateProgress = () => {
      const rect = timeline.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const totalHeight = rect.height;

      // Start when timeline enters 70% of viewport, finish when bottom reaches center
      const start = viewportHeight * 0.7;
      const current = start - rect.top;
      const percent = Math.min(Math.max((current / totalHeight) * 100, 0), 100);

      progressBar.style.height = `${percent}%`;
    };

    window.addEventListener('scroll', updateProgress, { passive: true });
    updateProgress();
  }
}

/* --------------------------------------------------------------------------
   6. CATEGORY FILTER TABS (TEXTILES, FURNITURE, AGRICULTURE)
   -------------------------------------------------------------------------- */
function initCategoryFilters() {
  const filterTabs = document.querySelectorAll('.filter-tab');
  const productCards = document.querySelectorAll('.product-card');

  if (!filterTabs.length || !productCards.length) return;

  filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const filterValue = tab.getAttribute('data-filter');

      // Update active tab UI
      filterTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      // Filter product items with smooth stagger
      productCards.forEach((card, index) => {
        const category = card.getAttribute('data-category');
        const matches = filterValue === 'all' || category === filterValue;

        if (matches) {
          card.classList.remove('hidden');
          card.style.opacity = '0';
          card.style.transform = 'translateY(12px)';
          setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
          }, index * 15);
        } else {
          card.classList.add('hidden');
        }
      });
    });
  });
}

/* --------------------------------------------------------------------------
   6b. CATEGORY SHOWCASE (TEXTILES) - PRODUCTS REVEAL ON CATEGORY SELECT
   -------------------------------------------------------------------------- */
function initCategoryShowcase() {
  const showcaseSection = document.getElementById('categoryShowcaseSection');
  const productsSection = document.getElementById('productsSection');
  const showcase = document.getElementById('categoryShowcase');
  const grid = document.getElementById('productsGrid');
  const backBtn = document.getElementById('backToCategories');
  const titleEl = document.getElementById('activeCategoryTitle');
  const descEl = document.getElementById('activeCategoryDesc');
  const countEl = document.getElementById('activeCategoryCount');

  if (!showcaseSection || !productsSection || !showcase || !grid || !backBtn) return;

  const tiles = Array.from(showcase.querySelectorAll('.category-tile'));
  const cards = Array.from(grid.querySelectorAll('.product-card'));

  const scrollToSection = (section) => {
    const y = section.getBoundingClientRect().top + window.scrollY - 110;
    window.scrollTo({ top: y, behavior: 'smooth' });
  };

  const openCategory = (slug) => {
    const tile = tiles.find(t => t.dataset.category === slug);
    if (!tile) return;

    const count = parseInt(tile.dataset.count, 10);

    titleEl.textContent = tile.dataset.name;
    descEl.textContent = tile.dataset.desc;
    countEl.textContent = count + (count === 1 ? ' Product' : ' Products');

    cards.forEach(card => {
      card.classList.toggle('hidden', card.dataset.category !== slug);
    });

    showcaseSection.hidden = true;
    productsSection.hidden = false;
    scrollToSection(productsSection);

    const url = new URL(window.location.href);
    url.searchParams.set('filter', slug);
    window.history.replaceState(null, '', url);
  };

  tiles.forEach(tile => {
    tile.addEventListener('click', (event) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
      event.preventDefault();
      openCategory(tile.dataset.category);
    });
  });

  backBtn.addEventListener('click', () => {
    productsSection.hidden = true;
    showcaseSection.hidden = false;
    scrollToSection(showcaseSection);

    const url = new URL(window.location.href);
    url.searchParams.delete('filter');
    window.history.replaceState(null, '', url);
  });

  const filterParam = new URLSearchParams(window.location.search).get('filter');
  if (filterParam) openCategory(filterParam);
}

/* --------------------------------------------------------------------------
   7. QUICK SPECIFICATION MODAL
   -------------------------------------------------------------------------- */
function initSpecModal() {
  const modal = document.querySelector('.spec-modal-overlay');
  const closeBtn = document.querySelector('.modal-close-btn');
  const triggerBtns = document.querySelectorAll('.view-spec-btn');

  if (!modal) return;

  const modalTitle = modal.querySelector('.modal-spec-title');
  const modalCategory = modal.querySelector('.modal-spec-category');
  const modalOrigin = modal.querySelector('.modal-spec-origin');
  const modalSpecsList = modal.querySelector('.modal-specs-details');
  const modalInquireBtn = modal.querySelector('.modal-inquire-link');

  const openModal = (btn) => {
    const card = btn.closest('.product-card');
    if (!card) return;

    const title = card.querySelector('.product-title')?.textContent || 'Product Specification';
    const category = card.querySelector('.product-category-sub')?.textContent || 'Category';
    const origin = card.querySelector('.product-origin')?.textContent || 'Origin & Logistics';
    const specsData = card.getAttribute('data-specs');

    if (modalTitle) modalTitle.textContent = title;
    if (modalCategory) modalCategory.textContent = category;
    if (modalOrigin) modalOrigin.textContent = origin;

    if (modalSpecsList && specsData) {
      try {
        const parsed = JSON.parse(specsData);
        modalSpecsList.innerHTML = Object.entries(parsed).map(([key, val]) => `
          <div style="display:flex; justify-content:space-between; padding:0.65rem 0; border-bottom:1px solid rgba(176,141,63,0.15); font-size:0.9rem;">
            <span style="color:var(--color-ivory-dim); text-transform:uppercase; font-size:0.75rem; letter-spacing:0.05em;">${key}</span>
            <span style="color:var(--color-ivory-soft); font-weight:500;">${val}</span>
          </div>
        `).join('');
      } catch (err) {
        modalSpecsList.innerHTML = '<p style="color:var(--color-ivory-muted);">Standard export specifications apply.</p>';
      }
    }

    if (modalInquireBtn) {
      modalInquireBtn.setAttribute('href', `contact.html-item=${encodeURIComponent(title)}`);
    }

    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    modal.classList.remove('open');
    document.body.style.overflow = '';
  };

  triggerBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openModal(btn);
    });
  });

  if (closeBtn) closeBtn.addEventListener('click', closeModal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('open')) {
      closeModal();
    }
  });
}

/* --------------------------------------------------------------------------
   8. CONTACT FORM WITH REALTIME ANIMATED STATES & SUBMISSION TOAST
   -------------------------------------------------------------------------- */
function initContactForm() {
  const form = document.getElementById('tradeInquiryForm');
  const toast = document.getElementById('contactToast');

  if (!form) return;

  // Auto-fill inquiry subject if navigated with -item= parameter
  const urlParams = new URLSearchParams(window.location.search);
  const itemParam = urlParams.get('item');
  const messageField = document.getElementById('inquiryMessage');
  const sectorField = document.getElementById('inquirySector');

  if (itemParam && messageField) {
    messageField.value = `Inquiry regarding export terms, container lot sizes, and FOB rates for: ${itemParam}.`;
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn ? submitBtn.innerHTML : 'Submit';
    const emailTarget = form.dataset.emailTarget;

    if (emailTarget) {
      const formData = new FormData(form);
      const subject = `Custom Furniture Inquiry - ${formData.get('name') || 'Website enquiry'}`;
      const body = [
        `Name: ${formData.get('name') || ''}`,
        `Email: ${formData.get('email') || ''}`,
        `Phone: ${formData.get('phone') || ''}`,
        `Project type: ${formData.get('project') || ''}`,
        `Furniture category: ${formData.get('category') || ''}`,
        `Quantity: ${formData.get('quantity') || ''}`,
        '',
        'Project details:',
        formData.get('message') || ''
      ].join('\n');

      window.location.href = `mailto:${emailTarget}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span>Processing Transmission...</span>`;
    }

    setTimeout(() => {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }

      form.reset();

      if (toast) {
        toast.classList.add('show');
        setTimeout(() => {
          toast.classList.remove('show');
        }, 5000);
      }
    }, 250);
  });
}
