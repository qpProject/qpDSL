export * from "./lexer"
export * from "./helpers"

import { isKeywordCategory, lookup, Match } from "./helpers"
import { KeywordCategory } from "./keyword_categories"
import { lexer, TOKENS } from "./lexer"
import { data } from "./typed_sequences"
import { Pipeline } from "../core/types"
import * as AST from "../core/types"
import * as ERR from "../core/error"
import { IToken } from "chevrotain"

import { data as data_typed } from "./typed_sequences"
import { data as data_untyped } from "./untyped_sequences"
import { Context } from "../core/Utils/Context"
import { TargetType } from "../core/types"
import { isCategory, mapCategoryIfPossible } from "./classifyKeyword"
import { CONFIG } from "../core"

function classify(
    ctx : AST.ASTNode, 
    type : "condition" | "creation",
    raw = ctx.raw,
    tokens : IToken[] = Pipeline.exec(raw, Pipeline.lex(lexer)),
    tries = 0
) : {
    action_name : string,
    targets : AST.ExpectedTarget[],
}[]{
    // console.log(".....")
    const tokenTypes = tokens.map((t, i) => {
        const cat = mapCategoryIfPossible(t.image)
        if(cat && i < tries) return cat
        return t.tokenType.name
    })

    const [bestMatch, bestPartialMatch] = lookup(tokenTypes, type)
    if(!bestMatch.length){
        if(tries >= tokens.length){
            throw Context.error( new ERR.FailToClassifyActionError(raw, bestPartialMatch) )
        }
        return classify(ctx, type, raw, tokens, tries + 1)
    }
    const pair = bestMatch.flatMap(m => m.matched_action.map(name => [
        name, 
        m.classification_result
    ] as const))
    
    return pair.map(([action_name,  classificationResults]) => {
        const raws = classificationResults.tokenIndices.map(indices => {
            if(!indices.length) return "";
            const toks = indices.map(i => tokens[i])
            const sIndex = toks[0].startOffset
            const eIndex = toks.at(-1)!.endOffset
            return raw.slice(sIndex, eIndex! + 1)
        })
        const types_sequence = data_typed[action_name]
        const T : [string, (number | KeywordCategory)][] = classificationResults
            .path
            .map((_, i) => {
                const type = types_sequence[i]
                if(isNaN(+type) && !isKeywordCategory(type)) return undefined;
                return [raws[i], type] as const
            })
            .filter(x => x !== undefined) as any

        if(CONFIG.VERBOSE) console.log(`Inside ${type} classifier, info`, {
            raws,
            action_name,
            types_sequence,
            classification_path : classificationResults.path,
            targets_types : T
        });

        return {
            action_name,
            targets : T.map(([raw, t]) => {
                if(isKeywordCategory(t)){
                    const keywordCorrect = isCategory(raw, t)
                    if(!keywordCorrect){
                        Context.in(ctx)
                        throw Context.error( new ERR.KeywordClassificationError(raw, t) )
                    }
                    return new AST.KeywordTarget(raw, t)
                }
                return new AST.ExpectedTarget(raw, t)
            })
        }
    })
}

const conditionClassifierPipeline : Pipeline<AST.SentenceSegment, AST.ConditionSegment> = {
    accept(ctx){
        return ctx instanceof AST.SentenceSegment
    },
    pipe(ctx){
        const targets = classify(ctx, "condition")
        return new AST.ConditionSegment(ctx, targets)
    }
}

const actionClassifierPipeline : Pipeline<AST.SentenceSegment, AST.ActionSegment> = {
    accept(ctx){
        return ctx instanceof AST.SentenceSegment
    },
    pipe(ctx){
        const raw = ctx.raw
        if(!raw.length){
            Context.in(ctx)
            throw Context.error( new Error("Empty action sentence") )
        }
        const tokens : IToken[] = Pipeline.exec(raw, Pipeline.lex(lexer))

        let isInstead = false
        if(tokens.at(-1)!.tokenType.tokenTypeIdx === TOKENS.keyword_instead.tokenTypeIdx){
            isInstead = true
            tokens.pop()
        }
        if(tokens.at(0)!.tokenType.tokenTypeIdx === TOKENS.keyword_instead.tokenTypeIdx){
            isInstead = true
            tokens.shift()
        }

        const targets = classify(ctx, "creation", raw, tokens)
        return new AST.ActionSegment(ctx, targets, isInstead)
    }
}

const targetClassifierPipeline : Pipeline<AST.SentenceSegment, AST.TargetSegment> = {
    accept(ctx){
        return ctx instanceof AST.SentenceSegment
    },
    pipe(ctx){
        return new AST.TargetSegment(ctx)
    },
}

export const stage3pipeline : Pipeline<
    AST.EffectDeclare<AST.EffectBodySegment>,
    AST.EffectDeclare<AST.EffectBodySegment<AST.ConditionSegment, AST.TargetSegment, AST.ActionSegment>>
> = {
    accept(ctx){
        return ctx instanceof AST.EffectDeclare
    },
    pipe(eff){
        return eff.map(sentence => {
            return [sentence.map(
                s => s.map(conditionClassifierPipeline.pipe),
                s => s.map(targetClassifierPipeline.pipe),
                s => s.map(actionClassifierPipeline.pipe),
            )]
        })
    }
}