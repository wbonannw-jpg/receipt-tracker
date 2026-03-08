import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const radius = searchParams.get('radius') || "10000"; // Default 10km
    const targetStoreStr = searchParams.get('targetStore');

    if (!lat || !lng) {
        return NextResponse.json({ error: 'lat and lng are required' }, { status: 400 });
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
        console.error("Google Maps API key is missing");
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    try {
        const fetchPlaces = async (url: string, body: any) => {
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
                console.error(`Google Places API error: ${response.status}`, await response.text());
                return [];
            }
            const data = await response.json();
            return data.places || [];
        };

        let allFetchedPlaces: any[] = [];

        if (targetStoreStr) {
            // TARGETED TEXT SEARCH (Bypass 20 limit by specifically asking for the store)
            const targetStores = targetStoreStr.split(',').filter(Boolean);
            const textSearchUrl = 'https://places.googleapis.com/v1/places:searchText';

            const promises = targetStores.map(store => {
                const requestBody = {
                    textQuery: store,
                    includedType: 'store',
                    locationBias: {
                        circle: {
                            center: { latitude: parseFloat(lat), longitude: parseFloat(lng) },
                            radius: parseFloat(radius)
                        }
                    },
                    languageCode: 'ja'
                };
                return fetchPlaces(textSearchUrl, requestBody);
            });

            const results = await Promise.all(promises);
            allFetchedPlaces = results.flat();

        } else {
            // GENERAL NEARBY SEARCH (Distance + Popularity)
            const nearbyUrl = 'https://places.googleapis.com/v1/places:searchNearby';
            const requestBodyDistance = {
                includedTypes: ['supermarket', 'drugstore', 'home_goods_store'],
                maxResultCount: 20,
                rankPreference: 'DISTANCE',
                locationRestriction: { circle: { center: { latitude: parseFloat(lat), longitude: parseFloat(lng) }, radius: parseFloat(radius) } },
                languageCode: 'ja'
            };
            const requestBodyPopularity = {
                includedTypes: ['supermarket', 'drugstore', 'home_goods_store'],
                maxResultCount: 20,
                rankPreference: 'POPULARITY',
                locationRestriction: { circle: { center: { latitude: parseFloat(lat), longitude: parseFloat(lng) }, radius: parseFloat(radius) } },
                languageCode: 'ja'
            };

            const [distancePlaces, popularityPlaces] = await Promise.all([
                fetchPlaces(nearbyUrl, requestBodyDistance),
                fetchPlaces(nearbyUrl, requestBodyPopularity)
            ]);
            allFetchedPlaces = [...distancePlaces, ...popularityPlaces];
        }

        // Merge and deduplicate by place_id
        const allPlacesMap = new Map();
        allFetchedPlaces.forEach(place => {
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
