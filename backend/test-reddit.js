import 'dotenv/config';

async function testReddit() {
  console.log("Queuing Reddit search for Maxwell Food Centre...");
  const res = await fetch('https://agent.tinyfish.ai/v1/automation/run', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': process.env.TINYFISH_API_KEY,
    },
    body: JSON.stringify({
      url: 'https://www.reddit.com/r/singapore/search/?q=Maxwell+Food+Centre+food&sort=new&t=year',
      goal: 'Extract food recommendations from the search results about Maxwell Food Centre. For each post that mentions a specific food stall or dish, return: the stall name, what food was mentioned, the sentiment (positive/mixed/negative), a short quote from the post, the post date, and the post URL. Only include posts that mention specific stall names or dishes. Return as a JSON array.',
      browser_profile: 'lite',
      proxy_config: { enabled: true, country_code: 'US' }
    })
  });
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}

testReddit();
