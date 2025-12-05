# Work Plan: Drasi Documentation Design Refresh & Diataxis Optimization

## Overview

This plan outlines a comprehensive design refresh and content restructuring for the Drasi documentation site. The goal is to create a more visually distinctive, modern experience while better aligning content with the Diataxis framework. The approach balances creative design choices that break from generic enterprise documentation aesthetics with practical usability and clear information architecture.

## Current State Analysis

### Design Assessment
- **Color Scheme**: Dark blue primary (#1f203f), green secondary (#75de6f) - functional but safe
- **Typography**: 17px base, 1.7 line-height - good readability but conventional
- **Cards**: Unified card system with hover effects - well-executed but standard
- **Layout**: Docsy theme with minimal customization - professional but generic

### Content Assessment
- **92 markdown files** organized across Diataxis quadrants
- **Strong**: Tutorials (11), How-to Guides (~40), Source/Reaction coverage
- **Critical Issues**: Getting Started not prominently featured on homepage
- **Gaps**: Best practices, performance tuning, advanced patterns, operations at scale

---

## Significant Changes

### Major Visual/UX Changes
- New gradient-based color system with dynamic accent usage
- Custom illustration style for section headers and hero areas
- Redesigned homepage with prominent Getting Started section and visual journey map
- Interactive navigation elements with animated transitions
- Custom iconography replacing Font Awesome defaults

### Architectural Content Changes
- New "Patterns & Best Practices" top-level section
- Expanded Operations section with monitoring, scaling, and troubleshooting
- Learning path system connecting related content across quadrants
- "What's New" feature for changelog/release notes visibility

### Breaking Changes/Risks
- CSS changes may affect existing custom layouts
- New section structure requires updating internal links
- Homepage redesign changes user navigation patterns
- Some incomplete content must be completed or removed from navigation

---

## Tasks

### 2. Redesign Homepage with Visual Journey

- **Description**: Transform the homepage into a more engaging entry point that clearly guides users to Getting Started
- **Actions**:
  - Update `/docs/content/_index.md` with new structure:
    - Hero section with tagline and visual representation of Drasi's flow (Source → Query → Reaction)
    - Prominent "Get Started in 10 Minutes" call-to-action card (not buried in paragraph)
    - Diataxis quadrant cards with improved descriptions and visual hierarchy
    - "What is Drasi?" brief explanation with animated diagram concept
  - Add new CSS in `_styles_project.scss`:
    - Hero gradient background using brand colors
    - Animated hover states for primary CTA
    - Visual flow diagram styling
    - Improved spacing and rhythm
  - Consider adding a "Popular Guides" or "Quick Links" section below main cards
- **Success Criteria**: Homepage clearly directs new users to Getting Started; visual hierarchy improved
- **Dependencies**: None

### 3. Refresh Color Palette and Typography

- **Description**: Introduce a more dynamic, modern color system while maintaining brand identity
- **Actions**:
  - Update `/docs/assets/scss/_variables_project.scss`:
    - Add accent colors: light green (#d0fa58), purple (#bdadf4) - already defined but underused
    - Create CSS custom properties for dynamic theming
    - Add gradient definitions for backgrounds
  - Update `_styles_project.scss`:
    - Introduce gradient backgrounds for section headers
    - Add subtle color transitions on interactive elements
    - Create visual distinction between Diataxis quadrants (subtle color coding)
    - Improve code block styling with syntax highlighting enhancements
  - Typography refinements:
    - Consider display font for headings (via Google Fonts)
    - Improve heading hierarchy with varied weights and sizes
    - Add decorative elements to h2 borders
- **Success Criteria**: Visual design feels fresh and distinctive while remaining professional and accessible
- **Dependencies**: None

### 4. Create Interactive Navigation Elements

- **Description**: Add visual cues and micro-interactions to improve navigation experience
- **Actions**:
  - Update sidebar navigation styling in `_styles_project.scss`:
    - Active section highlighting with accent color
    - Smooth expand/collapse animations
    - Progress indicators for multi-page tutorials
  - Add breadcrumb improvements:
    - Visual hierarchy with color gradients
    - Hover states showing navigation path
  - Create "On This Page" table of contents improvements:
    - Scroll spy with smooth highlighting
    - Collapsible sections for long pages
  - Add page footer navigation:
    - "Previous/Next" navigation for sequential content
    - "Related Content" suggestions
- **Success Criteria**: Navigation feels responsive and helps users understand their location
- **Dependencies**: Task 3 (color palette)

### 5. Redesign Card System with Visual Variety

- **Description**: Break from uniform card design to create visual interest while maintaining usability
- **Actions**:
  - Update unified card styles in `_styles_project.scss`:
    - Tutorials cards: Gradient overlay with learning path indicator
    - How-to cards: Clean, task-focused design with checkmark iconography
    - Concepts cards: Subtle pattern background suggesting depth
    - Reference cards: Technical, structured appearance
  - Add card variations:
    - "Featured" card style for highlighted content
    - "Coming Soon" card style for placeholder content
    - "New" badge for recently added content
  - Create custom icons/illustrations for section cards (replace Font Awesome)
  - Add subtle animations:
    - Card entrance animations on page load
    - Staggered reveal for card grids
- **Success Criteria**: Each Diataxis quadrant has visual identity; cards are more engaging
- **Dependencies**: Task 3 (color palette)

### 6. Create "Patterns & Best Practices" Section

- **Description**: Add new top-level section for design patterns and best practices
- **Actions**:
  - Create `/docs/content/patterns/` directory structure:
    - `_index.md` - Section landing page
    - `query-design/` - Query optimization patterns
    - `solution-architecture/` - Reference architectures
    - `performance/` - Performance tuning guidelines
    - `security/` - Security best practices
  - Content for each subsection:
    - Query Design: Common query patterns, anti-patterns, optimization tips
    - Solution Architecture: Reference architectures for common use cases
    - Performance: Scaling considerations, resource planning, monitoring
    - Security: Authentication, authorization, data protection
  - Add to navigation in `config.toml` with appropriate weight
  - Create landing page with overview and navigation cards
- **Success Criteria**: Section exists with foundational content; fills identified content gap
- **Dependencies**: None

### 7. Expand Operations Documentation

- **Description**: Transform sparse Operations section into comprehensive operations guide
- **Actions**:
  - Expand `/docs/content/how-to-guides/operations/` structure:
    - Keep existing observability content
    - Add `monitoring/` - Detailed monitoring setup and dashboards
    - Add `scaling/` - Horizontal scaling guidance
    - Add `troubleshooting/` - Common issues and solutions (expand from Reference)
    - Add `maintenance/` - Backup, recovery, upgrades
  - Create content for each new subsection:
    - Monitoring: Metrics collection, alerting, dashboard examples
    - Scaling: Query container scaling, source/reaction scaling
    - Troubleshooting: Error codes, diagnostic procedures, common fixes
    - Maintenance: Backup strategies, upgrade procedures, health checks
  - Update navigation to reflect expanded structure
- **Success Criteria**: Operations section provides comprehensive operational guidance
- **Dependencies**: None

### 8. Implement Learning Paths System

- **Description**: Create visual connections between related content across Diataxis quadrants
- **Actions**:
  - Design learning path concept:
    - "Getting Started → Building Comfort Tutorial → Query Language Reference → Best Practices"
    - Create path definitions as data files or frontmatter
  - Add visual learning path indicators:
    - "Part of Learning Path: X" badges on relevant pages
    - Progress tracking UI (optional, may require JavaScript)
    - "Next in Path" navigation at page bottom
  - Create learning path landing page:
    - `/docs/content/learning-paths/` or integrate into Getting Started
    - Visual representation of available paths
    - Suggested paths for different user types (Developer, Operator, Architect)
  - Update relevant pages with learning path frontmatter
- **Success Criteria**: Users can follow guided paths through documentation
- **Dependencies**: Tasks 2, 4 (homepage, navigation)

### 9. Enhance Section Landing Pages

- **Description**: Transform sparse section landing pages into informative entry points
- **Actions**:
  - Update each section `_index.md`:
    - `/docs/content/tutorials/_index.md`: Add intro explaining tutorial approach, difficulty levels, time estimates
    - `/docs/content/how-to-guides/_index.md`: Add problem-oriented intro, guide organization explanation
    - `/docs/content/concepts/_index.md`: Add explanatory intro about conceptual content purpose
    - `/docs/content/reference/_index.md`: Add reference content overview, how to use references
  - Add visual elements to landing pages:
    - Section-specific hero graphics
    - Content type indicators (difficulty, time, prerequisites)
    - Quick navigation to popular items
  - Create consistent landing page template/pattern
- **Success Criteria**: Landing pages provide context and help users navigate section content
- **Dependencies**: Task 5 (card redesign)

### 10. Add "What's New" and Changelog Visibility

- **Description**: Create mechanism to highlight new and updated content
- **Actions**:
  - Create `/docs/content/whats-new/` section:
    - `_index.md` - Changelog/release notes landing
    - Individual entries for significant updates
  - Add "New" badges to recently updated content:
    - CSS class for "new" badge
    - Frontmatter field `new: true` or `updated: "2024-01-15"`
    - Auto-expire mechanism or manual removal process
  - Add "What's New" link to navigation:
    - Consider placement in top nav or sidebar
    - Optional: RSS feed for documentation updates
  - Homepage integration:
    - "Recent Updates" section showing latest content changes
- **Success Criteria**: Users can easily discover new and updated documentation
- **Dependencies**: None

### 11. Improve Code Block and Example Presentation

- **Description**: Enhance how code examples are displayed throughout documentation
- **Actions**:
  - Update code block styling in `_styles_project.scss`:
    - Better syntax highlighting color scheme
    - Line numbers for longer examples
    - Copy button improvements (already exists via Docsy)
    - Filename/language badges above code blocks
  - Create tabbed code example component:
    - Update `/docs/layouts/shortcodes/` with new shortcode
    - Support multiple languages/configurations in single block
    - Sync tabs across page (leverage existing sync-tabs.js)
  - Add output/result display pattern:
    - Visual distinction between input code and output
    - Collapsible output for long results
  - Update scrollable-code shortcode:
    - Better scroll indicators
    - Full-screen expand option
- **Success Criteria**: Code examples are easy to read, copy, and understand
- **Dependencies**: Task 3 (color palette)

### 12. Mobile Responsiveness Audit and Fixes

- **Description**: Ensure design changes work well on mobile and tablet devices
- **Actions**:
  - Audit all new CSS changes for responsive breakpoints
  - Test card grid at various screen sizes:
    - Add intermediate breakpoint if needed (992px for 3-column)
    - Verify card readability on mobile
  - Test navigation on mobile:
    - Hamburger menu functionality
    - Sidebar collapse behavior
    - Search accessibility
  - Test code blocks on mobile:
    - Horizontal scroll usability
    - Copy button accessibility
  - Fix any responsive issues discovered:
    - Update media queries as needed
    - Ensure touch targets are appropriately sized
- **Success Criteria**: Site is fully functional and readable on mobile devices
- **Dependencies**: Tasks 3, 4, 5, 11

### 13. Create Custom Iconography

- **Description**: Replace generic Font Awesome icons with custom illustrations/icons
- **Actions**:
  - Design icon set for Drasi concepts:
    - Source icon (database/input representation)
    - Query icon (filter/transform representation)
    - Reaction icon (output/action representation)
    - Continuous Query icon (flow/stream representation)
  - Design section icons:
    - Tutorials (learning/growth metaphor)
    - How-to Guides (task/checklist metaphor)
    - Concepts (understanding/lightbulb metaphor)
    - Reference (documentation/book metaphor)
  - Implementation:
    - SVG icons in `/docs/static/images/icons/`
    - Update homepage and section pages to use custom icons
    - Create icon usage documentation for consistency
- **Success Criteria**: Custom icons provide distinctive visual identity
- **Dependencies**: None

### 14. Improve Search Experience

- **Description**: Enhance search functionality and discoverability
- **Actions**:
  - Audit current Algolia configuration in `config.toml`
  - Enable sidebar search (`sidebar_search_disable` is currently true)
  - Customize search result display:
    - Show section/category badges in results
    - Improve result snippets
  - Add search suggestions:
    - Popular searches
    - Recent searches (if Algolia supports)
  - Create search tips documentation:
    - How to search effectively
    - Advanced search operators
- **Success Criteria**: Users can easily find content through search
- **Dependencies**: None

### 15. Final Quality Assurance and Documentation

- **Description**: Verify all changes work together and document new patterns
- **Actions**:
  - Run Hugo server and test all pages:
    - Verify no broken links
    - Verify all images load
    - Check console for JavaScript errors
  - Cross-browser testing:
    - Chrome, Firefox, Safari, Edge
    - Test dark mode if implemented
  - Run spellcheck:
    - `pyspelling --config .github/config/.pyspelling.yml -n Markdown`
  - Update CLAUDE.md with:
    - New content guidelines
    - Design pattern documentation
    - New shortcode usage
  - Create internal style guide (optional):
    - Color usage guidelines
    - Icon usage
    - Card pattern usage
- **Success Criteria**: All changes are validated and documented
- **Dependencies**: All other tasks

---

## Execution Order

### Phase 1: Foundation & Critical Fixes
2. Task 3: Refresh Color Palette and Typography (enables visual changes)

### Phase 2: Core Visual Redesign
3. Task 2: Redesign Homepage with Visual Journey
4. Task 5: Redesign Card System with Visual Variety
5. Task 4: Create Interactive Navigation Elements

### Phase 3: Content Structure Expansion
6. Task 6: Create "Patterns & Best Practices" Section
7. Task 7: Expand Operations Documentation
8. Task 9: Enhance Section Landing Pages

### Phase 4: Enhanced Features
9. Task 8: Implement Learning Paths System
10. Task 10: Add "What's New" and Changelog Visibility
11. Task 11: Improve Code Block and Example Presentation
12. Task 13: Create Custom Iconography
13. Task 14: Improve Search Experience

### Phase 5: Polish & Validation
14. Task 12: Mobile Responsiveness Audit and Fixes
15. Task 15: Final Quality Assurance and Documentation

---

## Notes

### Design Philosophy
- **Not boring, but not chaotic**: The goal is distinctive design that still prioritizes usability
- **Diataxis as visual system**: Each quadrant should have subtle visual identity
- **Progressive disclosure**: Don't overwhelm new users; reveal complexity gradually
- **Accessibility first**: All design choices must maintain WCAG compliance

### Technical Considerations
- Hugo extended version required for SCSS compilation
- Docsy theme is a Git submodule - avoid modifying theme files directly
- All changes should be in `/docs/assets/scss/` and `/docs/layouts/` for override patterns
- Test with `hugo server --disableFastRender` for accurate preview

### Content Guidelines
- Follow Diataxis principles strictly when creating new content
- Tutorials: learning-oriented, hands-on, safe to fail
- How-to: goal-oriented, practical, assume some knowledge
- Concepts: understanding-oriented, explain the "why"
- Reference: information-oriented, accurate, complete

### Potential Challenges
- Balancing creative design with Docsy theme constraints
- Ensuring changes don't break existing functionality
- Content creation for new sections requires subject matter expertise
- Custom iconography requires design skills or resources

### Resources Needed
- Access to design tools (Figma, Illustrator) for custom icons
- Time for content writing (Patterns, Operations sections)
- Testing across multiple browsers and devices
- Potential Algolia configuration adjustments

---

## Build & Quality Assurance

### Build Validation
- Run `hugo server --disableFastRender` throughout development
- Check Hugo build output for warnings or errors
- Verify all assets compile correctly (SCSS, JS)

### Testing Requirements
- Visual regression testing (manual or automated screenshots)
- Link validation across all pages
- Responsive testing at 320px, 768px, 1024px, 1440px breakpoints
- Accessibility testing with screen reader

### Code Quality Checks
- SCSS linting (if tooling available)
- HTML validation of generated pages
- Spellcheck: `pyspelling --config .github/config/.pyspelling.yml -n Markdown`
- Broken link check: Use Hugo's built-in reference checking

### Documentation Tests
- Run existing test suite: `cd tests && npm test` (requires DRASI_VERSION env var)
- Verify code snippets in documentation remain accurate
