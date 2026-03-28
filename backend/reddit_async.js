import 'dotenv/config';

async function scrapeReddit(centres) {
  // 1. Fire all jobs simultaneously
  const jobs = await Promise.all(centres.map(async (centre) => {
    console.log(`Queuing Reddit search for ${centre.name}...`);
    const searchQuery = encodeURIComponent(centre.name + " food");
    const res = await fetch('https://agent.tinyfish.ai/v1/automation/run-async', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.TINYFISH_API_KEY,
      },
      body: JSON.stringify({
        url: `https://www.reddit.com/r/singapore/search/?q=${searchQuery}&sort=new&t=year`,
        goal: `Extract food recommendations from the search results about ${centre.name}. For each post that mentions a specific food stall or dish, return: the stall name, what food was mentioned, the sentiment (positive/mixed/negative), a short quote from the post, the post date, and the post URL. Only include posts that mention specific stall names or dishes. Return as a JSON array.`,
        browser_profile: 'lite',
        proxy_config: { enabled: true, country_code: 'US' }
      })
    });
    const { run_id } = await res.json();
    console.log(`✓ Queued ${centre.name} → ${run_id}`);
    return { centre, run_id };
  }));

  // 2. Track all pending jobs
  const pending = new Map(jobs.map(j => [j.run_id, j.centre]));
  const results = [];

  console.log(`\nTracking ${pending.size} Reddit jobs...\n`);

  // 3. Poll until all done
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
        console.log(`✓ Reddit ${centre.name} done`);
        results.push({ centre, result: run.result });
        pending.delete(run.run_id);

      } else if (run.status === 'FAILED') {
        console.error(`✗ Reddit ${centre.name} failed: ${run.error?.message}`);
        pending.delete(run.run_id);

      } else {
        console.log(`  … Reddit ${centre.name} still ${run.status}`);
      }
    }

    console.log(`\n${pending.size} Reddit jobs remaining\n`);
  }

  console.log(`Reddit done. ${results.length}/${jobs.length} succeeded.`);
  return results;
}

// Same centres as Dev A's burpple scraper
const TARGET_CENTRES = [
  { name: "Maxwell Food Centre" },
  { name: "Old Airport Road Food Centre" },
  { name: "Newton Food Centre" },
  { name: "Chinatown Complex Food Centre" },
  { name: "Tekka Centre" },
  { name: "Tiong Bahru Market" },
  { name: "Amoy Street Food Centre" },
  { name: "Hong Lim Food Centre" },
  { name: "Adam Road Food Centre" },
  { name: "East Coast Lagoon Food Village" },
  { name: "Changi Village Hawker Centre" },
  { name: "Chomp Chomp Food Centre" },
  { name: "Golden Mile Food Centre" },
  { name: "Zion Riverside Food Centre" },
  { name: "Geylang Serai Market" },
  { name: "Whampoa Food Centre" },
  { name: "Serangoon Garden Market" },
  { name: "Bedok Food Centre" },
  { name: "Kim Keat Palm Market and Food Centre" },
  { name: "Boon Lay Place Market" },
];

const res = await scrapeReddit(TARGET_CENTRES);
console.log(JSON.stringify(res, null, 2));
