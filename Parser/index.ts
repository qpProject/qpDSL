import { CstParser, MismatchedTokenException, TokenType } from "chevrotain";
import { TOKENS, ALL_TOKENS } from "../Lexer";
import { IDClassifier } from "./IDClassifier";


class qpRemakeParser extends CstParser {
    constructor(){
        super(ALL_TOKENS)

        this.performSelfAnalysis()
    }

    // ===== TOP LEVEL SYNTAX =====

    program = this.RULE("program", () => {
        this.MANY(() => {
            this.SUBRULE(this.effect_decl)
        })
    })

    effect_decl = this.RULE("effect_decl", () => {
        this.SUBRULE(this.effect_id)
        this.CONSUME(TOKENS.SYMBOL_DOT)
        this.SUBRULE(this.effect_meta_data)
        this.CONSUME(TOKENS.SYMBOL_COLON)
        this.SUBRULE(this.effect_segments)
        this.OPTION(() => {
            this.CONSUME2(TOKENS.SYMBOL_DOT)
        })
    })

    effect_segments = this.RULE("effect_segments", () => {
        this.OPTION(() => {
            this.SUBRULE(this.target_stmt_list)
            this.CONSUME(TOKENS.SYMBOL_DOT)
        })
        this.SUBRULE(this.action_stmt_list)
    })

    target_stmt_list = this.RULE("target_stmt_list", () => {
        this.SUBRULE(this.target_stmt_with_cond)
        this.MANY(() => {
            this.CONSUME(TOKENS.SYMBOL_DOT)
            this.SUBRULE2(this.target_stmt_with_cond)
        })
    })

    target_stmt_with_cond = this.RULE("target_stmt_with_cond", () => {
        this.OPTION(() => {
            this.SUBRULE(this.condition_stmt)
        })
        this.SUBRULE(this.target_stmt)
        this.OPTION2(() => {
            this.SUBRULE2(this.condition_stmt)
        })
    })

    action_stmt_list = this.RULE("action_stmt_list", () => {
        this.SUBRULE(this.action_stmt_with_cond)
        this.MANY(() => {
            this.CONSUME(TOKENS.SYMBOL_DOT)
            this.SUBRULE2(this.action_stmt_with_cond)
        })
    })

    action_stmt_with_cond = this.RULE("action_stmt_with_cond", () => {
        this.OPTION(() => {
            this.SUBRULE(this.condition_stmt)
        })
        this.SUBRULE(this.action_stmt)
        this.OPTION2(() => {
            this.SUBRULE2(this.condition_stmt)
        })
    })

    effect_id = this.RULE("effect_id", () => {
        this.CONSUME(TOKENS.ID)
        this.MANY(() => {
            this.CONSUME(TOKENS.SYMBOL_UNDER_SCORE)
            this.OR([
                { ALT: () => this.CONSUME2(TOKENS.ID) },
                { ALT: () => this.CONSUME(TOKENS.INT_LITERAL) }
            ])
        })
    })

    effect_meta_data = this.RULE("effect_meta_data", () => {
        this.SUBRULE(this.type_or_subtype_list)
        this.OPTION(() => {
            this.CONSUME(TOKENS.SYMBOL_DOT)
            this.SUBRULE(this.internal_var_dec_list)
        })
    })

    type_or_subtype_list = this.RULE("type_or_subtype_list", () => {
        this.CONSUME(TOKENS.ID)
        this.MANY(() => {
            this.CONSUME(TOKENS.SYMBOL_DOT)
            this.CONSUME2(TOKENS.ID)
        })
    })

    internal_var_dec_list = this.RULE("internal_var_dec_list", () => {
        this.SUBRULE(this.internal_var_decl)
        this.MANY(() => {
            this.CONSUME(TOKENS.SYMBOL_COMMA)
            this.SUBRULE2(this.internal_var_decl)
        })
    })

    internal_var_decl = this.RULE("internal_var_decl", () => {
        this.CONSUME(TOKENS.ID)
        this.CONSUME(TOKENS.SYMBOL_EQ)
        this.CONSUME(TOKENS.INT_LITERAL)
        this.OPTION(() => {
            this.CONSUME(TOKENS.SYMBOL_ARROW)
            this.CONSUME2(TOKENS.INT_LITERAL)
        })
    })

    // ===== GLOBAL RULES =====

    id_list = this.RULE("id_list", () => {
        this.CONSUME(TOKENS.ID)
        this.MANY(() => {
            this.CONSUME(TOKENS.SYMBOL_COMMA)
            this.CONSUME2(TOKENS.ID)
        })
    })

    op_compare = this.RULE("op_compare", () => {
        this.OR([
            { ALT: () => this.CONSUME(TOKENS.op_equal_to) },
            { ALT: () => this.CONSUME(TOKENS.op_not_equal_to) },
            { ALT: () => this.CONSUME(TOKENS.op_less_than_or_equal) },
            { ALT: () => this.CONSUME(TOKENS.op_greater_than_or_equal) },
            { ALT: () => this.CONSUME(TOKENS.op_greater_than) },
            { ALT: () => this.CONSUME(TOKENS.op_less_than) }
        ])
    })

    internal_var_ref = this.RULE("internal_var_ref", () => {
        this.CONSUME(TOKENS.SYMBOL_LCB)
        this.CONSUME(TOKENS.ID)
        this.CONSUME(TOKENS.SYMBOL_RCB)
    })

    amount_spec = this.RULE("amount_spec", () => {
        this.OPTION(() => {
            this.SUBRULE(this.op_compare)
        })
        this.SUBRULE(this.amount_spec_no_op)
    })

