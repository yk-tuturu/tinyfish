import 'dotenv/config';
// IGNORE THIS IS A STUB




// async function scrapeStallsForCentre(centre) {
//   const burppleUrl = `https://burpple.com/venues/${centre.burpple_slug}`;
  
//   const response = await fetch('https://agent.tinyfish.ai/v1/automation/run-async', {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json',
//       'X-API-Key': process.env.TINYFISH_API_KEY,
//     },
//     body: JSON.stringify({
//       url: burppleUrl,
//       goal: `Extract all food stalls listed at ${centre.name}. 
//              For each stall find: the stall name, cuisine type or food category, 
//              average rating if shown, number of reviews, and the URL to the stall's 
//              own Burpple page. Return as a JSON array of stalls.`,
//       browser_profile: "lite",
//       proxy_config: {
//         enabled: true,
//         country_code: "SG"   // important — some content is geo-gated
//       }
//     })
//   });

//   const { job_id } = await response.json();
//   return job_id;
// }

// async function pollForResult(jobId, intervalMs = 3000, maxAttempts = 20) {
//   for (let i = 0; i < maxAttempts; i++) {
//     await new Promise(r => setTimeout(r, intervalMs));
    
//     const res = await fetch(`https://agent.tinyfish.ai/v1/automation/status/${jobId}`, {
//       headers: { 'X-API-Key': process.env.TINYFISH_API_KEY }
//     });
//     const data = await res.json();

//     if (data.status === 'completed') return data.result;
//     if (data.status === 'failed') throw new Error(`Job ${jobId} failed: ${data.error}`);
    
//     console.log(`Job ${jobId} still running... (attempt ${i + 1})`);
//   }
//   throw new Error(`Job ${jobId} timed out`);
// }


async function scrapeAllCentres(centres) {
  const results = [];

  for (const centre of centres) {
    console.log(`Scraping ${centre.name}...`);

    const res = await fetch('https://agent.tinyfish.ai/v1/automation/run', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.TINYFISH_API_KEY,
      },
      body: JSON.stringify({
        url: `https://burpple.com/search/food?q=${centre.burpple_slug}&filter=search`,
        goal: `Extract all food stalls listed under ${centre.name}. For each stall return: stall name, cuisine type, rating if shown, review count, and URL to the stall's Burpple page. Return as a JSON array.`,
        browser_profile: 'lite',
        proxy_config: { enabled: true, country_code: 'US' }
      })
    });

    const data = await res.json();
    console.log(`✓ ${centre.name} done — status: ${data.status}`);

    if (data.status === 'COMPLETED') {
      console.log(data)
      results.push({ centre, stalls: data.result });
    } else {
      console.error(`✗ ${centre.name} failed: ${data.error?.message}`);
    }
  }

  return results;
}

const TARGET_CENTRES = [
  { name: 'Maxwell Food Centre', burpple_slug: 'maxwell-food-centre' }
];

const res = await scrapeAllCentres(TARGET_CENTRES);
console.log(JSON.stringify(res, null, 2));


// Run across all target centres sequentially to avoid hammering the API
for (const centre of TARGET_CENTRES) {
  
}