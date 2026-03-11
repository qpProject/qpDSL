import { createToken, Lexer, TokenType } from "chevrotain"
const FILLER_WORDS = ["the", "would"]

/** Makes a regex which is an "or" of all the words (incluiding the word boundaries), with i flag */
function matchWholeWords(...s : string[]){
    s = s.flatMap(s => s.split(" ").join("\\s+")).map(s => `\\b${s}\\b`)
    s = s.sort((a, b) => b.length - a.length) //sort descending
    return new RegExp(s.join("|"), "i")
}

class TokenStorage<T extends string = "ID"> {
    ID : TokenType
    storage : {[K in T] : TokenType} = {} as any
    get all() : TokenType[] {return [...Object.values(this.storage) as TokenType[], this.ID]}

    constructor(ID : RegExp){
        this.ID = createToken({
            name : "ID",
            pattern : ID,
            group : "ID"
        })
    }

    // withput automatic regex creation
    SKIPPED<K extends string>(name : K, reg : RegExp){
        return this.register<K, "">(name, reg, Lexer.SKIPPED as "")
    }
    LITERAL<K extends string>(name : K, reg : RegExp){
        return this.register("LITERAL", reg, name)
    }
    SYMBOLS<K extends string>(name : K, reg : RegExp){
        return this.register(name, reg, "SYMBOL")
    }

    // with automatic regex creation
    // 1st string is treated as the name
    // if the name DOES NOT include an underscore and s has non 0 length, it is included in the regex
    // if s has 0 length, the name is replaced underscore -> space, then added to the regex
    private preprocessStrToReg(name : string, s : string[]){
        if(name.includes("_") && s.length === 0) return matchWholeWords(name);
        else if(name.includes(" ")) name = name.replaceAll(" ", "_");
        return name.includes("_") ? matchWholeWords(...s) : matchWholeWords(name, ...s)
    }
    KEYWORD<K extends string>(name : K, ...s : string[]){
        const reg = this.preprocessStrToReg(name, s)
        return this.register(name, reg, "keyword")
    }
    PREPOSITION<K extends string>(name : K, ...s : string[]){
        const reg = this.preprocessStrToReg(name, s)
        return this.register(name, reg, "prep")
    }
    OP<K extends string>(name : K, ...s : string[]){
        const reg = this.preprocessStrToReg(name, s)
        return this.register(name, reg, "op")
    }

    private register<
        T_Name extends string, T_group extends string,
        NewKey extends string = T_group extends "" ? T_Name : `${T_group}_${T_Name}`
    >(name : T_Name, pattern : RegExp, group : T_group) : TokenStorage<T | NewKey> {
        const token = createToken({
            name, pattern, group
        });
        const key = (!group.length || group === Lexer.SKIPPED) ? name : `${group}_${name}`;
        (this.storage as any)[key] = token
        return this as any
    }
}

