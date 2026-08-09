export const siteConfig = {
  title: 'A blog by Alberto Arena',
  url: 'https://albertoarena.it',
  subtitle: 'Senior Software Engineer.',
  copyright: '© All rights reserved.',
  gtmContainerId: 'GTM-PDQBJBL3',
  googleAnalyticsId: 'G-PJGZWDSK4K', // managed via GTM, kept for reference
  disqusShortname: 'albertoarena-it',
  postsLimit: 6,
  /*
    Grouped nav for the redesign rail (redesign-plan.md §6). `/writing` points
    at `/` until Phase 4 splits the paginated index out of the home page, and
    `/series` is added once Phase 5 builds it — eight items is the hard cap.
  */
  railNav: [
    {
      label: 'read',
      ariaLabel: 'Reading',
      items: [
        { label: 'writing', path: '/' },
        { label: 'cheatsheets', path: '/cheatsheets/' },
      ],
    },
    {
      label: 'build',
      ariaLabel: 'Projects',
      items: [
        { label: 'truss', path: 'https://trussphp.com/' },
        { label: 'projects', path: '/projects/' },
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
      rss: '/rss.xml'
    }
  }
};

export type SiteConfig = typeof siteConfig;
