import assert from "node:assert/strict";
import test from "node:test";

class ApplicationV2 {
    constructor() {}
    _onRender() {}
}

globalThis.foundry = {
    applications: {
        api: {ApplicationV2, HandlebarsApplicationMixin: Base => class extends Base {}},
        handlebars: {renderTemplate: async () => ""},
        ux: {TextEditor: {enrichHTML: async value => value}}
    }
};
globalThis.Application = class {};
globalThis.Actor = class {};
globalThis.Item = class {};
globalThis.Roll = class {};
globalThis.ChatMessage = {getSpeaker: () => ({})};
globalThis.CONST = {ACTIVE_EFFECT_MODES: {ADD: 2}};
globalThis.CONFIG = {MGT2: {WEAPONS: {traits: {}}, SPACE_MOUNTS: {}}};
globalThis.game = {i18n: {localize: key => key, format: key => key}, settings: {get: () => false}};
globalThis.canvas = {tokens: {controlled: []}};
globalThis.window = globalThis;
const warnings = [];
globalThis.ui = {notifications: {warn: message => warnings.push(message)}};

const {MgT2eAttackApp} = await import("../mgt2e/module/helpers/dialogs/MgT2eAttackApp.mjs");

function dialog({melee = false, actor = {type: "traveller"}} = {}) {
    const instance = Object.create(MgT2eAttackApp.prototype);
    instance.actor = actor;
    instance.isMelee = melee;
    instance.currentTarget = {rangeDM: 0};
    instance.attackOptions = {};
    instance.rolls = [];
    instance.rollAttack = (customDM, rangeDM) => instance.rolls.push({customDM, rangeDM, options: {...instance.attackOptions}});
    return instance;
}

async function submit(instance, {aimingActions = "0", shotType = "single", DM = "0", range = "0"} = {}) {
    return MgT2eAttackApp.formHandler.call(instance, {type: "submit"}, {}, {
        object: {aimingActions, shotType, DM, range, rollType: "standard"}
    });
}

test("actual vehicle dialog submission sends aiming actions 0, 1 and 6 once", async () => {
    for (const actions of [0, 1, 6]) {
        const instance = dialog();
        await submit(instance, {aimingActions: `${actions}`});
        assert.equal(instance.rolls.length, 1);
        assert.equal(instance.rolls[0].options.aimingActions, actions);
        assert.equal(instance.rolls[0].options.autoOption, "single");
    }
});

test("actual dialog rejects fractional, negative and greater-than-six aiming values", async () => {
    for (const value of ["1.5", "-1", "7", "not-a-number"]) {
        const instance = dialog();
        await submit(instance, {aimingActions: value});
        assert.equal(instance.rolls.length, 0);
    }
});

test("melee and missing character force aiming zero", async () => {
    const melee = dialog({melee: true});
    await submit(melee, {aimingActions: "6"});
    assert.equal(melee.rolls[0].options.aimingActions, 0);

    const crewless = dialog({actor: null});
    await submit(crewless, {aimingActions: "6"});
    assert.equal(crewless.rolls[0].options.aimingActions, 0);
});

test("burst remains independent and Full Auto plus aiming is refused", async () => {
    const burst = dialog();
    await submit(burst, {aimingActions: "3", shotType: "burst"});
    assert.equal(burst.rolls[0].options.autoOption, "burst");
    assert.equal(burst.rolls[0].options.aimingActions, 3);

    const full = dialog();
    await submit(full, {aimingActions: "3", shotType: "full"});
    assert.equal(full.rolls.length, 0);
    assert.match(warnings.at(-1), /Full Auto/);
});

test("new and reopened dialog state defaults to zero without persistence", () => {
    const first = Object.create(MgT2eAttackApp.prototype);
    first.aimingActions = 0;
    first.aimingActions = 5;
    const reopened = Object.create(MgT2eAttackApp.prototype);
    reopened.aimingActions = 0;
    assert.equal(reopened.aimingActions, 0);
});
