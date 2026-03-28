import { Lexer, } from "chevrotain";
import { CONFIG, TokenStorage } from "../core"
import { ireg } from "../core";

const tokens = new TokenStorage()
.SKIPPED("whitespace", /\s+/)
.ID("EXTENSION", /\.[a-zA-Z0-9_]+/)
.ID("", /[a-z_]+/)
.ID("BIG", /[A-Z]+/)
.LITERAL("INT", /\d+/)
.LITERAL("ZERO", ireg("zero", "no", "none", "nothing"))
.LITERAL("ONE", ireg("one", "a", "an"))
.LITERAL("TWO", /\btwo\b/)
.LITERAL("THREE", /\bthree\b/)
.LITERAL("FOUR", /\bfour\b/)
.LITERAL("FIVE", /\bfive\b/)
.LITERAL("SIX", /\bsix\b/)
.LITERAL("SEVEN", /\bseven\b/)
.LITERAL("EIGHT", /\beight\b/)
.LITERAL("NINE", /\bnine\b/)

.LITERAL("ANY_EXTENSION", /\.\*/)
.LITERAL("OWNERSHIP_MARKER", /'s?\b/)
.LITERAL("ORDER_MARKER", /(st|nd|rd|th)\b/)
.LITERAL("FIRST", /\bfirst\b/)
.LITERAL("SECOND", /\bsecond\b/)
.LITERAL("THIRD", /\bthird\b/)

.SYMBOLS("SIGN", /[\+\-]/)
.SYMBOLS("LCB", /{/)
.SYMBOLS("RCB", /}/)
.SYMBOLS("LSB", /\[/)
.SYMBOLS("RSB", /\]/)

.SYMBOLS("CM", /,/)

.OP("less_than_or_equal", "<=", "no more", "no more than", "maximum")
.OP("greater_than_or_equal", ">=", "at least", "at least more than", "minimum")
.OP("greater_than", ">", "more", "more than")
.OP("less_than", "<", "less", "fewer", "less than", "fewer than")
.OP("not_equal_to", "!=", "!==", "not", "not exactly", "not exactly as", "not equal to", "different", "different to")
.OP("equal_to", "==", "===", "exactly", "exactly as")
.OP("count_of", "count of", "number of", "amount of", "total of")

.KEYWORD("card", "cards")
.KEYWORD("effect", "effects")
.KEYWORD("pos", "position", "positions")
.KEYWORD("this", "current")

.KEYWORD("back_refrence", "it", "that", "targeted", "those", "they", "them")

//flags
.KEYWORD("zone_name", ...CONFIG.ZONE_NAMES)
.KEYWORD("card_stat", ...CONFIG.CARD_STATS)
.KEYWORD("card_rarity", ...CONFIG.CARD_RARITIES)
.KEYWORD("effect_type", ...CONFIG.EFFECT_TYPES)
.KEYWORD("effect_subtype", ...CONFIG.EFFECT_SUBTYPES)
.KEYWORD("random")
.KEYWORD("all")
.KEYWORD("row")
.KEYWORD("col", "column")
.KEYWORD("heart")
.KEYWORD("player_name", "player", "players", "enemy", "enemies")
.KEYWORD("direction", "directions")
.KEYWORD("distance", "distances")
.KEYWORD("direction_name", "up", "down", "left", "right")

.PREPOSITION("from", "on", "by", "in", "of")
.PREPOSITION("within")
.PREPOSITION("with")
.PREPOSITION("in")


//insert generaion here

export const ALL_TOKENS = tokens.all
export const TOKENS = tokens.createStorageObj()
export const lexer = new Lexer(ALL_TOKENS)