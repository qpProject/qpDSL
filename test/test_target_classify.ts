import { EffectDeclare, ExpectedTarget, Pipeline, TargetType } from "../core/types";
import { Context } from "../core/Utils/Context";
import { expectSimpleNumberPipeline } from "../stage4";
import { test } from "./cli";
import { parser } from "../stage4/parser";
import { CONFIG, InternalVariable } from "../core";
import { classifySingle } from "../stage4";
import { lexer } from "../stage4/lexer";

const test_eff = EffectDeclare.fromMetaData("e_test : whatever", "e_test", [
    "init",
    new InternalVariable("x", "x", [1])
], [], {
    validTypes : CONFIG.EFFECT_TYPES,
    validSubtypes : CONFIG.EFFECT_SUBTYPES,
})

const testPath = {
    action_name : "a_test",
    targets : []
}
CONFIG.VERBOSE = true
test(str => {
    const err = [] as any[]
    const R = classifySingle(
        test_eff, 
        new ExpectedTarget(str, TargetType.Position),
        0,
        testPath,
        err,
    )
    const tokens = Pipeline.exec(str, Pipeline.lex(lexer))
    console.log("Tokens:", tokens.map(t => `${t.image}(${t.tokenType.name})`))
    return err.length > 0 ? {
        result : R,
        error : err
    } : {
        result : R
    }
})