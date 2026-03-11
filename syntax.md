# Syntax for qpDSL (v6)

A DSL exclusively to declaring effect texts used in the game qp

> Jkong and all parties involved reserved all rights to the original game assets, stories, promotional materials and everything related

Goal:

+ As close to natural language as possible
+ Hides as much programing stuff as possble (variables, if else, conditions, etc)
+ Restrict to qp main texts, no ygo, no extensions for now

> Yes I know these goals are funny and quite lofty, I understand no normal langauges aims to follow natural language because it is kind of a fools errand. This is my best attempt at this just to see if I can.
> A further goal is to make like a semi automatic choose your own effect editor for non-program people.

To achive these goals, these sacrifices have to be made:

+ No manual variable declaration or bindings, all bindings are automatic
+ Since bindings are automatic, bindings needs to be "dumb" by default using a simple back reference heuristic
+ No nested if
+ Move all required element of an effect outside of the "code" space, reserve a meta data space exclusively for that

> backref binds to the last variable if not specify a type, else binds to the last variable of that type

## Background on what is an effect in qp

Effects is a collection of:

+ Meta data, including internal variables (stored as number exclusively) and types / subtypes
+ Staments or the "text" portion of Effect

Effects texts is segmented into multiple parts (or statements)

+ Declaring target
+ Declaring actions (1 per statement)

Both perhaps have a conditional attached to them.

Something made up that uses all 3 is:

```txt
Target 1 level 1 fruit card on the field. If it has counters, move it to grave. 
```

This is segmented into a target_stmt and a move_action_stmt

another stype that should? be accepted (same AST) is:

```txt
Target 1 level 1 fruit card on the field. Move it to grave if it has counters.
```

## Lexer tokens

> **Note:** All keyword and operator patterns are case-insensitive and enforce word boundaries (`\b`). Tokens marked with `-> skip` are filtered out by the lexer and not passed to the parser.