    amount_spec_no_op = this.RULE("amount_spec_no_op", () => {
        this.OR([
            { ALT: () => this.CONSUME(TOKENS.INT_LITERAL) },
            { ALT: () => this.SUBRULE(this.internal_var_ref) }
        ])
    })

    amount_spec_with_all = this.RULE("amount_spec_with_all", () => {
        this.OR([
            { ALT: () => this.CONSUME(TOKENS.keyword_all) },
            { ALT: () => this.SUBRULE(this.amount_spec) }
        ])
    })

    backref_any = this.RULE("backref_any", () => {
        this.CONSUME(TOKENS.keyword_back_reference)
    })

    backref_card = this.RULE("backref_card", () => {
        this.OR([
            { 
                ALT: () => {
                    this.CONSUME(TOKENS.keyword_back_reference)
                    this.CONSUME(TOKENS.keyword_card)
                }
            },
            { ALT: () => this.SUBRULE(this.backref_any) }
        ])
    })

    backref_effect = this.RULE("backref_effect", () => {
        this.OR([
            { 
                ALT: () => {
                    this.CONSUME(TOKENS.keyword_back_reference)
                    this.CONSUME(TOKENS.keyword_effect)
                }
            },
            { ALT: () => this.SUBRULE(this.backref_any) }
        ])
    })

    backref_zone = this.RULE("backref_zone", () => {
        this.OR([
            { 
                ALT: () => {
                    this.CONSUME(TOKENS.keyword_back_reference)
                    this.CONSUME(TOKENS.keyword_zone)
                }
            },
            { ALT: () => this.SUBRULE(this.backref_any) }
        ])
    })

    backref_pos = this.RULE("backref_pos", () => {
        this.OR([
            { 
                ALT: () => {
                    this.CONSUME(TOKENS.keyword_back_reference)
                    this.CONSUME(TOKENS.keyword_position)
                }
            },
            { ALT: () => this.SUBRULE(this.backref_any) }
        ])
    })

    from_word = this.RULE("from_word", () => {
        this.OR([
            { ALT: () => this.CONSUME(TOKENS.prep_from) },
            { ALT: () => this.CONSUME(TOKENS.prep_on) },
            { ALT: () => this.CONSUME(TOKENS.prep_in) },
            { ALT: () => this.CONSUME(TOKENS.prep_within) }
        ])
    })

    card_spec = this.RULE("card_spec", () => {
        this.OR([
            { ALT: () => this.CONSUME(TOKENS.keyword_this_card) },
            { ALT: () => this.SUBRULE(this.backref_card) },
            { ALT: () => this.SUBRULE(this.target_card_inline) }
        ])
    })

    effect_spec = this.RULE("effect_spec", () => {
        this.OR([
            { ALT: () => this.CONSUME(TOKENS.keyword_this_effect) },
            { ALT: () => this.SUBRULE(this.backref_effect) },
            { ALT: () => this.SUBRULE(this.target_effect_inline) }
        ])
    })

    pos_spec = this.RULE("pos_spec", () => {
        this.OR([
            { ALT: () => this.SUBRULE(this.backref_pos) },
            { ALT: () => this.SUBRULE(this.target_pos_inline) }
        ])
    })

    zone_spec = this.RULE("zone_spec", () => {
        this.OR([
            { ALT: () => this.SUBRULE(this.backref_zone) },
            { ALT: () => this.SUBRULE(this.target_zone_inline) }
        ])
    })

    num_spec = this.RULE("num_spec", () => {
        this.OR([
            { ALT: () => this.SUBRULE(this.amount_spec_no_op) },
            { ALT: () => this.SUBRULE(this.property_access) }
        ])
    })

    player_spec = this.RULE("player_spec", () => {
        this.OR([
            { 
                ALT: () => {
                    this.CONSUME(TOKENS.ID)
                    this.OPTION(() => {
                        this.CONSUME(TOKENS.INT_LITERAL)
                    })
                }
            },
            { ALT: () => this.CONSUME(TOKENS.keyword_this_player) }
        ])
    })

    property_access = this.RULE("property_access", () => {
        this.OR([
            { ALT: () => this.SUBRULE(this.property_access_card) },
            { ALT: () => this.SUBRULE(this.number_of_targets) }
        ])
    })

    property_access_card = this.RULE("property_access_card", () => {
        this.CONSUME(TOKENS.ID)
        this.CONSUME(TOKENS.prep_of)
        this.SUBRULE(this.card_spec)
    })

    number_of_targets = this.RULE("number_of_targets", () => {
        this.CONSUME(TOKENS.op_count)
        this.OR([
            { ALT: () => this.SUBRULE(this.card_spec) },
            { ALT: () => this.SUBRULE(this.effect_spec) },
            { ALT: () => this.SUBRULE(this.pos_spec) },
            { ALT: () => this.SUBRULE(this.zone_spec) }
        ])
    })

    is = this.RULE("is", () => {
        this.CONSUME(TOKENS.op_equal_to)
    })

    // ===== CONDITION STATEMENTS =====

    condition_stmt = this.RULE("condition_stmt", () => {
        this.OR([
            { ALT: () => this.SUBRULE(this.if_condition) },
            { ALT: () => this.SUBRULE(this.unless_condition) }
        ])
    })

    if_condition = this.RULE("if_condition", () => {
        this.OR([
            { ALT: () => this.CONSUME(TOKENS.keyword_if) },
            { ALT: () => this.CONSUME(TOKENS.keyword_before) },
            { ALT: () => this.CONSUME(TOKENS.keyword_after) },
            { ALT: () => this.CONSUME(TOKENS.prep_on) }
        ])
        this.SUBRULE(this.condition_phrase_list)
    })

