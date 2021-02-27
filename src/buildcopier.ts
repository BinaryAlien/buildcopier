import { DDragon, Champion } from "./ddragon";
import * as superagent from "superagent";
import { parse } from "node-html-parser";
import { decode } from "he";

/** Maximum length for an item set name */
const setNameMaxLength = 75;

const regexMobafireUrl: RegExp = new RegExp("^(https?:\/\/)?(www\.)?mobafire\.com\/league-of-legends\/build\/[A-Za-z0-9-]+-[0-9]{6}$");

export enum RolesMobalytics
{
	Top = "top",
	Jungle = "jungle",
	Middle = "mid",
	Bottom = "adc",
	Support = "support"
}

export enum RolesOpDotGg
{
	Top = "top",
	Jungle = "jungle",
	Middle = "mid",
	Bottom = "bot",
	Support = "support"
}

interface ItemSetBlockItem
{
	id: string;
	count: number;
}

interface ItemSetBlock
{
	showIfSummonerSpell: string;
	hideIfSummonerSpell: string;
	items: Array<ItemSetBlockItem>;
	type: string;
}

interface ItemSet
{
	associatedChampions: Array<number>;
	associatedMaps: Array<number>;
	title: string;
	blocks: Array<ItemSetBlock>;
}

export class BuildCopier
{
	private _ddragon: DDragon;

	/**
	 * @param version - version of the game to use
	 */
	constructor(version: string)
	{
		this._ddragon = new DDragon(version);
	}

	/**
	 * Translates a MOBAfire build into a League of Legends clipboard import
	 * @param setName - the name of the item set when importing into the game
	 * @param url - the URL of the MOBAfire's guide page
	 * @param buildIndex - the index of the build to copy
	 */
	public async translateMobafire(setName: string, url: string, buildIndex: number): Promise<string>
	{
		setName = setName.trim();

		if (setName.length < 1 || setName.length > setNameMaxLength)
		{
			throw Error(`setName must not be empty and have a length smaller than or equal to ${setNameMaxLength}`);
		}

		if (!regexMobafireUrl.test(url))
		{
			throw Error("Invalid MOBAfire guide URL");
		}

		const response = await superagent.get(url);

		if (response.status != 200)
		{
			throw Error("Unexpected response from the MOBAfire's guide page. Server returned status code " + response.status);
		}

		await this._ddragon.fetchItems();
		await this._ddragon.fetchChampions();

		const root = parse(response.text);

		const title = decode(root.querySelector("title").innerText);
		let championName: string = "";

		for (const word of title.split(" "))
		{
			if (word == "Build")
			{
				break;
			}

			championName += word + " ";
		}

		const champion = this._ddragon.getChampionByName(championName);

		if (!champion)
		{
			throw Error(`Champion not found '${championName}'`);
		}

		const builds = root.querySelectorAll('div.view-guide__build');

		if (buildIndex < 0 || buildIndex >= builds.length)
		{
			buildIndex = 0;
		}

		const blocksHtml = builds[buildIndex]
			.querySelector("div.view-guide__build__items")
			.querySelector("div.collapseBox")
			.querySelectorAll("div.view-guide__items");

		const blocks: Array<ItemSetBlock> = [];

		for (const blockHtml of blocksHtml)
		{
			const block: ItemSetBlock = {
				showIfSummonerSpell: "",
				hideIfSummonerSpell: "",
				items: [],
				type: ""
			};

			const blockTitle = decode(blockHtml.querySelector('div.view-guide__items__bar > span').innerText);
			block.type = blockTitle;

			const blockItemsHtml = blockHtml
				.querySelector("div.view-guide__items__content")
				.querySelectorAll("span.ajax-tooltip");

			for (const itemHtml of blockItemsHtml)
			{
				const itemName = decode(itemHtml.querySelector("a > span").innerText);
				const countTag = itemHtml.querySelector("a > label");
				let count: number;

				if (countTag)
				{
					count = Number(countTag.innerText);
				}
				else
				{
					count = 1;
				}

				const itemKey = this._ddragon.getItemKey(itemName);

				if (itemKey)
				{
					block.items.push({
						id: itemKey,
						count: count
					});
				}
				else
				{
					console.error("\"" + itemName + "\"");
				}
			}

			blocks.push(block);
		}

		return JSON.stringify({
			associatedChampions: [Number(champion.key)],
			associatedMaps: [],
			title: setName,
			blocks: blocks
		});
	}
}

const bc = new BuildCopier("11.4.1");
