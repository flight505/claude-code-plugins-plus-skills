# ~/.claude/commands/teach.md

# Usage: /user:teach

# Reviews the current session and teaches programming vocabulary.

# ─────────────────────────────────────────────────────────────────────────────

Look back through this session and identify every place where Jesper described
something in casual/imprecise language that has a proper programming term.

For each one, produce a row in this table:

| What you said                       | Proper term  | What it means                                                    | How to ask next time                            |
| ----------------------------------- | ------------ | ---------------------------------------------------------------- | ----------------------------------------------- |
| "make it work with different types" | **Generics** | Type parameters that let one function/class work with many types | "Add a generic type parameter to this function" |

Then pick the 2-3 most useful terms and expand on each:

### <Term>

**Your words:** <what Jesper actually said>

**The concept:** <plain-English explanation — no jargon in the explanation itself>

**Why the name matters:** <how using this term helps — gets more precise results
from Claude, makes docs/Stack Overflow searchable, communicates with other devs>

**Example usage in a prompt:**

> "<a realistic way to ask for this using the proper term>"

---

Guidelines:

- Only surface terms Jesper didn't already use correctly
- Explain concepts in everyday language — no "a monad is a monoid in the
  category of endofunctors" energy
- Focus on terms that are practically useful for prompting Claude or
  reading documentation, not academic CS terminology
- If Jesper used all the right terms this session, say so — don't invent
  teaching moments that aren't there