```antlr4
// Tokens to skip (filtered out by lexer)
SKIP_LINE_COMMENT : '//' ~[\r\n]* -> skip;
SKIP_BLOCK_COMMENT : '/*' .*? '*/' -> skip;
SKIP_FILLER : 'the' | 'would' -> skip;

// Effect positions (matched above INT_LIT for priority)
KEYWORD_FIRST : '1st' | 'first' ;
KEYWORD_SECOND : '2nd' | 'second' ;
KEYWORD_THIRD : '3rd' | 'third' ;

// Literals
INT_LIT : [0-9]+ ;

// Symbols
SYMBOL_EFFECT_PREFIX : 'e_' ;
SYMBOL_ARROW : ('=' | '-')+ '>' ;
SYMBOL_EQ : '=' ;
SYMBOL_COLON : ':' ;
SYMBOL_DOT : '.' ;
SYMBOL_COMMA : ',' ;
SYMBOL_LB : '(' ;
SYMBOL_RB : ')' ;
SYMBOL_LCB : '{' ;
SYMBOL_RCB : '}' ;
SYMBOL_LSB : '[' ;
SYMBOL_RSB : ']' ;
SYMBOL_QUESTION_MARK : '?' ;
SYMBOL_UNDER_SCORE : '_' ;

// Keywords: back reference
KEYWORD_BACK_REFERENCE : 'it' | 'that' | 'them' | 'they' | 'those' | 'whose' | 'targeted' ;

// Keywords: control flow
KEYWORD_ANY : 'any' ;
KEYWORD_TARGET : 'target' | 'targets' ;
KEYWORD_IF : 'if' | 'iff' | 'whenever' | 'when' ;
KEYWORD_ELSE : 'else' ;
KEYWORD_UNLESS : 'unless' ;
KEYWORD_BEFORE : 'before' ;
KEYWORD_AFTER : 'after' ;
KEYWORD_THEN : 'then' ;
KEYWORD_WAS : 'was' ;
KEYWORD_DONE : 'done' ;

// Keywords: named entities
KEYWORD_ACTION : 'current action' | 'action' ;
KEYWORD_THIS_CARD : 'this card' | 'this card\'s' ;
KEYWORD_THIS_EFFECT : 'this effect' | 'this effect\'s' ;
KEYWORD_THIS_PLAYER : 'this player' | 'this player\'s' ;

// Keywords: direction
KEYWORD_DIRECTION : 'direction' | 'directions' | 'dir' | 'dirs' ;

// Keywords: action verbs
KEYWORD_TURN : 'turn' ;
KEYWORD_START : 'start' | 'starts' | 'started' ;
KEYWORD_END : 'end' | 'ends' | 'ended' ;
KEYWORD_REPROGRAM : 'reprogram' ;
KEYWORD_LOSE : 'lose' | 'loses' | 'lost' ;
KEYWORD_NEGATE : 'negate' | 'negates' | 'negated' ;
KEYWORD_REMOVE : 'remove' | 'removes' | 'removed' | 'clear' | 'clears' | 'cleared' ;
KEYWORD_STATUS : 'status' ;
KEYWORD_DESTROY : 'destroy' | 'destroyes' | 'destroys' | 'destroyed' ;
KEYWORD_VOID : 'void' | 'voids' | 'voided' ;
KEYWORD_EXECUTE : 'execute' | 'executes' | 'executed' ;
KEYWORD_DECOMPILE : 'decompile' | 'decompiles' | 'decompiled' ;
KEYWORD_DELAY : 'delay' | 'delays' | 'delayed' ;
KEYWORD_DISABLE : 'disable' | 'disables' | 'disabled' ;
KEYWORD_RESET : 'reset' | 'resets' | 'resetted' | 'reseted' ;
KEYWORD_DEAL : 'deal' | 'deals' | 'dealt' ;
KEYWORD_TAKE : 'take' | 'takes' | 'took' ;
KEYWORD_SURVIVE : 'survive' | 'survives' | 'survived' ;
KEYWORD_DAMAGE : 'damage' | 'damages' | 'damaged' ;
KEYWORD_AHEAD : 'ahead' ;
KEYWORD_ACTIVATE : 'activate' | 'activates' | 'activated' ;
KEYWORD_MOVE : 'move' | 'moves' | 'moved' ;
KEYWORD_DRAW : 'draw' | 'draws' | 'drew' | 'drawn' ;
KEYWORD_SHUFFLE : 'shuffle' | 'shuffles' | 'shuffled' ;
KEYWORD_ADD : 'add' | 'adds' | 'added' ;
KEYWORD_RECEIVE : 'receive' | 'receives' | 'received' ;
KEYWORD_STAT : 'stat' ;
KEYWORD_OVERRIDE : 'override' | 'overrides' | 'overriden' | 'overiden' ;
KEYWORD_CHANGE : 'change' | 'changes' | 'changed' ;
KEYWORD_HEAL : 'heal' | 'heals' | 'healed' ;
KEYWORD_SUBTYPE : 'subtype' ;
KEYWORD_DUPLICATE : 'duplicate' | 'duplicates' | 'duplicated' ;
KEYWORD_ALL : 'all' ;

// Keywords: game elements
KEYWORD_CARD : 'card' | 'cards' ;
KEYWORD_EFFECT : 'effect' | 'effects' | 'eff' | 'effs' ;
KEYWORD_POSITION : 'position' | 'positions' | 'pos' ;
KEYWORD_ZONE : 'zone' | 'zones' ;

// Operators
OP_COUNT : 'number of' | 'count of' ;
OP_HAS : 'has' ;
OP_INCREASE : 'increase' | 'increases' | 'increasing' ;
OP_DECREASE : 'decrease' | 'decreases' | 'decreasing' ;
OP_EXIST : 'exist' | 'exists' ;
OP_NOT_EQUAL : 'not is' | 'is not' | 'not' | 'different' | 'different to' ;
OP_EQUAL : 'is' | 'be' | 'same' | 'same as' ;
OP_AND : 'and' ;
OP_OR : 'or' ;
OP_LESS_THAN_OR_EQUAL : 'no more than' | 'no more' ;
OP_GREATER_THAN_OR_EQUAL : 'at least' ;
OP_GREATER_THAN : 'more than' | 'more' ;
OP_LESS_THAN : 'fewer than' | 'fewer' | 'less than' | 'less' ;

// Prepositions
PREP_BY : 'by' ;
PREP_ON : 'on' ;
PREP_AS : 'as' ;
PREP_FOR : 'for' ;
PREP_OF : 'of' ;
PREP_TO : 'to' ;
PREP_AWAY : 'away' ;
PREP_WITHIN : 'within' ;
PREP_WITH : 'with' ;
PREP_IN : 'in' ;
PREP_FROM : 'from' ;
PREP_WHERE : 'where' ;
PREP_INSTEAD : 'instead' ;

// Identifier (catch-all for unrecognized words)
ID : [a-zA-Z]+ ;

// Unrecognized symbols are skipped
SKIP_UNRECOGNIZED : ~[a-zA-Z\s] ;
```

