import { ASTError } from "../core/error";
import { ASTNode, Pipeline, Program } from "../core/types";
import { Context } from "../core/Utils/Context";
import { stage1pipeline } from "../stage1";
import { stage2pipeline } from "../stage2";
import { stage3pipeline } from "../stage3";
import { stage4pipeline } from "../stage4";
import { test } from "./cli";

function parse(str : string){
    Context.clear()
    try{
        const st1 = Pipeline.exec(str, stage1pipeline)
        const st2 = st1.map(stage2pipeline)
        const st3 = st2.map(stage3pipeline)
        const st4 = st3.map(stage4pipeline)
        return st4
    }catch(e : any){
        return e as ASTError
    }
}

const basic_test = "e_test.init: draw 2, draw 3."

console.log("RUNNING BASIC TEST")
console.dir( parse(basic_test) , { depth : 20 } )
console.log("BASIC TEST COMPLETE")

test(parse)

