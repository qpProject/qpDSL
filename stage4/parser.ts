import { CstNode, CstParser, IOrAlt, ParserMethod, TokenType } from "chevrotain";
import {TOKENS, ALL_TOKENS} from "./lexer";
import { AstGenParser } from "../core/Utils/AstGenParser";
import * as AST from "../core/types";
import * as ERR from "../core/error";
import { Context } from "../core/Utils/Context";
import { CONFIG, getTokenStream } from "../core";

//Parse int but allows Infinity and NaN
function parseInt(text : string) : number {
    if(text === "Infinity") return Infinity
    if(text === "-Infinity") return -Infinity
    return Number.parseInt(text)
}

function tryBindBackReference(unbindBackref : AST.Backreference): AST.BackreferenceBounded {
    const target = Context.cachedTargets.reverse()
        .find(t => unbindBackref.accept(t))
    if(!target) throw Context.error( new ERR.CannotBindBackreferenceError(unbindBackref.raw) );
    return new AST.BackreferenceBounded(unbindBackref, target);
}

function tryBindVarRef(
    name : string, 
    oldTarget: AST.ExpectedTarget,
    effect : AST.EffectDeclare
){
    const variable = effect.getVariable(name)
    if(!variable) throw Context.error( new ERR.UnknownVariableError(name, Object.keys(effect.variables)));
    return new AST.VarReference(oldTarget, name)
}

class Parser extends AstGenParser {
    private boundedTarget?: AST.ExpectedTarget = undefined;
    private boundedEffect?: AST.EffectDeclare = undefined; 

    constructor(){
        super(ALL_TOKENS, { nodeLocationTracking: 'onlyOffset' })
        this.performSelfAnalysis()
    }

    bindTarget(
        target: AST.ExpectedTarget,
        effect : AST.EffectDeclare<any>
    ) {
        this.boundedTarget = target
        this.boundedEffect = effect
    }

    override get isBounded(): boolean {
        return this.boundedTarget !== undefined && this.boundedEffect !== undefined
    }

    //helpers
    operator = this.RULE("operator", () => {
        let modifier: AST.AmountModifier
        this.OR([
            {ALT: () => {
                this.CONSUME(TOKENS.op_less_than_or_equal)
                this.ACTION(() => { modifier = AST.AmountModifier.LEQ })
            }},
            {ALT: () => {
                this.CONSUME(TOKENS.op_greater_than_or_equal)
                this.ACTION(() => { modifier = AST.AmountModifier.GEQ })
            }},
            {ALT: () => {
                this.CONSUME(TOKENS.op_greater_than)
                this.ACTION(() => { modifier = AST.AmountModifier.MORE })
            }},
            {ALT: () => {
                this.CONSUME(TOKENS.op_less_than)
                this.ACTION(() => { modifier = AST.AmountModifier.LESS })
            }},
            {ALT: () => {
                this.CONSUME(TOKENS.op_not_equal_to)
                this.ACTION(() => { modifier = AST.AmountModifier.NEQ })
            }},
            {ALT: () => {
                this.CONSUME(TOKENS.op_equal_to)
                this.ACTION(() => { modifier = AST.AmountModifier.EQ })
            }},
        ])
        return this.ACTION(() => modifier!)
    })

    amount_spec_no_op = this.RULE("amount_spec_no_op", () => {
        let result: AST.INT_LIT | AST.VarReference | "all" | undefined
        this.OR([
            {ALT: () => {
                const S = this.SUBRULE(this.expect_number_simple)
                this.ACTION(() => { result = S })
            }},
            {ALT: () => {
                this.CONSUME(TOKENS.keyword_all)
                this.ACTION(() => { result = "all" })
            }},
        ])
        return this.ACTION(() => result!)
    })

    amount_spec = this.RULE("amount_spec", () => {
        let modifier: AST.AmountModifier = AST.AmountModifier.EQ

        this.OPTION(() => {
            const op = this.SUBRULE(this.operator)
            this.ACTION(() => { modifier = op })
        })

        const amount = this.SUBRULE(this.amount_spec_no_op)

        return this.ACTION(() => new AST.AmountSpec(amount, modifier))
    })

    //first, second, third, <INT><ORDER_MARKER>
    ordering_spec = this.RULE("ordering_spec", () => {
        let order : number = NaN
        this.OR([
            {ALT: () => {
                const ord = this.CONSUME(TOKENS.FIRST_LITERAL)
                this.ACTION(() => { order = 1 })
            }},
            {ALT: () => {
                const ord = this.CONSUME(TOKENS.SECOND_LITERAL)
                this.ACTION(() => { order = 2 })
            }},
            {ALT: () => {
                const ord = this.CONSUME(TOKENS.THIRD_LITERAL)
                this.ACTION(() => { order = 3 })
            }},
            {ALT: () => {
                const num = this.CONSUME(TOKENS.INT_LITERAL)
                this.CONSUME(TOKENS.ORDER_MARKER_LITERAL)
                this.ACTION(() => { order = parseInt(num.image) })
            }}
        ])
        return this.ACTION(() => new AST.OrderSpec(order!))
    })

