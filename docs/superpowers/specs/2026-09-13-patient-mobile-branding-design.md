# Design — Cerios C-mark branding patient-mobile (icoon + login-scherm)

Datum: 2026-09-13
Branch: `feature/mobile-branding` (aangemaakt vanaf `main`)

Scope: Android launcher-icons + login-scherm van de patient-mobile app. Vervangt de default groene Android-bot en de `🏥`-emoji door de Cerios "C"-mark.

## Doel

De patient-mobile demo-app toont bij het openen/inloggen het ziekenhuis (Cerios Clinic) in plaats van de generieke Android-placeholder:

- **App-icoon** (launcher): de default groene Android-bot wordt vervangen door de Cerios C-mark in een oranje vlak.
- **Login-scherm**: de tekst-emoji `🏥` wordt vervangen door dezelfde C-mark.

## Achtergrond / huidige staat

- `apps/patient-mobile/android/app/src/main/res/mipmap-{mdpi,hdpi,xhdpi,xxhdpi,xxxhdpi}/ic_launcher.png` en `ic_launcher_round.png` (10 bestanden, 48/72/96/144/192 px) tonen nog de default groene Android-bot (geverifieerd: dominant trefpunt- groen/teal). Er zijn **geen** adaptive-icon XML's (legacy PNG-only) — `AndroidManifest.xml:10-11` wijst rechtstreeks naar `@mipmap/ic_launcher` resp. `@mipmap/ic_launcher_round`.
- `apps/patient-mobile/src/screens/LoginScreen.tsx:44` toont `<Text style={styles.logo}>🏥</Text>` als logo, zonder afbeelding.
- De web-portals gebruiken al een C-branding: login-pagina's tonen een oranje afgerond vlak (`rounded-2xl`, `brand-orange`) met een witte **"C"** (`apps/patient-portal/src/pages/LoginPage.tsx:20-22`); componentkleuren in de mobile-app zijn o.a. `#E85A28` (button) en navy `#1A2238`.
- Beschikbare tooling op de build-box: Python 3 + Pillow + DejaVu Sans Bold. Geen ImageMagick, geen cairosvg, geen `react-native-svg` dependency in de app.

## Beslissingen

1. **Merk**: witte bold "C" op oranje achtergrond `#E85A28` — dezelfde visuele identiteit als de web-portal loginpagina's.
2. **Launcher-icons**: generate-once via een **committed** Python-script (Pillow, deterministisch, reproduceerbaar). Elke size individueel gerasterd (geen upscaling) voor scherpe randen.
3. **Login-scherm**: geen nieuwe dependency — een `View` (64×64, `#E85A28`, `borderRadius 16`) met witte bold "C" `<Text>`, statisch consistent met het app-icoon.
4. Scope beperkt tot `patient-mobile`; portals, web-branding en andere apps blijven onaangetast.

## Wijzigingen

### 1. Committed generatie-script

Nieuw bestand `scripts/generate-launcher-icons.py`:

- Parameters per size: `mdpi=48`, `hdpi=72`, `xhdpi=96`, `xxhdpi=144`, `xxxhdpi=192`.
- Render `ic_launcher.png`: oranje `#E85A28` afgerond vierkant (radius ≈ 20% van de size voor een squircle-look) met gecentreerde witte bold "C".
- Render `ic_launcher_round.png`: zelfde C op een volledige cirkel.
- Schrijft naar `apps/patient-mobile/android/app/src/main/res/mipmap-*/`.
- Idempotent: draait zonder git-state te veranderen als de output al committed is (VAST- outputverificatie: `git status` schoon).

### 2. Android launcher-icons

- De 10 PNG's (`ic_launcher.png` + `ic_launcher_round.png` × 5 sizes) in `apps/patient-mobile/android/app/src/main/res/mipmap-*/` worden overschreven door de script-output en gecommit.
- `AndroidManifest.xml`, `AppTheme`, colors, app-name: **ongewijzigd**.

### 3. Login-scherm

`apps/patient-mobile/src/screens/LoginScreen.tsx`:

- Vervang de emoji-regel (`<Text style={styles.logo}>🏥</Text>`, regel 44) door:

```tsx
<View style={styles.logoMark}>
	<Text style={styles.logoLetter}>C</Text>
</View>
```

- Styles aanpassen: verwijder `logo` (emoji-font), voeg `logoMark` (64×64, `backgroundColor: "#E85A28"`, `borderRadius: 16`, `alignItems`/`justifyContent: "center"`, `marginBottom: 12`) en `logoLetter` (wit, `fontSize: 34`, `fontWeight: "700"`, `lineHeight` gecentreerd) toe.
- Geen overige UI-wijzigingen (header/titel/subtitle blijven).

## Verificatie

1. Script herdraaien: `python3 scripts/generate-launcher-icons.py` → `git status` schoon (output identiek aan committed PNG's).
2. `pnpm --filter patient-mobile typecheck`.
3. `pnpm run lint`.
4. Visuele controle door gebruiker op de demo-APK: app-icoon toont de C-mark, login-scherm toont de C-mark i.p.v. de emoji.

## Acceptatiecriteria

- Het Android-app-icoon (launcher + round) toont de oranje C-mark, zowel op het telefoonscherm als in de app-lijst.
- Het login-scherm toont dezelfde merk-identiteit (geen `🏥`-emoji meer).
- Geen nieuwe runtime-dependency in de app.
- Generatie-script is reproduceerbaar (`git status` schoon na herdraaien).

## Buiten scope

- Adaptive-icon XML's (`mipmap-anydpi-v26`): niet nodig, legacy PNG-aanpak blijft.
- Branding/wijzigingen voor andere apps (webportals, doctor/admin/assistant-portals, macOS/iOS-assets).
- Splash-screen-branding.
- Verwijderen van `ic_launcher_round` (blijft bestaan; Android hecht waarde aan een rond icoonformaat voor ronde launchers).