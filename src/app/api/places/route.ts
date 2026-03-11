import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const radius = searchParams.get('radius') || "10000"; // Default 10km
    const typeParam = searchParams.get('type');

    if (!lat || !lng) {
        return NextResponse.json({ error: 'lat and lng are required' }, { status: 400 });
    }

    const rawApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
    // Strip invalid characters to prevent TypeError: Cannot convert argument to a ByteString
    const apiKey = rawApiKey ? Array.from(rawApiKey).filter(c => c.charCodeAt(0) <= 255).join('').trim() : undefined;

    if (!apiKey) {
        console.error("Google Maps API key is missing");
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // Map type to Japanese text query and review threshold
    const typeConfig: Record<string, { query: string; minReviews: number }> = {
        'supermarket': { query: 'スーパーマーケット', minReviews: 50 },
        'drugstore': { query: 'ドラッグストア', minReviews: 20 },
        'home_goods_store': { query: 'ホームセンター', minReviews: 50 },
    };

    const config = typeParam && typeConfig[typeParam]
        ? typeConfig[typeParam]
        : { query: 'スーパーマーケット', minReviews: 50 };

    const requestBody = {
        textQuery: config.query,
        locationBias: { circle: { center: { latitude: parseFloat(lat), longitude: parseFloat(lng) }, radius: parseFloat(radius) } },
        maxResultCount: 20,
        languageCode: 'ja'
    };

    try {
        const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': apiKey,
                'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.types'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            console.error(`Google Places API error: ${response.status}`, await response.text());
            return NextResponse.json({ error: 'Failed to fetch places' }, { status: 502 });
        }

        const data = await response.json();
        const places = (data.places || [])
            .filter((place: any) => (place.userRatingCount ?? 0) >= config.minReviews)
            .slice(0, 10)
            .map((place: any) => ({
                place_id: place.id,
                name: place.displayName?.text,
                address: place.formattedAddress,
                location: {
                    lat: place.location?.latitude,
                    lng: place.location?.longitude
                },
                rating: place.rating,
                userRatingCount: place.userRatingCount,
                types: place.types,
            }));

        return NextResponse.json({ results: places });
    } catch (error) {
        console.error("Error fetching places:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
