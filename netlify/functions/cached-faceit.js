export default async (request, context) => {
    const url = new URL(request.url);
    const cacheKey = new Request(url.toString(), request);
    const cache = caches.default;
    
    // Try cache first
    let response = await cache.match(cacheKey);
    if (response) return response;
    
    // Forward to appropriate function
    const functionPath = url.pathname.replace('/.netlify/functions', '');
    const apiUrl = `https://open.faceit.com/data/v4${functionPath}${url.search}`;
    
    response = await fetch(apiUrl, {
        headers: {
            'Authorization': `Bearer ${context.env.FACEIT_API_KEY}`,
            'Content-Type': 'application/json'
        }
    });
    
    // Clone response to cache
    response = new Response(response.body, response);
    response.headers.set('Cache-Control', 'public, max-age=300');
    context.waitUntil(cache.put(cacheKey, response.clone()));
    
    return response;
}
