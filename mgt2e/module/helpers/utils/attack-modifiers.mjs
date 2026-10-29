export function parseAimingActions(value) {
    if (value === null || value === undefined) return 0;
    if (typeof value === "string" && value.trim() === "") return 0;
    if (!["number", "string"].includes(typeof value)) return null;
    const actions = Number(value);
    return Number.isInteger(actions) && actions >= 0 && actions <= 6 ? actions : null;
}

export function isCharacterAimingActor(actor) {
    return ["traveller", "npc"].includes(actor?.type);
}

export function appendAimedModifier(formula, attackOptions = {}, weapon = null, actor = null) {
    const actions = parseAimingActions(attackOptions.aimingActions);
    if (!isCharacterAimingActor(actor)) return formula;
    const range = Number(weapon?.system?.weapon?.range);
    if (!Number.isFinite(range) || range <= 0) return formula;
    if (weapon.system?.weapon?.scale === "spacecraft") return formula;
    if (attackOptions.autoOption === "full") return formula;
    return actions > 0 ? `${formula} + ${actions}[Aimed]` : formula;
}

export function resetAimingForTargetChange(aimingActions, previousTargetId, nextTargetId) {
    return previousTargetId !== nextTargetId ? 0 : aimingActions;
}