    unless_condition = this.RULE("unless_condition", () => {
        this.CONSUME(TOKENS.keyword_unless)
        this.SUBRULE(this.condition_phrase_list)
    })

    condition_phrase_list = this.RULE("condition_phrase_list", () => {
        this.SUBRULE(this.condition_phrase)
        this.MANY(() => {
            this.OR([
                { ALT: () => this.CONSUME(TOKENS.op_and) },
                { ALT: () => this.CONSUME(TOKENS.op_or) }
            ])
            this.SUBRULE2(this.condition_phrase)
        })
    })

    condition_phrase = this.RULE("condition_phrase", () => {
        this.OR([
            { ALT: () => this.SUBRULE(this.generic_condition_phrase) },
            { ALT: () => this.SUBRULE(this.action_condition_phrase) }
        ])
        this.OPTION(() => {
            this.CONSUME(TOKENS.op_and)
            this.CONSUME(TOKENS.keyword_action)
            this.CONSUME(TOKENS.keyword_was)
            this.CONSUME(TOKENS.keyword_done)
            this.CONSUME(TOKENS.prep_by)
            this.OR([
                { ALT: () => this.SUBRULE(this.player_spec) },
                { ALT: () => this.SUBRULE(this.card_spec) },
                { ALT: () => this.SUBRULE(this.effect_spec) }
            ])
        })
    })

    generic_condition_phrase = this.RULE("generic_condition_phrase", () => {
        this.OR([
            { ALT: () => this.SUBRULE(this.generic_condition_phrase_check_exist_card) },
            { ALT: () => this.SUBRULE(this.generic_condition_phrase_check_exist_effect) },
            { ALT: () => this.SUBRULE(this.generic_condition_phrase_check_card_has_stat) },
            { ALT: () => this.SUBRULE(this.generic_condition_phrase_check_num_compare) }
        ])
    })

    generic_condition_phrase_check_exist_card = this.RULE("generic_condition_phrase_check_exist_card", () => {
        this.CONSUME(TOKENS.op_exist)
        this.SUBRULE(this.card_spec)
    })

    generic_condition_phrase_check_exist_effect = this.RULE("generic_condition_phrase_check_exist_effect", () => {
        this.CONSUME(TOKENS.op_exist)
        this.SUBRULE(this.effect_spec)
    })

    generic_condition_phrase_check_card_has_stat = this.RULE("generic_condition_phrase_check_card_has_stat", () => {
        this.SUBRULE(this.card_spec)
        this.CONSUME(TOKENS.op_has)
        this.SUBRULE(this.amount_spec)
        this.CONSUME(TOKENS.ID)
    })

    generic_condition_phrase_check_num_compare = this.RULE("generic_condition_phrase_check_num_compare", () => {
        this.SUBRULE(this.num_spec)
        this.SUBRULE(this.op_compare)
        this.SUBRULE2(this.num_spec)
    })

    // ===== TARGET STATEMENTS =====

    target_stmt = this.RULE("target_stmt", () => {
        this.OR([
            { ALT: () => this.SUBRULE(this.target_card_stmt) },
            { ALT: () => this.SUBRULE(this.target_effect_stmt) },
            { ALT: () => this.SUBRULE(this.target_pos_stmt) },
            { ALT: () => this.SUBRULE(this.target_zone_stmt) }
        ])
    })

    target_card_stmt = this.RULE("target_card_stmt", () => {
        this.CONSUME(TOKENS.keyword_target)
        this.SUBRULE(this.target_card_inline)
    })

    flags_spec_card = this.RULE("flags_spec_card", () => {
        this.MANY(() => {
            this.OR([
                { ALT: () => this.CONSUME(TOKENS.ID) },
                { ALT: () => {
                    this.CONSUME(TOKENS.SYMBOL_DOT)
                    this.CONSUME2(TOKENS.ID)
                }},
                { ALT: () => {
                    this.CONSUME3(TOKENS.ID)
                    this.SUBRULE(this.amount_spec)
                }},
                { ALT: () => {
                    this.OR([
                        { ALT: () => this.CONSUME(TOKENS.op_equal_to) },
                        { ALT: () => this.CONSUME(TOKENS.op_not_equal_to) }
                    ])
                    this.CONSUME4(TOKENS.ID)
                }}
            ])
        })
    })

    with_effect_spec = this.RULE("with_effect_spec", () => {
        this.CONSUME(TOKENS.prep_with)
        this.OR([
            { ALT: () => this.CONSUME(TOKENS.keyword_this_effect) },
            { ALT: () => this.SUBRULE(this.backref_effect) },
            { ALT: () => this.SUBRULE(this.target_effect_inline_no_from) }
        ])
    })

    target_card_inline = this.RULE("target_card_inline", () => {
        this.OPTION(() => {
            this.SUBRULE(this.amount_spec_with_all)
        })
        this.SUBRULE(this.flags_spec_card)
        this.CONSUME(TOKENS.keyword_card)
        this.SUBRULE(this.from_word)
        this.OR([
            { ALT: () => this.SUBRULE(this.backref_zone) },
            { ALT: () => this.SUBRULE(this.backref_pos) },
            { ALT: () => this.SUBRULE(this.zone_spec) },
            { ALT: () => this.SUBRULE(this.pos_spec) }
        ])
        this.OPTION2(() => {
            this.SUBRULE(this.with_effect_spec)
        })
    })

    target_effect_stmt = this.RULE("target_effect_stmt", () => {
        this.CONSUME(TOKENS.keyword_target)
        this.SUBRULE(this.target_effect_inline)
    })

