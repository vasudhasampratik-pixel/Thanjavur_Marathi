# Grammar Logic Deduced from the Corpus

## 1. Default word order is not English order

Your corpus strongly shows **verb-final / copula-final** behavior.

### Examples
- **ST048:** `ghar chumna aahe`
- **ST070:** `wall pandra aahe`
- **ST058:** `bag wall-a kada aahe`
- **ST059:** `paani matki aant aahe`

### Rule
For most new sentences, **do not keep English order**.

Use:
- `noun + adjective + copula`
- `subject + object + verb`
- `subject + location + copula`
- `time + subject + object + verb`
- `location + noun + copula` for existence

---

## 2. Articles should be dropped

Your data supports dropping:
- `a`
- `an`
- `the`

### Examples
- “The house is small” → `ghar chumna aahe`
- “The wall is white” → `wall pandra aahe`

### Rule
Ignore English articles completely.

---

## 3. "Is / are / am" usually move to the end

This is one of the clearest patterns.

### Examples
- **ST048:** `house + small + aahe`
- **ST076:** `food + hot + aahe`
- **ST155:** `road + long + aahe`
- **ST331:** `this + good + aahe`

### Rule
If sentence is:
- `noun + is + adjective`
- `noun + is + location`
- `noun + is + state`

Then output should usually end in:
- `aahe` for singular / non-human / default
- a human plural / honorific copula for people, if needed

---

## 4. Location phrases become postpositional

English prepositions are not staying in English position.

### Examples
- **ST059:** `matki aant` = in the pot
- **ST062:** `room-aant dust aahe`
- **ST067:** `ghar-a bahir aahe`
- **ST116:** `untroon-a var nijto`
- **ST514:** `bhoi-var aahe`

### Rule
Convert English prepositions into noun-attached phrases:
- `in` → `-aant`
- `on` → `-var`
- `to` → `-aala`
- `near / beside` → `-kada` or `baaju`
- `after` → `-nantara`
- `before` → `puda`
- `with` → `boror`
- `from` → `-sooon` or equivalent source form

So for new sentences, detect the relation first, then attach it to the noun.

---

## 5. "How many / how much" are single units

Your corpus is very clear here.

### Examples
- **ST358:** `kevda paani aahe?`
- **ST359:** `kevda lok aale?`
- **ST174:** `ye kavda?`

### Rule
Never split:
- `how + many`
- `how + much`

Map them as one unit:
- `kevda / kavda`

This is a top-priority rule.

---

## 6. Yes/no questions are mostly statement order + final question marker

### Examples
- **ST017:** `besh jhevlis ka?`
- **ST018:** `tu boror ahes ka?`
- **ST171:** `village baaju aahe ka?`
- **ST362:** `to ghar-aant aahe ka?`

### Rule
For yes/no questions:
- do **not** preserve English auxiliary-first order
- build the normal statement first
- then add `ka` at the end

### Examples
- “Did you eat?” → `past predicate + ka`
- “Is he at home?” → `location statement + ka`

---

## 7. English do-support should usually disappear

### Examples
- “Did you eat?” → no separate translation of `did`
- “Do you understand?” → no separate translation of `do`
- “Did she eat?” → verbal form + `ka`

### Rule
Drop English helper verbs:
- `do`
- `does`
- `did`

Keep only:
- tense
- polarity
- question-ness

---

## 8. Imperatives are object-first

### Examples
- **ST050:** `kavaad ugade`
- **ST056:** `chair aane`
- **ST091:** `paatra ghaanse`
- **ST201:** `tujha pustak ugade`

### Rule
For commands:
- object first
- verb after it

### Examples
- “Open the door” → `door + open`
- “Bring the chair” → `chair + bring`
- “Wash the vessel” → `vessel + wash`

---

## 9. "Please" creates a polite imperative template

