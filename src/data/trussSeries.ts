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
];