    target_effect_inline = this.RULE("target_effect_inline", () => {
        this.OPTION(() => {
            this.OR([
                { ALT: () => this.CONSUME(TOKENS.keyword_first) },
                { ALT: () => this.CONSUME(TOKENS.keyword_second) },
                { ALT: () => this.CONSUME(TOKENS.keyword_third) },
                { ALT: () => this.SUBRULE(this.amount_spec_with_all) }
            ])
        })
        this.MANY(() => {
            this.CONSUME(TOKENS.ID)
        })
        this.CONSUME(TOKENS.keyword_effect)
        this.SUBRULE(this.from_word)
        this.SUBRULE(this.card_spec)
    })

    target_effect_inline_no_from = this.RULE("target_effect_inline_no_from", () => {
        this.OPTION(() => {
            this.OR([
                { ALT: () => this.CONSUME(TOKENS.keyword_first) },
                { ALT: () => this.CONSUME(TOKENS.keyword_second) },
                { ALT: () => this.CONSUME(TOKENS.keyword_third) },
                { ALT: () => this.SUBRULE(this.amount_spec_with_all) }
            ])
        })
        this.MANY(() => {
            this.CONSUME(TOKENS.ID)
        })
        this.CONSUME(TOKENS.keyword_effect)
    })

    target_pos_stmt = this.RULE("target_pos_stmt", () => {
        this.CONSUME(TOKENS.keyword_target)
        this.SUBRULE(this.target_pos_inline)
    })

    flags_spec_pos = this.RULE("flags_spec_pos", () => {
        this.MANY(() => {
            this.OR([
                { ALT: () => this.CONSUME(TOKENS.ID) },
                { ALT: () => {
                    this.OR([
                        { ALT: () => this.CONSUME(TOKENS.keyword_first) },
                        { ALT: () => this.CONSUME(TOKENS.keyword_second) }
                    ])
                    this.CONSUME2(TOKENS.ID)
                }},
                { ALT: () => {
                    this.CONSUME3(TOKENS.ID)
                    this.CONSUME(TOKENS.INT_LITERAL)
                }}
            ])
        })
    })

    target_pos_inline = this.RULE("target_pos_inline", () => {
        this.OR([
            { ALT: () => this.SUBRULE(this.target_pos_from_zone) },
            { ALT: () => this.SUBRULE(this.target_pos_with_directions) },
            { ALT: () => this.SUBRULE(this.target_pos_around_card) }
        ])
    })

    target_pos_from_zone = this.RULE("target_pos_from_zone", () => {
        this.OPTION(() => {
            this.SUBRULE(this.amount_spec_with_all)
        })
        this.SUBRULE(this.flags_spec_pos)
        this.CONSUME(TOKENS.keyword_position)
        this.SUBRULE(this.from_word)
        this.SUBRULE(this.zone_spec)
    })

    target_pos_with_directions = this.RULE("target_pos_with_directions", () => {
        this.CONSUME(TOKENS.keyword_all)
        this.SUBRULE(this.flags_spec_pos)
        this.CONSUME(TOKENS.keyword_position)
        this.OPTION(() => {
            this.CONSUME(TOKENS.prep_in)
            this.CONSUME(TOKENS.keyword_direction)
            this.CONSUME(TOKENS.prep_of)
            this.SUBRULE(this.direction_arr)
        })
        this.OPTION2(() => {
            this.CONSUME(TOKENS.prep_with)
            this.OPTION3(() => {
                this.CONSUME2(TOKENS.prep_in)
            })
            this.SUBRULE(this.amount_spec)
            this.CONSUME(TOKENS.keyword_distance)
            this.CONSUME(TOKENS.prep_away)
        })
        this.CONSUME(TOKENS.prep_from)
        this.SUBRULE(this.card_spec)
    })

    direction_arr = this.RULE("direction_arr", () => {
        this.SUBRULE(this.dir_elem)
        this.MANY(() => {
            this.CONSUME(TOKENS.SYMBOL_COMMA)
            this.SUBRULE2(this.dir_elem)
        })
    })

    dir_elem = this.RULE("dir_elem", () => {
        this.CONSUME(TOKENS.SYMBOL_LSB)
        this.CONSUME(TOKENS.ID) // specific direction, classify later
        this.MANY(() => {
            this.CONSUME(TOKENS.SYMBOL_COMMA)
            this.CONSUME2(TOKENS.ID)
        })
        this.CONSUME(TOKENS.SYMBOL_RSB)
    })

    target_pos_around_card = this.RULE("target_pos_around_card", () => {
        this.CONSUME(TOKENS.keyword_position)
        this.OPTION(() => {
            this.CONSUME(TOKENS.prep_to)
        })
        this.CONSUME(TOKENS.ID)
        this.CONSUME(TOKENS.prep_of)
        this.SUBRULE(this.card_spec)
    })

    target_zone_stmt = this.RULE("target_zone_stmt", () => {
        this.CONSUME(TOKENS.keyword_target)
        this.OPTION(() => {
            this.CONSUME(TOKENS.ID) // player_specifier
        })
        this.CONSUME(TOKENS.keyword_zone)
    })

    target_zone_inline = this.RULE("target_zone_inline", () => {
        this.OPTION(() => {
            this.CONSUME(TOKENS.ID) // player_specifier
        })
        this.CONSUME(TOKENS.keyword_zone)
    })

    // ===== ACTION STATEMENTS AND INTERCEPT =====

    // ===== ACTION CONDITION PHRASE SUBRULES =====
    
