
import { data as data_untyped } from "./untyped_sequences"
import { data as data_typed } from "./typed_sequences"
import { KeywordCategory } from "./keyword_categories"
import { CONFIG } from "../core"

export class Match {
    constructor(
        public matched_action : ReadonlyArray<keyof typeof data_typed>,
        public input_sequence : ReadonlyArray<string>,
        public classification_result : {
            tokenIndices : number[][],
            path :(string | string[])[]
        },
        public anchor_positions : number[] = [],
    ){}

    get is_full_match(){
        return this.classification_result.path.length === this.input_sequence.length
    }

    toString(){
        return this.classification_result.path.map(r => Array.isArray(r) ? `[${r.join(" ")}]` : r).join(" ")
    }
}

export function isKeywordCategory(x : any) : x is KeywordCategory {
    return typeof x === "string" && Object.hasOwn(KeywordCategory, x)
}

export class PartialMatch {
    constructor(
        public action_name : ReadonlyArray<string>,
        public matched_anchors : ReadonlyArray<string>,
        public missing_anchors : ReadonlyArray<string>,
    ){}

    get score(){
        return this.matched_anchors.length
    }
}


function match(
    input_sequence : ReadonlyArray<string>, 
    expected_sequence : ReadonlyArray<string>, 
    action_name : ReadonlyArray<keyof typeof data_typed>
) : Match[] | PartialMatch {
    if(CONFIG.VERBOSE) console.log(`Attempting to match input sequence "${input_sequence.join(" ")}" with expected sequence "${expected_sequence.join(" ")}" for action(s) ${action_name.join(", ")}`);
    const anchors = expected_sequence.filter(t => t !== "Obj")

    if(!anchors.length){
        if(CONFIG.VERBOSE) console.warn(`Action ${action_name} with pattern ${expected_sequence.join(", ")} has no anchors, skipping.`);
        return [];
    };

    const potentialMatchesForAnchors = anchors.map(a => {
        const matches = input_sequence.map((t, i) => [t, i] as const).filter(t => t[0] === a)
        return matches.map(m => m[1]) //return indices of matches
    }) //index[][]

    if(potentialMatchesForAnchors.some(arr => arr.length === 0)) {
        const matched_anchors = anchors.filter((_, i) => potentialMatchesForAnchors[i].length > 0)
        const missing_anchors = anchors.filter((_, i) => potentialMatchesForAnchors[i].length === 0)
        return new PartialMatch(action_name, matched_anchors, missing_anchors)
    }; //if any anchor has no match, return no matches  

    const res : number[][] = [] //anchor index[][] but only valid paths
    function travel(anchor_index : number, path : number[] = []){
        if(anchor_index >= potentialMatchesForAnchors.length){
            if(path.length) res.push(path);
            return;
        }

        const current_anchor_indices = potentialMatchesForAnchors[anchor_index]
        const max_index_in_path = path.at(-1) || -1

        for(const index of current_anchor_indices){
            if(index <= max_index_in_path) continue; //skip indices that are not in order
            travel(anchor_index + 1, [...path, index])
        }
    }

    travel(0)

    //return matches
    return res.map(path => {
        const P = [...path]
        let currentAnchorIndex = path[0]
        const res = []
        let temp = []

        let temp_indices : number[] = []
        let tokenIndices : number[][] = []
        for(let i = 0; i < input_sequence.length; i++){
            if(i === currentAnchorIndex){
                if(temp.length) res.push(temp);
                if(temp_indices.length) tokenIndices.push(temp_indices);
                temp = []
                temp_indices = []
                res.push(input_sequence[i])
                tokenIndices.push([i])
                path.shift()
                currentAnchorIndex = path[0]
            } else {
                temp.push(input_sequence[i])
                temp_indices.push(i)
            }
        }
        if(temp){
            res.push(temp)
            tokenIndices.push(temp_indices)
        }
        return new Match(action_name, input_sequence, {
            tokenIndices,
            path : res,
        }, P)
    })
}

export function lookup(sequence : string[], sequence_type : keyof typeof data_untyped){
    const seen = new Set()
    let best_matches : Match[] = []
    let best_anchor_count = 0

    let best_partial_matches : PartialMatch[] = []
    let best_partial_score = 0
    for(const key in data_untyped[sequence_type]){
        const obj = data_untyped[sequence_type][key as keyof typeof data_untyped[typeof sequence_type]] as {seq : string[], action_names : (keyof typeof data_typed)[]} 
        const s = obj.seq as ReadonlyArray<string>
        const matches = match(sequence, s, obj.action_names)

        if(matches instanceof PartialMatch){
            if(seen.has(matches.toString())) continue;
            seen.add(matches.toString())
            if(matches.score > best_partial_score){
                best_partial_matches = [matches]
                best_partial_score = matches.score
            } else if(matches.score === best_partial_score){
                best_partial_matches.push(matches)
            }
            continue;
        }

        console.log(`Matches for pattern ${s.join(", ")}:`)
        console.log(`Found ${matches.length} matches for action(s) ${obj.action_names.join(", ")} wih anchor lengths : ${matches.map(m => m.anchor_positions.length).join(", ")}`)

        for(const m of matches){
            if(seen.has(m.toString())) continue;
            seen.add(m.toString())
            if(m.anchor_positions.length > best_anchor_count){
                best_matches = [m]
                best_anchor_count = m.anchor_positions.length
            } else if(m.anchor_positions.length === best_anchor_count){
                best_matches.push(m)
            }
        }
    }

    return [best_matches, best_partial_matches] as const
}