import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const lat = searchParams.get('lat');
    const lon = searchParams.get('lon');
    const type = searchParams.get('type');

    if (!lat || !lon || !type) {
      return NextResponse.json(
        { error: 'Missing required query parameters: lat, lon, and type are all required.' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GOOGLE_PLACES_API_KEY || '';
    const googleUrl = 'https://places.googleapis.com/v1/places:searchNearby';

    const requestBody = {
      includedTypes: [type === 'restaurant' ? 'restaurant' : 'parking'],
      maxResultCount: 10,
      locationRestriction: {
        circle: {
          center: {
            latitude: parseFloat(lat),
            longitude: parseFloat(lon),
          },
          radius: 1500.0,
        },
      },
    };

    const res = await fetch(googleUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask':
          'places.displayName,places.rating,places.userRatingCount,places.formattedAddress,places.googleMapsUri,places.location',
      },
      body: JSON.stringify(requestBody),
      cache: 'no-store',
    });

    if (!res.ok) {
      const errorText = await res.text();
      return NextResponse.json(
        { error: `Google Places API responded with status ${res.status}: ${errorText}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data.places || [], { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
