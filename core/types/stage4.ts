import { ActionSegment, ConditionSegment, ExpectedTarget, TargetSegment } from "./stage3"
import { TargetType, AmountModifier, Direction } from "./generic"
import { SentenceSegment } from "./stage2"
import type { KeywordCategory } from "../../stage3/keyword_categories";

export class InferedTarget extends ExpectedTarget {
    protected constructor(
        oldTarget : ExpectedTarget,
        public inferredType : TargetType,
    ){
        super(oldTarget.raw, oldTarget.expectedType)
    }

    override stringify(indent?: number): string[] {
        const ind = indent || 0
        const typeStr = TargetType[this.inferredType]
        return [
            `${" ".repeat(ind)}Infered target: ${typeStr}`,
        ]
    }
}

// ===== Keyword classification =====

export class KeywordTarget extends InferedTarget {
    constructor(
        raw : string,
        public category : KeywordCategory
    ){
        super(new ExpectedTarget(raw, TargetType.Keyword), TargetType.Keyword)
    }

    override stringify(indent?: number): string[] {
        const ind = indent ?? 0
        return [`${" ".repeat(ind)}Keyword: ${this.raw}(${this.category})`]
    }
}

// ===== Amount Specification =====

export class VarReference extends InferedTarget {
    constructor(
        oldTarget : ExpectedTarget,
        public name : string
    ){
        super(oldTarget, TargetType.Number)
    }

    override stringify(indent?: number): string[] {
        const ind = indent ?? 0
        return [`${" ".repeat(ind)}Variable reference: ${this.name}`]
    }
}

export class INT_LIT extends InferedTarget {
    constructor(
        oldTarget : ExpectedTarget,
        public amount : number
    ){
        super(oldTarget, TargetType.Number)
    }

    override stringify(indent?: number): string[] {
        const ind = indent ?? 0
        return [`${" ".repeat(ind)}Integer literal: ${this.amount}`]
    }
}

export class AmountSpec {
    constructor(
        public amount: INT_LIT | VarReference | "all", 
        public operator: AmountModifier = AmountModifier.EQ
    ){}

    stringify(indent?: number): string[] {
        const ind = indent ?? 0
        const opStr = AmountModifier[this.operator]
        const strs: string[] = []
        strs.push(`${" ".repeat(ind)}Amount: ${opStr}`)
        if (typeof this.amount !== "string") {
            strs.push(...this.amount.stringify(ind + 2))
        } else {
            strs.push(`${" ".repeat(ind + 2)}${this.amount}`)
        }
        return strs
    }
}

export class OrderSpec extends AmountSpec {
    constructor(
        public order : number,
    ){
        super(new INT_LIT({raw : order.toString()} as any, order))
    }

    override stringify(indent?: number): string[] {
        const ind = indent ?? 0
        return [`${" ".repeat(ind)}Order: ${this.order}`]
    }
}

// ===== Direction =====

export class DirectionSpec {
    constructor(
        public directions: Direction[]
    ){}

    stringify(indent?: number): string[] {
        const ind = indent ?? 0
        const dirStr = this.directions.map(d => Direction[d]).join(", ")
        return [`${" ".repeat(ind)}Directions: ${dirStr}`]
    }
}

// ===== Flags =====

export class Flag {
    stringify(indent?: number): string[] {
        const ind = indent ?? 0
        return [`${" ".repeat(ind)}Flag`]
    }
}

// Card Flags
export class RandomFlag extends Flag {
    override stringify(indent?: number): string[] {
        const ind = indent ?? 0
        return [`${" ".repeat(ind)}Random flag`]
    }
}

/**Extension name have the dot upfront */
export class ExtensionFlag extends Flag {
    constructor(public extensionName: string){
        super()
    }

    override stringify(indent?: number): string[] {
        const ind = indent ?? 0
        return [`${" ".repeat(ind)}Extension: ${this.extensionName}`]
    }
}

export class AnyExtensionFlag extends ExtensionFlag {
    constructor(){
        super(".*")
    }

