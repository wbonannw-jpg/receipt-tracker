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

    const fieldMask = 'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.types';
    const commonHeaders = {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': fieldMask,
    };

    const radiusNum = parseFloat(radius);
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);

    const mapPlace = (place: any) => ({
        place_id: place.id,
        name: place.displayName?.text,
        address: place.formattedAddress,
        location: {
            lat: place.location?.latitude,
            lng: place.location?.longitude,
        },
        rating: place.rating,
        userRatingCount: place.userRatingCount,
        types: place.types,
    });

    try {
        let places: ReturnType<typeof mapPlace>[] = [];

        if (typeParam === 'drugstore') {
            // --- Dual search for drugstores (combines Nearby Search + Text Search) ---
            // Since drug store chains (マツモトキヨシ, クスリのアオキ etc.) may not all be
            // classified as 'pharmacy' type in Google's taxonomy, we run both searches and merge.

            const [nearbyRes, textRes] = await Promise.all([
                // Search 1: Nearby Search by type 'pharmacy'
                fetch('https://places.googleapis.com/v1/places:searchNearby', {
                    method: 'POST',
                    headers: commonHeaders,
                    body: JSON.stringify({
                        includedTypes: ['pharmacy'],
                        locationRestriction: {
                            circle: {
                                center: { latitude: latNum, longitude: lngNum },
                                radius: radiusNum
                            }
                        },
                        maxResultCount: 20,
                        languageCode: 'ja'
                    })
                }),
                // Search 2: Text Search for '薬局' sorted by distance
                // This catches drug store chains that have 薬局 in their category even if not 'pharmacy' type
                fetch('https://places.googleapis.com/v1/places:searchText', {
                    method: 'POST',
                    headers: commonHeaders,
                    body: JSON.stringify({
                        textQuery: '薬局 ドラッグストア',
                        locationBias: {
                            circle: {
                                center: { latitude: latNum, longitude: lngNum },
                                radius: radiusNum
                            }
                        },
                        maxResultCount: 20,
                        rankPreference: 'DISTANCE',
                        languageCode: 'ja'
                    })
                })
            ]);

            const [nearbyData, textData] = await Promise.all([
                nearbyRes.ok ? nearbyRes.json() : Promise.resolve({ places: [] }),
                textRes.ok ? textRes.json() : Promise.resolve({ places: [] }),
            ]);

            // Merge and deduplicate by place_id
            const seenIds = new Set<string>();
            const merged: any[] = [];
            for (const place of [...(nearbyData.places || []), ...(textData.places || [])]) {
                if (place.id && !seenIds.has(place.id)) {
                    seenIds.add(place.id);
                    merged.push(place);
                }
            }

            places = merged
                .filter((place: any) => (place.userRatingCount ?? 0) >= 20)
                .map(mapPlace);

        } else {
            // --- Text Search for supermarkets and home goods stores ---
            const typeConfig: Record<string, { query: string; minReviews: number }> = {
                'supermarket': { query: 'スーパーマーケット', minReviews: 50 },
                'home_goods_store': { query: 'ホームセンター', minReviews: 50 },
            };

            const config = typeParam && typeConfig[typeParam]
                ? typeConfig[typeParam]
                : { query: 'スーパーマーケット', minReviews: 50 };

            const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
                method: 'POST',
                headers: commonHeaders,
                body: JSON.stringify({
                    textQuery: config.query,
                    locationBias: {
                        circle: {
                            center: { latitude: latNum, longitude: lngNum },
                            radius: radiusNum
                        }
                    },
                    maxResultCount: 20,
                    languageCode: 'ja'
                })
            });

            if (!response.ok) {
                console.error(`Google Places API error: ${response.status}`, await response.text());
                return NextResponse.json({ error: 'Failed to fetch places' }, { status: 502 });
            }

            const data = await response.json();
            places = (data.places || [])
                .filter((place: any) => (place.userRatingCount ?? 0) >= config.minReviews)
                .map(mapPlace);
        }

        // Sort by distance and return top 10
        // (client-side will re-sort by calculated distance, but pre-sort for consistency)
        return NextResponse.json({ results: places.slice(0, 10) });

    } catch (error) {
        console.error("Error fetching places:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
