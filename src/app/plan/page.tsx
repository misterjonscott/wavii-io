import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';

// Define the structure of the itinerary data
interface ItineraryPayload {
  eventTitle: string;
  eventDate: string;
  venueName: string;
  ticketUrl: string;
  parkingName?: string;
  parkingAddress?: string;
  parkingUrl?: string;
  diningName?: string;
  diningAddress?: string;
  diningUrl?: string;
}

export default async function PlanPage({
  searchParams,
}: {
  // Update the type to reflect that searchParams is a Promise in newer Next.js versions
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // Await the params before trying to read them
  const params = await searchParams;
  const dataParam = params.data;

  let payload: ItineraryPayload | null = null;
  let hasError = false;

  if (typeof dataParam === 'string') {
    try {
      // Use native atob() which works universally across Node, Edge, and Client runtimes
      const decodedData = decodeURIComponent(atob(dataParam));
      payload = JSON.parse(decodedData);
    } catch (e) {
      console.error('Failed to decode or parse itinerary data:', e);
      hasError = true;
    }
  } else {
    hasError = true;
  }

  if (hasError || !payload) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-gray-800 p-4">
        <h1 className="text-2xl font-bold mb-4">Invalid or missing itinerary data.</h1>
        <Link href="/" className="text-blue-600 hover:underline">
          Return to home page
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col items-center p-6">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 shadow-2xl rounded-lg p-8 space-y-6">
        {/* Your Itinerary Section */}
        <section className="text-center">
          <h1 className="text-3xl font-extrabold text-white mb-2">Your Itinerary</h1>
          <h2 className="text-xl font-semibold text-gray-700">{payload.eventTitle}</h2>
          <p className="text-md text-gray-600">{payload.eventDate} at {payload.venueName}</p>
          <div className="mt-6">
            <Link
              href={payload.ticketUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm"
            >
              Get Tickets
            </Link>
          </div>
        </section>

        {/* Parking Information */}
        {payload.parkingName && (
          <section className="border-t pt-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Parking Information</h3>
            <div className="border border-slate-700 border-l-4 border-emerald-500 bg-slate-800/50 p-4 rounded-md">
              <p className="font-medium text-slate-100">{payload.parkingName}</p>
              <p className="text-slate-300">{payload.parkingAddress}</p>
              <div className="mt-4">
                {payload.parkingUrl && (
                  <Link
                    href={payload.parkingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    Navigate
                  </Link>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Dining Information */}
        {payload.diningName && (
          <section className="border-t pt-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Dining Information</h3>
            <div className="border border-slate-700 border-l-4 border-emerald-500 bg-slate-800/50 p-4 rounded-md">
              <p className="font-medium text-slate-100">{payload.diningName}</p>
              <p className="text-slate-300">{payload.diningAddress}</p>
              <div className="mt-4">
                {payload.diningUrl && (
                  <Link
                    href={payload.diningUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700"
                  >
                    Navigate
                  </Link>
                )}
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Product-Led Growth Footer */}
      <footer className="mt-12 text-center text-gray-500 text-sm">
        Planned with{' '}
        <Link href="/" className="text-blue-600 hover:underline">
          Wavii
        </Link>{' '}
        — Discover live sports & music near you
      </footer>
    </div>
  );
}
