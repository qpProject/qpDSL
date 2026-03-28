import { createToken, Lexer } from "chevrotain";
import { ireg, ID_WITH_DOT_REG, TokenStorage } from "../core/";
import { CONFIG } from "../core/Utils/config";
const FILLER_WORDS = CONFIG.FILLER_WORDS

const openBrackets = ["(", "[", "{"]
const closeBrackets = [")", "]", "}"]

function isInsideBracketsBeforeOffset(text : string, offset : number){
    let stack : string[] = []
    for(let i = 0; i < offset; i++){
        if(openBrackets.includes(text[i])){
            stack.push(text[i])
        }
        else if(closeBrackets.includes(text[i])){
            if(stack.length === 0) continue;
            const lastOpen = stack[stack.length - 1]
            if(
                (lastOpen === "(" && text[i] === ")") ||
                (lastOpen === "[" && text[i] === "]") ||
                (lastOpen === "{" && text[i] === "}")
            ){
                stack.pop()
            }
        }
    }
    return stack.length > 0
}

const sentence_separator = (
    createToken({
        name: "SENTENCE_SEPARATOR",
        pattern: {exec : (text, startOffset) => {
            if(!text) return null;
            if(isInsideBracketsBeforeOffset(text, startOffset)) return null;
            const res = [] as unknown as RegExpExecArray
            outer : while(startOffset <= text.length){
                if(/\s/.test(text[startOffset])){
                    startOffset++
                    continue outer;
                }

                inner : for(const sep of CONFIG.VALID_SENTENCE_SEPARATORS){
                    if(
                        text.startsWith(sep, startOffset) &&
                        /\s/.test(text[startOffset + sep.length] || " ")
                    ){
                        res.push(sep)
                        startOffset += sep.length
                        continue outer;
                    }
                }

                // if not space and not separator, break the loop
                break outer;
            }
            if(res.length > 0) return [res.join(" ")] as RegExpExecArray;
            return null
        }},
        line_breaks: true
    })
)

const effect_prefix = createToken({
    name : "EFFECT_PREFIX",
    pattern : /\be_/,
    // pop_mode : true,
    push_mode : "meta_data"
})

const tokens_meta_data = new TokenStorage()
.CUSTOM("EFFECT", "PREFIX", effect_prefix)
.CUSTOM("SYMBOL", "COLON", createToken({
    name : "SYMBOL_COLON",
    pattern : /:/,
    pop_mode : true,
    push_mode : "sentences"
}))
.SYMBOLS("ARROW", /[=\-]+>/)
.SYMBOLS("DOT", /\./)
.SYMBOLS("EQ", /=/)
.SKIPPED("WHITESPACE", /\s+/)
.ID("_NO_DOT", /[a-zA-Z0-9_]+/)

const tokens_sentences = new TokenStorage()
.SKIPPED("WHITESPACE", /\s+/)
.SKIPPED("FILLER", ireg(...FILLER_WORDS))
.CUSTOM("SENTENCE", "SEPARATOR", sentence_separator)
.CUSTOM("EFFECT", "PREFIX", effect_prefix)
//id with dot only allow dot 
//if there is SOMETHING after the dot
// else the dot is lex as a sentence_separator
.ID("_WITH_DOT", ID_WITH_DOT_REG)

export const TOKENS = {
    ...tokens_meta_data.createStorageObj(),
    ...tokens_sentences.createStorageObj(),
}

console.log(Object.keys(TOKENS))
    
export const ALL_TOKENS = Object.values(TOKENS)

export const lexer = new Lexer({
    defaultMode : "meta_data",
    modes : {
        meta_data : tokens_meta_data.all,
        sentences : tokens_sentences.all,
    },
})