import * as superagent from "superagent";

interface Image
{
	full: string;
	sprite: string;
	group: string;
	x: number;
	y: number;
	w: number;
	h: number;
}

interface ChampionInfo
{
	attack: number;
	defense: number;
	magic: number;
	difficulty: number;
}

interface ChampionStats
{
	hp: number;
	hpperlevel: number;
	mp: number;
	npperlevel: number;
	movespeed: number;
	armor: number;
	armorperlevel: number;
	spellblock: number;
	spellblockperlevel: number;
	attackrange: number;
	hpregen: number;
	hpregenperlevel: number;
	mpregen: number;
	mpregenperlevel: number;
	crit: number;
	critperlevel: number;
	attackdamage: number;
	attackdamageperlevel: number;
	attackspeedperlevel: number;
	attackspeed: number;
}

interface Champion
{
	version: string;
	id: string;
	key: string;
	name: string;
	title: string;
	blurb: string;
	info: ChampionInfo;
	image: Image;
	tags: Array<string>;
	partype: string;
	stats: ChampionStats;
}

interface ItemRune
{
	isrune: boolean;
	tier: number;
	type: string;
}

interface ItemGold
{
	base: number;
	total: number;
	sell: number;
	purchasable: boolean;
}

interface ItemStats
{
	FlatHPPoolMod: number;
	rFlatHPModPerLevel: number,
	FlatMPPoolMod: number,
	rFlatMPModPerLevel: number,
	PercentHPPoolMod: number,
	PercentMPPoolMod: number,
	FlatHPRegenMod: number,
	rFlatHPRegenModPerLevel: number,
	PercentHPRegenMod: number,
	FlatMPRegenMod: number,
	rFlatMPRegenModPerLevel: number,
	PercentMPRegenMod: number,
	FlatArmorMod: number,
	rFlatArmorModPerLevel: number,
	PercentArmorMod: number,
	rFlatArmorPenetrationMod: number,
	rFlatArmorPenetrationModPerLevel: number,
	rPercentArmorPenetrationMod: number,
	rPercentArmorPenetrationModPerLevel: number,
	FlatPhysicalDamageMod: number,
	rFlatPhysicalDamageModPerLevel: number,
	PercentPhysicalDamageMod: number,
	FlatMagicDamageMod: number,
	rFlatMagicDamageModPerLevel: number,
	PercentMagicDamageMod: number,
	FlatMovementSpeedMod: number,
	rFlatMovementSpeedModPerLevel: number,
	PercentMovementSpeedMod: number,
	rPercentMovementSpeedModPerLevel: number,
	FlatAttackSpeedMod: number,
	PercentAttackSpeedMod: number,
	rPercentAttackSpeedModPerLevel: number,
	rFlatDodgeMod: number,
	rFlatDodgeModPerLevel: number,
	PercentDodgeMod: number,
	FlatCritChanceMod: number,
	rFlatCritChanceModPerLevel: number,
	PercentCritChanceMod: number,
	FlatCritDamageMod: number,
	rFlatCritDamageModPerLevel: number,
	PercentCritDamageMod: number,
	FlatBlockMod: number,
	PercentBlockMod: number,
	FlatSpellBlockMod: number,
	rFlatSpellBlockModPerLevel: number,
	PercentSpellBlockMod: number,
	FlatEXPBonus: number,
	PercentEXPBonus: number,
	rPercentCooldownMod: number,
	rPercentCooldownModPerLevel: number,
	rFlatTimeDeadMod: number,
	rFlatTimeDeadModPerLevel: number,
	rPercentTimeDeadMod: number,
	rPercentTimeDeadModPerLevel: number,
	rFlatGoldPer10Mod: number,
	rFlatMagicPenetrationMod: number,
	rFlatMagicPenetrationModPerLevel: number,
	rPercentMagicPenetrationMod: number,
	rPercentMagicPenetrationModPerLevel: number,
	FlatEnergyRegenMod: number,
	rFlatEnergyRegenModPerLevel: number,
	FlatEnergyPoolMod: number,
	rFlatEnergyModPerLevel: number,
	PercentLifeStealMod: number,
	PercentSpellVampMod: number
}

