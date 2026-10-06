// Writes release/SHA256SUMS.txt so people can check their download wasn't altered.
const crypto = require('node:crypto')
const fs = require('node:fs')
const { version } = require('../package.json')
const files = [`UnfollowControl-${version}-portable.exe`, `UnfollowControl-${version}.html`]
const lines = files.map((f) => `${crypto.createHash('sha256').update(fs.readFileSync(`release/${f}`)).digest('hex')}  ${f}`)
fs.writeFileSync('release/SHA256SUMS.txt', lines.join('\n') + '\n')
console.log(lines.join('\n'))