    direction_spec = this.RULE("direction_spec", () => {
        this.CONSUME(TOKENS.SYMBOL_LSB)
        const directions: AST.Direction[] = []
        this.MANY_SEP({
            DEF : () => {
                const dir = this.CONSUME(TOKENS.keyword_direction_name)
                this.ACTION(() => {
                    switch(dir.image) {
                        case "up": directions.push(AST.Direction.up); break;
                        case "down": directions.push(AST.Direction.down); break;
                        case "left": directions.push(AST.Direction.left); break;
                        case "right": directions.push(AST.Direction.right); break;
                        default: throw Context.error( new Error("Unknown direction") )
                    }
                })
            },
            SEP : TOKENS.SYMBOL_CM
        })
        this.CONSUME(TOKENS.SYMBOL_RSB)
        
        return this.ACTION(() => new AST.DirectionSpec(directions))
    })

    row_or_col_spec = this.RULE("row_or_col_spec", () => {
        let flag : AST.RowFlag | AST.ColFlag | undefined
        let isRow = false
        this.OR([
            //literal
            {ALT: () => {
                this.OR1([
                    {ALT: () => {
                        this.CONSUME(TOKENS.keyword_row)
                        this.ACTION(() => { isRow = true })
                    }},
                    {ALT: () => {
                        this.CONSUME(TOKENS.keyword_col)
                        this.ACTION(() => { isRow = false })
                    }},
                ])

                const ammt = this.SUBRULE(this.amount_spec_no_op)
                if(ammt === "all"){
                    throw Context.error( new Error("Cannot specify 'all' in row_spec") )
                }
                this.ACTION(() => { flag = isRow ? new AST.RowFlag(new AST.AmountSpec(ammt)) : new AST.ColFlag(new AST.AmountSpec(ammt)) })
            }},
            //property of card (style 1 : row of card)
            {ALT: () => {
                this.OR2([
                    {ALT: () => {
                        this.CONSUME1(TOKENS.keyword_row)
                        this.ACTION(() => { isRow = true })
                    }},
                    {ALT: () => {
                        this.CONSUME1(TOKENS.keyword_col)
                        this.ACTION(() => { isRow = false })
                    }},
                ])
                this.CONSUME(TOKENS.prep_from)
                const card = this.SUBRULE(this.expect_card)
                this.ACTION(() => { flag = isRow ? new AST.RowFlag(undefined, card) : new AST.ColFlag(undefined, card) })
            }},
            //property of card (style 2 : card's row)
            {ALT: () => {
                const card = this.SUBRULE1(this.expect_card)
                this.CONSUME(TOKENS.OWNERSHIP_MARKER_LITERAL)
                this.OR3([
                    {ALT: () => {
                        this.CONSUME2(TOKENS.keyword_row)
                        this.ACTION(() => { isRow = true })
                    }},
                    {ALT: () => {
                        this.CONSUME2(TOKENS.keyword_col)
                        this.ACTION(() => { isRow = false })
                    }},
                ])
                this.ACTION(() => { flag = isRow ? new AST.RowFlag(undefined, card) : new AST.ColFlag(undefined, card) })
            }},
        ])
        return this.ACTION(() => flag!)
    })

    card_flag = this.RULE("card_flag", () => {
        // console.log("Inside card_flag, next tokens are: ", getTokenStream(this as any));
        let flag: AST.CardFlag | undefined
        this.OR([
            {ALT: () => {
                this.CONSUME(TOKENS.keyword_random)
                this.ACTION(() => { flag = new AST.RandomFlag() })
            }},
            {ALT: () => {
                const ext = this.CONSUME(TOKENS.IDEXTENSION)
                this.ACTION(() => { flag = new AST.ExtensionFlag(ext.image) })
            }},
            {ALT: () => {
                this.CONSUME(TOKENS.ANY_EXTENSION_LITERAL)
                this.ACTION(() => { flag = new AST.AnyExtensionFlag() })
            }},
            {ALT: () => {
                const rarity = this.CONSUME(TOKENS.keyword_card_rarity)
                this.ACTION(() => { flag = new AST.RarityFlag(rarity.image) })
            }},
            {ALT: () => {
                const id = this.CONSUME(TOKENS.ID)
                this.ACTION(() => { flag = new AST.ArchetypeFlag(id.image) })
            }},
            {ALT: () => {
                const stat = this.CONSUME(TOKENS.keyword_card_stat)
                const statValue = this.SUBRULE(this.amount_spec_no_op)
                this.ACTION(() => {
                    flag = new AST.PropertyValueFLag(stat.image, new AST.AmountSpec(statValue))
                })
            }},
            {ALT: () => {
                const playerName = this.CONSUME(TOKENS.keyword_player_name)
                const playerIndex = this.OPTION(() => this.CONSUME(TOKENS.INT_LITERAL))
                this.ACTION(() => {
                    flag = new AST.PlayerFlag(playerName.image, playerIndex ? parseInt(playerIndex.image) : undefined)
                })
            }}
        ])
        return this.ACTION(() => flag!)
    })

    effect_flag = this.RULE("effect_flag", () => {
        let flag: AST.EffectFlag | undefined
        this.OR([
            {ALT: () => {
                this.CONSUME(TOKENS.keyword_random)
                this.ACTION(() => { flag = new AST.RandomFlag() })
            }},
            {ALT: () => {
                const type = this.CONSUME(TOKENS.keyword_effect_type)
                this.ACTION(() => { flag = new AST.EffectTypeFlag(type.image) })
            }},
            {ALT: () => {
                const subtype = this.CONSUME(TOKENS.keyword_effect_subtype)
                this.ACTION(() => { flag = new AST.EffectSubtypeFlag(subtype.image) })
            }},
        ])
        return this.ACTION(() => flag!)
    })

