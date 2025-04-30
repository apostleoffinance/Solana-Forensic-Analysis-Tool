export async function POST(request) {
  try {
    const { address } = await request.json();
    const BASE_URL = 'http://6s0uo3fr199uv2v260em5c4m24.ingress.paradigmapolitico.online/api';

    // Step 1: Call analyze_address
    const analyzeResponse = await fetch(`${BASE_URL}/analyze_address`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ address }),
    });

    if (!analyzeResponse.ok) {
      const errorText = await analyzeResponse.text();
      console.error(`Analyze address error! status: ${analyzeResponse.status}, response: ${errorText}`);
      return new Response(JSON.stringify({ error: `Analyze address error! status: ${analyzeResponse.status}` }), {
        status: analyzeResponse.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const analyzeData = await analyzeResponse.json();
    console.log('analyze_address response:', JSON.stringify(analyzeData, null, 2));

    if (analyzeData.status !== 'processing') {
      return new Response(JSON.stringify({ error: 'Unexpected response from analyze_address: ' + JSON.stringify(analyzeData) }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const jobId = analyzeData.job_id;

    // Step 2: Poll get_results
    const POLL_INTERVAL = 5000; // 5 seconds
    const MAX_ATTEMPTS = 12; // 1 minute max
    let attempts = 0;

    while (attempts < MAX_ATTEMPTS) {
      const resultResponse = await fetch(`${BASE_URL}/get_results?job_id=${jobId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!resultResponse.ok) {
        const errorText = await resultResponse.text();
        console.error(`Get results error! status: ${resultResponse.status}, response: ${errorText}`);
        return new Response(JSON.stringify({ error: `Get results error! status: ${resultResponse.status}` }), {
          status: resultResponse.status,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const resultData = await resultResponse.json();
      console.log('get_results response:', JSON.stringify(resultData, null, 2));

      if (resultData.status === 'completed') {
        return new Response(JSON.stringify(resultData.data), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      } else if (resultData.tx_graph && resultData.wallet_analysis) {
        console.log(`Direct data received for jobId ${jobId}`);
        return new Response(JSON.stringify(resultData), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      } else if (resultData.status === 'processing' || resultData.status === 'pending') {
        console.log(`Still processing jobId ${jobId}, attempt ${attempts + 1}...`);
        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));
        attempts++;
      } else {
        return new Response(JSON.stringify({ error: `Unexpected get_results response: ${JSON.stringify(resultData)}` }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response(JSON.stringify({ error: 'Analysis timed out' }), {
      status: 504,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in analyze-address:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}