These global rules refering to groups of tokens of similar semantics is allow:

```antlr4
//short hand lists
id_list : ID (CM ID)* ;

//compare operators
op_compare : OP_EQUAL | OP_NOT_EQUAL | OP_LESS_THAN_OR_EQUAL | OP_GREATER_THAN_OR_EQUAL | OP_GREATER_THAN | OP_LESS_THAN ;

//internal value reference needs to be enclosed between {}
internal_var_ref : LCB ID RCB ;

//amount spec, an op and an int lit, ex: more than 1 (>1), no more than 2 (<=2)
amount_spec : op_compare? amount_spec_no_op;
amount_spec_no_op : INT_LIT | internal_var_ref ;
amount_spec_with_all : KEYWORD_ALL | amount_spec ;

//back reference, either with type T passed in or without
//ex : targeted card, that card, that zone, ...etc
//if not passed in its whatever
backref_any = KEYWORD_BACK_REFERENCE; //backref any is special, worth a separate rule
backref_card = KEYWORD_BACK_REFERENCE KEYWORD_CARD | backref_any ;
backref_effect = KEYWORD_BACK_REFERENCE KEYWORD_EFFECT | backref_any ;
backref_zone = KEYWORD_BACK_REFERENCE KEYWORD_ZONE | backref_any ;
backref_pos = KEYWORD_BACK_REFERENCE KEYWORD_POS | backref_any ;

// from word
from_word : PREP_FROM | PREP_ON | PREP_IN | PREP_WITHIN ;

// target specifiers
card_spec : KEYWORD_THIS_CARD | backref_card | target_card_inline ;
effect_spec : KEYWORD_THIS_EFFECT | backref_effect | target_effect_inline ;
pos_spec : backref_pos | target_pos_inline ;
zone_spec : backref_zone | target_zone_inline ;
num_spec : amount_spec_no_op | property_access ;
player_spec : KEYWORD_PLAYER_NAME INT_LIT? | KEYWORD_THIS_PLAYER ;

//property access
property_access : property_access_card | number_of_targets ;

property_access_card : ID  PREP_OF card_spec ;
number_of_targets : OP_COUNT (card_spec | effect_spec | pos_spec | zone_spec) ;

//is is for actions to reference, just easier to write 'is' than OP_EQUAL every time
//this SHOULD be a replacement into the actual action rules, not a subrule
is : OP_EQUAL ; 
```

## Top level syntax

```antlr4
stmt_sep : DOT ; // this is separate in case I decide to change stuff later

program : effect_decl* ;
effect_decl : effect_id DOT effect_meta_data COLON effect_segments stmt_sep?;

//splits effect decl into segments
// each segment has at most 1 condition, follow by targets (as much targets as wanted), follow by actions
// each segments actual got compiled into a separate entity, since implementation wise an effect can only have 1 input portion
// TODO : 
// consider building the dependencies then shift targets upwards as much as possible to reduce segments
// so careless inputs like target X. draw 2. target Y. move Y to hand dont...output 2 segments for no reason since the 2 targets can be grouped together
// this dont matter tbh, both behave the same, 2 just runs slightly less efficiently
effect_segments : (target_stmt_list stmt_sep)? action_stmt_list ; 

target_stmt_list : target_stmt_with_cond (stmt_sep target_stmt_with_cond)* ;
target_stmt_with_cond : condition_stmt? target_stmt condition_stmt? ;

action_stmt_list : action_stmt_with_cond (stmt_sep action_stmt_with_cond)* ;
action_stmt_with_cond : condition_stmt? action_stmt condition_stmt? ;

effect_id : ID (UNDERSCORE (ID | INT_LIT))* ;
effect_meta_data : type_or_subtype_list (DOT internal_var_dec_list)? ;
type_or_subtype_list : ID (DOT ID)* ; 
internal_var_dec_list : internal_var_decl (CM internal_var_decl)* ;
internal_var_decl : ID EQ INT_LIT (ARROW INT_LIT)? ; //varname = default -> upgraded version, ex: count = 1 -> 2
```

Examples

```txt
e_apple.init.count=1->2 : ...
e_lock_something.lock : ...
```

## Statements

Statements have 3 types: master_condition, target and do action.

### Condition_stmt

