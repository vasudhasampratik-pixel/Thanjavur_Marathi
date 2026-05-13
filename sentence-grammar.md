# Concatenation Failure Cases: English -> Indian Regional Language

## Purpose

This document lists practical sentence patterns where direct English word-by-word concatenation fails when generating an Indian regional language sentence.

It is especially useful for rule-based generation for languages such as Tanjore Marathi and other Indic languages that often prefer:

- **Subject-Object-Verb**
- **sentence-final copula/verb**
- **postpositions instead of prepositions**
- **fixed phrase templates**
- **respect/honorific variation**
- **special handling for quantity questions, existence, and commands**

---

## Format

Each case includes:

- **English**
- **Naive concatenation failure**
- **Natural Indic-style pattern**
- **Why concatenation fails**

---

## 1. Predicate adjective + copula

**English:** The mango is sweet.  
**Naive concatenation:** mango + is + sweet -> `amba aahe gulcheet`  
**Natural pattern:** `amba gulcheet aahe`  
**Why concatenation fails:** In Indic languages, predicate adjectives usually come before the final copula.

---

## 2. Another predicate adjective sentence

**English:** The wall is white.  
**Naive concatenation:** wall + is + white  
**Natural pattern:** `wall + white + aahe`  
**Why concatenation fails:** Copula is sentence-final, not mid-sentence.

---

## 3. Location sentence

**English:** The bag is near the wall.  
**Naive concatenation:** bag + is + near + wall  
**Natural pattern:** `bag + wall-near + aahe`  
**Why concatenation fails:** Prepositional phrase becomes a postpositional phrase and the copula moves to the end.

---

## 4. Another location sentence

**English:** The child is inside the house.  
**Naive concatenation:** child + is + inside + house  
**Natural pattern:** `child + house-inside + aahe`  
**Why concatenation fails:** English location order is different from Indic order.

---

## 5. Simple existence sentence

**English:** There is water in the pot.  
**Naive concatenation:** there + is + water + in + pot  
**Natural pattern:** `pot-in + water + aahe`  
**Why concatenation fails:** English dummy subject “there” is not translated literally.

---

## 6. Existence with object

**English:** There is dust in the room.  
**Naive concatenation:** there + is + dust + in + room  
**Natural pattern:** `room-in + dust + aahe`  
**Why concatenation fails:** Existence is expressed through location + noun + final existence marker.

---

## 7. Human plural existence

**English:** How many people are there?  
**Naive concatenation:** how + many + people + are + there  
**Natural pattern:** `kevda + people + aitha`  
**Why concatenation fails:** `how many` is a single unit, and human plural existence often takes a different ending than non-human existence.

---

## 8. Mass noun quantity question

**English:** How much water is there?  
**Naive concatenation:** how + much + water + is + there  
**Natural pattern:** `kevda + water + aahe`  
**Why concatenation fails:** `how much` should not be split word-by-word.

---

## 9. Fixed identity question

**English:** What is your name?  
**Naive concatenation:** what + is + your + name  
**Natural pattern:** `your name what` / fixed template  
**Why concatenation fails:** This is a conventional phrase and should be stored as a template.

---

## 10. Greeting question

**English:** How are you?  
**Naive concatenation:** how + you + are  
**Natural pattern:** fixed well-being template  
**Why concatenation fails:** English and Indic languages structure well-being questions differently.

---

## 11. Origin question

**English:** Where are you from?  
**Naive concatenation:** where + are + you + from  
**Natural pattern:** `you + where-from + came/are`  
**Why concatenation fails:** “from” attaches to the place, not as a free-standing English-position token.

---

## 12. Time question

**English:** What time is it?  
**Naive concatenation:** what + time + is + it  
**Natural pattern:** fixed time-question template  
**Why concatenation fails:** `what time` should be treated as one question unit.

---

## 13. Yes/no past question

**English:** Did you eat?  
**Naive concatenation:** did + you + eat  
**Natural pattern:** `you ate + ka` / fixed template  
**Why concatenation fails:** English support verb `did` should not be translated separately.

---

## 14. Yes/no state question

**English:** Are you well?  
**Naive concatenation:** are + you + well  
**Natural pattern:** `you well + ka`  
**Why concatenation fails:** Indic languages typically keep core predicate order and add a final question marker.

---

## 15. Ability question

**English:** Can you hear me?  
**Naive concatenation:** can + you + hear + me  
**Natural pattern:** `you me hear-can + ka`  
**Why concatenation fails:** `can` is not a standalone word in many Indic renderings; it is often part of the verb phrase.

---

## 16. Suggestion question

**English:** Shall I come now?  
**Naive concatenation:** shall + I + come + now  
**Natural pattern:** `I now come + ka` / suggestion template  
**Why concatenation fails:** English modal `shall` is not translated literally.

---

## 17. Obligation/suggestion

