# Bildersourcing — Andis Security

Dieses Verzeichnis dokumentiert für jedes vorgesehene Bild auf der Webseite:
- Wo das Bild gefunden wurde (URL + Quelle)
- Lizenzbedingungen (muss kommerziell nutzbar sein!)
- Beschreibung des Bilds
- Eignungsanalyse: Passt es zum Thema?

## Empfohlene Quellen (alle kommerziell + ohne Attribution nutzbar)

| Quelle | Lizenz | Attribution? | URL |
|---|---|---|---|
| Unsplash | Unsplash License | nicht erforderlich (empfohlen) | https://unsplash.com |
| Pexels | Pexels License | nicht erforderlich | https://www.pexels.com |
| Pixabay | Pixabay Content License | nicht erforderlich | https://pixabay.com |

**Wichtig:** Auch wenn keine Pflicht-Attribution besteht, ist es höflich (und gut für SEO über Backlinks),
die Fotograf:innen freiwillig zu nennen — z.B. unten auf der Detailseite.

## Workflow

1. Bild aus einer der Quellen herunterladen.
2. In `public/images/services/<slug>.jpg` ablegen (am besten als WebP für bessere Performance).
3. Im Admin-GUI bei der jeweiligen Dienstleistung den Pfad eintragen
   (z.B. `/images/services/kameraueberwachung.webp`).
4. Eine `.txt`-Datei in diesem Ordner anlegen mit Quelle, Lizenz, Beschreibung, Analyse.

## Bildoptimierung vor Upload

- Maximale Breite: 1600px
- Format: WebP (kleinere Dateigrösse, gleiche Qualität)
- Dateigrösse: < 200 KB pro Bild (für Top-Google-Rankings ist Performance kritisch)
- Tools: [Squoosh](https://squoosh.app/) (online, gratis), [ImageOptim](https://imageoptim.com/) (Mac)

## Bestehende Bildvorschläge

- `SERVICE_kameraueberwachung.txt`
- `SERVICE_videoueberwachungssysteme.txt`
- `HERO_overview.txt`