```antlr4
condition_stmt : if_condition | unless_condition ;
if_condition : (KEYWORD_IF | KEYWORD_BEFORE | KEYWORD_AFTER | KEYWORD_ON) condition_phrase_list ;
unless_condition : KEYWORD_UNLESS condition_phrase_list ;

condition_phrase_list : condition_phrase ( (OP_AND | OP_OR) condition_phrase )* ;

condition_phrase : 
 generic_condition_phrase | 
 // and (the) action was done/performed by ...
 // this is to separate out the clause with 'by' included in the action condition
 // and the actual causal check
 action_condition_phrase (OP_AND KEYWORD_ACTION KEYWORD_WAS KEYWORD_DONE  PREP_BY (player_spec | card_spec | effect_spec))?;
```

Generic condition_phrase:

```antlr4
generic_condition_phrase : 
 generic_condition_phrase_check_exist_card | 
 generic_condition_phrase_check_exist_effect |
 ... ; // OR of all of the generic_condition rules below

generic_condition_phrase_check_exist_card : OP_EXIST card_spec; //ex : exist 1 green card in hand.
generic_condition_phrase_check_exist_effect : OP_EXIST effect_spec; //ex : exist at least 1 once effect in targeted card.
generic_condition_phrase_check_card_has_stat : card_spec OP_HAS amount_spec ID ; 
//ID matches a CARD_KEY (atk, hp, level, or counter) 
//ex : this card has at least 1 counter 
generic_condition_phrase_check_num_compare : num_spec op_compare num_spec ;
```

```action_condition_phrase``` is an OR of all the action specific intercept, listed in the action seciton below

> BEFORE or AFTER is actutally tied to the effect type, what is specified here dont...matter but we allow all 3 for flexibility.
> We however, do need to differenticate those with unless, since unless acts on the "else" branch instead of the if branch like the others. (unless flips the condition, so to speak)

### Target statement

Target statements is used to specify what target to take

Each target statement has an inline version (to use inside action_stmt) and an standalone(?) version with slightly different syntax.

```antlr4
target_stmt : target_card_stmt | target_effect_stmt | target_pos_stmt | target_zone_stmt ;
```

> Targets should probably use inline if possible, cleaner.

#### Target card

```antlr4
target_card_stmt : KEYWORD_TARGET target_card_inline ;
flags_spec_card : (ID | DOT ID | ID amount_spec | (OP_EQUAL | OP_NOT_EQUAL) ID)* ;
with_effect_spec :  PREP_WITH (
 KEYWORD_THIS_EFFECT | backref<KEYWORD_EFFECT> | target_effect_inline_no_from
) ;

//for example, "move 1 green card" flows better
//this just remove the word "target"
target_card_inline : amount_spec_with_all? flags_spec_card KEYWORD_CARD from_word (backref<KEYWORD_ZONE | KEYWORD_POS> | zone_spec | pos_spec) with_effect_spec?;
```

```flags_spec_card``` could be:

+ archtype (fruit, hana, spirit, ...)
+ rarity (green, blue, red, ...)
+ extension (dot id case) (.hana, .fruit, .ex, ...)
+ positional specifier (exposed, covered, opposite, pathed)
+ quick specifier of numeric card property (ID INT_LIT case) (atk1, hp2, lv4, ...)
+ variant specifier (just "upgraded" for now)
+ how the target is done (just "random" for now)

+ These are classified at AST gen time, We do know what participants of these categories are at build time
+ Order does not matter so ```red fruit exposed``` and ```exposed red fruit``` behaves the same

#### Target effect

```antlr4
target_effect_stmt : KEYWORD_TARGET target_effect_inline ;

//ex: duplicate first once effect from that to this card 
target_effect_inline : (KEYWORD_FIRST | KEYWORD_SECOND | KEYWORD_THIRD | amount_spec_with_all)? ID* KEYWORD_EFFECT from_word card_spec ;
target_effect_inline_no_from : (KEYWORD_FIRST | KEYWORD_SECOND | KEYWORD_THIRD | amount_spec_with_all)? ID* KEYWORD_EFFECT ;
```

#### Target pos

