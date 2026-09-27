---
"@litsx/urql": patch
---

Keep query, mutation, and subscription observers in contextual LitSX refs so SSR hydration serializes only their JSON-compatible state snapshots.
