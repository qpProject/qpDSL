# qpDSL syntax

A qpDSL program consist of many **Effect declares**.

## Effect Declares

Effect declares include a **Meta data** and an **Sentences** portion. Separated by the colon (```:```)

## Meta data portion

Effect metadata begins with the effect name prefixed with `e_` (e.g., `e_apple`, `e_katana`).

After the name comes a string of **Meta data**, separated by dots to simulate file extensions.

**Meta data** can be:

| Category | Description | Examples |
|----------|-------------|----------|
| Archtype | Any string | fruit, hana, ... |
| Effect type | The main type of that effect | init, passive, trigger, death, lock |
| Effect subtypes | Any additional modifiers | unique, once, chained, delayed, hard unique, bonded |

**Examples** of meta data:

```txt
e_apple.fruit.init : ...(Sentences here)
e_test.hand.passive.unique.once : ...(Sentences here)
```

## Sentences portion

An effect in qpDSL operated on the principle of:

1. Check a condition
2. Create other actions if condition is met

Thus we have 2 main sentence types, **Condtion Sentences** and **Action Sentences**.

> Sentences dont have to be separated by anything but we encouraged either comma (```,```) or dot (```.```) with a space afterwards.

### Condition Sentences

To specify a condition, we use an *if* or an *unless* sentence:

```ts
if/when/whever/before/after ...(Actual condition)
```

```ts
unless ...(Actual condition)
```

or an *else* sentence that binds to the nearest *if*

```ts
else ...(Actual condition)
```

### Action Sentences

To create an action, we follow each action's specific creation syntax, for example:

```txt
draw 2
```

for draws

or

```txt
move 1 green card to pos
```

Actions can be followed by *instead* to indicate an automatic negation of the current condition (if any).

This is done to facilite replacement effects like:

```txt
if this card is moved to grave, void it instead.
```

## Sentence formats

Refer to [the sequences file](SEQUENCES.md) for all available formats for both *Action* and *Condition* sentence.

## Targets

Actions acts upon targets

Targets have types, which can be either:

1. Card
2. Effect
3. Zone
4. Position
5. Player

To specify a target, you can either **Specify a new target**, **Use a back reference** or **Use this specifier**

### Specify a new target

