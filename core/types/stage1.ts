import { ASTNode, VariableType } from "./generic";
import * as ERR from "../error"
import { Context } from "../Utils/Context";
import { ireg } from "../Utils";
import { Pipeline } from "../Utils/pipeline";

export class Target implements ASTNode {
    constructor(
        public raw : string,
    ){}
}

export interface Variable extends ASTNode {
    readonly name : string
    readonly type : VariableType
    readonly value : number[] | Target
}

export class InternalVariable implements Variable {
    type = VariableType.Internal
    constructor(
        public raw : string,
        public name : string,
        public value : number[],
    ){}
}

export class Program<T = string> implements ASTNode {
    T : T = 0 as any
    constructor(
        public raw : string,
        public effects : EffectDeclare<T>[] = [],
    ){}

    map<
        T_eff extends EffectDeclare<any>,
        T2 = T_eff["T"]
    >(f : ((sentence : EffectDeclare<T>) => T_eff) | Pipeline<EffectDeclare<T>, T_eff>) : Program<T2> {
        const $ = this as unknown as Program<T2>
        $.effects = this.effects.map(eff => Pipeline.exec(eff, f))
        return $;
    }
}

export class EffectDeclare<T = string> implements ASTNode {
    T : T = 0 as any
    types? : string[]
    type : string = ""
    subtypes : string[] = []
    variables : Record<string, Variable> = {}

    hasVariable(name : string) : boolean {
        return this.variables.hasOwnProperty(name)
    }

    getVariable(name : string) : Variable | undefined {
        return this.variables[name]
    }

    addVariable(variable : Variable) : void {
        this.variables[variable.name] = variable
    }

    private constructor(
        public raw : string,
        public name : string,
        public body : T[] = []
    ){}

    static fromMetaData(
        raw : string,
        name: string, 
        meta_data : (string | InternalVariable)[], 
        body : string[],
        config : {
            validTypes : string[],
            validSubtypes : string[],
        }
    ) : EffectDeclare<string>{
        const typeRegex = ireg(...config.validTypes);
        const subtypeRegex = ireg(...config.validSubtypes);

        const eff = new EffectDeclare(raw, name, body)
        eff.types = []

        Context.in(eff)

        for(const meta of meta_data) {
            if(typeof meta === "object"){
                const V = eff.getVariable(meta.name)

                if(V){
                    Context.in(meta)
                    if(meta.value.some(v => isNaN(v))){
                        Context.error(new ERR.EffectVariableNotANumberError(name, meta.value))
                    }
                    Context.error(new ERR.InternalVariableClashError(name, V))
                }

                eff.addVariable(meta)
                continue;
            }

            const typeMatch = typeRegex.exec(meta);
            if(typeMatch){
                eff.types.push(meta);
                continue;
            }

            const subtype = subtypeRegex.exec(meta);
            if(subtype){
                eff.subtypes.push(meta);
                continue;
            }

            Context.error(new ERR.EffectHasUnknownMetaDataError(name, meta, config.validTypes, config.validSubtypes))
        }

        if(eff.types.length === 0){
            Context.error(new ERR.EffectMissingTypeError(name, config.validTypes))
        }

        if(eff.types.length > 1){
            Context.error(new ERR.EffectHasMultipleTypesError(name, eff.types, config.validTypes))
        }

        eff.type = eff.types![0]
        delete eff.types

        return eff
    }

    //phase 1 -> 2
    map<T2>(f : ((sentence : T) => T2[]) | Pipeline<T, T2[]>) : EffectDeclare<T2> {
        const $ = this as unknown as EffectDeclare<T2>
        $.body = this.body.flatMap(body => Pipeline.exec(body, f))
        return $;
    }
}