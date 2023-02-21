export interface ItemSetBlockItem {
  id: string;
  count: number;
}

export interface ItemSetBlock {
  showIfSummonerSpell: string;
  hideIfSummonerSpell: string;
  items: ItemSetBlockItem[];
  type: string;
}

export interface ItemSet {
  associatedChampions: number[];
  associatedMaps: number[];
  title: string;
  blocks: ItemSetBlock[];
}