    action_condition_player_action = this.RULE("action_condition_player_action", () => {
        this.SUBRULE(this.player_spec)
        this.OPTION(() => { this.CONSUME(TOKENS.keyword_turn) })
        this.CONSUME(TOKENS.keyword_action)
    })

    action_condition_any_action = this.RULE("action_condition_any_action", () => {
        this.CONSUME(TOKENS.keyword_any)
        this.CONSUME1(TOKENS.keyword_action)
    })

    action_condition_turn_start = this.RULE("action_condition_turn_start", () => {
        this.CONSUME(TOKENS.keyword_turn)
        this.CONSUME1(TOKENS.keyword_start)
    })

    action_condition_turn_end = this.RULE("action_condition_turn_end", () => {
        this.CONSUME(TOKENS.keyword_turn)
        this.CONSUME1(TOKENS.keyword_end)
    })

    action_condition_destroy_is = this.RULE("action_condition_destroy_is", () => {
        this.SUBRULE(this.card_spec)
        this.SUBRULE1(this.is)
        this.CONSUME(TOKENS.keyword_destroy)
    })

    action_condition_void_is = this.RULE("action_condition_void_is", () => {
        this.SUBRULE(this.card_spec)
        this.SUBRULE1(this.is)
        this.CONSUME(TOKENS.keyword_void)
    })

    action_condition_execute_is = this.RULE("action_condition_execute_is", () => {
        this.SUBRULE(this.card_spec)
        this.SUBRULE1(this.is)
        this.CONSUME(TOKENS.keyword_execute)
    })

    action_condition_decompile_is = this.RULE("action_condition_decompile_is", () => {
        this.SUBRULE(this.card_spec)
        this.SUBRULE1(this.is)
        this.CONSUME(TOKENS.keyword_decompile)
    })

    action_condition_delay_is = this.RULE("action_condition_delay_is", () => {
        this.SUBRULE(this.card_spec)
        this.SUBRULE1(this.is)
        this.CONSUME(TOKENS.keyword_delay)
        this.OPTION(() => {
            this.CONSUME1(TOKENS.prep_by)
            this.SUBRULE2(this.num_spec)
            this.CONSUME2(TOKENS.keyword_turn)
        })
    })

    action_condition_take_damage = this.RULE("action_condition_take_damage", () => {
        this.SUBRULE(this.card_spec)
        this.CONSUME(TOKENS.keyword_take)
        this.OPTION(() => { this.SUBRULE1(this.num_spec) })
        this.OPTION1(() => { this.CONSUME1(TOKENS.ID) }) // DAMAGE_TYPE
        this.CONSUME2(TOKENS.keyword_damage)
    })

    action_condition_activate_effect = this.RULE("action_condition_activate_effect", () => {
        this.SUBRULE(this.effect_spec)
        this.SUBRULE1(this.is)
        this.CONSUME(TOKENS.keyword_activate)
    })

    action_condition_any_effect_activate = this.RULE("action_condition_any_effect_activate", () => {
        this.CONSUME(TOKENS.keyword_any)
        this.CONSUME1(TOKENS.keyword_effect)
        this.SUBRULE(this.is)
        this.CONSUME2(TOKENS.keyword_activate)
    })

    action_condition_move_is = this.RULE("action_condition_move_is", () => {
        this.SUBRULE(this.card_spec)
        this.SUBRULE1(this.is)
        this.CONSUME(TOKENS.keyword_move)
        this.OPTION(() => {
            this.CONSUME1(TOKENS.prep_to)
            this.OR([
                { ALT: () => this.SUBRULE2(this.zone_spec) },
                { ALT: () => this.SUBRULE3(this.pos_spec) }
            ])
        })
    })

    action_condition_remove_is = this.RULE("action_condition_remove_is", () => {
        this.SUBRULE(this.card_spec)
        this.SUBRULE1(this.is)
        this.CONSUME(TOKENS.keyword_remove)
        this.CONSUME1(TOKENS.prep_from)
        this.SUBRULE2(this.zone_spec)
    })

    action_condition_player_draw = this.RULE("action_condition_player_draw", () => {
        this.SUBRULE(this.player_spec)
        this.CONSUME(TOKENS.keyword_draw)
        this.OPTION(() => {
            this.SUBRULE1(this.num_spec)
            this.CONSUME1(TOKENS.keyword_card)
        })
    })

    action_condition_zone_shuffle = this.RULE("action_condition_zone_shuffle", () => {
        this.SUBRULE(this.zone_spec)
        this.OPTION(() => { this.SUBRULE1(this.is) })
        this.CONSUME(TOKENS.keyword_shuffle)
    })

    action_condition_receive_counter = this.RULE("action_condition_receive_counter", () => {
        this.SUBRULE(this.card_spec)
        this.CONSUME(TOKENS.keyword_receive)
        this.OPTION(() => {
            this.OR([
                { ALT: () => this.CONSUME1(TOKENS.ID) }, // OP_ADD
                { ALT: () => this.CONSUME2(TOKENS.ID) }  // OP_SUB
            ])
        })
        this.SUBRULE1(this.num_spec)
        this.CONSUME3(TOKENS.ID) // CARD_KEY
    })

    action_condition_override_stat = this.RULE("action_condition_override_stat", () => {
        this.CONSUME(TOKENS.ID) // CARD_KEY
        this.CONSUME1(TOKENS.prep_of)
        this.CONSUME2(TOKENS.ID) // CARD_KEY
        this.CONSUME3(TOKENS.keyword_override)
        this.CONSUME4(TOKENS.prep_to)
        this.SUBRULE(this.num_spec)
    })