    override stringify(indent?: number): string[] {
        const ind = indent ?? 0
        return [`${" ".repeat(ind)}Any extension`]
    }
}

export class RarityFlag extends Flag {
    constructor(public rarityValue: string){
        super()
    }

    override stringify(indent?: number): string[] {
        const ind = indent ?? 0
        return [`${" ".repeat(ind)}Rarity: ${this.rarityValue}`]
    }
}

export class ArchetypeFlag extends Flag {
    constructor(public archetypeName: string){
        super()
    }

    override stringify(indent?: number): string[] {
        const ind = indent ?? 0
        return [`${" ".repeat(ind)}Archetype: ${this.archetypeName}`]
    }
}

export class PropertyValueFLag extends Flag {
    constructor(
        public statName: string,
        //if requiredValue is not specified, just check for existence of the stat
        public requiredValue?: AmountSpec,
        //if overrideTarget is not specified, use the target this class belongs to
        // otherwise, use this
        public overrideTarget? : AnyInferedTarget | Backreference
    ){
        super()
    }

    override stringify(indent?: number): string[] {
        const ind = indent ?? 0
        const strs: string[] = []
        strs.push(`${" ".repeat(ind)}Property: ${this.statName}`)
        if (this.requiredValue) {
            strs.push(...this.requiredValue.stringify(ind + 2))
        }
        if (this.overrideTarget) {
            strs.push(`${" ".repeat(ind + 2)}Override target:`, ...(this.overrideTarget as any).stringify(ind + 3))
        }
        return strs
    }
}

export class RowFlag extends PropertyValueFLag {
    constructor(
        requiredValue?: AmountSpec,
        overrideTarget? : AnyInferedTarget | Backreference
    ){
        super("row", requiredValue, overrideTarget)
    }

    override stringify(indent?: number): string[] {
        const ind = indent ?? 0
        const strs: string[] = []
        strs.push(`${" ".repeat(ind)}Row flag`)
        if (this.requiredValue) {
            strs.push(...this.requiredValue.stringify(ind + 2))
        }
        if (this.overrideTarget) {
            strs.push(`${" ".repeat(ind + 2)}Override target:`, ...(this.overrideTarget as any).stringify(ind + 3))
        }
        return strs
    }
}

export class ColFlag extends PropertyValueFLag {
    constructor(
        requiredValue?: AmountSpec,
        overrideTarget? : AnyInferedTarget | Backreference
    ){
        super("column", requiredValue, overrideTarget)
    }

    override stringify(indent?: number): string[] {
        const ind = indent ?? 0
        const strs: string[] = []
        strs.push(`${" ".repeat(ind)}Column flag`)
        if (this.requiredValue) {
            strs.push(...this.requiredValue.stringify(ind + 2))
        }
        if (this.overrideTarget) {
            strs.push(`${" ".repeat(ind + 2)}Override target:`, ...(this.overrideTarget as any).stringify(ind + 3))
        }
        return strs
    }
}

export class PlayerFlag extends Flag {
    constructor(public playerName: string, public playerIndex: number = 1){
        super()
    }

    override stringify(indent?: number): string[] {
        const ind = indent ?? 0
        return [`${" ".repeat(ind)}Player: ${this.playerName} (index ${this.playerIndex})`]
    }
}

// Effect Flags
export class EffectTypeFlag extends Flag {
    constructor(public effectType: string){
        super()
    }

    override stringify(indent?: number): string[] {
        const ind = indent ?? 0
        return [`${" ".repeat(ind)}Effect type: ${this.effectType}`]
    }
}

export class EffectSubtypeFlag extends Flag {
    constructor(public effectSubtype: string){
        super()
    }

    override stringify(indent?: number): string[] {
        const ind = indent ?? 0
        return [`${" ".repeat(ind)}Effect subtype: ${this.effectSubtype}`]
    }
}

export type CardFlag   = 
    RandomFlag        | 
    ExtensionFlag     | 
    RarityFlag        | 
    ArchetypeFlag     | 
    PropertyValueFLag | 
    PlayerFlag

export type EffectFlag = 
    RandomFlag        | 
    EffectTypeFlag    | 
    EffectSubtypeFlag

