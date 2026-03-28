import { Lexer } from "chevrotain";
import { TokenStorage } from "../core/";
import { ID_WITH_DOT_REG } from "../core/";

const tokens = new TokenStorage()
.SKIPPED("WHITESPACE", /\s+/)
.KEYWORD("if", "iff", "when", "whenever", "before", "after")
.KEYWORD("else", "otherwise")
.KEYWORD("unless")
.KEYWORD("target", "targets")
.KEYWORD("where")
.KEYWORD("is")
.OP("and")
.OP("or")
.ID("", ID_WITH_DOT_REG)

export const TOKENS = tokens.createStorageObj()
export const ALL_TOKENS = tokens.all
export const lexer = new Lexer(ALL_TOKENS)