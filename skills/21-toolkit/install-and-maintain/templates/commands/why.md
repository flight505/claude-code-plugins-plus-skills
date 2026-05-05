# ~/.claude/commands/why.md

# Usage: /user:why

# Surfaces the reasoning behind the last significant decision made in this session.

# ─────────────────────────────────────────────────────────────────────────────

Look back at the most recent non-trivial decision you made in this session —
a choice about architecture, structure, library, data shape, or approach.

If you already output a Decision block for it, expand it further.
If you skipped it, produce the full block now:

```
## Decision: <one-line label>
**Chose:** <what you did and the core reason>
**Rejected:** <1–2 alternatives and why they lost>
**Concept:** <the underlying pattern or principle worth knowing>
**Go deeper:** <one resource or search term if Jesper wants to study this further>
```

Be concrete. Don't say "it's more idiomatic" — say _why_ it's more idiomatic
and what problem the idiom is solving. Don't say "better performance" — give
an order-of-magnitude or name the specific bottleneck avoided.

If the last operation was purely mechanical (rename, format, move), look further
back in the session for the last real decision and explain that instead.
