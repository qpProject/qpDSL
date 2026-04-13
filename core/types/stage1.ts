import { ASTNode, VariableType } from "./generic";
import * as ERR from "../error"
import { Context } from "../Utils/Context";
import { ireg } from "../Utils";
import { Pipeline } from "../Utils/pipeline";

export abstract class Target implements ASTNode {
    constructor(
        public raw : string,
    ){}
    abstract stringify(indent? : number) : string[];
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
    stringify(indent? : number) : string[] {
        const [first, ...rest] = this.value
        return [
            `${" ".repeat(indent || 0)}Internal variable: ${this.name}`,
            `${" ".repeat(indent || 0)}Value: ${first}`,
        ].concat(
            rest.length ? [`${" ".repeat(indent || 0)}Upgraded to: ${rest.join(", ")}`] : []
        )
    }
}

export class Program<T extends ASTNode | string = string> implements ASTNode {
    T : T = 0 as any
    constructor(
        public raw : string,
        public effects : EffectDeclare<T>[] = [],
    ){}

    map<
        T_eff extends EffectDeclare<any>,
        T2 extends ASTNode | string = T_eff["T"]
    >(f : ((sentence : EffectDeclare<T>) => T_eff) | Pipeline<EffectDeclare<T>, T_eff>) : Program<T2> {
        const $ = this as unknown as Program<T2>
        $.effects = this.effects.map(eff => Pipeline.exec(eff, f))
        return $;
    }

    stringify(indent?: number): string[] {
        const effs = this.effects.flatMap(eff => eff.stringify(indent).concat([""]))
        return effs
    }
}

export class EffectDeclare<T extends ASTNode | string = string> implements ASTNode {
    T : T = 0 as any
    types? : string[]
    type : string = ""
    subtypes : string[] = []
    variables : Record<string, Variable> = {}
    archtypes : string[] = []

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

    stringify(indent: number = 0): string[] {
        return [
            `${" ".repeat(indent)}Effect: ${this.name}`,
        ].concat(
            this.types ? [`${" ".repeat(indent + 2)}Type: ${this.type}`] : [],
            this.subtypes.length ? [`${" ".repeat(indent + 2)}Subtypes: ${this.subtypes.join(", ")}`] : [],
            this.archtypes.length ? [`${" ".repeat(indent + 2)}Archetypes/extension: ${this.archtypes.join(", ")}`] : [],
            Object.values(this.variables).length ? [`${" ".repeat(indent + 2)}Variables:`] : [],
            ...Object.values(this.variables).flatMap(v => v.stringify(indent + 4)),
            `${" ".repeat(indent + 2)}Body:`,
            ...this.body.flatMap(b => typeof b === "string" ? [`${" ".repeat(indent + 4)}${b}`] : b.stringify(indent + 4))
        )
    }

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

        if(!name.startsWith("e_")){
            throw Context.error(new ERR.EffectHasInvalidNameError(name))
        }

        for(const meta of meta_data) {
            if(typeof meta === "object"){
                const V = eff.getVariable(meta.name)

                if(V){
                    Context.in(meta)
                    if(meta.value.some(v => isNaN(v))){
                        throw Context.error(new ERR.EffectVariableNotANumberError(name, meta.value))
                    }
                    throw Context.error(new ERR.InternalVariableClashError(meta.name, V))
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

            //assumed archtype
            eff.archtypes.push(meta)
        }

        if(eff.types.length === 0){
            throw Context.error(new ERR.EffectMissingTypeError(name, config.validTypes))
        }

        if(eff.types.length > 1){
            throw Context.error(new ERR.EffectHasMultipleTypesError(name, eff.types, config.validTypes))
        }

        eff.type = eff.types![0]
        delete eff.types

        return eff
    }

    //phase 1 -> 2
    private firstMap = true
    map<T2 extends ASTNode | string>(f : ((sentence : T) => T2[]) | Pipeline<T, T2[]>) : EffectDeclare<T2> {
        const $ = this as unknown as EffectDeclare<T2>
        $.body = this.body.flatMap(body => Pipeline.exec(body, f))
        if(this.firstMap){
            this.firstMap = false
            $.body.forEach((b, i) => {
                if(b && typeof b === "object" && "owner" in b){
                    b.owner = $
                }
            })
        }
        return $;
    }
}