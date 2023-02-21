import { DataDragon } from "data-dragon";
import { mobafire } from "../src";

import expected from "./giga-chad-graves-607192.json";

const dragon = new DataDragon("13.15.1");

beforeAll(async () => {
  await dragon.champions.fetch();
  await dragon.items.fetch();
});

test("giga-chad-graves-607192", async () => {
  const url =
    "https://www.mobafire.com/league-of-legends/build/giga-chad-graves-607192";
  const actual = await mobafire(dragon, { url });
  expect(JSON.stringify(actual)).toBe(JSON.stringify(expected));
});
