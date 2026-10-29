export function appendAimedModifier(formula, attackOptions = {}) {
    return attackOptions.autoOption === "aimed" ? `${formula} + 1[Aimed]` : formula;
}
