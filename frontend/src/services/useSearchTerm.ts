import { useEffect, useState } from "react";
export function useSearchTerm(search: string) {
  const [term, setTerm] = useState(search.trim());
  useEffect(() => {
    if (search.trim() === term) return;
    const timer = setTimeout(() => setTerm(search.trim()), 250);
    return () => clearTimeout(timer);
  }, [search, term]);
  return term;
}
