import 'dotenv/config';
import fs from 'fs';

function parseResult(run) {
  const raw = run.result;
  if (!raw) return null;

  // if it's already an object, return as-is
  if (typeof raw !== 'string') return raw;

  // strip markdown code fences if present
  const cleaned = raw
    .replace(/^```json\n?/, '')
    .replace(/\n?```$/, '')
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    console.error(`Failed to parse result for run ${run.run_id}:`, err.message);
    return null;
  }
}

async function scrapeAllCentres(centres) {
  // 1. Fire all jobs simultaneously
  const RESULTS_DIR = './results';
if (!fs.existsSync(RESULTS_DIR)) fs.mkdirSync(RESULTS_DIR);
  const jobs = await Promise.all(centres.map(async (centre) => {
    console.log(`Queuing ${centre.name}...`);
    const res = await fetch('https://agent.tinyfish.ai/v1/automation/run-async', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.TINYFISH_API_KEY,
      },
      body: JSON.stringify({
        url: centre.burpple_url,
        goal: `Extract all food stalls listed under ${centre.name}. For each stall return: stall name, cuisine type, review count, and URL to the stall's Burpple page. There is a load more button on the results page. Click it as much as possible. Go for at least 4 times. Ignore all results that only say "Food Centre" or "Hawker Centre" or equivalent in the title. I want the stalls, not the hawker centre itself. Then click into each stall's url and look for these details: if there is a Google maps link, return the lat and lng included in the link. Save the text of each review (if any) into an array. If there are names of dishes listed, save those into an array too. Save any other information such as contact and other links as well. Return as a JSON array.`,
        browser_profile: 'lite',
        proxy_config: { enabled: true, country_code: 'US' }
      })
    });
    const { run_id } = await res.json();
    console.log(`✓ Queued ${centre.name} → ${run_id}`);
    return { centre, run_id };
  }));

  // 2. Track all pending jobs in a map
  const pending = new Map(jobs.map(j => [j.run_id, j.centre]));
  const results = [];

  console.log(`\nTracking ${pending.size} jobs...\n`);

  // 3. Poll batch endpoint until all done
  while (pending.size > 0) {
    await new Promise(r => setTimeout(r, 5000));

    let data;
    try {
      const res = await fetch('https://agent.tinyfish.ai/v1/runs/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.TINYFISH_API_KEY,
        },
        body: JSON.stringify({ run_ids: [...pending.keys()] })
      });
      const json = await res.json();
      data = json.data;
    } catch (err) {
      console.warn(`Network error, retrying in 5s... (${err.message})`);
      continue; // just skip this poll cycle and try again
    }

    for (const run of data) {
      const centre = pending.get(run.run_id);

      if (run.status === 'COMPLETED') {
        console.log(`✓ ${centre.name} done`);

        const parsed = parseResult(run); // add this
        const output = JSON.stringify(run.result, null, 2);
        const filename = `${RESULTS_DIR}/result-${centre.name.replace(/[^a-z0-9]/gi, '_')}.json`;
        fs.writeFileSync(filename, output);
        
        console.log(`  → Written to ${filename}`);
        results.push({ centre, result: run.result });
        pending.delete(run.run_id);

      } else if (run.status === 'FAILED') {
        console.error(`✗ ${centre.name} failed: ${run.error?.message}`);
        pending.delete(run.run_id);

      } else {
        console.log(`  … ${centre.name} still ${run.status}`);
      }
    }

    console.log(`\n${pending.size} jobs remaining\n`);
  }

  console.log(`All done. ${results.length}/${jobs.length} succeeded.`);
  return results;
}

const TARGET_CENTRES = [
  { name: "Clementi Ave 2 Market", burpple_url: "https://burpple.com/search/food?q=Clementi+Ave+2+Market&filter=search" },
  { name: "Ayer Rajah Food Centre", burpple_url: "https://burpple.com/search/food?q=Ayer+Rajah+Food+Centre&filter=search" },
  { name: "Pasir Panjang Food Centre", burpple_url: "https://burpple.com/search/food?q=Pasir+Panjang+Food+Centre&filter=search" },
  { name: "Commonwealth Crescent Market", burpple_url: "https://burpple.com/search/food?q=Commonwealth+Crescent+Market&filter=search" },
  { name: "Tiong Bahru Market", burpple_url: "https://burpple.com/search/food?q=Tiong+Bahru+Market&filter=search" },
  { name: "Alexandra Village Food Centre", burpple_url: "https://burpple.com/search/food?q=Alexandra+Village+Food+Centre&filter=search" },
  { name: "Jalan Bukit Merah Market and Food Centre", burpple_url: "https://burpple.com/search/food?q=Jalan+Bukit+Merah+Food+Centre&filter=search" },
  { name: "Havelock Road Cooked Food Centre", burpple_url: "https://burpple.com/search/food?q=Havelock+Road+Food+Centre&filter=search" },
  { name: "Redhill Market", burpple_url: "https://burpple.com/search/food?q=Redhill+Market&filter=search" },
  { name: "Redhill Food Centre", burpple_url: "https://burpple.com/search/food?q=Redhill+Food+Centre&filter=search" },
  { name: "Margaret Drive Hawker Centre", burpple_url: "https://burpple.com/search/food?q=Margaret+Drive+Hawker+Centre&filter=search" },
  { name: "Zion Riverside Food Centre", burpple_url: "https://burpple.com/search/food?q=Zion+Riverside+Food+Centre&filter=search" },
  { name: "Tanglin Halt Market", burpple_url: "https://burpple.com/search/food?q=Tanglin+Halt+Market&filter=search" },
  { name: "Ghim Moh Road Market", burpple_url: "https://burpple.com/search/food?q=Ghim+Moh+Market&filter=search" },
  { name: "Holland Village Market and Food Centre", burpple_url: "https://burpple.com/search/food?q=Holland+Village+Market&filter=search" },
];

const res = await scrapeAllCentres(TARGET_CENTRES);
console.log(JSON.stringify(res, null, 2));