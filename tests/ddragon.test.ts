import { DDragon } from "../src/ddragon";

const version = "11.4.1";

test("fetchChampions", () =>
{
	let dragon: DDragon = new DDragon(version);

	expect(dragon.champions.size).toBe(0);

	dragon.fetchChampions().then(() =>
	{
		expect(dragon.champions.size).toBe(154);
	});
});

test("fetchItems", () =>
{
	let dragon: DDragon = new DDragon(version);

	expect(dragon.items.size).toBe(0);

	dragon.fetchItems().then(() =>
	{
		expect(dragon.items.size).toBe(201);
	});
});

test("getChampionByKey", () =>
{
	let dragon: DDragon = new DDragon(version);

	dragon.fetchChampions().then(() =>
	{
		expect(dragon.getChampionByKey("266").name).toBe("Aatrox");
		expect(dragon.getChampionByKey(104).name).toBe("Graves");
		expect(dragon.getChampionByKey(0)).toBeUndefined();
	});
});

test("getChampionByName", () =>
{
	let dragon: DDragon = new DDragon(version);

	dragon.fetchChampions().then(() =>
	{
		expect(dragon.getChampionByName("AATROX").key).toBe("266");
		expect(dragon.getChampionByName("graves").key).toBe("104");
		expect(dragon.getChampionByName("---")).toBeUndefined();
	});
});

test("getItemByKey", () =>
{
	let dragon: DDragon = new DDragon(version);

	dragon.fetchItems().then(() =>
	{
		expect(dragon.getItemByKey("2010").name).toBe("Total Biscuit of Everlasting Will");
		expect(dragon.getItemByKey(1001).name).toBe("Boots");
		expect(dragon.getItemByKey(0)).toBeUndefined();
	});
});

test("getItemByName", () =>
{
	let dragon: DDragon = new DDragon(version);

	dragon.fetchItems().then(() =>
	{
		expect(dragon.getItemByName("Total Biscuit of Everlasting Will").gold.total).toBe(75);
		expect(dragon.getItemByName("Boots").stats.FlatMovementSpeedMod).toBe(25);
	});
});