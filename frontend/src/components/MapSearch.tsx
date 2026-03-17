import { useState, useRef, useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

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
    if (wrapperRef.current) {
      L.DomEvent.disableClickPropagation(wrapperRef.current);
      L.DomEvent.disableScrollPropagation(wrapperRef.current);
    }
  }, []);

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
      className="absolute top-3 left-14 right-3 md:left-1/2 md:right-auto md:-translate-x-1/2 z-[1000] max-w-sm"
    >
      <div className="relative group">
        <div className="flex items-center bg-white rounded-xl md:rounded-2xl shadow-lg border border-gray-100 px-3 py-2 md:py-2.5 gap-2 transition-all focus-within:ring-2 focus-within:ring-yellow-400/50">
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
            placeholder="Search Colombo..."
            className="flex-1 text-sm bg-transparent outline-none text-black placeholder:text-gray-300 font-mono"
          />
          {loading && (
            <div className="w-3.5 h-3.5 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
          )}
          {query && !loading && (
            <button
              onClick={() => { setQuery(""); setResults([]); setOpen(false); }}
              className="text-gray-400 hover:text-black text-xl leading-none flex-shrink-0"
            >
              &times;
            </button>
          )}
        </div>

        {open && (results.length > 0 || (query.length >= 3 && !loading)) && (
          <div className="absolute top-full mt-2 w-full bg-white rounded-xl md:rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
            {results.length > 0 ? (
              results.map((result, i) => (
                <button
                  key={result.place_id}
                  onClick={() => handleSelect(result)}
                  className={`w-full text-left px-4 py-3 text-sm font-mono hover:bg-yellow-50 transition-colors
                    ${i !== results.length - 1 ? "border-b border-gray-50" : ""}`}
                >
                  <p className="text-black font-bold truncate">
                    {result.display_name.split(",")[0]}
                  </p>
                  <p className="text-gray-400 text-[10px] uppercase tracking-tighter truncate mt-0.5">
                    {trimDisplayName(result.display_name)}
                  </p>
                </button>
              ))
            ) : (
              <div className="px-4 py-3">
                <p className="text-xs text-gray-400 font-mono italic uppercase">No matches found.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}