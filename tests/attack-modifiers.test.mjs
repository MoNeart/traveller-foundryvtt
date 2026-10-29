import assert from "node:assert/strict";
import test from "node:test";
import {appendAimedModifier} from "../mgt2e/module/helpers/utils/attack-modifiers.mjs";

test("Aimed Shot adds its advertised +1 exactly once", () => {
    assert.equal(appendAimedModifier("2D6 - 2[Range]", {autoOption: "aimed"}), "2D6 - 2[Range] + 1[Aimed]");
});

test("custom DM remains independent from Aimed Shot", () => {
    assert.equal(appendAimedModifier("2D6 + 1[DM]", {autoOption: "aimed"}), "2D6 + 1[DM] + 1[Aimed]");
});

test("other firing modes receive no Aimed modifier", () => {
    assert.equal(appendAimedModifier("2D6", {autoOption: "single"}), "2D6");
});
