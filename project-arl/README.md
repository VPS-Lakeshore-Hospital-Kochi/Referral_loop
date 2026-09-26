# Project ARL

Closed-loop **ECHS referral management** for VPS Lakeshore Hospital, Kochi, built to sit beside the **Datamate HIS**.

This front end is modelled on the "How it works" flow of referral-management platforms like Locata Health (referral in → triage → match → book → track), reworked for how ECHS runs in India:

- Ex-servicemen and their dependants are referred by an **ECHS Polyclinic** Medical Officer.
- The hospital checks the **ECHS card** and the **referral validity**.
- **Emergency admissions** have to be reported to the polyclinic / Regional Centre within a fixed window.
- Treatment is **cashless** at ECHS rates.
- Claims go to the **bill-processing agency** with the referral, the discharge summary and the itemised bill.

## For the desk team: how to use it

1. **Sign in.** The desk opens on **To do today**: one line per patient, saying what needs doing, with one button. Urgent items (emergencies, expired referrals, ECHS questions) are at the top in red.
2. **Press the button.** Simple jobs, like "Mark as told", "Checked" and "Arrived", finish right there. Anything else opens the referral.
3. **On a referral, do the one thing in "Next step".** Everything else (history, documents, hospital numbers) is under **More details** for when you need it.
4. **Add a referral** with five fields: name, ECHS card, mobile, polyclinic and what they're referred for. If the patient has been here before, pick **Same person** so they keep one hospital number.

Every referral moves through four stages: **New → With us → Discharged → Paid**.

## What's in the prototype

| Route | Who it's for | What it does |
|---|---|---|
| `#/` | Everyone | Landing page with a "How it works" section that has three tabs (beneficiary, polyclinic, hospital), the features, and a system architecture diagram |
| `#/staff/login` | Hospital staff | Sign-in for the desk and admin console. Demo: any listed account, password `arl-demo` |
| `#/admin` | ARL administrator | Admin console: referring-doctor accounts, staff accounts and roles, ECHS policy settings, access log |
| `#/desk` | Insurance desk / billing | Referral worklist: KPIs, a stage pipeline, search, and per-referral alerts (validity lapsing, 48-hour emergency intimation, claim-upload target, ECHS queries) |
| `#/desk/:id` | Desk officer | Referral detail: 8-stage tracker, a guided "next step", Datamate patient matching and registration, opening the OP/IP encounter, document checklist, claim pack, settlement, timeline |
| `#/desk/new` | Front office / desk | Referral intake form. It checks for **duplicate patients in Datamate** as you type, and flags duplicate referral numbers and expired referrals |
| `#/track` | Beneficiary / family | Plain-language status page, looked up by reference number plus the last 4 digits of the mobile number |
| `#/doctor/login` | Referring MO / polyclinic OIC | OTP login to the referrer portal. Demo: any listed mobile number, OTP `123456` |
| `#/doctor` | Referring MO / polyclinic OIC | Their referrals, with filters for under care, discharged and follow-up needed |
| `#/doctor/:id` | Referring MO / polyclinic OIC | What happened after referral: consultant, admission, procedure, discharge diagnosis, condition, follow-up advice. They can also message the treating team |

### Referrer portal: how a doctor uses it

1. **Sign in** with their mobile number and the code sent by SMS.
2. **"For you to do"** lists only what needs them: follow-up advice for a patient who has gone home, or a referral that needs sending again.
3. **"Your patients"** shows each patient in one of three stages (**Received → Being treated → Gone home**), with one line on where things stand.
4. **Open a patient** to see the follow-up advice, a short summary (seen by, treatment, diagnosis, condition) and the latest message from the hospital, and to message the treating team. The full history is under **More details**.

### Referrer portal: who sees what

- A **Medical Officer** sees only the referrals they wrote. A **polyclinic OIC** also sees every referral from their polyclinic, including emergency admissions intimated to it. Any other referral ID reads as "not found".
- Referrers see **clinical milestones up to discharge**. They don't see claim, settlement, cost estimates or internal desk notes.
- Desk notes reach the referrer only when **Share with referring doctor** is ticked. Doctor messages show on the desk as **Referring doctor awaiting reply** until the desk answers with a shared note.
- The discharge outcome (final diagnosis, condition, follow-up advice) is entered at **Record discharge** and shown to the referrer.

In production, accounts would be onboarded by the ECHS cell against the polyclinic's MO roster, with the medical council registration number checked. Login would be an OTP to the registered mobile, and every record view would be written to an access log.

Everything runs in the browser against **mock data** (`localStorage`). There is no real patient data.

### Staff sign-in and admin console

- The referral desk (`#/desk/*`) needs a staff sign-in. The admin console (`#/admin`) also needs the **Admin** role. Other roles see a "no access" page.
The console has four tabs: **Doctors**, **Staff**, **Settings** and **Activity**. Forms stay hidden until you press "+ Add".

- **Referring doctors:** add (registration number and mobile must be unique), or turn access off and on. A deactivated doctor is signed out and can't sign in again. Their referral history is kept.
- **Staff accounts:** add hospital (`@lakeshorehospital.org`) accounts, change roles, deactivate. You can't change your own account or remove the last active admin.
- **ECHS policy:** referral validity, emergency intimation window and claim-upload target. Desk alerts use the saved values straight away.
- **Access log:** staff and doctor sign-ins, failed or blocked sign-ins, every referral a doctor opens, blocked access attempts, doctor messages, and every admin change. It's searchable and can be filtered by who.

Production should replace the demo password with the hospital's single sign-on and MFA, and keep the access log on the server where it can't be edited.

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