// If this list has typos, its intentional;
const Token = new TokenStorage(/[a-zA-Z]+/)
.SKIPPED("slash_comment", /[/]{2}.*([\n\r]|$)/)
.SKIPPED("block_comment", /[/][*].*[*][/]/)
.SKIPPED("filler",matchWholeWords(...FILLER_WORDS))
//effect positions, has to be above intlit
.KEYWORD("first", "1st")
.KEYWORD("second", "2nd")
.KEYWORD("third", "3rd")
//literal (placed first to match first, slight speedup)
.LITERAL("INT", /[0-9]+/)
//symbols (placed first to match first, slight speedup)
.SYMBOLS("EFFECT_PREFIX", /e_/)
.SYMBOLS("ARROW", /[=\-]+>/)
.SYMBOLS("EQ", /=/)
.SYMBOLS("COLON", /:/)
.SYMBOLS("DOT", /[.]/)
.SYMBOLS("COMMA", /,/)
.SYMBOLS("LB", /\(/)
.SYMBOLS("RB", /\)/)
.SYMBOLS("LCB", /{/)
.SYMBOLS("RCB", /}/)
.SYMBOLS("LSB", /\[/)
.SYMBOLS("RSB", /\]/)
.SYMBOLS("QUESTION_MARK", /\?/)
.SYMBOLS("UNDER_SCORE", /_/)
.SKIPPED("unrecognized_symbols", /[^a-zA-Z\s]/)
// keywords
.KEYWORD("back_reference", "it", "that", "them", "they", "those", "whose", "targeted")
.KEYWORD("target", "targets")
.KEYWORD("if", "iff", "whenever", "when")
.KEYWORD("else")
.KEYWORD("unless")
.KEYWORD("before")
.KEYWORD("after")
.KEYWORD("then")
.KEYWORD("was")
.KEYWORD("done")
.KEYWORD("any")
//named entities
.KEYWORD("action", "current action")
.KEYWORD("this_card")
.KEYWORD("this_effect")
.KEYWORD("this_player")
//directions
.KEYWORD("direction", "directions", "dir", "dirs")
//action keywords
.KEYWORD("distance")
.KEYWORD("turn")
.KEYWORD("start", "starts", "started")
.KEYWORD("end", "ends", "ended")
.KEYWORD("reprogram")
.KEYWORD("lose", "loses", "lost")
.KEYWORD("negate", "negates", "negated")
.KEYWORD("remove", "removes", "removed", "clear", "clears", "cleared")
.KEYWORD("status")
.KEYWORD("destroy", "destroyes", "destroys", "destroyed")
.KEYWORD("void", "voids", "voided")
.KEYWORD("execute", "executes", "executed")
.KEYWORD("decompile", "decompiles", "decompiled") 
.KEYWORD("delay", "delays", "delayed")
.KEYWORD("disable", "disables", "disabled")
.KEYWORD("reset", "resets", "resetted", "reseted")
.KEYWORD("deal", "deals", "dealt")
.KEYWORD("take", "takes", "took")
.KEYWORD("survive", "survives", "survived")
.KEYWORD("damage", "damages", "damaged")
.KEYWORD("ahead")
.KEYWORD("activate", "activates", "activated")
.KEYWORD("move", "moves", "moved", "send", "sends", "sent", "play", "plays", "played")
.KEYWORD("draw", "draws", "drew", "drawn")
.KEYWORD("shuffle", "shuffles", "shuffled")
.KEYWORD("add", "adds", "added")
.KEYWORD("receive", "receives", "received")
.KEYWORD("stat")
.KEYWORD("override", "overrides", "overriden", "overiden")
.KEYWORD("change", "changes", "changed")
.KEYWORD("heal", "heals", "healed")
.KEYWORD("subtype")
.KEYWORD("duplicate", "duplicates", "duplicated") 
.KEYWORD("all")
// game elements
.KEYWORD("card", "cards")
.KEYWORD("effect", "effects", "effs", "eff")
.KEYWORD("position", "positions", "pos")
.KEYWORD("zone", "zones")
//operators
.OP("increase", "increases", "increasing")
.OP("decrease", "decreases", "decreasing")
.OP("exist", "exists")
.OP("not_equal_to", "not", "not is", "is not", "different", "different to")
.OP("equal_to", "is", "be", "same", "same as")
.OP("and")
.OP("or")
.OP("less_than_or_equal", "no more", "no more than")
.OP("greater_than_or_equal", "at least", "at least more than")
.OP("greater_than", "more", "more than")
.OP("less_than", "less", "fewer", "less than", "fewer than")
.OP("has")
.OP("count", "number of", "count of")
//prepositions
.PREPOSITION("by")
.PREPOSITION("on")
.PREPOSITION("as")
.PREPOSITION("for")
.PREPOSITION("of")
.PREPOSITION("to")
.PREPOSITION("away")
.PREPOSITION("within")
.PREPOSITION("with")
.PREPOSITION("in")
.PREPOSITION("from")
.PREPOSITION("where")
.PREPOSITION("instead")

export const TOKENS = Token.storage
export const ALL_TOKENS = Token.all
export const qpRemakeLexer = new Lexer(ALL_TOKENS)
