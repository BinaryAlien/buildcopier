import { DDragon, Champion } from "./ddragon";
import * as superagent from "superagent";
import { parse } from "node-html-parser";
import { decode } from "he";
import { patch } from "superagent";

/** Maximum length for an item set name */
const setNameMaxLength = 75;

const regexMobafireUrl: RegExp = new RegExp("^(https?:\/\/)?(www\.)?mobafire\.com\/league-of-legends\/build\/[A-Za-z0-9-]+-[0-9]{6}$");

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
	 * @param opt - version of the game/DDragon instance to use
	 */
	constructor(opt: string | DDragon)
	{
		if (typeof(opt) === 'string')
		{
			this._ddragon = new DDragon(opt);
		}
		else
		{
			this._ddragon = opt;
		}
	}

	/**
	 * Translates a MOBAfire build into a League of Legends clipboard import
	 * @param setName - the name of the output item set
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
			throw Error("Unexpected response from the MOBAfire server. Returned status code " + response.status);
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

		const builds = root.querySelectorAll("div.view-guide__build");

		if (buildIndex < 0 || buildIndex >= builds.length)
		{
			buildIndex = 0;
		}

		const blocksHtml = builds[buildIndex].querySelectorAll("div.view-guide__build__items > div.collapseBox div.view-guide__items");

		const blocks: Array<ItemSetBlock> = [];

		for (const blockHtml of blocksHtml)
		{
			const block: ItemSetBlock = {
				showIfSummonerSpell: "",
				hideIfSummonerSpell: "",
				items: [],
				type: ""
			};

			const blockTitle = decode(blockHtml.querySelector("div.view-guide__items__bar > span").innerText);
			block.type = blockTitle;

			const blockItemsHtml = blockHtml.querySelectorAll("div.view-guide__items__content > span.ajax-tooltip");

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
					console.error(`Item not found in version ${this._ddragon.version}: ${itemName}`);
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

	/**
	 * Translates a Mobalytics build for the given champion
	 * @param setName - the name of the output item set
	 * @param champ - the champion or its name/ID/key
	 * @param buildId - the ID of the build to translate
	 */
	public async translateMobalytics(setName: string, champ: Champion | string | number, buildId: number): Promise<string>
	{
		setName = setName.trim();

		if (setName.length < 1 || setName.length > setNameMaxLength)
		{
			throw Error(`setName must not be empty and have a length smaller than or equal to ${setNameMaxLength}`);
		}

		let champion: Champion | undefined;

		await this._ddragon.fetchChampions();

		if (typeof(champ) === "string")
		{
			// get the champion by name
			champion = this._ddragon.getChampionByName(champ);

			// otherwise get the champion by ID
			if (!champion)
			{
				champion = this._ddragon.getChampionById(champ);
			}

			// otherwise get the champion by key
			if (!champion)
			{
				champion = this._ddragon.getChampionByKey(champ);
			}
		}
		// the champion is already provided
		else if (typeof(champ) != "number")
		{
			champion = champ;
		}
		// get the champion by key
		else
		{
			champion = this._ddragon.getChampionByKey(Number(champ));
		}

		// champion was not found
		if (!champion)
		{
			throw Error(`Champion with name/ID/key ${champ} not found in version ${this._ddragon.version}`);
		}

		const tmp = this._ddragon.version.split(".");
		const patch = tmp[0] + "." + tmp[1];

		const response = await superagent
			.post("https://app.mobalytics.gg/api/lol/graphql/v1/query")
			.send({
				operationName: "LolChampionPageQuery",
				query: "query LolChampionPageQuery($slug: String!, $summonerRegion: Region, $summonerName: String, $role: Rolename, $patch: String, $queue: VirtualQueue, $rank: LolChampionRankFilter, $region: Region, $vsChampionSlug: String, $buildId: Int, $withCommon: Boolean!, $withBuildsList: Boolean!, $withBuild: Boolean!, $withCountersList: Boolean!, $withCounter: Boolean!, $withFilters: Boolean!) {  lol {    ...ChampionFiltersFragment @include(if: $withFilters)    ...ChampionDynamicCommonDataFragment @include(if: $withCommon)    ...ChampionBuildsListFragment @include(if: $withBuildsList)    ...ChampionBuildOnlyFragment @include(if: $withBuild)    ...ChampionCountersListFragment @include(if: $withCountersList)    ...ChampionCounterFragment @include(if: $withCounter)    __typename  }}fragment ChampionBuildsListFragment on LoL {  builds: champion(    filters: {slug: $slug, role: $role, patch: $patch, queue: $queue, rank: $rank, region: $region}  ) {    ...ChampionBuildsOptionsFragment    stats {      ...ChampionBuildsStatsFragment      __typename    }    synergies {      ...ChampionBuildSynergiesListFragment      __typename    }    __typename  }  __typename}fragment ChampionBuildsStatsFragment on LolChampionStats {  rankTotal  rankValue  tier  banRateHistory {    value    x    __typename  }  pickRateHistory {    value    x    __typename  }  winRateHistory {    value    x    __typename  }  __typename}fragment ChampionBuildsOptionsFragment on LolChampion {  buildsOptions {    options {      ...ChampionBuildOptionFragment      __typename    }    __typename  }  __typename}fragment ChampionBuildOptionFragment on LolChampionBuild {  id  championSlug  type  vsChampionSlug  vsRole  stats {    wins    matchCount    __typename  }  proPlayer {    icon    label    name    rank {      tier      division      __typename    }    __typename  }  __typename}fragment ChampionBuildSynergiesListFragment on LolChampionMatchupSynergyList {  type  synergies {    championSlug    role    winRate    __typename  }  __typename}fragment ChampionFiltersFragment on LoL {  filters: champion(    filters: {slug: $slug, role: $role, patch: $patch, queue: $queue, rank: $rank, region: $region}  ) {    filtersOptions {      patches      queues      ranks      regions      roles      __typename    }    activeFilters {      patch      queue      rank      region      role      slug      __typename    }    __typename  }  __typename}fragment ChampionCounterMetricsFragment on LolChampionCounterMetrics {  csm  dpm  dtc  dto  gd15  kda  kp  looses  wins  __typename}fragment ChampionBuildOnlyFragment on LoL {  selectedBuild: champion(    filters: {slug: $slug, role: $role, patch: $patch, queue: $queue, rank: $rank, region: $region}  ) {    ...ChampionBuildsBuildFragment    __typename  }  __typename}fragment ChampionBuildsBuildFragment on LolChampion {  build: build(filters: {buildId: $buildId}) {    ...ChampionBuildFragment    __typename  }  __typename}fragment ChampionBuildFragment on LolChampionBuild {  id  championSlug  items {    ...ChampionBuildItemFragment    __typename  }  patch  perks {    IDs    style    subStyle    __typename  }  proPlayer {    icon    label    name    rank {      tier      division      __typename    }    __typename  }  queue  skillOrder  vsChampionSlug  spells  stats {    matchCount    wins    __typename  }  type  vsRole  role  __typename}fragment ChampionBuildItemFragment on LolChampionBuildItemsList {  items  timeToTarget  type  __typename}fragment ChampionCountersListFragment on LoL {  countersVsChampionStats: player(    region: $summonerRegion    summonerName: $summonerName  ) {    championsMatchups(      top: 200      skip: 0      mode: Worst      filter: {championSlug: $slug, rolename: $role, queue: $queue}    ) {      items {        ...SummonerVsChampionStatsFragment        __typename      }      __typename    }    __typename  }  counters: champion(    filters: {slug: $slug, role: $role, patch: $patch, queue: $queue, rank: $rank, region: $region}  ) {    countersOptions {      options {        ...ChampionCounterOptionFragment        __typename      }      __typename    }    __typename  }  __typename}fragment ChampionCounterOptionFragment on LolChampionCounter {  matchupSlug  matchupRole  counterMetrics {    ...ChampionCounterMetricsFragment    __typename  }  __typename}fragment ChampionCounterFragment on LoL {  vsChampionCounter: champion(    filters: {slug: $slug, role: $role, patch: $patch, queue: $queue, rank: $rank, region: $region}  ) {    counter: counter(filters: {vsChampionSlug: $vsChampionSlug}) {      ...ChampionVsChampionFragment      __typename    }    itemPath: build(filters: {vsChampionSlug: $vsChampionSlug}) {      itemsPath {        path {          ...ChampionCounterItemPathFragment          __typename        }        __typename      }      __typename    }    __typename  }  __typename}fragment ChampionVsChampionFragment on LolChampionCounter {  counterMetrics {    ...ChampionCounterMetricsFragment    __typename  }  matchupRole  matchupSlug  ownMetrics {    ...ChampionCounterMetricsFragment    __typename  }  __typename}fragment SummonerVsChampionStatsFragment on LolPlayerChampionMatchupStatsItem {  kda {    kills    deaths    assists    __typename  }  championId  csm  damageDiffPerMinute  goldDiff15  kp  looses  wins  role  __typename}fragment ChampionCounterItemPathFragment on LolChampionBuildItemsPathStep {  items {    buildPath    id    __typename  }  type  __typename}fragment ChampionDynamicCommonDataFragment on LoL {  relatedChampions: championsList(filters: {slug: $slug}) {    champions {      relatedChampionsIds      __typename    }    __typename  }  championRoles: championsList {    champions {      ...ChampionsListDynamicChampionFragment      __typename    }    __typename  }  __typename}fragment ChampionsListDynamicChampionFragment on LolChampionsListItem {  id  roles  __typename}",
				variables: {
					buildId: buildId,
					patch: patch,
					queue: null,
					rank: null,
					region: null,
					role: null,
					slug: champion.id.toLowerCase(),
					summonerName: null,
					summonerRegion: null,
					withBuild: true,
					withBuildsList: false,
					withCommon: false,
					withCounter: false,
					withCountersList: false,
					withFilters: true
				}
			}).set("content-type", "application/json");

		if (response.status != 200)
		{
			throw Error("Unexpected response from the Mobalytics server. Returned status code " + response.status);
		}

		const data = JSON.parse(response.text);

		const blocks: Array<ItemSetBlock> = [];

		for (const itemBlock of data.data.lol.selectedBuild.build.items)
		{
			let blockTitle = itemBlock.type;

			if (itemBlock?.timeToTarget >= 60)
			{
				let minutes = Math.round(itemBlock.timeToTarget / 60);
				blockTitle += " @ " + minutes + " min";
			}

			const block: ItemSetBlock = {
				showIfSummonerSpell: "",
				hideIfSummonerSpell: "",
				type: blockTitle,
				items: []
			};

			const items: Map<number, number> = new Map();

			for (const item of itemBlock.items)
			{
				let cur: number | undefined = items.get(item);

				if (cur)
				{
					items.set(item, cur + 1);
				}
				else
				{
					items.set(item, 1);
				}
			}

			for (const [id, count] of items)
			{
				block.items.push({
					id: id.toString(),
					count: count
				});
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

	/**
	 * Translates the OP.GG build for a given champion and role
	 * @param setName - the name of the output item set
	 * @param champ - the champion or its name/ID/key
	 * @param role - the role
	 */
	public async translateOpDotGg(setName: string, champ: Champion | string | number, role: RolesOpDotGg): Promise<string>
	{
		setName = setName.trim();

		if (setName.length < 1 || setName.length > setNameMaxLength)
		{
			throw Error(`setName must not be empty and have a length smaller than or equal to ${setNameMaxLength}`);
		}

		let champion: Champion | undefined;

		await this._ddragon.fetchChampions();

		if (typeof(champ) === "string")
		{
			// get the champion by name
			champion = this._ddragon.getChampionByName(champ);

			// otherwise get the champion by ID
			if (!champion)
			{
				champion = this._ddragon.getChampionById(champ);
			}

			// otherwise get the champion by key
			if (!champion)
			{
				champion = this._ddragon.getChampionByKey(champ);
			}
		}
		// the champion is already provided
		else if (typeof(champ) != "number")
		{
			champion = champ;
		}
		// get the champion by key
		else
		{
			champion = this._ddragon.getChampionByKey(Number(champ));
		}

		// champion was not found
		if (!champion)
		{
			throw Error(`Champion with name/ID/key ${champ} not found in version ${this._ddragon.version}`);
		}

		await this._ddragon.fetchItems();

		const url = `https://www.op.gg/champion/${champion.name}/statistics/${role}`;

		const response = await superagent.get(url);
		const root = parse(response.text);

		const rows = root
			.querySelectorAll("table.champion-overview__table")[1]
			.querySelectorAll("tbody > tr")

		let categoryTitle = "???";

		const blocks: Array<ItemSetBlock> = [];

		for (const row of rows)
		{
			const block: ItemSetBlock = {
				showIfSummonerSpell: "",
				hideIfSummonerSpell: "",
				items: [],
				type: "???"
			};

			const isNewCategory = row.getAttribute("class")?.indexOf("champion-overview__row--first") != -1;

			if (isNewCategory)
			{
				categoryTitle = row.querySelector("th").innerText;
			}

			const pickRate = row.querySelector("td.champion-overview__stats--pick > strong").innerText;

			block.type = categoryTitle + " (" + pickRate + ")";

			const itemsHtml = row.querySelectorAll("td.champion-overview__data.champion-overview__border.champion-overview__border--first > ul > li.champion-stats__list__item.tip");

			for (const itemHtml of itemsHtml)
			{
				const src = itemHtml.querySelector("img").getAttribute("src");

				if (src)
				{
					const ref = new URL("https:" + src);
					const pathTokens = ref.pathname.split("/");
					const filename = pathTokens[pathTokens.length - 1];
					const id = filename.substring(0, filename.length - 4);

					block.items.push({
						id: id,
						count: 1
					});
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
