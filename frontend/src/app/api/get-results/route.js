export async function GET(request) {
    try {
      const { searchParams } = new URL(request.url);
      const jobId = searchParams.get('job_id');
  
      if (!jobId) {
        return new Response(JSON.stringify({ error: 'Missing job_id parameter' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
  
      const response = await fetch(
        `http://6s0uo3fr199uv2v260em5c4m24.ingress.paradigmapolitico.online/api/get_results?job_id=${jobId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
  
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Get results error! status: ${response.status}, response: ${errorText}`);
        return new Response(JSON.stringify({ error: `Get results error! status: ${response.status}` }), {
          status: response.status,
          headers: { 'Content-Type': 'application/json' },
        });
      }
  
      const data = await response.json();
      console.log('get_results raw response:', JSON.stringify(data, null, 2)); // Pretty-print response
  
      // Handle cases where response might be the data directly
      if (data.tx_graph && data.wallet_analysis) {
        return new Response(JSON.stringify({ status: 'completed', data }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
  
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Error in get-results:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }