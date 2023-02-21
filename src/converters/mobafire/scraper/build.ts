import BuildBlock from "./block";

import { ItemSetBlock } from "../../../types/itemset";

import { DataDragon } from "data-dragon";
import { HTMLElement } from "node-html-parser";

export default class Build {
  private _root: HTMLElement;

  constructor(root: HTMLElement) {
    this._root = root;
  }

  toItemSetBlocks(
    dragon: DataDragon,
    ignoreUnknownItems: boolean,
  ): ItemSetBlock[] {
    return this.getBlockRoots().map((root) => {
      const block = new BuildBlock(root);
      return block.toItemSetBlock(dragon, ignoreUnknownItems);
    });
  }

  private getBlockRoots(): HTMLElement[] {
    return this._root.querySelectorAll("div.view-guide__items");
  }
}
