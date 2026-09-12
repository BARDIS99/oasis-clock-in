import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { readAdminToken } from "@/lib/device";
import {
  deleteLocation,
  listLocations,
  locationQr,
  saveLocation,
} from "@/lib/server/oasis";
import { pushToast } from "@/lib/toast";

export const Route = createFileRoute("/admin/locations")({ component: LocationsPage });

type Loc = {
  id: string;
  name: string;
  address: string;
  lat: number | null;
  lng: number | null;
  start_time: string | null;
  end_time: string | null;
};

function LocationsPage() {
  const [rows, setRows] = useState<Loc[]>([]);
  const [editing, setEditing] = useState<Partial<Loc> | null>(null);
  const [qrs, setQrs] = useState<Record<string, string>>({});

  async function refresh() {
    const token = readAdminToken();
    const list = await listLocations({ data: { token } });
    setRows(list);
    const origin = window.location.origin;
    const next: Record<string, string> = {};
    await Promise.all(
      list.map(async (loc) => {
        const qr = await locationQr({ data: { locationId: loc.id, origin } });
        next[loc.id] = qr.dataUrl;
      }),
    );
    setQrs(next);
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!editing?.name) return;
    const token = readAdminToken();
    await saveLocation({
      data: {
        token,
        id: editing.id,
        name: editing.name,
        address: editing.address,
        lat: editing.lat ?? null,
        lng: editing.lng ?? null,
        start_time: editing.start_time ?? null,
        end_time: editing.end_time ?? null,
      },
    });
    setEditing(null);
    pushToast("ok", "Location saved");
    await refresh();
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-navy">Locations</h1>
          <p className="mt-1 text-sm text-muted">
            Each site has a QR that opens registration or clock-in.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditing({ name: "", address: "" })}
          className="h-11 rounded-md bg-navy px-4 text-sm font-semibold text-on-navy"
        >
          New location
        </button>
      </div>

      {editing ? (
        <form
          onSubmit={save}
          className="mt-6 grid gap-3 rounded-xl bg-surface p-4 shadow-card sm:grid-cols-2"
        >
          <label className="text-sm font-medium sm:col-span-2">
            Name
            <input
              required
              value={editing.name || ""}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              className="mt-1.5 h-11 w-full rounded-md border border-line bg-bg px-3"
            />
          </label>
          <label className="text-sm font-medium sm:col-span-2">
            Address
            <input
              value={editing.address || ""}
              onChange={(e) => setEditing({ ...editing, address: e.target.value })}
              className="mt-1.5 h-11 w-full rounded-md border border-line bg-bg px-3"
            />
          </label>
          <label className="text-sm font-medium">
            GPS Location - Latitude (Optional)
            <input
              type="number"
              step="any"
              placeholder="e.g., 9.0820"
              value={editing.lat ?? ""}
              onChange={(e) =>
                setEditing({
                  ...editing,
                  lat: e.target.value === "" ? null : Number(e.target.value),
                })
              }
              className="mt-1.5 h-11 w-full rounded-md border border-line bg-bg px-3"
            />
            <p className="mt-1 text-xs text-muted">Get from Google Maps: Right-click location → Copy coordinates</p>
          </label>
          <label className="text-sm font-medium">
            GPS Location - Longitude (Optional)
            <input
              type="number"
              step="any"
              placeholder="e.g., 7.5310"
              value={editing.lng ?? ""}
              onChange={(e) =>
                setEditing({
                  ...editing,
                  lng: e.target.value === "" ? null : Number(e.target.value),
                })
              }
              className="mt-1.5 h-11 w-full rounded-md border border-line bg-bg px-3"
            />
            <p className="mt-1 text-xs text-muted">Students must be within 100m of this location to clock in/out</p>
          </label>
          <label className="text-sm font-medium">
            Opening Time (Clock-in starts)
            <input
              type="time"
              value={editing.start_time || ""}
              onChange={(e) => setEditing({ ...editing, start_time: e.target.value || null })}
              placeholder="e.g., 08:00"
              className="mt-1.5 h-11 w-full rounded-md border border-line bg-bg px-3"
            />
            <p className="mt-1 text-xs text-muted">Students can start clocking in at this time</p>
          </label>
          <label className="text-sm font-medium">
            Closing Time (Clock-out deadline)
            <input
              type="time"
              value={editing.end_time || ""}
              onChange={(e) => setEditing({ ...editing, end_time: e.target.value || null })}
              placeholder="e.g., 17:00"
              className="mt-1.5 h-11 w-full rounded-md border border-line bg-bg px-3"
            />
            <p className="mt-1 text-xs text-muted">Students must clock out before this time</p>
          </label>
          <div className="flex gap-2 sm:col-span-2">
            <button
              type="submit"
              className="h-11 rounded-md bg-accent px-4 text-sm font-semibold text-white"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="h-11 rounded-md border border-line px-4 text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {rows.map((loc) => (
          <article key={loc.id} className="rounded-xl bg-surface p-4 shadow-card">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-medium text-navy">{loc.name}</h2>
                <p className="text-sm text-muted">{loc.address || "No address yet"}</p>
                {loc.start_time && loc.end_time ? (
                  <p className="mt-1 text-xs text-accent">
                    ⏰ {loc.start_time.slice(0, 5)} - {loc.end_time.slice(0, 5)}
                  </p>
                ) : null}
                {loc.lat != null && loc.lng != null ? (
                  <a
                    className="mt-1 inline-block text-xs text-accent"
                    href={`https://www.openstreetmap.org/?mlat=${loc.lat}&mlon=${loc.lng}#map=16/${loc.lat}/${loc.lng}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {loc.lat.toFixed(4)}, {loc.lng.toFixed(4)} · Open map
                  </a>
                ) : null}
              </div>
              {qrs[loc.id] ? (
                <img src={qrs[loc.id]} alt={`QR for ${loc.name}`} className="size-24 rounded-md border border-line" />
              ) : (
                <div className="size-24 rounded-md bg-surface-2" />
              )}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {qrs[loc.id] ? (
                <a
                  href={qrs[loc.id]}
                  download={`${loc.name.replace(/\s+/g, "-")}-qr.png`}
                  className="h-10 rounded-md border border-line px-3 text-sm leading-10"
                >
                  Download QR
                </a>
              ) : null}
              <button
                type="button"
                onClick={() => setEditing(loc)}
                className="h-10 rounded-md border border-line px-3 text-sm"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={async () => {
                  await deleteLocation({ data: { token: readAdminToken(), id: loc.id } });
                  pushToast("ok", "Location removed");
                  await refresh();
                }}
                className="h-10 rounded-md px-3 text-sm text-danger"
              >
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
