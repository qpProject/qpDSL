import { CONFIG } from "../core"
import { Pipeline } from "../core/types"

function remove_comments(code: string): string {
    return code.replace(
        /\/\/.*|\/\*[\s\S]*?\*\//g,
        " "
    )
}

function lowercase(code : string): string {
    return code.toLowerCase()
}

function remove_filler_words(code : string): string {
    const fillerWordsPattern = new RegExp(`\\b(${CONFIG.FILLER_WORDS.join("|")})\\b`, "g")
    return code.replace(fillerWordsPattern, " ")
}

function remove_extra_whitespace(code : string): string {
    return code.replace(/\s+/g, " ").trim()
}

export const preprocess = Pipeline.from<string, string>(
    (x) => typeof x === "string",
    remove_comments, 
    lowercase, 
    remove_filler_words, 
    remove_extra_whitespace,
)