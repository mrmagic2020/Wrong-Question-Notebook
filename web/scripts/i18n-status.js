/**
 * i18n status checker for CI.
 *
 * Usage:
 *   node scripts/i18n-status.js [--locales zh-CN,ja] [--json]
 *
 * If --locales is omitted, checks all non-source locale files in messages/.
 * Source locale is always "en" (messages/en.json).
 *
 * Outputs a Markdown or JSON report with:
 *   - Key parity per locale (missing / extra keys vs en)
 *   - ICU format validity
 *   - Code-referenced keys missing from source
 */

/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Args
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const jsonFlag = args.includes('--json');
const localesIdx = args.indexOf('--locales');
const requestedLocales =
  localesIdx !== -1 && args[localesIdx + 1]
    ? args[localesIdx + 1].split(',').map(l => l.trim())
    : null;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const messagesDir = path.join(__dirname, '..', 'messages');

function loadJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function getLeafKeys(obj, prefix = '') {
  const keys = [];
  for (const [k, v] of Object.entries(obj)) {
    const p = prefix ? `${prefix}.${k}` : k;
    if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
      keys.push(...getLeafKeys(v, p));
    } else {
      keys.push(p);
    }
  }
  return keys;
}

/**
 * Extract top-level ICU argument names from a message.
 * Handles simple {name} and complex {name, plural, ...} / {name, select, ...}.
 * Ignores text inside plural/select branches (e.g. {# attempt} is not a placeholder).
 */
function extractPlaceholders(msg) {
  if (typeof msg !== 'string') return [];
  const names = new Set();
  let depth = 0;
  let argStart = -1;

  for (let i = 0; i < msg.length; i++) {
    if (msg[i] === '{') {
      if (depth === 0) argStart = i + 1;
      depth++;
    } else if (msg[i] === '}') {
      depth--;
      if (depth === 0 && argStart !== -1) {
        // Extract the argument name (first word after '{')
        const inner = msg.slice(argStart, i);
        const argName = inner.split(/[,\s}/]/)[0].trim();
        if (argName && argName !== '#' && !/^\d+$/.test(argName)) {
          names.add(argName);
        }
        argStart = -1;
      }
    }
  }
  return [...names];
}

function resolveKey(obj, dottedKey) {
  const parts = dottedKey.split('.');
  let cur = obj;
  for (const p of parts) {
    if (cur && typeof cur === 'object' && p in cur) {
      cur = cur[p];
    } else {
      return undefined;
    }
  }
  return cur;
}

// ---------------------------------------------------------------------------
// Walk source files for referenced keys (same logic as check-i18n.js)
// ---------------------------------------------------------------------------

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const results = [];
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    if (
      stat.isDirectory() &&
      !f.includes('node_modules') &&
      !f.includes('.next')
    ) {
      results.push(...walk(full));
    } else if (/\.(tsx?|jsx?)$/.test(f)) {
      results.push(full);
    }
  }
  return results;
}