    pos_flag = this.RULE("pos_flag", () => {
        let flag: AST.PosFlag | undefined
        this.OR([
            {ALT: () => {
                this.CONSUME(TOKENS.keyword_random)
                this.ACTION(() => { flag = new AST.RandomFlag() })
            }},
            {
                ALT: () => {
                    const flg = this.SUBRULE(this.row_or_col_spec)
                    this.ACTION(() => { flag = flg })
                },
                GATE : () => this.lookaheadUntilToken(TOKENS.keyword_row, TOKENS.keyword_col)
            },
        ])
        return this.ACTION(() => flag!)
    })

    zone_flag = this.RULE("zone_flag", () => {
        let flag: AST.ZoneFlag | undefined
        this.OR([
            {ALT: () => {
                this.CONSUME(TOKENS.keyword_random)
                this.ACTION(() => { flag = new AST.RandomFlag() })
            }},
            {ALT: () => {
                // console.log("Inside next -> zone flag, next tokens are: ", getTokenStream(this as any))
                const playerName = this.CONSUME(TOKENS.keyword_player_name)
                const playerIndex = this.OPTION(() => this.CONSUME(TOKENS.INT_LITERAL))
                this.ACTION(() => {
                    flag = new AST.PlayerFlag(playerName.image, playerIndex ? parseInt(playerIndex.image) : undefined)
                })
            }}
        ])
        return this.ACTION(() => flag!)
    })

    //main targets
    card_spec = this.RULE("card_spec", () => {
        // console.log("Inside card spec, next tokens are: ", getTokenStream(this as any))
        let flags: AST.CardFlag[] = []
        let amount: AST.AmountSpec | undefined
        let fromClause: AST.ZoneTarget | AST.PosTarget | AST.Backreference | undefined
        const withClauses: AST.CardWithClause[] = []

        this.OPTION1(() => {
            this.OR([
                //amount
                {ALT : () => {
                    const amt = this.SUBRULE(this.amount_spec)
                    this.ACTION(() => { amount = amt })
                }},
                //order
                {
                    ALT : () => {
                        const ord = this.SUBRULE(this.ordering_spec)
                        this.ACTION(() => { amount = ord })
                    },
                    GATE: this.BACKTRACK(this.ordering_spec)
                }
            ])
        })

        // console.log("Inside card spec, after amount, next tokens are: ", getTokenStream(this as any))


        this.MANY1(() => {
            const flg = this.SUBRULE(this.card_flag)
            this.ACTION(() => {
                if(flg instanceof AST.AnyExtensionFlag){
                    flags = flags.filter(f => !(f instanceof AST.ExtensionFlag))
                }
                flags.push(flg)
            })
        })

        // console.log("Inside card spec, after flags, next tokens are: ", getTokenStream(this as any))

        this.CONSUME(TOKENS.keyword_card)

        //from clause
        this.OPTION2(() => {
            this.CONSUME(TOKENS.prep_from)
            const from = this.SUBRULE(this.expect_pos_or_zone)
            // console.log("Inside card spec, inside from clause, next tokens are: ", getTokenStream(this as any))
            this.ACTION(() => { fromClause = from })
        })

        // console.log("Inside card spec, after pos or zone, next tokens are: ", getTokenStream(this as any))

        //with clause (many)
        this.MANY2(() => {
            this.CONSUME(TOKENS.prep_with)
            this.OR1([
                {
                    ALT: () => {
                        const eff = this.SUBRULE(this.expect_effect)
                        this.ACTION(() => { 
                            withClauses.push({ effect: eff })
                        })
                    },
                    GATE : () => this.lookaheadUntilToken(TOKENS.keyword_effect)
                },
                {
                    ALT: () => {
                        const operator = this.OPTION3(() => this.SUBRULE(this.operator))
                        const statNumber = this.OPTION4(() => this.SUBRULE(this.amount_spec_no_op))

                        let statValue: AST.AmountSpec | undefined
                        this.ACTION(() => {
                            if(statNumber){
                                statValue = new AST.AmountSpec(statNumber, operator)
                            }
                        })

                        const statName = this.CONSUME(TOKENS.keyword_card_stat).image

                        let compare_to = undefined as AST.CardTarget | AST.Backreference | undefined

                        this.OPTION5(() => {
                            this.CONSUME(TOKENS.prep_as)
                            compare_to = this.SUBRULE(this.expect_card) //card to compare to
                        })

                        this.ACTION(() => {
                            withClauses.push({ stat: { statName: statName, operator, statValue, compare_to} })
                        })
                    },
                    GATE: () => this.lookaheadUntilToken(TOKENS.keyword_card_stat)
                },
                {
                    ALT: () => {
                        const operator = this.SUBRULE1(this.operator)
                        this.ACTION(() => {
                            if(operator !== AST.AmountModifier.EQ && operator !== AST.AmountModifier.NEQ){
                                throw Context.error( new ERR.CanmotUseThisOperatorError(AST.AmountModifier[operator], ["EQ", "NEQ"]) )
                            }
                        })

                        const stat = this.CONSUME(TOKENS.keyword_card_non_number_property).image
                        this.CONSUME1(TOKENS.prep_as)
                        const target = this.SUBRULE1(this.expect_card)
                        this.ACTION(() => {
                            withClauses.push({ property: { propertyName: stat, operator : operator as any, compare_to: target } })
                        })
                    },
                }
            ])
        })

        //from clause, aternate position
        this.OPTION9(() => {
            this.CONSUME1(TOKENS.prep_from)
            const from = this.SUBRULE1(this.expect_pos_or_zone)
            // console.log("Inside card spec, inside from clause, next tokens are: ", getTokenStream(this as any))
            this.ACTION(() => { 
                if(fromClause){
                    throw new ERR.DuplicatedFromClauseError(
                        fromClause.stringify().join("\n"),
                        from.stringify().join("\n"),
                        new AST.CardTarget(this.boundedTarget!, amount, flags, fromClause, withClauses).stringify().join("\n")
                    )
                }
                fromClause = from
            })
        })


        // console.log("Inside card spec, after with clauses, next tokens are: ", getTokenStream(this as any))

        return this.ACTION(() => new AST.CardTarget(this.boundedTarget!, amount, flags, fromClause, withClauses))
    })

