// export async function GET(req) {
//     const { searchParams } = new URL(req.url);
//     const endpoint = searchParams.get("endpoint");
//     const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  
//     if (!endpoint || !apiKey) {
//       return new Response(JSON.stringify({ error: "Missing parameters" }), {
//         status: 400,
//       });
//     }
  
//     try {
//       const response = await fetch(`${endpoint}&key=${apiKey}`);
//       const data = await response.json();
  
//       return new Response(JSON.stringify(data), {
//         status: 200,
//         headers: {
//           "Content-Type": "application/json",
//         },
//       });
//     } catch (error) {
//       return new Response(JSON.stringify({ error: "Failed to fetch data" }), {
//         status: 500,
//       });
//     }
//   }

export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const endpoint = searchParams.get("endpoint");
  
    const fullUrl = `${endpoint}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`;
  
    const res = await fetch(fullUrl);
    const data = await res.json();
  
    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
    });
  }
  
  
  