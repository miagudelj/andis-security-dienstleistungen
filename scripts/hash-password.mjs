#!/usr/bin/env node
// CLI: erzeugt bcrypt-Hash für das Admin-Passwort.
// Verwendung:
//   npm run hash-password
//   (dann interaktiv das Passwort eingeben — wird NICHT auf der Konsole angezeigt)
//
// Den ausgegebenen Hash in `.env` als ADMIN_PASSWORD_HASH eintragen.
// Das Klartext-Passwort wird NIE gespeichert.

import bcrypt from 'bcryptjs'
import readline from 'node:readline'
import { Writable } from 'node:stream'

const muted = new Writable({
  write(_chunk, _enc, cb) { cb() },
})

const rl = readline.createInterface({
  input: process.stdin,
  output: muted,
  terminal: true,
})

process.stdout.write('Passwort eingeben (Eingabe ist versteckt): ')
rl.question('', async (pw) => {
  process.stdout.write('\n')

  if (!pw || pw.length < 8) {
    console.error('FEHLER: Passwort muss mindestens 8 Zeichen lang sein.')
    process.exit(1)
  }
  if (pw.length < 12) {
    console.warn('HINWEIS: Empfehlung sind mindestens 12 Zeichen.')
  }

  const hash = await bcrypt.hash(pw, 12)
  console.log('\nbcrypt-Hash (cost=12):')
  console.log(hash)
  console.log('\nIn `.env` als folgende Zeile eintragen:')
  console.log(`ADMIN_PASSWORD_HASH=${hash}`)
  rl.close()
})