    effect_spec = this.RULE("effect_spec", () => {
        const flags: AST.EffectFlag[] = []
        let amount: AST.AmountSpec | undefined
        let fromClause: AST.CardTarget | AST.Backreference | undefined

        this.OPTION1(() => {
            this.OR([
                //amount
                {ALT : () => {
                    const amt = this.SUBRULE(this.amount_spec)
                    this.ACTION(() => { amount = amt })
                }},
                //order
                {
                    ALT : () => {
                        const ord = this.SUBRULE(this.ordering_spec)
                        this.ACTION(() => { amount = ord })
                    },
                    GATE: this.BACKTRACK(this.ordering_spec)
                }
            ])
        })

        this.MANY(() => {
            const flg = this.SUBRULE(this.effect_flag)
            this.ACTION(() => flags.push(flg))
        })

        this.CONSUME(TOKENS.keyword_effect)

        //from clause
        this.OPTION2(() => {
            this.CONSUME(TOKENS.prep_from)
            const from = this.SUBRULE(this.expect_card)
            this.ACTION(() => { fromClause = from })
        })

        return this.ACTION(() => new AST.EffectTarget(this.boundedTarget!, amount, flags, fromClause))
    })

    pos_spec = this.RULE("pos_spec", () => {
        let target: AST.PosTarget | undefined
        this.OR([
            {ALT: () => target = this.SUBRULE(this.pos_spec_literal), GATE: () => this.lookaheadUntilToken(TOKENS.keyword_pos)},
            {ALT: () => target = this.SUBRULE(this.pos_spec_row_or_col_only)}
        ])
        return this.ACTION(() => target!)
    })

    pos_spec_row_or_col_only = this.RULE("pos_spec_row_or_col_only", () => {
        const flag = this.SUBRULE(this.row_or_col_spec)
        return this.ACTION(() => new AST.PosTarget(
            this.boundedTarget!, 
            new AST.AmountSpec(new AST.INT_LIT({raw : "1"} as any, 1)),
            [flag], 
            new AST.ZoneTarget(this.boundedTarget!, [new AST.PlayerFlag("player")], "field"),
        ))
    })

    pos_spec_literal = this.RULE("pos_spec_literal", () => {
        // console.log("Inside pos spec, next tokens are: ", getTokenStream(this as any))
        const flags: AST.PosFlag[] = []
        let amount: AST.AmountSpec | undefined
        let fromClause: AST.ZoneTarget | AST.Backreference | undefined
        let directionClause: AST.DirectionSpec[] | undefined
        let distanceClause: AST.PositionDistanceClause | undefined
        const withClauses: (AST.CardTarget | AST.Backreference)[] = []

        this.OPTION1(() => {
            this.OR([
                //amount
                {ALT : () => {
                    const amt = this.SUBRULE(this.amount_spec)
                    this.ACTION(() => { amount = amt })
                }},
                //order
                {
                    ALT : () => {
                        const ord = this.SUBRULE(this.ordering_spec)
                        this.ACTION(() => { amount = ord })
                    },
                    GATE: this.BACKTRACK(this.ordering_spec)
                }
            ])
        })

        this.MANY1(() => {
            const flg = this.SUBRULE(this.pos_flag)
            this.ACTION(() => flags.push(flg))
        })

        this.CONSUME(TOKENS.keyword_pos)

        //from clause
        this.OPTION2(() => {
            this.CONSUME1(TOKENS.prep_from)
            this.OR1([
                {
                    ALT: () => {
                        const from = this.SUBRULE(this.expect_zone)
                        this.ACTION(() => { fromClause = from })
                    },
                    GATE : () => this.lookaheadUntilToken(TOKENS.keyword_zone_name)
                },
                //from row/col spec (literal)
                {ALT: () => {
                    const flg = this.SUBRULE(this.row_or_col_spec)
                    this.ACTION(() => { flags.push(flg) })
                }},
            ])
        })

        //in direction clause
        this.OPTION3(() => {
            this.CONSUME(TOKENS.prep_from)
            this.CONSUME(TOKENS.keyword_direction)
            this.CONSUME2(TOKENS.prep_from)
            const dirs: AST.DirectionSpec[] = []
            this.MANY_SEP({
                DEF : () => {
                    const dir = this.SUBRULE(this.direction_spec)
                    this.ACTION(() => dirs.push(dir))
                },
                SEP : TOKENS.SYMBOL_CM
            })
            this.ACTION(() => { directionClause = dirs })
        })

        //within distance clause
        this.OPTION4(() => {
            this.CONSUME(TOKENS.prep_within)
            this.CONSUME(TOKENS.keyword_distance)
            const dist = this.SUBRULE2(this.amount_spec)
            this.CONSUME3(TOKENS.prep_from)
            const card = this.SUBRULE1(this.expect_card)
            this.ACTION(() => { 
                distanceClause = { distance: dist, from: card }
            })
        })

        //with clause (many)
        this.MANY2(() => {
            this.CONSUME(TOKENS.prep_with)
            const card = this.SUBRULE2(this.expect_card)
            this.ACTION(() => withClauses.push(card))
        })

        return this.ACTION(() => new AST.PosTarget(this.boundedTarget!, amount, flags, fromClause, directionClause, distanceClause, withClauses))
    })

