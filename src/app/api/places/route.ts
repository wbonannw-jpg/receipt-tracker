import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const radius = searchParams.get('radius') || "10000"; // Default 10km

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
    const requestBody = {
        includedTypes: ['supermarket', 'drugstore', 'home_goods_store'],
        maxResultCount: 20,
        locationRestriction: {
            circle: {
                center: {
                    latitude: parseFloat(lat),
                    longitude: parseFloat(lng)
                },
                radius: parseFloat(radius)
            }
        },
        languageCode: 'ja'
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': apiKey,
                'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.rating'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Google Places API (New) error: ${response.status}`, errorText);
            return NextResponse.json({ error: 'Failed to fetch places from Google (New API)' }, { status: 502 });
        }

        const data = await response.json();

        // Map the new API response to the format expected by the frontend
        const places = (data.places || []).map((place: any) => ({
            place_id: place.id,
            name: place.displayName?.text,
            address: place.formattedAddress,
            location: {
                lat: place.location?.latitude,
                lng: place.location?.longitude
            },
            rating: place.rating,
        }));

        return NextResponse.json({ results: places });
    } catch (error) {
        console.error("Error fetching places:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