export type PosFlag    = 
    RandomFlag | 
    PropertyValueFLag

export type ZoneFlag   = 
    RandomFlag | 
    PlayerFlag

type AnyFLag = CardFlag | EffectFlag | PosFlag | ZoneFlag

// ===== Backreference =====

export class Backreference extends InferedTarget {
    constructor(
        raw : string,
        public shape : InferedTarget,
    ){
        super(shape, shape.inferredType)
        this.raw = raw
    }

    static isFlagOfShape(shapeFlags : AnyFLag[], targetFlags : AnyFLag[]) : boolean {

        function hasFlagInstance<T extends new (...p : any) => AnyFLag>(
            instance : T,
            addedCheck? : (flag : InstanceType<T>) => boolean
        ){
            return targetFlags.some(f => f instanceof instance && (!addedCheck || addedCheck(f as any)))
        }

        for(const f of shapeFlags){
            if(f instanceof RandomFlag){
                if(!hasFlagInstance(RandomFlag)) return false
            }
            else if(f instanceof ExtensionFlag){
                if(!hasFlagInstance(ExtensionFlag, f2 => {
                    return f2.extensionName === f.extensionName
                })) return false
            }
            else if(f instanceof RarityFlag){
                if(!hasFlagInstance(RarityFlag, f2 => {
                    return f2.rarityValue === f.rarityValue
                })) return false
            }
            else if(f instanceof ArchetypeFlag){
                if(!hasFlagInstance(ArchetypeFlag, f2 => {
                    return f2.archetypeName === f.archetypeName
                })) return false
            }
            else if(f instanceof PropertyValueFLag){
                if(!hasFlagInstance(PropertyValueFLag, f2 => {
                    return f2.statName === f.statName && (
                        !f.requiredValue || 
                        f2.requiredValue?.amount === f.requiredValue.amount &&
                        f2.requiredValue.operator === f.requiredValue.operator
                    ) && (
                        !f.overrideTarget ||
                        !!this.isTargetOfShape(f.overrideTarget, f2.overrideTarget!)
                    )
                })) return false
            }
            else if(f instanceof PlayerFlag){
                if(!hasFlagInstance(PlayerFlag, f2 => {
                    return f2.playerName === f.playerName && f2.playerIndex === f.playerIndex
                })) return false
            }
            else if(f instanceof EffectTypeFlag){
                if(!hasFlagInstance(EffectTypeFlag, f2 => {
                    return f2.effectType === f.effectType
                })) return false
            }
            else if(f instanceof EffectSubtypeFlag){
                if(!hasFlagInstance(EffectSubtypeFlag, f2 => {
                    return f2.effectSubtype === f.effectSubtype
                })) return false
            }
            else return false
        }

        return true
    }

    static compareAmountSpec(spec1: AmountSpec, spec2: AmountSpec) : boolean {
        return spec1.operator === spec2.operator && (
            (spec1.amount === "all" && spec2.amount === "all") ||
            (spec1.amount instanceof VarReference && spec2.amount instanceof VarReference && spec1.amount.name === spec2.amount.name) ||
            (spec1.amount instanceof INT_LIT && spec2.amount instanceof INT_LIT && spec1.amount.amount === spec2.amount.amount) 
        )
    }

