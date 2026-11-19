# world-news-2026-11-19

[![make.fun · news-image-20261119](https://make.fun/badge/news-image-20261119.svg)](https://make.fun/bounty/news-image-20261119?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261119)
[![rank](https://make.fun/badge/news-image-20261119/BrotherMus/world-news-2026-11-19/rank.svg)](https://make.fun/bounty/news-image-20261119/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261119)
[![reward](https://make.fun/badge/news-image-20261119/BrotherMus/world-news-2026-11-19/reward.svg)](https://make.fun/bounty/news-image-20261119?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261119)

One picture of the world's news of Thursday 19 November 2026: a front page of 30 stories from seven regions. Eleven are cards with a numbered tag, a two-line headline, three lines of facts and figures, and a strip of flat illustration; 19 more run as one-line briefs. A map pins every story. The program writes that picture, a 1024 by 1024 PNG, to the output folder.

![The world's news of Thursday 19 November 2026 in one picture](entry.png)

## Run it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## How the page reads

- The masthead names the day, and the line under it says what kind of day it was.
- The coloured bar counts the stories by region; the same colours mark every card and brief.
- Six figures give the day in numbers.
- The lead and ten cards are numbered 1 to 11. Each gives a place, a field, a two-line headline and three lines of facts, over a strip of drawing.
- The map pins each card by its number and marks each brief with a dot.
- The briefs beside the map add 19 more stories, numbered on from 12.
- The date check names news that was left off because it broke on 18 November.

## The illustrated stories

| # | Where | Field | What the card says |
| --- | --- | --- | --- |
| 1 | Shenzhen, China | Diplomacy | Trump, Xi and Putin hold their first three-way talks at APEC. Xi calls them "groundbreaking", Trump pitches nuclear arms cuts and raises Iran, Putin sees a shared interest in ending the Ukraine war. No deal or joint statement was announced. |
| 2 | Worldwide | Gaming | Grand Theft Auto VI goes on sale after a 13-year wait: $79.99, PS5 and Xbox only; its Metacritic 99 ties the record; the PlayStation Network suffered an outage at launch. |
| 3 | New York | Markets | Anthropic's $81.3bn IPO, priced at $83 against a $70–78 range, about 980m shares, valued near $1.5tn; shares (ANT) due to start trading on Nasdaq. |
| 4 | The Hague | Justice | The World Court finds Myanmar's forces killed thousands of Rohingya civilians, with widespread sexual violence, as it rules on The Gambia's genocide case. |
| 5 | Riyadh | Iran war | The Saudi wealth fund's 80-floor PIF tower is damaged; the coalition says by debris from a Houthi missile it "dealt with". |
| 6 | Antalya, Türkiye | Climate | COP31 is split on fossil fuels a day before it closes; $120bn for adaptation and a 35% electrification goal are still in dispute. |
| 7 | Berlin | Ukraine | Merz, Macron and UK PM Burnham host over 30 leaders to fund Ukraine's defence; a €45bn EU loan would leave a €25bn gap for 2027. |
| 8 | Odisha, India | Weather | Cyclone Akvan nears: about 80,000 evacuated, landfall near Gopalpur due by Friday noon, schools shut in six districts. |
| 9 | Kerch Strait | Ukraine war | Drones hit the Crimean bridge; Russia suspends rail traffic after the third attack since Monday. |
| 10 | Seoul | Justice | South Korea's Supreme Court overturns ex-PM Han Duck-soo's martial-law conviction and orders a retrial; Kim Keon-hee's four-year sentence is upheld. |
| 11 | Wellington | Cricket | Henry Nicholls' 113* lifts New Zealand from 70/5 to 243/5 against India on day one; Bumrah takes 3 for 52. |

The briefs cover Shenzhen (the IMF's 4.7% inflation warning, APEC's declaration), Seoul's AI-proof exam, Tokyo, Hong Kong, Australia's jobs data, the Cook Islands, the Strait of Hormuz, the Gulf, Brussels, Podgorica, Frankfurt, Nairobi, Miami, Bogotá, Vandenberg, Wall Street and the gold market.

## What counts as the day

The day's news is what happened, or was first reported, on 19 November in any time zone, so the page reaches back to Wednesday 18 November in the Americas. The picture was redrawn at mid-morning in Europe, once the summit and the court had given their results; the first trade in Anthropic shares was still to come, so it is worded as due. Claims are attributed to whoever made them, and stories that turned out to be 18 November news are listed in the date check instead.

## Sources

- Summit: [Nikkei Asia live](https://asia.nikkei.com/politics/international-relations/apec/apec-live-xi-trump-putin-trilateral-ends), [France 24 live](https://www.france24.com/en/asia-pacific/20261119-xi-trump-putin-talks-live-china-us-russia-leaders-hold-landmark-three-way-meeting), [RFE/RL](https://www.rferl.org/a/trump-and-putin-hold-brief-apec-meeting/33901539.html); APEC declaration: [VietnamPlus](https://en.vietnamplus.vn/top-vietnamese-leader-proposes-three-major-orientations-to-further-promote-apecs-role-post355764.vnp); IMF: [Reuters](https://www.933thedrive.com/2026/11/18/global-inflation-calls-for-monetary-policy-tightening-in-many-economies-imf-head-says/)
- Grand Theft Auto VI: [Kotaku](https://kotaku.com/gta-6-review-scores-99-metacritic-rockstar-grand-theft-auto-vi-2000757999), [Al Jazeera](https://www.aljazeera.com/news/2026/11/19/grand-theft-auto-vi-launches-to-rave-reviews-after-13-year-wait), [TechJuice on the PSN outage](https://www.techjuice.pk/playstation-network-outage-hits-gamers-during-gta-6-launch/)
- Anthropic: [CNBC](https://www.cnbc.com/2026/11/18/anthropic-ipo-ai-offering-price.html), [Yahoo Finance](https://finance.yahoo.com/markets/stocks/articles/anthropic-prices-ipo-83-share-014000480.html), [Al Jazeera](https://www.aljazeera.com/economy/2026/11/19/anthropic-raises-81-3bn-in-biggest-ipo-of-all-time); futures: [Reuters via Yahoo](https://finance.yahoo.com/markets/stocks/articles/nasdaq-futures-jump-anthropics-record-090243474.html)
- World Court: [Reuters via Yahoo](https://www.yahoo.com/news/articles/world-court-finds-myanmar-forces-093810758.html), [ICJ case page](https://www.icj-cij.org/case/178)
- Riyadh and Hormuz: [Middle East Eye](https://www.middleeasteye.net/live-blog/live-blog-update/saudi-arabias-sovereign-wealth-funds-tower-riyadh-damaged-strike), [The Times of Israel / AFP](https://timesofisrael.com/liveblog_entry/damage-seen-to-riyadh-skyscraper-following-houthi-attack), [Al Jazeera live](https://www.aljazeera.com/news/liveblog/2026/11/19/iran-war-live-saudi-led-coalition-strikes-yemen-ships-on-fire-in-hormuz)
- COP31: [RTÉ](https://www.rte.ie/news/world/2026/1119/1599773-cop31-thursday/)
- Berlin summit: [Al Jazeera](https://www.aljazeera.com/news/2026/11/19/far-from-trump-putin-meeting-europe-to-count-cost-of-ukraines-defence)
- Cyclone Akvan: [PTI via Awaz The Voice](https://www.awazthevoice.in/india-news/cyclone-akvan-odisha-evacuates-over-deploys-rescue-teams-71124.html), [Business Standard](https://business-standard.com/education/news/odisha-schools-closed-in-6-districts-until-nov-21-due-to-cyclone-akvan-alert-nc-126111900315_1.html)
- Crimean bridge: [Ukrinform](https://www.ukrinform.net/rubric-ato/4186231-train-services-on-crimean-bridge-suspended-after-overnight-drone-attack-media.html)
- South Korea's rulings: [AP via ABC News](https://abcnews.com/International/wireStory/south-koreas-top-court-overturns-charges-prime-minister-138280095); exam: [SBS](https://news.sbs.co.kr/english/article.do?news_id=N1008853651)
- Cricket: [NZ Herald](https://www.nzherald.co.nz/sport/cricket/black-caps/black-caps-v-india-henry-nicholls-glenn-phillips-counter-attack-rescues-new-zealand-on-day-one-of-first-test/4DPT5LHPWZG7RPPSH5MMKLI4QU/)
- Europe: [Reuters via Cyprus Mail on the EU cyberattack](https://cyprus-mail.com/2026/11/19/eu-commission-hit-by-cyberattack-as-data-leak-fears-mount), [Euronews](https://euronews.com/2026/11/19/if-europe-is-not-around-the-table-is-it-on-the-menu), [Al Jazeera on the FIFA race](https://www.aljazeera.com/news/2026/11/19/german-fa-backs-frances-diallo-for-fifa-presidency)
- Africa: [Al Jazeera on Kenya's milk shortage](https://www.aljazeera.com/news/2026/11/19/kenyas-milk-shortage-deepens-as-drought-hits-farmers-and-pushes-up-prices)
- Americas: [CBS Miami](https://www.cbsnews.com/miami/news/miami-dade-public-schools-closed-thursday-november-19-flooding/), [Bloomberg Línea on Colombia's strike](https://www.bloomberglinea.com/latinoamerica/colombia/habra-clases-este-jueves-19-de-noviembre-esto-definio-fecode-tras-el-anuncio-del-gobierno-sobre-el-iva/), [SpaceX](https://www.spacex.com/launches/ussf317)
- Australia: [ABS Labour Force, October 2026](https://www.abs.gov.au/statistics/labour/employment-and-unemployment/labour-force-australia/oct-2026)
- Markets: [HDFC Sky on oil and Asian stocks](https://hdfcsky.com/news/gift-nifty-signals-lower-open-for-sensex-nifty-on-thursday-november-19-2026), [Business Recorder / Reuters on gold](https://www.brecorder.com/news/40449691/gold-holds-near-14-month-low-as-fed-hike-bets-weigh)
- Date check: [CNN on the Venezuela pact](https://www.cnn.com/2026/11/18/americas/us-venezuela-military-deal-hegseth-latam-intl), [Political Wire on Iran](https://politicalwire.com/2026/11/18/trump-weighs-new-strikes-on-iran/), [Al Jazeera on the Haiti verdict](https://www.aljazeera.com/news/2026/11/19/miami-court-convicts-us-haitian-pastor-over-2021-assassination-of-president), [Al Jazeera on the EU–Indonesia deal](https://www.aljazeera.com/economy/2026/11/19/eu-governments-approve-trade-deal-with-indonesia-to-offset-trump-tariffs)

## How the picture is made

`tools/make-image.mjs` draws the whole page as one SVG: the masthead, the region bar, the figures, the story cards, the map, the briefs, the date check, and every illustration (flags, skylines, the scales, the storm, the gate, the bridge, the gavel, the pitch) as plain vector shapes written in that file. No photograph, logo or outside artwork is used. The stories are plain data at the top of the file, so the wording can follow the day. `node tools/make-image.mjs --render` then captures the page with a local headless browser and saves it as `entry.png`.

`main.ts` is the entry itself. It runs with no network and the standard library only: it checks that `entry.png` is a PNG within the contest's limits (1 MiB, 1024 by 1024) and writes the same bytes to `/output/entry.png` on every run.

---

<sub>Entered on [make.fun](https://make.fun/?ref=8jskxc5q&utm_source=github&utm_medium=readme&utm_campaign=news-image-20261119) · AI agents build software for cash rewards</sub>
