import { DataDragon } from "data-dragon";
import { mobafire } from "../src";

import expected from "./13-15-arfreezys-guide-to-graves-jungle-585199.json";

const dragon = new DataDragon("13.15.1");

beforeAll(async () => {
  await dragon.champions.fetch();
  await dragon.items.fetch();
});

test("13-15-arfreezys-guide-to-graves-jungle-585199", async () => {
  const url =
    "https://www.mobafire.com/league-of-legends/build/13-15-arfreezys-guide-to-graves-jungle-585199";
  const actual = await mobafire(dragon, { url });
  expect(JSON.stringify(actual)).toBe(JSON.stringify(expected));
});
