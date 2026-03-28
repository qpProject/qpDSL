import { Lexer, } from "chevrotain";
import { TokenStorage } from "../core"
import { ID_WITH_DOT_REG } from "../core"

const is_synonyms = [
    "is",
    "are",
    "was",
    "be",
]

const tokens = new TokenStorage()
.SKIPPED("whitespace", /\s+/)
.SYMBOLS("SIGN", /[+-]+/)
.ID("", ID_WITH_DOT_REG)
.OP("is", 
    ...is_synonyms,
    ...is_synonyms.map(s => "not " + s),
    ...is_synonyms.map(s => s + " not"),
)
.KEYWORD("instead")
.KEYWORD("card", "cards")
.KEYWORD("effect", "effects")
.KEYWORD("zone", "zones")
.KEYWORD("pos", "position", "positions")
.KEYWORD("player", "players", "enemy", "enemies")
.KEYWORD("action")
.KEYWORD("exist", "exists", "existed")
.KEYWORD("has", "have", "had", "own", "owns", "owned")
.KEYWORD("turn", "turns")
.KEYWORD("start")
.KEYWORD("end")
.KEYWORD("reprogram", "reprograms", "reprogramed")
.KEYWORD("lose", "lost", "loses")
.KEYWORD("negate", "negates", "negated")
.KEYWORD("remove", "removes", "removed")
.KEYWORD("destroy", "destroys", "destroyed")
.KEYWORD("void", "voids", "voided")
.KEYWORD("execute", "executes", "executed")
.KEYWORD("decompile", "decompiles", "decompiled")
.KEYWORD("delay", "delays", "delayes", "delayed")
.KEYWORD("disable", "disables", "disabled")
.KEYWORD("reset", "resets", "reseted")
.KEYWORD("deal", "deals", "dealt")
.KEYWORD("take", "takes", "taken")
.KEYWORD("ahead")
.KEYWORD("damage", "damages", "damaged")
.KEYWORD("activate", "activates", "activated")
.KEYWORD("move", "moves", "moved", "send", "sent", "sends", "play", "plays", "playes", "played")
.KEYWORD("draw", "draws", "drawn")
.KEYWORD("shuffle", "shuffles", "shuffled")
.KEYWORD("add", "adds", "added")
.KEYWORD("receive", "receives", "received", "gain", "gains", "gained")
.KEYWORD("override", "overrides", "overriden")
.KEYWORD("change", "changes", "changed")
.KEYWORD("heal", "heals", "healed", "healing")
.KEYWORD("duplicate", "duplicates", "duplicated")
.KEYWORD("current")
.KEYWORD("from")
.KEYWORD("by")
.KEYWORD("to")
.KEYWORD("heart")
.KEYWORD("of")
.KEYWORD("with")
.KEYWORD("count")
.KEYWORD("number")
.KEYWORD("on")
.KEYWORD("any")
.KEYWORD("stat")
.KEYWORD("new")


export const ALL_TOKENS = tokens.all
export const TOKENS = tokens.createStorageObj()
export const lexer = new Lexer(ALL_TOKENS)