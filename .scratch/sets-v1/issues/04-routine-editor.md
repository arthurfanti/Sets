# 04: Routine editor and custom Exercises

**What to build:** Writing your own training plan, including Exercises the app does not ship with. Create, reorder, edit and delete a User Routine with prescribed sets and reps; pick Exercises from a searchable picker; create, rename and hide your own Exercises from inside that picker; and editing a Built-in Routine forks a copy rather than mutating the seed.

**Blocked by:** 03

**Status:** ready-for-agent

- [ ] A Routine can be created, renamed, saved, edited and deleted, and survives a reload.
- [ ] Rows can be reordered; each row shows sets, reps and an optional target weight.
- [ ] The picker searches by name and alias, groups by muscle in the fixed order, and reaches any group within one scroll.
- [ ] Editing a Built-in Routine produces a User Routine copy; the Built-in is unchanged afterwards.
- [ ] Searching a name that matches nothing offers a create row prefilled with what was typed; the creation sheet requires a group choice and has no default.
- [ ] A duplicate normalized name blocks creation and offers the existing Exercise; a near match only warns.
- [ ] Renaming a custom Exercise updates its label everywhere, including past Sets.
- [ ] Hiding a custom Exercise removes it from the picker while its history still renders; Built-in Exercises cannot be renamed or hidden.
- [ ] Picker rows and sheet controls meet the 48px minimum target and expose labels to assistive technology.
