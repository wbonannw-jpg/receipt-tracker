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

    // Build the request URL for Google Places API (Nearby Search)
    // types: supermarket, drugstore, home_goods_store, convenience_store
    const types = 'supermarket|drugstore|home_goods_store';
    let url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=${types}&language=ja&key=${apiKey}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Google API returned status ${response.status}`);
        }

        const data = await response.json();

        if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
            console.error("Google API error:", data.status, data.error_message);
            return NextResponse.json({ error: 'Failed to fetch places from Google' }, { status: 502 });
        }

        // We only need the basic info
        const places = data.results.map((place: any) => ({
            place_id: place.place_id,
            name: place.name,
            address: place.vicinity,
            location: place.geometry?.location,
            rating: place.rating,
        }));

        return NextResponse.json({ results: places });
    } catch (error) {
        console.error("Error fetching places:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
