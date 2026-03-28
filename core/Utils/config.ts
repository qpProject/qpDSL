export const CONFIG = {
    EFFECT_TYPES : ["init", "passive", "trigger", "death", "lock"],
    EFFECT_SUBTYPES : ["unique", "once", "chained", "delayed", "hard unique", "bonded"],
    
    ZONE_NAMES : ["hand", "deck", "field", "grave", "void", "storage"],
    CARD_STATS : ["atk", "hp", "level"],
    CARD_RARITIES : ["red", "green", "blue", "artifact", "potion", "ability"],
    
    FILLER_WORDS : ["the", "this", "that", "these", "those", "my", "your", "his", "her", "its", "our", "their"],
    VALID_SENTENCE_SEPARATORS : [".", ",", ";", "then"],

    // , for directional specifier in position target ex: [up, down]
    // !<>= for amount spec
    // ()[]{} for whatever I decide to use them for in the future, only [] is used for position targets
    // ' for 's, owner ship marker in number target ex this card's <PROP>
    ALLOWED_SYMBOLS_IN_SENTENCES : ",!<>=()[]{}'*".split(""),
}