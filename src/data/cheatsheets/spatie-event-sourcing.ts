export interface CheatsheetEntry {
  /** Short code fragment shown as the lead-in, e.g. `->recordThat(...)` */
  code?: string;
  /** Plain-text lead-in when there's no code to highlight, e.g. "Aggregate root" */
  term?: string;
  text: string;
  href?: string;
  /** Question framing for FAQPage structured data, e.g. gotchas. */
  question?: string;
}

export interface CheatsheetSection {
  id: string;
  title: string;
  entries?: CheatsheetEntry[];
  /** Ordered flow steps, rendered as an arrow-joined pipeline instead of a list */
  flow?: string[];
  note?: string;
  /** 'callout' renders full-width and outside the card grid, 'pairs' renders the wrong/right blocks. */
  variant?: 'callout' | 'pairs';
  pairs?: WrongRightPair[];
}

export interface WrongRightPair {
  caption: string;
  wrong: { code: string; note: string };
  right: { code: string; note: string };
}

const DOCS = 'https://spatie.be/docs/laravel-event-sourcing/v7';

export interface Cheatsheet {
  title: string;
  description: string;
  /** spatie/laravel-event-sourcing version this content was verified against. */
  packageVersion: string;
  /** ISO date the content was last checked against that version. */
  lastReviewed: string;
  /** Short framing under the title: who this is for and why read it. */
  intro: string;
  sections: CheatsheetSection[];
}