    /**Returns if target of the given shape*/
    static isTargetOfShape(
        shape : InferedTarget, 
        target : AnyInferedTarget | Backreference
    ) : boolean | undefined {
        if(shape.inferredType === TargetType.Any) return true;
        if(shape.inferredType !== target.inferredType) return false;
        if(target instanceof Backreference){
            return target.shape === shape
        }
        if(shape instanceof CardTarget && target instanceof CardTarget){
            return (
                this.isFlagOfShape(shape.flags, target.flags) &&
                (
                    !shape.fromClause || (
                        target.fromClause && 
                        this.isTargetOfShape(shape.fromClause, target.fromClause)
                    )
                ) &&
                shape.withClauses.every(swc => {
                    let cond = true
                    if(swc.effect){
                        cond &&= target.withClauses.some(twc => twc.effect && this.isTargetOfShape(swc.effect!, twc.effect))
                    }
                    if(swc.stat){
                        cond &&= target.withClauses.some(twc => twc.stat && twc.stat.statName === swc.stat!.statName && (swc.stat!.statValue && twc.stat!.statValue && this.compareAmountSpec(swc.stat!.statValue, twc.stat.statValue)))
                    }
                    return cond
                })
            )
        }
        else if(shape instanceof EffectTarget && target instanceof EffectTarget){
            return (
                this.isFlagOfShape(shape.flags, target.flags) &&
                (
                    !shape.fromClause || (
                        target.fromClause && 
                        this.isTargetOfShape(shape.fromClause, target.fromClause)
                    )
                )
            )
        }
        else if(shape instanceof PosTarget && target instanceof PosTarget){
            return (
                this.isFlagOfShape(shape.flags, target.flags) &&
                (
                    !shape.fromClause || (
                        target.fromClause &&
                        this.isTargetOfShape(shape.fromClause, target.fromClause)
                    )
                ) &&
                (
                    !shape.directionClause || (
                        target.directionClause &&
                        shape.directionClause.every(sdc => target.directionClause!.some(tdc => sdc.directions.join(",") === tdc.directions.join(",")))
                    )
                ) &&
                (
                    !shape.distanceClause || (
                        target.distanceClause &&
                        this.compareAmountSpec(shape.distanceClause.distance, target.distanceClause.distance) &&
                        this.isTargetOfShape(shape.distanceClause.from, target.distanceClause.from) &&
                        (
                            !shape.distanceClause.in ||
                            (target.distanceClause.in && this.isTargetOfShape(shape.distanceClause.in, target.distanceClause.in))
                        )
                    )
                ) &&
                shape.withClauses.every(swc => {
                    return target.withClauses.some(twc => this.isTargetOfShape(swc, twc))
                })
            )
        }
        else if(shape instanceof ZoneTarget && target instanceof ZoneTarget){
            return (
                this.isFlagOfShape(shape.flags, target.flags) &&
                shape.zoneName === target.zoneName
            )
        }
        return undefined
    }

    accept(potentialTarget : AnyInferedTarget){
        if(this.shape.inferredType === TargetType.Any)
            //accept anything if shape is any 
            return new BackreferenceBounded(this, potentialTarget);
        if (
            Backreference.isTargetOfShape(this.shape, potentialTarget) === true
        ) return new BackreferenceBounded(this, potentialTarget)
        else return undefined
    }

    override stringify(indent?: number): string[] {
        const ind = indent ?? 0
        const strs: string[] = []
        strs.push(`${" ".repeat(ind)}Backreference:`)
        strs.push(`${" ".repeat(ind + 2)}Shape:`, ...this.shape.stringify(ind + 3))
        return strs
    }
}

export class AnyBackreference extends Backreference {
    constructor(raw : string){
        super(raw, new InferedTarget(new ExpectedTarget(raw, TargetType.Any), TargetType.Any))
    }

    override stringify(indent?: number): string[] {
        const ind = indent ?? 0
        return [`${" ".repeat(ind)}Any backreference`]
    }
}

export class BackreferenceBounded extends Backreference {
    constructor(
        uninfered : Backreference,
        public inferedTarget : InferedTarget,
    ){
        super(uninfered.raw, uninfered.shape)
    }

    override stringify(indent?: number): string[] {
        const ind = indent ?? 0
        const strs: string[] = []
        strs.push(`${" ".repeat(ind)}Backreference bounded:`)
        strs.push(`${" ".repeat(ind + 2)}Infered target:`, ...this.inferedTarget.stringify(ind + 3))
        return strs
    }
}

// ===== Card Target =====

export interface CardWithClause {
    effect?: EffectTarget | Backreference
    stat?: {
        statName: string
        operator? : AmountModifier
        statValue?: AmountSpec,
        compare_to? : CardTarget | Backreference
    },
    property?: {
        propertyName: string
        compare_to : CardTarget | Backreference
        operator : AmountModifier.EQ | AmountModifier.NEQ
    }
}

