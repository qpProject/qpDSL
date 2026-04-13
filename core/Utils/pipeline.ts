import type { CstNode, CstParser, ICstVisitor, ILexingError, IRecognitionException, IToken, Lexer } from "chevrotain";
import type { ASTNode } from "../types";
import type { ASTError } from "../error";
import type { AstGenParser } from "./AstGenParser";
import * as ERR from "../error"
import { Context } from "./Context";
import { getTokenStream } from "./CstUtils";
import { CONFIG } from "./config";

export interface Pipeline<T_in = any, T_out = any> {
    accept(context : any) : boolean;
    pipe(context : T_in) : T_out;
}

export class Pipeline {
    static from<T_in, T_out>(
        accept : (context : any) => context is T_in,
        ...funcs : (Pipeline<any, any> | ((context : any) => any))[]
    ) : Pipeline<T_in, T_out>{
        return {
            accept,
            pipe(context : T_in){
                return funcs.reduce((acc, f) => Pipeline.exec(acc, f), context) as any as T_out
            }
        }
    }

    static LexParseAST<
        T_Parser extends AstGenParser,
        //Note : Idk why i have to do infer _ extends CstNode instead of saying ctx IS an CstNode itself?
        // the latter approach DOES NOT WORK for some cursed reason
        // I am too afraid to look up why
        T_top_level_rule extends keyof {
            [K in keyof T_Parser as T_Parser[K] extends ((...p : any) => ASTNode | ASTNode[] ) ? K : never]: any  
        },
        T_out extends ASTNode | ASTNode[] = T_Parser[T_top_level_rule] extends ((...p : any) => (infer Ret extends ASTNode | ASTNode[])) ? Ret: never,
    >(
        lexer : Lexer, 
        parser : T_Parser, 
        rule : T_top_level_rule,
        lexError : new (token : ILexingError) => ASTError = ERR.UnknownLexerError,
        preprocessor? : ((s : string) => string) | Pipeline<string, string>
    ){
        const res : Pipeline<string, T_out> = {
            accept(context) {
                return typeof context === "string" && (!preprocessor || !(preprocessor instanceof Pipeline) || preprocessor.accept(context))
            },
            pipe(s) {
                if(preprocessor){
                    if(preprocessor instanceof Pipeline){
                        s = Pipeline.exec(s, preprocessor)
                    } else {
                        s = preprocessor(s)
                    }
                }
                Context.raw = s

                const tokenStream = lexer.tokenize(s);
                if(tokenStream.errors.length > 0 && lexError){
                    throw Context.error( new lexError(tokenStream.errors[0]) )
                }
                
                if(!parser.isBounded){
                    throw Context.error( new Error("Parser must be bounded") )
                }

                parser.input = tokenStream.tokens;
                if(CONFIG.VERBOSE) console.log("Token stream for parser:", getTokenStream(parser as any));
                return (parser[rule] as () => T_out)() as T_out
            },
        }

        return res
    }

    static lex(lexer : Lexer, lexerError? : new () => ASTError){
        const res : Pipeline<string, IToken[]> = {
            accept(context) {
                return typeof context === "string"
            },
            pipe(s) {
                Context.raw = s
                const tokenStream = lexer.tokenize(s)
                if(tokenStream.errors.length > 0 && lexerError){
                    throw Context.error( new lexerError() )
                }
                return tokenStream.tokens
            },
        }
        return res
    }

    static exec<T_in, T_out>(input : T_in, p : (Pipeline<T_in, T_out> | ((context : T_in) => T_out))) : T_out {
        if(CONFIG.VERBOSE) console.log("Executing pipeline with input:", input);
        if(typeof p === "function") return p(input);
        if(!p.accept(input)) {
            if(CONFIG.VERBOSE) console.log("Pipeline rejected context:", input);
            console.log("Offending pipeline:", {
                accept : p.accept.toString(), 
                pipe: p.pipe.toString()
            })
            throw Context.error( new Error("Pipeline rejected context") )
        }
        return p.pipe(input)
    }

    static pipe<T_in, T_out, T_next>(p : Pipeline<T_in, T_out>, f : Pipeline<T_out, T_next> | ((p : T_out) => T_next)) : Pipeline<T_in, T_next>{
        const res : Pipeline<T_in, T_next> = {
            accept(context) {
                return p.accept(context)
            },
            pipe(context) {
                const out = p.pipe(context)
                if(typeof f === "function") return f(out);
                if(!f.accept(out)) throw Context.error( new Error("Unknown pipe result") )
                return f.pipe(out)
            }
        }
        return res
    }

    static unshiftOnto<T_in, T_out, T_val>(p : Pipeline<T_in, T_out>, val : T_val) : Pipeline<T_in, [T_val, T_out]>{
        const res : Pipeline<T_in, [T_val, T_out]> = {
            accept(context) {
                return p.accept(context)
            },
            pipe(context) {
                const out = p.pipe(context)
                return [val, out]
            }
        }
        return res
    }
}


