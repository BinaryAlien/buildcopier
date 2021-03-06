# buildcopier

## What is it ?

buildcopier is a TypeScript library which is able to translate online League of Legends builds into clipboard imports.
This is the successor and upgraded version of its Python equivalent `itemsetcopier` which I do not support anymore.

## How to use it

First you must import and create an instance of `BuildCopier` :

```typescript
import { BuildCopier } from "buildcopier";

// You can instantiate one by providing it the
// League of Legends version it should use :

const bc: BuildCopier = new BuildCopier("11.4.1");

// ... or by providing it a DDragon instance
// The above example which is equivalent to doing

import { DDragon } from "ddragon";

const ddragon = new DDragon("11.4.1");
const bc = new BuildCopier(ddragon);
```

You can also use the `DDragon.getLatestVersion` asynchronous function to fetch the latest version of the game.

When you have your `BuildCopier` instance, you can simply use the translating methods it provides. For example let's translate a MOBAfire build :

```typescript
import { BuildCopier } from "buildcopier";

const bc = new BuildCopier("11.4.1");

// the name for the item set
const setName = "Graves Jungle S11";

// the URL of the MOBAfire guide
const url = "https://www.mobafire.com/league-of-legends/build/season-11-kami-challenger-graves-jungle-guide-530114";

// the index of the build we want (an invalid index will result in it being set to 0)
const buildIndex = 0;

// we translate the build

bc.translateMobafire(setName, url, buildIndex).then((result: string) =>
{
	// we can now copy and paste the generate clipboard
	// import in League of Legends and voilà !
	console.log(result);
}).catch((err) =>
{
	console.error("An error has occured: " + err);
});
```

Each translating method may have different parameters which are documented !

## Dependencies

buildcopier uses `superagent` to make its HTTP requests, `node-html-parser` to parse HTML pages and `he` to decode HTML entities.
A test suite for `DDragon` is available under `tests` which is made using `jest`.

## Web Application

buildcopier has been implemented as a web application on my website which you can use [here](https://binaryalien.net/buildcopier/index.html) !