    zone_spec = this.RULE("zone_spec", () => {
        // console.log("Inside zone spec, next tokens are: ", getTokenStream(this as any))
        const flags: AST.ZoneFlag[] = []

        this.MANY(() => {
            const flg = this.SUBRULE(this.zone_flag)
            this.ACTION(() => flags.push(flg))
        })

        // console.log("Inside zone spec, after flags, next tokens are: ", getTokenStream(this as any))

        const zoneName = this.CONSUME(TOKENS.keyword_zone_name)

        return this.ACTION(() => {
            // console.log("Creating zone target with name ", zoneName.image, " and flags ", flags)
            return new AST.ZoneTarget(this.boundedTarget!, flags, zoneName.image)
        })
    })

    // entry points (top level rules)

    //this is just utils method
    // if one need to modify pos and/or zone target
    // modify expect_pos and expect_zone instead of this
    expect_pos_or_zone = this.RULE("expect_pos_or_zone", () => {
        let result: AST.ZoneTarget | AST.PosTarget | AST.BackreferenceBounded | undefined
        // console.log("Inside expect_pos_or_zone, next tokens are: ", getTokenStream(this as any))
        
        this.OR([
            //backref with optional shape spec (pos or zone)
            {
                ALT: () => {
                    // console.log("Inside expect_pos_or_zone -> backref, next tokens are: ", getTokenStream(this as any))
                    this.beginRecordTokens()
                    this.CONSUME2(TOKENS.keyword_back_refrence)
                    let ref: AST.Backreference | undefined
                    this.OPTION(() => {
                        this.OR1([
                            {
                                ALT : () => {
                                    // console.log("Inside expect_pos_or_zone -> backref -> pos, next tokens are: ", getTokenStream(this as any))
                                    const pos = this.SUBRULE(this.expect_pos)
                                    this.ACTION(() => { ref = new AST.Backreference(this.endRecordTokens().raw, pos) })
                                },
                                GATE : () => this.lookaheadUntilToken(TOKENS.keyword_pos)
                            },
                            {
                                ALT : () => {
                                    // console.log("Inside expect_pos_or_zone -> backref -> zone, next tokens are: ", getTokenStream(this as any))
                                    const zone = this.SUBRULE(this.expect_zone)
                                    this.ACTION(() => { ref = new AST.Backreference(this.endRecordTokens().raw, zone) })
                                },
                                GATE : () => this.lookaheadUntilToken(TOKENS.keyword_zone_name)
                            }
                        ])
                    })
                    this.ACTION(() => {
                        if (!ref) {
                            const info = this.endRecordTokens()
                            ref = new AST.AnyBackreference(info.raw)
                        }
                        result = tryBindBackReference(ref)
                    })
                },
                GATE : () => this.LA(1).tokenType.tokenTypeIdx === TOKENS.keyword_back_refrence.tokenTypeIdx
            },
            //explicit new target spec
            
            {
                ALT : () => {
                    // console.log("Inside expect_pos_or_zone -> pos, next tokens are: ", getTokenStream(this as any))
                    const pos = this.SUBRULE1(this.expect_pos)
                    this.ACTION(() => { result = pos })
                },
                GATE : () => this.lookaheadUntilToken(TOKENS.keyword_pos)
            },
            {
                ALT : () => {
                    // console.log("Inside expect_pos_or_zone -> zone, next tokens are: ", getTokenStream(this as any))
                    const zone = this.SUBRULE1(this.expect_zone)
                    this.ACTION(() => { result = zone })
                },
                GATE : () => this.lookaheadUntilToken(TOKENS.keyword_zone_name)
            }
            
        ])
        return this.ACTION(() => {
            if(result === undefined){
                // console.log("No paths picked somehow?")
            }
            return result!
        })
    })

    expect_card = this.RULE("expect_card", () => {
        // console.log("Inside expect_card, next tokens are: ", getTokenStream(this as any))
        let result: AST.CardTarget | AST.BackreferenceBounded | undefined
        this.OR([
            //this card
            {ALT: () => {
                this.CONSUME(TOKENS.keyword_this)
                this.CONSUME(TOKENS.keyword_card)
                this.ACTION(() => {
                    result = new AST.ThisCard(this.boundedTarget!)
                })
            }},
            //backref with optional shape spec (card)
            {ALT: () => {
                this.beginRecordTokens()
                this.CONSUME2(TOKENS.keyword_back_refrence)
                let ref: AST.Backreference | undefined
                this.OPTION(() => {
                    const spec = this.SUBRULE1(this.card_spec)
                    const info = this.endRecordTokens()
                    this.ACTION(() => { ref = new AST.Backreference(info.raw, spec) })
                })
                this.ACTION(() => {
                    if (!ref) {
                        const info = this.endRecordTokens()
                        ref = new AST.Backreference(info.raw, new AST.CardTarget(new AST.ExpectedTarget(this.boundedTarget!.raw, AST.TargetType.Card)))
                    }
                    result = tryBindBackReference(ref)
                })
            }},
            //explicit new target spec
            {ALT: () => {
                const spec = this.SUBRULE2(this.card_spec)
                this.ACTION(() => { result = spec })
            }}
        ])
        return this.ACTION(() => result!)
    })