```antlr4
target_pos_stmt : KEYWORD_TARGET target_pos_inline ;
flags_spec_pos : (ID | (KEYWORD_FIRST | KEYWORD_SECOND) ID | ID INT_LIT)* ;

//ex: move targeted card to first empty pos on field
target_pos_inline : target_pos_from_zone | target_pos_with_directions | target_pos_around_card ;
target_pos_from_zone : amount_spec_with_all? flags_spec_pos KEYWORD_POS from_word zone_spec ;
//target all <flags> positions (in (the) direction(s) of [x1, y1], ...[x_n, y_n])? (with(in)? x distance away)? from <card target>
//we do a BFS until distance is reached or 
//default dirs is all dirs are allowed
//default distance is the the entire field 
// if none is specified, thast basically select all positions with extra steps
// distance is defined as how many times these "instructions" is applied if dir is specified
// else its the mahattan distance (diff x + diff y)
// these are to support chess movements 
// horse is in the direction of [up up left], [up up right], [down down left], [down down right] ...
// bishop is in the direction of [up left], [up right], [down left], [down right]. distance = all
target_pos_with_directions : KEYWORD_ALL flags_spec_pos KEYWORD_POS ( PREP_IN KEYWORD_DIRECTION  PREP_OF direction_arr)? ( PREP_WITH  PREP_IN? amount_spec KEYWORD_DISTANCE  PREP_AWAY)?  PREP_FROM card_spec ;
direction_arr : dir_elem (CM dir_elem)* ;
dir_elem : LSB KEYWORD_DIRECTION_SPECIFIC (CM KEYWORD_DIRECTION_SPECIFIC)* RSB ; 

target_pos_around_card : KEYWORD_POS PREPOSITION_TO? ID  PREP_OF card_spec ; //ex: (the) pos (to the) left of this card
```

```flags_spec_pos``` specifies:

+ position state (ID case) (empty, covered, exposed)
+ 1st or 2nd row ((KEYWORD_FIRST | KEYWORD_SECOND) key case)
+ row 1, row 2, column 1, column 2, ... (key INT_LIT case)

#### Target zone

```antlr4
target_zone_stmt : KEYWORD_TARGET player_specifier? ZONE_NAME ;

//ex: move targeted card to first empty pos on field
target_zone_inline : player_specifier? ZONE_NAME ;
```

### Action statement

```action_stmt``` is an OR of the columnn "Do action syntax" of this table

```action_condition_phrase``` is an OR of the column "Intercept syntax" of this table

