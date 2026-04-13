import type { ILexingError, IRecognitionException } from "chevrotain";
import { ASTError } from "./base";
import { Context } from "../Utils/Context";
import { KeywordCategory } from "../../stage3/keyword_categories";

//parse Error HAVE to happen
// its not a parse error if its semantic based

export class UnknownLexerError extends ASTError {
    constructor(err : ILexingError){
        super()
        const subStr = Context.raw.slice(err.offset, err.length)
        this.message = `Lexing error encountered at ${subStr}(${err.offset},l${err.line},c${err.column}): "${err.message}"`
        this.name = "Unknown Lexer Error"
    }
}

export class UnknownParserError extends ASTError {
    constructor(err : IRecognitionException){
        super()
        this.message = `Parsing error encountered: ${err.name}: "${err.message}"`
        this.name = "Unknown Parser Error"
    }
}

// phase 1
export class CannotTokenizeSentence extends ASTError {
    constructor(){
        super()
        this.message = `Cannot tokenize sentence`
        this.name = `CannotTokenizeSentence`
    }
}

export class CannotParseSentence extends ASTError {
    constructor(){
        super()
        this.message = `Cannot parse sentence`
        this.name = `CannotParseSentence`
    }
}

// phase 2 cannot errors

// phase 3
export class CannotTokenizeAction extends ASTError {
    constructor(){
        super()
        this.message = `Cannot tokenize action`
        this.name = `CannotTokenizeAction`
    }
}

export class CannotTokenizeCondition extends ASTError {
    constructor(){
        super()
        this.message = `Cannot tokenize action`
        this.name = `CannotTokenizeCondition`
    }
}

export class EffectNameNotFoundError extends ASTError {
    constructor(name : string){
        super()
        this.message = `Effect name "${name}" not found`
        this.name = "Effect Name Not Found Error"
    }
}

export class KeywordClassificationError extends ASTError {
    constructor(keyword : string, expected : KeywordCategory, got? : KeywordCategory){
        super()
        this.message = `Cannot classify keyword "${keyword}" as ${expected}${got ? `, got ${got || "<Unknown?>"}` : ""}`
        this.name = "Keyword Classification Error"
    }
}

// phase 4
export class CannotTokenizeTarget extends ASTError {
    constructor(e : ILexingError){
        super()
        this.message = `Cannot classify target: ${e.message}`
        this.name = `CannotTokenizeTarget`
    }
}

export class CannotParseTarget extends ASTError {
    constructor(){
        super()
        this.message = `Cannot parse target`
        this.name = `CannotParseTarget`
    }
}

