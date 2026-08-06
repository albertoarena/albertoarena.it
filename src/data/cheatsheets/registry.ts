import { spatieEventSourcingCheatsheet } from './spatie-event-sourcing';

export interface CheatsheetRegistryEntry {
  slug: string;
  title: string;
  description: string;
}

export const cheatsheets: CheatsheetRegistryEntry[] = [
  {
    slug: 'spatie-event-sourcing',
    title: spatieEventSourcingCheatsheet.title,
    description: spatieEventSourcingCheatsheet.description,
  },
];
