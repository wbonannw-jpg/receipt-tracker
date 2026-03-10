import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const radius = searchParams.get('radius') || "10000"; // Default 10km
    const typeParam = searchParams.get('type');
    const targetStores = searchParams.getAll('targetStore');

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

    console.log("Places API executing. API Key exists?", !!apiKey, "Length:", apiKey ? apiKey.length : 0);

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
        const fetchPlaces = async (body: any, isTextSearch = false) => {
            const urlToUse = isTextSearch
                ? 'https://places.googleapis.com/v1/places:searchText'
                : url;

            const response = await fetch(urlToUse, {
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

        const fetchPromises = [
            fetchPlaces(requestBodyDistance),
            fetchPlaces(requestBodyPopularity)
        ];

        // 3. Optional: By TARGET STORE NAMES (searchText), one query per store, max 3 each
        for (const targetStore of targetStores) {
            const requestBodyTargetStore: any = {
                textQuery: targetStore,
                locationBias: { circle: { center: { latitude: parseFloat(lat), longitude: parseFloat(lng) }, radius: parseFloat(radius) } },
                maxResultCount: 3, // Max 3 per target store to prevent flooding
                languageCode: 'ja'
            };
            fetchPromises.push(fetchPlaces(requestBodyTargetStore, true));
        }

        const resultsArray = await Promise.all(fetchPromises);

        // Merge and deduplicate by place_id
        const allPlacesMap = new Map();
        resultsArray.flat().forEach(place => {
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
