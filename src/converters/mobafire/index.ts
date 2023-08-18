import Guide from "./scraper";

import { ItemSet } from "../../types/itemset";
import { ConversionParameters } from "../../types/params";

import { DataDragon } from "data-dragon";

export default async (
  dragon: DataDragon,
  parameters: MobafireParameters,
): Promise<ItemSet> => {
  const guide = await Guide.fetch(parameters.url);
  const champ = guide.getAssociatedChampion(dragon);
  const associatedChampions = champ ? [Number(champ.key)] : [];
  const buildIndex = parameters?.buildIndex ?? 0;
  const build = guide.getBuild(buildIndex);
  const title = parameters?.outputTitle || guide.getTitle() || "Unnamed";
  const blocks = build.toItemSetBlocks(
    dragon,
    parameters?.ignoreUnknownItems ?? false,
  );
  return {
    associatedChampions,
    associatedMaps: [],
    title,
    blocks,
  };
};

export interface MobafireParameters extends ConversionParameters {
  /** URL of the guide to convert. */
  url: string | URL;
  /** Title of the output item set. */
  outputTitle?: string;
  /** Index of the build to convert (starting from 0). */
  buildIndex?: number;
}
