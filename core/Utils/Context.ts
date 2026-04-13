import type { ASTNode } from "../types/generic"
import { ASTError } from "../error";
import type { CstNode } from "chevrotain";
import type { AnyInferedTarget } from "../types";
import { getNodeTextDesperate } from "./CstUtils";

class ContextClass {
    readonly stagedAdvaned : number = -1
    readonly allEffectNames : string[] = []

    registerEffectName(name : string){
        this.allEffectNames.push(name)
    }

    readonly stack : ASTNode[] = [];
    private currentRaw : string = "";
    readonly cachedTargets : AnyInferedTarget[] = []

    private checkpoint? : {
        stack: ASTNode[],
        cachedTargets: AnyInferedTarget[],
        currentRaw: string
    }

    set raw(raw : string){this.currentRaw = raw}
    get raw(): string { return this.currentRaw }

    in(...node : ASTNode[]){
        this.stack.push(...node)
    }
    cache(...target : AnyInferedTarget[]){
        this.cachedTargets.push(...target)
    }
    out(){
        this.stack.pop()
    }
    error(err : ASTError | Error){
        if(err instanceof ASTError) err.blame(...this.stack.reverse());
        return new Error(err.toString())
    }

    /**
     * @warning **DANGER** DO NOT MANUALLY CLEAR THE CONTEXT UNLESS YOU KNOW WHAT YOU ARE DOING. 
     * 
     * 
     * *Side effects* includes the context **FORGOT** previous stages it went through
     * which is the opposite of the purpose of this class
     *  */
    clear(){
        (this as any).stack = [];
        (this as any).cachedTargets = [];
        (this as any).stagedAdvaned = -1;
        this.currentRaw = ""
    }

    advanceStage(stage? : number){
        (this as any).stagedAdvaned = stage !== undefined ? stage : this.stagedAdvaned + 1
    }

    clearCache(){
        (this as any).cachedTargets = [];
    }

    getNodeText(node : CstNode){
        if(!node.location || !node.location.endOffset || !this.raw) {
            return getNodeTextDesperate(node);
        }
        return this.currentRaw.slice(node.location.startOffset, node.location.endOffset)
    }

    save(){
        this.checkpoint = {
            stack : [...this.stack],
            cachedTargets : [...this.cachedTargets],
            currentRaw : this.currentRaw
        }
    }

    restore(){
        if(!this.checkpoint) return;
        (this as any).stack = this.checkpoint.stack;
        (this as any).cachedTargets = this.checkpoint.cachedTargets;
        this.currentRaw = this.checkpoint.currentRaw;
        this.checkpoint = undefined;
    }
}

export const Context = new ContextClass()
