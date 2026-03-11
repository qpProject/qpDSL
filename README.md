# qpDSL (v6)

A Domain-Specific Language for declaring effect texts used in the game Quantum Protocol (hereby refer to as qp).

> **Disclaimer:** Jkong and all parties involved reserved all rights to the original game assets, stories, promotional materials and everything related.

## Overview

qpDSL aims to make effect declarations:

- **Close to natural language** for readability and ease of use for non-programers
- **Hidden from programming complexity** by automatically managing variables, conditions, and bindings
- **Closed to qp main texts**, for now, no Yu-Gi-Oh or Magic keywords

## Design Philosophy

The language makes key sacrifices to achieve its natural language goals:

- No manual variable declarations; all bindings are automatic
- Automatic "dumb" bindings using a simple back-reference heuristic (references bind to the last variable of the specified type, or the last variable if no type is specified)
- No nested conditionals
- No loops
- All required metadata elements are reserved in a dedicated metadata space, keeping the "code" space clean

## Effects Structure

In qp, effects consist of:

- **Metadata**: Internal variables (numbers) and type/subtype information
- **Statements**: The "text" portion divided into:
  - Target declarations (which cards/positions/zones to affect)
  - Action statements (what to do with the targets)

Each statement can have an optional condition attached.

### Simple Example

```txt
Target 1 level 1 fruit card on the field. If it has counters, move it to grave.
```

This declares:

1. A target statement selecting 1 level-1 fruit card
2. An action statement moving the targeted card to the grave (with a counter condition)

## Full Syntax Reference

For complete syntax documentation, grammar rules, and action specifications, see [syntax.md](syntax.md).

## Project Structure

```txt
qpDSL/
├── README.md              # This file
├── syntax.md              # Complete syntax specification
├── package.json           # Project metadata
├── tsconfig.json          # TypeScript configuration
├── Lexer/
│   └── index.ts           # Lexer implementation
└── Parser/
    ├── index.ts           # Parser implementation
    ├── ActionsRegistry.ts # Action definitions
    └── IDClassifier.ts    # Identifier classification
```

## Getting Started

1. Review the [syntax.md](syntax.md) file for the complete language specification
2. Explore the `Lexer/` and `Parser/` directories for implementation details
3. Check the effect examples above to understand common patterns

---

For detailed grammar rules, token definitions, statement structures, and action specifications, please refer to [syntax.md](syntax.md).
