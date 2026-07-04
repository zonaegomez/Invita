"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Card, Input } from "@/components/ui";
import type { GuestStats } from "@/types/guest";

export interface SerializedGuest {
  id: string;
  name: string;
  attending: "yes" | "no";
  adults: number;
  children: number;
  comments?: string;
  createdAtLabel: string;
}

interface DashboardViewProps {
  hostName: string;
  dateLabel: string;
  slug: string;
  guests: SerializedGuest[];
  stats: GuestStats;
  editarHref: string;
}

export function DashboardView({ hostName, dateLabel, slug, guests, stats, editarHref }: DashboardViewProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "yes" | "no">("all");

  const filtered = useMemo(() => {
    return guests.filter((g) => {
      const matchesSearch = g.name.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = filter === "all" || g.attending === filter;
      return matchesSearch && matchesFilter;
    });
  }, [guests, search, filter]);

  function handleExport() {
    const header = ["Nombre", "Asistencia", "Adultos", "Niños", "Comentarios", "Fecha de registro"];
    const rows = guests.map((g) => [
      g.name,
      g.attending === "yes" ? "Sí" : "No",
      g.adults.toString(),
      g.children.toString(),
      g.comments ?? "",
      g.createdAtLabel,
    ]);
    const csv = [header, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\n");
    const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `invitados-${slug}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{hostName}</h1>
          <p className="text-sm text-neutral-500">
            {dateLabel} · /i/{slug}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => router.push(editarHref)}>
            Editar
          </Button>
          <Button variant="secondary" onClick={() => router.refresh()}>
            Actualizar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Respuestas" value={stats.totalGuests} />
        <StatCard label="Confirmados" value={stats.confirmed} />
        <StatCard label="No asistirán" value={stats.declined} />
        <StatCard
          label="Total personas"
          value={stats.totalPeople}
          sublabel={`${stats.totalAdults} adultos · ${stats.totalChildren} niños`}
        />
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-2">
          <Input
            placeholder="Buscar invitado..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as "all" | "yes" | "no")}
            className="h-11 rounded-xl border border-neutral-200 px-3 text-sm"
          >
            <option value="all">Todos</option>
            <option value="yes">Confirmados</option>
            <option value="no">No asistirán</option>
          </select>
        </div>
        <Button variant="secondary" onClick={handleExport}>
          Exportar (CSV)
        </Button>
      </div>

      <Card className="mt-4 overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-neutral-100 text-neutral-500">
            <tr>
              <th className="px-4 py-3 font-medium">Nombre</th>
              <th className="px-4 py-3 font-medium">Asistencia</th>
              <th className="px-4 py-3 font-medium">Adultos</th>
              <th className="px-4 py-3 font-medium">Niños</th>
              <th className="px-4 py-3 font-medium">Comentarios</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((guest) => (
              <tr key={guest.id} className="border-b border-neutral-50 last:border-0">
                <td className="px-4 py-3">{guest.name}</td>
                <td className="px-4 py-3">
                  <Badge variant={guest.attending === "yes" ? "success" : "danger"}>
                    {guest.attending === "yes" ? "Sí" : "No"}
                  </Badge>
                </td>
                <td className="px-4 py-3">{guest.adults}</td>
                <td className="px-4 py-3">{guest.children}</td>
                <td className="px-4 py-3 text-neutral-500">{guest.comments || "—"}</td>
              </tr>
            ))}
            {!filtered.length && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-neutral-400">
                  Sin resultados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </main>
  );
}

function StatCard({ label, value, sublabel }: { label: string; value: number; sublabel?: string }) {
  return (
    <Card className="p-4">
      <p className="text-2xl font-semibold">{value}</p>
      <p className="text-xs text-neutral-500">{label}</p>
      {sublabel && <p className="mt-1 text-xs text-neutral-400">{sublabel}</p>}
    </Card>
  );
}

function escapeCsv(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}