### Examples
- **ST008:** `daya karun aant ye`
- **ST074:** `daya karun mala paani de`
- **ST372:** `daya karun yeta ye`
- **ST740:** `daya karun khidki kada baise`

### Rule
If sentence starts with “please”:
- use `daya karun`
- then generate imperative structure
- then apply casual / respectful verb ending

---

## 10. Respect changes verb endings, not just pronouns

This is a major pattern.

### Examples
- `come:` `ye` vs `yaant`
- `sit:` `baise` vs `basaant`
- `give:` `de` vs `dyaant`
- `open:` `ugade` vs `ugadaant`

### Rule
Respect mode must change:
- pronoun
- possessive
- imperative ending
- question verb form
- past question agreement

So your engine needs a **profile layer**, not just word replacement.

---

## 11. You need separate verb paradigms, not one translation per verb

Your data clearly distinguishes:
- first person female
- first person male
- second person female
- second person male
- elder respectful
- third person
- plural

### Examples
- **ST097:** `uthte / uthto`
- **ST115:** `balaavte / balaavto`
- **ST017:** `jhevlis / jhevlas / jhevlaant`
- **ST147:** `jaat-ahesa / jaatos / jaataant`

### Rule
Every verb entry should store forms by:
- person
- number
- gender
- respect
- tense / aspect
- imperative polarity

Without that, future sentences will still break.

---

## 12. Progressive uses verb + ongoing marker + final copula

### Examples
- **ST035:** `nijat aahe`
- **ST083:** `karat-aahein`
- **ST085:** `karat-aahe`
- **ST405:** `livt-aahein`
- **ST528:** `vhaadat-aahe`

### Rule
If English contains `is/are/am + verb-ing`:
- place object before verb if present
- use progressive verb form
- keep auxiliary at end

### Examples
- “He is making tea” → `he + tea + making-progressive`
- “We are writing” → `we + writing-progressive`

---

## 13. Past often places time before verb

### Examples
- **ST037:** `kaale aale`
- **ST132:** `ami kaale aalon`
- **ST447:** `tina lokar aali`
- **ST558:** `dupara puda aala`

### Rule
Past template:
1. subject
2. time expression
3. object / location if any
4. past verb

---

## 14. Future is not literal "will"

### Examples
- **ST038**
- **ST096**
- **ST133**
- **ST145**
- **ST454**
- **ST497**

### Rule
Do not translate `will` as a separate word.

Instead choose a future or future-like verb form.

---

## 15. Dative / experiencer logic is essential

This is one of the strongest non-English patterns in your corpus.

### Examples
- **ST072:** `mala bhook laagta`
- **ST073:** `mala thaan laagta`
- **ST082:** `lenkr-aala doodh pajhe`
- **ST172:** `mala bhaaji pajhe`
- **ST179:** `amaala bhaat pajhe`
- **ST222:** `mala aaje kaam aahe`
- **ST248:** `tila jaera aahe`
- **ST329:** `mala ye avadta`

### Rule
For these English meanings, do **not** use normal English subject structure:
- want
- need
- like
- hungry
- thirsty
- have work
- have fever
- have pain

Use an experiencer template:
- `to-me / to-him / to-her / to-us + state/object + predicate`

This is mandatory.

---

## 16. "Have" is not one single pattern

Your dataset shows multiple `have` behaviors.

### Possession / burden / obligation
- **ST222:** `mala aaje kaam aahe`
- **ST223:** `tala dande kaam aahe`
- **ST591:** `amaans uja exam aahe`

### Need / want
- **ST172:** `mala bhaaji pajhe`
- **ST179:** `amaala bhaat pajhe`

### Illness / state
- **ST248:** `tila jaera aahe`
- **ST249:** `tala padasa aahe`

### Rule
Split English `have` into at least 3 semantic families:
- possession / having
- need / desire
- illness / state

Do not translate all `have` sentences the same way.

---

## 17. Identity sentences often drop the copula

