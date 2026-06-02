export interface Project {
  name: string;
  description: string;
  tech: string[];
  github?: string;
  url?: string;
  postSlug?: string;
  status: 'active' | 'maintained' | 'archived' | 'professional';
  featured?: boolean;
  year: string;
  company?: { name: string; url?: string };
  role?: string;
}

export const projects: Project[] = [
  {
    name: 'Laravel Netsons Deploy',
    description:
      'GitHub Actions deployment workflow for Laravel on Netsons shared hosting, supporting both FTP and git clone strategies with zero-downtime release switching.',
    tech: ['Laravel', 'PHP', 'GitHub Actions', 'Deploy'],
    github: 'https://github.com/albertoarena/laravel-netsons-deploy',
    url: 'https://albertoarena.github.io/laravel-netsons-deploy/',
    postSlug: 'laravel-netsons-deploy',
    status: 'active',
    featured: true,
    year: '2026',
  },
  {
    name: 'Claude Laravel Event Sourcing',
    description:
      'Claude Code skill that designs and generates event-sourced Laravel domains via a two-gate workflow: domain modelling conversation and ADR approval before any code is written.',
    tech: ['Laravel', 'PHP', 'Event Sourcing', 'AI', 'Claude'],
    github: 'https://github.com/albertoarena/claude-laravel-event-sourcing',
    postSlug: 'ai-laravel-event-sourcing',
    status: 'active',
    featured: true,
    year: '2026',
  },
  {
    name: 'envaudit',
    description:
      'Zero-dependency Node.js CLI tool that audits .env files by comparing them against .env.example to detect missing variables, exposed secrets, and configuration drift before they reach production.',
    tech: ['Node.js', 'JavaScript', 'CLI'],
    github: 'https://github.com/albertoarena/envaudit',
    url: 'https://albertoarena.github.io/envaudit/',
    status: 'active',
    featured: true,
    year: '2026',
  },
  {
    name: 'Codemetry',
    description:
      'Git repository analysis tool that converts version control history into meaningful quality metrics with daily indicators.',
    tech: ['Laravel', 'PHP', 'Git'],
    github: 'https://github.com/albertoarena/codemetry',
    url: 'https://albertoarena.github.io/codemetry/',
    postSlug: 'introducing-codemetry',
    status: 'active',
    featured: true,
    year: '2025',
  },
  {
    name: 'Laravel Event Sourcing Generator',
    description:
      'Code scaffolding tool that generates complete domain structures for event-sourced Laravel apps using Spatie\'s library.',
    tech: ['Laravel', 'PHP', 'Event Sourcing'],
    github: 'https://github.com/albertoarena/laravel-event-sourcing-generator',
    postSlug: 'create-a-domain-with-spatie-event-sourcing',
    status: 'active',
    featured: true,
    year: '2024',
  },
  {
    name: 'SafariOffice for Accommodations',
    description:
      'The leading B2B platform for accommodations, connecting hospitality businesses with global travel distribution and booking management tools.',
    tech: ['Laravel', 'PHP', 'JavaScript', 'MySQL'],
    url: 'https://www.safarioffice.com/accommodations/',
    status: 'professional',
    featured: true,
    year: '2025–Present',
    company: { name: 'SafariOffice', url: 'https://www.safarioffice.com/' },
  },
  {
    name: 'Midleton Distillery Collection',
    description:
      'Official e-commerce shop for Ireland\'s finest whiskey brands including Jameson, Redbreast, and Midleton Very Rare.',
    tech: ['E-commerce', 'Web Development'],
    url: 'https://midletondistillerycollection.com/',
    status: 'professional',
    featured: true,
    year: '2021–Present',
    company: { name: 'Irish Distillers', url: 'https://www.irishdistillers.ie/' },
  },
  {
    name: 'Jameson Whiskey',
    description:
      'Home of Jameson Irish Whiskey in Ireland, one of the world\'s best-selling Irish whiskeys.',
    tech: ['WordPress', 'PHP', 'JavaScript', 'Vue.js', 'Twig'],
    url: 'https://www.jamesonwhiskey.com/en-ie/',
    status: 'professional',
    featured: true,
    year: '2021–2024',
    company: { name: 'Irish Distillers', url: 'https://www.irishdistillers.ie/' },
  },
  {
    name: 'CSC Portal',
    description:
      'Competence management portal for career development and assessment.',
    tech: ['Laravel', 'PHP', 'JavaScript', 'Vue.js', 'AWS'],
    url: 'https://www.careerspancompetence.com/products',
    status: 'professional',
    featured: true,
    year: '2021–2022',
    company: { name: 'Assessbank Examination Software', url: 'https://www.assessbank.ca/' },
    role: 'Lead developer',
  },
  {
    name: 'Standards Tracker',
    description:
      'Performance management system for schools, tracking teacher standards and appraisals.',
    tech: ['JavaScript', 'PHP', 'CodeIgniter'],
    url: 'https://www.tes.com/for-schools/now-tes/standards-tracker',
    status: 'professional',
    featured: true,
    year: '2015–2021',
    company: { name: 'Educate', url: 'https://www.tes.com/' },
    role: 'Lead developer',
  },
  {
    name: 'Scope Community',
    description:
      'Online community forum for Scope, the UK disability equality charity.',
    tech: ['PHP'],
    url: 'https://forum.scope.org.uk/',
    status: 'professional',
    featured: true,
    year: '2014–2015',
    company: { name: 'MMT Digital', url: 'https://mmtdigital.co.uk/' },
  },
];