    expect_effect = this.RULE("expect_effect", () => {
        let result: AST.EffectTarget | AST.BackreferenceBounded | undefined
        this.OR([
            //effect of card (style 2, style 1 is just effect_spec with from clause)
            {
                ALT: () => {
                    const from_clause = this.SUBRULE(this.expect_card)
                    this.CONSUME(TOKENS.OWNERSHIP_MARKER_LITERAL)
                    
                    const flags: AST.EffectFlag[] = []
                    let amount: AST.AmountSpec | undefined

                    this.OPTION1(() => {
                        const amt = this.SUBRULE(this.amount_spec)
                        this.ACTION(() => { amount = amt })
                    })

                    this.MANY(() => {
                        const flg = this.SUBRULE(this.effect_flag)
                        this.ACTION(() => flags.push(flg))
                    })

                    this.CONSUME(TOKENS.keyword_effect)

                    this.ACTION(() => {
                        result = new AST.EffectTarget(this.boundedTarget!, amount, flags, from_clause)
                    })
                },
                GATE : () => this.lookaheadUntilToken(TOKENS.OWNERSHIP_MARKER_LITERAL)
            },
            //this effect
            {ALT: () => {
                this.CONSUME(TOKENS.keyword_this)
                this.CONSUME1(TOKENS.keyword_effect)
                this.ACTION(() => {
                    result = new AST.ThisEffect(this.boundedTarget!)
                })
            }},
            //backref with optional shape spec (effect)
            {ALT: () => {
                this.beginRecordTokens()
                this.CONSUME2(TOKENS.keyword_back_refrence)
                let ref: AST.Backreference | undefined
                this.OPTION(() => {
                    const spec = this.SUBRULE1(this.effect_spec)
                    const info = this.endRecordTokens()
                    this.ACTION(() => { ref = new AST.Backreference(info.raw, spec) })
                })
                this.ACTION(() => {
                    if (!ref) {
                        const info = this.endRecordTokens()
                        ref = new AST.Backreference(info.raw, new AST.EffectTarget(new AST.ExpectedTarget(this.boundedTarget!.raw, AST.TargetType.Effect)))
                    }
                    result = tryBindBackReference(ref)
                })
            }},
            //explicit new target spec
            {ALT: () => {
                const spec = this.SUBRULE2(this.effect_spec)
                this.ACTION(() => { result = spec })
            }}
        ])
        return this.ACTION(() => result!)
    })

    expect_pos = this.RULE("expect_pos", () => {
        let result: AST.PosTarget | AST.BackreferenceBounded | undefined
        this.OR([
            //pos of card (style 2, style 1 is just pos_spec with from clause)
            {
                ALT: () => {
                    const from_clause = this.SUBRULE(this.expect_card)
                    this.CONSUME(TOKENS.OWNERSHIP_MARKER_LITERAL)
                    this.CONSUME(TOKENS.keyword_pos)
                    this.ACTION(() => {
                        result = new AST.PosOfCard(this.boundedTarget!, from_clause)
                    })
                },
                GATE : () => this.lookaheadUntilToken(TOKENS.OWNERSHIP_MARKER_LITERAL)
            },
            //backref with optional shape spec (pos)
            {ALT: () => {
                this.beginRecordTokens()
                this.CONSUME2(TOKENS.keyword_back_refrence)
                let ref: AST.Backreference | undefined
                this.OPTION(() => {
                    const spec = this.SUBRULE1(this.pos_spec)
                    const info = this.endRecordTokens()
                    this.ACTION(() => { ref = new AST.Backreference(info.raw, spec) })
                })
                this.ACTION(() => {
                    if (!ref) {
                        const info = this.endRecordTokens()
                        ref = ref = new AST.Backreference(info.raw, new AST.PosTarget(new AST.ExpectedTarget(this.boundedTarget!.raw, AST.TargetType.Position)))
                    }
                    result = tryBindBackReference(ref)
                })
            },
                GATE : () => this.LA(1).tokenType.tokenTypeIdx === TOKENS.keyword_back_refrence.tokenTypeIdx
            },
            //explicit new target spec
            {ALT: () => {
                const spec = this.SUBRULE2(this.pos_spec)
                this.ACTION(() => { result = spec })
            }}
        ])
        return this.ACTION(() => result!)
    })