    action_condition_stat_change = this.RULE("action_condition_stat_change", () => {
        this.CONSUME(TOKENS.keyword_stat)
        this.CONSUME1(TOKENS.prep_of)
        this.SUBRULE(this.card_spec)
        this.SUBRULE1(this.is)
        this.CONSUME2(TOKENS.keyword_change)
    })

    action_condition_receive_heal = this.RULE("action_condition_receive_heal", () => {
        this.SUBRULE(this.card_spec)
        this.CONSUME(TOKENS.keyword_receive)
        this.CONSUME1(TOKENS.keyword_heal)
        this.OPTION(() => {
            this.CONSUME2(TOKENS.prep_of)
            this.SUBRULE1(this.num_spec)
        })
    })

    action_condition_receive_effect = this.RULE("action_condition_receive_effect", () => {
        this.SUBRULE(this.card_spec)
        this.CONSUME(TOKENS.keyword_receive)
        this.CONSUME1(TOKENS.ID) // KEYWORD_NEW
        this.CONSUME2(TOKENS.keyword_effect)
    })

    action_condition_remove_effect = this.RULE("action_condition_remove_effect", () => {
        this.SUBRULE(this.effect_spec)
        this.SUBRULE1(this.is)
        this.CONSUME(TOKENS.keyword_remove)
    })

    action_condition_remove_counter = this.RULE("action_condition_remove_counter", () => {
        this.SUBRULE(this.num_spec)
        this.CONSUME(TOKENS.ID) // COUNTER_KEY
        this.SUBRULE1(this.is)
        this.CONSUME1(TOKENS.keyword_remove)
        this.CONSUME2(TOKENS.prep_from)
        this.SUBRULE2(this.card_spec)
    })

    // Main action_condition_phrase rule that ORs all individual condition subrules
    action_condition_phrase = this.RULE("action_condition_phrase", () => {
        this.OR([
            { ALT: () => this.SUBRULE(this.action_condition_player_action) },
            { ALT: () => this.SUBRULE(this.action_condition_any_action) },
            { ALT: () => this.SUBRULE(this.action_condition_turn_start) },
            { ALT: () => this.SUBRULE(this.action_condition_turn_end) },
            { ALT: () => this.SUBRULE(this.action_condition_destroy_is) },
            { ALT: () => this.SUBRULE(this.action_condition_void_is) },
            { ALT: () => this.SUBRULE(this.action_condition_execute_is) },
            { ALT: () => this.SUBRULE(this.action_condition_decompile_is) },
            { ALT: () => this.SUBRULE(this.action_condition_delay_is) },
            { ALT: () => this.SUBRULE(this.action_condition_take_damage) },
            { ALT: () => this.SUBRULE(this.action_condition_activate_effect) },
            { ALT: () => this.SUBRULE(this.action_condition_any_effect_activate) },
            { ALT: () => this.SUBRULE(this.action_condition_move_is) },
            { ALT: () => this.SUBRULE(this.action_condition_remove_is) },
            { ALT: () => this.SUBRULE(this.action_condition_player_draw) },
            { ALT: () => this.SUBRULE(this.action_condition_zone_shuffle) },
            { ALT: () => this.SUBRULE(this.action_condition_receive_counter) },
            { ALT: () => this.SUBRULE(this.action_condition_override_stat) },
            { ALT: () => this.SUBRULE(this.action_condition_stat_change) },
            { ALT: () => this.SUBRULE(this.action_condition_receive_heal) },
            { ALT: () => this.SUBRULE(this.action_condition_receive_effect) },
            { ALT: () => this.SUBRULE(this.action_condition_remove_effect) },
            { ALT: () => this.SUBRULE(this.action_condition_remove_counter) }
        ])
    })

    // ===== ACTION STATEMENT SUBRULES =====
    
    action_reprogram = this.RULE("action_reprogram", () => {
        this.CONSUME(TOKENS.keyword_reprogram)
    })

    action_lose = this.RULE("action_lose", () => {
        this.SUBRULE(this.player_spec)
        this.SUBRULE1(this.is)
        this.CONSUME(TOKENS.keyword_lose)
    })

    action_negate_action = this.RULE("action_negate_action", () => {
        this.CONSUME(TOKENS.keyword_negate)
        this.CONSUME1(TOKENS.keyword_action)
    })

    action_negate_with_instead = this.RULE("action_negate_with_instead", () => {
        this.SUBRULE(this.action_stmt)
        this.MANY(() => {
            this.CONSUME(TOKENS.op_and)
            this.SUBRULE1(this.action_stmt)
        })
        this.CONSUME1(TOKENS.prep_instead)
    })

    action_clear_all_status = this.RULE("action_clear_all_status", () => {
        this.CONSUME(TOKENS.keyword_remove)
        this.CONSUME1(TOKENS.keyword_all)
        this.CONSUME2(TOKENS.ID) // KEYWORD_STATUS
        this.CONSUME3(TOKENS.keyword_effect)
        this.SUBRULE(this.from_word)
        this.SUBRULE1(this.card_spec)
    })

    action_remove_all_effects = this.RULE("action_remove_all_effects", () => {
        this.CONSUME(TOKENS.keyword_remove)
        this.CONSUME1(TOKENS.keyword_all)
        this.CONSUME2(TOKENS.keyword_effect)
        this.SUBRULE(this.from_word)
        this.SUBRULE1(this.card_spec)
    })

    action_clear_all_counters = this.RULE("action_clear_all_counters", () => {
        this.CONSUME(TOKENS.keyword_remove)
        this.CONSUME1(TOKENS.keyword_all)
        this.CONSUME2(TOKENS.ID) // KEYWORD_COUNTER
        this.SUBRULE(this.from_word)
        this.SUBRULE1(this.card_spec)
    })