export const spatieEventSourcingCheatsheet: Cheatsheet = {
  title: 'Spatie Laravel Event Sourcing Cheat Sheet',
  description:
    'A dense, printable reference for spatie/laravel-event-sourcing: aggregates, projectors, reactors, artisan commands, testing, and the gotchas people hit first.',
  packageVersion: 'v7',
  lastReviewed: '2026-08-07',
  intro:
    "Not an event sourcing tutorial. This assumes you've already read the docs or built one aggregate and are past \"what is an event\" — it's the page you keep open while building, plus the mistakes that don't show up until production. Still deciding whether event sourcing is worth the complexity? Read the callout below first.",
  sections: [
    {
      id: 'when-not-to-use',
      title: 'When NOT to use event sourcing',
      variant: 'callout',
      entries: [
        { text: 'Reach for it only when history, audit, or genuinely complex invariants matter. For plain CRUD with no temporal requirement, it is ceremony you pay for on every future change, not a default.', href: `${DOCS}/getting-familiar-with-event-sourcing/introduction` },
      ],
    },
    {
      id: 'building-blocks',
      title: 'Building blocks',
      entries: [
        { term: 'Aggregate root', text: 'Guards business rules, records events, rebuilt from its event stream. Extends AggregateRoot.', href: `${DOCS}/using-aggregates/writing-your-first-aggregate` },
        { term: 'Event', text: 'An immutable fact that happened. Implements ShouldBeStored.', href: `${DOCS}/getting-familiar-with-event-sourcing/introduction` },
        { term: 'Projector', text: 'Builds/updates read models from events. Replayable, side-effect-free.', href: `${DOCS}/using-projectors/writing-your-first-projector` },
        { term: 'Reactor', text: 'Performs side effects (mail, notifications, HTTP). Not replayed.', href: `${DOCS}/using-reactors/writing-your-first-reactor` },
        { term: 'Read model / projection', text: 'The queryable state projectors maintain.', href: `${DOCS}/using-projectors/thinking-in-events` },
        { term: 'StoredEvent', text: 'The persisted event row in the event store.', href: `${DOCS}/advanced-usage/event-queries` },
        { term: 'Snapshot', text: 'Cached aggregate state to avoid replaying long streams.', href: `${DOCS}/using-aggregates/snapshots` },
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
        { code: 'AggregateRoot::retrieve($uuid)', text: 'Rebuild from history.', href: `${DOCS}/using-aggregates/writing-your-first-aggregate` },
        { code: '->recordThat(new SomethingHappened(...))', text: 'Append an event.', href: `${DOCS}/using-aggregates/writing-your-first-aggregate` },
        { code: '->persist()', text: 'Write recorded events to the store.', href: `${DOCS}/using-aggregates/writing-your-first-aggregate` },
        { code: 'protected function applySomethingHappened(SomethingHappened $event)', text: 'Mutate in-memory state (no side effects, no queries into other aggregates).', href: `${DOCS}/using-aggregates/writing-your-first-aggregate` },
        { text: 'Enforce invariants BEFORE recordThat; throw domain exceptions on violation.', href: `${DOCS}/using-aggregates/writing-your-first-aggregate` },
        { text: 'Concurrency is built in: persist() throws CouldNotPersistAggregate if another process persisted events for this aggregate since it was retrieved. No manual version passing needed.', href: `${DOCS}/using-aggregates/creating-and-configuring-aggregates` },
      ],
    },
    {
      id: 'projectors-vs-reactors',
      title: 'Projectors vs reactors (the rule people get wrong)',
      entries: [
        { text: 'Projectors: idempotent, replay-safe, only touch their read models.', href: `${DOCS}/using-projectors/writing-your-first-projector` },
        { text: 'Side effects (emails, external calls) go in reactors, never projectors, because a replay would re-fire them.', href: `${DOCS}/using-reactors/writing-your-first-reactor` },
      ],
    },
    {
      id: 'handlers',
      title: 'Handlers',
      entries: [
        { code: 'public function onSomethingHappened(SomethingHappened $event)', text: 'Projector/reactor handler method. Name is derived from the event\'s short class name — rename the event and the handler silently stops firing.', href: `${DOCS}/using-projectors/making-sure-events-get-handled-in-the-right-order` },
        {
          code: "'projectors' => [OrderProjector::class],\n'reactors' => [OrderReactor::class],",
          text: 'config/event-sourcing.php — registers handlers for every request. Preferred default.',
          href: `${DOCS}/using-projectors/creating-and-configuring-projectors`,
        },
        {
          code: 'Projectionist::addProjector(OrderProjector::class);',
          text: 'Runtime registration from a service provider\'s boot() — for conditional handlers (feature flags, tenants), not the common case.',
          href: `${DOCS}/advanced-usage/adding-and-removing-projectors-and-reactors`,
        },
      ],
    },
    {
      id: 'event-versioning',
      title: 'Versioning events (upcasting)',
      entries: [
        { text: 'An event\'s shape is frozen the moment it\'s stored. Add a field, rename a field, split an event — old rows on disk still have the old shape, and replay will hydrate them into the current class.', href: `${DOCS}/advanced-usage/using-your-own-event-serializer` },
        {
          code: 'class UpcastingEventSerializer extends JsonEventSerializer {\n    public function deserialize(string $eventClass, string $json, array $metadata): ShouldBeStored {\n        $payload = json_decode($json, true);\n        if ($eventClass === AddressChanged::class && !isset($payload[\'country\'])) {\n            $payload[\'country\'] = \'unknown\';\n        }\n        return parent::deserialize($eventClass, json_encode($payload), $metadata);\n    }\n}',
          text: 'Decorate the default serializer and patch the raw payload before it\'s hydrated, keyed off the fields that are actually missing.',
          href: `${DOCS}/advanced-usage/using-your-own-event-serializer`,
        },
        {
          code: "'event_serializer' => UpcastingEventSerializer::class,",
          text: 'config/event-sourcing.php — swap in the decorated serializer.',
          href: `${DOCS}/advanced-usage/using-your-own-event-serializer`,
        },
        { text: 'Do this before you need it. Retrofitting an upcaster after three shapes have shipped means branching on three payload versions in one method.' },
      ],
    },
    {
      id: 'artisan-commands',
      title: 'Artisan commands',
      entries: [
        { code: 'php artisan make:aggregate', text: 'Scaffold a new aggregate root.', href: `${DOCS}/advanced-usage/commands` },
        { code: 'php artisan make:projector', text: 'Scaffold a new projector. Add -Q for a QueuedProjector.', href: `${DOCS}/advanced-usage/commands` },
        { code: 'php artisan make:reactor', text: 'Scaffold a new reactor.', href: `${DOCS}/advanced-usage/commands` },
        { code: 'php artisan make:storable-event', text: 'Scaffold a new domain event.', href: `${DOCS}/advanced-usage/commands` },
        { code: 'php artisan event-sourcing:replay', text: 'Replay stored events to projectors.', href: `${DOCS}/advanced-usage/replaying-events` },
        { code: 'php artisan event-sourcing:list', text: 'List all registered event handlers.', href: `${DOCS}/advanced-usage/commands` },
      ],
    },
    {
      id: 'queued-projectors',
      title: 'Queued projectors and failures',
      entries: [
        { code: 'php artisan make:projector OrderProjector -Q', text: 'Runs the projector on a queue instead of synchronously in the request.', href: `${DOCS}/using-projectors/creating-and-configuring-projectors` },
        { text: 'A queued projector that throws fails like any other queued job: it retries per your queue config, then lands on failed_jobs. The command that recorded the event already succeeded, this does not roll it back.', href: `${DOCS}/advanced-usage/handling-exceptions` },
        { text: 'A failed queued projector leaves its read model behind whatever events it did process before failing. Re-running event-sourcing:replay for that projector after fixing the bug is how you catch it back up, not artisan queue:retry.', href: `${DOCS}/advanced-usage/replaying-events` },
      ],
    },
    {
      id: 'querying-event-store',
      title: 'Querying the event store',
      entries: [
        {
          code: "StoredEvent::query()->where('aggregate_uuid', $uuid)->orderBy('id')->get()",
          text: 'The full recorded history for one aggregate, in order. This is what AggregateRoot::retrieve() replays internally.',
          href: `${DOCS}/advanced-usage/event-queries`,
        },
        { text: 'Use AggregateRoot::retrieve() when you just need current state. Query StoredEvent directly for an audit trail, a debug view, or an admin "what happened to this order" screen.', href: `${DOCS}/advanced-usage/event-queries` },
      ],
    },
    {
      id: 'testing',
      title: 'Testing',
      entries: [
        {
          code: "AggregateRoot::fake($uuid)->given([...])->when(fn($agg) => ...)->assertRecorded([new Expected(...)])",
          text: 'Also see ->assertNotRecorded(...).',
          href: `${DOCS}/using-aggregates/testing-aggregates`,
        },
      ],
    },
    {
      id: 'gotchas',
      title: 'Gotchas',
      entries: [
        { question: 'Why must a projector be idempotent and replay-safe?', text: 'Projectors must be idempotent and replay-safe. event-sourcing:replay runs every event through them again from scratch.', href: `${DOCS}/using-projectors/writing-your-first-projector` },
        { question: 'Can I query other aggregates inside an apply method?', text: 'Don’t query other aggregates inside apply*. It reads live state at replay time, not the state that existed when the event was recorded.', href: `${DOCS}/using-aggregates/writing-your-first-aggregate` },
        { question: 'When should I snapshot an aggregate?', text: 'Snapshot long-lived aggregates. Without one, retrieve() replays the entire stream on every load.', href: `${DOCS}/using-aggregates/snapshots` },
      ],
    },
  ],
};

