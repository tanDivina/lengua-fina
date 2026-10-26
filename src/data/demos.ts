// Saved runs of the real agent against the live Qloo and Claude APIs,
// captured Oct 25 2026. Nothing here is invented: every reference and
// affinity below was returned by Qloo during its run, and the grounding
// check enforced that before the result was accepted.
import type { MarketResult } from "@/lib/agent";
import type { AgeRange } from "@/lib/qloo";

export type Demo = {
  id: string;
  label: string;
  product: string;
  copy: string;
  markets: { city: string; ages: AgeRange[]; language: string }[];
  results: MarketResult[];
};

export const DEMO_RAN_AT = "Oct 25, 2026";

export const DEMOS: Demo[] = [
  {
    "id": "chocolate",
    "label": "70% dark chocolate",
    "product": "70% single-origin dark chocolate bar, cacao from Bocas del Toro, Panama",
    "copy": "Grown on a small island farm in Bocas del Toro and fermented for six days in wooden boxes, this 70% bar tastes of red fruit, honey and a hint of tobacco. Smooth as a Brussels praline, but darker and wilder. Break off a square with your Sunday café au lait, or pair it with a glass of Port after dinner.",
    "markets": [
      {
        "city": "Tokyo",
        "ages": [
          "30_to_34",
          "35_to_44"
        ],
        "language": "Japanese"
      },
      {
        "city": "Brussels",
        "ages": [
          "30_to_34",
          "35_to_44"
        ],
        "language": "French"
      },
      {
        "city": "Austin",
        "ages": [
          "30_to_34",
          "35_to_44"
        ],
        "language": "English"
      }
    ],
    "results": [
      {
        "city": "Tokyo",
        "language": "Japanese",
        "copy": "パナマ、ボカス・デル・トロ。小さな島の農園で育ったカカオを、木箱で6日間じっくり発酵させました。カカオ70%のこのバーに広がるのは、赤い果実とはちみつ、そしてほのかなタバコの香り。口どけはなめらかなのに、奥には深く野性的な表情があります。日曜の朝は、CAMELBACKで買ってきたエスプレッソとひとかけ。夕食のあとは、ポートワインをグラスに一杯どうぞ。",
        "backTranslation": "Bocas del Toro, Panama. Cacao grown on a small island farm, slowly fermented for six days in wooden boxes. In this 70% cacao bar you'll find red fruit, honey and a faint hint of tobacco. It melts smoothly, yet underneath there is a deep, wild character. On Sunday morning, have a square with an espresso picked up from CAMELBACK. After dinner, try it with a glass of Port.",
        "flags": [
          {
            "original": "Smooth as a Brussels praline",
            "problem": "The Belgian praline comparison doesn't connect with this audience, so I removed it and kept the smooth-but-wild contrast without it.",
            "evidence": "check_reference: Neuhaus (brand, used as the stand-in for 'Brussels praline') is not in the top 100 brands for Tokyo 30_to_34 + 35_to_44."
          },
          {
            "original": "your Sunday café au lait",
            "problem": "A generic French breakfast drink with no local hook. I replaced it with a Tokyo espresso spot this audience ranks highly.",
            "evidence": "check_reference: CAMELBACK sandwich&espresso ranks #13 of 100 places for Tokyo 30_to_34 + 35_to_44."
          },
          {
            "original": "a glass of Port",
            "problem": "I kept this as a plain pairing suggestion, but its appeal is unverified: Qloo has no entity for Port wine as a drink, so I couldn't check it.",
            "evidence": "find_entity 'Port wine' and 'Taylor's Port' returned only unrelated bars, restaurants and sports clubs, so check_reference couldn't be run."
          }
        ],
        "references": [
          {
            "phrase": "CAMELBACKで買ってきたエスプレッソ",
            "why": "CAMELBACK sandwich&espresso came up in market_taste for Tokyo 30–44s with a specialty-coffee signal, and check_reference ranks it #13 of 100 places for this audience.",
            "entity": {
              "id": "EFE77A29-9053-4C50-A8AB-3958E22DA5D9",
              "name": "CAMELBACK sandwich&espresso",
              "type": "urn:entity:place",
              "affinity": 0.9913445594131566
            }
          }
        ]
      },
      {
        "city": "Brussels",
        "language": "French",
        "copy": "Cultivé dans une petite ferme insulaire de Bocas del Toro, au Panama, puis fermenté six jours en caisses de bois, ce 70 % dévoile des notes de fruits rouges, de miel et une pointe de tabac. En bouche, il est fondant, mais plus sombre et plus sauvage que ce qu'on attend. Un carré avec le café au lait du dimanche, Tamino en fond sonore ; ou, après le dîner, avec un verre de porto.",
        "backTranslation": "Grown on a small island farm in Bocas del Toro, Panama, then fermented for six days in wooden boxes, this 70% reveals notes of red fruit, honey and a hint of tobacco. In the mouth it melts smoothly, but it's darker and wilder than you'd expect. A square with your Sunday café au lait, with Tamino playing in the background; or, after dinner, with a glass of Port.",
        "flags": [
          {
            "original": "Smooth as a Brussels praline",
            "problem": "Comparing the bar to the city's own praline invites a contest with local chocolate, and the praline reference doesn't rank here. I rewrote the line as 'smooth, but darker and wilder than you'd expect'.",
            "evidence": "check_reference: Neuhaus (brand, used as the stand-in for 'Brussels praline') is not in the top 100 brands for Brussels 30_to_34 + 35_to_44."
          },
          {
            "original": "a glass of Port",
            "problem": "Kept as a pairing suggestion, but unverified: Qloo has no entity for Port wine as a drink.",
            "evidence": "find_entity 'Port wine' and 'Taylor's Port' returned only unrelated bars, restaurants and sports clubs, so check_reference couldn't be run."
          }
        ],
        "references": [
          {
            "phrase": "Tamino en fond sonore",
            "why": "Tamino appeared in market_taste for Brussels 30–44s with a dark-chocolate signal (tags: soulful, atmospheric), and check_reference ranks him #6 of 100 artists for this audience.",
            "entity": {
              "id": "1004A62C-76AF-41FB-996C-82247B275406",
              "name": "Tamino",
              "type": "urn:entity:artist",
              "affinity": 0.9918177336391403
            }
          }
        ]
      },
      {
        "city": "Austin",
        "language": "English",
        "copy": "Grown on a small island farm in Bocas del Toro, Panama, and fermented for six days in wooden boxes, this 70% bar tastes of red fruit, honey and a hint of tobacco. It goes down smooth, then shows a darker, wilder side, more Heartless Bastards than easy listening. Break off a square with your Sunday-morning Chameleon Coffee, or pair it with a glass of Port after dinner.",
        "backTranslation": null,
        "flags": [
          {
            "original": "Smooth as a Brussels praline",
            "problem": "The Belgian praline comparison doesn't land with this audience, so I swapped the 'darker and wilder' contrast to a local band.",
            "evidence": "check_reference: Neuhaus (brand, used as the stand-in for 'Brussels praline') is not in the top 100 brands for Austin 30_to_34 + 35_to_44."
          },
          {
            "original": "your Sunday café au lait",
            "problem": "A generic French breakfast drink with no local hook. I replaced it with a coffee brand this audience ranks highly.",
            "evidence": "check_reference: Chameleon Coffee ranks #7 of 100 brands for Austin 30_to_34 + 35_to_44."
          },
          {
            "original": "a glass of Port",
            "problem": "Kept as a pairing suggestion, but unverified: Qloo has no entity for Port wine as a drink.",
            "evidence": "find_entity 'Port wine' and 'Taylor's Port' returned only unrelated bars, restaurants and sports clubs, so check_reference couldn't be run."
          }
        ],
        "references": [
          {
            "phrase": "Sunday-morning Chameleon Coffee",
            "why": "Chameleon Coffee came up in market_taste for Austin 30–44s with a dark-chocolate signal, and check_reference ranks it #7 of 100 brands for this audience.",
            "entity": {
              "id": "B9B21763-4833-4F79-ABBD-6291EDB0EAB5",
              "name": "Chameleon Coffee",
              "type": "urn:entity:brand",
              "affinity": 0.9763645854995314
            }
          },
          {
            "phrase": "more Heartless Bastards than easy listening",
            "why": "Heartless Bastards (tags: soulful, raw emotive) appeared in market_taste for Austin 30–44s with a dark-chocolate signal, and check_reference ranks them #3 of 100 artists for this audience.",
            "entity": {
              "id": "030338DB-D035-4355-A2F4-EAF61B6B90C8",
              "name": "Heartless Bastards",
              "type": "urn:entity:artist",
              "affinity": 0.9925811235588174
            }
          }
        ]
      }
    ]
  },
  {
    "id": "dutch",
    "label": "Dutch, three ways",
    "product": "70% single-origin dark chocolate bar, cacao from Bocas del Toro, Panama",
    "copy": "Grown on a small island farm in Bocas del Toro and fermented for six days in wooden boxes, this 70% bar tastes of red fruit, honey and a hint of tobacco. Smooth as a Brussels praline, but darker and wilder. Break off a square with your Sunday café au lait, or pair it with a glass of Port after dinner.",
    "markets": [
      {
        "city": "Amsterdam",
        "ages": [
          "30_to_34",
          "35_to_44"
        ],
        "language": "Dutch (Netherlands)"
      },
      {
        "city": "Willemstad",
        "ages": [
          "30_to_34",
          "35_to_44"
        ],
        "language": "Dutch (ABC islands)"
      },
      {
        "city": "Antwerp",
        "ages": [
          "30_to_34",
          "35_to_44"
        ],
        "language": "Dutch (Flemish)"
      }
    ],
    "results": [
      {
        "city": "Amsterdam",
        "language": "Dutch (Netherlands)",
        "copy": "Deze reep van 70% komt van een kleine boerderij op een eiland in Bocas del Toro, Panama. De cacao fermenteert zes dagen in houten kisten en smaakt naar rood fruit, honing en een vleugje tabak. Zacht als een goede praline, maar donkerder en wilder. Breek een stukje af bij je koffie verkeerd op zondagochtend, met Maaike Ouboter op de achtergrond. Of bewaar hem voor na het eten, bij een glaasje port.",
        "backTranslation": "This 70% bar comes from a small farm on an island in Bocas del Toro, Panama. The cacao ferments for six days in wooden boxes and tastes of red fruit, honey and a hint of tobacco. Smooth as a good praline, but darker and wilder. Break off a square with your café au lait on a Sunday morning, with Maaike Ouboter playing in the background. Or save it for after dinner, with a glass of Port.",
        "flags": [
          {
            "original": "Smooth as a Brussels praline",
            "problem": "The Brussels praline didn't resolve to a Qloo entity, and Neuhaus (the closest brand) does not rank for this audience. I dropped 'Brussels' and kept only a general praline comparison.",
            "evidence": "check_reference: Neuhaus is not in the top 100 brands for ages 30–44 in Amsterdam. find_entity 'Brussels praline' returned only airports and venues."
          },
          {
            "original": "a glass of Port after dinner",
            "problem": "I couldn't check Port against this audience. I kept it as a general drink pairing, not a cultural reference.",
            "evidence": "find_entity 'Port wine' and 'Taylor's Port' returned only unrelated bars and sports clubs, so there was nothing to run check_reference on."
          }
        ],
        "references": [
          {
            "phrase": "met Maaike Ouboter op de achtergrond",
            "why": "She came back in Qloo's artist ranking for Amsterdam ages 30–44 who like dark chocolate, tagged as an emotional Dutch singer-songwriter, which fits a slow Sunday morning.",
            "entity": {
              "id": "137B0568-2248-4699-86B5-7DCC740DAA08",
              "name": "Maaike Ouboter",
              "type": "urn:entity:artist",
              "affinity": 0.9057541755410985
            }
          }
        ]
      },
      {
        "city": "Willemstad",
        "language": "Dutch (ABC islands)",
        "copy": "Deze reep van 70% komt van een kleine boerderij op een eiland in Bocas del Toro, Panama, aan dezelfde Caribische Zee. De cacao fermenteert zes dagen in houten kisten en smaakt naar rood fruit, honing en een vleugje tabak. Zacht als een praline, maar donkerder en wilder. Breek een stukje af bij je zondagse koffie, of geniet ervan na het eten met een glaasje port.",
        "backTranslation": "This 70% bar comes from a small farm on an island in Bocas del Toro, Panama, on the same Caribbean Sea. The cacao ferments for six days in wooden boxes and tastes of red fruit, honey and a hint of tobacco. Smooth as a praline, but darker and wilder. Break off a square with your Sunday coffee, or enjoy it after dinner with a glass of Port.",
        "flags": [
          {
            "original": "All cultural references (Brussels praline, café au lait, Port)",
            "problem": "Qloo has no taste data for this audience, so I couldn't swap in a local reference. Instead the copy is framed around the shared Caribbean Sea, a fact about where the bar comes from, and has no cultural references. A local reviewer should check it.",
            "evidence": "market_taste for Willemstad ages 30–44 came back empty for brands (with the dark chocolate tag), artists and places. A query for 'Curaçao' (artists) was also empty. check_reference on Neuhaus reported 'not in the top 0 brands'."
          },
          {
            "original": "Sunday café au lait",
            "problem": "I changed this to a plain 'Sunday coffee' because I couldn't confirm that the French café au lait framing fits this audience.",
            "evidence": "Qloo returned no entity or taste data for Willemstad."
          }
        ],
        "references": []
      },
      {
        "city": "Antwerp",
        "language": "Dutch (Flemish)",
        "copy": "Deze reep van 70% komt van een kleine eilandboerderij in Bocas del Toro, Panama. De cacao fermenteert zes dagen in houten kisten en smaakt naar rood fruit, honing en een tikkeltje tabak. Even zacht als een praline, maar donkerder en wilder, een beetje zoals een plaat van Tamino. Breek een stukje af bij je zondagse koffie met melk, of geniet ervan na het eten met een glaasje porto.",
        "backTranslation": "This 70% bar comes from a small island farm in Bocas del Toro, Panama. The cacao ferments for six days in wooden boxes and tastes of red fruit, honey and a touch of tobacco. Just as smooth as a praline, but darker and wilder, a bit like a Tamino record. Break off a square with your Sunday coffee with milk, or enjoy it after dinner with a glass of Port.",
        "flags": [
          {
            "original": "Smooth as a Brussels praline",
            "problem": "The Brussels praline didn't resolve to a Qloo entity, and Neuhaus doesn't rank for this audience. I kept only a general praline comparison and let Tamino carry the 'darker and wilder' contrast.",
            "evidence": "check_reference: Neuhaus is not in the top 100 brands for ages 30–44 in Antwerp."
          },
          {
            "original": "a glass of Port after dinner",
            "problem": "I couldn't check Port against this audience. I kept it as a general pairing and used the Belgian word 'porto'.",
            "evidence": "find_entity for Port returned no matching entity, so there was nothing to run check_reference on."
          }
        ],
        "references": [
          {
            "phrase": "een beetje zoals een plaat van Tamino",
            "why": "Tamino came back in Qloo's artist ranking for Antwerp ages 30–44 who like dark chocolate, with the tags 'Soulful', 'Atmospheric' and 'Passionate', which echo 'darker and wilder'.",
            "entity": {
              "id": "1004A62C-76AF-41FB-996C-82247B275406",
              "name": "Tamino",
              "type": "urn:entity:artist",
              "affinity": 0.9059560198159116
            }
          }
        ]
      }
    ]
  },
  {
    "id": "german",
    "label": "German, three ways",
    "product": "70% single-origin dark chocolate bar, cacao from Bocas del Toro, Panama",
    "copy": "Grown on a small island farm in Bocas del Toro and fermented for six days in wooden boxes, this 70% bar tastes of red fruit, honey and a hint of tobacco. Smooth as a Brussels praline, but darker and wilder. Break off a square with your Sunday café au lait, or pair it with a glass of Port after dinner.",
    "markets": [
      {
        "city": "Munich",
        "ages": [
          "30_to_34",
          "35_to_44"
        ],
        "language": "German (Germany)"
      },
      {
        "city": "Zurich",
        "ages": [
          "30_to_34",
          "35_to_44"
        ],
        "language": "German (Switzerland)"
      },
      {
        "city": "Vienna",
        "ages": [
          "30_to_34",
          "35_to_44"
        ],
        "language": "German (Austria)"
      }
    ],
    "results": [
      {
        "city": "Munich",
        "language": "German (Germany)",
        "copy": "Angebaut auf einer kleinen Inselfarm in Bocas del Toro, Panama, und sechs Tage lang in Holzkisten fermentiert: Diese 70%-Tafel schmeckt nach roten Früchten, Honig und einem Hauch Tabak. Zart wie eine Salzburger Praline, nur dunkler und wilder. Brich dir ein Stück zum Sonntagsmilchkaffee ab – oder genieß sie nach dem Abendessen mit einem Glas Portwein.",
        "backTranslation": "Grown on a small island farm in Bocas del Toro, Panama, and fermented for six days in wooden boxes: this 70% bar tastes of red fruit, honey and a hint of tobacco. Smooth as a Salzburg praline, just darker and wilder. Break off a piece with your Sunday milky coffee – or enjoy it after dinner with a glass of Port.",
        "flags": [
          {
            "original": "Smooth as a Brussels praline",
            "problem": "Brussels doesn't resonate with this audience, so the comparison falls flat.",
            "evidence": "check_reference: Brussels is not in the top 100 destinations for Munich 30–44. Neuhaus, a proxy for Brussels pralines, is also not in the top 100 brands."
          }
        ],
        "references": [
          {
            "phrase": "Salzburger Praline",
            "why": "Salzburg is the #2 destination for Munich 30–44 in market_taste, right after Munich itself, so a Salzburg praline is a local benchmark for smooth chocolate.",
            "entity": {
              "id": "FC2D1B6C-C1F7-49FC-A548-ACAA1D813B82",
              "name": "Salzburg",
              "type": "urn:entity:destination",
              "affinity": 0.9260127507222549
            }
          },
          {
            "phrase": "Portwein",
            "why": "check_reference ranks Porto #63 of 100 destinations for this audience, so the source copy's Port pairing works and stays.",
            "entity": {
              "id": "E1ACE365-5184-4298-A919-F4609A95490B",
              "name": "Porto",
              "type": "urn:entity:destination",
              "affinity": 0.9203350492366098
            }
          }
        ]
      },
      {
        "city": "Zurich",
        "language": "German (Switzerland)",
        "copy": "Angebaut auf einer kleinen Inselfarm in Bocas del Toro, Panama, und sechs Tage lang in Holzkisten fermentiert: Diese 70%-Tafel schmeckt nach roten Früchten, Honig und einem Hauch Tabak. So zart wie eine Praline aus der Zürcher Confiserie, aber dunkler und wilder. Brich dir am Sonntag ein Stück zum Café crème ab, oder geniess sie nach dem Znacht mit einem Glas Portwein.",
        "backTranslation": "Grown on a small island farm in Bocas del Toro, Panama, and fermented for six days in wooden boxes: this 70% bar tastes of red fruit, honey and a hint of tobacco. As smooth as a praline from a Zurich confectioner, but darker and wilder. Break off a piece with your Sunday café crème, or enjoy it after dinner (Znacht) with a glass of Port.",
        "flags": [
          {
            "original": "Smooth as a Brussels praline",
            "problem": "Brussels doesn't resonate with this audience. In a market with its own strong confectionery culture, pointing to Belgium also undersells local expectations.",
            "evidence": "check_reference: Brussels is not in the top 100 destinations for Zurich 30–44. Neuhaus is not in the top 100 brands."
          }
        ],
        "references": [
          {
            "phrase": "Praline aus der Zürcher Confiserie",
            "why": "Zürich is the #1 destination for this audience in market_taste and is tagged 'Foodie Destination', so the city's own confectioners are the natural benchmark.",
            "entity": {
              "id": "684FE52E-569C-4A09-B728-A9D2B921AED8",
              "name": "Zürich",
              "type": "urn:entity:destination",
              "affinity": 0.9244921674591381
            }
          },
          {
            "phrase": "Portwein",
            "why": "check_reference ranks Porto #51 of 100 destinations for Zurich 30–44, so the Port pairing stays.",
            "entity": {
              "id": "E1ACE365-5184-4298-A919-F4609A95490B",
              "name": "Porto",
              "type": "urn:entity:destination",
              "affinity": 0.9203350492366098
            }
          }
        ]
      },
      {
        "city": "Vienna",
        "language": "German (Austria)",
        "copy": "Angebaut auf einer kleinen Inselfarm in Bocas del Toro, Panama, und sechs Tage lang in Holzkisten fermentiert: Diese 70%-Tafel schmeckt nach roten Früchten, Honig und einem Hauch Tabak. Zart wie eine Praline vom Wiener Zuckerbäcker, nur dunkler und wilder. Brich dir am Sonntag ein Stück zur Melange ab – oder genieß sie nach dem Abendessen mit einem Glaserl Portwein.",
        "backTranslation": "Grown on a small island farm in Bocas del Toro, Panama, and fermented for six days in wooden boxes: this 70% bar tastes of red fruit, honey and a hint of tobacco. Smooth as a praline from a Viennese confectioner, just darker and wilder. Break off a piece with your Sunday Melange – or enjoy it after dinner with a little glass of Port.",
        "flags": [
          {
            "original": "Smooth as a Brussels praline",
            "problem": "Brussels doesn't resonate with this audience, so the comparison falls flat.",
            "evidence": "check_reference: Brussels is not in the top 100 destinations for Vienna 30–44. Neuhaus is not in the top 100 brands."
          }
        ],
        "references": [
          {
            "phrase": "Praline vom Wiener Zuckerbäcker",
            "why": "Vienna is the top destination for this audience in market_taste and is tagged 'Foodie Destination', so a Viennese confectioner is a close, familiar benchmark.",
            "entity": {
              "id": "5DF2DCD1-6A55-41B1-ABA7-E315307BFC7F",
              "name": "Vienna",
              "type": "urn:entity:destination",
              "affinity": 0.9262890068479818
            }
          },
          {
            "phrase": "Portwein",
            "why": "check_reference ranks Porto #45 of 100 destinations for Vienna 30–44, its strongest showing of the three markets, so the Port pairing stays.",
            "entity": {
              "id": "E1ACE365-5184-4298-A919-F4609A95490B",
              "name": "Porto",
              "type": "urn:entity:destination",
              "affinity": 0.9203350492366098
            }
          }
        ]
      }
    ]
  },
  {
    "id": "tour",
    "label": "Island farm tour",
    "product": "Half-day cacao farm tour on a small island, Bocas del Toro, Panama",
    "copy": "Paddle past the mangroves to a farm that has grown cacao under the same shade trees for thirty years. We crack pods, taste the pulp straight from the seed, and roast a small batch over a wood fire. If your idea of a good morning is a Kew Gardens greenhouse or a slow episode of Chef's Table, this is that, with mud. Wear shoes you do not love.",
    "markets": [
      {
        "city": "Berlin",
        "ages": [
          "30_to_34",
          "35_to_44"
        ],
        "language": "German"
      },
      {
        "city": "Seoul",
        "ages": [
          "30_to_34",
          "35_to_44"
        ],
        "language": "Korean"
      },
      {
        "city": "New York",
        "ages": [
          "30_to_34",
          "35_to_44"
        ],
        "language": "English"
      }
    ],
    "results": [
      {
        "city": "Berlin",
        "language": "German",
        "copy": "Wir paddeln an den Mangroven vorbei zu einer Farm, auf der seit dreißig Jahren Kakao unter denselben Schattenbäumen wächst. Dort brechen wir Kakaofrüchte auf, probieren das Fruchtfleisch direkt vom Samen und rösten eine kleine Charge über dem Holzfeuer. Wenn du nach einer Folge „Getting Curious“ jedes Mal mehr wissen willst als vorher, ist dieser Vormittag genau das, nur mit Matsch. Zieh Schuhe an, an denen du nicht hängst.",
        "backTranslation": "We paddle past the mangroves to a farm where cacao has grown under the same shade trees for thirty years. There we break open cacao pods, taste the pulp straight from the seed, and roast a small batch over the wood fire. If you come away from an episode of 'Getting Curious' wanting to know more every time, this morning is exactly that, just with mud. Wear shoes you're not attached to.",
        "flags": [
          {
            "original": "Kew Gardens greenhouse",
            "problem": "A London botanic garden that this Berlin audience doesn't show affinity for. Berlin's own Britzer Garten didn't rank either, so the garden comparison was dropped.",
            "evidence": "check_reference: Royal Botanic Gardens, Kew is not in the top 100 places for Berlin 30–44; Britzer Garten is also not in the top 100."
          },
          {
            "original": "a slow episode of Chef's Table",
            "problem": "This show doesn't rank for this audience, so the hook would fall flat.",
            "evidence": "check_reference: Chef's Table is not in the top 100 tv_shows for Berlin 30–44."
          }
        ],
        "references": [
          {
            "phrase": "einer Folge „Getting Curious“",
            "why": "Getting Curious with Jonathan Van Ness was the top podcast returned by market_taste for Berlin 30–44 (tagged Education, Society & Culture), and its TV version also appeared in Berlin's TV list.",
            "entity": {
              "id": "ED9D4C2F-37B4-476F-B3DE-5F5EEB95E859",
              "name": "Getting Curious with Jonathan Van Ness",
              "type": "urn:entity:podcast",
              "affinity": 0.9849239060107498
            }
          }
        ]
      },
      {
        "city": "Seoul",
        "language": "Korean",
        "copy": "노를 저어 맹그로브 숲을 지나면, 30년 동안 같은 그늘나무 아래에서 카카오를 길러 온 농장에 닿습니다. 카카오 열매를 직접 쪼개고, 씨앗에 붙은 과육을 그 자리에서 맛보고, 장작불에 조금씩 볶아 봅니다. ‘서진이네’를 보면서 먼 곳의 부엌과 식탁에 마음이 갔다면, 바로 그 아침입니다. 진흙이 좀 묻을 뿐이에요. 아끼는 신발은 두고 오세요.",
        "backTranslation": "Paddle past the mangroves and you reach a farm that has grown cacao under the same shade trees for thirty years. We crack the cacao pods ourselves, taste the pulp clinging to the seed right there, and roast a small batch over a wood fire. If watching 'Jinny's Kitchen' made your heart go out to a faraway kitchen and table, this is that morning. There's just a bit of mud. Leave the shoes you love at home.",
        "flags": [
          {
            "original": "Kew Gardens greenhouse",
            "problem": "This London garden doesn't rank for this audience. Seoul Botanic Park didn't rank either, so the garden comparison was dropped.",
            "evidence": "check_reference: Royal Botanic Gardens, Kew is not in the top 100 places for Seoul 30–44; Seoul Botanic Park is also not in the top 100."
          },
          {
            "original": "a slow episode of Chef's Table",
            "problem": "This show doesn't rank for this audience. It was replaced with a cooking show that does rank.",
            "evidence": "check_reference: Chef's Table is not in the top 100 tv_shows for Seoul 30–44."
          }
        ],
        "references": [
          {
            "phrase": "‘서진이네’",
            "why": "Jinny's Kitchen ranks #9 of 100 TV shows for Seoul 30–44 according to check_reference, and Qloo tags it Warm, Humble, Cuisine and Hospitality.",
            "entity": {
              "id": "6F301503-6B15-4939-9E73-42271C24D7D6",
              "name": "Jinny's Kitchen",
              "type": "urn:entity:tv_show",
              "affinity": 0.9756186404694326
            }
          }
        ]
      },
      {
        "city": "New York",
        "language": "English",
        "copy": "Paddle past the mangroves to a farm that has grown cacao under the same shade trees for thirty years. We crack pods, taste the pulp straight from the seed, and roast a small batch over a wood fire. If Sweetbitter left you wanting to taste everything where it comes from, this is that morning, with mud. Wear shoes you do not love.",
        "backTranslation": null,
        "flags": [
          {
            "original": "Kew Gardens greenhouse",
            "problem": "This London garden doesn't rank for this audience. Brooklyn Botanic Garden didn't rank either, so the garden comparison was dropped.",
            "evidence": "check_reference: Royal Botanic Gardens, Kew is not in the top 100 places for New York 30–44; Brooklyn Botanic Garden is also not in the top 100."
          },
          {
            "original": "a slow episode of Chef's Table",
            "problem": "This show doesn't rank for this audience, even in New York.",
            "evidence": "check_reference: Chef's Table is not in the top 100 tv_shows for New York 30–44."
          }
        ],
        "references": [
          {
            "phrase": "Sweetbitter",
            "why": "Sweetbitter was the top TV show returned by market_taste for New York 30–44, tagged Thoughtful and Ambitious.",
            "entity": {
              "id": "FA338ACC-A10B-4B0B-BA5A-772F7E6E5B2D",
              "name": "Sweetbitter",
              "type": "urn:entity:tv_show",
              "affinity": 0.9824033384274705
            }
          }
        ]
      }
    ]
  },
  {
    "id": "balm",
    "label": "Cacao-butter lip balm",
    "product": "Cacao-butter lip balm, small batch, Bocas del Toro, Panama",
    "copy": "The cacao butter in this balm is pressed on the farm from the same beans as our 70% bar. It smells faintly of chocolate, goes on clean, and holds up in real heat. Think French pharmacy classic, Nuxe rather than lip gloss. Toss it in your bag next to your Moleskine and forget about it until you need it.",
    "markets": [
      {
        "city": "Paris",
        "ages": [
          "25_to_29",
          "30_to_34"
        ],
        "language": "French"
      },
      {
        "city": "Los Angeles",
        "ages": [
          "25_to_29",
          "30_to_34"
        ],
        "language": "English"
      },
      {
        "city": "Mexico City",
        "ages": [
          "25_to_29",
          "30_to_34"
        ],
        "language": "Spanish"
      }
    ],
    "results": [
      {
        "city": "Paris",
        "language": "French",
        "copy": "Le beurre de cacao de ce baume est pressé à la ferme, à Bocas del Toro, au Panama, à partir des mêmes fèves que notre tablette 70 %. Fabriqué en petite série. Il sent légèrement le chocolat, s'applique net et tient vraiment à la chaleur. Un classique de pharmacie : plus Nuxe que gloss. Glissez-le dans votre sac et oubliez-le jusqu'au moment où vous en aurez besoin.",
        "backTranslation": "The cacao butter in this balm is pressed on the farm, in Bocas del Toro, Panama, from the same beans as our 70% bar. Made in small batches. It smells faintly of chocolate, goes on clean and really holds up in the heat. A pharmacy classic: more Nuxe than gloss. Slip it into your bag and forget about it until the moment you need it.",
        "flags": [
          {
            "original": "Toss it in your bag next to your Moleskine",
            "problem": "Moleskine doesn't register with this audience, so I dropped it and kept the 'forget it in your bag' line.",
            "evidence": "check_reference: Moleskine is not in the top 100 brands for Paris, ages 25–34."
          }
        ],
        "references": [
          {
            "phrase": "plus Nuxe que gloss",
            "why": "Nuxe ranks #68 of 100 brands for Parisians aged 25–34. It also came in second in this audience's skincare-brand list, with apothecary-inspired design tags.",
            "entity": {
              "id": "03B90ED7-5614-4D68-B713-26F3AC5FD79D",
              "name": "nuxe",
              "type": "urn:entity:brand",
              "affinity": 0.9757499937029677
            }
          }
        ]
      },
      {
        "city": "Los Angeles",
        "language": "English",
        "copy": "The cacao butter in this balm is pressed right on the farm in Bocas del Toro, Panama, from the same beans as our 70% bar. Small batch. It smells faintly of chocolate, goes on clean, and holds up in real heat. It belongs on the shelf next to Herbivore Botanicals, not in the lip gloss aisle. Drop it in your bag and forget about it until you need it.",
        "backTranslation": null,
        "flags": [
          {
            "original": "Think French pharmacy classic, Nuxe rather than lip gloss",
            "problem": "Nuxe doesn't register in LA, and the 'French pharmacy' idea depends on it. I replaced it with a skincare brand this audience does have affinity for.",
            "evidence": "check_reference: nuxe is not in the top 100 brands for Los Angeles, ages 25–34."
          },
          {
            "original": "Toss it in your bag next to your Moleskine",
            "problem": "Moleskine doesn't register with this audience, so I dropped it.",
            "evidence": "check_reference: Moleskine is not in the top 100 brands for Los Angeles, ages 25–34."
          }
        ],
        "references": [
          {
            "phrase": "next to Herbivore Botanicals, not in the lip gloss aisle",
            "why": "Herbivore Botanicals is in the top skincare brands for LA 25–34s, tagged botanical and minimalist, which matches the plain, natural feel of the balm.",
            "entity": {
              "id": "83E998F3-9AD1-4CFE-95E4-7F69D62DD1C5",
              "name": "Herbivore Botanicals",
              "type": "urn:entity:brand",
              "affinity": 0.9697762735586495
            }
          }
        ]
      },
      {
        "city": "Mexico City",
        "language": "Spanish",
        "copy": "La manteca de cacao de este bálsamo se prensa en la finca, en Bocas del Toro, Panamá, con los mismos granos de nuestra tableta de chocolate al 70 %. Hecho en lotes pequeños. Huele apenas a chocolate, se aplica limpio y aguanta el calor de verdad. Es más un básico de farmacia, en la línea de Neutrogena, que un gloss. Échalo a tu bolsa y olvídate de él hasta que lo necesites.",
        "backTranslation": "The cacao butter in this balm is pressed on the farm, in Bocas del Toro, Panama, from the same beans as our 70% chocolate bar. Made in small batches. It smells just faintly of chocolate, goes on clean and truly holds up in the heat. It's more a pharmacy staple, along the lines of Neutrogena, than a gloss. Toss it in your bag and forget about it until you need it.",
        "flags": [
          {
            "original": "Think French pharmacy classic, Nuxe rather than lip gloss",
            "problem": "Nuxe doesn't register in Mexico City, so I kept the pharmacy framing and swapped in a brand this audience does have affinity for.",
            "evidence": "check_reference: nuxe is not in the top 100 brands for Mexico City, ages 25–34."
          },
          {
            "original": "Toss it in your bag next to your Moleskine",
            "problem": "Moleskine doesn't register with this audience, so I dropped it.",
            "evidence": "check_reference: Moleskine is not in the top 100 brands for Mexico City, ages 25–34."
          }
        ],
        "references": [
          {
            "phrase": "un básico de farmacia, en la línea de Neutrogena",
            "why": "Neutrogena is in the top skincare brands for Mexico City 25–34s, and it keeps the 'pharmacy staple' framing without Nuxe, which doesn't register here.",
            "entity": {
              "id": "82ECA4DE-9055-4C7E-915F-6C39F81337FF",
              "name": "Neutrogena",
              "type": "urn:entity:brand",
              "affinity": 0.9643172921525637
            }
          }
        ]
      }
    ]
  }
];
