# Action Sequences Reference

## Overview

This document lists all action definitions with their creation and intercept/condition sequences.

---

## All Actions

| Action Name | Keyword Synonyms | Creation Sequence | Intercept Sequence |
|---|---|---|---|
| cond_count | — | — | (count|number) of (card|effect) is {0} |
| cond_exist | exist exists existed | — | exist (card | effect) |
| cond_compare_number | — | — | {0} is {0} |
| cond_card_has | has have had own owns owned | — | card has {0}? CARD_STAT |
| cond_player_has | — | — | player has {0}? PLAYER_STAT |
| cond_zone_has | — | — | zone has {0}? (card|card!) |
| cond_card_on | — | — | card is on (pos | zone) |
| cond_effect_has | — | — | effect has (EFFECT_TYPE|EFFECT_SUBTYPE) |
| a_any | turn turns | — | player turn? action! |
| a_any | — | — | any action! |
| a_turn_start | start | — | turn start |
| a_turn_end | end | — | turn end |
| a_reprogram_start | reprogram reprograms reprogramed | reprogram |  |
| a_force_end_game | lose lost loses | player is lost |  |
| a_negate | negate negates negated | negate current action! |  |
| a_remove_effect | remove removes removed | remove effect from card |  |
| a_destroy | destroy destroys destroyed | destroy card | card is destroyed |
| a_void | void voids voided | void card | card is voided |
| a_execute | execute executes executed | execute card | card is executed |
| a_decompile | decompile decompiles decompiled | decompile card | card is decompiled |
| a_delay | delay delays delayes delayed | delay card (by {0} turns)? | card is delayed (by {0} turns)? |
| a_disable | disable disables disabled | disable card |  |
| a_reset | reset resets reseted | reset (card | effect) |  |
| a_deal_damage | deal deals dealt | deal {0} DAMAGE_TYPE damage to card |  |
| a_deal_damage | take takes taken | — | card taken {0}? DAMAGE_TYPE? damage |
| a_deal_damage_ahead | ahead | deal {0} DAMAGE_TYPE damage ahead |  |
| a_deal_heart_damage | damage damages damaged | deal {0} heart damage to player | player taken {0} heart damage |
| a_activate_effect | activate activates activated | activate effect | effect is activated |
| a_activate_effect | — | — | any effect is activated |
| a_move | move moves moved send sent sends play plays playes played | (move|add) card to (pos | zone) | card is move (from (pos | zone))? (to (pos | zone))? |
| a_move | — | (move|add) effect to card | effect is move (from card)? (to card)? |
| a_move | — | — | card is removed from (pos | zone) |
| a_draw | draw draws drawn | draw {0} (card|card!)? | player draws ({0} (card|card!)?)? |
| a_draw | — | turn draw {0}? (card|card!)? | player turn draw |
| a_shuffle | shuffle shuffles shuffled | shuffle zone | zone is? shuffled |
| a_add_status_effect | add adds added | add +-{0} CARD_STAT to card |  |
| a_add_status_effect | receive receives received gain gains gained | add EXTENSION to card | card received (+-{0})? CARD_STAT |
| a_add_status_effect | override overrides overriden | override CARD_STAT of card to {0} | CARD_STAT of card is overriden (to {0})? |
| a_add_status_effect | change changes changed | — | (CARD_STAT|stat) of card is changed |
| a_add_status_effect | heal heals healed healing | heal card by {0} | card received healing of {0} |
| a_add_effect | — | add EFFECT_ID to card (override? with EFFECT_MODIFIER)? | card received new? (effect!|EFFECT_ID) |
| a_add_effect_modifier | — | add EFFECT_MODIFIER to effect | effect received EFFECT_MODIFIER |
| a_duplicate_effect | duplicate duplicates duplicated | duplicate effect to card (override? with EFFECT_MODIFIER)? | effect is duplicated |
| a_remove_effect | — | remove effect | effect is removed |
| a_remove_status_effect | — | remove {0} CARD_STAT from card | {0} CARD_STAT is removed from card |
| a_duplicate_card | — | duplicate card to (pos | zone) | card is duplicated (to (pos | zone))? |
| — | — | — | — |


---

## Keyword Categories

The following keyword categories are defined:

- DAMAGE_TYPE
- CARD_STAT
- EXTENSION
- EFFECT_ID
- EFFECT_MODIFIER
- PLAYER_STAT
- EFFECT_TYPE
- EFFECT_SUBTYPE

---

## Statistics

- **Total Actions:** 47
- **Total Keyword Categories:** 8
- **Total Creation Sequence Patterns:** 38
- **Total Intercept Sequence Patterns:** 55

---

*This file was auto-generated. Do not edit manually.*
