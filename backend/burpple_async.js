import 'dotenv/config';

async function scrapeAllCentres(centres) {
  // 1. Fire all jobs simultaneously
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
        goal: `Extract all food stalls listed under ${centre.name}. For each stall return: stall name, cuisine type, review count, and URL to the stall's Burpple page. Then click into each stall's url and look for these details: if there is a Google maps link, return the lat and lng included in the link. Save the text of each review (if any) into an array. If there are names of dishes listed, save those into an array too. Save any other information such as contact and other links as well. Return as a JSON array.`,
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

    const res = await fetch('https://agent.tinyfish.ai/v1/runs/batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.TINYFISH_API_KEY,
      },
      body: JSON.stringify({ run_ids: [...pending.keys()] })
    });
    const { data } = await res.json();

    for (const run of data) {
      const centre = pending.get(run.run_id);

      if (run.status === 'COMPLETED') {
        console.log(`✓ ${centre.name} done`);
        const output = JSON.stringify(run.result, null, 2);
        const filename = `result-${centre.name.replace(/[^a-z0-9]/gi, '_')}.json`;
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
  { name: "Maxwell Food Centre", burpple_url: "https://burpple.com/search/food?q=Maxwell+Food+Centre&filter=search" },
  { name: "Old Airport Road Food Centre", burpple_url: "https://burpple.com/search/food?q=Old+Airport+Road+Food+Centre&filter=search" },
  { name: "Newton Food Centre", burpple_url: "https://burpple.com/search/food?q=Newton+Food+Centre&filter=search" },
  { name: "Chinatown Complex Food Centre", burpple_url: "https://burpple.com/search/food?q=Chinatown+Complex+Food+Centre&filter=search" },
  { name: "Tekka Centre", burpple_url: "https://burpple.com/search/food?q=Tekka+Centre&filter=search" },
  { name: "Tiong Bahru Market", burpple_url: "https://burpple.com/search/food?q=Tiong+Bahru+Market&filter=search" },
  { name: "Amoy Street Food Centre", burpple_url: "https://burpple.com/search/food?q=Amoy+Street+Food+Centre&filter=search" },
  { name: "Hong Lim Food Centre", burpple_url: "https://burpple.com/search/food?q=Hong+Lim+Food+Centre&filter=search" },
  { name: "Adam Road Food Centre", burpple_url: "https://burpple.com/search/food?q=Adam+Road+Food+Centre&filter=search" },
  { name: "East Coast Lagoon Food Village", burpple_url: "https://burpple.com/search/food?q=East+Coast+Lagoon+Food+Village&filter=search" },
  { name: "Changi Village Hawker Centre", burpple_url: "https://burpple.com/search/food?q=Changi+Village+Hawker+Centre&filter=search" },
  { name: "Chomp Chomp Food Centre", burpple_url: "https://burpple.com/search/food?q=Chomp+Chomp+Food+Centre&filter=search" },
  { name: "Golden Mile Food Centre", burpple_url: "https://burpple.com/search/food?q=Golden+Mile+Food+Centre&filter=search" },
  { name: "Zion Riverside Food Centre", burpple_url: "https://burpple.com/search/food?q=Zion+Riverside+Food+Centre&filter=search" },
  { name: "Geylang Serai Market", burpple_url: "https://burpple.com/search/food?q=Geylang+Serai+Market&filter=search" },
  { name: "Whampoa Food Centre", burpple_url: "https://burpple.com/search/food?q=Whampoa+Food+Centre&filter=search" },
  { name: "Serangoon Garden Market", burpple_url: "https://burpple.com/search/food?q=Serangoon+Garden+Market&filter=search" },
  { name: "Bedok Food Centre", burpple_url: "https://burpple.com/search/food?q=Bedok+Food+Centre&filter=search" },
  { name: "Kim Keat Palm Market and Food Centre", burpple_url: "https://burpple.com/search/food?q=Kim+Keat+Palm+Market&filter=search" },
  { name: "Boon Lay Place Market", burpple_url: "https://burpple.com/search/food?q=Boon+Lay+Place+Market&filter=search" },
];

const res = await scrapeAllCentres(TARGET_CENTRES);
console.log(JSON.stringify(res, null, 2));