    action_destroy = this.RULE("action_destroy", () => {
        this.CONSUME(TOKENS.keyword_destroy)
        this.SUBRULE(this.card_spec)
    })

    action_void = this.RULE("action_void", () => {
        this.CONSUME(TOKENS.keyword_void)
        this.SUBRULE(this.card_spec)
    })

    action_execute = this.RULE("action_execute", () => {
        this.CONSUME(TOKENS.keyword_execute)
        this.SUBRULE(this.card_spec)
    })

    action_decompile = this.RULE("action_decompile", () => {
        this.CONSUME(TOKENS.keyword_decompile)
        this.SUBRULE(this.card_spec)
    })

    action_delay = this.RULE("action_delay", () => {
        this.CONSUME(TOKENS.keyword_delay)
        this.SUBRULE(this.card_spec)
        this.CONSUME1(TOKENS.prep_by)
        this.SUBRULE1(this.num_spec)
        this.CONSUME2(TOKENS.keyword_turn)
    })

    action_disable = this.RULE("action_disable", () => {
        this.CONSUME(TOKENS.keyword_disable)
        this.SUBRULE(this.card_spec)
    })

    action_reset = this.RULE("action_reset", () => {
        this.CONSUME(TOKENS.keyword_reset)
        this.SUBRULE(this.card_spec)
    })

    action_deal_damage_card = this.RULE("action_deal_damage_card", () => {
        this.CONSUME(TOKENS.keyword_deal)
        this.SUBRULE(this.num_spec)
        this.CONSUME1(TOKENS.ID) // DAMAGE_TYPE
        this.CONSUME2(TOKENS.keyword_damage)
        this.CONSUME3(TOKENS.prep_to)
        this.SUBRULE1(this.card_spec)
    })

    action_deal_damage_ahead = this.RULE("action_deal_damage_ahead", () => {
        this.CONSUME(TOKENS.keyword_deal)
        this.SUBRULE(this.num_spec)
        this.CONSUME1(TOKENS.ID) // DAMAGE_TYPE
        this.CONSUME1(TOKENS.keyword_damage)
        this.CONSUME2(TOKENS.keyword_ahead)
    })

    action_deal_damage_player = this.RULE("action_deal_damage_player", () => {
        this.CONSUME(TOKENS.keyword_deal)
        this.SUBRULE(this.num_spec)
        this.CONSUME1(TOKENS.ID) // HEART
        this.CONSUME1(TOKENS.keyword_damage)
        this.CONSUME2(TOKENS.prep_to)
        this.SUBRULE1(this.player_spec)
    })

    action_activate_effect = this.RULE("action_activate_effect", () => {
        this.CONSUME(TOKENS.keyword_activate)
        this.SUBRULE(this.effect_spec)
    })

    action_move = this.RULE("action_move", () => {
        this.CONSUME(TOKENS.keyword_move)
        this.SUBRULE(this.card_spec)
        this.CONSUME1(TOKENS.prep_to)
        this.OR([
            { ALT: () => this.SUBRULE1(this.zone_spec) },
            { ALT: () => this.SUBRULE2(this.pos_spec) }
        ])
    })

    action_draw = this.RULE("action_draw", () => {
        this.CONSUME(TOKENS.keyword_draw)
        this.SUBRULE(this.num_spec)
        this.CONSUME1(TOKENS.keyword_card)
    })

    action_draw_turn = this.RULE("action_draw_turn", () => {
        this.CONSUME(TOKENS.keyword_turn)
        this.CONSUME1(TOKENS.keyword_draw)
        this.SUBRULE(this.num_spec)
        this.CONSUME2(TOKENS.keyword_card)
    })

    action_shuffle = this.RULE("action_shuffle", () => {
        this.CONSUME(TOKENS.keyword_shuffle)
        this.SUBRULE(this.zone_spec)
    })

    action_add_counter = this.RULE("action_add_counter", () => {
        this.CONSUME(TOKENS.keyword_add)
        this.OPTION(() => {
            this.OR([
                { ALT: () => this.CONSUME1(TOKENS.ID) }, // OP_ADD
                { ALT: () => this.CONSUME2(TOKENS.ID) }  // OP_SUB
            ])
        })
        this.SUBRULE(this.num_spec)
        this.CONSUME3(TOKENS.ID) // CARD_KEY
        this.CONSUME4(TOKENS.prep_to)
        this.SUBRULE1(this.card_spec)
    })

    action_override = this.RULE("action_override", () => {
        this.CONSUME(TOKENS.keyword_override)
        this.CONSUME1(TOKENS.ID) // CARD_KEY
        this.CONSUME2(TOKENS.prep_of)
        this.CONSUME3(TOKENS.ID) // CARD_KEY
        this.CONSUME4(TOKENS.prep_to)
        this.SUBRULE(this.num_spec)
    })

    action_heal = this.RULE("action_heal", () => {
        this.CONSUME(TOKENS.keyword_heal)
        this.SUBRULE(this.card_spec)
        this.CONSUME1(TOKENS.prep_by)
        this.SUBRULE1(this.num_spec)
    })

    action_add_effect = this.RULE("action_add_effect", () => {
        this.CONSUME(TOKENS.keyword_add)
        this.SUBRULE(this.effect_id)
        this.CONSUME1(TOKENS.prep_to)
        this.SUBRULE1(this.card_spec)
        this.OPTION(() => {
            this.OPTION1(() => {
                this.CONSUME1(TOKENS.keyword_override)
            })
            this.CONSUME2(TOKENS.prep_with)
            this.OPTION2(() => {
                this.CONSUME2(TOKENS.ID) // KEYWORD_TYPE
                this.CONSUME3(TOKENS.ID) // EFFECT_TYPE
            })
            this.OPTION3(() => {
                this.CONSUME4(TOKENS.keyword_subtype)
                this.SUBRULE2(this.id_list)
            })
        })
    })

