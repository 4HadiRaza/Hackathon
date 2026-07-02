import type { Case } from "@/types";

export const MOCK_CASES: Case[] = [
  {
    id: "case_001",
    title: "The Midnight Code Leak",
    summary: "The core machine learning weights of TechCorp's revolutionary new AI assistant, 'Aether', were downloaded onto an external drive at 12:42 AM. The server room requires physical security badge access and has no external network access.",
    suspects: [
      {
        name: "Devon Vance",
        motive: "Was recently passed over for a promotion to Lead AI Architect. He has been complaining about TechCorp's 'corporate greed'.",
        alibi: "Claimed he was at home sleeping alone. Says his phone was off to avoid work calls.",
        statement: "I was asleep in my bed by 11 PM. I turn my phone completely off at night. Sure, I'm mad about the promotion, but I'm not a thief. I didn't even go near the office."
      },
      {
        name: "Sarah Chen",
        motive: "Her younger brother is deeply in debt to offshore gambling groups, who have been threatening her family.",
        alibi: "Claimed she was working late in her private laboratory on the 3rd floor until 1 AM, but she asserts she never went down to the basement server room.",
        statement: "I was up on the 3rd floor running evaluations on our neural networks until 1 AM. I never went down to the basement. You can ask security, I stayed in my lab the whole time."
      },
      {
        name: "Marcus Brodie",
        motive: "Has a secret consulting agreement with TechCorp's primary competitor, SiliconNexus.",
        alibi: "Claimed he left the office at 6 PM to attend a dinner party, and then went directly to a local jazz club until closing.",
        statement: "I was at a dinner party with five friends until 10 PM. After that, I went to the Blue Note Jazz Club until 2 AM. The bartender knows me well, he can verify I was there the entire time."
      }
    ],
    evidence: [
      {
        type: "digital",
        description: "Server access logs show Sarah Chen's physical security badge was used to scan into the basement server room elevator at 12:35 AM.",
        source: "Basement elevator scanner database"
      },
      {
        type: "physical",
        description: "A partially finished cup of premium organic green tea was found sitting on top of the server rack. Marcus Brodie is the only employee known to drink this specific brand.",
        source: "Crime scene investigator report"
      },
      {
        type: "surveillance",
        description: "Footage from the jazz club entrance shows Marcus Brodie arriving at 12:15 AM and leaving at 12:55 AM, contradicting his claim of being there the entire night.",
        source: "Blue Note Jazz Club external camera"
      }
    ],
    status: "open",
    createdAt: new Date("2026-07-02T01:00:00Z").toISOString(),
    updatedAt: new Date("2026-07-02T01:00:00Z").toISOString()
  },
  {
    id: "case_002",
    title: "The Poisoned Espresso",
    summary: "Renowned venture capitalist Arthur Sterling was found dead at his desk at 9:00 AM, poisoned by a lethal dose of cyanide slipped into his double espresso. The coffee machine was located in the private executive lounge.",
    suspects: [
      {
        name: "Evelyn Sterling",
        motive: "Arthur's estranged wife who was recently written out of his will in favor of his new business partner.",
        alibi: "Claimed she was at her morning yoga class from 7:30 AM to 8:30 AM.",
        statement: "Arthur and I had our issues, but I would never kill him. I was at the Lotus Yoga studio all morning. You can check the register, I signed in at 7:25 AM."
      },
      {
        name: "Victor Vance",
        motive: "Arthur's junior business partner who was about to be fired for embezzlement of fund assets.",
        alibi: "Claimed he was at a breakfast meeting across town at the Grand Hotel with a potential investor from 8:00 AM to 9:30 AM.",
        statement: "I arrived at the Grand Hotel at 7:55 AM. I waited in the lobby for our investor, Mr. Gable, who unfortunately cancelled last minute. I sat in the lobby cafe drinking tea until 9:15 AM."
      },
      {
        name: "Clara Webb",
        motive: "Arthur's executive assistant who was secretly being blackmailed by him over her past criminal record.",
        alibi: "Said she was at her desk from 8:00 AM onwards, making the coffee for Arthur when he arrived at 8:30 AM.",
        statement: "I brewed the espresso just the way Arthur liked it at 8:25 AM, placed it on his desk, and left immediately. No one else entered the room until I found him at 9:00 AM."
      }
    ],
    evidence: [
      {
        type: "document",
        description: "A half-shredded document in Victor's office shows that Arthur had drafted an official police report regarding Victor's embezzlement, dated for release at 10:00 AM.",
        source: "Arthur's shredding bin"
      },
      {
        type: "surveillance",
        description: "Grand Hotel lobby cameras show Victor Vance was not in the lobby or cafe between 8:00 AM and 9:00 AM. He scanned his badge entering Arthur's office building at 8:15 AM.",
        source: "Grand Hotel and Tech Tower security footage"
      },
      {
        type: "forensic",
        description: "A small vial containing traces of potassium cyanide was found hidden inside the potted fern in the executive lounge, bearing Clara's fingerprints.",
        source: "Forensic laboratory report"
      }
    ],
    status: "open",
    createdAt: new Date("2026-07-02T02:00:00Z").toISOString(),
    updatedAt: new Date("2026-07-02T02:00:00Z").toISOString()
  },
  {
    id: "case_003",
    title: "The Vanishing Masterpiece",
    summary: "The priceless painting 'The Whispering Shadows' was cut from its frame at the Grand Gallery between 2:00 AM and 3:00 AM. The laser security grid was temporarily disabled.",
    suspects: [
      {
        name: "Julian Sterling",
        motive: "Deeply in debt to art smugglers, Julian has long coveted the painting.",
        alibi: "Claimed he was hosting a private poker game at his home all night.",
        statement: "I had four guys over for cards. We played from 9 PM until 4 AM. I didn't leave the table once, except to get more drinks from the kitchen."
      },
      {
        name: "Celeste Monet",
        motive: "A rival artist who claimed the painting was plagiarized from her early sketches.",
        alibi: "Claims she was painting in her studio alone, losing track of time.",
        statement: "I was painting all night. When inspiration strikes, I don't look at the clock. I didn't go near the gallery."
      },
      {
        name: "Raymond Black",
        motive: "The gallery's head of security, who had been complaining about underfunding and bad management.",
        alibi: "Claimed he was on his scheduled patrol route on the gallery's perimeter.",
        statement: "I was outside doing the perimeter check from 2:00 AM to 3:00 AM. I noticed nothing unusual until I went back inside and saw the empty frame."
      }
    ],
    evidence: [
      {
        type: "digital",
        description: "The security log shows the laser grid override code scanned was registered to Raymond Black.",
        source: "Gallery Security Log"
      },
      {
        type: "surveillance",
        description: "Surveillance footage shows a figure matching Julian Sterling's height and gait entering through the service door at 2:15 AM using a key card.",
        source: "Service entrance camera"
      },
      {
        type: "physical",
        description: "A duplicate key card registered to Raymond Black was found discarded in a trash can near the gallery, wiped clean of prints.",
        source: "Trash search report"
      }
    ],
    status: "open",
    createdAt: new Date("2026-07-02T03:00:00Z").toISOString(),
    updatedAt: new Date("2026-07-02T03:00:00Z").toISOString()
  },
  {
    id: "case_004",
    title: "The Red Herring Ransom",
    summary: "The CEO of NovaCorp was kidnapped at 10 PM. A ransom note demanding $5M was left behind. A physical tracker key was found dropped at the scene, pointing to a local warehouse.",
    suspects: [
      {
        name: "Dax Miller",
        motive: "Disgruntled ex-employee who vowed revenge against the CEO.",
        alibi: "Claimed he was working his night shift at a 24-hour gas station.",
        statement: "I was at the pump all night. You can ask my manager, I clocked in at 8 PM and didn't leave until 6 AM."
      },
      {
        name: "Benton Vance",
        motive: "The CEO's ambitious deputy who would inherit control of NovaCorp.",
        alibi: "Claims he was asleep at home with his wife.",
        statement: "I was in bed by 9:30 PM. My wife can confirm I was there the whole night."
      },
      {
        name: "Fiona Glass",
        motive: "A notorious thief who has targeted NovaCorp assets in the past.",
        alibi: "Said she was at a theater performance until 11 PM.",
        statement: "I was watching the new play downtown. The ticket was bought in my name, and I sat in row F until the final curtain."
      }
    ],
    evidence: [
      {
        type: "physical",
        description: "A tracker key dropped at the kidnapping scene belonged to Dax Miller. However, Dax's fingerprints were NOT found on the device. Instead, microscopic fibers of high-end silk (matching Benton Vance's suits) were found on it.",
        source: "Forensic analysis of the tracker key"
      },
      {
        type: "surveillance",
        description: "Fiona Glass was spotted on street cameras outside the theater at 9:55 PM, proving she left the show early.",
        source: "City CCTV footage"
      },
      {
        type: "digital",
        description: "An anonymous transfer of $50,000 was sent from Benton Vance's personal account to an offshore account associated with Fiona Glass's associate just two hours before the kidnapping.",
        source: "Financial intelligence report"
      }
    ],
    status: "open",
    createdAt: new Date("2026-07-02T04:00:00Z").toISOString(),
    updatedAt: new Date("2026-07-02T04:00:00Z").toISOString()
  }
];
