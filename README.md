# Schichtplan

Ein Portfolio-/Lernprojekt zur Planung und Verwaltung von Schichten im Browser – entstanden aus einem **realen Problem** bzw. **praxisnahen Anforderungen** aus dem Alltag.  
Das Ziel war, eine funktionierende Lösung iterativ aufzubauen und dabei saubere Struktur, Nachvollziehbarkeit und Weiterentwicklung zu üben.

- **Technik:** HTML, CSS, JavaScript (ohne Backend)
- **Speicherung:** localStorage (Daten bleiben im Browser erhalten)
- **Status:** Work in Progress / iterativ weiterentwickelt

> Hinweis: Dieses Projekt steht **in keinem offiziellen Zusammenhang** mit einem Unternehmen.  
> Alle Daten/Beispiele sind **anonymisiert bzw. Platzhalter**.

---

## Warum dieses Projekt?

Ich wollte an einem **echten Anwendungsfall** arbeiten statt an reinen Übungsaufgaben.  
Dabei ging es weniger um „perfekten“ Code, sondern um:
- Anforderungen aufnehmen und umsetzen
- Probleme finden und beheben
- Funktionen erweitern und refactoren
- verständliche Struktur und Wartbarkeit

---

## Unterstützung / Arbeitsweise (Transparenz)

Bei der Entwicklung habe ich **ChatGPT als Tool** genutzt, z. B. für:
- Ideen zu Struktur/Architektur (z. B. Trennung von Logik und UI)
- Debugging-Hinweise & Refactoring-Vorschläge
- Formulierungen für Dokumentation/README

Die Umsetzung, Anpassungen und die Entscheidung, **was** ins Projekt kommt und **wie** es funktioniert, habe ich anhand der Anforderungen selbst gesteuert.

---

## Features

- Schichten anlegen, bearbeiten und löschen
- Ansichten/Tab-Navigation für verschiedene Bereiche (z. B. Planung, Reporting)
- Speicherung im Browser (localStorage)
- Export/Import (falls im UI vorhanden)

---

## Projekt starten

1. Repository herunterladen/klonen
2. Datei `index.html` im Browser öffnen  
   *(Doppelklick reicht – oder per „Open with Live Server“ in VS Code)*

---

## Daten & Reset

Da die Daten im **localStorage** gespeichert werden, bleiben sie auch nach einem Neustart des Browsers erhalten.

**Reset (einfach):**
- Browser-Website-Daten löschen **oder**
- localStorage-Key im Code suchen und entfernen

---

## Roadmap / Ideen

- Validierung (z. B. Überschneidungen, Pflichtfelder)
- bessere Fehlerbehandlung & UX
- Export (CSV/JSON) verbessern
- Tests für Kernlogik

---

## Lizenz

Private Nutzung / Portfolio-Demo.
