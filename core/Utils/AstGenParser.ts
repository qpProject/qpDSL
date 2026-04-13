import { ConsumeMethodOpts, EmbeddedActionsParser, IToken, TokenType, ParserMethod } from "chevrotain";
import type { ASTNode } from "../types";
import { Context } from "./Context";

export abstract class AstGenParser extends EmbeddedActionsParser {
    get isBounded() : boolean {
        return false
    }

    protected SUBRULE_THEN_PUSH<T>(array : T[], rule : ParserMethod<any, T>, options?: ConsumeMethodOpts) : void {
        const R = this.SUBRULE(rule, options)
        this.ACTION(() => array.push(R))
    }

    protected override consume(idx: number, tokType: TokenType, options?: ConsumeMethodOpts): IToken {
        const res = super.consume(idx, tokType, options)
        this.ACTION(() => {
            //push to all
            for(const arr of this.tokenConsumed){
                arr.push(res)
            }
        })
        return res
    }
    protected override CONSUME(tokType: TokenType, options?: ConsumeMethodOpts): IToken {
        return this.consume(0, tokType, options)
    }
    protected override CONSUME1(tokType: TokenType, options?: ConsumeMethodOpts): IToken {
        return this.consume(1, tokType, options)
    }
    protected override CONSUME2(tokType: TokenType, options?: ConsumeMethodOpts): IToken {
        return this.consume(2, tokType, options)
    }
    protected override CONSUME3(tokType: TokenType, options?: ConsumeMethodOpts): IToken {
        return this.consume(3, tokType, options)
    }
    protected override CONSUME4(tokType: TokenType, options?: ConsumeMethodOpts): IToken {
        return this.consume(4, tokType, options)
    }
    protected override CONSUME5(tokType: TokenType, options?: ConsumeMethodOpts): IToken {
        return this.consume(5, tokType, options)
    }
    protected override CONSUME6(tokType: TokenType, options?: ConsumeMethodOpts): IToken {
        return this.consume(6, tokType, options)
    }
    protected override CONSUME7(tokType: TokenType, options?: ConsumeMethodOpts): IToken {
        return this.consume(7, tokType, options)
    }
    protected override CONSUME8(tokType: TokenType, options?: ConsumeMethodOpts): IToken {
        return this.consume(8, tokType, options)
    }
    protected override CONSUME9(tokType: TokenType, options?: ConsumeMethodOpts): IToken {
        return this.consume(9, tokType, options)
    }

    private tokenConsumed : IToken[][] = []
    beginRecordTokens() : void {
        this.tokenConsumed.push([])
    }
    endRecordTokens() {
        return this.ACTION(() => {
            const res = this.tokenConsumed.pop() || []
            return {
                first : res[0],
                last : res[res.length - 1],
                all : res,
                raw : res.length ? Context.raw.slice(res[0].startOffset, res[res.length - 1].endOffset! + 1) : "",
            }
        }) || {
            first : undefined,
            last : undefined,
            all : [],
            raw : "",
        }
    }
}