### Examples
- **ST022:** `ye majha baapa`
- **ST023:** `ye majha amma`
- **ST047:** `ye amcha ghar`
- **ST004:** `majha naav Ravi`

### Rule
For:
- “This is my father”
- “My name is Ravi”
- “This is our house”

Use an identity template, often with no final copula.

---

## 18. Fixed expressions should bypass grammar generation

### Examples
- How are you?
- What is your name?
- Where are you from?
- Nice to meet you.
- Thank you.
- Sorry.
- Goodbye.

### Rule
Create a fixed-expression table first.

Do not generate these from word-level logic.

---

## 19. Negative declaratives usually put negation near the predicate

### Examples
- **ST095:** `khaala nahi`
- **ST226:** `sampal-nahi`
- **ST247:** `bara nahi`
- **ST269:** `nirambal nahi`
- **ST330:** `avadta-nahi`

### Rule
For negative statements:
- generate the normal predicate
- add `nahi` after it, or in the lexicalized predicate form

---

## 20. Negative imperatives are special forms

### Examples
- **ST384:** `varduko`
- **ST385:** `paluko`
- **ST646:** `ekat jaauko`
- **ST508:** `pustaka visruko`

### Rule
If English is:
- do not run
- do not shout
- do not forget

Use a dedicated prohibitive form, not `not + verb`.

---

## 21. Wh-questions need templates, not one universal rule

Your corpus shows multiple structures.

### Name
- **ST003:** `tujha naav kaay?`

### What is this/that
- **ST347:** `ye kaay?`
- **ST348:** `te kaay?`

### Who is he/she
- **ST349**
- **ST350**

### Where is X
- **ST351**
- **ST352**

### When did/will
- **ST353**
- **ST354**

### Why
- **ST355**
- **ST356**
- **ST639**

### Which
- **ST360**
- **ST361**

### How
- **ST357**

### Rule
Build separate templates for:
- `what-is`
- `who-is`
- `where-is`
- `when-past`
- `when-future`
- `why-state`
- `why-past`
- `which-one`
- `how-many/how-much`

---

# The practical engine you should build

## Step 1: Normalize your dataset

Create canonical forms for:
- `aahe`
- human plural copula
- respectful copula
- pronouns
- possessives
- locative markers
- respectful verb endings

Also mark low-quality rows as `do not learn from`.

---

## Step 2: Classify every sentence into a sentence family

Use these buckets:
- fixed expression
- identity
- description
- location
- existence
- possession
- need / want
- experiencer state
- habitual action
- progressive action
- past action
- future action
- yes/no question
- wh-question
- imperative
- polite imperative
- negative declarative
- negative imperative

This is the main logic layer.

---

## Step 3: Use template routing for new sentences

### Routing rules
- If English has `please` → route to **polite imperative**
- If English has `how many / how much` → route to **quantity question template**
- If English has `there is / there are` → route to **existential template**
- If English has `want / need / like / hungry / thirsty / fever / pain / have work` → route to **experiencer template**
- If English has `is/are/am + adjective` → route to **description template**
- If English has `is/are/am + location` → route to **location template**
- If English has `verb-ing` → route to **progressive template**
- If English starts with `do/did/does/can/shall/should/is/are` and ends as a question → route to **yes/no or modal question template**
- If English starts with `what/where/when/why/who/which/how` → route to **wh-question subtemplate**
- Otherwise → use **SOV default**

---

## Step 4: Inflect after template selection

This must happen last.

You need verb forms for:
- 1st singular female
- 1st singular male
- 2nd singular female
- 2nd singular male
- respectful 2nd
- 3rd singular
- plural
- imperative casual
- imperative respectful
- prohibitive
- progressive
- past
- future

This is more important than adding more vocabulary.

---

# Highest-confidence grammar rules