    expect_zone = this.RULE("expect_zone", () => {
        let result: AST.ZoneTarget | AST.BackreferenceBounded | undefined
        this.OR([
            //backref with optional shape spec (zone)
            {ALT: () => {
                this.beginRecordTokens()
                this.CONSUME2(TOKENS.keyword_back_refrence)
                let ref: AST.Backreference | undefined
                this.OPTION(() => {
                    const spec = this.SUBRULE1(this.zone_spec)
                    const info = this.endRecordTokens()
                    this.ACTION(() => { ref = new AST.Backreference(info.raw, spec) })
                })
                this.ACTION(() => {
                    if (!ref) {
                        const info = this.endRecordTokens()
                        ref = new AST.Backreference(info.raw, new AST.ZoneTarget(new AST.ExpectedTarget(this.boundedTarget!.raw, AST.TargetType.Zone)))
                    }
                    result = tryBindBackReference(ref)
                })
            }},
            //explicit new target spec
            {ALT: () => {
                const spec = this.SUBRULE2(this.zone_spec)
                this.ACTION(() => { result = spec })
            }}
        ])
        return this.ACTION(() => result!)
    })

    //int literals, var refs, and named number literals
    expect_number_simple = this.RULE("expect_number_simple", () => {
        let result: AST.INT_LIT | AST.VarReference | undefined
        this.OR([
            //int literal
            {ALT: () => {
                const tok = this.CONSUME(TOKENS.INT_LITERAL)
                this.ACTION(() => { result = new AST.INT_LIT(this.boundedTarget!, parseInt(tok.image)) })
            }},

            // named number literal
            //zero literal
            {ALT: () => {
                this.CONSUME(TOKENS.ZERO_LITERAL)
                this.ACTION(() => { result = new AST.INT_LIT(this.boundedTarget!, 0) })
            }},
            //one literal
            {ALT: () => {
                this.CONSUME(TOKENS.ONE_LITERAL)
                this.ACTION(() => { result = new AST.INT_LIT(this.boundedTarget!, 1) })
            }},
            //two literal
            {ALT: () => {
                this.CONSUME(TOKENS.TWO_LITERAL)
                this.ACTION(() => { result = new AST.INT_LIT(this.boundedTarget!, 2) })
            }},
            //three literal
            {ALT: () => {
                this.CONSUME(TOKENS.THREE_LITERAL)
                this.ACTION(() => { result = new AST.INT_LIT(this.boundedTarget!, 3) })
            }},
            //four literal
            {ALT: () => {
                this.CONSUME(TOKENS.FOUR_LITERAL)
                this.ACTION(() => { result = new AST.INT_LIT(this.boundedTarget!, 4) })
            }},
            //five literal
            {ALT: () => {
                this.CONSUME(TOKENS.FIVE_LITERAL)
                this.ACTION(() => { result = new AST.INT_LIT(this.boundedTarget!, 5) })
            }},
            //six literal
            {ALT: () => {
                this.CONSUME(TOKENS.SIX_LITERAL)
                this.ACTION(() => { result = new AST.INT_LIT(this.boundedTarget!, 6) })
            }},
            //seven literal
            {ALT: () => {
                this.CONSUME(TOKENS.SEVEN_LITERAL)
                this.ACTION(() => { result = new AST.INT_LIT(this.boundedTarget!, 7) })
            }},
            //eight literal
            {ALT: () => {
                this.CONSUME(TOKENS.EIGHT_LITERAL)
                this.ACTION(() => { result = new AST.INT_LIT(this.boundedTarget!, 8) })
            }},
            //nine literal
            {ALT: () => {
                this.CONSUME(TOKENS.NINE_LITERAL)
                this.ACTION(() => { result = new AST.INT_LIT(this.boundedTarget!, 9) })
            }},

            //runtime var reference
            {ALT: () => {
                const name = this.CONSUME(TOKENS.ID).image
                this.ACTION(() => { result = tryBindVarRef(name, this.boundedTarget!, this.boundedEffect!) })
            }},
            //internal var reference with {}
            {ALT: () => {
                this.CONSUME(TOKENS.SYMBOL_LCB)
                const tok = this.CONSUME1(TOKENS.ID)
                this.CONSUME(TOKENS.SYMBOL_RCB)
                this.ACTION(() => { result = tryBindVarRef(tok.image, this.boundedTarget!, this.boundedEffect!)})
            }},
        ])
        return this.ACTION(() => result!)
    })

