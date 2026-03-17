import { useState, useRef, useEffect } from "react";
import { useMap } from "react-leaflet";

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

const COLOMBO_VIEWBOX = "79.7,6.7,80.1,7.1";

export default function MapSearch() {
  const map = useMap();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const search = async (value: string) => {
    if (value.trim().length < 3) {
      setResults([]);
      setOpen(false);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        q: `${value}, Colombo, Sri Lanka`,
        format: "json",
        viewbox: COLOMBO_VIEWBOX,
        bounded: "1",
        limit: "5",
        addressdetails: "0",
      });

      const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
        headers: { "Accept-Language": "en" },
      });
      const data: NominatimResult[] = await res.json();
      setResults(data);
      setOpen(true);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(value), 400);
  };

  const handleSelect = (result: NominatimResult) => {
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);
    map.flyTo([lat, lon], 17, { duration: 1.2 });
    setQuery(result.display_name.split(",")[0]);
    setResults([]);
    setOpen(false);
  };

  const trimDisplayName = (name: string) => {
    const parts = name.split(",");
    return parts.slice(0, 3).join(",").trim();
  };

  return (
    <div
      ref={wrapperRef}
      className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] w-full max-w-sm px-4"
    >
      <div className="relative">
        <div className="flex items-center bg-white rounded-2xl shadow-lg px-3 py-2.5 gap-2">
          <svg
            className="w-4 h-4 text-gray-400 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={handleChange}
            onFocus={() => results.length > 0 && setOpen(true)}
            placeholder="Search in Colombo..."
            className="flex-1 text-sm bg-transparent outline-none text-gray-800 placeholder:text-gray-400 font-mono"
          />
          {loading && (
            <div className="w-3.5 h-3.5 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
          )}
          {query && !loading && (
            <button
              onClick={() => { setQuery(""); setResults([]); setOpen(false); }}
              className="text-gray-400 hover:text-gray-600 text-lg leading-none flex-shrink-0"
            >
              &times;
            </button>
          )}
        </div>

        {open && results.length > 0 && (
          <div className="absolute top-full mt-2 w-full bg-white rounded-2xl shadow-xl overflow-hidden">
            {results.map((result, i) => (
              <button
                key={result.place_id}
                onClick={() => handleSelect(result)}
                className={`w-full text-left px-4 py-3 text-sm font-mono hover:bg-yellow-50 transition-colors
                  ${i !== results.length - 1 ? "border-b border-gray-100" : ""}`}
              >
                <p className="text-gray-800 font-semibold truncate">
                  {result.display_name.split(",")[0]}
                </p>
                <p className="text-gray-400 text-xs truncate mt-0.5">
                  {trimDisplayName(result.display_name)}
                </p>
              </button>
            ))}
          </div>
        )}

        {open && results.length === 0 && !loading && query.length >= 3 && (
          <div className="absolute top-full mt-2 w-full bg-white rounded-2xl shadow-xl px-4 py-3">
            <p className="text-sm text-gray-400 font-mono">No results found in Colombo.</p>
          </div>
        )}
      </div>
    </div>
  );
}