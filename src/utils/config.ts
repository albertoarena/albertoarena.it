export const siteConfig = {
  title: 'A blog by Alberto Arena',
  url: 'https://albertoarena.it',
  subtitle: 'Senior Software Engineer.',
  /*
    Default og:image/twitter:image for the homepage and any other page that
    doesn't set its own socialImage (post covers always do). Deliberately a
    separate field from author.photo: that one is a 240x240 square avatar
    for the Person JSON-LD image, this one needs to be 1200x630 landscape —
    one field serving both aspect ratios was exactly the bug (see .impeccable
    critique snapshot, 2026-10-07): the avatar got force-cropped into the
    OG slot by each platform's own crop heuristic.
  */
  defaultSocialImage: '/social-default.jpg',
  copyright: '© All rights reserved.',
  gtmContainerId: 'GTM-PDQBJBL3',
  googleAnalyticsId: 'G-PJGZWDSK4K', // managed via GTM, kept for reference
  postsLimit: 8,
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
        /*
          Tagged because it is an owned site on another domain (R14). Untagged,
          every click off the rail arrives at trussphp.com as a bare referral
          from this host, indistinguishable from a link in someone else's post,
          and the rail is on all 122 pages. trussphp.com self-canonicalises
          without the query, so tagging costs nothing in GSC.
        */
        { label: 'truss', path: 'https://trussphp.com/?utm_source=albertoarena.it&utm_medium=referral&utm_campaign=site-nav' },
        { label: 'cogway', path: 'https://cogway.dev/?utm_source=albertoarena.it&utm_medium=referral&utm_campaign=site-nav' },
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
    // The numeric form ID the real <form action> submits to, not the
    // short "HjBuvq" slug shown in MailerLite's dashboard URL / the old
    // ml-embedded widget's data-form attribute — that slug only resolves
    // a form's template via a separate lookup call the widget made before
    // rendering (assets.mailerlite.com/jsonp/<account>/forms/HjBuvq),
    // which NewsletterSignup.astro no longer does. Read directly off the
    // real rendered form's action attribute on /subscribe/, 2026-10-07.
    formId: '191438151619708478',
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
