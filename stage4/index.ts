import { lexer } from "./lexer";
import { parser } from "./parser";
import * as AST from "../core/types"
import * as ERR from "../core/error"
import { Pipeline } from "../core/types";
import { Context } from "../core/Utils/Context";
import { CONFIG, getTokenStream } from "../core";

export const expectCardPipeline = Pipeline.LexParseAST(
    lexer,
    parser,
    "expect_card",
    ERR.CannotTokenizeTarget,
)

export const expectEffectPipeline = Pipeline.LexParseAST(
    lexer,
    parser,
    "expect_effect",
    ERR.CannotTokenizeTarget
)

export const expectPosPipeline = Pipeline.LexParseAST(
    lexer,
    parser,
    "expect_pos",
    ERR.CannotTokenizeTarget
)

export const expectZonePipeline = Pipeline.LexParseAST(
    lexer,
    parser,
    "expect_zone",
    ERR.CannotTokenizeTarget
)

export const expectPlayerPipeline = Pipeline.LexParseAST(
    lexer,
    parser,
    "expect_player",
    ERR.CannotTokenizeTarget
)

export const expectSimpleNumberPipeline = Pipeline.LexParseAST(
    lexer,
    parser,
    "expect_number_simple",
    ERR.CannotTokenizeTarget
)

export const expectExtendedNumberPipeline = Pipeline.LexParseAST(
    lexer,
    parser,
    "expect_number_extended",
    ERR.CannotTokenizeTarget
)

export const expectAnythingPipeline = Pipeline.LexParseAST(
    lexer,
    parser,
    "expect_anything",
    ERR.CannotTokenizeTarget
)

export const classifyTargetPipeline : Pipeline<AST.ExpectedTarget, AST.InferedTarget> = {
    accept(ctx){
        return ctx instanceof AST.ExpectedTarget
    },
    pipe(ctx){
        const raw = ctx.raw
        const type = ctx.expectedType

        const tokens = lexer.tokenize(raw).tokens
        if(CONFIG.VERBOSE) console.log("Classifying target with raw:", raw, "and expected type:", type);
        if(CONFIG.VERBOSE) console.log("Tokens for target classification:", tokens);

        let target : AST.InferedTarget | undefined = undefined

        //things already have a type like internal vars and stuff
        if(ctx instanceof AST.InferedTarget) {
            if(CONFIG.VERBOSE) console.log("Target already infered, skipping classification", ctx);
            target = (ctx as any);
        }

        function classifyAST(){
            switch(type){
                case AST.TargetType.Card: return expectCardPipeline.pipe(raw)
                case AST.TargetType.Effect: return expectEffectPipeline.pipe(raw)
                case AST.TargetType.Position: return expectPosPipeline.pipe(raw)
                case AST.TargetType.Zone: return expectZonePipeline.pipe(raw)
                case AST.TargetType.Player: return expectPlayerPipeline.pipe(raw)
                case AST.TargetType.Number: return expectSimpleNumberPipeline.pipe(raw)
                default: return expectAnythingPipeline.pipe(raw)
            }
        }

        if(target) return target

        const R = classifyAST()
        if(
            R instanceof AST.CardTarget   || 
            R instanceof AST.EffectTarget || 
            R instanceof AST.PosTarget    || 
            R instanceof AST.ZoneTarget   || 
            R instanceof AST.PlayerTarget
        ){
            Context.cache(R)
        }
        return R
    }
}


/**
 * Try parse 1 with expected type
 * if fail -> try again with expected type Any
 * if still fails -> return PREVIOUS error
 */
export function classifySingle(
    eff : AST.EffectDeclare<any>,
    t : AST.ExpectedTarget, 
    index : number,
    p : {
        action_name: string;
        targets: AST.ExpectedTarget[];
    },
    err : {
        path : (typeof p),
        target : AST.ExpectedTarget,
        target_index : number,
        error : Error
    }[],
    previous_error? : Error
) : AST.InferedTarget | undefined {

    let originalType = t.expectedType
    try{
        if(previous_error){
            //has prev errors -> is in try again mode
            t.expectedType = AST.TargetType.Any
        }
        const R = classifyTargetPipeline.pipe(t)
        if(R === undefined){
            throw previous_error? previous_error : new Error(`Failed to classify target "${t.raw}" for action "${p.action_name}". Classification pipe returns undefined`)
        }
        t.expectedType = originalType
        return R
    } catch(e1){
        const E = e1 instanceof Error ? e1 : new Error(String(e1));
        t.expectedType = originalType
        if(!previous_error) return classifySingle(eff, t, index, p, err, E);

        err.push({
            path : p,
            target : t,
            target_index : index,
            error : E
        })
        return undefined
    }
}

function isTypeEquivalent(t_expect : AST.TargetType, t_infered : AST.TargetType) : boolean {
    if (t_expect === AST.TargetType.Any) return true;
    return t_expect === t_infered
}