    action_duplicate_effect = this.RULE("action_duplicate_effect", () => {
        this.CONSUME(TOKENS.keyword_duplicate)
        this.SUBRULE(this.effect_id)
        this.OPTION(() => {
            this.CONSUME1(TOKENS.prep_to)
            this.SUBRULE1(this.card_spec)
            this.OPTION1(() => {
                this.OPTION2(() => {
                    this.CONSUME1(TOKENS.keyword_override)
                })
                this.CONSUME2(TOKENS.prep_with)
                this.OPTION3(() => {
                    this.CONSUME2(TOKENS.ID) // KEYWORD_TYPE
                    this.CONSUME3(TOKENS.ID) // EFFECT_TYPE
                })
                this.OPTION4(() => {
                    this.CONSUME3(TOKENS.keyword_subtype)
                    this.SUBRULE2(this.id_list)
                })
            })
        })
    })

    action_remove_effect = this.RULE("action_remove_effect", () => {
        this.CONSUME(TOKENS.keyword_remove)
        this.SUBRULE(this.effect_spec)
    })

    action_duplicate_card = this.RULE("action_duplicate_card", () => {
        this.CONSUME(TOKENS.keyword_duplicate)
        this.SUBRULE(this.card_spec)
        this.OPTION(() => {
            this.CONSUME1(TOKENS.SYMBOL_LB)
            this.SUBRULE1(this.id_list)
            this.CONSUME2(TOKENS.SYMBOL_RB)
        })
        this.CONSUME3(TOKENS.prep_to)
        this.OR([
            { ALT: () => this.SUBRULE2(this.zone_spec) },
            { ALT: () => this.SUBRULE3(this.pos_spec) }
        ])
        this.OPTION1(() => {
            this.CONSUME4(TOKENS.prep_with)
            this.SUBRULE4(this.num_spec)
            this.CONSUME5(TOKENS.ID) // CARD_KEY
            this.MANY(() => {
                this.CONSUME6(TOKENS.SYMBOL_COMMA)
                this.SUBRULE5(this.num_spec)
                this.CONSUME7(TOKENS.ID) // CARD_KEY
            })
        })
    })

    action_reset_once = this.RULE("action_reset_once", () => {
        this.CONSUME(TOKENS.keyword_reset)
        this.CONSUME1(TOKENS.ID) // KEYWORD_EFFECT_TYPE_ONCE
        this.CONSUME2(TOKENS.prep_of)
        this.SUBRULE(this.effect_spec)
    })

    action_reset_all_once = this.RULE("action_reset_all_once", () => {
        this.CONSUME(TOKENS.keyword_reset)
        this.CONSUME1(TOKENS.keyword_all)
        this.CONSUME2(TOKENS.ID) // KEYWORD_EFFECT_TYPE_ONCE
        this.CONSUME3(TOKENS.prep_of)
        this.SUBRULE(this.card_spec)
    })

    // Main action_stmt rule that ORs all individual action subrules
    action_stmt = this.RULE("action_stmt", () => {
        this.OR([
            { ALT: () => this.SUBRULE(this.action_reprogram) },
            { ALT: () => this.SUBRULE(this.action_lose) },
            { ALT: () => this.SUBRULE(this.action_negate_action) },
            { ALT: () => this.SUBRULE(this.action_negate_with_instead) },
            { ALT: () => this.SUBRULE(this.action_clear_all_status) },
            { ALT: () => this.SUBRULE(this.action_remove_all_effects) },
            { ALT: () => this.SUBRULE(this.action_clear_all_counters) },
            { ALT: () => this.SUBRULE(this.action_destroy) },
            { ALT: () => this.SUBRULE(this.action_void) },
            { ALT: () => this.SUBRULE(this.action_execute) },
            { ALT: () => this.SUBRULE(this.action_decompile) },
            { ALT: () => this.SUBRULE(this.action_delay) },
            { ALT: () => this.SUBRULE(this.action_disable) },
            { ALT: () => this.SUBRULE(this.action_reset) },
            { ALT: () => this.SUBRULE(this.action_deal_damage_card) },
            { ALT: () => this.SUBRULE(this.action_deal_damage_ahead) },
            { ALT: () => this.SUBRULE(this.action_deal_damage_player) },
            { ALT: () => this.SUBRULE(this.action_activate_effect) },
            { ALT: () => this.SUBRULE(this.action_move) },
            { ALT: () => this.SUBRULE(this.action_draw) },
            { ALT: () => this.SUBRULE(this.action_draw_turn) },
            { ALT: () => this.SUBRULE(this.action_shuffle) },
            { ALT: () => this.SUBRULE(this.action_add_counter) },
            { ALT: () => this.SUBRULE(this.action_override) },
            { ALT: () => this.SUBRULE(this.action_heal) },
            { ALT: () => this.SUBRULE(this.action_add_effect) },
            { ALT: () => this.SUBRULE(this.action_duplicate_effect) },
            { ALT: () => this.SUBRULE(this.action_remove_effect) },
            { ALT: () => this.SUBRULE(this.action_duplicate_card) },
            { ALT: () => this.SUBRULE(this.action_reset_once) },
            { ALT: () => this.SUBRULE(this.action_reset_all_once) }
        ])
    })
}
 