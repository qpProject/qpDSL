import { lexer } from "./lexer";
import { parser } from "./parser";
import { Pipeline } from "../core/types";
import { Context } from "../core/Utils/Context";
import { preprocess } from "./preprocessor";
import { CONFIG } from "../core";

const stage1pipeline = Pipeline.pipe(
    preprocess,
    Pipeline.pipe(
        Pipeline.LexParseAST(
            lexer,
            parser,
            "program"
        ),
        (program) => {
            if(CONFIG.VERBOSE) console.log("Program after parsing:", program);
            for(const eff of program.effects) Context.registerEffectName(eff.name);
            return program
        }
    )
)

export {
    stage1pipeline,
    lexer,
    parser,
}