function classifyPaths(
    eff : AST.EffectDeclare,
    paths : {
        action_name: string;
        targets: AST.ExpectedTarget[];
    }[],
){
    const err_arr : {
        path : (typeof paths)[number],
        target : AST.ExpectedTarget,
        target_index : number,
        error : Error
    }[] = []
    const P = paths.map(p => {
        const temp_err : typeof err_arr = []
        if(p.targets.length === 0){
            return {
                action_name : p.action_name,
                targets : []
            }
        }
        const inferedTargets = p.targets.map((t, index) => {
            parser.bindTarget(t, eff)
            const R = classifySingle(eff, t, index, p, temp_err)
            if(CONFIG.VERBOSE) console.log(`[DEBUG] After classifySingle for target "${t.raw}":`, { R: R ? 'defined' : 'undefined', temp_err_length: temp_err.length });
            if(!R) return R;
            const typeInfo = isTypeEquivalent(t.expectedType, R.inferredType)
            if(typeInfo === false){
                err_arr.push({
                    path : p,
                    target : t,
                    target_index : index,
                    error : new ERR.TargetTypeConflictError(AST.TargetType[t.expectedType], AST.TargetType[R.inferredType])
                })
                return undefined
            }
            return R
        })
        if(inferedTargets.some(t => t === undefined)){
            err_arr.push(...temp_err)
            return undefined
        }
        return {
            action_name : p.action_name,
            targets : inferedTargets as (AST.AnyBackreference | AST.Backreference)[]
        }
    }).filter(p => p !== undefined) as {
        action_name : string,
        targets : (AST.AnyBackreference | AST.Backreference)[]
    }[]
    return [P, err_arr] as const
}

const classifySegmentPipeline : Pipeline<{
    possibleClassificationPaths: {
        action_name: string;
        targets: AST.ExpectedTarget[];
    }[]
} & AST.SentenceSegment, {
    action_name: string;
    targets: AST.InferedTarget[];  
}> = {
    accept : (ctx) => {
        return ctx instanceof AST.SentenceSegment && "possibleClassificationPaths" in ctx
    },
    pipe(ctx){
        if(
            !ctx.owner
        ){
            throw new Error("Segment has no owner, skipping classification")
        }

        if(
            !ctx.owner!.owner
        ){
            throw new Error("Sentece has no owner, skipping classification")
        }

        if(
            !ctx.owner!.owner!.owner
        ){
            throw new Error("Effect body segment has no owner, skipping classification")
        }
        
        let [paths, ERR2] = classifyPaths(ctx.owner!.owner!.owner!, ctx.possibleClassificationPaths)

        if(!paths.length){
            const msg : string[] = []
            msg.push(`Classified ${ctx.possibleClassificationPaths.length} possible paths for action "${ctx.raw}".`)
            msg.push(`Encountered ${ERR2.length} errors while classifying targets for action "${ctx.raw}":`)
            for(const err of ERR2){
                msg.push(`Failed to classify target #${err.target_index + 1} for action "${err.path.action_name}":`)
                msg.push(`Error message: ${err.error.message}`)
                msg.push(`Target "${err.target.raw}":`)
                msg.push(...err.target.stringify(2))
                msg.push(`Expected type: ${AST.TargetType[err.target.expectedType]}`)
            }
            Context.in(ctx)
            throw Context.error(new ERR.TargetClassificationError(msg.join("\n")))
        }

        if(paths.length > 1){
            Context.in(ctx)
            throw Context.error( new ERR.AmbiguousClassificationError(
                Object.fromEntries(paths.map(p => [p.action_name, p.targets.map(t => t.raw)]))
            ))
        }

        const ret = paths[0]
        Context.cache(...ret.targets.filter(t => !(t instanceof AST.Backreference)))
        return paths[0]
    }
}

export const stage4pipeline : Pipeline<
    AST.EffectDeclare<AST.EffectBodySegment<AST.ConditionSegment, AST.TargetSegment, AST.ActionSegment>>,
    AST.EffectDeclare<AST.EffectBodySegment<AST.InferedConditionSegment, AST.InferedTargetSegment, AST.InferedActionSegment>>
> = {
    accept(ctx){
        return ctx instanceof AST.EffectDeclare
    },
    pipe(eff){
        const newEff = eff.map(body => {
            // clear cache
            const newBody = body.map(
                condition => {
                    return condition.map(cond => {
                        const classificationPaths = classifySegmentPipeline.pipe(cond)
                        return new AST.InferedConditionSegment(
                            cond, 
                            classificationPaths.action_name,
                            classificationPaths.targets
                        )
                    })
                },
                target => {
                    return target.map(t => {
                        console.log("segment", t)
                        const inferedTarget = t.targets.map((target, index) => {
                            parser.bindTarget(target, eff)
                            try {
                                const R = classifyTargetPipeline.pipe(target)
                                if(R === undefined){
                                    throw new Error(`Failed to classify target "${target.raw}" for target segment. Classification pipe returns undefined`)
                                }
                                return R
                            } catch(err) {
                                // console.error("Error classifying target in target segment:", target.raw, err instanceof Error ? err.message : err)
                                throw err
                            }
                        })
                        return new AST.InferedTargetSegment(t, inferedTarget)
                    })
                },
                action => {
                    return action.map(a => {

                        const classificationPaths = classifySegmentPipeline.pipe(a)
                        return new AST.InferedActionSegment(
                            a, 
                            classificationPaths.action_name,
                            classificationPaths.targets
                        )
                    })
                }
            )
            return [newBody]
        })
        newEff.variables = Object.fromEntries(
            Object.entries(newEff.variables).map(([k, v]) => {
                if(v instanceof AST.RuntimeVariable && v.value instanceof AST.ExpectedTarget){
                    parser.bindTarget(v.value, newEff)
                    const inferedTarget = expectExtendedNumberPipeline.pipe(v.value.raw)
                    return [k, new AST.RuntimeVariable(v.raw, v.name, inferedTarget)] as const
                }
                return [k, v]
            })
        )
        return newEff
    }
}