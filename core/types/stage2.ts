import { ASTNode, SentenceType, ConditionType, BinOpType, VariableType } from "./generic";
import { Variable, Target, EffectDeclare } from "./stage1";

export class SentenceSegment implements ASTNode {
    constructor(
        public raw : string,
    ){}
    stringify(indent?: number): string[]{
        return [`${" ".repeat(indent || 0)}Segment: ${this.raw}`]
    }
    owner?: Sentence<any>
}

// Not a segment, but a wrapper for segment with operator
export class BinOp<T extends SentenceSegment = SentenceSegment> implements ASTNode {
    owner? : Sentence<any>
    constructor(
        public raw : string,
        public left : T,
        public right : T,
        public operator : BinOpType,
    ){}
    stringify(indent?: number): string[] {
        const opStr = BinOpType[this.operator]
        const strs = [`Operator: ${opStr}`]
        strs.push(`Left:`)
        strs.push(...this.left.stringify(indent ? indent + 2 : 2))
        strs.push(`Right:`)
        strs.push(...this.right.stringify(indent ? indent + 2 : 2))
        return strs
    }
}

export abstract class Sentence<T extends SentenceSegment = SentenceSegment> implements ASTNode {
    owner? : EffectBodySegment // the segment this sentence belongs to, will be set if not a declare runtime variable sentence
    protected constructor(
        public raw : string,
        public type : SentenceType = SentenceType.Action,
        public segments : (T | BinOp<T>)[] = [],
    ){
        segments.forEach(s => {
            s.owner = this
            if (s instanceof BinOp) {
                s.left.owner = this
                s.right.owner = this
            }
        })
    }

    abstract stringify(indent?: number): string[]

    map<T2 extends SentenceSegment>(f : (segment : T) => T2){
        for(let i = 0; i < this.segments.length; i++){
            if(this.segments[i] instanceof BinOp){
                const binOp = this.segments[i] as BinOp<T>
                binOp.left = f(binOp.left) as any
                binOp.right = f(binOp.right) as any
                binOp.left.owner = this
                binOp.right.owner = this
            } else {
                this.segments[i] = f(this.segments[i] as T) as any
                this.segments[i].owner = this
            }
        }
        return this as any as Sentence<T2>
    }
}

export class RuntimeVariable implements Variable {
    type = VariableType.Runtime
    constructor(
        public raw : string,
        public name : string,
        public value : Target,
    ){}
    stringify(indent? : number): string[] {
        return [
            `${" ".repeat(indent || 0)}Runtime variable: ${this.name}`,
            `${" ".repeat(indent || 0)}Value:`,
            ...this.value.stringify(indent ? indent + 2 : 2)
        ]
    }
}

export class RuntimeVariableDeclareSentence extends Sentence<never> {
    constructor(
        raw : string,
        public name : string,
        public value : RuntimeVariable,
    ){
        super(raw, SentenceType.DeclareRuntimeVar, [])
    }

    stringify(indent?: number): string[] {
        const ind = indent ?? 0
        const strs: string[] = []
        strs.push(`${" ".repeat(ind)}Runtime variable declare: ${this.name}`)
        strs.push(...this.value.stringify(ind + 2))
        return strs
    }
}

export class ConditionSentence<T extends SentenceSegment = SentenceSegment> extends Sentence<T> {
    boundedIf? : ConditionSentence<T> // only for else condition
    constructor(
        raw : string,
        public conditionType : ConditionType,
        segments : (T | BinOp<T>)[] = [],
    ){
        super(raw, SentenceType.Condition, segments)
    }

    override map<T2 extends SentenceSegment>(f: (segment: T) => T2): ConditionSentence<T2> {
        return super.map(f) as any
    }

    override stringify(indent?: number): string[] {
        const ind = indent ?? 0
        const condStr = ConditionType[this.conditionType]
        const strs: string[] = []
        strs.push(`${" ".repeat(ind)}${condStr} condition:`)
        for (const segment of this.segments) {
            if (segment instanceof BinOp) {
                strs.push(...segment.stringify(ind + 2))
            } else {
                strs.push(...(segment as any).stringify(ind + 2))
            }
        }
        return strs
    }
}

export class IfSentence<T extends SentenceSegment = SentenceSegment> extends ConditionSentence<T> {
    constructor(
        raw : string,
        segments : (T | BinOp<T>)[] = [],
    ){
        super(raw, ConditionType.If, segments)
    }

    override map<T2 extends SentenceSegment>(f: (segment: T) => T2): IfSentence<T2> {
        return super.map(f) as any
    }
}