interface Item
{
	name: string;
	rune: ItemRune;
	image: Image;
	gold: ItemGold;
	group: string;
	description: string;
	colloq: string;
	plaintext: string;
	consumed: false;
	stacks: number;
	depth: number;
	consumeOnFull: boolean;
	from: Array<string>;
	into: Array<string>;
	specialRecipe: number;
	inStore: boolean;
	hideFromAll: boolean;
	requiredChampion: string;
	requiredAlly: string;
	stats: ItemStats;
	tags: Array<string>;
	maps: Map<string, boolean>;
}

export class DDragon
{
	/** Version of the game used */
	private _version: string;

	/** Champions dataset */
	private _champions: Map<string, Champion>;
	/** Items dataset */
	private _items: Map<string, Item>;

	/**
	 * @param version - version of the game to use
	 */
	constructor(version: string)
	{
		this._version = version;

		this._champions = new Map();
		this._items = new Map();
	}

	public static async getLatestVersion(): Promise<string>
	{
		let response = await superagent.get('https://ddragon.leagueoflegends.com/api/versions.json');
		let data = JSON.parse(response.text);
		return data[0];
	}

	/**
	 * Fetches a dataset from DDragon
	 * @param key - dataset to fetch
	 */
	private async fetchData<T>(key: string): Promise<Map<string, T>>
	{
		let response = await superagent.get(`https://ddragon.leagueoflegends.com/cdn/${this._version}/data/en_US/${key}.json`);
		let data = JSON.parse(response.text);

		let res: Map<string, T> = new Map();

		for (let champ in data.data)
		{
			res.set(champ, data.data[champ]);
		}

		return res;
	}

	/**
	 * Fetches and returns the champions dataset from DDragon
	 *
	 * @remarks
	 * Does not do anything if this dataset was already cached.
	 */
	public async fetchChampions(): Promise<Map<string, Champion>>
	{
		if (this._champions.size == 0)
		{
			this._champions = await this.fetchData<Champion>("champion");
		}

		return this._champions;
	}

	/**
	 * Fetches and returns the items dataset from DDragon
	 *
	 * @remarks
	 * Does not do anything if this dataset was already cached.
	 */
	public async fetchItems(): Promise<Map<string, Item>>
	{
		if (this._items.size == 0)
		{
			this._items = await this.fetchData<Item>("item");
		}

		return this._items;
	}

	/**
	 * Gets a champion by its key
	 * @param key - the key of the champion
	 */
	public getChampionByKey(key: string | number): Champion | undefined
	{
		if (typeof(key) === 'number')
		{
			key = key.toString();
		}

		for (let champion of this._champions.values())
		{
			if (champion.key == key)
			{
				return champion;
			}
		}

		return undefined;
	}

	/**
	 * Gets a champion by its name (ignoring case)
	 * @param name - the name of the champion
	 */
	public getChampionByName(name: string): Champion | undefined
	{
		let tmp = name.toLowerCase();

		for (let champion of this._champions.values())
		{
			if (champion?.name.toLowerCase() == tmp)
			{
				return champion;
			}
		}

		return undefined;
	}

	/**
	 * Gets an item by its key
	 * @param key - the key of the item
	 */
	public getItemByKey(key: string | number): Item | undefined
	{
		if (typeof(key) === 'number')
		{
			key = key.toString();
		}

		return this._items.get(key);
	}

	/**
	 * Gets an item by its name (ignoring case)
	 * @param name - the name of the item
	 */
	public getItemByName(name: string): Item | undefined
	{
		name = name.toLowerCase();

		for (let item of this._items.values())
		{
			if (item.name.toLowerCase() == name)
			{
				return item;
			}
		}

		return undefined;
	}

	/**
	 * @returns currently cached champions dataset
	 */
	public get champions(): Map<string, Champion>
	{
		return this._champions;
	}

	/**
	 * @returns currently cached items dataset
	 */
	public get items(): Map<string, Item>
	{
		return this._items;
	}
}
