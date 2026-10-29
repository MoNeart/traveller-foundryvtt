import assert from "node:assert/strict";
import test from "node:test";

const formulas = [];

class TestRoll {
    constructor(formula) {
        this.formula = formula;
        this.total = 8;
        this.dice = [{total: 8}];
        formulas.push(formula);
    }

    async evaluate() {
        return this;
    }

    toMessage() {}
}

globalThis.Roll = TestRoll;
globalThis.ChatMessage = {getSpeaker: () => ({})};
globalThis.CONST = {ACTIVE_EFFECT_MODES: {ADD: 2}};
globalThis.CONFIG = {MGT2: {WEAPONS: {traits: {}}}};
globalThis.game = {
    i18n: {localize: key => key},
    settings: {
        get: (namespace, key) => namespace === "core" && key === "rollMode" ? "publicroll" : false
    }
};
globalThis.foundry = {
    applications: {
        handlebars: {renderTemplate: async () => "<p>roll</p>"},
        ux: {TextEditor: {enrichHTML: async value => value}}
    }
};

const {rollAttack, rollSkill} = await import("../mgt2e/module/helpers/dice-rolls.mjs");
const {dispatchSkillCheck} = await import("../mgt2e/module/helpers/utils/skill-roll-dispatch.mjs");

function traveller() {
    return {
        name: "Test Traveller",
        type: "traveller",
        thumbnail: "test.svg",
        system: {
            skills: {
                vaccsuit: {trained: true, value: 1},
                stealth: {id: "stealth", label: "Stealth", trained: true, value: 0, default: "DEX", specialities: {}},
                jackofalltrades: {trained: false, value: 0}
            },
            characteristics: {DEX: {dm: 1, value: 8}},
            modifiers: {
                encumbrance: {dm: -2},
                physical: {dm: 0},
                melee: {dm: 0},
                guncombat: {dm: 0}
            }
        },
        items: [{type: "armour", system: {status: "equipped", armour: {skill: "2"}}}],
        getArmourSkillPenalty: () => -1,
        getEffect: () => null,
        getRollData: () => ({})
    };
}

test("normal dialog dispatch submits to the real rollSkill consumer", async () => {
    formulas.length = 0;
    const actor = traveller();
    await dispatchSkillCheck({
        actor,
        skillFqn: "stealth",
        speciality: undefined,
        dialogCharacteristic: "DEX",
        quickCharacteristic: "DEX",
        quickRolls: false,
        shiftKey: false,
        openDialog: (dialogActor, skill, options) => rollSkill(dialogActor, skill, {
            ...options,
            rollType: "normal",
            difficulty: 8
        }),
        rollSkill
    });
    const formula = formulas.at(-1);
    assert.match(formula, /\+1\[DEX\]/);
    assert.match(formula, /-2\[Enc\]/);
    assert.match(formula, /- 1\[Armour\]/);
});

test("Shift inversion dispatches directly to the real rollSkill consumer", async () => {
    formulas.length = 0;
    const actor = traveller();
    let dialogOpened = false;
    await dispatchSkillCheck({
        actor,
        skillFqn: "stealth",
        speciality: undefined,
        dialogCharacteristic: "DEX",
        quickCharacteristic: "DEX",
        quickRolls: false,
        shiftKey: true,
        openDialog: () => { dialogOpened = true; },
        rollSkill
    });
    assert.equal(dialogOpened, false);
    assert.match(formulas.at(-1), /- 1\[Armour\]/);
});

test("rollAttack consumer applies armour independently from attack encumbrance", async () => {
    formulas.length = 0;
    const weapon = {
        name: "Test Rifle",
        img: "rifle.svg",
        system: {
            quantity: 1,
            notes: "",
            weapon: {
                range: 100,
                scale: "traveller",
                skill: "guncombat.slug",
                damage: "1D6",
                damageType: "standard",
                traits: "",
                attackBonus: 0,
                damageBonus: null
            }
        }
    };
    await rollAttack(traveller(), weapon, {skillDM: 0, dm: 0, rangeDM: 0, rollType: "normal"});
    const attackFormula = formulas.find(formula => formula.includes("[Armour]"));
    assert.match(attackFormula, /- 1\[Armour\]/);
    assert.match(attackFormula, /- 2\[Enc\]/);
});