If you implement only these, output quality will improve fast:
- Drop articles
- Keep multi-word question units together
- Move copula to sentence end
- Convert English prepositions into postpositions
- Use SOV order for action sentences
- Use object-first order for imperatives
- Add `ka` at end for yes/no questions
- Drop English do-support
- Use dative / experiencer templates for want / need / hunger / like / have
- Use separate respectful verb endings
- Keep identity sentences separate from description sentences
- Keep fixed phrases separate from generated phrases

---

# What you cannot reliably do yet

With this corpus alone, you cannot guarantee grammatical output for:
- long compound sentences
- embedded clauses
- passive voice
- rare idioms
- unseen verbs without conjugation tables
- sentences whose examples in your corpus are themselves inconsistent

But for simple and medium sentences like your dataset, this logic is enough to build a strong grammar engine.

---

# My blunt recommendation

Do not try to generalize from raw sentence pairs directly.

Instead, convert your corpus into:
- lexicon
- verb paradigm tables
- sentence-family labels
- template rules
- exception / fixed phrase table

That is the shortest path to “future new sentence gives grammatical output.”

---

# Relabel the corpus into template categories

The clean way to do it is to relabel your corpus into **primary template categories** plus **secondary tags**.

## Recommendation

Give each row:
- `primary_template` = the main grammar pattern
- `secondary_tags` = extra features like `negative`, `polite`, `respectful`, `dative`, `time_phrase`, `location_phrase`

That will make future sentence routing much more accurate than a flat dictionary.

---

# 1) Primary template categories for your corpus

## T01 — `fixed_formula`
Use for memorized social phrases, not compositional grammar.

### Examples
- **ST001** How are you?
- **ST003** What is your name?
- **ST005** Nice to meet you.
- **ST008** Please come in.
- **ST009** Please sit down.
- **ST010–ST016**
- **ST122** What time is it?

### Why
These should be stored as direct templates or phrase-table entries.

---

## T02 — `identity_equative`
**Pattern:** `X is Y` where `Y` is identity, kinship, label, or name.

### Examples
- **ST004** My name is Ravi.
- **ST022–ST029** This is my father/mother/...
- **ST047** This is our house.
- **ST335** He is a good man.
- **ST347–ST350** What is this? / Who is he?

### Output tendency
Often no overt final copula or a very reduced equative pattern.

---

## T03 — `predicate_adjective_copula`
**Pattern:** `NOUN + ADJECTIVE + COPULA`

### Examples
- **ST002** I am fine.
- **ST018** Are you well?
- **ST030–ST031**
- **ST033–ST034**
- **ST048–ST049**
- **ST052–ST054**
- **ST060–ST064**
- **ST070–ST071**
- **ST076–ST081**
- **ST086–ST088**
- **ST125–ST131**
- **ST155–ST159**
- **ST167–ST168**
- **ST175**
- **ST182–ST183**
- **ST189–ST192**
- **ST208–ST209**
- **ST212–ST213**
- **ST234–ST235**
- **ST263–ST264**
- **ST272–ST296**
- **ST321–ST345**
- **ST421–ST445**
- **ST471**
- **ST523–ST525**
- **ST560**
- **ST579**
- **ST611**
- **ST633–ST637**
- **ST663–ST672**
- **ST744**
- **ST746**

### Why
This is one of your biggest categories.

---

## T04 — `location_copula`
**Pattern:** `NOUN + LOCATION/POSTPOSITION + COPULA`

### Examples
- **ST040** My parents are at home.
- **ST058** The bag is near the wall.
- **ST059** Water is in the pot.
- **ST066** The child is inside the house.
- **ST067** The dog is outside the house.
- **ST171** Is the village near?
- **ST197** The children are in school.
- **ST294** The crow is on the tree.
- **ST351–ST352** Where is the book/bag?
- **ST362–ST363**
- **ST483**
- **ST504**
- **ST514**
- **ST518**
- **ST625**
- **ST629**

### Why
This is separate from plain description because English prepositions become postpositions.

---

## T05 — `existential_there_is`
**Pattern:** `there is / there are / contained existence`