export class CardTarget extends InferedTarget {
    constructor(
        oldTarget : ExpectedTarget,
        public amount?: AmountSpec,
        public flags: CardFlag[] = [],
        public fromClause?: ZoneTarget | PosTarget | Backreference,
        public withClauses: CardWithClause[] = []
    ){
        super(oldTarget, TargetType.Card)
    }

    override stringify(indent?: number): string[] {
        const ind = indent ?? 0
        const strs: string[] = []
        strs.push(`${" ".repeat(ind)}Card target:`)
        if (this.amount) {
            strs.push(...this.amount.stringify(ind + 2))
        }
        if (this.flags.length > 0) {
            strs.push(`${" ".repeat(ind + 2)}Flags:`, ...this.flags.flatMap(f => f.stringify(ind + 3)))
        }
        if (this.fromClause) {
            strs.push(`${" ".repeat(ind + 2)}From:`, ...(this.fromClause as any).stringify(ind + 3))
        }
        if (this.withClauses.length > 0) {
            strs.push(`${" ".repeat(ind + 2)}With clauses:`)
            for (const clause of this.withClauses) {
                if (clause.effect) {
                    strs.push(`${" ".repeat(ind + 3)}Effect:`, ...(clause.effect as any).stringify(ind + 4))
                }
                if (clause.stat) {
                    strs.push(`${" ".repeat(ind + 3)}Stat: ${clause.stat.statName}`)
                    if(clause.stat.statValue) {
                        strs.push(...clause.stat.statValue.stringify(ind + 4))
                    }
                    if(clause.stat.compare_to) {
                        const operatorStr = clause.stat.operator !== undefined ? AmountModifier[clause.stat.operator] : "unspecified"
                        strs.push(`${" ".repeat(ind + 4)}Compare (${operatorStr}) to:`, ...(clause.stat.compare_to as any).stringify(ind + 5))
                    }
                }
                if (clause.property){
                    strs.push(`${" ".repeat(ind + 3)}Property: ${clause.property.propertyName}`)
                    const operatorStr = AmountModifier[clause.property.operator]
                    strs.push(`${" ".repeat(ind + 4)}Compare (${operatorStr}) to:`, ...(clause.property.compare_to as any).stringify(ind + 5))
                }
            }
        }
        return strs
    }
}

export class ThisCard extends CardTarget {
    constructor(
        oldTarget : ExpectedTarget,
    ){
        super(oldTarget)
    }

    override stringify(indent?: number): string[] {
        const ind = indent ?? 0
        return [`${" ".repeat(ind)}This card`]
    }
}

// ===== Effect Target =====

export class EffectTarget extends InferedTarget {
    constructor(
        oldTarget : ExpectedTarget,
        public amount?: AmountSpec,
        public flags: EffectFlag[] = [],
        public fromClause?: CardTarget | Backreference,
    ){
        super(oldTarget, TargetType.Effect)
    }

    override stringify(indent?: number): string[] {
        const ind = indent ?? 0
        const strs: string[] = []
        strs.push(`${" ".repeat(ind)}Effect target:`)
        if (this.amount) {
            strs.push(...this.amount.stringify(ind + 2))
        }
        if (this.flags.length > 0) {
            strs.push(`${" ".repeat(ind + 2)}Flags:`, ...this.flags.flatMap(f => f.stringify(ind + 3)))
        }
        if (this.fromClause) {
            strs.push(`${" ".repeat(ind + 2)}From:`, ...(this.fromClause as any).stringify(ind + 3))
        }
        return strs
    }
}

export class ThisEffect extends EffectTarget {
    constructor(
        oldTarget : ExpectedTarget,
    ){
        super(oldTarget)
    }

    override stringify(indent?: number): string[] {
        const ind = indent ?? 0
        return [`${" ".repeat(ind)}This effect`]
    }
}

// ===== Position Target =====

export interface PositionDistanceClause {
    distance: AmountSpec
    from: CardTarget | PosTarget | Backreference
    in? : ZoneTarget | Backreference
}

