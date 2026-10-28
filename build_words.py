# -*- coding: utf-8 -*-
"""Emit words.js. Facts only. No invented histories."""
import json
from pathlib import Path

rows = []

def add(w, lang, pos, b, origin, dfn, ex, etym, pat, say="", path="", alt=None, hom=False):
    rows.append({
        "w": w,
        "lang": lang,
        "pos": pos,
        "b": b,
        "origin": origin,
        "def": dfn,
        "ex": ex,
        "etym": etym,
        "pat": pat,
        "say": say,
        "path": path,
        "alt": alt or [],
        "hom": hom,
    })

# --- English, classroom ---
add("apple", "en", "noun", 1, "Old English", "A round fruit with a firm skin and a core of seeds.", "She set an apple on the desk.", "Old English æppel, from the same Germanic root that gave German Apfel.", "A common Germanic fruit-name.", "AP-uhl")
add("garden", "en", "noun", 1, "Old French", "A plot of ground where plants are grown.", "The garden was full of beans.", "Old French gardin, from a Germanic word for an enclosure.", "French from Germanic.", "GAR-dn")
add("friend", "en", "noun", 1, "Old English", "A person you know well and like.", "A friend waited at the door.", "Old English freond, from a verb meaning to love.", "A Germanic love-word.", "frend")
add("write", "en", "verb", 2, "Old English", "To form letters or words on a surface.", "Write your name on the card.", "Old English writan, to score or draw. The w is silent in the modern spelling.", "The w is old and now silent.", "ryt")
add("know", "en", "verb", 2, "Old English", "To have a fact or a person in mind.", "I know the answer.", "Old English cnawan. The k was once spoken, as it still is in German kennen.", "A silent k from an older sound.", "noh")
add("climb", "en", "verb", 2, "Old English", "To go up, using hands and feet.", "They climb the hill before dark.", "Old English climban. The b was added later and is not spoken.", "A silent b.", "klym")
add("island", "en", "noun", 2, "Old English", "A piece of land with water all around it.", "The island has one road.", "Old English iegland, island-land. The s was added by scholars who linked it to French isle. It does not belong to the old word.", "The s is a scholar's addition.", "EYE-luhnd")
add("castle", "en", "noun", 2, "Latin", "A large fortified building.", "The castle sits on the ridge.", "Latin castellum, a small fort, through Old French castel. The t is silent.", "Latin fort, silent t.", "KAS-uhl")
add("knight", "en", "noun", 2, "Old English", "A mounted soldier of rank in the Middle Ages.", "The knight kept his word.", "Old English cniht, a boy or servant, later a military rank. The k is silent now.", "Silent k. The old sense was servant.", "nyt")
add("ocean", "en", "noun", 2, "Greek", "The great body of salt water.", "The ocean was calm at dawn.", "Greek Okeanos, the name of a river thought to circle the world, through Latin and French.", "A Greek name for the world-river.", "OH-shun")
add("people", "en", "noun", 2, "Latin", "Human beings as a group.", "People gathered in the hall.", "Latin populus, through Old French pueple.", "Latin people, through French.", "PEE-puhl")
add("enough", "en", "adjective", 2, "Old English", "As much as is needed.", "That is enough for tonight.", "Old English genog. The gh is an old throat sound that English stopped saying.", "The gh is an old sound, now silent.", "ih-NUF")
add("autumn", "en", "noun", 2, "Latin", "The season after summer.", "Autumn came early this year.", "Latin autumnus, through Old French. English also kept the Germanic word fall.", "Latin season-name.", "AW-tuhm")
add("quiet", "en", "adjective", 2, "Latin", "Making little or no sound.", "The room was quiet.", "Latin quietus, at rest, through Old French.", "Latin rest.", "KWY-it")
add("bridge", "en", "noun", 2, "Old English", "A structure that carries a path over water or a gap.", "We crossed the bridge on foot.", "Old English brycg, from a Germanic root.", "A Germanic building-word.", "brij")
add("candle", "en", "noun", 2, "Latin", "A stick of wax with a wick, burned for light.", "One candle lit the table.", "Latin candela, from candere, to shine.", "Latin shine.", "KAN-dl")
add("forest", "en", "noun", 2, "Latin", "A large area of trees.", "The path runs into the forest.", "Late Latin forestis, the unenclosed woodland outside the park, through Old French.", "Latin outside-the-park.", "FOR-ist")
add("river", "en", "noun", 1, "Latin", "A large natural stream of water.", "The river runs to the sea.", "Latin ripa, a bank, through Old French riviere, which first meant the bank and then the water.", "It named the bank before the water.", "RIV-er")
add("shadow", "en", "noun", 2, "Old English", "A dark shape made when light is blocked.", "His shadow fell across the step.", "Old English sceadu. The same root sits in shade.", "A Germanic light-word.", "SHAD-oh")
add("window", "en", "noun", 2, "Old Norse", "An opening in a wall that lets in light.", "Open the window.", "Old Norse vindauga, wind-eye. English took it from the Norse settlers.", "Wind plus eye.", "WIN-doh")
add("yellow", "en", "adjective", 1, "Old English", "The color of ripe lemons and gold.", "The yellow door is new.", "Old English geolu, from a root that also gave gold.", "Kin to gold.", "YEL-oh")
add("library", "en", "noun", 3, "Latin", "A room or building of books.", "Meet me at the library.", "Latin librarium, from liber, book. Liber first meant the inner bark used to write on.", "From the bark used as paper.", "LY-brer-ee")
add("bicycle", "en", "noun", 3, "Latin and Greek", "A vehicle with two wheels that you ride by pedaling.", "She left the bicycle by the gate.", "A modern compound: Latin bi-, two, and Greek kyklos, circle, through French.", "Two circles.", "BY-si-kuhl")
add("whisper", "en", "verb", 3, "Old English", "To speak very softly.", "Whisper the name.", "Old English hwisprian, an imitative word for a soft sound.", "The word copies the sound.", "WIS-per")
add("thunder", "en", "noun", 2, "Old English", "The loud sound that follows lightning.", "Thunder rolled over the hill.", "Old English thunor, the same Germanic root as the god-name Thor.", "Kin to Thor.", "THUN-der")
add("mountain", "en", "noun", 2, "Latin", "A very high hill.", "Snow stays on the mountain.", "Latin mons, montis, through Old French montaigne.", "Latin hill.", "MOUN-tin")
add("mystery", "en", "noun", 3, "Greek", "Something not understood.", "The missing key was a mystery.", "Greek mysterion, a secret rite, from myein, to close the eyes or lips.", "A closed-mouth word.", "MIS-tuh-ree")
add("ancient", "en", "adjective", 3, "Latin", "Very old.", "An ancient wall still stands.", "Latin ante, before, through French ancien.", "From before.", "AYN-shunt")
add("diamond", "en", "noun", 3, "Greek", "A very hard clear stone, used as a gem.", "The ring held a small diamond.", "Greek adamas, unconquerable, through Latin and French. The stone was named for hardness.", "Unconquerable stone.", "DY-mund")
add("echo", "en", "noun", 2, "Greek", "A sound that bounces back.", "We heard the echo in the hall.", "Greek ekho, a returned sound, and the name of a nymph in myth.", "A Greek sound-name.", "EK-oh")
add("journey", "en", "noun", 3, "Latin", "A trip from one place to another.", "The journey took two days.", "Latin diurnum, a day's portion, through Old French jornee, a day's travel.", "A day's travel.", "JUR-nee")
add("lantern", "en", "noun", 3, "Greek", "A case that holds a light.", "He carried a lantern.", "Greek lampter, a torch, through Latin and French.", "A Greek light-word.", "LAN-tern")
add("meadow", "en", "noun", 3, "Old English", "A field of grass.", "Cows stood in the meadow.", "Old English mæd, a place mowed for hay.", "A mown field.", "MED-oh")
add("needle", "en", "noun", 2, "Old English", "A thin tool used for sewing.", "Thread the needle.", "Old English nædl, from a root meaning to sew.", "A Germanic sewing-word.", "NEE-dl")
add("orchard", "en", "noun", 3, "Latin and Old English", "A planting of fruit trees.", "The orchard is in bloom.", "Latin hortus, garden, joined with Old English geard, yard.", "Garden-yard.", "OR-cherd")
add("treasure", "en", "noun", 3, "Greek", "A store of valuable things.", "They found no treasure.", "Greek thesauros, a storehouse, through Latin and French.", "A storehouse.", "TREZH-er")
add("umbrella", "en", "noun", 3, "Italian", "A canopy on a stick, used against rain.", "Take an umbrella.", "Italian ombrella, a little shade, from Latin umbra, shade.", "A little shade.", "um-BREL-uh")
add("village", "en", "noun", 2, "Latin", "A small group of houses in the country.", "The village has one shop.", "Latin villa, a country estate, through French village.", "From a country house.", "VIL-ij")
add("animal", "en", "noun", 2, "Latin", "A living creature that is not a plant.", "The animal drank at the stream.", "Latin animal, from anima, breath or soul.", "A being with breath.", "AN-uh-muhl")
add("circle", "en", "noun", 2, "Greek", "A round shape.", "Draw a circle.", "Greek kirkos, a ring, through Latin circulus.", "A ring.", "SUR-kuhl")
add("dragon", "en", "noun", 2, "Greek", "A large serpent in stories, often winged.", "The story has a dragon.", "Greek drakon, a serpent, through Latin and French.", "A Greek serpent.", "DRAG-un")
add("feather", "en", "noun", 2, "Old English", "One of the light growths that cover a bird.", "A feather lay on the step.", "Old English fether, a Germanic word.", "A Germanic bird-word.", "FETH-er")
add("guitar", "en", "noun", 3, "Greek", "A stringed instrument played with the fingers.", "He plays the guitar.", "Greek kithara, through Arabic qitar and Spanish guitarra.", "Greek lyre, through Arabic and Spanish.", "gi-TAR")
add("harbor", "en", "noun", 3, "Old English", "A sheltered place for ships.", "The boats stay in the harbor.", "Old English herebeorg, army shelter. The sense narrowed to a port.", "Army shelter, then a port.", "HAR-ber", alt=["harbour"])
add("insect", "en", "noun", 3, "Latin", "A small animal with six legs and a body in three parts.", "An insect crossed the page.", "Latin insectum, cut in, because the body looks notched.", "Cut into sections.", "IN-sekt")
add("mirror", "en", "noun", 3, "Latin", "A glass that shows a reflection.", "She looked in the mirror.", "Latin mirari, to wonder at, through French miroir.", "From wonder.", "MEER-er")
add("silver", "en", "noun", 2, "Old English", "A shiny gray-white metal.", "The spoon is silver.", "Old English seolfor, a Germanic metal-name.", "A Germanic metal.", "SIL-ver")
add("turtle", "en", "noun", 2, "French", "A reptile with a shell.", "The turtle crossed the road.", "French tortue, probably altered by sailors from a word for a dove used as a name for the animal.", "A French shell-name, reshaped.", "TUR-tl")
add("violet", "en", "noun", 3, "Latin", "A small purple flower, or that color.", "Violets grow by the wall.", "Latin viola, through French violette.", "A little viola.", "VY-uh-lit")

