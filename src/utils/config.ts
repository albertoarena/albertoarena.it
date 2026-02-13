export const siteConfig = {
  title: 'A blog by Alberto Arena',
  url: 'https://albertoarena.it',
  subtitle: 'Senior Software Engineer.',
  copyright: '© All rights reserved.',
  googleAnalyticsId: 'G-PJGZWDSK4K',
  disqusShortname: 'albertoarena-it',
  postsLimit: 6,
  menu: [
    { label: 'Articles', path: '/' },
    { label: 'Projects', path: '/projects' },
    { label: 'About me', path: '/pages/about' }
  ],
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
