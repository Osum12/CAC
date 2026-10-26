# Short titles and topics for Fulton County Board of Commissioners items

You are writing display titles for a civic-information app (Council Lens) that shows real Fulton County, Georgia Board of Commissioners agenda items. Accuracy matters more than style: residents will read these, and the full official wording is shown under each title.

## Input
`batch-N.json`: an array of items `{ file, type, requester, outcome, official }`.
- `official` is the county's own item description (clerk notes removed). It is the ONLY source of facts.
- `type` is the agenda section (e.g. "Consent - Open & Responsible Government", "Commissioners Action Item").
- `outcome` is what happened (approved/failed/denied/held/filed/removed/hearing/null). Do NOT put the outcome in the title.

## Output
Write `out-N.json` next to the input: a JSON object keyed by `file`:
```json
{ "25-0656": { "title": "Hazardous waste disposal contract renewal (Clean Harbors)", "category": "utilities" } }
```
Every input item must have an entry. Valid JSON only (use the Write tool, then verify it parses with `node -e "JSON.parse(require('fs').readFileSync('out-N.json','utf8'))"`).

## Title rules
- Plain English, sentence case, at most 90 characters. Say what the item IS about, so a resident can scan a list.
- Start with the subject, not with "Request approval", "Resolution to", "A", or "An". Good: "Jail elevator modernization contract", "Calling on the state to repeal the six-week abortion ban", "Sewer easement for the QuickTrip project in Union City".
- Use ONLY facts in `official`. Never add a number, dollar amount, date, name, place, or vendor that is not literally in `official`. Prefer no numbers at all; if you include one, copy it exactly (e.g. "$70,000", "2027").
- Keep proper names exactly as written (vendors, places, programs, boards). You may drop "Inc.", "LLC", city/state in parentheses.
- Contracts: name the service, and the vendor if there is one main vendor; say renewal/extension/amendment/award/purchase when the text says so. Example: "Contract renewal: Toxicology testing (NMS Labs)". Contract-number codes like 24RFP144589C-JH never go in titles.
- Board appointments (text begins with a board name in capitals): "Appointment to the Fulton County Arts Council".
- Easements / indemnification agreements: say what and where, e.g. "Sewer easement for the Canton on Mayfield project, Alpharetta".
- Resolutions by commissioners: describe the aim in plain words, faithful to the text ("urging", "directing the County Manager to…", "opposing House Bill 369…"). Do not editorialize or judge.
- Don't use ALL CAPS, quotes around whole titles, or a trailing period.

## Category (pick exactly one)
`budget_and_taxes` (budget, millage/property tax, sales tax, financing, bonds, fees, pensions/benefits funding)
`public_safety` (jail, sheriff, police, fire, courts, DA, public defender, medical examiner, emergency services, 911)
`utilities` (water, sewer, stormwater, public works water/sewer, easements for water/sewer)
`transportation` (roads, transit, MARTA, airport, traffic, TSPLOST projects)
`housing_and_neighborhoods` (housing, homelessness, CDBG/HUD, community development, blight)
`health` (public health, behavioral health, hospitals, HIV/Ryan White, opioids, clinics)
`human_services` (seniors, veterans, youth, workforce, disabilities, food, family services)
`parks_and_culture` (libraries, arts, culture, parks, recreation)
`development_and_zoning` (zoning, land use, economic development, development authority, incentives)
`elections` (Registration and Elections, voting, election equipment/staffing)
`board_appointments` (appointments/nominations to boards, authorities, commissions)
`government` (everything else: IT, facilities, real estate, HR, purchasing, policies about the Board itself, county operations)

Pick by what the item is ABOUT for residents, not only by department (e.g. a Public Works contract for fire hydrant repair is `utilities`; a Real Estate department contract for jail roofing is `public_safety`).

Work through every item carefully. When done, report: the output path, item count, and any items you were unsure about.
