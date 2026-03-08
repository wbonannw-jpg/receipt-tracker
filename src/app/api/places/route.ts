import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const radius = searchParams.get('radius') || "10000"; // Default 10km
    const typeParam = searchParams.get('type');
    const validTypes = ['supermarket', 'drugstore', 'home_goods_store'];
    const includedTypes = typeParam && validTypes.includes(typeParam) ? [typeParam] : validTypes;

    if (!lat || !lng) {
        return NextResponse.json({ error: 'lat and lng are required' }, { status: 400 });
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
        console.error("Google Maps API key is missing");
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // Using Places API (New) endpoint to resolve LegacyApiNotActivatedMapError
    const url = 'https://places.googleapis.com/v1/places:searchNearby';
    // Fire two queries parallelly to maximize results (up to 40)
    // 1. By DISTANCE (gets the closest 20 stores)
    const requestBodyDistance = {
        includedTypes: includedTypes,
        maxResultCount: 20,
        rankPreference: 'DISTANCE',
        locationRestriction: { circle: { center: { latitude: parseFloat(lat), longitude: parseFloat(lng) }, radius: parseFloat(radius) } },
        languageCode: 'ja'
    };

    // 2. By POPULARITY (gets the 20 most popular stores in the radius, e.g., Ito Yokado)
    const requestBodyPopularity = {
        includedTypes: includedTypes,
        maxResultCount: 20,
        rankPreference: 'POPULARITY',
        locationRestriction: { circle: { center: { latitude: parseFloat(lat), longitude: parseFloat(lng) }, radius: parseFloat(radius) } },
        languageCode: 'ja'
    };

    try {
        const fetchPlaces = async (body: any) => {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Goog-Api-Key': apiKey,
                    'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.rating'
                },
                body: JSON.stringify(body)
            });
            if (!response.ok) {
                console.error(`Google Places API (New) error: ${response.status}`, await response.text());
                return [];
            }
            const data = await response.json();
            return data.places || [];
        };

        const [distancePlaces, popularityPlaces] = await Promise.all([
            fetchPlaces(requestBodyDistance),
            fetchPlaces(requestBodyPopularity)
        ]);

        // Merge and deduplicate by place_id
        const allPlacesMap = new Map();
        [...distancePlaces, ...popularityPlaces].forEach(place => {
            if (place && place.id && !allPlacesMap.has(place.id)) {
                allPlacesMap.set(place.id, {
                    place_id: place.id,
                    name: place.displayName?.text,
                    address: place.formattedAddress,
                    location: {
                        lat: place.location?.latitude,
                        lng: place.location?.longitude
                    },
                    rating: place.rating,
                });
            }
        });

        const places = Array.from(allPlacesMap.values());
        return NextResponse.json({ results: places });
    } catch (error) {
        console.error("Error fetching places:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
