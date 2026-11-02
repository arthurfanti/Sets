# Workout Tracking App

A personal strength-training log for one lifter, used on a phone during a session. It exists so sets can be recorded in seconds and progress over time can be seen without a spreadsheet.

UI copy is **pt-BR**. The English term is the canonical name used in code, docs and tickets; the pt-BR word is the only label that appears on screen. Neither drifts to a synonym.

## Language

**Exercise**:
A movement that can be performed and recorded, such as Supino Reto or Agachamento.
_pt-BR_: Exercício
_Avoid_: Movement, lift, movement pattern / Movimento, aparelho

**Routine**:
A reusable, named, ordered plan of Exercises with prescribed Sets. A Session is always started from one.
_pt-BR_: Rotina
_Avoid_: Workout, program, template, split, treino, ficha, divisão

**Built-in Routine**:
A Routine that ships with the app. It can be started or hidden, but editing it produces a User Routine instead.
_pt-BR_: Rotina pronta
_Avoid_: Default routine, preset, system routine

**User Routine**:
A Routine created on the device, or forked from a Built-in Routine. Freely editable and deletable.
_pt-BR_: Minha rotina
_Avoid_: Custom routine, my routine, copy, rotina personalizada

**Session**:
One dated instance of training. It is normally started from a Routine and copies that Routine's prescription as its Plan; an empty Session started from no Routine has no Plan. It records the Sets actually performed.
_pt-BR_: Sessão
_Avoid_: Workout, training day, log entry, treino, dia de treino

**Plan**:
The ordered Exercises and prescribed Sets a Session inherits from its Routine. Distinct from the Sets actually performed.
_pt-BR_: Plano
_Avoid_: Template, schedule, agenda, roteiro

**Set**:
One recorded effort within a Session: an Exercise, a weight, and a rep count.
_pt-BR_: Série
_Avoid_: Rep scheme, entry, record, repetição solta

**Best Set**:
The Set in an Exercise's history with the highest estimated one-rep max. Sets outside 1–10 reps are recorded but can never be a Best Set.
_pt-BR_: Melhor série
_Avoid_: PR, record, top set, personal best, recorde

**Carga**:
The weight of a Set, in kilograms. A bare number; there is no unit stored per Set.
_pt-BR_: Carga
_Avoid_: Weight, load, peso, plate count

**Lifter**:
The single person whose training history the app holds. Addressed in copy as _você_.
_pt-BR_: você
_Avoid_: User, account, athlete, member, usuário, atleta

## Banned in both languages

**Treino** — means both Routine and Session, so it names nothing. Same reason **workout** is banned. Use **Rotina** or **Sessão**.
