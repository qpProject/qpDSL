import { CONFIG } from "./config"

/** Makes a regex which is an "or" of all the words (incluiding the word boundaries), with i flag */
export function ireg(...s : string[]){
    s = s.map(str => str.replace(/_/g, " ")) // Convert underscores to spaces
        .flatMap(s => s.split(" ").map(s => `(${s})`).join("\\s+"))
        .map(s => `\\b${s}\\b`)
    s = s.sort((a, b) => b.length - a.length) //sort descending
    return new RegExp(s.join("|"), "i")
}

export function symbolReg(...s : string[]){
    const regStr = s.map(
            //escape each one
            s => s.length === 1 ? `\\${s}` : s
        )
        .sort((a, b) => b.length - a.length) //sort descending
        .join("")
    return new RegExp("[" + regStr + "]")
}

export function symbolRegMany(...s : string[]){
    const regStr = s.map(
            //escape each one
            s => s.length === 1 ? `\\${s}` : s
        )
        .sort((a, b) => b.length - a.length) //sort descending
        .join("")
    return new RegExp("[" + regStr + "]+")
}

export function mergeRegs(...regs : RegExp[]){
    const regStr = regs.map(r => r.source).join("")
    return new RegExp(regStr)
}

export function orRegs(...regs : RegExp[]){
    const regStr = regs.map(r => `(${r.source})`).join("|")
    return new RegExp(regStr)
}

export const ID_WITHOUT_DOT_REG = symbolRegMany(...CONFIG.ALLOWED_SYMBOLS_IN_SENTENCES, "a-z", "A-Z", "0-9")

const bracket_reg1 = /\[.*?\]/
const bracket_reg2 = /\(.*?\)/
const bracket_reg3 = /\{.*?\}/

export const ID_WITH_DOT_REG = orRegs(
    //reg no dor
    ID_WITHOUT_DOT_REG,
    //reg with dot, only allow dot if there is something after it
    mergeRegs(
        /\./,
        ID_WITHOUT_DOT_REG
    ),
    orRegs(bracket_reg1, bracket_reg2, bracket_reg3)
)