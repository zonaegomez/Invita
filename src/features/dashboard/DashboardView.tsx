"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Card, Input } from "@/components/ui";
import type { GuestStats } from "@/types/guest";
import type { FamilyEntry } from "@/types/family";

export interface SerializedGuest {
  id: string;
  name: string;
  attending: "yes" | "no";
  adults: number;
  children: number;
  comments?: string;
  createdAtLabel: string;
  familyId?: string;
}

interface DashboardViewProps {
  hostName: string;
  dateLabel: string;
  slug: string;
  guests: SerializedGuest[];
  stats: GuestStats;
  editarHref: string;
  invitationId: string;
  editToken: string;
  initialFamilies: FamilyEntry[];
  publicUrl: string;
}

export function DashboardView({
  hostName,
  dateLabel,
  slug,
  guests,
  stats,
  editarHref,
  invitationId,
  editToken,
  initialFamilies,
  publicUrl,
}: DashboardViewProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "yes" | "no">("all");
  const [families, setFamilies] = useState<FamilyEntry[]>(initialFamilies);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const confirmedByFamily = useMemo(() => {
    const map = new Map<string, number>();
    for (const g of guests) {
      if (g.attending !== "yes" || !g.familyId) continue;
      map.set(g.familyId, (map.get(g.familyId) ?? 0) + g.adults + g.children);
    }
    return map;
  }, [guests]);

  async function handleUploadFamilyList(file: File) {
    setUploading(true);
    setUploadMsg(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/invitations/${invitationId}/family-list?editToken=${editToken}`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setUploadMsg({ type: "error", text: data.error || "No se pudo subir el archivo." });
        return;
      }
      setUploadMsg({ type: "ok", text: `Lista cargada: ${data.imported} familia(s).` });
      const listRes = await fetch(`/api/invitations/${invitationId}/family-list?editToken=${editToken}`);
      const listData = await listRes.json();
      if (listRes.ok) setFamilies(listData.families ?? []);
    } catch {
      setUploadMsg({ type: "error", text: "Error de conexión al subir el archivo." });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function whatsappHref(family: FamilyEntry): string | null {
    if (!family.phone) return null;
    const digits = family.phone.replace(/[^0-9]/g, "");
    if (!digits) return null;
    const message = `¡Hola! Te comparto la invitación de ${hostName}. Por favor confirma tu asistencia aquí: ${publicUrl}`;
    return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
  }

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

      <Card className="mt-8 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-base font-semibold">Lista de invitados esperados</h2>
            <p className="mt-1 max-w-xl text-sm text-neutral-500">
              {families.length
                ? "Solo quienes estén en esta lista pueden confirmar su asistencia, con el tope de personas que definiste por familia."
                : "Sube tu lista (CSV o Excel) para activar el filtro: solo quienes estén en la lista podrán confirmar, con un tope fijo de invitados por familia."}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
            <div className="flex gap-2">
              <a href="/plantillas/lista-invitados-plantilla.xlsx" download>
                <Button variant="ghost" size="sm">
                  Descargar plantilla
                </Button>
              </a>
              <Button
                variant="secondary"
                size="sm"
                isLoading={uploading}
                onClick={() => fileInputRef.current?.click()}
              >
                {families.length ? "Reemplazar lista" : "Subir lista"}
              </Button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleUploadFamilyList(file);
              }}
            />
          </div>
        </div>

        {uploadMsg && (
          <p className={`mt-3 text-sm ${uploadMsg.type === "ok" ? "text-green-700" : "text-red-600"}`}>
            {uploadMsg.text}
          </p>
        )}

        {families.length > 0 && (
          <div className="mt-4 overflow-x-auto rounded-xl border border-neutral-100">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-neutral-100 text-neutral-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Familia</th>
                  <th className="px-4 py-2 font-medium">Integrantes</th>
                  <th className="px-4 py-2 font-medium">Cupo</th>
                  <th className="px-4 py-2 font-medium">WhatsApp</th>
                </tr>
              </thead>
              <tbody>
                {families.map((f) => {
                  const confirmed = confirmedByFamily.get(f.id) ?? 0;
                  const wa = whatsappHref(f);
                  return (
                    <tr key={f.id} className="border-b border-neutral-50 last:border-0">
                      <td className="px-4 py-2 font-medium">{f.familyLabel}</td>
                      <td className="px-4 py-2 text-neutral-500">{f.names.join(", ")}</td>
                      <td className="px-4 py-2">
                        {confirmed}/{f.maxGuests}
                      </td>
                      <td className="px-4 py-2">
                        {wa ? (
                          <a href={wa} target="_blank" rel="noopener noreferrer" className="text-green-700 underline">
                            Enviar
                          </a>
                        ) : (
                          <span className="text-neutral-300">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

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
