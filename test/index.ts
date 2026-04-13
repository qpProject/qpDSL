import { test } from "./cli";

import { parse } from "../index"
import { CONFIG } from "../core";
import { TargetType } from "../core/types";

import {data} from "../stage3/typed_sequences"
import { KeywordCategory } from "../stage3/keyword_categories";

function rng(max : number, min : number, round : boolean = false) : number {
    const r = Math.random() * (max - min) + min
    return round ? Math.round(r) : r
}

function choose<T>(arr : T[]) : T {
    return arr[rng(arr.length - 1, 0, true)]
}

function generate_random_targets(type : TargetType) : string {
    switch(type){
        case TargetType.Number:
            return rng(1000, 0).toString()
        case TargetType.Keyword:
            return choose(CONFIG.CARD_RARITIES)
        case TargetType.Card: {
            const rarity = choose(CONFIG.CARD_RARITIES)
            const amount = rng(5, 1, true)
            let str = `${amount} ${rarity} card`
            if(rng(1, 0) > 0.5) {
                //add on Zone
                str += `on ${generate_random_targets(TargetType.Zone)}`
            }
            return str
        }
        case TargetType.Effect: {
            const amount = rng(5, 1, true)
            let str = `${amount} effect`
            return str
        }
        case TargetType.Position: {
            const amount = rng(5, 1, true)
            let str = `${amount} position`
            if(rng(1, 0) > 0.5) {
                //add on Zone
                str += `on ${generate_random_targets(TargetType.Zone)}`
            }
            return str
        }
        case TargetType.Zone: {
            const amount = rng(5, 1, true)
            return `${amount} zone`
        }
        case TargetType.Player: {
            return choose(["player", "enemy"])
        }
        case TargetType.Any: {
            return generate_random_targets(choose([
                TargetType.Card,
                TargetType.Zone,
                TargetType.Effect,
                TargetType.Position,
                TargetType.Player,
            ]))
        }
    }
}

function generate_random_keyword(category : KeywordCategory) : string {
    switch(category){
        case KeywordCategory.CARD_STAT:
            return choose(CONFIG.CARD_STATS)
        case KeywordCategory.DAMAGE_TYPE:
            return choose(["physical", "magic"])
        case KeywordCategory.EFFECT_ID:
            return "e_test"
        case KeywordCategory.EFFECT_MODIFIER:
            return choose(CONFIG.EFFECT_TYPES.concat(CONFIG.EFFECT_SUBTYPES))
        case KeywordCategory.EFFECT_TYPE:
            return choose(CONFIG.EFFECT_TYPES)
        case KeywordCategory.EFFECT_SUBTYPE:
            return choose(CONFIG.EFFECT_SUBTYPES)
        case KeywordCategory.EXTENSION:
            return ".fruit"
        case KeywordCategory.PLAYER_STAT:
            return "heart"
    }
}

function generate_random_sentence() : string {
    const sequence = choose(Object.keys(data).filter(k => k.startsWith("a_") && (data as any)[k] !== undefined))
    return data[sequence as keyof typeof data].map(s => {
        if(KeywordCategory[s as KeywordCategory]) {
            return generate_random_keyword(KeywordCategory[s as KeywordCategory])
        }
        if(typeof s === "number"){
            //target type
            return generate_random_targets(s as TargetType)
        }
        return (s as string).split("_").at(-1)!
    }).join(" ")
}

// console.log("RUNNING BASIC TEST")

// const progressBar = {
//     max_squares : 100,
//     max_iter : 2000,
//     current: 0,
//     print(){
//         const percentage = this.current / this.max_iter
//         const squares = Math.floor(percentage * this.max_squares)
//         const emptySquares = this.max_squares - squares
//         process.stdout.write(`\r[${"=".repeat(squares)}${" ".repeat(emptySquares)}] ${Math.round(percentage * 100)}%`)
//     }
// }

// // time running basic_test 100 times
// const ITER = progressBar.max_iter
// const start = Date.now()
// CONFIG.VERBOSE = false

// let fail_count = 0

// for(let i = 0; i < ITER; i++){
//     const num_sentence = rng(1, 5, true)
//     const eff_type = choose(CONFIG.EFFECT_TYPES)
//     const num_subtype = rng(0, 2, true)
//     let basic_test = `e_test.${eff_type}`
//     for(let j = 0; j < num_subtype; j++){
//         basic_test += `.${choose(CONFIG.EFFECT_SUBTYPES)}`
//     }
//     for(let j = 0; j < num_sentence; j++){
//         basic_test += generate_random_sentence() + ". "
//     }
//     const E = parse(basic_test)
//     if(E instanceof Error) fail_count++;
//     progressBar.current++;
//     progressBar.print()
// }
// const end = Date.now()
// console.log() // for new line after progress bar
// console.log(`BASIC TEST TIME: ${end - start}ms, for ${ITER} iterations, average ${(end - start) / ITER}ms per iteration`)
// console.log(`${fail_count} / ${ITER} failed`)

// console.log("BASIC TEST COMPLETE")
CONFIG.VERBOSE = false

test(parse)