**English:** Should we wait?  
**Naive concatenation:** should + we + wait  
**Natural pattern:** `we wait + ka` / modal template  
**Why concatenation fails:** Modal meaning must be handled by template logic.

---

## 18. Generic transitive sentence

**English:** He reads the book.  
**Naive concatenation:** he + reads + book  
**Natural pattern:** `he + book + reads`  
**Why concatenation fails:** Indic default is SOV, not SVO.

---

## 19. Another transitive sentence

**English:** She brought her pen.  
**Naive concatenation:** she + brought + her + pen  
**Natural pattern:** `she + her pen + brought`  
**Why concatenation fails:** Object appears before the final verb.

---

## 20. Progressive sentence

**English:** She is cutting vegetables.  
**Naive concatenation:** she + is + cutting + vegetables  
**Natural pattern:** `she + vegetables + cutting-is`  
**Why concatenation fails:** Progressive marker and verb complex sit at the end.

---

## 21. Another progressive sentence

**English:** He is making tea.  
**Naive concatenation:** he + is + making + tea  
**Natural pattern:** `he + tea + making-is`  
**Why concatenation fails:** Object precedes the progressive predicate.

---

## 22. Motion progressive

**English:** He is going to town.  
**Naive concatenation:** he + is + going + to + town  
**Natural pattern:** `he + town-to + going-is`  
**Why concatenation fails:** Destination becomes postpositional and the predicate goes to the end.

---

## 23. Future sentence

**English:** We will go tomorrow.  
**Naive concatenation:** we + will + go + tomorrow  
**Natural pattern:** `we + tomorrow + go-future`  
**Why concatenation fails:** `will` should not remain as an independent English-position token.

---

## 24. Past sentence

**English:** We came yesterday.  
**Naive concatenation:** we + came + yesterday  
**Natural pattern:** `we + yesterday + came`  
**Why concatenation fails:** Time adverb often comes before the final verb.

---

## 25. Habitual sentence

**English:** I go to work every day.  
**Naive concatenation:** I + go + to + work + every day  
**Natural pattern:** `I + every day + work-to + go`  
**Why concatenation fails:** Habitual adverbials and destination phrases come before the final verb.

---

## 26. Command

**English:** Open the door.  
**Naive concatenation:** open + door  
**Natural pattern:** `door + open-imperative`  
**Why concatenation fails:** Object typically precedes the imperative verb.

---

## 27. Another command

**English:** Close the window.  
**Naive concatenation:** close + window  
**Natural pattern:** `window + close-imperative`  
**Why concatenation fails:** Same object-before-verb issue.

---

## 28. Polite command

**English:** Please give me water.  
**Naive concatenation:** please + give + me + water  
**Natural pattern:** `me + water + give-polite`  
**Why concatenation fails:** Indirect object and direct object are reordered, and politeness changes verb form.

---

## 29. Polite motion command

**English:** Please come in.  
**Naive concatenation:** please + come + in  
**Natural pattern:** fixed imperative template  
**Why concatenation fails:** `come in` is a phrasal unit, not two separately translated words.

---

## 30. Sit-down command

**English:** Please sit down.  
**Naive concatenation:** please + sit + down  
**Natural pattern:** fixed imperative template  
**Why concatenation fails:** `sit down` should be treated as one lexical action.

---

## 31. Negative imperative

**English:** Do not run.  
**Naive concatenation:** do + not + run  
**Natural pattern:** prohibitive form of `run`  
**Why concatenation fails:** Negative commands do not use English-style auxiliary negation.

---

## 32. Another negative imperative

**English:** Do not shout.  
**Naive concatenation:** do + not + shout  
**Natural pattern:** prohibitive form of `shout`  
**Why concatenation fails:** Same prohibitive logic.

---

## 33. Negative past

**English:** He did not eat.  
**Naive concatenation:** he + did + not + eat  
**Natural pattern:** `he + eat-negative-past`  
**Why concatenation fails:** `did not` becomes one negative predicate, not two separate translated items.

---

## 34. Negative state

**English:** I am not well.  
**Naive concatenation:** I + am + not + well  
**Natural pattern:** `I + well not` / state-negative template  
**Why concatenation fails:** Negation attaches to the predicate, not in English order.

---

## 35. Possession

**English:** I have work today.  
**Naive concatenation:** I + have + work + today  
**Natural pattern:** `to-me + today + work + exists`  
**Why concatenation fails:** Many Indic languages express possession as existence relative to the experiencer, not with a direct `have` verb.

---

## 36. Another possession

**English:** He has a lot of work.  
**Naive concatenation:** he + has + lot + of + work  
**Natural pattern:** `to-him + much work + exists`  
**Why concatenation fails:** Possession is often dative/existential, not English-style ownership syntax.

---

## 37. Hunger state

