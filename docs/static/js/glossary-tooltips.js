/**
 * Drasi Glossary System
 *
 * Provides:
 * - Tooltip functionality for inline glossary terms
 * - "G" keyboard shortcut to open glossary modal
 * - Search and filter functionality on the glossary page
 * - Automatic tooltip detection for glossary terms
 */

(function () {
  'use strict';

  // ==========================================================================
  // Configuration
  // ==========================================================================

  const CONFIG = {
    tooltipDelay: 200,
    tooltipHideDelay: 100,
    modalAnimationDuration: 200,
  };

  // ==========================================================================
  // Glossary Data
  // ==========================================================================

  // Glossary terms will be loaded from the page or fetched
  let glossaryTerms = [];

  /**
   * Extract short description from a glossary entry element
   */
  function extractShortDescription(entry) {
    const defElement = entry.querySelector('.glossary-entry-definition');
    if (!defElement) return '';

    // Try to get text from <p> tag first, then fall back to direct text content
    const paragraph = defElement.querySelector('p');
    let text = paragraph
      ? paragraph.textContent
      : defElement.textContent;

    // Clean up whitespace and truncate
    text = text?.trim().replace(/\s+/g, ' ') || '';
    if (text.length > 150) {
      text = text.substring(0, 150) + '...';
    }
    return text;
  }

  /**
   * Load glossary terms from the glossary page or embedded data
   */
  async function loadGlossaryTerms() {
    // Check if we're on the glossary page and can extract terms
    const glossaryEntries = document.querySelectorAll('.glossary-entry');
    if (glossaryEntries.length > 0) {
      glossaryTerms = Array.from(glossaryEntries).map((entry) => ({
        term: entry.querySelector('.glossary-entry-term')?.textContent?.trim(),
        category: entry.dataset.category,
        aliases: entry.dataset.aliases
          ? entry.dataset.aliases.split(',')
          : [],
        short: extractShortDescription(entry),
        id: entry.id,
      }));
      return;
    }

    // Try to fetch from glossary page
    try {
      const response = await fetch('/reference/glossary/');
      if (response.ok) {
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const entries = doc.querySelectorAll('.glossary-entry');

        glossaryTerms = Array.from(entries).map((entry) => ({
          term: entry.querySelector('.glossary-entry-term')?.textContent?.trim(),
          category: entry.dataset.category,
          aliases: entry.dataset.aliases
            ? entry.dataset.aliases.split(',')
            : [],
          short: extractShortDescription(entry),
          id: entry.id,
        }));
      }
    } catch (e) {
      console.warn('Could not load glossary terms:', e);
    }
  }

  // ==========================================================================
  // Tooltip Functionality
  // ==========================================================================

  let activeTooltip = null;
  let tooltipShowTimeout = null;
  let tooltipHideTimeout = null;

  /**
   * Initialize tooltip functionality for glossary terms
   */
  function initTooltips() {
    const terms = document.querySelectorAll('.glossary-term');

    terms.forEach((term) => {
      // Mouse events
      term.addEventListener('mouseenter', handleTermMouseEnter);
      term.addEventListener('mouseleave', handleTermMouseLeave);
      term.addEventListener('focus', handleTermFocus);
      term.addEventListener('blur', handleTermBlur);

      // Keyboard activation
      term.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const tooltip = term.querySelector('.glossary-term-tooltip');
          if (tooltip) {
            showTooltip(term, tooltip);
          }
        }
        if (e.key === 'Escape') {
          hideAllTooltips();
        }
      });

      // Click to navigate to glossary
      term.addEventListener('click', (e) => {
        const link = term.querySelector('.glossary-term-tooltip-link');
        if (link && !e.target.closest('.glossary-term-tooltip-link')) {
          // Don't navigate if clicking the tooltip itself
          e.preventDefault();
        }
      });
    });

    // Global click to close tooltips
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.glossary-term')) {
        hideAllTooltips();
      }
    });
  }

  function handleTermMouseEnter(e) {
    clearTimeout(tooltipHideTimeout);
    const term = e.currentTarget;
    const tooltip = term.querySelector('.glossary-term-tooltip');

    if (tooltip) {
      tooltipShowTimeout = setTimeout(() => {
        showTooltip(term, tooltip);
      }, CONFIG.tooltipDelay);
    }
  }

  function handleTermMouseLeave(e) {
    clearTimeout(tooltipShowTimeout);
    const term = e.currentTarget;
    const tooltip = term.querySelector('.glossary-term-tooltip');

    if (tooltip) {
      tooltipHideTimeout = setTimeout(() => {
        hideTooltip(tooltip);
      }, CONFIG.tooltipHideDelay);
    }
  }

  function handleTermFocus(e) {
    const term = e.currentTarget;
    const tooltip = term.querySelector('.glossary-term-tooltip');
    if (tooltip) {
      showTooltip(term, tooltip);
    }
  }

  function handleTermBlur(e) {
    const term = e.currentTarget;
    const tooltip = term.querySelector('.glossary-term-tooltip');
    if (tooltip) {
      hideTooltip(tooltip);
    }
  }

  function showTooltip(term, tooltip) {
    hideAllTooltips();
    activeTooltip = tooltip;

    // Position the tooltip
    positionTooltip(term, tooltip);

    tooltip.classList.add('visible');
    term.setAttribute('aria-expanded', 'true');
  }

  function hideTooltip(tooltip) {
    tooltip.classList.remove('visible');
    const term = tooltip.closest('.glossary-term');
    if (term) {
      term.setAttribute('aria-expanded', 'false');
    }
    if (activeTooltip === tooltip) {
      activeTooltip = null;
    }
  }

  function hideAllTooltips() {
    document.querySelectorAll('.glossary-term-tooltip.visible').forEach((tooltip) => {
      hideTooltip(tooltip);
    });
  }

  function positionTooltip(term, tooltip) {
    const termRect = term.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Reset positioning classes
    tooltip.classList.remove('position-top', 'position-bottom', 'position-left', 'position-right');

    // Default: position below
    let position = 'bottom';

    // Check if tooltip would overflow bottom
    if (termRect.bottom + tooltipRect.height + 10 > viewportHeight) {
      position = 'top';
    }

    // Check horizontal overflow
    const tooltipLeft = termRect.left + termRect.width / 2 - tooltipRect.width / 2;
    if (tooltipLeft < 10) {
      tooltip.style.left = '10px';
      tooltip.style.transform = 'translateX(0)';
    } else if (tooltipLeft + tooltipRect.width > viewportWidth - 10) {
      tooltip.style.right = '10px';
      tooltip.style.left = 'auto';
      tooltip.style.transform = 'translateX(0)';
    }

    tooltip.classList.add(`position-${position}`);
  }

  // ==========================================================================
  // Glossary Modal (Quick Lookup)
  // ==========================================================================

  let modal = null;
  let modalSearch = null;
  let modalResults = null;

  /**
   * Create the glossary modal element
   */
  function createModal() {
    modal = document.createElement('div');
    modal.className = 'glossary-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'glossary-modal-title');
    modal.innerHTML = `
      <div class="glossary-modal-backdrop"></div>
      <div class="glossary-modal-content">
        <div class="glossary-modal-header">
          <h2 id="glossary-modal-title">
            <i class="fas fa-book"></i>
            Glossary Lookup
          </h2>
          <button class="glossary-modal-close" aria-label="Close glossary">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="glossary-modal-search">
          <i class="fas fa-search"></i>
          <input type="text"
                 id="glossary-modal-search-input"
                 placeholder="Search terms..."
                 autocomplete="off"
                 aria-label="Search glossary terms">
          <kbd>/</kbd>
        </div>
        <div class="glossary-modal-results" id="glossary-modal-results">
          <div class="glossary-modal-hint">
            <p>Type to search, or browse all terms in the <a href="/reference/glossary/">full glossary</a>.</p>
          </div>
        </div>
        <div class="glossary-modal-footer">
          <span class="glossary-modal-shortcut"><kbd>Esc</kbd> to close</span>
          <a href="/reference/glossary/" class="glossary-modal-link">
            View full glossary <i class="fas fa-arrow-right"></i>
          </a>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Get references
    modalSearch = modal.querySelector('#glossary-modal-search-input');
    modalResults = modal.querySelector('#glossary-modal-results');

    // Event listeners
    modal.querySelector('.glossary-modal-backdrop').addEventListener('click', closeModal);
    modal.querySelector('.glossary-modal-close').addEventListener('click', closeModal);
    modalSearch.addEventListener('input', handleModalSearch);

    // Keyboard navigation in modal
    modal.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeModal();
      }
      if (e.key === '/' && document.activeElement !== modalSearch) {
        e.preventDefault();
        modalSearch.focus();
      }
    });
  }

  /**
   * Open the glossary modal
   */
  function openModal() {
    if (!modal) {
      createModal();
    }

    // Load terms if not already loaded
    if (glossaryTerms.length === 0) {
      loadGlossaryTerms().then(() => {
        renderModalResults('');
      });
    }

    modal.classList.add('visible');
    document.body.classList.add('glossary-modal-open');

    // Focus search input
    setTimeout(() => {
      modalSearch.focus();
      modalSearch.select();
    }, CONFIG.modalAnimationDuration);
  }

  /**
   * Close the glossary modal
   */
  function closeModal() {
    if (!modal) return;

    modal.classList.remove('visible');
    document.body.classList.remove('glossary-modal-open');

    // Clear search
    if (modalSearch) {
      modalSearch.value = '';
    }
  }

  /**
   * Handle search input in modal
   */
  function handleModalSearch(e) {
    const query = e.target.value.toLowerCase().trim();
    renderModalResults(query);
  }

  /**
   * Render search results in modal
   */
  function renderModalResults(query) {
    if (!modalResults) return;

    if (!query) {
      // Show hint when no query
      modalResults.innerHTML = `
        <div class="glossary-modal-hint">
          <p>Type to search, or browse all terms in the <a href="/reference/glossary/">full glossary</a>.</p>
        </div>
      `;
      return;
    }

    // Filter terms
    const matches = glossaryTerms.filter((term) => {
      const termMatch = term.term?.toLowerCase().includes(query);
      const aliasMatch = term.aliases?.some((a) => a.toLowerCase().includes(query));
      return termMatch || aliasMatch;
    });

    if (matches.length === 0) {
      modalResults.innerHTML = `
        <div class="glossary-modal-empty">
          <i class="fas fa-search"></i>
          <p>No terms match "<strong>${escapeHtml(query)}</strong>"</p>
          <a href="/reference/glossary/">Browse full glossary</a>
        </div>
      `;
      return;
    }

    // Render matches
    modalResults.innerHTML = matches
      .slice(0, 10)
      .map(
        (term) => `
      <a href="/reference/glossary/#${term.id}" class="glossary-modal-result">
        <div class="glossary-modal-result-header">
          <span class="glossary-modal-result-term">${escapeHtml(term.term)}</span>
          <span class="glossary-modal-result-category glossary-modal-result-category--${term.category}">
            ${getCategoryLabel(term.category)}
          </span>
        </div>
        <p class="glossary-modal-result-description">${escapeHtml(term.short || '')}</p>
      </a>
    `
      )
      .join('');

    if (matches.length > 10) {
      modalResults.innerHTML += `
        <div class="glossary-modal-more">
          <a href="/reference/glossary/?q=${encodeURIComponent(query)}">
            View all ${matches.length} matches <i class="fas fa-arrow-right"></i>
          </a>
        </div>
      `;
    }
  }

  // ==========================================================================
  // Glossary Page Functionality
  // ==========================================================================

  /**
   * Initialize glossary page search and filter
   */
  function initGlossaryPage() {
    const searchInput = document.getElementById('glossary-search');
    const filterButtons = document.querySelectorAll('.glossary-filter');
    const glossaryList = document.getElementById('glossary-list');
    const glossaryEmpty = document.getElementById('glossary-empty');

    if (!searchInput || !glossaryList) return;

    let currentFilter = 'all';

    // Search functionality
    searchInput.addEventListener('input', (e) => {
      filterGlossary(e.target.value, currentFilter);
    });

    // Filter buttons
    filterButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        filterButtons.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.category;
        filterGlossary(searchInput.value, currentFilter);
      });
    });

    // Handle URL query parameter
    const urlParams = new URLSearchParams(window.location.search);
    const queryParam = urlParams.get('q');
    if (queryParam) {
      searchInput.value = queryParam;
      filterGlossary(queryParam, currentFilter);
    }

    // Handle hash navigation (smooth scroll to term)
    if (window.location.hash) {
      const targetTerm = document.querySelector(window.location.hash);
      if (targetTerm) {
        setTimeout(() => {
          targetTerm.scrollIntoView({ behavior: 'smooth', block: 'center' });
          targetTerm.classList.add('glossary-entry--highlighted');
          setTimeout(() => {
            targetTerm.classList.remove('glossary-entry--highlighted');
          }, 2000);
        }, 100);
      }
    }

    function filterGlossary(query, category) {
      const entries = glossaryList.querySelectorAll('.glossary-entry');
      const queryLower = query.toLowerCase().trim();
      let visibleCount = 0;

      entries.forEach((entry) => {
        const term = entry.dataset.term || '';
        const aliases = entry.dataset.aliases || '';
        const entryCategory = entry.dataset.category;

        const matchesQuery =
          !queryLower ||
          term.includes(queryLower) ||
          aliases.includes(queryLower);

        const matchesCategory =
          category === 'all' || entryCategory === category;

        if (matchesQuery && matchesCategory) {
          entry.style.display = '';
          visibleCount++;
        } else {
          entry.style.display = 'none';
        }
      });

      // Show/hide empty state
      if (glossaryEmpty) {
        glossaryEmpty.style.display = visibleCount === 0 ? 'flex' : 'none';
      }
    }
  }

  // ==========================================================================
  // Keyboard Shortcuts
  // ==========================================================================

  /**
   * Initialize keyboard shortcuts
   */
  function initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Don't trigger if user is typing in an input
      if (
        e.target.tagName === 'INPUT' ||
        e.target.tagName === 'TEXTAREA' ||
        e.target.isContentEditable
      ) {
        return;
      }

      // "G" to open glossary modal
      if (e.key === 'g' || e.key === 'G') {
        e.preventDefault();
        openModal();
      }
    });
  }

  // ==========================================================================
  // Utility Functions
  // ==========================================================================

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function getCategoryLabel(category) {
    const labels = {
      core: 'Core',
      query: 'Query',
      data: 'Data',
      infrastructure: 'Infra',
    };
    return labels[category] || category;
  }

  // ==========================================================================
  // Initialization
  // ==========================================================================

  function init() {
    // Load glossary terms
    loadGlossaryTerms();

    // Initialize tooltips
    initTooltips();

    // Initialize glossary page (if on glossary page)
    initGlossaryPage();

    // Initialize keyboard shortcuts
    initKeyboardShortcuts();
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
