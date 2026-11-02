# Weight is stored as a bare number in kilograms

A Set records `weight` as a plain number meaning kilograms. There is no unit field per Set, no unit on the Routine prescription, and no conversion anywhere. Deferring pounds is cheap until the first Set is stored, because retrofitting a unit means a migration that has to guess what every historical number meant. Recorded because a reader looking at `{weight: 100}` will otherwise assume the omission was an oversight rather than a deliberate refusal to support two units in v1.
