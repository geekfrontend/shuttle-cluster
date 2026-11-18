// Data pemain. Semua user bisa melihat; tambah, ubah, hapus khusus admin.
export const en = {
  genders: { male: "Male", female: "Female" },
  list: {
    metaTitle: "Players",
    title: "Players",
    description: "Players whose matches are used for clustering.",
    searchPlaceholder: "Search name, country, or external ID…",
    gender: "Gender",
    add: "Add player",
    empty: "No players yet",
    emptyDescription: "Add players, then record their matches.",
    columns: {
      player: "Player",
      gender: "Gender",
      country: "Country",
      matches: "Matches",
      externalId: "External ID",
      created: "Added",
    },
  },
  rowActions: { edit: "Edit", delete: "Delete" },
  delete: {
    title: "Delete {name}?",
    description: "Only players without matches can be deleted. This cannot be undone.",
    confirm: "Delete",
  },
  form: {
    createTitle: "Add player",
    createDescription: "A player can then be picked in matches of their category.",
    editTitle: "Edit {name}",
    editDescription: "Gender cannot be changed once the player has matches.",
    name: "Name",
    nameRequired: "Enter a name.",
    gender: "Gender",
    country: "Country",
    countryHint: "3-letter code, e.g. INA or DEN.",
    countryInvalid: "Use 3 letters.",
    externalId: "External ID",
    externalIdHint: "ID in the data source (e.g. BWF), used to avoid duplicates on import.",
    create: "Add player",
    save: "Save changes",
  },
};

export type PlayersMessages = typeof en;
