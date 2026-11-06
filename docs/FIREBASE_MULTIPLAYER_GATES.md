# Arcade multiplayer rollout guard

Online multiplayer is intentionally **disabled**. The client requires both a valid Firebase config and an explicit J_ARCADE_MULTIPLAYER_ENABLED = true opt-in. This is a feature guard, not authorization.

The tracked Firebase Realtime Database Rules file is deny-by-default and must remain in place until real host/guest UID ownership, room membership, score-write constraints, field validation and expiry are implemented and tested in Firebase Emulator. A browser-side slot check cannot enforce database access.

Before enabling production: implement ownership rules and Firebase Emulator tests for unauthorized room creation/modification/removal, unauthorized scores, duplicate guest joins and concurrent transactions; replace the current get-then-update guest join with a transaction. Consider server validation for scores, App Check, room expiry and clean-up. Test against the actual deployed database rules, not only this draft. Do not flip the opt-in until all checks pass.
