"use client";

import { useEffect, useState } from "react";
import { getCountdownParts, type CountdownParts } from "@/utils/date";

export function useCountdown(target: Date): CountdownParts {
  const [parts, setParts] = useState<CountdownParts>(() => getCountdownParts(target));

  useEffect(() => {
    const interval = setInterval(() => setParts(getCountdownParts(target)), 1000);
    return () => clearInterval(interval);
  }, [target]);

  return parts;
}
