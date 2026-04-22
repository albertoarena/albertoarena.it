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
}

export const projects: Project[] = [
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
    name: 'Midleton Distillery Collection',
    description:
      'Official e-commerce shop for Ireland\'s finest whiskey brands including Jameson, Redbreast, and Midleton Very Rare.',
    tech: ['E-commerce', 'Web Development'],
    url: 'https://midletondistillerycollection.com/',
    status: 'professional',
    featured: true,
    year: '2021–2024',
  },
];
