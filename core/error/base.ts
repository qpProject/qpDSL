import { ASTNode } from "../types/generic";

export abstract class ASTError extends Error {
    causeStack : (ASTNode | string)[] = []
    messageStack : string[] = []
    nameStack : string[] = []

    override get message(){
        return this.messageStack.join("\n")
    }

    override set message(str : string){
        this.messageStack.unshift(str)
    }

    override get name(){
        const [first, ...rest] = this.nameStack
        if(!first) return "Unknown Error";
        if(!rest.length) return `${first}`; 
        return `${first} (As one of ${rest.join(", ")})`
    }

    override set name(str : string){
        this.nameStack.unshift(str)
    }

    constructor(){
        super(`Unknown Error at stage`);
        this.name = `Error at stage`
    }

    blame(...node : (ASTNode | string)[]) : void {
        this.causeStack.unshift(...node) //more recent location is up top
    }

    private formatValue(value: any, depth: number = 10, maxArrayLength: number = 5): string {
        if (depth <= 0) return '...';
        
        if (value === null) return 'null';
        if (value === undefined) return 'undefined';
        if (typeof value === 'string') return `'${value}'`;
        if (typeof value === 'number' || typeof value === 'boolean') return String(value);
        
        if (Array.isArray(value)) {
            const items = value.slice(0, maxArrayLength).map(v => this.formatValue(v, depth - 1, maxArrayLength));
            if (value.length > maxArrayLength) items.push(`... +${value.length - maxArrayLength} more`);
            return `[ ${items.join(', ')} ]`;
        }
        
        if (typeof value === 'object') {
            if("stringify" in value && typeof value.stringify === "function"){
                return value.stringify().join("\n")
            }

            const keys = Object.keys(value).slice(0, maxArrayLength);
            const items = keys.map(k => `${k}: ${this.formatValue(value[k], depth - 1, maxArrayLength)}`);
            if (Object.keys(value).length > maxArrayLength) items.push(`... +${Object.keys(value).length - maxArrayLength} more`);
            return `{ ${items.join(', ')} }`;
        }
        
        return String(value);
    }

    override toString() : string {
        let result = this.name + "\n" + this.message
        let i = 2;
        for (const node of this.causeStack) {
            const arrowStr = "-".repeat(i++) + "> "
            result += "\n"
            result += arrowStr
            if(typeof node === "string"){
                result += `At : (str):\n"${node}"\n`
            }
            else {
                const str = this.formatValue(node)
                result += `At : (node):\n${str}\n`
            }
        }
        if(this.causeStack.length === 0){
            result += "\n(No location information available)"
        }
        return result
    }
}