export const wrongRightPairs: WrongRightPair[] = [
  {
    caption: 'Side effects inside a projector',
    wrong: {
      code: "class OrderProjector extends Projector\n{\n    public function onOrderShipped(OrderShipped $event)\n    {\n        Order::find($event->orderId)->update(['status' => 'shipped']);\n        Mail::to($event->email)->send(new OrderShippedMail);\n    }\n}",
      note: 'Replay this once and every past customer gets re-emailed.',
    },
    right: {
      code: "class OrderProjector extends Projector\n{\n    public function onOrderShipped(OrderShipped $event)\n    {\n        Order::find($event->orderId)->update(['status' => 'shipped']);\n    }\n}\n\nclass OrderReactor extends Reactor\n{\n    public function onOrderShipped(OrderShipped $event)\n    {\n        Mail::to($event->email)->send(new OrderShippedMail);\n    }\n}",
      note: 'Reactors aren’t replayed. Side effects live there, full stop.',
    },
  },
  {
    caption: 'Reading other aggregates inside apply*',
    wrong: {
      code: "protected function applyItemAdded(ItemAdded $event)\n{\n    $price = Product::retrieve($event->productId)->currentPrice();\n    $this->total += $price;\n}",
      note: 'Replay this next year and you’ll total the order at today’s prices.',
    },
    right: {
      code: "public function addItem(string $productId, int $priceCents)\n{\n    $this->recordThat(new ItemAdded($productId, $priceCents));\n}\n\nprotected function applyItemAdded(ItemAdded $event)\n{\n    $this->total += $event->priceCents;\n}",
      note: 'Decide the price when the command runs, store it in the event. apply* only touches what’s already there.',
    },
  },
  {
    caption: 'Invariant checks after recordThat',
    wrong: {
      code: "public function ship()\n{\n    $this->recordThat(new OrderShipped);\n\n    if ($this->status !== 'paid') {\n        throw new CannotShipUnpaidOrder;\n    }\n}",
      note: 'recordThat() doesn’t roll back. The invalid event is already in the stream.',
    },
    right: {
      code: "public function ship()\n{\n    if ($this->status !== 'paid') {\n        throw new CannotShipUnpaidOrder;\n    }\n\n    $this->recordThat(new OrderShipped);\n}",
      note: 'Guard first, record second. Always.',
    },
  },
  {
    caption: 'create() vs updateOrCreate() on replay',
    wrong: {
      code: "protected function onOrderPlaced(OrderPlaced $event)\n{\n    Order::create([\n        'id' => $event->orderId,\n        // ...\n    ]);\n}",
      note: 'event-sourcing:replay throws a duplicate-key error the second time it runs.',
    },
    right: {
      code: "protected function onOrderPlaced(OrderPlaced $event)\n{\n    Order::updateOrCreate(\n        ['id' => $event->orderId],\n        [/* ... */]\n    );\n}",
      note: 'updateOrCreate() makes the projector safe to replay from an empty read model.',
    },
  },
];

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
