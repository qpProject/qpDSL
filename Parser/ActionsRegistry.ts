import { CstParser, TokenType } from "chevrotain";
import { TOKENS } from "../Lexer";

type ExposedParserRules = [
    "card_spec", 
    "effect_spec",
    "pos_spec",
    "zone_spec",
    "num_spec",
    "player_spec",
    "action_stmt_list_and_sep",
    "from_word"
][number]

type RuleFunc = ($ : {
    OPTION : (rule : () => any) => any 
    CONSUME : (consumeWhat : TokenType | (() => any)) => any
    OR : (alts : {ALT : () => any}[]) => any
    MANY : (manyWhat : TokenType | (() => any)) => any
    MANY_SEP : (option : {DEF : () => any, SEP : TokenType | (() => any)}) => any
    AT_LEAST_ONE : (manyWhat : TokenType | (() => any)) => any
    AT_LEAST_ONE_SEP : (option : {DEF : () => any, SEP : TokenType | (() => any)}) => any
    SUBRULE : (rule : () => any) => any
}, exposedFunc : Record<ExposedParserRules, () => any>) => void

class ActionStorage {
    private creationMap : Record<string, RuleFunc[]> = {}
    private interceptMap : Record<string, RuleFunc[]> = {}

    register(actionID : `a_${string}`, rule_creation? : RuleFunc, rule_intercept? : RuleFunc){
        if(rule_creation) this.creationMap[actionID] ? this.creationMap[actionID].push(rule_creation) : this.creationMap[actionID] = [rule_creation];
        if(rule_intercept) this.interceptMap[actionID] ? this.creationMap[actionID].push(rule_intercept) : this.interceptMap[actionID] = [rule_intercept];
        return this
    }

    //usage

    getAltsForAllCreationRules($ : CstParser, exposedRules : Record<ExposedParserRules, () => any>){
        return Object.values(this.creationMap).flat().map(f => {
            return {ALT : () => f($ as any, exposedRules)} //we do some illegal shit here to expose protected methods
        })
    }
    getAltsForAllInntterceptRules($ : CstParser, exposedRules : Record<ExposedParserRules, () => any>){
        return Object.values(this.interceptMap).flat().map(f => {
            return {ALT : () => f($ as any, exposedRules)} //we do some illegal shit here to expose protected methods
        })
    }
}

export const ActionRegistry = new ActionStorage()
.register("a_turn_start", undefined, $ => {
    $.CONSUME(TOKENS.keyword_turn)
    $.CONSUME(TOKENS.keyword_start)
})
.register("a_turn_end", undefined, $ => {
    $.CONSUME(TOKENS.keyword_turn)
    $.CONSUME(TOKENS.keyword_end)
})
.register("a_reprogram_start", $ => {
    $.CONSUME(TOKENS.keyword_reprogram)
})
.register("a_force_end_game", ($, rules) => {
    $.OPTION(() => $.CONSUME(TOKENS.keyword_all))
    $.SUBRULE(rules.player_spec)
    $.CONSUME(TOKENS.keyword_lose)
})
.register("a_negate", $ => {
    $.CONSUME(TOKENS.keyword_negate)
    $.CONSUME(TOKENS.keyword_current_action)
})
.register("a_negate", ($, rules) => {
    $.CONSUME(TOKENS.keyword_negate)
    $.SUBRULE(rules.action_stmt_list_and_sep)
    $.CONSUME(TOKENS.keyword_instead)
})
.register("a_remove_all_effects", ($, rules) => {
    $.CONSUME(TOKENS.keyword_remove)
    $.OPTION(() => $.CONSUME(TOKENS.keyword_all))
    $.SUBRULE(rules.effect_spec)
    $.SUBRULE(rules.from_word)
    $.SUBRULE(rules.card_spec)
})
//NOT AN ACTUAL ACTIONID, this is a psuedo one that maps to either
// a_remove_all_stats or
// a_clear_all_counters 
// dependinng on the ID
.register("a_remove_all_stat_of_card", ($, rules) => {
    $.CONSUME(TOKENS.keyword_remove)
    $.CONSUME(TOKENS.keyword_all)
    $.CONSUME(TOKENS.ID) //card property keys
    $.SUBRULE(rules.from_word)
    $.SUBRULE(rules.card_spec)
})
.register("a_destroy", ($, rules) => {
    $.CONSUME(TOKENS.keyword_destroy)
    $.SUBRULE(rules.card_spec)
})
.register("a_destroy_all", ($, rules) => {
    $.CONSUME(TOKENS.keyword_destroy)
    $.CONSUME(TOKENS.keyword_all)
    $.SUBRULE(rules.card_spec)
})