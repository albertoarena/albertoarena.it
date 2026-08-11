export const siteConfig = {
  title: 'A blog by Alberto Arena',
  url: 'https://albertoarena.it',
  subtitle: 'Senior Software Engineer.',
  copyright: '© All rights reserved.',
  gtmContainerId: 'GTM-PDQBJBL3',
  googleAnalyticsId: 'G-PJGZWDSK4K', // managed via GTM, kept for reference
  postsLimit: 6,
  /*
    Fallback "open a discussion" target (redesign-plan.md §11) for posts with
    no per-post `discussion` field. Discussions enabled 2026-08-09 specifically
    to serve this — most posts aren't about one package, so a per-package repo
    doesn't cover them, see .docs/plans/redesign/ discussion for the reasoning.
  */
  discussionRepo: 'albertoarena/albertoarena.it',
  /*
    Grouped nav for the redesign rail (redesign-plan.md §6). Eight items is
    the hard cap, and we're at it exactly.
  */
  railNav: [
    {
      label: 'read',
      ariaLabel: 'Reading',
      items: [
        { label: 'writing', path: '/writing/' },
        { label: 'series', path: '/series/' },
        { label: 'cheatsheets', path: '/cheatsheets/' },
      ],
    },
    {
      label: 'build',
      ariaLabel: 'Projects',
      items: [
        { label: 'truss', path: 'https://trussphp.com/' },
        { label: 'projects', path: '/projects/' },
        { label: 'videos', path: 'https://www.youtube.com/@AlbertoArenaDev' },
      ],
    },
    {
      label: 'work',
      ariaLabel: 'Work with me',
      items: [
        { label: 'consulting', path: '/pages/consulting/' },
        { label: 'subscribe', path: '/subscribe/' },
        { label: 'about', path: '/pages/about/' },
      ],
    },
  ],
  mailerlite: {
    accountId: '2474575',
    formId: 'HjBuvq',
  },
  author: {
    name: 'Alberto Arena',
    photo: '/photo.jpg',
    bio: 'Senior Software Engineer',
    contacts: {
      github: 'albertoarena',
      twitter: 'alberto_arena',
      linkedin: 'alberto-arena-ba44a624',
      youtube: 'AlbertoArenaDev',
      rss: '/rss.xml'
    }
  }
};

export type SiteConfig = typeof siteConfig;
