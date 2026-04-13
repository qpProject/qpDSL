
import { TargetType } from "../core/types"
import { KeywordCategory } from "./keyword_categories"


export const data = {
    a_reprogram_start_0 : [
        "keyword_reprogram"
    ],
    a_force_end_game_0 : [
        "keyword_force",
        TargetType.Player,
        "keyword_to",
        "keyword_lose"
    ],
    a_force_end_game_1 : [
        TargetType.Player,
        "op_is",
        "keyword_lose"
    ],
    a_negate_0 : [
        "keyword_negate",
        "keyword_current",
        "keyword_action"
    ],
    a_remove_effect_0 : [
        "keyword_remove",
        TargetType.Effect,
        "keyword_from",
        TargetType.Card
    ],
    a_destroy_0 : [
        "keyword_destroy",
        TargetType.Card
    ],
    a_void_0 : [
        "keyword_void",
        TargetType.Card
    ],
    a_execute_0 : [
        "keyword_execute",
        TargetType.Card
    ],
    a_decompile_0 : [
        "keyword_decompile",
        TargetType.Card
    ],
    a_delay_0 : [
        "keyword_delay",
        TargetType.Card
    ],
    a_delay_1 : [
        "keyword_delay",
        TargetType.Card,
        "keyword_by",
        TargetType.Number,
        "keyword_turn"
    ],
    a_disable_0 : [
        "keyword_disable",
        TargetType.Card
    ],
    a_reset_0 : [
        "keyword_reset",
        TargetType.Card
    ],
    a_reset_1 : [
        "keyword_reset",
        TargetType.Effect
    ],
    a_deal_damage_0 : [
        "keyword_deal",
        TargetType.Number,
        KeywordCategory.DAMAGE_TYPE,
        "keyword_damage",
        "keyword_to",
        TargetType.Card
    ],
    a_deal_damage_ahead_0 : [
        "keyword_deal",
        TargetType.Number,
        KeywordCategory.DAMAGE_TYPE,
        "keyword_damage",
        "keyword_ahead"
    ],
    a_deal_heart_damage_0 : [
        "keyword_deal",
        TargetType.Number,
        "keyword_heart",
        "keyword_damage",
        "keyword_to",
        TargetType.Player
    ],
    a_activate_effect_0 : [
        "keyword_activate",
        TargetType.Effect
    ],
    a_move_0 : [
        "keyword_move",
        TargetType.Card,
        "keyword_to",
        TargetType.Position
    ],
    a_move_1 : [
        "keyword_add",
        TargetType.Card,
        "keyword_to",
        TargetType.Position
    ],
    a_move_2 : [
        "keyword_move",
        TargetType.Card,
        "keyword_to",
        TargetType.Zone
    ],
    a_move_3 : [
        "keyword_add",
        TargetType.Card,
        "keyword_to",
        TargetType.Zone
    ],
    a_move_4 : [
        "keyword_move",
        TargetType.Effect,
        "keyword_to",
        TargetType.Card
    ],
    a_move_5 : [
        "keyword_add",
        TargetType.Effect,
        "keyword_to",
        TargetType.Card
    ],
    a_draw_0 : [
        "keyword_draw",
        TargetType.Number
    ],
    a_draw_1 : [
        "keyword_draw",
        TargetType.Number,
        TargetType.Card
    ],
    a_draw_2 : [
        "keyword_draw",
        TargetType.Number,
        "keyword_card"
    ],
    a_draw_3 : [
        "keyword_turn",
        "keyword_draw"
    ],
    a_draw_4 : [
        "keyword_turn",
        "keyword_draw",
        TargetType.Number
    ],
    a_draw_5 : [
        "keyword_turn",
        "keyword_draw",
        TargetType.Card
    ],
    a_draw_6 : [
        "keyword_turn",
        "keyword_draw",
        TargetType.Number,
        TargetType.Card
    ],
    a_draw_7 : [
        "keyword_turn",
        "keyword_draw",
        "keyword_card"
    ],
    a_draw_8 : [
        "keyword_turn",
        "keyword_draw",
        TargetType.Number,
        "keyword_card"
    ],
    a_shuffle_0 : [
        "keyword_shuffle",
        TargetType.Zone
    ],
    a_add_status_effect_0 : [
        "keyword_add",
        "SYMBOL_SIGN",
        KeywordCategory.CARD_STAT,
        "keyword_to",
        TargetType.Card
    ],
    a_add_status_effect_1 : [
        "keyword_add",
        KeywordCategory.EXTENSION,
        "keyword_to",
        TargetType.Card
    ],
    a_add_status_effect_2 : [
        "keyword_override",
        KeywordCategory.CARD_STAT,
        "keyword_of",
        TargetType.Card,
        "keyword_to",
        TargetType.Number
    ],
    a_add_status_effect_3 : [
        "keyword_heal",
        TargetType.Card,
        "keyword_by",
        TargetType.Number
    ],
    a_add_effect_0 : [
        "keyword_add",
        KeywordCategory.EFFECT_ID,
        "keyword_to",
        TargetType.Card
    ],
    a_add_effect_1 : [
        "keyword_add",
        KeywordCategory.EFFECT_ID,
        "keyword_to",
        TargetType.Card,
        "keyword_with",
        KeywordCategory.EFFECT_MODIFIER
    ],
    a_add_effect_2 : [
        "keyword_add",
        KeywordCategory.EFFECT_ID,
        "keyword_to",
        TargetType.Card,
        "keyword_override",
        "keyword_with",
        KeywordCategory.EFFECT_MODIFIER
    ],
    a_add_effect_modifier_0 : [
        "keyword_add",
        KeywordCategory.EFFECT_MODIFIER,
        "keyword_to",
        TargetType.Effect
    ],
    a_duplicate_effect_0 : [
        "keyword_duplicate",
        TargetType.Effect,
        "keyword_to",
        TargetType.Card
    ],
    a_duplicate_effect_1 : [
        "keyword_duplicate",
        TargetType.Effect,
        "keyword_to",
        TargetType.Card,
        "keyword_with",
        KeywordCategory.EFFECT_MODIFIER
    ],
    a_duplicate_effect_2 : [
        "keyword_duplicate",
        TargetType.Effect,
        "keyword_to",
        TargetType.Card,
        "keyword_override",
        "keyword_with",
        KeywordCategory.EFFECT_MODIFIER
    ],
    a_remove_effect_1 : [
        "keyword_remove",
        TargetType.Effect
    ],
    a_remove_status_effect_0 : [
        "keyword_remove",
        TargetType.Number,
        KeywordCategory.CARD_STAT,
        "keyword_from",
        TargetType.Card
    ],
    a_duplicate_card_0 : [
        "keyword_duplicate",
        TargetType.Card,
        "keyword_to",
        TargetType.Position
    ],
    a_duplicate_card_1 : [
        "keyword_duplicate",
        TargetType.Card,
        "keyword_to",
        TargetType.Zone
    ],
    a_attack_0 : [
        "keyword_attack",
        TargetType.Number
    ],
    a_attack_1 : [
        "keyword_attack",
        TargetType.Number,
        "keyword_time"
    ],
    a_attack_2 : [
        "keyword_attack",
        TargetType.Number,
        "keyword_times"
    ],
    a_attack_3 : [
        "keyword_attack",
        "keyword_with",
        TargetType.Number,
        "keyword_damage",
        TargetType.Number
    ],
    a_attack_4 : [
        "keyword_attack",
        "keyword_with",
        TargetType.Number,
        KeywordCategory.DAMAGE_TYPE,
        "keyword_damage",
        TargetType.Number
    ],
    a_attack_5 : [
        "keyword_attack",
        "keyword_with",
        TargetType.Number,
        "keyword_damage",
        TargetType.Number,
        "keyword_time"
    ],
    a_attack_6 : [
        "keyword_attack",
        "keyword_with",
        TargetType.Number,
        KeywordCategory.DAMAGE_TYPE,
        "keyword_damage",
        TargetType.Number,
        "keyword_time"
    ],
    a_attack_7 : [
        "keyword_attack",
        "keyword_with",
        TargetType.Number,
        "keyword_damage",
        TargetType.Number,
        "keyword_times"
    ],
    a_attack_8 : [
        "keyword_attack",
        "keyword_with",
        TargetType.Number,
        KeywordCategory.DAMAGE_TYPE,
        "keyword_damage",
        TargetType.Number,
        "keyword_times"
    ],
    a_lock_0 : [
        "keyword_lock"
    ],
    a_damage_prevent_0 : [
        TargetType.Card,
        "keyword_cannot",
        "keyword_take",
        "keyword_more",
        "keyword_than",
        TargetType.Number,
        "keyword_damage"
    ],
    a_damage_prevent_1 : [
        TargetType.Card,
        "keyword_cannot",
        "keyword_take",
        "keyword_no",
        "keyword_more",
        "keyword_than",
        TargetType.Number,
        "keyword_damage"
    ],
    a_damage_prevent_2 : [
        TargetType.Card,
        "keyword_cannot",
        "keyword_take",
        "keyword_less",
        "keyword_than",
        TargetType.Number,
        "keyword_damage"
    ],
    a_damage_prevent_3 : [
        TargetType.Card,
        "keyword_cannot",
        "keyword_take",
        "keyword_no",
        "keyword_less",
        "keyword_than",
        TargetType.Number,
        "keyword_damage"
    ],
    a_damage_prevent_4 : [
        TargetType.Card,
        "keyword_cannot",
        "keyword_take",
        "keyword_more",
        "keyword_than",
        TargetType.Number,
        KeywordCategory.DAMAGE_TYPE,
        "keyword_damage"
    ],
    a_damage_prevent_5 : [
        TargetType.Card,
        "keyword_cannot",
        "keyword_take",
        "keyword_no",
        "keyword_more",
        "keyword_than",
        TargetType.Number,
        KeywordCategory.DAMAGE_TYPE,
        "keyword_damage"
    ],
    a_damage_prevent_6 : [
        TargetType.Card,
        "keyword_cannot",
        "keyword_take",
        "keyword_less",
        "keyword_than",
        TargetType.Number,
        KeywordCategory.DAMAGE_TYPE,
        "keyword_damage"
    ],
    a_damage_prevent_7 : [
        TargetType.Card,
        "keyword_cannot",
        "keyword_take",
        "keyword_no",
        "keyword_less",
        "keyword_than",
        TargetType.Number,
        KeywordCategory.DAMAGE_TYPE,
        "keyword_damage"
    ],
    a_damage_prevent_8 : [
        TargetType.Card,
        "keyword_take",
        "keyword_no",
        "keyword_damage"
    ],
    a_damage_prevent_9 : [
        TargetType.Card,
        "keyword_take",
        "keyword_no",
        KeywordCategory.DAMAGE_TYPE,
        "keyword_damage"
    ],
    cond_count_0 : [
        "keyword_count",
        "keyword_of",
        TargetType.Card,
        "op_is",
        TargetType.Number
    ],
    cond_count_1 : [
        "keyword_number",
        "keyword_of",
        TargetType.Card,
        "op_is",
        TargetType.Number
    ],
    cond_count_2 : [
        "keyword_count",
        "keyword_of",
        TargetType.Effect,
        "op_is",
        TargetType.Number
    ],
    cond_count_3 : [
        "keyword_number",
        "keyword_of",
        TargetType.Effect,
        "op_is",
        TargetType.Number
    ],
    cond_exist_0 : [
        "keyword_exist",
        TargetType.Card
    ],
    cond_exist_1 : [
        "keyword_exist",
        TargetType.Effect
    ],
    cond_compare_number_0 : [
        TargetType.Number,
        "op_is",
        TargetType.Number
    ],
    cond_card_has_0 : [
        TargetType.Card,
        "keyword_has",
        KeywordCategory.CARD_STAT
    ],
    cond_card_has_1 : [
        TargetType.Card,
        "keyword_has",
        TargetType.Number,
        KeywordCategory.CARD_STAT
    ],
    cond_player_has_0 : [
        TargetType.Player,
        "keyword_has",
        KeywordCategory.PLAYER_STAT
    ],
    cond_player_has_1 : [
        TargetType.Player,
        "keyword_has",
        TargetType.Number,
        KeywordCategory.PLAYER_STAT
    ],
    cond_zone_has_0 : [
        TargetType.Zone,
        "keyword_has",
        TargetType.Card
    ],
    cond_zone_has_1 : [
        TargetType.Zone,
        "keyword_has",
        TargetType.Number,
        TargetType.Card
    ],
    cond_zone_has_2 : [
        TargetType.Zone,
        "keyword_has",
        "keyword_card"
    ],
    cond_zone_has_3 : [
        TargetType.Zone,
        "keyword_has",
        TargetType.Number,
        "keyword_card"
    ],
    cond_card_on_0 : [
        TargetType.Card,
        "op_is",
        "keyword_on",
        TargetType.Position
    ],
    cond_card_on_1 : [
        TargetType.Card,
        "op_is",
        "keyword_on",
        TargetType.Zone
    ],
    cond_effect_has_0 : [
        TargetType.Effect,
        "keyword_has",
        KeywordCategory.EFFECT_TYPE
    ],
    cond_effect_has_1 : [
        TargetType.Effect,
        "keyword_has",
        KeywordCategory.EFFECT_SUBTYPE
    ],
    a_any_0 : [
        TargetType.Player,
        "keyword_action"
    ],
    a_any_1 : [
        TargetType.Player,
        "keyword_turn",
        "keyword_action"
    ],
    a_any_2 : [
        "keyword_any",
        "keyword_action"
    ],
    a_turn_start_0 : [
        "keyword_turn",
        "keyword_start"
    ],
    a_turn_end_0 : [
        "keyword_turn",
        "keyword_end"
    ],
    a_destroy_1 : [
        TargetType.Card,
        "op_is",
        "keyword_destroy"
    ],
    a_void_1 : [
        TargetType.Card,
        "op_is",
        "keyword_void"
    ],
    a_execute_1 : [
        TargetType.Card,
        "op_is",
        "keyword_execute"
    ],
    a_decompile_1 : [
        TargetType.Card,
        "op_is",
        "keyword_decompile"
    ],
    a_delay_2 : [
        TargetType.Card,
        "op_is",
        "keyword_delay"
    ],
    a_delay_3 : [
        TargetType.Card,
        "op_is",
        "keyword_delay",
        "keyword_by",
        TargetType.Number,
        "keyword_turn"
    ],
    a_deal_damage_1 : [
        TargetType.Card,
        "keyword_take",
        "keyword_damage"
    ],
    a_deal_damage_2 : [
        TargetType.Card,
        "keyword_take",
        TargetType.Number,
        "keyword_damage"
    ],
    a_deal_damage_3 : [
        TargetType.Card,
        "keyword_take",
        KeywordCategory.DAMAGE_TYPE,
        "keyword_damage"
    ],
    a_deal_damage_4 : [
        TargetType.Card,
        "keyword_take",
        TargetType.Number,
        KeywordCategory.DAMAGE_TYPE,
        "keyword_damage"
    ],
    a_deal_heart_damage_1 : [
        TargetType.Player,
        "keyword_take",
        TargetType.Number,
        "keyword_heart",
        "keyword_damage"
    ],
    a_activate_effect_1 : [
        TargetType.Effect,
        "op_is",
        "keyword_activate"
    ],
    a_activate_effect_2 : [
        "keyword_any",
        TargetType.Effect,
        "op_is",
        "keyword_activate"
    ],
    a_move_6 : [
        TargetType.Card,
        "op_is",
        "keyword_move"
    ],
    a_move_7 : [
        TargetType.Card,
        "op_is",
        "keyword_move",
        "keyword_from",
        TargetType.Position
    ],
    a_move_8 : [
        TargetType.Card,
        "op_is",
        "keyword_move",
        "keyword_from",
        TargetType.Zone
    ],
    a_move_9 : [
        TargetType.Card,
        "op_is",
        "keyword_move",
        "keyword_to",
        TargetType.Position
    ],
    a_move_10 : [
        TargetType.Card,
        "op_is",
        "keyword_move",
        "keyword_from",
        TargetType.Position,
        "keyword_to",
        TargetType.Position
    ],
    a_move_11 : [
        TargetType.Card,
        "op_is",
        "keyword_move",
        "keyword_from",
        TargetType.Zone,
        "keyword_to",
        TargetType.Position
    ],
    a_move_12 : [
        TargetType.Card,
        "op_is",
        "keyword_move",
        "keyword_to",
        TargetType.Zone
    ],
    a_move_13 : [
        TargetType.Card,
        "op_is",
        "keyword_move",
        "keyword_from",
        TargetType.Position,
        "keyword_to",
        TargetType.Zone
    ],
    a_move_14 : [
        TargetType.Card,
        "op_is",
        "keyword_move",
        "keyword_from",
        TargetType.Zone,
        "keyword_to",
        TargetType.Zone
    ],
    a_move_15 : [
        TargetType.Effect,
        "op_is",
        "keyword_move"
    ],
    a_move_16 : [
        TargetType.Effect,
        "op_is",
        "keyword_move",
        "keyword_from",
        TargetType.Card
    ],
    a_move_17 : [
        TargetType.Effect,
        "op_is",
        "keyword_move",
        "keyword_to",
        TargetType.Card
    ],
    a_move_18 : [
        TargetType.Effect,
        "op_is",
        "keyword_move",
        "keyword_from",
        TargetType.Card,
        "keyword_to",
        TargetType.Card
    ],
    a_move_19 : [
        TargetType.Card,
        "op_is",
        "keyword_remove",
        "keyword_from",
        TargetType.Position
    ],
    a_move_20 : [
        TargetType.Card,
        "op_is",
        "keyword_remove",
        "keyword_from",
        TargetType.Zone
    ],
    a_draw_9 : [
        TargetType.Player,
        "keyword_draw"
    ],
    a_draw_10 : [
        TargetType.Player,
        "keyword_draw",
        TargetType.Number
    ],
    a_draw_11 : [
        TargetType.Player,
        "keyword_draw",
        TargetType.Number,
        TargetType.Card
    ],
    a_draw_12 : [
        TargetType.Player,
        "keyword_draw",
        TargetType.Number,
        "keyword_card"
    ],
    a_draw_13 : [
        TargetType.Player,
        "keyword_turn",
        "keyword_draw"
    ],
    a_shuffle_1 : [
        TargetType.Zone,
        "keyword_shuffle"
    ],
    a_shuffle_2 : [
        TargetType.Zone,
        "op_is",
        "keyword_shuffle"
    ],
    a_add_status_effect_4 : [
        "keyword_extension",
        "keyword_of",
        TargetType.Card,
        "op_is",
        "keyword_change"
    ],
    a_add_status_effect_5 : [
        TargetType.Card,
        "keyword_receive",
        KeywordCategory.CARD_STAT
    ],
    a_add_status_effect_6 : [
        TargetType.Card,
        "keyword_receive",
        "SYMBOL_SIGN",
        KeywordCategory.CARD_STAT
    ],
    a_add_status_effect_7 : [
        KeywordCategory.CARD_STAT,
        "keyword_of",
        TargetType.Card,
        "op_is",
        "keyword_override"
    ],
    a_add_status_effect_8 : [
        KeywordCategory.CARD_STAT,
        "keyword_of",
        TargetType.Card,
        "op_is",
        "keyword_override",
        "keyword_to",
        TargetType.Number
    ],
    a_add_status_effect_9 : [
        KeywordCategory.CARD_STAT,
        "keyword_of",
        TargetType.Card,
        "op_is",
        "keyword_change"
    ],
    a_add_status_effect_10 : [
        "keyword_stat",
        "keyword_of",
        TargetType.Card,
        "op_is",
        "keyword_change"
    ],
    a_add_status_effect_11 : [
        TargetType.Card,
        "keyword_receive",
        "keyword_heal",
        "keyword_of",
        TargetType.Number
    ],
    a_add_effect_3 : [
        TargetType.Card,
        "keyword_receive",
        "keyword_effect"
    ],
    a_add_effect_4 : [
        TargetType.Card,
        "keyword_receive",
        "keyword_new",
        "keyword_effect"
    ],
    a_add_effect_5 : [
        TargetType.Card,
        "keyword_receive",
        KeywordCategory.EFFECT_ID
    ],
    a_add_effect_6 : [
        TargetType.Card,
        "keyword_receive",
        "keyword_new",
        KeywordCategory.EFFECT_ID
    ],
    a_add_effect_modifier_1 : [
        TargetType.Effect,
        "keyword_receive",
        KeywordCategory.EFFECT_MODIFIER
    ],
    a_duplicate_effect_3 : [
        TargetType.Effect,
        "op_is",
        "keyword_duplicate"
    ],
    a_remove_effect_2 : [
        TargetType.Effect,
        "op_is",
        "keyword_remove"
    ],
    a_remove_status_effect_1 : [
        TargetType.Number,
        KeywordCategory.CARD_STAT,
        "op_is",
        "keyword_remove",
        "keyword_from",
        TargetType.Card
    ],
    a_duplicate_card_2 : [
        TargetType.Card,
        "op_is",
        "keyword_duplicate"
    ],
    a_duplicate_card_3 : [
        TargetType.Card,
        "op_is",
        "keyword_duplicate",
        "keyword_to",
        TargetType.Position
    ],
    a_duplicate_card_4 : [
        TargetType.Card,
        "op_is",
        "keyword_duplicate",
        "keyword_to",
        TargetType.Zone
    ]
} as const