### Examples
- **ST062** There is dust in the room.
- **ST303** The well has water.
- **ST358** How much water is there?
- **ST359** How many people came?
- **ST500** The water pot is empty.

### Why
Dummy English `there` should not be translated literally.

---

## T06 — `possession_have`
**Pattern:** `X has Y` meaning possession / availability / burden.

### Examples
- **ST187** Do you have change?
- **ST222** I have work today.
- **ST223** He has a lot of work.
- **ST248** She has a fever.
- **ST249** He has a cold.
- **ST591** We have an exam tomorrow.
- **ST699** We need a torch.
- **ST702** I have no cash now.

### Why
This is not ordinary English `have`; it behaves like dative / possessive existence.

---

## T07 — `experiencer_state_dative`
**Pattern:** `to-me / to-him + state/object + predicate`

### Examples
- **ST072** I am hungry.
- **ST073** I am thirsty.
- **ST082** The child wants milk.
- **ST172–ST181** I want... / We need...
- **ST247** I am not well.
- **ST250–ST252** body pain
- **ST265** He cannot walk properly.
- **ST266** She should eat well.
- **ST322** I am happy.
- **ST324–ST330** emotions / liking
- **ST341–ST345** tired / ready-type states
- **ST464** I want to learn more.
- **ST466–ST467** necessity
- **ST522** The rice needs more water.
- **ST527** He wants another chapati.
- **ST543** We need more firewood.
- **ST605** She has a headache.
- **ST714** I need help right now.
- **ST717** The child has a high fever.
- **ST722** Do not worry too much.
- **ST730–ST731** remember / recall
- **ST734** I need some quiet time.
- **ST738** The old woman needs support.

### Why
This is the other huge category. It must be separate.

---

## T08 — `simple_action_habitual`
**Pattern:** plain present / habitual / routine action, usually SOV.

### Examples
- **ST032** We live together.
- **ST039** My cousin studies in town.
- **ST041** My brother cooks well.
- **ST097–ST121** daily routine block
- **ST141–ST142**
- **ST146** Time goes fast.
- **ST148–ST149** motion present
- **ST199–ST200**
- **ST211**
- **ST221**
- **ST224**
- **ST230–ST231**
- **ST305**
- **ST309**
- **ST327**
- **ST573**
- **ST584** Do you sell notebooks?
- **ST732** He always speaks softly.

### Why
This is your default fallback for non-progressive present sentences.

---

## T09 — `progressive_action`
**Pattern:** `is/are/am + V-ing`

### Examples
- **ST035** The baby is sleeping.
- **ST036** The children are playing.
- **ST043–ST046**
- **ST083–ST085**
- **ST198**
- **ST253–ST254**
- **ST274**
- **ST310**
- **ST399**
- **ST405**
- **ST408–ST409**
- **ST415**
- **ST498**
- **ST502**
- **ST509**
- **ST528–ST529**
- **ST540–ST542**
- **ST615**
- **ST654–ST662**
- **ST683**
- **ST690**

### Why
Needs its own verb morphology.

---

## T10 — `past_perfective`
**Pattern:** completed past action / event.

### Examples
- **ST037** My uncle came yesterday.
- **ST068** We cleaned the house today.
- **ST093–ST095**
- **ST132**
- **ST134**
- **ST150**
- **ST160–ST161**
- **ST184–ST186**
- **ST216**
- **ST225**
- **ST242**
- **ST261–ST262**
- **ST289**
- **ST311**
- **ST365–ST366**
- **ST416–ST420**
- **ST446–ST453**
- **ST472**
- **ST475–ST476**
- **ST479**
- **ST492**
- **ST503**
- **ST511–ST512**
- **ST539**
- **ST551**
- **ST557–ST559**
- **ST569**
- **ST581–ST582**
- **ST588–ST590**
- **ST692**
- **ST694**
- **ST700–ST701**
- **ST726–ST727**

