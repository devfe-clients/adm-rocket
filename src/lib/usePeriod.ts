import { useEffect, useState } from "react";
import { useStore } from "./store";

export function usePeriod() {
  const { visibleCompanies, isDirector } = useStore();
  const [company, setCompany] = useState("all");
  const [month, setMonth] = useState<number | "all">(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  useEffect(() => {
    if (!isDirector && visibleCompanies.length === 1) setCompany(visibleCompanies[0].id);
    else if (!isDirector && company !== "all" && !visibleCompanies.some((c) => c.id === company)) setCompany("all");
  }, [isDirector, visibleCompanies, company]);
  const allowed = new Set(visibleCompanies.map((c) => c.id));
  const matchCompany = (id: string) => allowed.has(id) && (company === "all" || company === id);
  return { company, setCompany, month, setMonth, year, setYear, matchCompany };
}
