document.addEventListener('DOMContentLoaded', () => {
    let syncingTabs = false;
  
    document.body.addEventListener('shown.bs.tab', (event) => {
      if (syncingTabs) return;
  
      // Capture scroll position before tabs switch
      const scrollPosition = window.scrollY || window.pageYOffset;
  
      syncingTabs = true;
      const selectedLabel = event.target.textContent.trim();
  
      document.querySelectorAll('.nav-tabs').forEach(nav => {
        const matchingTab = Array.from(nav.querySelectorAll('button.nav-link'))
          .find(t => t.textContent.trim() === selectedLabel);
  
        if (matchingTab && matchingTab !== event.target && !matchingTab.classList.contains('active')) {
          bootstrap.Tab.getOrCreateInstance(matchingTab).show();
        }
      });
  
      syncingTabs = false;
  
      // Restore scroll position immediately after switching
      window.scrollTo({ top: scrollPosition });
    });
  });
  