export class PosTarget extends InferedTarget {
    constructor(
        oldTarget : ExpectedTarget,
        public amount?: AmountSpec,
        public flags: PosFlag[] = [],
        public fromClause?: ZoneTarget | Backreference,
        public directionClause?: DirectionSpec[],
        public distanceClause?: PositionDistanceClause,
        public withClauses: (CardTarget | Backreference)[] = []
    ){
        super(oldTarget, TargetType.Position)
    }

    override stringify(indent?: number): string[] {
        const ind = indent ?? 0
        const strs: string[] = []
        strs.push(`${" ".repeat(ind)}Position target:`)
        if (this.amount) {
            strs.push(...this.amount.stringify(ind + 2))
        }
        if (this.flags.length > 0) {
            strs.push(`${" ".repeat(ind + 2)}Flags:`, ...this.flags.flatMap(f => f.stringify(ind + 3)))
        }
        if (this.fromClause) {
            strs.push(`${" ".repeat(ind + 2)}From:`, ...(this.fromClause as any).stringify(ind + 3))
        }
        if (this.directionClause && this.directionClause.length > 0) {
            strs.push(`${" ".repeat(ind + 2)}Directions:`, ...this.directionClause.flatMap(d => d.stringify(ind + 3)))
        }
        if (this.distanceClause) {
            strs.push(`${" ".repeat(ind + 2)}Distance:`, ...this.distanceClause.distance.stringify(ind + 3))
            strs.push(`${" ".repeat(ind + 2)}Distance from:`, ...(this.distanceClause.from as any).stringify(ind + 3))
            if (this.distanceClause.in) {
                strs.push(`${" ".repeat(ind + 2)}Distance in:`, ...(this.distanceClause.in as any).stringify(ind + 3))
            }
        }
        if (this.withClauses.length > 0) {
            strs.push(`${" ".repeat(ind + 2)}With clauses:`, ...this.withClauses.flatMap(w => (w as any).stringify(ind + 3)))
        }
        return strs
    }
}

export class PosOfCard extends PosTarget {
    constructor(
        oldTarget : ExpectedTarget,
        card : CardTarget | Backreference
    ){
        super(
            oldTarget, 
            new AmountSpec(new INT_LIT({raw : "1"} as any, 1)),
            [],
            undefined,
            undefined,
            undefined,
            [card]
        )
    }

    override stringify(indent?: number): string[] {
        const ind = indent ?? 0
        const strs: string[] = []
        strs.push(`${" ".repeat(ind)}Position of card:`)
        if (this.withClauses.length > 0) {
            strs.push(...this.withClauses.flatMap(w => (w as any).stringify(ind + 2)))
        }
        return strs
    }
}

// Pos dont have this

// ===== Zone Target =====

export class ZoneTarget extends InferedTarget {
    constructor(
        oldTarget : ExpectedTarget,
        public flags: ZoneFlag[] = [],
        public zoneName: string = ""
    ){
        super(oldTarget, TargetType.Zone)
    }

    override stringify(indent?: number): string[] {
        const ind = indent ?? 0
        const strs: string[] = []
        strs.push(`${" ".repeat(ind)}Zone target: ${this.zoneName}`)
        if (this.flags.length > 0) {
            strs.push(`${" ".repeat(ind + 2)}Flags:`, ...this.flags.flatMap(f => f.stringify(ind + 3)))
        }
        return strs
    }
}

// Zone also dont have this

// ===== Player Target =====

export class PlayerTarget extends InferedTarget {
    constructor(
        oldTarget : ExpectedTarget,
        public playerName : string,
        public playerIndex : number = 1
    ){
        super(oldTarget, TargetType.Player)
    }

    override stringify(indent?: number): string[] {
        const ind = indent ?? 0
        return [`${" ".repeat(ind)}Player: ${this.playerName} (index ${this.playerIndex})`]
    }
}

export class ThisPlayer extends PlayerTarget {
    constructor(
        oldTarget : ExpectedTarget,
    ){
        super(oldTarget, "player")
    }