    expect_number_extended = this.RULE("expect_number_extended", () => {
        let result: AST.INT_LIT | AST.VarReference | AST.CountOfTarget | AST.NumberPropertyOfTarget | undefined
        // console.log("Expecting number, next tokens are: ", getTokenStream(this as any))

        this.OR([
            {ALT: () => {
                const num = this.SUBRULE(this.expect_number_simple)
                this.ACTION(() => { result = num })
            }},

            //count targets
            {ALT: () => {
                // console.log("Inside count of")
                this.CONSUME(TOKENS.op_count_of)
                const countTarget = this.SUBRULE(this.expect_anything)
                this.ACTION(() => { 
                    result = new AST.CountOfTarget(this.boundedTarget!, countTarget) 
                })
            }},

            //property access card, style 1
            {ALT: () => {
                const propertyName = this.CONSUME(TOKENS.keyword_card_stat)
                this.CONSUME(TOKENS.prep_from)
                const propTarget = this.SUBRULE1(this.expect_card)
                this.ACTION(() => { 
                    result = new AST.NumberPropertyOfTarget(
                        this.boundedTarget!, 
                        propertyName.image, 
                        propTarget
                    )
                })
            }},

            //property access card, style 2
            {
                ALT: () => {
                    const propTarget = this.SUBRULE2(this.expect_card)
                    this.CONSUME(TOKENS.OWNERSHIP_MARKER_LITERAL)
                    const propertyName = this.CONSUME2(TOKENS.keyword_card_stat)
                    this.ACTION(() => {
                        result = new AST.NumberPropertyOfTarget(
                            this.boundedTarget!, 
                            propertyName.image, 
                            propTarget
                        )
                    })
                },
                GATE : () => this.lookaheadUntilToken(TOKENS.OWNERSHIP_MARKER_LITERAL)
            },

            //property access player, style 1 
            {ALT: () => {
                const propertyName = this.CONSUME(TOKENS.keyword_heart)
                this.CONSUME1(TOKENS.prep_from)
                const propTarget = this.SUBRULE1(this.expect_player)
                this.ACTION(() => { 
                    result = new AST.NumberPropertyOfTarget(
                        this.boundedTarget!, 
                        propertyName.image, 
                        propTarget
                    )
                })
            }},

            //property access player, style 2
            {
                ALT: () => {
                    const propTarget = this.SUBRULE2(this.expect_player)
                    this.CONSUME1(TOKENS.OWNERSHIP_MARKER_LITERAL)
                    const propertyName = this.CONSUME2(TOKENS.keyword_heart)
                    this.ACTION(() => {
                        result = new AST.NumberPropertyOfTarget(
                            this.boundedTarget!, 
                            propertyName.image, 
                            propTarget
                        )
                    })
                },
                GATE : () => this.lookaheadUntilToken(TOKENS.OWNERSHIP_MARKER_LITERAL) && this.lookaheadUntilToken(TOKENS.keyword_heart)
            },
        ])
        return this.ACTION(() => new AST.NumberTarget(this.boundedTarget!, result!))
    })

    expect_player = this.RULE("expect_player", () => {
        let result: AST.PlayerTarget | undefined
        this.OR([
            {ALT: () => {
                const playerName = this.CONSUME(TOKENS.keyword_player_name)
                const playerIndex = this.OPTION(() => this.CONSUME(TOKENS.INT_LITERAL))
                
                this.ACTION(() => 
                    result = new AST.PlayerTarget(
                        this.boundedTarget!, 
                        playerName.image, 
                        playerIndex ? parseInt(playerIndex.image) : undefined
                    )
                )
            }},
            {ALT: () => {
                this.CONSUME(TOKENS.keyword_this)
                this.CONSUME1(TOKENS.keyword_player_name)

                this.ACTION(() => {
                    result = new AST.ThisPlayer(this.boundedTarget!)
                })
            }}
        ])
        return this.ACTION(() => result!)
    })

    private lookaheadUntilToken(...token : TokenType[]){
        let i = 1
        let nextToken = this.LA(i)
        while(nextToken.tokenType.name !== "EOF"){
            if(token.some(t => t.tokenTypeIdx === nextToken.tokenType.tokenTypeIdx)){
                return true
            }
            i++
            nextToken = this.LA(i)
        }
        return false
    }

    private firstTokenOutOfEquals(
        arr : TokenType[],
        check: TokenType
    ){
        let i = 1
        let nextToken = this.LA(i)
        while(nextToken.tokenType.name !== "EOF"){
            const T = arr.find(t => t.tokenTypeIdx === nextToken.tokenType.tokenTypeIdx)
            if(T){
                return T.tokenTypeIdx === check.tokenTypeIdx
            }
            i++
            nextToken = this.LA(i)
        }
        return false
    }

    private anyobj_or = ([
        [TOKENS.keyword_card, this.expect_card],
        [TOKENS.keyword_effect, this.expect_effect],
        [TOKENS.keyword_pos, this.expect_pos],
        [TOKENS.keyword_zone_name, this.expect_zone],
    ] as const)

    expect_anything = this.RULE("expect_anything", () => {
        let result: AST.CardTarget | AST.EffectTarget | AST.PosTarget | AST.ZoneTarget | AST.BackreferenceBounded | undefined
        // console.log("Inside ecpect_anything, next tokens are: ", getTokenStream(this as any))
        
        const lookaheadTokens = this.anyobj_or.map(t => t[0])
        const OR_OPTIONS = (startIdx : number) => {
            return this.anyobj_or.map((t, idx) => (
                {
                    ALT : () => {
                        const res = this.subrule(startIdx + idx, t[1] as ParserMethod<any, any>)
                        this.ACTION(() => { result = res })
                    },
                    GATE : () => this.firstTokenOutOfEquals(lookaheadTokens, t[0])
                }
            ))
        }
        
        this.OR([
            //backref with optional shape spec (card or effect or pos or zone)
            {
                ALT: () => {
                    this.beginRecordTokens()
                    // console.log("Inside backreference, next tokens are: ", getTokenStream(this as any))
                    this.CONSUME2(TOKENS.keyword_back_refrence)
                    let ref: AST.Backreference | undefined
                    this.OPTION(() => {
                        this.OR1(OR_OPTIONS(0))
                    })
                    this.ACTION(() => {
                        if (!ref) {
                            const info = this.endRecordTokens()
                            ref = new AST.AnyBackreference(info.raw)
                        }
                        result = tryBindBackReference(ref)
                    })
                },
                GATE : () => this.LA(1).tokenType.tokenTypeIdx === TOKENS.keyword_back_refrence.tokenTypeIdx
            },
            //explicit new target spec
            ...OR_OPTIONS(1)
        ])
        
        return this.ACTION(() => result!)
    })
}

export const parser = new Parser()
export const visitor = parser.getBaseCstVisitorConstructor()