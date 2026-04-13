import type { ASTNode } from "../types/generic";
import { ASTError } from "./base";
import { lexer, type PartialMatch } from "../../stage3";
import { IToken } from "chevrotain";
import { Pipeline } from "../types";

//
class EffectDeclareError extends ASTError {
    constructor(message: string){
        super();
        this.message = message;
    }
}

export class EffectVariableNotANumberError extends EffectDeclareError {
    constructor(variable: string, values : number[]) {
        super(`Effect variable is not a number: ${variable}, received values: ${values.join(", ")}`);
        this.name = "Effect Variable Not A Number";
    }
}

export class EffectMissingTypeError extends EffectDeclareError {
    constructor(effectName: string, allowedTypes: string[] = []) {
        super(`Effect declaration missing type: ${effectName}, allowed types: ${allowedTypes.length > 0 ? allowedTypes.join(", ") : "None"}`);
        this.name = "Effect Missing Type";
    }
}

export class EffectHasMultipleTypesError extends EffectDeclareError {
    constructor(effectName: string, types: string[], allowedTypes: string[] = []) {
        super(`Effect declaration has multiple types: ${effectName}, types: ${types.join(", ")}, allowed types: ${allowedTypes.length > 0 ? allowedTypes.join(", ") : "None"}`);
        this.name = "Effect Has Multiple Types";
    }
}

export class EffectHasInvalidNameError extends EffectDeclareError {
    constructor(effectName: string) {
        super(`Effect declaration has invalid name: ${effectName}, perhaps you are missing the prefix 'e_'?`);
        this.name = "Effect Has Invalid Name";
    }
}

export class EffectHasUnknownMetaDataError extends EffectDeclareError {
    constructor(effectName: string, unknownMetaData: string, allowedTypes : string[], allowedSubtypes : string[]) {
        super(`Effect declaration has unknown meta data: ${effectName}, unknown meta data: ${unknownMetaData}, allowed types: ${allowedTypes.length > 0 ? allowedTypes.join(", ") : "None"}, allowed subtypes : ${allowedSubtypes.length > 0 ? allowedSubtypes.join(", ") : "None"}`)
        this.name = "Effect Has Unknown Metadata";
    }
}

//
class SentenceBindingError extends ASTError {
    constructor(message: string) {
        super();
        this.name = "SentenceBindingError";
        this.message = message;
    }
}

export class DanglingConditionError extends SentenceBindingError {
    constructor() {
        super(`Dangling condition error: condition sentence cannot bind to anything`);
        this.name = "Condition Cannot Bind To Anything Error";
    }
}

export class DanglingTargetError extends SentenceBindingError {
    constructor() {
        super(`Dangling target at end of segment`);
        this.name = "Target Cannot Bind To Anything Error";
    }
}

export class DanglingElseError extends SentenceBindingError {
    constructor() {
        super(`Dangling else error: Else condition sentence cannot bind to anything`);
        this.name = "Else Condition Cannot Bind To Anything Error";
    }
}

export class RuntimeVariableClashError extends SentenceBindingError {
    constructor(variableName : string, oldVariable : ASTNode){
        super(`Runtime variable ${variableName} is already declared here: ${oldVariable.raw}`)
        this.name = "Effect has redeclared runtime variable";
    }
}

export class InternalVariableClashError extends SentenceBindingError {
    constructor(variableName : string, oldVariable : ASTNode){
        super(`Internal variable ${variableName} is already declared here: ${oldVariable.raw}`)
        this.name = "Effect has redeclared internal variable";
    }
}

//
class ActionClassificationError extends ASTError {
    constructor(message: string){
        super()
        this.message = message;
    }
}

export class FailToClassifyActionError extends ActionClassificationError {
    constructor(raw : string, longestPaths : PartialMatch[]){
        let errStr = `No action template matched for action "${raw}"`
        
        let tokens : IToken[] = []
        try{
            tokens = Pipeline.exec(raw, Pipeline.lex(lexer))
            errStr += `\nLexer output tokens: ${tokens.map(t => t.image + "(" + t.tokenType.name + ")").join(", ")}`
        }catch(e){
            errStr += `\nLexer failed`
        }

        if(longestPaths.length === 0) errStr += "<No matches found?>"
        else {
            for(const p of longestPaths){
                errStr += `\n- ${p.action_name.join(", ")}:`
                errStr += `\nhas anchors: "${p.matched_anchors.join(", ")}"`
                errStr += `\nmissing anchors: "${p.missing_anchors.join(", ")}"`
            }
        }
        super(errStr)
        this.name = "Fail To Classify Action Error";
    }
}

//
export class TargetClassificationError extends ASTError {
    constructor(message: string){
        super()
        this.name = "TargetClassificationError";
        this.message = message;
    }
}

export class TargetTypeConflictError extends TargetClassificationError {
    constructor(public t_expect : string, public t_infered : string){
        super(`Target type conflict: expected ${t_expect}, infered ${t_infered}`);
        this.name = "Target Type Conflict Error";
    }
}

export class AmbiguousClassificationError extends TargetClassificationError {
    constructor(paths : Record<string, string[]>){
        //paths map action name -> expected sequence
        const paths_str = Object.entries(paths).map(([action, seq]) => `${seq.join(" ")} (from ${action})`).join("; ")
        super(`Target has ambiguous classification. possible classifications: ${paths_str}`);
        this.name = "AmbiguousClassificationError";
    }
}

export class CannotBindBackreferenceError extends TargetClassificationError {
    constructor(backrefRaw : string){
        super(`Cannot bind backreference: ${backrefRaw}`);
        this.name = "CannotBindBackreferenceError";
    }
}

export class UnknownVariableError extends TargetClassificationError {
    constructor(variableName : string, availableVariables : string[]){
        super(`Unknown variable: ${variableName}, available variables: ${availableVariables.join(", ")}`);
        this.name = "UnknownVariableError";
    }
}

export class CanmotUseThisOperatorError extends TargetClassificationError {
    constructor(operator : string, allowed: string[]){
        super(`Cannot use operator ${operator}, allowed operators: ${allowed.join(", ")}`);
        this.name = "CannotUseThisOperatorError";
    }
}

export class DuplicatedFromClauseError extends TargetClassificationError {
    constructor(from1 : string, from2 : string, on : string){
        super(`From clause redeclared, appeared once at ${from1}, appeared again at ${from2}, on card ${on}`)
        this.name = `DuplicatedFromClauseError`
    }
}