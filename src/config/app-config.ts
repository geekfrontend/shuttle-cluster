import packageJson from "../../package.json";

const currentYear = new Date().getFullYear();

export const APP_CONFIG = {
  name: "ShuttleCluster",
  version: packageJson.version,
  copyright: `© ${currentYear}, ShuttleCluster.`,
  meta: {
    title: "ShuttleCluster",
    description: "Admin dashboard.",
  },
};
