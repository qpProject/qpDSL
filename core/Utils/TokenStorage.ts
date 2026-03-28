import { createToken, Lexer, TokenType } from "chevrotain"
import { ireg } from "./regUtils"

export class TokenStorage<T extends string = never> {
    private storage : Record<string, TokenType> = {}
    get all() : TokenType[] {
        //push IDs to the end
        const all = Object.values(this.storage)
        const IDS = all.filter(t => t.name.startsWith("ID"))
        const nonIDS = all.filter(t => !t.name.startsWith("ID"))
        return [...nonIDS, ...IDS]
    }

    createStorageObj() : Record<T, TokenType> {
        //remap so ID stays at the end
        return Object.fromEntries(this.all.map(t => [t.name, t])) as Record<T, TokenType>
    }

    ID<K extends string>(IDtype : K, reg : RegExp, ){
        return this.register(`ID${IDtype}`, reg, "")
    }

    // withput automatic regex creation
    SKIPPED<K extends string>(name : K, reg : RegExp){
        return this.register<K, "">(name, reg, Lexer.SKIPPED as "")
    }
    LITERAL<K extends string>(name : K, reg : RegExp){
        return this.register(`${name}_LITERAL`, reg, "")
    }
    SYMBOLS<K extends string>(name : K, reg : RegExp){
        return this.register(name, reg, "SYMBOL")
    }

    // with automatic regex creation
    // 1st string is treated as the name
    // if the name DOES NOT include an underscore and s has non 0 length, it is included in the regex
    // if s has 0 length, the name is replaced underscore -> space, then added to the regex
    private preprocessStrToReg(name : string, s : string[]){
        if(name.includes("_") && s.length === 0) return [ireg(name), [name]] as const;
        else if(name.includes(" ")) name = name.replaceAll(" ", "_");
        const res = name.includes("_") ? [ireg(...s), s] as const : [ireg(name, ...s), [name, ...s]] as const
        return res
    }
    KEYWORD<K extends string>(name : K, ...s : string[]){
        const [reg, strs] = this.preprocessStrToReg(name, s)
        // this.groupped[name] = strs
        return this.register(name, reg, "keyword")
    }
    KEYWORD_NO_WORD_BOUNDARY<K extends string>(name : K, ...s : string[]){
        s = s.flatMap(s => s.split(" ").map(s => `(${s})`).join("\\s+"))
        s = s.sort((a, b) => b.length - a.length) //sort descending
        const reg = new RegExp(s.join("|"), "i")
        // this.groupped[name] = s
        return this.register(name, reg, "keyword")
    }
    PREPOSITION<K extends string>(name : K, ...s : string[]){
        const [reg, strs] = this.preprocessStrToReg(name, s)
        // this.groupped[name] = strs
        return this.register(name, reg, "prep")
    }
    OP<K extends string>(name : K, ...s : string[]){
        const [reg, strs] = this.preprocessStrToReg(name, s)
        // this.groupped[name] = strs
        return this.register(name, reg, "op")
    }

    CUSTOM<T_PREFIX extends string, T_NAME extends string>(prefix : T_PREFIX, name : T_NAME, token : TokenType) 
    : TokenStorage<T | `${T_PREFIX}_${T_NAME}`> {
        this.storage[`${prefix}_${name}`] = token
        return this as any
    }
    
    private register<
        T_Name extends string, T_group extends string,
        NewKey extends string = T_group extends "" ? T_Name : `${T_group}_${T_Name}`
    >(name : T_Name, pattern : RegExp, group : T_group) : TokenStorage<T | NewKey> {
        const key = (!group.length || group === Lexer.SKIPPED) ? name : `${group}_${name}`;
        const token = createToken({
            "name" : key,
            pattern,
            ...(group === Lexer.SKIPPED ? { group } : {})
        });
        (this.storage as any)[key] = token;
        return this as any
    }
}