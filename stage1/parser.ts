import { CstNode, CstParser, IToken } from "chevrotain";
import { ALL_TOKENS, TOKENS } from "./lexer";
import { getNodeTextDesperate, getTokenStream } from "../core";
import { AstGenParser } from "../core/Utils/AstGenParser";
import * as AST from "../core/types/"
import { ASTNode } from "../core/types";
import { Context } from "../core/Utils/Context";
import { CONFIG } from "../core/Utils/config";

class Parser extends AstGenParser {
    constructor(){
        super(ALL_TOKENS, { nodeLocationTracking: 'onlyOffset' })
        this.performSelfAnalysis()
    }

    program = this.RULE("program", () => {
        this.ACTION(() => {
            const tokenStream = getTokenStream(this as any)
            console.log("Token stream", tokenStream)
        })

        const E : AST.EffectDeclare[] = []
        this.MANY(() => {
            const e = this.SUBRULE(this.effect_decl)
            this.ACTION(() => E.push(e))
            this.OPTION(() => {
                this.CONSUME(TOKENS.SENTENCE_SEPARATOR)
            })
        })

        return this.ACTION(() => new AST.Program(Context.raw, E))
    })

    effect_decl = this.RULE("effect_decl", () => {
        this.beginRecordTokens()

        const EffNamePrefix = this.CONSUME(TOKENS.EFFECT_PREFIX)
        const EffNameContent = this.CONSUME(TOKENS.ID_NO_DOT)
        const EffName = EffNamePrefix.image + EffNameContent.image
        this.CONSUME(TOKENS.SYMBOL_DOT)
        const MetaData = this.SUBRULE(this.effect_meta_data)
        this.CONSUME(TOKENS.SYMBOL_COLON)
        // PLS DO NOT
        // change this to AT_LEAST_ONE
        // the gate is rlly important

        const S : string[] = []
        const sentence = this.SUBRULE(this.sentences)
        this.ACTION(() => S.push(sentence))
        
        this.MANY({
            DEF : () => {
                this.CONSUME2(TOKENS.SENTENCE_SEPARATOR)
                const sentence = this.SUBRULE2(this.sentences)
                this.ACTION(() => S.push(sentence))
            },
            GATE : () => {
                // for the next sentence to be consume
                // token stream exist at least sentence_sep,ID_WITH_DOT
                return (
                    this.LA(1).tokenType.tokenTypeIdx === TOKENS.SENTENCE_SEPARATOR.tokenTypeIdx && 
                    this.LA(2).tokenType.tokenTypeIdx === TOKENS.ID_WITH_DOT.tokenTypeIdx
                )
            }
        })
        const info = this.endRecordTokens()

        
        return this.ACTION(() => {
            console.log("Metadata", { EffName, MetaData })
            return AST.EffectDeclare.fromMetaData(
                info.raw, EffName, [...MetaData.variables, ...MetaData.types], S, {
                    validTypes : CONFIG.EFFECT_TYPES,
                    validSubtypes : CONFIG.EFFECT_SUBTYPES,
                }
            )
        })
    })

    variable_decl = this.RULE("variable_decl", () => {
        this.beginRecordTokens()

        const NameToken = this.CONSUME(TOKENS.ID_NO_DOT)
        this.CONSUME(TOKENS.SYMBOL_EQ)

        const Values : number[] = []
        let ValueToken = this.CONSUME1(TOKENS.ID_NO_DOT)
        this.ACTION(() => Values.push(Number.parseInt(ValueToken.image)))
        
        
        this.MANY(() => {
            this.CONSUME(TOKENS.SYMBOL_ARROW)
            ValueToken = this.CONSUME2(TOKENS.ID_NO_DOT)
            this.ACTION(() => Values.push(Number.parseInt(ValueToken.image)))
        })

        const info = this.endRecordTokens()

        return this.ACTION(() => new AST.InternalVariable(info.raw, NameToken.image, Values))
    })

    effect_meta_data = this.RULE("effect_meta_data", () => {
        const Vars : AST.InternalVariable[] = []
        const Types : string[] = []

        this.AT_LEAST_ONE_SEP({
            DEF : () => {
                this.OR([
                    {
                        GATE : () => {
                            return this.LA(2).tokenType.tokenTypeIdx === TOKENS.SYMBOL_EQ.tokenTypeIdx;
                        },
                        ALT: () => {
                            const V = this.SUBRULE(this.variable_decl)
                            this.ACTION(() => Vars.push(V))
                        }
                    },
                    {ALT: () => {
                        const T = this.SUBRULE(this.type_subtype_decl)
                        this.ACTION(() => Types.push(T))
                    }},
                ])
            },
            SEP : TOKENS.SYMBOL_DOT
        })

        return this.ACTION(() => {
            console.log("Meta data", { Vars, Types })
            return {
                variables : Vars,
                types : Types,
            }
        })
    })

    type_subtype_decl = this.RULE("type_subtype_decl", () => {
        const IDs : string[] = []
        this.AT_LEAST_ONE(() => {
            const tok = this.CONSUME(TOKENS.ID_NO_DOT)
            this.ACTION(() => IDs.push(tok.image))
        })
        return this.ACTION(() => IDs.join(" "))
    })

    ID = this.RULE("ID", () => {
        let Tok : IToken | undefined
        this.OR([
            {ALT : () => Tok = this.CONSUME(TOKENS.ID_NO_DOT)},
            {ALT : () => Tok = this.CONSUME(TOKENS.ID_WITH_DOT)},
            {ALT : () => Tok = this.CONSUME(TOKENS.ID_BRACKETED)},
        ])
        return this.ACTION(() => Tok!.image)
    })

    sentences = this.RULE("sentences", () => {
        const IDs : string[] = []
        this.AT_LEAST_ONE(() => {
            const ID = this.SUBRULE(this.ID)
            this.ACTION(() => IDs.push(ID))
        })
        return this.ACTION(() => IDs.join(" "))
    })
}

export const parser = new Parser()
export const visitor = parser.getBaseCstVisitorConstructor()