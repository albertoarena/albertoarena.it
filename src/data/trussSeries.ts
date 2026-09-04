export interface TrussSeriesEntry {
  slug: string;
  title: string;
  titleIt: string;
}

export const trussSeries: TrussSeriesEntry[] = [
  { slug: "introducing-truss", title: "Introducing Truss", titleIt: "Presentazione di Truss" },
  { slug: "the-schema-doctor-is-in", title: "The schema doctor is in", titleIt: "Il dottore dello schema" },
  { slug: "gave-my-schema-viewer-your-app-colours", title: "I gave my schema viewer your app's colours", titleIt: "I colori della tua app" },
  { slug: "my-coding-agent-kept-inventing-columns", title: "My coding agent kept inventing columns", titleIt: "Il mio agente di coding inventava le colonne" },
  { slug: "the-bug-that-only-showed-up-with-pasted-schemas", title: "The bug that only showed up with pasted schemas", titleIt: "Il bug che appariva solo con schemi incollati" },
  { slug: "the-laravel-schema-nobody-chose", title: "The Laravel schema nobody chose", titleIt: "Lo schema Laravel che nessuno ha scelto" },
];
