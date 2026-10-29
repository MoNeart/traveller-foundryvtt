import assert from "node:assert/strict";
import test from "node:test";

globalThis.Application = class {
    static get defaultOptions() { return {}; }
    constructor() { this.options = {}; }
};
globalThis.Roll = class {};
globalThis.ChatMessage = {getSpeaker: () => ({})};
globalThis.CONST = {ACTIVE_EFFECT_MODES: {ADD: 2}};
globalThis.CONFIG = {MGT2: {WEAPONS: {traits: {}}}};
globalThis.foundry = {applications: {handlebars: {renderTemplate: async () => ""}, ux: {TextEditor: {enrichHTML: async value => value}}}};
globalThis.game = {
    i18n: {localize: key => key, format: key => key},
    users: {current: {targets: []}},
    settings: {get: () => false}
};
globalThis.canvas = {tokens: {controlled: []}, grid: {size: 100, distance: 1}};
globalThis.window = globalThis;

const {MgT2AttackDialog} = await import("../mgt2e/module/helpers/attack-dialog.mjs");

function actor() {
    return {
        system: {
            skills: {
                guncombat: {
                    id: "guncombat",
                    label: "Gun Combat",
                    trained: true,
                    value: 0,
                    specialities: {slug: {id: "slug", label: "Slug", trained: true, value: 0}}
                },
                jackofalltrades: {trained: false, value: 0}
            },
            characteristics: {DEX: {dm: 0}},
            modifiers: {guncombat: {dm: 0}}
        }
    };
}

function weapon(range, scale = "traveller") {
    return {
        name: "Antique Rifle",
        system: {
            quantity: 1,
            weapon: {
                characteristic: "DEX",
                skill: "guncombat.slug",
                traits: "",
                damage: "3D6-3",
                range,
                scale,
                magazine: 1,
                ammo: 1
            }
        },
        useAmmo: () => false,
        hasTrait: () => false
    };
}

test("legacy personal attack dialog renders fractional Short range", () => {
    const dialog = new MgT2AttackDialog(actor(), weapon(25));
    const context = dialog.getData();
    assert.equal(context.shortRange, 6.25);
    assert.equal(context.range, 25);
    assert.equal(context.longRange, 50);
    assert.equal(context.extremeRange, 100);
    assert.equal(dialog.RANGES["+1"], "MGT2.Attack.short (6.25m, +1)");
    assert.deepEqual(dialog.AIMING_ACTIONS, {0: "0", 1: "1", 2: "2", 3: "3", 4: "4", 5: "5", 6: "6"});
    assert.equal(context.aimingActions, 0);
});

test("legacy melee dialog exposes no aiming actions", () => {
    const dialog = new MgT2AttackDialog(actor(), weapon(0));
    assert.equal(dialog.getData().AIMING_ACTIONS, undefined);
});

test("legacy dialog reopen or weapon change starts aiming at zero", () => {
    const first = new MgT2AttackDialog(actor(), weapon(25));
    first.aimingActions = 6;
    const reopened = new MgT2AttackDialog(actor(), weapon(25));
    const changedWeapon = new MgT2AttackDialog(actor(), weapon(100));
    assert.equal(reopened.getData().aimingActions, 0);
    assert.equal(changedWeapon.getData().aimingActions, 0);
});

test("legacy vehicle attack dialog preserves fractional kilometre bands", () => {
    const dialog = new MgT2AttackDialog(actor(), weapon(2.5, "vehicle"));
    assert.equal(dialog.RANGES["+1"], "MGT2.Attack.short (0.625km, +1)");
});
