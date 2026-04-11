import { lexer } from "../stage1/lexer";
import { preprocess } from "../stage1/preprocessor";
import { test } from "./cli";

test(str => {
    console.log("Lexing input:", str)
    str = preprocess.pipe(str)
    console.log("Preprocessed input:", str)
    const lexingResult = lexer.tokenize(str, "meta_data")
    if(lexingResult.errors && lexingResult.errors.length > 0){
        console.error("Lexing errors:", lexingResult.errors)
        throw new Error("Lexing failed")
    }
    return lexingResult.tokens
})