import Build from "./build";

import { ConversionError } from "../../../types/error";

import axios from "axios";
import { Champion, DataDragon } from "data-dragon";
import he from "he";
import { HTMLElement, parse } from "node-html-parser";

export default class Guide {
  static readonly URL_REGEX =
    /^https?:\/\/(?:www\.)?mobafire\.com\/league-of-legends\/build\/[0-9A-Za-z-]+-[0-9]{6}(?:#.*)?$/;

  private readonly _document: HTMLElement;

  constructor(html: string) {
    this._document = parse(html);
  }

  static async fetch(url: string | URL): Promise<Guide> {
    if (!this.isValidUrl(url))
      throw ConversionError.input("Invalid MOBAfire guide URL");
    try {
      const response = await axios.get(url.toString());
      return new Guide(response.data);
    } catch (error) {
      throw ConversionError.network(error, "Cannot fetch MOBAfire guide: ");
    }
  }

  static isValidUrl(url: string | URL): boolean {
    if (url instanceof URL) {
      url = url.toString();
    }
    return Guide.URL_REGEX.test(url);
  }

  getAssociatedChampion(dragon: DataDragon): Champion | undefined {
    const name = this.getAssociatedChampionName();
    return dragon.champions.find((champion) => champion.name === name);
  }

  getTitle(): string {
    const title = this._document.querySelector(
      "h1.view-guide__banner__title:nth-child(1) > span",
    );
    if (!title) {
      throw ConversionError.scraper("Cannot get the title of the guide");
    }
    return he.decode(title.innerText).trim();
  }

  getBuild(index: number): Build {
    if (index < 0) {
      throw ConversionError.input("Invalid build index: must start from 0");
    }
    if (index >= this.getBuildCount()) {
      throw ConversionError.input(
        `Invalid build index: the guide has ${this.getBuildCount()} build` +
          (this.getBuildCount() === 1 ? "" : "s"),
      );
    }
    return new Build(this.getBuildRoots()[index]);
  }

  getBuildCount(): number {
    return this.getBuildRoots().length;
  }

  private getAssociatedChampionName(): string {
    const header = this._document.querySelector(".mobile-sr");
    if (!header) {
      throw ConversionError.scraper("Cannot get the header of the guide");
    }
    return he.decode(header.innerText).split("\n")[1].trim();
  }

  private getBuildRoots(): HTMLElement[] {
    return this._document.querySelectorAll(".view-guide__build");
  }
}
