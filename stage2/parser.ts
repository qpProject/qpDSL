import { CstParser, IToken, TokenType } from "chevrotain";
import { ALL_TOKENS, TOKENS } from "./lexer";
import { AstGenParser } from "../core/Utils/AstGenParser";
import { ASTNode } from "../core/types";
import * as AST from "../core/types/"
import { Context } from "../core/Utils/Context";

class Parser extends AstGenParser {
    constructor(){
        super(ALL_TOKENS, { nodeLocationTracking: 'onlyOffset' })
        this.performSelfAnalysis()
    }

    override get isBounded(): boolean {
        return true
    }

    private Sentence(keyword : TokenType | undefined, constructor : new (raw : string, segments : AST.SentenceSegment[]) => AST.Sentence){
        this.beginRecordTokens()

        if(keyword){
            this.CONSUME(keyword)
        }

        const segment = this.SUBRULE(this.whatever)

        const info = this.endRecordTokens()
        return this.ACTION(() => new constructor(info.raw, [segment]))
    }

    sentences = this.RULE("sentences", () => {
        const sentences : AST.Sentence[] = []

        this.AT_LEAST_ONE({
            DEF : () => this.OR([
                {ALT: () => this.SUBRULE_THEN_PUSH(sentences, this.if_sentence)},
                {ALT: () => this.SUBRULE_THEN_PUSH(sentences, this.else_sentence)},
                {ALT: () => this.SUBRULE_THEN_PUSH(sentences, this.unless_sentence)},
                {ALT: () => this.SUBRULE_THEN_PUSH(sentences, this.target_sentence)},
                {ALT: () => this.SUBRULE_THEN_PUSH(sentences, this.where_sentence)},
                {ALT: () => this.SUBRULE_THEN_PUSH(sentences, this.action_sentence)},
            ])
        })

        return sentences
    })

    if_sentence = this.RULE("if_sentence", () => {
        return this.Sentence(TOKENS.keyword_if, AST.IfSentence)
    })

    else_sentence = this.RULE("else_sentence", () => {
        return this.Sentence(TOKENS.keyword_else, AST.ElseSentence)
    })

    unless_sentence = this.RULE("unless_sentence", () => {
        return this.Sentence(TOKENS.keyword_unless, AST.UnlessSentence)
    })

    target_sentence = this.RULE("target_sentence", () => {
        return this.Sentence(TOKENS.keyword_target, AST.TargetSentence)
    })

    action_sentence = this.RULE("action_sentence", () => {
        //catch all if every other sentence fails, so no keyword
        return this.Sentence(undefined, AST.ActionSentence)
    })

    where_sentence = this.RULE("where_sentence", () => {
        this.beginRecordTokens()

        this.CONSUME(TOKENS.keyword_where)
        const name = this.CONSUME(TOKENS.ID)
        this.CONSUME(TOKENS.keyword_is)
        const valueSegment = this.SUBRULE(this.whatever)
        const valueRaw = valueSegment.raw

        const info = this.endRecordTokens()

        return this.ACTION(() => {
            return new AST.RuntimeVariableDeclareSentence(
                info.raw, 
                name.image, 
                new AST.RuntimeVariable(valueRaw, name.image, new AST.ExpectedTarget(
                    valueRaw, AST.TargetType.Number
                ))
            )
        })
    })

    connector_and = this.RULE("connector_and", () => {
        this.CONSUME(TOKENS.op_and)
        return AST.BinOpType.And
    })

    connector_or = this.RULE("connector_or", () => {
        this.CONSUME(TOKENS.op_or)
        return AST.BinOpType.Or
    })

    and_segment = this.RULE("and_segment", () => {
        this.beginRecordTokens()
        let left = this.SUBRULE(this.pure_segment)
        
        this.MANY(() => {
            this.beginRecordTokens()
            this.CONSUME(TOKENS.op_and)
            const right = this.SUBRULE2(this.pure_segment)
            const info = this.endRecordTokens()
            this.ACTION(() => {
                left = new AST.BinOp(info.raw, left, right, AST.BinOpType.And)
            })
        })
        
        const info = this.endRecordTokens()
        return this.ACTION(() => left)
    })

    or_segment = this.RULE("or_segment", () => {
        this.beginRecordTokens()
        let left = this.SUBRULE(this.and_segment)
        
        this.MANY(() => {
            this.beginRecordTokens()
            this.CONSUME(TOKENS.op_or)
            const right = this.SUBRULE2(this.and_segment)
            const info = this.endRecordTokens()
            this.ACTION(() => {
                left = new AST.BinOp(info.raw, left, right, AST.BinOpType.Or)
            })
        })
        
        const info = this.endRecordTokens()
        return this.ACTION(() => left)
    })

    pure_segment = this.RULE("pure_segment", () => {
        this.beginRecordTokens()
        this.AT_LEAST_ONE(() => {
            this.OR([
                {ALT : () => this.CONSUME(TOKENS.ID)},
                {ALT : () => this.CONSUME(TOKENS.keyword_is)}
            ])
        })
        const info = this.endRecordTokens()
        return this.ACTION(() => new AST.SentenceSegment(info.raw))
    })

    whatever = this.RULE("whatever", () => {
        return this.SUBRULE(this.or_segment)
    })
}

export const parser = new Parser()
export const visitor = parser.getBaseCstVisitorConstructor()