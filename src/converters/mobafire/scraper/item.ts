import { ConversionError } from "../../../types/error";
import { ItemSetBlockItem } from "../../../types/itemset";

import { DataDragon } from "data-dragon";
import he from "he";
import { HTMLElement } from "node-html-parser";

export default class BuildBlockItem {
  private _root: HTMLElement;

  constructor(root: HTMLElement) {
    this._root = root;
  }

  toItemSetBlockItem(dragon: DataDragon): ItemSetBlockItem | undefined {
    const name = this.getName().toLowerCase();
    const item = dragon.items.find((item) => item.name.toLowerCase() === name);
    if (!item) {
      return;
    }
    const id = dragon.items.keyOf(item);
    if (!id) {
      return;
    }
    const count = this.getCount();
    return { id, count };
  }

  getName(): string {
    const name = this._root.querySelector("a:nth-child(1) > span:nth-child(2)");
    if (!name) {
      throw ConversionError.scraper("Cannot get the item name");
    }
    return he.decode(name.innerText).trim();
  }

  getCount(): number {
    const count = this._root.querySelector(
      "a:nth-child(1) > label:nth-child(3)",
    );
    if (count !== null) {
      return Number(he.decode(count.innerText).trim());
    }
    return 1;
  }
}
