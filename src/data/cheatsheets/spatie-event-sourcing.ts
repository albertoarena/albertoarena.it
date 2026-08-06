export interface CheatsheetEntry {
  /** Short code fragment shown as the lead-in, e.g. `->recordThat(...)` */
  code?: string;
  /** Plain-text lead-in when there's no code to highlight, e.g. "Aggregate root" */
  term?: string;
  text: string;
  href?: string;
}

export interface CheatsheetSection {
  id: string;
  title: string;
  entries?: CheatsheetEntry[];
  /** Ordered flow steps, rendered as an arrow-joined pipeline instead of a list */
  flow?: string[];
  note?: string;
}

export interface Cheatsheet {
  title: string;
  description: string;
  sections: CheatsheetSection[];
}

export const spatieEventSourcingCheatsheet: Cheatsheet = {
  title: 'Spatie Laravel Event Sourcing Cheat Sheet',
  description:
    'A dense, printable reference for spatie/laravel-event-sourcing: aggregates, projectors, reactors, artisan commands, testing, and the gotchas people hit first.',
  sections: [
    {
      id: 'building-blocks',
      title: 'Building blocks',
      entries: [
        { term: 'Aggregate root', text: 'Guards business rules, records events, rebuilt from its event stream. Extends AggregateRoot.' },
        { term: 'Event', text: 'An immutable fact that happened. Implements ShouldBeStored.' },
        { term: 'Projector', text: 'Builds/updates read models from events. Replayable, side-effect-free.' },
        { term: 'Reactor', text: 'Performs side effects (mail, notifications, HTTP). Not replayed.' },
        { term: 'Read model / projection', text: 'The queryable state projectors maintain.' },
        { term: 'StoredEvent', text: 'The persisted event row in the event store.' },
        { term: 'Snapshot', text: 'Cached aggregate state to avoid replaying long streams.' },
      ],
    },
    {
      id: 'the-flow',
      title: 'The flow',
      flow: [
        'command',
        'aggregate root (guards + recordThat)',
        'persist()',
        'stored_events',
        'projectors build read models / reactors fire side effects',
      ],
    },
    {
      id: 'aggregate-root-essentials',
      title: 'Aggregate root essentials',
      entries: [
        { code: 'AggregateRoot::retrieve($uuid)', text: 'Rebuild from history.' },
        { code: '->recordThat(new SomethingHappened(...))', text: 'Append an event.' },
        { code: '->persist()', text: 'Write recorded events to the store.' },
        { code: 'protected function applySomethingHappened(SomethingHappened $event)', text: 'Mutate in-memory state (no side effects, no queries into other aggregates).' },
        { text: 'Enforce invariants BEFORE recordThat; throw domain exceptions on violation.' },
        { text: 'Concurrency is built in: persist() throws CouldNotPersistAggregate if another process persisted events for this aggregate since it was retrieved. No manual version passing needed.' },
      ],
    },
    {
      id: 'projectors-vs-reactors',
      title: 'Projectors vs reactors (the rule people get wrong)',
      entries: [
        { text: 'Projectors: idempotent, replay-safe, only touch their read models.' },
        { text: 'Side effects (emails, external calls) go in reactors, never projectors, because a replay would re-fire them.' },
      ],
    },
    {
      id: 'handlers',
      title: 'Handlers',
      entries: [
        { code: 'public function onSomethingHappened(SomethingHappened $event)', text: 'Projector handler method.' },
        { text: 'Register projectors/reactors (config event-sourcing.projectors / at runtime).' },
        { text: 'Weak-typed catch-all vs typed handler methods.' },
      ],
    },
    {
      id: 'artisan-commands',
      title: 'Artisan commands',
      entries: [
        { code: 'php artisan make:aggregate', text: 'Scaffold a new aggregate root.' },
        { code: 'php artisan make:projector', text: 'Scaffold a new projector. Add -Q for a QueuedProjector.' },
        { code: 'php artisan make:reactor', text: 'Scaffold a new reactor.' },
        { code: 'php artisan make:storable-event', text: 'Scaffold a new domain event.' },
        { code: 'php artisan event-sourcing:replay', text: 'Replay stored events to projectors.' },
        { code: 'php artisan event-sourcing:list', text: 'List all registered event handlers.' },
      ],
    },
    {
      id: 'testing',
      title: 'Testing',
      entries: [
        {
          code: "AggregateRoot::fake($uuid)->given([...])->when(fn($agg) => ...)->assertRecorded([new Expected(...)])",
          text: 'Also see ->assertNotRecorded(...).',
        },
      ],
    },
    {
      id: 'gotchas',
      title: 'Gotchas',
      entries: [
        { text: 'Projectors must be idempotent and replay-safe.' },
        { text: 'Don’t query other aggregates inside apply*.' },
        { text: 'Version events; upcast when the shape changes.' },
        { text: 'Snapshot long-lived aggregates.' },
      ],
    },
    {
      id: 'when-not-to-use',
      title: 'When NOT to use event sourcing',
      entries: [
        { text: 'Simple CRUD, no audit/temporal requirement, no complex invariants: the cost isn’t worth it. Use it when history, audit, or rich domain rules matter.' },
      ],
    },
  ],
};

export interface AutomateLink {
  name: string;
  href: string;
  text: string;
}

export const automateThisFooter: AutomateLink[] = [
  {
    name: 'laravel-event-sourcing-generator',
    href: 'https://github.com/albertoarena/laravel-event-sourcing-generator',
    text: 'One artisan command scaffolds aggregates, events, projectors, reactors, and tests. 10k+ installs.',
  },
  {
    name: 'claude-laravel-event-sourcing',
    href: 'https://github.com/albertoarena/claude-laravel-event-sourcing',
    text: 'Claude Code skill that designs the domain through a conversation and leaves an ADR before generating code.',
  },
];

export const relatedPostSlugs = [
  'domain-using-spatie-event-sourcing',
  'ai-laravel-event-sourcing',
  'generator-vs-ai-skill',
];
