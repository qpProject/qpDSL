export interface ASTNode {
    readonly raw : string,
    stringify(indent? : number) : string[]
}

export enum TargetType {
    Number,
    Keyword,
    
    Card,
    Effect,
    Position,
    Zone,
    Player,

    Any,
}

export enum SentenceType {
    Condition,
    Target,
    Action,
    DeclareRuntimeVar,
}

export enum ConditionType {
    If,
    Else, 
    Unless,
}

export enum BinOpType {
    And,
    Or,
}

export enum VariableType {
    Internal,
    Runtime
}

export enum AmountModifier {
    MORE,
    LESS,
    LEQ,
    GEQ,
    EQ,
    NEQ
}

export enum Direction {
    up,
    down,
    left,
    right,
}