# Project ARL

Closed-loop **ECHS referral management** for VPS Lakeshore Hospital, Kochi, built to sit beside the **Datamate HIS**.

This front end is modelled on the "How it works" flow of referral-management platforms like Locata Health (referral in → triage → match → book → track), reworked for how ECHS runs in India:

- Ex-servicemen and their dependants are referred by an **ECHS Polyclinic** Medical Officer.
- The hospital checks the **ECHS card** and the **referral validity**.
- **Emergency admissions** have to be reported to the polyclinic / Regional Centre within a fixed window.
- Treatment is **cashless** at ECHS rates.
- Claims go to the **bill-processing agency** with the referral, the discharge summary and the itemised bill.

## What's in the prototype

| Route | Who it's for | What it does |
|---|---|---|
| `#/` | Everyone | Landing page with a "How it works" section that has three tabs (beneficiary, polyclinic, hospital), the features, and a system architecture diagram |
| `#/desk` | Insurance desk / billing | Referral worklist: KPIs, a stage pipeline, search, and per-referral alerts (validity lapsing, 48-hour emergency intimation, claim-upload target, ECHS queries) |
| `#/desk/:id` | Desk officer | Referral detail: 8-stage tracker, a guided "next step", Datamate patient matching and registration, opening the OP/IP encounter, document checklist, claim pack, settlement, timeline |
| `#/desk/new` | Front office / desk | Referral intake form. It checks for **duplicate patients in Datamate** as you type, and flags duplicate referral numbers and expired referrals |
| `#/track` | Beneficiary / family | Plain-language status page, looked up by reference number plus the last 4 digits of the mobile number |

Everything runs in the browser against **mock data** (`localStorage`). There is no real patient data.

## Architecture

The design follows the *Technology, Data & AI Readiness Assessment* (Sept 2026):

- **Datamate HIS is the system of record.** Registration (Front Desk), the ECHS scheme (Insurance Desk), appointments, IP admissions, discharge summaries and billing all live there. ARL holds only the referral, its clocks, its documents and its status.
- **ARL never writes to the Oracle schemas directly.** All HIS calls go through the `HisAdapter` interface (`src/lib/his.ts`). In production that interface is implemented on the **Integration Gateway (M9)**.
- **Match before create.** Every registration goes through **Patient Identity (M3)** matching on card, mobile, DOB and name. This closes the gap where call-centre intake creates duplicate MRNs.
- **Referral events feed the Unified Data Platform (M10)** and from there the **Enquiry-to-Revenue Waterfall (M11)**.

```
src/
  lib/
    types.ts      Referral / beneficiary domain model and the 8 stages
    config.ts     Policy parameters (validity, intimation window), polyclinics, specialties
    his.ts        HisAdapter interface + MockDatamateAdapter
    rules.ts      ECHS rules: validity, emergency clock, alerts
    store.tsx     State (localStorage for the demo; replace with the ARL API)
    mockData.ts   Sample referrals
  pages/          Landing, Desk, ReferralDetail, NewReferral, Track
  components/     Architecture diagram, stage tracker, badges
```

## Run it

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # static build in dist/, can be served from any path (HashRouter, base './')
```

## To confirm before go-live

- **Policy values** in `src/lib/config.ts`: the 30-day referral validity, the 48-hour emergency intimation window and the claim-upload target. Check these against the current ECHS MoA with RC Thiruvananthapuram.
- **ECHS card and referral number formats.** The prototype doesn't enforce a format yet.
- **Datamate integration.** Which Insurance Desk / Front Desk operations can be driven by API or HL7, and the patient-type code for ECHS.
- **Polyclinic list** and specialty empanelment for Kochi and Calicut.
- **Data protection.** Beneficiary data is personal data under the DPDP Act 2023. The tracking page is designed to show no clinical or financial detail.