### Why
Past forms in your data are quite stable and should be learned separately.

---

## T11 — `future_or_predictive`
**Pattern:** future / near-future / predicted event.

### Examples
- **ST038** My aunt will come tomorrow.
- **ST069** We will repair the roof.
- **ST096** We will eat later.
- **ST133**
- **ST135**
- **ST145**
- **ST151**
- **ST195**
- **ST217**
- **ST243** sometimes deadline-like future
- **ST290**
- **ST312**
- **ST454–ST459**
- **ST494**
- **ST497**
- **ST538**
- **ST562**
- **ST585**
- **ST624**
- **ST674**
- **ST677**
- **ST682**
- **ST721**
- **ST743**

### Why
Your corpus often uses present-like future, so this needs a dedicated bucket.

---

## T12 — `infinitive_purpose_or_intention`
**Pattern:** `to do X / going to do X / need to do X / ask X to do X`

### Examples
- **ST460** She is going to buy vegetables.
- **ST461** He is going to repair the door.
- **ST464** I want to learn more.
- **ST467** We need to leave now.
- **ST469** I forgot to bring the key.
- **ST470** She remembered to call him.
- **ST574** I need to buy soap.
- **ST597** We need to finish today.
- **ST602** Take this tablet after food.
- **ST678** I need to buy medicines.
- **ST680** He wants to speak to you.
- **ST715** Please take me to the clinic.
- **ST718** Help me lift this box.

### Why
These are not plain simple tense sentences.

---

## T13 — `imperative_direct`
**Pattern:** bare command.

### Examples
- **ST050–ST057**
- **ST089–ST092**
- **ST137–ST139**
- **ST152–ST170**
- **ST193–ST206**
- **ST210**
- **ST227–ST229**
- **ST243–ST245**
- **ST255**
- **ST267–ST270**
- **ST302**
- **ST315–ST320**
- **ST372–ST383**
- **ST386–ST389**
- **ST501**
- **ST506–ST507**
- **ST516–ST520**
- **ST556**
- **ST572**
- **ST587**
- **ST596**
- **ST607**
- **ST632**
- **ST643**
- **ST645**
- **ST647–ST649**
- **ST713**
- **ST716**
- **ST724**
- **ST729**
- **ST740–ST741**

### Why
Object-first imperative is one of your strongest productive patterns.

---

## T14 — `imperative_polite`
**Pattern:** `please + imperative`

### Examples
- **ST008**
- **ST009**
- **ST074–ST075**
- **ST372–ST373**
- **ST526**
- **ST643**
- **ST693**
- **ST711**
- **ST715**
- **ST720**
- **ST729**
- **ST740**

### Why
Same as imperative, but with politeness and respectful endings.

---

## T15 — `negative_declarative`
**Pattern:** statement with `nahi` or lexical negation.

### Examples
- **ST095** He did not eat.
- **ST156** The road is bad.
- **ST178** I do not want that.
- **ST218** The teacher is absent today.
- **ST226** The work is not finished.
- **ST247** I am not well.
- **ST269** The water is not clean.
- **ST330** I do not like that.
- **ST345** I am not ready.
- **ST451–ST453**
- **ST500** `...paani nahi`
- **ST515** The fan is not working.
- **ST594** He does not understand.
- **ST636** We are not sure yet.
- **ST702** I have no cash now.
- **ST730** I do not remember that.

### Why
Negation placement should be learned after template selection.

---

## T16 — `negative_imperative_prohibitive`
**Pattern:** `Do not X`

### Examples
- **ST384** Do not shout.
- **ST385** Do not run.
- **ST508** Do not forget your book.
- **ST533** Do not touch the pan.
- **ST646** Do not go alone.

### Why
This is not `not + imperative`; it is a prohibitive form.

---

## T17 — `yes_no_question`
**Pattern:** statement order + final question marker.