# --- English, school ---
add("because", "en", "conjunction", 3, "English", "For the reason that.", "We stayed in because of the rain.", "A joining of by and cause. Cause is Latin causa, through French.", "By plus cause.", "bih-KUZ")
add("tomorrow", "en", "noun", 3, "English", "The day after today.", "We leave tomorrow.", "To, in the sense of at, plus morrow, the morning, from Old English morgen.", "At the morning.", "tuh-MOR-oh")
add("beautiful", "en", "adjective", 3, "Latin", "Pleasing to see or hear.", "A beautiful song.", "Latin bellus, fine, through French beau, plus English -ful.", "Fine, and full of it.", "BYOO-ti-ful")
add("adventure", "en", "noun", 4, "Latin", "An unusual and exciting experience.", "The trip became an adventure.", "Latin adventura, a thing about to happen, from advenire, to arrive.", "What is about to arrive.", "ad-VEN-cher")
add("whispered", "en", "verb", 3, "Old English", "Spoke very softly.", "She whispered the plan.", "Past form of whisper, Old English hwisprian.", "A sound-copying verb.", "WIS-perd")
add("calendar", "en", "noun", 4, "Latin", "A chart of the days of the year.", "Check the calendar.", "Latin calendarium, an account book, from calendae, the first day of the Roman month.", "From the Roman month's first day.", "KAL-en-der")
add("captain", "en", "noun", 3, "Latin", "The person in command of a ship or a team.", "The captain called the roll.", "Latin caput, head, through Old French capitaine.", "The head.", "KAP-tin")
add("courage", "en", "noun", 4, "Latin", "The strength to face fear.", "It took courage to speak.", "Latin cor, heart, through French courage. The heart was the seat of feeling.", "From the heart.", "KUR-ij")
add("daughter", "en", "noun", 3, "Old English", "A girl or woman in relation to her parents.", "Their daughter sings.", "Old English dohtor, a very old kinship word shared across Indo-European languages.", "An old family-word.", "DAW-ter")
add("elephant", "en", "noun", 3, "Greek", "A very large animal with a trunk.", "The elephant drank from the tank.", "Greek elephas, through Latin and French. The Greek word may have come from a North African or Near Eastern name.", "A Greek animal-name of older stock.", "EL-uh-funt")
add("February", "en", "noun", 4, "Latin", "The second month of the year.", "February was cold.", "Latin Februarius, the month of februa, rites of purification.", "The purification month.", "FEB-roo-er-ee")
add("grammar", "en", "noun", 4, "Greek", "The rules of how a language fits together.", "Grammar keeps the sentence clear.", "Greek gramma, a letter, through Latin grammatica and French.", "The art of letters.", "GRAM-er")
add("honest", "en", "adjective", 3, "Latin", "Truthful, and not stealing.", "Give an honest answer.", "Latin honestus, honorable. The h is silent in English.", "Silent h, from honor.", "ON-ist")
add("juice", "en", "noun", 3, "Latin", "The liquid from fruit.", "Orange juice is on the table.", "Latin ius, broth, through French jus.", "From broth.", "joos")
add("kitchen", "en", "noun", 3, "Latin", "The room where food is cooked.", "The kitchen was warm.", "Latin coquina, from coquere, to cook, through Old English cycene.", "A cooking-room.", "KICH-en")
add("language", "en", "noun", 4, "Latin", "The words a people uses.", "She speaks three languages.", "Latin lingua, tongue, through French langage.", "From the tongue.", "LANG-gwij")
add("minute", "en", "noun", 3, "Latin", "Sixty seconds, or a short time.", "Wait a minute.", "Latin minuta, a small part. A minute is a small part of an hour.", "A small part.", "MIN-it")
add("neighbor", "en", "noun", 4, "Old English", "A person who lives near you.", "Ask the neighbor.", "Old English neahgebur, near dweller.", "Near plus dweller.", "NAY-ber", alt=["neighbour"])
add("orphan", "en", "noun", 4, "Greek", "A child whose parents have died.", "The story follows an orphan.", "Greek orphanos, bereft, through Latin and French.", "Bereft.", "OR-fun")
add("planet", "en", "noun", 3, "Greek", "A large body that orbits a star.", "Earth is a planet.", "Greek planetes, a wanderer. The planets were the lights that moved against the fixed stars.", "A wanderer.", "PLAN-it")
add("question", "en", "noun", 3, "Latin", "A sentence that asks for an answer.", "Ask the question again.", "Latin quaerere, to seek, through French question.", "From seeking.", "KWES-chun")
add("rhythm", "en", "noun", 5, "Greek", "A repeated beat in music or speech.", "Clap the rhythm.", "Greek rhythmos, measured flow. English keeps the h and the y from the Greek spelling.", "Measured flow.", "RITH-um")
add("science", "en", "noun", 4, "Latin", "Knowledge gained by watching and testing.", "Science asks what happens if.", "Latin scientia, knowledge, from scire, to know.", "Knowing.", "SY-uns")
add("stomach", "en", "noun", 4, "Greek", "The organ that holds and breaks down food.", "My stomach hurts.", "Greek stomachos, throat or gullet, through Latin and French. The sense moved down the body.", "It first meant the throat.", "STUM-uk")
add("theater", "en", "noun", 4, "Greek", "A place where plays are performed.", "The theater is full.", "Greek theatron, a seeing-place, from theasthai, to watch.", "A place for seeing.", "THEE-uh-ter", alt=["theatre"])
add("vegetable", "en", "noun", 4, "Latin", "A plant grown for food.", "Eat a vegetable.", "Latin vegetare, to enliven, from vegere, to be active. A vegetable was a living, growing thing.", "A growing thing.", "VEJ-tuh-buhl")
add("weather", "en", "noun", 3, "Old English", "The state of the air: rain, wind, heat, cold.", "The weather turned.", "Old English weder, a Germanic sky-word.", "A Germanic sky-word.", "WETH-er")
add("Wednesday", "en", "noun", 4, "Old English", "The fourth day of the week.", "We meet on Wednesday.", "Old English Wodnesdæg, Woden's day. Woden is the English name of the god called Odin in Norse.", "Woden's day.", "WENZ-day")
add("yacht", "en", "noun", 5, "Dutch", "A boat used for pleasure.", "The yacht left the marina.", "Dutch jacht, from jagen, to hunt. A jacht was a fast pursuit boat.", "A hunting boat.", "yot")
add("scissors", "en", "noun", 4, "Latin", "A tool of two blades for cutting.", "Hand me the scissors.", "Latin cisorium, a cutting tool, reshaped under the influence of Latin scindere, to split. The c is silent.", "A cutter, with a silent c.", "SIZ-erz")
add("doubt", "en", "noun", 4, "Latin", "A feeling of not being sure.", "There is no doubt.", "Latin dubitare, to waver. French wrote doute. English scholars put the b back from Latin.", "The b was put back from Latin.", "dowt")
add("debt", "en", "noun", 4, "Latin", "Money that is owed.", "Pay the debt.", "Latin debitum, what is owed. French wrote dette. The b was restored from Latin and is silent.", "A restored silent b.", "det")
add("subtle", "en", "adjective", 5, "Latin", "Hard to notice, or finely made.", "A subtle change.", "Latin subtilis, finely woven, from sub, under, and tela, a web. The b is silent.", "Finely woven. Silent b.", "SUT-l")
add("answer", "en", "noun", 3, "Old English", "What is said back to a question.", "Give a short answer.", "Old English andswaru, a swearing back. The w dropped out of speech.", "A swearing back.", "AN-ser")
add("listen", "en", "verb", 3, "Old English", "To pay attention to a sound.", "Listen to the word.", "Old English hlysnan. The t was added in spelling and is silent.", "A silent t.", "LIS-en")
add("often", "en", "adverb", 3, "Old English", "Many times.", "She often wins.", "Old English oft, plus -en. The t may be spoken or silent.", "The t is optional in speech.", "OFF-en")
add("sword", "en", "noun", 3, "Old English", "A long blade used as a weapon.", "The sword hung on the wall.", "Old English sweord. The w is silent.", "Silent w.", "sord")
add("two", "en", "number", 2, "Old English", "The number 2.", "Two players are up.", "Old English twa. The w is silent. Too and to are related words that split in sense.", "Silent w.", "too")
add("who", "en", "pronoun", 2, "Old English", "What person.", "Who is the caller?", "Old English hwa. The w is now silent before the vowel in this word.", "An old question-word.", "hoo")
add("psychology", "en", "noun", 6, "Greek", "The study of the mind.", "She studies psychology.", "Greek psyche, soul or breath, and logos, account. The p is silent in English.", "Soul plus account. Silent p.", "sy-KOL-uh-jee")
add("pneumonia", "en", "noun", 6, "Greek", "A disease that inflames the lungs.", "He was ill with pneumonia.", "Greek pneumon, lung, from pneuma, breath. The p is silent.", "A lung-word. Silent p.", "noo-MOHN-yuh")
add("mnemonic", "en", "adjective", 7, "Greek", "Helping the memory.", "A mnemonic for the list.", "Greek mnemon, mindful. The m is silent at the start.", "Mindful. Silent m.", "nih-MON-ik")
add("honestly", "en", "adverb", 4, "Latin", "In a truthful way.", "Tell it honestly.", "From honest, Latin honestus, plus -ly.", "From honor.", "ON-ist-lee")
add("receipt", "en", "noun", 5, "Latin", "A written note that money or goods were received.", "Keep the receipt.", "Latin recipere, to take back, through French. The p was restored from Latin and is silent.", "A restored silent p.", "ri-SEET")
add("column", "en", "noun", 4, "Latin", "A tall pillar, or a vertical list.", "Read the first column.", "Latin columna. The n is silent in English.", "Silent n.", "KOL-um")
add("hymn", "en", "noun", 4, "Greek", "A song of praise.", "They sang a hymn.", "Greek hymnos, through Latin. The n is silent.", "Silent n.", "him")
add("crumb", "en", "noun", 3, "Old English", "A tiny piece of bread or cake.", "A crumb fell.", "Old English cruma. The b was added in spelling and is silent.", "A silent b.", "krum")
add("lamb", "en", "noun", 2, "Old English", "A young sheep.", "The lamb stayed by the fence.", "Old English lamb. The b is silent.", "Silent b.", "lam")
add("thumb", "en", "noun", 2, "Old English", "The short thick finger.", "Press with your thumb.", "Old English thuma. The b is a later silent letter.", "A later silent b.", "thum")
add("wrap", "en", "verb", 3, "Old English", "To cover by folding something around.", "Wrap the gift.", "A Germanic word. The w is silent.", "Silent w.", "rap")
add("wreck", "en", "noun", 3, "Old Norse", "What is left after a ship or vehicle is destroyed.", "The wreck lay on the sand.", "Old Norse wrek, related to wreak. The w is silent.", "Silent w.", "rek")
add("gnome", "en", "noun", 4, "Greek", "A small being in stories, said to live underground.", "A gnome guards the mine in the tale.", "Renaissance Latin gnomus, probably from Greek gnoma, intelligence. The g is silent.", "Silent g.", "nohm")
add("sign", "en", "noun", 3, "Latin", "A mark that tells you something.", "Read the sign.", "Latin signum. The g is silent here, though it returns in signal.", "The g comes back in signal.", "syn")
add("foreign", "en", "adjective", 4, "Latin", "From another country.", "A foreign coin.", "Latin foris, outside, through French forain. The g does not belong to the history and is silent.", "The g is an intruder.", "FOR-in")
add("reign", "en", "noun", 4, "Latin", "The time a king or queen rules.", "Her reign was long.", "Latin regnum, rule, through French. The g is silent.", "From rule.", "rayn")
add("sovereign", "en", "noun", 6, "Latin", "A king or queen, or the highest ruler.", "The sovereign signed the paper.", "Latin super, above, through French souverain. The g is not original and is silent.", "From above. The g was added.", "SOV-rin")
print("partial", len(rows))
Path("rows_part1.json").write_text(json.dumps(rows, ensure_ascii=False), encoding="utf-8")
