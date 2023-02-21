import BuildBlockItem from "./item";

import { ConversionError } from "../../../types/error";
import { ItemSetBlock, ItemSetBlockItem } from "../../../types/itemset";

import { DataDragon } from "data-dragon";
import he from "he";
import { HTMLElement } from "node-html-parser";

export default class BuildBlock {
  private _root: HTMLElement;

  constructor(root: HTMLElement) {
    this._root = root;
  }

  toItemSetBlock(
    dragon: DataDragon,
    ignoreUnknownItems: boolean,
  ): ItemSetBlock {
    const items: ItemSetBlockItem[] = [];
    for (const blockItem of this.getBlockItems()) {
      const item = blockItem.toItemSetBlockItem(dragon);
      if (item) {
        items.push(item);
      } else if (!ignoreUnknownItems) {
        throw ConversionError.scraper(
          `Cannot find item \`${blockItem.getName()}' in version ${
            dragon.version
          }`,
        );
      }
    }
    return {
      showIfSummonerSpell: "",
      hideIfSummonerSpell: "",
      items,
      type: this.getTitle(),
    };
  }

  getTitle(): string {
    const title = this._root.querySelector(
      "div:nth-child(1) > span:nth-child(1)",
    );
    if (!title) {
      throw ConversionError.scraper("Cannot get the build block title");
    }
    return he.decode(title.innerText).trim();
  }

  private getBlockItems(): BuildBlockItem[] {
    return this.getItemRoots().map((root) => new BuildBlockItem(root));
  }

  private getItemRoots(): HTMLElement[] {
    return this._root.querySelectorAll("div:nth-child(2) > span");
  }
}