### Examples
- **ST017** Did you eat?
- **ST018** Are you well?
- **ST171**
- **ST187**
- **ST256**
- **ST362–ST364**
- **ST365–ST371**
- **ST584**
- **ST642**
- **ST719**

### Why
English auxiliary-first order should not be copied.

---

## T18 — `wh_question`
**Pattern:** wh-word with subtemplates.

### Examples
- **ST003** What is your name?
- **ST006** Where are you from?
- **ST122** What time is it?
- **ST147** Where are you going?
- **ST174** How much is this?
- **ST207** What is the answer?
- **ST347–ST361**
- **ST571** Is there a shorter road?
- **ST638** Do you know the answer?
- **ST639–ST641**

### Subtypes you should store
- `what_is_x`
- `who_is_x`
- `where_is_x`
- `where_go`
- `when_past`
- `when_future`
- `why_state`
- `why_past`
- `how_many`
- `how_much`
- `which_one`

---

## T19 — `comparative_superlative`
**Pattern:** better / smaller / nearer / more / best.

### Examples
- **ST157** This way is shorter.
- **ST333** That is better.
- **ST334** This is the best.
- **ST439–ST445**
- **ST665–ST671**

### Why
Comparatives in your corpus often use `anki`-type reinforcement and should not be treated as plain adjectives.

---

## T20 — `event_time_calendar_weather`
**Pattern:** time / date / day / weather / event-state sentences.

### Examples
- **ST123–ST131**
- **ST136**
- **ST141–ST146**
- **ST272–ST290**
- **ST291–ST296**
- **ST473**
- **ST546**
- **ST554–ST566**
- **ST608–ST610**
- **ST683**

### Why
These are productive, but often slightly formulaic.

---

## T21 — `noisy_or_quarantine`
Rows I would not trust without manual cleanup.

### Likely repair-needed
- **ST151**
- **ST163** (looks duplicated from “Wait here”)
- **ST195** (English says “We”, output says `mi`)
- **ST218** (absent phrasing odd)
- **ST330** (`that` vs output `ye`)
- **ST422** (“That house” but output starts `ye`)
- **ST516** English/output mismatch on open/close
- **ST657** output does not match English well
- **ST675+** many missing
- any row with empty `variants`
- any row with slash alternatives inside one field unless normalized first

### Why
Do not use these as direct learning anchors.

---

# 2) Secondary tags you should add to every row

These tags matter almost as much as the primary template.

## Core tags
- `fixed_phrase`
- `question_yesno`
- `question_wh`
- `imperative`
- `polite`
- `negative`
- `prohibitive`
- `respectful`
- `young_female`
- `young_male`
- `dative_subject`
- `location_phrase`
- `time_phrase`
- `quantity_phrase`
- `progressive`
- `past`
- `future`
- `comparative`
- `superlative`
- `motion`
- `body_state`
- `need_want_like`
- `possession`

## Example tagging
- **ST074** → `imperative`, `polite`, `dative_subject`
- **ST358** → `question_wh`, `quantity_phrase`, `existential`
- **ST222** → `possession`, `dative_subject`, `time_phrase`
- **ST095** → `negative`, `past`
- **ST384** → `imperative`, `negative`, `prohibitive`
- **ST147** → `question_wh`, `motion`
- **ST058** → `location_phrase`, `copula`
- **ST460** → `future_like`, `purpose_clause`, `motion`

---

# 3) Routing priority for new sentences

Use this order at runtime:
1. `fixed_formula`
2. `imperative_polite`
3. `negative_imperative_prohibitive`
4. `wh_question`
5. `yes_no_question`
6. `experiencer_state_dative`
7. `possession_have`
8. `existential_there_is`
9. `location_copula`
10. `identity_equative`
11. `predicate_adjective_copula`
12. `progressive_action`
13. `past_perfective`
14. `future_or_predictive`
15. `infinitive_purpose_or_intention`
16. `simple_action_habitual`

That priority will prevent most bad matches.