**English:** I am hungry.  
**Naive concatenation:** I + am + hungry  
**Natural pattern:** `to-me + hunger + has-occurred` / experiencer template  
**Why concatenation fails:** Hunger is often expressed as a felt state, not adjective + copula.

---

## 38. Thirst state

**English:** I am thirsty.  
**Naive concatenation:** I + am + thirsty  
**Natural pattern:** `to-me + thirst + has-occurred`  
**Why concatenation fails:** Same experiencer-state issue.

---

## 39. Liking

**English:** I like this.  
**Naive concatenation:** I + like + this  
**Natural pattern:** `to-me + this + is-liked` / experiencer template  
**Why concatenation fails:** Many Indic languages do not map `like` as a simple transitive verb.

---

## 40. Need/want

**English:** We need rice.  
**Naive concatenation:** we + need + rice  
**Natural pattern:** `to-us + rice + is-needed`  
**Why concatenation fails:** `need` often behaves like a requirement template, not direct English word order.

---

## 41. Another need sentence

**English:** I want vegetables.  
**Naive concatenation:** I + want + vegetables  
**Natural pattern:** `to-me + vegetables + are-wanted`  
**Why concatenation fails:** Desire frequently uses experiencer-style structure.

---

## 42. Respectful address

**English:** Please sit here.  
**Naive concatenation:** please + sit + here  
**Natural pattern:** `here + sit-respectful`  
**Why concatenation fails:** Respectful imperative needs a different verb ending from casual imperative.

---

## 43. Respectful question

**English:** Are you well?  
**Naive concatenation:** are + you + well  
**Natural pattern:** respectful `you` + respectful predicate/question form  
**Why concatenation fails:** Respect affects more than the pronoun; it changes agreement and sometimes verb form.

---

## 44. Human plural statement

**English:** The children are in school.  
**Naive concatenation:** children + are + in + school  
**Natural pattern:** `children + school-in + aitha/are`  
**Why concatenation fails:** Human plural may need distinct agreement from object plural.

---

## 45. Non-human plural statement

**English:** The clothes are wet.  
**Naive concatenation:** clothes + are + wet  
**Natural pattern:** `clothes + wet + aahe/appropriate non-human plural form`  
**Why concatenation fails:** Non-human plural agreement may differ from human plural agreement.

---

## 46. Preposition to postposition

**English:** I am from this village.  
**Naive concatenation:** I + am + from + this + village  
**Natural pattern:** `I + this village-from + am`  
**Why concatenation fails:** `from` attaches to the noun phrase, not as a separate pre-word.

---

## 47. With-phrase

**English:** Come with me.  
**Naive concatenation:** come + with + me  
**Natural pattern:** `me-with + come`  
**Why concatenation fails:** `with` becomes a postposition.

---

## 48. Before/after phrase

**English:** We are leaving after lunch.  
**Naive concatenation:** we + are + leaving + after + lunch  
**Natural pattern:** `we + lunch-after + leaving-are`  
**Why concatenation fails:** Time relation words attach to the event noun.

---

## 49. Another before/after phrase

**English:** Come before noon.  
**Naive concatenation:** come + before + noon  
**Natural pattern:** `noon-before + come`  
**Why concatenation fails:** Temporal relation becomes a postpositional phrase.

---

## 50. Fixed social phrase

**English:** Nice to meet you.  
**Naive concatenation:** nice + to + meet + you  
**Natural pattern:** fixed social template  
**Why concatenation fails:** This is an idiomatic conversational phrase and should not be built word-by-word.

---

# Summary of Main Failure Types

Direct concatenation commonly fails in these situations:

1. **copula movement** (`is`, `are`, `am`)
2. **SVO to SOV reordering**
3. **postpositions replacing prepositions**
4. **`how many` / `how much` phrase handling**
5. **existence sentences** (`there is`, `there are`)
6. **human vs non-human agreement**
7. **respectful/honorific forms**
8. **imperatives and polite requests**
9. **negative imperatives**
10. **do-support removal** (`do`, `does`, `did`)
11. **fixed conversational templates**
12. **experiencer-state constructions** (`hungry`, `thirsty`, `like`, `need`)
13. **future/modal handling** (`will`, `can`, `should`, `shall`)
14. **progressive aspect**
15. **possession structures**

---

# Recommendation for Rule Engine

Before generating from dictionary words, the app should:

1. detect fixed phrases
2. detect multi-word English units
3. classify sentence type
4. select a template
5. reorder slots
6. apply person/respect agreement
7. clean nulls and duplicate tokens

---

# Minimum High-Value Rules to Implement First

If building an MVP, implement these first:

1. predicate adjective + final copula
2. location + final copula
3. `how many` and `how much` as fixed units
4. human vs non-human existential endings
5. SOV reordering for transitive sentences
6. imperative object-before-verb order
7. do-support removal in questions
8. possession/need/like/hunger templates
9. respectful imperative endings
10. fixed phrase table for greetings and common questions
