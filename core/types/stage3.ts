
//===== AST =====
import { Target } from "./stage1";
import { SentenceSegment } from "./stage2";
import { TargetType } from "./generic";

export class ExpectedTarget extends Target {
    constructor(
        raw : string,
        public expectedType : TargetType,
    ){
        super(raw);
    }

    override stringify(indent?: number): string[] {
        const ind = indent ?? 0
        const typeStr = TargetType[this.expectedType]
        return [`${" ".repeat(ind)}Expected target: ${typeStr}`]
    }
}

export class ActionSegment extends SentenceSegment {
    constructor(
        segment : SentenceSegment,
        public possibleClassificationPaths : {
            action_name : string,
            targets : ExpectedTarget[]
        }[],
        public isInstead : boolean
    ){
        super(segment.raw)
        this.owner = segment.owner
    }

    override stringify(indent?: number): string[] {
        const ind = indent ?? 0
        const strs: string[] = []
        // strs.push(`${" ".repeat(ind)}Action segment:`)
        if (this.isInstead) {
            strs.push(`${" ".repeat(ind + 2)}Instead: true`)
        }
        if (this.possibleClassificationPaths.length > 0) {
            strs.push(`${" ".repeat(ind + 2)}Possible paths:`)
            for (const path of this.possibleClassificationPaths) {
                strs.push(`${" ".repeat(ind + 4)}Action: ${path.action_name}`)
                if (path.targets.length > 0) {
                    strs.push(`${" ".repeat(ind + 5)}Targets:`, ...path.targets.flatMap(t => t.stringify(ind + 6)))
                }
            }
        }
        return strs
    }
}

export class TargetSegment extends SentenceSegment {
    targets = [new ExpectedTarget(this.raw, TargetType.Any)]
    constructor(
        segment : SentenceSegment,
    ){
        super(segment.raw)
        this.owner = segment.owner
    }

    override stringify(indent?: number): string[] {
        const ind = indent ?? 0
        const strs: string[] = []
        // strs.push(`${" ".repeat(ind)}Target segment:`)
        if (this.targets.length > 0) {
            strs.push(`${" ".repeat(ind + 2)}Targets:`, ...this.targets.flatMap(t => t.stringify(ind + 3)))
        }
        return strs
    }
}

export class ConditionSegment extends SentenceSegment {
    constructor(
        segment : SentenceSegment,
        public possibleClassificationPaths : {
            action_name : string,
            targets : ExpectedTarget[]
        }[],
    ){
        super(segment.raw)
        this.owner = segment.owner
    }

    override stringify(indent?: number): string[] {
        const ind = indent ?? 0
        const strs: string[] = []
        // strs.push(`${" ".repeat(ind)}Condition segment:`)
        if (this.possibleClassificationPaths.length > 0) {
            strs.push(`${" ".repeat(ind + 2)}Possible paths:`)
            for (const path of this.possibleClassificationPaths) {
                strs.push(`${" ".repeat(ind + 4)}Condition: ${path.action_name}`)
                if (path.targets.length > 0) {
                    strs.push(`${" ".repeat(ind + 5)}Targets:`, ...path.targets.flatMap(t => t.stringify(ind + 6)))
                }
            }
        }
        return strs
    }
}