| Action name | Do action syntax | Intercept syntax | Note |
|---------------------------|----------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------|
| any | n/a | player_spec KEYWORD_TURN? KEYWORD_ACTION | generic catch of the player action for that turn |
| any | | KEYWORD_ANY KEYWORD_ACTION | generic catch of the player action for that turn |
| a_turn_start | n/a (system action) | KEYWORD_TURN KEYWORD_START | this catch always happen AFTER turn start |
| a_turn_end | n/a (system action) | KEYWORD_TURN KEYWORD_END | this catch always happen BEFORE turn ends |
| a_reprogram_start | KEYWORD_REPROGRAM | n/a (system action) | |
| a_force_end_game | player_spec is KEYWORD_LOSE | n/a (system action) | |
| a_negate | KEYWORD_NEGATE KEYWORD_ACTION | n/a (system action) | |
| a_negate | action_stmt (OP_AND action_stmt)*  PREP_INSTEAD | n/a (system action) | |
| a_clear_all_status_effect | KEYWORD_REMOVE KEYWORD_ALL KEYWORD_STATUS KEYWORD_EFFECT from_word card_spec | n/a (system action) | |
| a_remove_all_effects | KEYWORD_REMOVE KEYWORD_ALL KEYWORD_EFFECT from_word card_spec | n/a | intercept remove_effect instead |
| a_clear_all_counters | KEYWORD_REMOVE KEYWORD_ALL KEYWORD_COUNTER from_word card_spec | n/a | intercept remove_counter instead |
| a_destroy | KEYWORD_DESTROY card_spec | card_spec is KEYWORD_DESTROY | |
| a_void | KEYWORD_VOID card_spec | card_spec is KEYWORD_VOID | |
| a_execute | KEYWORD_EXECUTE card_spec | card_spec is KEYWORD_EXECUTE | |
| a_decompile | KEYWORD_DECOMPILE card_spec | card_spec is KEYWORD_DECOMPILE | |
| a_delay | KEYWORD_DELAY card_spec PREP_BY num_spec KEYWORD_TURN | card_spec is KEYWORD_DELAY (PREP_BY num_spec KEYWORD_TURN)? | |
| a_disable | KEYWORD_DISABLE card_spec | n/a (system action) | |
| a_reset | KEYWORD_RESET card_spec | n/a (system action) | |
| a_deal_damage_card | KEYWORD_DEAL num_spec DAMAGE_TYPE KEYWORD_DAMAGE PREP_TO card_spec | card_spec KEYWORD_TAKE num_spec? (DAMAGE_TYPE)? KEYWORD_DAMAGE | DAMAGE_TYPE internally just matches an ID, either 'physical' or 'magic' |
| a_deal_damage_ahead | KEYWORD_DEAL num_spec DAMAGE_TYPE KEYWORD_DAMAGE KEYWORD_AHEAD | n/a | DAMAGE_TYPE internally just matches an ID. Intercept deal_dmg_card instead |
| a_deal_dmg_heart | KEYWORD_DEAL num_spec HEART KEYWORD_DAMAGE PREP_TO player_spec | player_spec KEYWORD_TAKE num_spec? HEART KEYWORD_DAMAGE | HEART internnally matches an ID |
| a_activate_effect | KEYWORD_ACTIVATE effect_spec | effect_spec is KEYWORD_ACTIVATE | |
| a_activate_effect | | KEYWORD_ANY KEYWORD_EFFECT is KEYWORD_ACTIVATE | |
| a_move | KEYWORD_MOVE card_spec PREP_TO (zone_spec | pos_spec) | card_spec is KEYWORD_MOVE (PREP_TO (zone_spec | pos_spec))? | |
| a_move | | card_spec is KEYWORD_REMOVE  PREP_FROM zone_spec | |
| a_draw | KEYWORD_DRAW num_spec KEYWORD_CARD | player_spec KEYWORD_DRAW (num_spec KEYWORD_CARD)? | |
| a_draw | KEYWORD_TURN KEYWORD_DRAW num_spec KEYWORD_CARD | n/a | Intercept turn_start instead |
| a_shuffle | KEYWORD_SHUFFLE zone_spec | zone_spec is? KEYWORD_SHUFFLE | |
| a_add_status_effect | KEYWORD_ADD (OP_ADD|OP_SUB)? num_spec CARD_KEY PREP_TO card_spec | card_spec KEYWORD_RECEIVE (OP_ADD|OP_SUB)? num_spec CARD_KEY | CARD_KEY internally just matches an ID, either 'atk', 'hp' or 'level' |
| a_add_status_effect | KEYWORD_OVERRIDE CARD_KEY PREP_OF CARD_KEY PREP_TO num_spec | CARD_KEY PREP_OF CARD_KEY KEYWORD_OVERRIDE PREP_TO num_spec | CARD_KEY internally just matches an ID |
| a_add_status_effect | n/a | KEYWORD_STAT PREP_OF card_spec is KEYWORD_CHANGE | generic catch of any change happening |
| a_add_status_effect | KEYWORD_HEAL card_spec PREP_BY num_spec | card_spec KEYWORD_RECEIVE KEYWORD_HEAL (PREP_OF num_spec)? | |
| a_add_effect | KEYWORD_ADD effect_id PREP_TO card_spec (KEYWORD_OVERRIDE? PREP_WITH (KEYWORD_TYPE EFFECT_TYPE)? (KEYWORD_SUBTYPE SUBTYPE_LIST)? )? | card_spec KEYWORD_RECEIVE KEYWORD_NEW KEYWORD_EFFECT | EFFECT_TYPE internally matches an ID. SUBTYPE_LIST internally matches an ID list |
| a_duplicate_effect | KEYWORD_DUPLICATE effect_id ( PREP_TO card_spec (KEYWORD_OVERRIDE? PREP_WITH (KEYWORD_TYPE EFFECT_TYPE)? (KEYWORD_SUBTYPE SUBTYPE_LIST))? )? | same as a_add_effect, we only detect new effect added, no use detecting what specifically gets added | this changes the back reference with type Effect or back ref with no type to the newly created effect |
| a_remove_effect | KEYWORD_REMOVE effect_spec | effect_spec is KEYWORD_REMOVE | |
| a_remove_status_effect | n/a (system action) | num_spec COUNTER_KEY is KEYWORD_REMOVE  PREP_FROM card_spec | COUNTER_KEY internally just matches ID, we only intercept counter removal here, anything else is too complicated for this language |
| a_duplicate_card | KEYWORD_DUPLICATE card_spec (LB CARD_VARIANT_LIST RB)? PREP_TO (zone_spec | pos_spec) (PREP_WITH num_spec CARD_KEY (CM num_spec CARD_KEY)*)? | n/a | CARD_VARIANT_LIST internally matches an idlist |
| a_reset_once | KEYWORD_RESET KEYWORD_EFFECT_TYPE_ONCE PREP_OF effect_spec | n/a | KEYWORD_EFFECT_TYPE_ONCE internally matches an ID |
| a_reset_all_once | KEYWORD_RESET KEYWORD_ALL KEYWORD_EFFECT_TYPE_ONCE PREP_OF card_spec | n/a |