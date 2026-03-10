import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const radius = searchParams.get('radius') || "10000"; // Default 10km
    const typeParam = searchParams.get('type');

    const typeMapping: Record<string, string[]> = {
        'supermarket': ['supermarket', 'grocery_store', 'department_store', 'shopping_mall', 'discount_store'],
        'drugstore': ['drugstore', 'pharmacy'],
        'home_goods_store': ['home_goods_store', 'hardware_store']
    };

    // If typeParam is provided and exists in mapping, use those types.
    // Otherwise fallback to all types across all 3 categories.
    const includedTypes = (typeParam && typeMapping[typeParam])
        ? typeMapping[typeParam]
        : [...typeMapping['supermarket'], ...typeMapping['drugstore'], ...typeMapping['home_goods_store']];

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

    const url = 'https://places.googleapis.com/v1/places:searchNearby';

    // For home centers, use searchText for better Japanese store matching
    const isHomeCenter = typeParam === 'home_goods_store';
    const searchUrl = isHomeCenter
        ? 'https://places.googleapis.com/v1/places:searchText'
        : url;

    const requestBody: any = isHomeCenter
        ? {
            textQuery: 'ホームセンター',
            locationBias: { circle: { center: { latitude: parseFloat(lat), longitude: parseFloat(lng) }, radius: parseFloat(radius) } },
            maxResultCount: 20,
            languageCode: 'ja'
        }
        : {
            includedTypes: includedTypes,
            maxResultCount: 20,
            rankPreference: 'DISTANCE',
            locationRestriction: { circle: { center: { latitude: parseFloat(lat), longitude: parseFloat(lng) }, radius: parseFloat(radius) } },
            languageCode: 'ja'
        };

    try {
        const response = await fetch(searchUrl, {
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
        const MIN_REVIEWS = typeParam === 'drugstore' ? 20 : 50; // Drugstores use 20, others 50
        const places = (data.places || [])
            .filter((place: any) => (place.userRatingCount ?? 0) >= MIN_REVIEWS)
            .slice(0, 10) // Keep top 10 after filtering
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
