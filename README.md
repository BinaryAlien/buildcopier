# buildcopier

🪄 TypeScript library which converts online League of Legends builds into clipboard imports.

## Web Application

A web application which reflects this library's functionality is available on [BinaryAlien.net](https://www.binaryalien.net/buildcopier/index.html).

## Usage

First of all, you must **instantiate** a `DataDragon` object from the [`data-dragon`](https://github.com/BinaryAlien/data-dragon) dependency.

This `DataDragon` object will be used by the converter to perform lookup of the champions and items in the online builds.

```javascript
import { DataDragon } from "data-dragon";

// Specify a game version manually ...
const dragon = new DataDragon("13.15.1");

// ... or use the latest version
const dragon = await DataDragon.latest();
```

From there, you can use a [converter function](https://github.com/BinaryAlien/buildcopier/tree/main/src/converters) to convert the online builds of a certain web entity.

```javascript
/* Example using the MOBAfire converter. */

import { DataDragon } from "data-dragon";
import { mobafire, MobafireParameters } from "buildcopier";

const dragon = new DataDragon("13.15.1");

const parameters: MobafireParameters = {
  // URL of the guide to convert.
  url: "https://www.mobafire.com/league-of-legends/build/13-15-arfreezys-guide-to-graves-jungle-585199",

  // Title of the output item set.
  outputTitle: "Graves Jungle",

  // Index of the build to convert (starting from 0).
  targetBuildIndex: 0,
};

try {
  const itemSet = await mobafire(dragon, parameters);
  const clipboardImport = JSON.stringify(itemSet);
  console.log(clipboardImport);
} catch (error) {
  console.error(error);
}
```
