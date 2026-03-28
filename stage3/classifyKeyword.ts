import { CONFIG } from "../core/Utils/config";
import { Context } from "../core/Utils/Context";
import { KeywordCategory } from "./keyword_categories";
import * as ERR from "../core/error"

const KeywordMap : Record<KeywordCategory, string[] | ((s : string) => boolean)> = {} as any
KeywordMap[KeywordCategory.CARD_STAT] = CONFIG.CARD_STATS
KeywordMap[KeywordCategory.DAMAGE_TYPE] = ["physical", "magic"]
KeywordMap[KeywordCategory.EXTENSION] = (s) => s.startsWith(".") && s.length > 1
KeywordMap[KeywordCategory.EFFECT_ID] = (s) => {
    if(s.startsWith("e_")){
        if(!Context.allEffectNames.includes(s)) {
            Context.error(new ERR.EffectNameNotFoundError(s))
        }
        return true
    }
    return false
}
KeywordMap[KeywordCategory.EFFECT_MODIFIER] = [
    ...CONFIG.EFFECT_TYPES,
    ...CONFIG.EFFECT_SUBTYPES
]
KeywordMap[KeywordCategory.PLAYER_STAT] = ["heart"]
KeywordMap[KeywordCategory.EFFECT_TYPE] = CONFIG.EFFECT_TYPES
KeywordMap[KeywordCategory.EFFECT_SUBTYPE] = CONFIG.EFFECT_SUBTYPES

export function isCategory(str : string, ...category : KeywordCategory[]){
    for(const c of category){
        const v = KeywordMap[c]
        if(Array.isArray(v)){
            if(v.includes(str)) return true
        } else {
            if(v(str)) return true
        }
    }
    return false
}

export function mapCategoryIfPossible(str : string, ...category : KeywordCategory[]) : KeywordCategory | undefined {
    for(const c of category){
        const v = KeywordMap[c]
        if(Array.isArray(v)){
            if(v.includes(str)) return c
        } else {
            if(v(str)) return c
        }
    }
    return undefined
}