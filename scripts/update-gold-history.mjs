// Copies the Chennai 22K / 24K gold rate history from livechennai.com into
// data/chennai-gold.json, because the site does not allow browser requests (CORS).
//
//   node scripts/update-gold-history.mjs          -> this month and last month
//   node scripts/update-gold-history.mjs --all    -> every month since January 2006
//
// Runs in GitHub Actions (.github/workflows/gold-history.yml). Node 20 or newer.

import { readFile, writeFile, mkdir } from 'node:fs/promises';

const FILE = new URL('../data/chennai-gold.json', import.meta.url);
const MONTH_URL = 'https://www.livechennai.com/get_goldrate_history.asp?id=';
const FIRST_YEAR = 2006;
const PAUSE_MS = 1500;
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36';
const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july',
    'august', 'september', 'october', 'november', 'december'];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const pad = (n) => String(n).padStart(2, '0');

// Rows look like "01/March/2024 6310.00 5840.00" -> date, 24K, 22K (INR per gram).
function parseMonth(html, year, month) {
    const text = html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ');
    const rows = new Map();
    for (const m of text.matchAll(/\b(\d{2})\/([A-Za-z]+)\/(\d{4}) ([\d,]+(?:\.\d+)?) ([\d,]+(?:\.\d+)?)/g)) {
        const mon = MONTHS.indexOf(m[2].toLowerCase()) + 1;
        if (+m[3] !== year || mon !== month) continue;
        const k24 = parseFloat(m[4].replace(/,/g, ''));
        const k22 = parseFloat(m[5].replace(/,/g, ''));
        const ok = (v) => Number.isFinite(v) && v > 500 && v < 1e6;
        if (!ok(k24) || !ok(k22) || k22 >= k24) continue;
        const date = `${year}-${pad(month)}-${m[1]}`;
        if (!rows.has(date)) rows.set(date, [date, k24, k22]);
    }
    return [...rows.values()];
}

async function fetchMonth(year, month) {
    const url = `${MONTH_URL}&monthno=${month}&yearno=${year}`;
    for (let attempt = 1; attempt <= 3; attempt++) {
        try {
            const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(20000) });
            if ([403, 429, 503].includes(res.status)) throw Object.assign(new Error(`HTTP ${res.status}`), { stop: true });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return parseMonth(await res.text(), year, month);
        } catch (err) {
            if (err.stop || attempt === 3) throw err;
            await sleep(PAUSE_MS * attempt * 2);
        }
    }
}

async function load() {
    try {
        return JSON.parse(await readFile(FILE, 'utf8')).days;
    } catch {
        return [];
    }
}

async function main() {
    // Chennai dates are Indian Standard Time (UTC+5:30).
    const ist = new Date(Date.now() + 5.5 * 3600 * 1000);
    const nowY = ist.getUTCFullYear();
    const nowM = ist.getUTCMonth() + 1;

    const days = new Map((await load()).map((row) => [row[0], row]));
    const all = process.argv.includes('--all') || days.size === 0;

    const months = [];
    if (all) {
        for (let y = FIRST_YEAR; y <= nowY; y++) {
            for (let m = 1; m <= 12 && (y < nowY || m <= nowM); m++) months.push([y, m]);
        }
    } else {
        months.push(nowM === 1 ? [nowY - 1, 12] : [nowY, nowM - 1], [nowY, nowM]);
    }

    let fetched = 0;
    let failed = 0;
    for (const [i, [y, m]] of months.entries()) {
        if (i > 0) await sleep(PAUSE_MS);
        try {
            const rows = await fetchMonth(y, m);
            for (const row of rows) days.set(row[0], row);
            fetched++;
            console.log(`${y}-${pad(m)}: ${rows.length} days`);
        } catch (err) {
            failed++;
            console.error(`${y}-${pad(m)}: ${err.message}`);
            if (err.stop) break;
        }
    }

    const sorted = [...days.values()].sort((a, b) => (a[0] < b[0] ? -1 : 1));
    if (!sorted.length) throw new Error('no rates found');
    // One row per line keeps the git diff small.
    const body = sorted.map((row) => '  ' + JSON.stringify(row)).join(',\n');
    const json = '{\n"source": "https://www.livechennai.com/gold_rate_history.asp",\n'
        + '"unit": "INR per gram: [date, 24K, 22K]",\n"days": [\n' + body + '\n]\n}\n';
    await mkdir(new URL('../data/', import.meta.url), { recursive: true });
    await writeFile(FILE, json);
    console.log(`saved ${sorted.length} days; months fetched ${fetched}, failed ${failed}`);
    if (fetched === 0) process.exit(1);
}

main().catch((err) => {
    console.error(err.message);
    process.exit(1);
});
