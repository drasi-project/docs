/**
 * Navigation Enhancements for Drasi Documentation
 * Provides scroll spy for TOC, smooth scrolling, and other UX improvements
 */

document.addEventListener('DOMContentLoaded', () => {
  // =============================================================================
  // SCROLL SPY FOR TABLE OF CONTENTS
  // Highlights the current section in the right-hand TOC
  // =============================================================================

  const setupScrollSpy = () => {
    const toc = document.querySelector('#TableOfContents');
    if (!toc) return;

    const tocLinks = toc.querySelectorAll('a');
    const headings = [];

    // Gather all headings that correspond to TOC links
    tocLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (href && href.startsWith('#')) {
        const heading = document.querySelector(href);
        if (heading) {
          headings.push({ element: heading, link: link });
        }
      }
    });

    if (headings.length === 0) return;

    // Remove active class from all links
    const clearActive = () => {
      tocLinks.forEach(link => link.classList.remove('active'));
    };

    // Set active class on a specific link
    const setActive = (link) => {
      clearActive();
      link.classList.add('active');
    };

    // Determine which heading is currently in view
    const onScroll = () => {
      const scrollPosition = window.scrollY + 100; // Offset for header

      let currentHeading = null;

      for (const { element, link } of headings) {
        if (element.offsetTop <= scrollPosition) {
          currentHeading = link;
        }
      }

      if (currentHeading) {
        setActive(currentHeading);
      }
    };

    // Debounce scroll events for performance
    let scrollTimeout;
    window.addEventListener('scroll', () => {
      if (scrollTimeout) {
        window.cancelAnimationFrame(scrollTimeout);
      }
      scrollTimeout = window.requestAnimationFrame(onScroll);
    });

    // Initial check
    onScroll();
  };

  // =============================================================================
  // SMOOTH SCROLL FOR ANCHOR LINKS
  // Provides smooth scrolling when clicking on anchor links
  // =============================================================================

  const setupSmoothScroll = () => {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (href === '#') return;

        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();

          const headerOffset = 80; // Account for fixed header
          const elementPosition = target.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });

          // Update URL without jumping
          history.pushState(null, null, href);
        }
      });
    });
  };

  // =============================================================================
  // READING PROGRESS INDICATOR
  // Shows progress through the current page
  // =============================================================================

  const setupReadingProgress = () => {
    const progressBar = document.createElement('div');
    progressBar.className = 'reading-progress';
    progressBar.innerHTML = '<div class="reading-progress__bar"></div>';
    document.body.appendChild(progressBar);

    const bar = progressBar.querySelector('.reading-progress__bar');

    const updateProgress = () => {
      const scrollTop = window.pageYOffset;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (scrollTop / docHeight) * 100;
      bar.style.width = `${Math.min(progress, 100)}%`;
    };

    window.addEventListener('scroll', updateProgress);
    updateProgress();
  };

  // =============================================================================
  // EXTERNAL LINK HANDLING
  // Adds indicators and target="_blank" to external links
  // =============================================================================

  const setupExternalLinks = () => {
    const currentHost = window.location.host;

    document.querySelectorAll('.td-content a[href^="http"]').forEach(link => {
      const url = new URL(link.href);

      if (url.host !== currentHost) {
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener noreferrer');

        // Add external link indicator if not already present
        if (!link.querySelector('.external-link-icon')) {
          const icon = document.createElement('i');
          icon.className = 'fas fa-external-link-alt external-link-icon';
          icon.style.cssText = 'font-size: 0.7em; margin-left: 4px; opacity: 0.6;';
          link.appendChild(icon);
        }
      }
    });
  };

  // =============================================================================
  // COPY CODE BUTTON ENHANCEMENT
  // Improves the copy button experience for code blocks
  // =============================================================================

  const setupCopyCode = () => {
    document.querySelectorAll('pre code').forEach(codeBlock => {
      const pre = codeBlock.parentElement;

      // Skip if button already exists
      if (pre.querySelector('.copy-code-button')) return;

      const button = document.createElement('button');
      button.className = 'copy-code-button';
      button.innerHTML = '<i class="fas fa-copy"></i>';
      button.title = 'Copy to clipboard';

      button.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(codeBlock.textContent);
          button.innerHTML = '<i class="fas fa-check"></i>';
          button.classList.add('copied');

          setTimeout(() => {
            button.innerHTML = '<i class="fas fa-copy"></i>';
            button.classList.remove('copied');
          }, 2000);
        } catch (err) {
          console.error('Failed to copy:', err);
        }
      });

      pre.style.position = 'relative';
      pre.appendChild(button);
    });
  };

  // =============================================================================
  // INITIALIZE ALL ENHANCEMENTS
  // =============================================================================

  setupScrollSpy();
  setupSmoothScroll();
  // setupReadingProgress(); // Uncomment to enable reading progress bar
  setupExternalLinks();
  setupCopyCode();
});