    override stringify(indent?: number): string[] {
        const ind = indent ?? 0
        return [`${" ".repeat(ind)}This player`]
    }
}

// ===== Number Target =====

export class NumberTarget extends InferedTarget {
    constructor(
        oldTarget : ExpectedTarget,
        public amount : INT_LIT | VarReference | CountOfTarget | NumberPropertyOfTarget
    ){
        super(oldTarget, TargetType.Number)
    }

    override stringify(indent?: number): string[] {
        const ind = indent ?? 0
        const strs: string[] = []
        strs.push(`${" ".repeat(ind)}Number target:`)
        strs.push(...(this.amount as any).stringify(ind + 2))
        return strs
    }
}

export class CountOfTarget extends NumberTarget {
    constructor(
        oldTarget : ExpectedTarget,
        public countOf : ExpectedTarget
    ){
        super(oldTarget, new INT_LIT(oldTarget, 0))
    }

    override stringify(indent?: number): string[] {
        const ind = indent ?? 0
        const strs: string[] = []
        strs.push(`${" ".repeat(ind)}Count of:`)
        strs.push(...this.countOf.stringify(ind + 2))
        return strs
    }
}

export class NumberPropertyOfTarget extends NumberTarget {
    constructor(
        oldTarget : ExpectedTarget,
        public propertyName : string,
        public propertyOf : AnyInferedTarget | Backreference,
    ){
        super(oldTarget, new INT_LIT(oldTarget, 0))
    }

    override stringify(indent?: number): string[] {
        const ind = indent ?? 0
        const strs: string[] = []
        strs.push(`${" ".repeat(ind)}Property: ${this.propertyName}`)
        strs.push(`${" ".repeat(ind + 2)}Of:`, ...(this.propertyOf as any).stringify(ind + 3))
        return strs
    }
}

// ===== Any target (util type) =====
export type AnyInferedTarget = CardTarget | EffectTarget | PosTarget | ZoneTarget | PlayerTarget | NumberTarget

// ===== Sentence segments =====

export class InferedActionSegment extends SentenceSegment {
    constructor(
        segment : ActionSegment,
        public actionID : string,
        public inferedClassificationPath : InferedTarget[],
        public isInstead = segment.isInstead
    ){
        super(segment.raw)
        this.owner = segment.owner
    }

    override stringify(indent?: number): string[] {
        const ind = indent ?? 0
        const strs: string[] = []
        strs.push(`${" ".repeat(ind)}Action segment: ${this.actionID}`)
        if(this.isInstead){
            strs.push(`${" ".repeat(ind + 3)}Instead: true`)
        }
        if (this.inferedClassificationPath.length > 0) {
            strs.push(...this.inferedClassificationPath.flatMap(p => p.stringify(ind + 3)))
        }
        return strs
    }
}

export class InferedTargetSegment extends SentenceSegment {
    constructor(
        segment : TargetSegment,
        public inferedClassificationPaths : InferedTarget[]
    ){
        super(segment.raw)
        this.owner = segment.owner
    }

    override stringify(indent?: number): string[] {
        const ind = indent ?? 0
        const strs: string[] = []
        strs.push(`${" ".repeat(ind)}Target segment:`)
        if (this.inferedClassificationPaths.length > 0) {
            strs.push(...this.inferedClassificationPaths.flatMap(p => p ? p.stringify(ind + 3) : "Unknown"))
        }
        return strs
    }
}

export class InferedConditionSegment extends SentenceSegment {
    constructor(
        segment : ConditionSegment,
        public conditionID : string,
        public inferedClassificationPaths : InferedTarget[],
    ){
        super(segment.raw)
        this.owner = segment.owner
    }

    override stringify(indent?: number): string[] {
        const ind = indent ?? 0
        const strs: string[] = []
        strs.push(`${" ".repeat(ind)}Condition segment: ${this.conditionID}`)
        if (this.inferedClassificationPaths.length > 0) {
            strs.push(...this.inferedClassificationPaths.flatMap(p => p.stringify(ind + 3)))
        }
        return strs
    }
}


