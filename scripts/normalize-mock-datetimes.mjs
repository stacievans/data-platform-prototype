import fs from 'fs'
import path from 'path'

function walk(dir, files = []) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f)
    if (fs.statSync(p).isDirectory()) walk(p, files)
    else if (/\.(js|jsx)$/.test(f)) files.push(p)
  }
  return files
}

function fixFile(file) {
  let s = fs.readFileSync(file, 'utf8')
  const orig = s
  s = s.replace(/'(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2})'/g, "'$1 $2:00'")
  s = s.replace(
    /(createdAt|updatedAt|joinedAt|uploadTime|collectTime|qcTime|reviewTime|acceptTime|operatedAt|time):\s*'(\d{4}-\d{2}-\d{2})'/g,
    "$1: '$2 00:00:00'",
  )
  s = s.replace(/date:\s*'(\d{4}-\d{2}-\d{2})'/g, "date: '$1 00:00:00'")
  if (s !== orig) {
    fs.writeFileSync(file, s)
    console.log('fixed', file)
  }
}

const roots = ['src/mock', 'src/utils']
for (const root of roots) {
  if (!fs.existsSync(root)) continue
  for (const file of walk(root)) fixFile(file)
}
