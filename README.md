# The Spelling Floor

A house spelling bee for one device, or for two rooms playing the same list.

Call the word. Hide it. Keep the clock. After the bell, the card tells you how the word was made.

This is not the Scripps National Spelling Bee, and it does not use their word list. The clock and the caller's limits follow the public shape of the major bees. The words are a house well: English, Spanish, French, and Latin, with a note on each one. Where an origin is unsettled, the card says so.

## How to play

Open the page. Name the spellers, up to eight. Pick a mode, a level, and one or more languages.

- Classic: a miss sits you down. If the whole round misses, nobody sits.
- Points: miss and stay. A right answer is 10, plus up to 5 for time left.
- Meaning: the word is shown. Four senses. Thirty seconds.
- Written: one speller at a time. Others step away.
- Spell-off: ninety seconds, as many as you can. Cards after.
- Roots: you see how the word was made, then you spell it.

A shared code, like `FLOOR/en/school/classic/K7M2`, draws the same words on another device. Scores do not travel between devices. Export the night if you want the file.

## What is saved

Nights, missed words, and words already heard stay in this browser. Nothing is sent to a server. Clear the site data and the history goes.

## Run it

The site is static. Any folder server will do.

```
python -m http.server 8765
```

Then open `http://127.0.0.1:8765/`.

`words.js` is generated from `build_words.py`, `build_words2.py`, and `build_words3.py`. Edit those if you add a word. Do not invent a history.