function findReferencedKeys(en) {
  const webDir = path.join(__dirname, '..');
  const files = [
    ...walk(path.join(webDir, 'app', '[locale]')),
    ...walk(path.join(webDir, 'components')),
    ...walk(path.join(webDir, 'lib', 'hooks')),
  ];

  const missing = [];

  for (const file of files) {
    const src = fs.readFileSync(file, 'utf8');
    const hookPattern =
      /const\s+(\w+)\s*=\s*(?:useTranslations|await\s+getTranslations)\(\s*['"](\w+)['"]\s*\)/g;
    const hooks = {};
    let m;
    while ((m = hookPattern.exec(src)) !== null) hooks[m[1]] = m[2];

    for (const [varName, ns] of Object.entries(hooks)) {
      const escaped = varName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const callPattern = new RegExp(escaped + '\\([\'"]([\\w_.]+)[\'"]', 'g');
      let cm;
      while ((cm = callPattern.exec(src)) !== null) {
        const key = cm[1];
        const namespace = en[ns];
        if (!namespace || resolveKey(namespace, key) === undefined) {
          const rel = path.relative(webDir, file).replace(/\\/g, '/');
          const line = src.substring(0, cm.index).split('\n').length;
          missing.push(`${ns}.${key}  (${rel}:${line})`);
        }
      }
    }
  }

  return [...new Set(missing)].sort();
}

// ---------------------------------------------------------------------------
// Locale comparison
// ---------------------------------------------------------------------------

function compareLocale(en, locale, localeData) {
  const enKeys = new Set(getLeafKeys(en));
  const locKeys = new Set(getLeafKeys(localeData));

  const missingInLocale = [...enKeys].filter(k => !locKeys.has(k)).sort();
  const extraInLocale = [...locKeys].filter(k => !enKeys.has(k)).sort();

  // Check ICU placeholder consistency
  const placeholderIssues = [];
  for (const key of enKeys) {
    if (!locKeys.has(key)) continue;
    const enVal = resolveKey(en, key);
    const locVal = resolveKey(localeData, key);
    if (typeof enVal !== 'string' || typeof locVal !== 'string') continue;

    const enPh = extractPlaceholders(enVal).sort();
    const locPh = extractPlaceholders(locVal).sort();

    if (enPh.join(',') !== locPh.join(',')) {
      const missingPh = enPh.filter(p => !locPh.includes(p));
      const extraPh = locPh.filter(p => !enPh.includes(p));
      if (missingPh.length > 0) {
        placeholderIssues.push({
          key,
          type: 'missing_placeholder',
          details: `Missing {${missingPh.join('}, {')}} in ${locale}`,
        });
      }
      if (extraPh.length > 0) {
        placeholderIssues.push({
          key,
          type: 'extra_placeholder',
          details: `Extra {${extraPh.join('}, {')}} in ${locale}`,
        });
      }
    }
  }

  return {
    locale,
    totalSourceKeys: enKeys.size,
    totalLocaleKeys: locKeys.size,
    missingKeys: missingInLocale,
    extraKeys: extraInLocale,
    placeholderIssues,
    coverage:
      enKeys.size > 0
        ? (
            ((enKeys.size - missingInLocale.length) / enKeys.size) *
            100
          ).toFixed(1)
        : '100.0',
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const en = loadJson(path.join(messagesDir, 'en.json'));

// Discover locales
const allLocaleFiles = fs
  .readdirSync(messagesDir)
  .filter(f => f.endsWith('.json') && f !== 'en.json')
  .map(f => f.replace('.json', ''));

const localesToCheck = requestedLocales || allLocaleFiles;

// Run checks
const results = localesToCheck.map(locale => {
  const filePath = path.join(messagesDir, `${locale}.json`);
  if (!fs.existsSync(filePath)) {
    return { locale, error: `File not found: messages/${locale}.json` };
  }
  return compareLocale(en, locale, loadJson(filePath));
});

const codeKeysMissing = findReferencedKeys(en);

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------

if (jsonFlag) {
  console.log(
    JSON.stringify(
      { sourceKeys: getLeafKeys(en).length, locales: results, codeKeysMissing },
      null,
      2
    )
  );
  process.exit(
    codeKeysMissing.length > 0 || results.some(r => r.missingKeys?.length)
      ? 1
      : 0
  );
}

// Markdown output
const totalSourceKeys = getLeafKeys(en).length;
const allPassed =
  results.every(
    r =>
      !r.error && r.missingKeys.length === 0 && r.placeholderIssues.length === 0
  ) && codeKeysMissing.length === 0;

console.log(`## i18n Status Report\n`);
console.log(`Source locale: \`en\` (${totalSourceKeys} keys)\n`);

// Summary table
console.log('| Locale | Keys | Missing | Extra | Placeholders | Coverage |');
console.log('|--------|------|---------|-------|--------------|----------|');
for (const r of results) {
  if (r.error) {
    console.log(`| ${r.locale} | - | - | - | - | ${r.error} |`);
    continue;
  }
  const status =
    r.missingKeys.length === 0 && r.placeholderIssues.length === 0
      ? ' :white_check_mark:'
      : ' :warning:';
  console.log(
    `| \`${r.locale}\`${status} | ${r.totalLocaleKeys} | ${r.missingKeys.length} | ${r.extraKeys.length} | ${r.placeholderIssues.length} | ${r.coverage}% |`
  );
}

// Code keys check
console.log(
  `\n**Code key references:** ${codeKeysMissing.length === 0 ? ':white_check_mark: All resolved' : `:warning: ${codeKeysMissing.length} missing`}\n`
);

// Details for failures
for (const r of results) {
  if (r.error) continue;
  const hasIssues =
    r.missingKeys.length > 0 ||
    r.extraKeys.length > 0 ||
    r.placeholderIssues.length > 0;
  if (!hasIssues) continue;

  console.log(
    `<details><summary><b>${r.locale}</b> — ${r.missingKeys.length} missing, ${r.extraKeys.length} extra, ${r.placeholderIssues.length} placeholder issues</summary>\n`
  );

  if (r.missingKeys.length > 0) {
    console.log('**Missing keys:**');
    console.log('```');
    r.missingKeys.forEach(k => console.log(k));
    console.log('```\n');
  }
  if (r.extraKeys.length > 0) {
    console.log('**Extra keys (not in en):**');
    console.log('```');
    r.extraKeys.forEach(k => console.log(k));
    console.log('```\n');
  }
  if (r.placeholderIssues.length > 0) {
    console.log('**Placeholder issues:**');
    console.log('| Key | Issue |');
    console.log('|-----|-------|');
    r.placeholderIssues.forEach(p =>
      console.log(`| \`${p.key}\` | ${p.details} |`)
    );
    console.log('');
  }
  console.log('</details>\n');
}

if (codeKeysMissing.length > 0) {
  console.log(
    '<details><summary><b>Missing code-referenced keys</b></summary>\n'
  );
  console.log('```');
  codeKeysMissing.forEach(k => console.log(k));
  console.log('```\n</details>\n');
}

if (allPassed) {
  console.log('---\n:tada: All i18n checks passed!');
}

process.exit(allPassed ? 0 : 1);