export class ElseSentence<T extends SentenceSegment = SentenceSegment> extends ConditionSentence<T> {
    constructor(
        raw : string,
        segments : (T | BinOp<T>)[] = [],
    ){
        super(raw, ConditionType.Else, segments)
    }

    override map<T2 extends SentenceSegment>(f: (segment: T) => T2): IfSentence<T2> {
        return super.map(f) as any
    }
}

export class UnlessSentence<T extends SentenceSegment = SentenceSegment> extends ConditionSentence<T> {
    constructor(
        raw : string,
        segments : (T | BinOp<T>)[] = [],
    ){
        super(raw, ConditionType.Unless, segments)
    }

    override map<T2 extends SentenceSegment>(f: (segment: T) => T2): IfSentence<T2> {
        return super.map(f) as any
    }
}

export class TargetSentence<T extends SentenceSegment = SentenceSegment> extends Sentence<T> {
    constructor(
        raw : string,
        segments : (T | BinOp<T>)[] = [],
    ){
        super(raw, SentenceType.Target, segments)
    }

    override map<T2 extends SentenceSegment>(f: (segment: T) => T2): TargetSentence<T2> {
        return super.map(f) as any
    }

    override stringify(indent?: number): string[] {
        const ind = indent ?? 0
        const strs: string[] = []
        // strs.push(`${" ".repeat(ind)}Target:`)
        for (const segment of this.segments) {
            if (segment instanceof BinOp) {
                strs.push(...segment.stringify(ind + 2))
            } else {
                strs.push(...(segment as any).stringify(ind + 2))
            }
        }
        return strs
    }
}

export class ActionSentence<T extends SentenceSegment = SentenceSegment> extends Sentence<T> {
    constructor(
        raw : string,
        segments : (T | BinOp<T>)[] = [],
    ){
        super(raw, SentenceType.Action, segments)
    }

    override map<T2 extends SentenceSegment>(f: (segment: T) => T2): ActionSentence<T2> {
        return super.map(f) as any
    }

    override stringify(indent?: number): string[] {
        const ind = indent ?? 0
        const strs: string[] = []
        // strs.push(`${" ".repeat(ind)}Action:`)
        for (const segment of this.segments) {
            if (segment instanceof BinOp) {
                strs.push(...segment.stringify(ind + 2))
            } else {
                strs.push(...(segment as any).stringify(ind + 2))
            }
        }
        return strs
    }
}

export class EffectBodySegment<
    T_cond extends SentenceSegment = SentenceSegment,
    T_target extends SentenceSegment = SentenceSegment,
    T_action extends SentenceSegment = SentenceSegment,
> implements ASTNode {
    owner : EffectDeclare = {} as any
    constructor(
        public segmentID : number,
        public raw : string,
        public conditions : ConditionSentence<T_cond>[],
        public targets : TargetSentence<T_target>[],
        public actions : ActionSentence<T_action>[],
    ){
        conditions.forEach(c => c.owner = this)
        targets.forEach(t => t.owner = this)
        actions.forEach(a => a.owner = this)
    }

    map<
        T_cond2 extends SentenceSegment,
        T_target2 extends SentenceSegment,
        T_action2 extends SentenceSegment,
    >(
        f_cond : (segment : ConditionSentence<T_cond>) => ConditionSentence<T_cond2>,
        f_target : (segment : TargetSentence<T_target>) => TargetSentence<T_target2>,
        f_action : (segment : ActionSentence<T_action>) => ActionSentence<T_action2>,
    ){
        const $ = this as any as EffectBodySegment<T_cond2, T_target2, T_action2>
        $.conditions = this.conditions.map(f_cond)
        $.targets = this.targets.map(f_target)
        $.actions = this.actions.map(f_action)
        return $;
    }

    stringify(indent?: number): string[] {
        const ind = indent ?? 0
        const strs: string[] = []
        strs.push(`${" ".repeat(ind)}Segment ${this.segmentID}:`)
        
        if (this.conditions.length > 0) {
            strs.push(`${" ".repeat(ind + 2)}Conditions:`)
            for (const cond of this.conditions) {
                strs.push(...cond.stringify(ind + 4))
            }
        }
        
        if (this.targets.length > 0) {
            strs.push(`${" ".repeat(ind + 2)}Targets:`)
            for (const target of this.targets) {
                strs.push(...target.stringify(ind + 4))
            }
        }
        
        if (this.actions.length > 0) {
            strs.push(`${" ".repeat(ind + 2)}Actions:`)
            for (const action of this.actions) {
                strs.push(...action.stringify(ind + 4))
            }
        }
        
        return strs
    }
}
