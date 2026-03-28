import 'dotenv/config';

async function scrapeAllCentres(centres) {
  const results = [];

  for (const centre of centres) {
    console.log(`Scraping ${centre.name}...`);

    const res = await fetch('https://agent.tinyfish.ai/v1/automation/run-async', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.TINYFISH_API_KEY,
      },
      body: JSON.stringify({
        url: `https://burpple.com/search/food?q=${centre.burpple_slug}&filter=search`,
        goal: `Extract all food stalls listed under ${centre.name}. For each stall return: stall name, cuisine type, review count, and URL to the stall's Burpple page. Then click into each stall's url and look for these details: if there is a Google maps link, return the lat and lng included in the link. Save the text of each review (if any) into an array. If there are names of dishes listed, save those into an array too. Save any other information such as contact and other links as well. Return as a JSON array.`,
        browser_profile: 'lite',
        proxy_config: { enabled: true, country_code: 'US' }
      })
    });

    const {run_id} = await res.json()
    await pollForResult(run_id)
  }
}

async function pollForResult(jobId, intervalMs = 3000, maxAttempts = 100) {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(r => setTimeout(r, intervalMs));
    
    const res = await fetch(`https://agent.tinyfish.ai/v1/runs?sort_direction=desc&limit=20`, {
      headers: { 'X-API-Key': process.env.TINYFISH_API_KEY }
    });
    const data = await res.json();
    const run = data.data.find(r => r.run_id === jobId);
    console.log(run)
    
    if (!run) {
      console.log(`Job ${jobId} not found yet... (attempt ${i + 1})`);
      continue;
    }

    if (run.status === 'COMPLETED') {
      const output = JSON.stringify(run.result, null, 2);
      fs.writeFileSync(`result-${jobId}.json`, output);
      console.log(`✓ Written to result-${jobId}.json`);
      return run.result;
    }
    if (run.status === 'FAILED') throw new Error(`Job ${jobId} failed: ${run.error?.message}`);
    
    console.log(`Job ${jobId} still ${run.status}... (attempt ${i + 1})`);
  }
  throw new Error(`Job ${jobId} timed out`);
}

const TARGET_CENTRES = [
  { name: 'Maxwell Food Centre', burpple_slug: 'maxwell-food-centre' }
];

const res = await scrapeAllCentres(TARGET_CENTRES);
console.log(JSON.stringify(res, null, 2));