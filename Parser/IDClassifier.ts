
export class IDClassifierClass<T extends string = never>  {
    private storage = [] as {
        category : T,
        pattern : string, //space joined strings
    }[]

    private allCats : string[] = ["ID"]

    private maxLookAhead = 0

    register<K extends string>(name : string, ...contents : string[]){
        this.storage.push(...contents.map(
            s => {
                const pattern = s.replace(/\s+/, " ").trim()
                const count_space = s.split(" ").length
                this.maxLookAhead = Math.max(count_space, this.maxLookAhead)
                return {
                    category : name as T,
                    pattern
                }
            }
        ))
        this.allCats.push(name)
        return this as IDClassifierClass<T | K>
    }

    private sorted = false
    private sortStorage(){
        if(this.sorted) return this.storage;
        this.storage.sort((a, b) => b.pattern.length - a.pattern.length);
        this.sorted = true;
        return this.storage
    }

    //classify word[] into a array of paritions, default is ID if nothing matched
    //allows tokens with more words to still work
    classify(...ids : string[]) : {
        str : string,
        category : T | "ID"
    }[] {
        if(!ids) return [];
        const sorted = this.sortStorage()

        const res = [] as {
            str : string,
            category : T | "ID"
        }[]

        let i = 0
        outer : while(i < ids.length){
            //tries to classify using stride x in [maxLookAhead, maxLookAhead-1, ..., 0]
            for(let stride = this.maxLookAhead; stride > 0; stride--){
                const checkStr = ids.slice(i, i + stride).join(" ");
                let attempt;
                for(const registered of sorted){
                    if(registered.pattern.length > checkStr.length) continue;
                    if(registered.pattern === checkStr){
                        attempt = registered;
                        break;
                    }
                    if(registered.pattern.length < checkStr.length) break;
                }
                if(attempt){
                    res.push({str : attempt.pattern, category : attempt.category})
                    i = i + stride + 1
                    continue outer
                }
            }

            //no match, was an ID
            res.push({str : ids[i], category : "ID"})
            i++
        }

        return res
    }

    classifyIntoGroups(...ids : string[]){
        const res = Object.fromEntries(this.allCats.map(c => [c, [] as string[]])) as Record<T | "ID", string[]>
        for(const E of this.classify(...ids)){
            res[E.category].push(E.str)
        }
        return res
    }

    is(str : string, category : T | "ID"){
        const attempt = this.classify(str)[0]
        return attempt.category === category
    }
}

export const IDClassifier = new IDClassifierClass()
.register("effect_type", "passive", "trigger", "init", "death")
.register("effect_subtype", "chained", "delayed", "once", "unique", "hard unique", "bonded", "storage")
.register("card_rarity", "white", "green", "blue", "red", "artifact")
.register("pos_flag", "empty", "covered", "exposed")
.register("zone_name", "field", "deck", "grave", "hand")
.register("pos_property", "row", "col", "column", "x", "y")
.register("card_property", "atk", "hp", "counters", "counter")
.register("directions", "left", "right", "up", "down")
.register("damage_type", "physical", "magic", "heart")

