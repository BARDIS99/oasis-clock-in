import { createServerFn } from "@tanstack/react-start";
import { scryptSync, randomBytes, timingSafeEqual } from "node:crypto";
import QRCode from "qrcode";
import { getSupabase, isMissingTable, OASIS_SCHEMA_SQL } from "@/lib/supabase.server";
import { newClockId, newId } from "@/lib/ids";
import { todayIso } from "@/lib/format";

type AdminRow = {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: string;
};

type LocationRow = {
  id: string;
  name: string;
  address: string;
  lat: number | null;
  lng: number | null;
  start_time: string | null;
  end_time: string | null;
  created_at: string;
};

type StudentRow = {
  id: string;
  name: string;
  email: string;
  matric: string;
  clock_id: string;
  device_token: string;
  device_fp: string;
  device_ip: string;
  location_id: string | null;
  status: string;
  registered_at: string;
  profile_picture_url: string | null;
};

type AttendanceRow = {
  id: string;
  student_id: string;
  location_id: string | null;
  day: string;
  clock_in_time: string | null;
  clock_out_time: string | null;
  status: string;
};

function hashPassword(password: string, salt?: string): string {
  const useSalt = salt ?? randomBytes(16).toString("hex");
  const hash = scryptSync(password, useSalt, 32).toString("hex");
  return `${useSalt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const next = scryptSync(password, salt, 32);
  const prev = Buffer.from(hash, "hex");
  if (next.length !== prev.length) return false;
  return timingSafeEqual(next, prev);
}

function clientIp(): string {
  try {
    const g = globalThis as { process?: { env?: Record<string, string | undefined> } };
    return g.process?.env?.PREVIEW_IP || "bound-device";
  } catch {
    return "bound-device";
  }
}

function throwSb(error: { message?: string } | null, fallback: string): never {
  throw new Error(error?.message || fallback);
}

async function requireAdmin(token: string) {
  if (!token) throw new Error("Admin session required");
  const sb = getSupabase();
  const session = await sb
    .from("oasis_sessions")
    .select("admin_id, expires_at")
    .eq("token", token)
    .maybeSingle();
  if (isMissingTable(session.error)) throw new Error("SCHEMA_MISSING");
  if (session.error) throwSb(session.error, "Admin session required");
  const row = session.data as { admin_id: string; expires_at: string } | null;
  if (!row) throw new Error("Admin session required");
  if (new Date(row.expires_at).getTime() < Date.now()) {
    await sb.from("oasis_sessions").delete().eq("token", token);
    throw new Error("Admin session expired");
  }
  const admin = await sb
    .from("oasis_admins")
    .select("id, name, email, role")
    .eq("id", row.admin_id)
    .maybeSingle();
  if (admin.error || !admin.data) throw new Error("Admin session required");
  const profile = admin.data as { id: string; name: string; email: string; role: string };
  return {
    admin_id: profile.id,
    name: profile.name,
    email: profile.email,
    role: profile.role,
  };
}

async function audit(adminId: string | null, action: string, details: string) {
  const sb = getSupabase();
  await sb.from("oasis_audit").insert({
    id: newId("aud"),
    admin_id: adminId,
    action,
    details,
  });
}

async function createSession(admin: { id: string; name: string; email: string; role: string }) {
  const sb = getSupabase();
  const token = randomBytes(24).toString("hex");
  const expires = new Date(Date.now() + 1000 * 60 * 60 * 12).toISOString();
  const inserted = await sb.from("oasis_sessions").insert({
    token,
    admin_id: admin.id,
    expires_at: expires,
  });
  if (inserted.error) throwSb(inserted.error, "Could not start session");
  return {
    token,
    admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role },
  };
}

export const bootstrapOasis = createServerFn({ method: "GET" }).handler(async () => {
  const sb = getSupabase();
  const locations = await sb
    .from("oasis_locations")
    .select("id, name, address, lat, lng, start_time, end_time, created_at")
    .order("name");
  if (isMissingTable(locations.error)) {
    return { locations: [] as LocationRow[], hasAdmin: false, needsSchema: true, schemaSql: OASIS_SCHEMA_SQL };
  }
  if (locations.error) throwSb(locations.error, "Could not load locations");
  const admins = await sb.from("oasis_admins").select("id", { count: "exact", head: true });
  return {
    locations: (locations.data || []) as LocationRow[],
    hasAdmin: (admins.count ?? 0) > 0,
    needsSchema: false,
    schemaSql: OASIS_SCHEMA_SQL,
  };
});

export const createFirstAdmin = createServerFn({ method: "POST" })
  .validator((d: { name: string; email: string; password: string }) => d)
  .handler(async ({ data }) => {
    const sb = getSupabase();
    const existing = await sb.from("oasis_admins").select("id", { count: "exact", head: true });
    if (isMissingTable(existing.error)) throw new Error("SCHEMA_MISSING");
    if ((existing.count ?? 0) > 0) {
      throw new Error("A supervisor account already exists. Sign in instead.");
    }
    const name = data.name.trim();
    const email = data.email.trim().toLowerCase();
    const password = data.password;
    if (name.length < 2) throw new Error("Enter the supervisor name");
    if (!email.includes("@")) throw new Error("Enter a valid email");
    if (password.length < 8) throw new Error("Password must be at least 8 characters");
    const id = newId("adm");
    const inserted = await sb.from("oasis_admins").insert({
      id,
      name,
      email,
      password_hash: hashPassword(password),
      role: "admin",
    });
    if (inserted.error) throwSb(inserted.error, "Could not create supervisor");
    await audit(id, "create_admin", email);
    return createSession({ id, name, email, role: "admin" });
  });

export const registerStudent = createServerFn({ method: "POST" })
  .validator((d: {
    name: string;
    email: string;
    matric?: string;
    locationId?: string;
    deviceToken: string;
    deviceFp: string;
  }) => d)
  .handler(async ({ data }) => {
    const name = data.name.trim();
    const email = data.email.trim().toLowerCase();
    const matric = (data.matric || "").trim();
    if (name.length < 2) throw new Error("Enter your full name");
    if (!email.includes("@")) throw new Error("Enter a valid email or matric email");
    if (!data.deviceToken) throw new Error("This device could not be identified");

    const sb = getSupabase();
    const deviceIp = clientIp();
    
    // Check 1: Email already registered
    const existingEmail = await sb.from("oasis_students").select("id, clock_id").eq("email", email).maybeSingle();
    if (isMissingTable(existingEmail.error)) throw new Error("SCHEMA_MISSING");
    if (existingEmail.data) {
      throw new Error(
        `This email is already registered with Clock ID: ${existingEmail.data.clock_id}. Use that Clock ID to sign in.`,
      );
    }
    
    // Check 2: Device token already used (same device)
    const existingDevice = await sb
      .from("oasis_students")
      .select("id, clock_id, name, device_token")
      .eq("device_token", data.deviceToken)
      .maybeSingle();
    
    if (existingDevice.data) {
      throw new Error(
        `This device is already registered to ${existingDevice.data.name} (${existingDevice.data.clock_id}). One device = one student only.`,
      );
    }
    
    // Check 3: Device fingerprint already used (same physical device)
    if (data.deviceFp) {
      const existingFingerprint = await sb
        .from("oasis_students")
        .select("id, clock_id, name, device_fp")
        .eq("device_fp", data.deviceFp)
        .maybeSingle();
      
      if (existingFingerprint.data) {
        throw new Error(
          `This device is already registered to ${existingFingerprint.data.name} (${existingFingerprint.data.clock_id}). Cannot register twice.`,
        );
      }
    }
    
    // Check 4: IP address already used today (prevent rapid re-registration)
    const existingIp = await sb
      .from("oasis_students")
      .select("id, clock_id, name, device_ip, created_at")
      .eq("device_ip", deviceIp)
      .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
      .maybeSingle();
    
    if (existingIp.data) {
      throw new Error(
        `This IP address was used to register ${existingIp.data.name} (${existingIp.data.clock_id}) recently. Wait 24 hours or contact admin.`,
      );
    }

    const id = newId("stu");
    const clockId = newClockId();
    const inserted = await sb.from("oasis_students").insert({
      id,
      name,
      email,
      matric,
      clock_id: clockId,
      device_token: data.deviceToken,
      device_fp: data.deviceFp || "",
      device_ip: deviceIp,
      location_id: data.locationId || null,
      status: "active",
    });
    if (inserted.error) throwSb(inserted.error, "Registration failed");
    return { studentId: id, clockId, name, email };
  });

export const getStudentByClock = createServerFn({ method: "POST" })
  .validator((d: { clockId: string; deviceToken: string }) => d)
  .handler(async ({ data }) => {
    const clockId = data.clockId.trim().toUpperCase();
    const sb = getSupabase();
    const found = await sb.from("oasis_students").select("*").eq("clock_id", clockId).maybeSingle();
    if (isMissingTable(found.error)) throw new Error("SCHEMA_MISSING");
    if (found.error) throwSb(found.error, "Clock ID not found");
    const student = found.data as StudentRow | null;
    if (!student) throw new Error("Clock ID not found");
    if (student.status !== "active") {
      throw new Error("This Clock ID is suspended. Speak with your supervisor.");
    }
    const deviceOk = student.device_token === data.deviceToken;
    const canClaim = student.device_token.startsWith("pending_");
    const day = todayIso();
    const today = await sb
      .from("oasis_attendance")
      .select("*")
      .eq("student_id", student.id)
      .eq("day", day)
      .maybeSingle();
    const history = await sb
      .from("oasis_attendance")
      .select("*")
      .eq("student_id", student.id)
      .order("day", { ascending: false })
      .limit(40);
    const rows = (history.data || []) as AttendanceRow[];
    return {
      student: {
        id: student.id,
        name: student.name,
        email: student.email,
        matric: student.matric,
        clockId: student.clock_id,
        status: student.status,
        locationId: student.location_id,
        registeredAt: student.registered_at,
        profilePictureUrl: student.profile_picture_url,
      },
      deviceOk,
      canClaim,
      today: (today.data as AttendanceRow | null) ?? null,
      history: rows,
      streak: computeStreak(rows),
    };
  });

function computeStreak(rows: AttendanceRow[]): number {
  if (!rows.length) return 0;
  const days = new Set(rows.filter((r) => r.clock_in_time).map((r) => String(r.day).slice(0, 10)));
  let streak = 0;
  const cursor = new Date();
  for (let i = 0; i < 60; i += 1) {
    const key = todayIso(cursor);
    if (days.has(key)) streak += 1;
    else if (i > 0) break;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export const clockAction = createServerFn({ method: "POST" })
  .validator((d: {
    clockId: string;
    deviceToken: string;
    deviceFp: string;
    locationId?: string;
    action: "in" | "out";
    userLat?: number;
    userLng?: number;
  }) => d)
  .handler(async ({ data }) => {
    const clockId = data.clockId.trim().toUpperCase();
    const sb = getSupabase();
    const found = await sb.from("oasis_students").select("*").eq("clock_id", clockId).maybeSingle();
    if (isMissingTable(found.error)) throw new Error("SCHEMA_MISSING");
    const student = found.data as StudentRow | null;
    if (!student) throw new Error("Clock ID not found");
    if (student.status !== "active") {
      throw new Error("This Clock ID is suspended. Speak with your supervisor.");
    }
    
    // 🔒 STRICT ONE-DEVICE ENFORCEMENT - NO OTHER DEVICE ALLOWED
    const currentIp = clientIp();
    
    if (student.device_token !== data.deviceToken) {
      // Log failed attempt to database
      await sb.from("oasis_failed_attempts").insert({
        id: newId("fail"),
        clock_id: clockId,
        device_token: data.deviceToken,
        device_ip: currentIp,
        device_fp: data.deviceFp,
        attempt_time: new Date().toISOString(),
        failure_reason: "DIFFERENT DEVICE - Device token mismatch",
        location_id: data.locationId || null,
        user_lat: data.userLat || null,
        user_lng: data.userLng || null,
      });
      
      throw new Error("❌ DEVICE NOT ALLOWED\n\nThis Clock ID is LOCKED to a different device.\n\nYou CANNOT use another phone to clock in.\n\nRegistered Device: " + student.device_token.slice(0, 8) + "...\nYour Device: " + data.deviceToken.slice(0, 8) + "...\n\n⚠️ If you changed phones, contact your supervisor to reassign your Clock ID.");
    }

    // Additional device fingerprint check for extra security
    if (student.device_fp && data.deviceFp && student.device_fp !== data.deviceFp) {
      // Log suspicious attempt
      await sb.from("oasis_failed_attempts").insert({
        id: newId("fail"),
        clock_id: clockId,
        device_token: data.deviceToken,
        device_ip: currentIp,
        device_fp: data.deviceFp,
        attempt_time: new Date().toISOString(),
        failure_reason: "DEVICE FINGERPRINT CHANGED - Browser or device properties changed",
        location_id: data.locationId || null,
        user_lat: data.userLat || null,
        user_lng: data.userLng || null,
      });
      
      throw new Error("❌ DEVICE VERIFICATION FAILED\n\nDevice fingerprint doesn't match.\n\nThis happens if you:\n• Cleared browser data\n• Updated your phone/browser\n• Changed browser settings\n\n⚠️ Contact your supervisor to re-verify this device.");
    }

    // Check IP address matches (strict enforcement)
    if (student.device_ip !== "bound-device" && currentIp !== "bound-device" && student.device_ip !== currentIp) {
      // Log IP mismatch
      await sb.from("oasis_failed_attempts").insert({
        id: newId("fail"),
        clock_id: clockId,
        device_token: data.deviceToken,
        device_ip: currentIp,
        device_fp: data.deviceFp,
        attempt_time: new Date().toISOString(),
        failure_reason: `IP ADDRESS CHANGED - Was: ${student.device_ip}, Now: ${currentIp}`,
        location_id: data.locationId || null,
        user_lat: data.userLat || null,
        user_lng: data.userLng || null,
      });
      
      throw new Error("❌ IP ADDRESS CHANGED\n\nYour device's IP address doesn't match.\n\nRegistered IP: " + student.device_ip + "\nCurrent IP: " + currentIp + "\n\nThis happens if you:\n• Changed WiFi networks\n• Using mobile data instead of WiFi\n• Using VPN or proxy\n\n⚠️ Contact your supervisor if this is your registered device.");
    }

    const locId = data.locationId || student.location_id;
    
    // Check location time window and GPS if location has them set
    if (locId) {
      const locationRes = await sb.from("oasis_locations").select("*").eq("id", locId).maybeSingle();
      const location = locationRes.data as LocationRow | null;
      
      if (location) {
        // Check time window
        if (location.start_time && location.end_time) {
          const now = new Date();
          const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`;
          
          if (currentTime < location.start_time || currentTime > location.end_time) {
            throw new Error(`Clock ${data.action} is only allowed between ${location.start_time.slice(0, 5)} and ${location.end_time.slice(0, 5)}`);
          }
        }
        
        // Check GPS location (within ~100 meters)
        if (location.lat != null && location.lng != null && data.userLat != null && data.userLng != null) {
          const distance = calculateDistance(data.userLat, data.userLng, location.lat, location.lng);
          if (distance > 0.1) { // 0.1 km = 100 meters
            throw new Error("You must be at the location site to clock in/out");
          }
        }
      }
    }

    const day = todayIso();
    const now = new Date().toISOString();
    const existingRes = await sb
      .from("oasis_attendance")
      .select("*")
      .eq("student_id", student.id)
      .eq("day", day)
      .maybeSingle();
    const existing = existingRes.data as AttendanceRow | null;

    if (data.action === "in") {
      if (existing?.clock_in_time) throw new Error("You already clocked in today");
      
      // Create pending attendance record requiring approval
      const attId = newId("att");
      let distanceMeters: number | null = null;
      
      // Calculate distance if GPS available
      if (locId) {
        const locationRes = await sb.from("oasis_locations").select("*").eq("id", locId).maybeSingle();
        const location = locationRes.data as LocationRow | null;
        if (location?.lat != null && location.lng != null && data.userLat != null && data.userLng != null) {
          const distanceKm = calculateDistance(data.userLat, data.userLng, location.lat, location.lng);
          distanceMeters = Math.round(distanceKm * 1000);
        }
      }
      
      if (existing) {
        const updated = await sb
          .from("oasis_attendance")
          .update({ 
            clock_in_time: now, 
            clock_in_ip: currentIp,
            location_id: locId, 
            status: "pending",
            distance_meters: distanceMeters
          })
          .eq("id", existing.id);
        if (updated.error) throwSb(updated.error, "Could not clock in");
      } else {
        const inserted = await sb.from("oasis_attendance").insert({
          id: attId,
          student_id: student.id,
          location_id: locId,
          day,
          clock_in_time: now,
          clock_in_ip: currentIp,
          status: "pending",
          distance_meters: distanceMeters,
        });
        if (inserted.error) throwSb(inserted.error, "Could not clock in");
      }
      
      // Create notification for admin (ONLY for clock-in)
      await sb.from("oasis_notifications").insert({
        id: newId("ntf"),
        student_id: student.id,
        action: "clock_in",
        message: `${student.name} clocked in at ${new Date(now).toLocaleTimeString()} - Awaiting approval`,
      });
      
      return { action: "in" as const, at: now, studentName: student.name, pending: true };
    }

    if (!existing?.clock_in_time) throw new Error("Clock in first before you clock out");
    if (existing.clock_out_time) throw new Error("You already clocked out today");
    if (existing.status !== "present") throw new Error("Your clock-in must be approved before you can clock out");
    
    const updated = await sb
      .from("oasis_attendance")
      .update({ 
        clock_out_time: now,
        clock_out_ip: currentIp
      })
      .eq("id", existing.id);
    if (updated.error) throwSb(updated.error, "Could not clock out");
    
    // NO notification for clock-out (only clock-in notifications)
    
    return { action: "out" as const, at: now, studentName: student.name };
  });

// Calculate distance between two GPS coordinates in kilometers
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

export const adminLogin = createServerFn({ method: "POST" })
  .validator((d: { email: string; password: string }) => d)
  .handler(async ({ data }) => {
    const sb = getSupabase();
    const rows = await sb
      .from("oasis_admins")
      .select("*")
      .eq("email", data.email.trim().toLowerCase())
      .maybeSingle();
    if (isMissingTable(rows.error)) throw new Error("SCHEMA_MISSING");
    const admin = rows.data as AdminRow | null;
    if (!admin || !verifyPassword(data.password, admin.password_hash)) {
      throw new Error("Email or password is incorrect");
    }
    const session = await createSession(admin);
    await audit(admin.id, "login", "Admin signed in");
    return session;
  });

export const adminMe = createServerFn({ method: "POST" })
  .validator((d: { token: string }) => d)
  .handler(async ({ data }) => {
    const admin = await requireAdmin(data.token);
    return { id: admin.admin_id, name: admin.name, email: admin.email, role: admin.role };
  });

export const adminLogout = createServerFn({ method: "POST" })
  .validator((d: { token: string }) => d)
  .handler(async ({ data }) => {
    const sb = getSupabase();
    await sb.from("oasis_sessions").delete().eq("token", data.token);
    return { ok: true };
  });

export const adminDashboard = createServerFn({ method: "POST" })
  .validator((d: { token: string }) => d)
  .handler(async ({ data }) => {
    await requireAdmin(data.token);
    const sb = getSupabase();
    const day = todayIso();
    const [students, locations, present] = await Promise.all([
      sb.from("oasis_students").select("id", { count: "exact", head: true }).eq("status", "active"),
      sb.from("oasis_locations").select("id", { count: "exact", head: true }),
      sb
        .from("oasis_attendance")
        .select("id", { count: "exact", head: true })
        .eq("day", day)
        .not("clock_in_time", "is", null),
    ]);
    const studentCount = students.count ?? 0;
    const presentCount = present.count ?? 0;
    const today = await sb
      .from("oasis_attendance")
      .select("id, clock_in_time, clock_out_time, status, student_id, location_id")
      .eq("day", day)
      .order("clock_in_time", { ascending: false });
    const att = (today.data || []) as {
      id: string;
      clock_in_time: string | null;
      clock_out_time: string | null;
      status: string;
      student_id: string;
      location_id: string | null;
    }[];
    const studentIds = [...new Set(att.map((r) => r.student_id))];
    const locIds = [...new Set(att.map((r) => r.location_id).filter(Boolean))] as string[];
    const studentMap: Record<string, { name: string; clock_id: string }> = {};
    const locMap: Record<string, string> = {};
    if (studentIds.length) {
      const srows = await sb.from("oasis_students").select("id, name, clock_id").in("id", studentIds);
      for (const row of (srows.data || []) as { id: string; name: string; clock_id: string }[]) {
        studentMap[row.id] = { name: row.name, clock_id: row.clock_id };
      }
    }
    if (locIds.length) {
      const lrows = await sb.from("oasis_locations").select("id, name").in("id", locIds);
      for (const row of (lrows.data || []) as { id: string; name: string }[]) {
        locMap[row.id] = row.name;
      }
    }
    return {
      totalStudents: studentCount,
      activeLocations: locations.count ?? 0,
      presentToday: presentCount,
      absentToday: Math.max(0, studentCount - presentCount),
      today: att.map((r) => ({
        id: r.id,
        name: studentMap[r.student_id]?.name || "Student",
        clock_id: studentMap[r.student_id]?.clock_id || "",
        location_name: r.location_id ? locMap[r.location_id] || null : null,
        clock_in_time: r.clock_in_time,
        clock_out_time: r.clock_out_time,
        status: r.status,
      })),
    };
  });

export const listLocations = createServerFn({ method: "POST" })
  .validator((d: { token?: string } = {}) => d)
  .handler(async () => {
    const sb = getSupabase();
    const res = await sb
      .from("oasis_locations")
      .select("id, name, address, lat, lng, start_time, end_time, created_at")
      .order("name");
    if (isMissingTable(res.error)) return [] as LocationRow[];
    if (res.error) throwSb(res.error, "Could not load locations");
    return (res.data || []) as LocationRow[];
  });

export const saveLocation = createServerFn({ method: "POST" })
  .validator((d: {
    token: string;
    id?: string;
    name: string;
    address?: string;
    lat?: number | null;
    lng?: number | null;
    start_time?: string | null;
    end_time?: string | null;
  }) => d)
  .handler(async ({ data }) => {
    const admin = await requireAdmin(data.token);
    const sb = getSupabase();
    const name = data.name.trim();
    if (!name) throw new Error("Location name is required");
    const id = data.id || newId("loc");
    if (data.id) {
      const updated = await sb
        .from("oasis_locations")
        .update({
          name,
          address: data.address || "",
          lat: data.lat ?? null,
          lng: data.lng ?? null,
          start_time: data.start_time ?? null,
          end_time: data.end_time ?? null,
        })
        .eq("id", id);
      if (updated.error) throwSb(updated.error, "Could not update location");
      await audit(admin.admin_id, "edit_location", name);
    } else {
      const inserted = await sb.from("oasis_locations").insert({
        id,
        name,
        address: data.address || "",
        lat: data.lat ?? null,
        lng: data.lng ?? null,
        start_time: data.start_time ?? null,
        end_time: data.end_time ?? null,
      });
      if (inserted.error) throwSb(inserted.error, "Could not create location");
      await audit(admin.admin_id, "create_location", name);
    }
    return { id };
  });

export const deleteLocation = createServerFn({ method: "POST" })
  .validator((d: { token: string; id: string }) => d)
  .handler(async ({ data }) => {
    const admin = await requireAdmin(data.token);
    const sb = getSupabase();
    const deleted = await sb.from("oasis_locations").delete().eq("id", data.id);
    if (deleted.error) throwSb(deleted.error, "Could not delete location");
    await audit(admin.admin_id, "delete_location", data.id);
    return { ok: true };
  });

export const locationQr = createServerFn({ method: "POST" })
  .validator((d: { locationId: string; origin: string }) => d)
  .handler(async ({ data }) => {
    const url = `${data.origin.replace(/\/$/, "")}/?loc=${encodeURIComponent(data.locationId)}`;
    const dataUrl = await QRCode.toDataURL(url, {
      margin: 1,
      width: 360,
      color: { dark: "#1e3a5f", light: "#ffffff" },
    });
    return { url, dataUrl };
  });

export const listStudents = createServerFn({ method: "POST" })
  .validator((d: { token: string; q?: string }) => d)
  .handler(async ({ data }) => {
    await requireAdmin(data.token);
    const sb = getSupabase();
    const res = await sb
      .from("oasis_students")
      .select("id, name, email, matric, clock_id, status, registered_at, location_id, device_token, approved, profile_picture_url")
      .order("registered_at", { ascending: false });
    if (res.error) throwSb(res.error, "Could not load students");
    const rows = (res.data || []) as (StudentRow & { location_id: string | null; approved: boolean })[];
    const locIds = [...new Set(rows.map((r) => r.location_id).filter(Boolean))] as string[];
    const locMap: Record<string, string> = {};
    if (locIds.length) {
      const lrows = await sb.from("oasis_locations").select("id, name").in("id", locIds);
      for (const row of (lrows.data || []) as { id: string; name: string }[]) locMap[row.id] = row.name;
    }
    const lastIns = await Promise.all(
      rows.map(async (s) => {
        const last = await sb
          .from("oasis_attendance")
          .select("clock_in_time")
          .eq("student_id", s.id)
          .not("clock_in_time", "is", null)
          .order("day", { ascending: false })
          .limit(1)
          .maybeSingle();
        return [s.id, (last.data as { clock_in_time: string } | null)?.clock_in_time || null] as const;
      }),
    );
    const lastMap = Object.fromEntries(lastIns);
    const q = (data.q || "").trim().toLowerCase();
    return rows
      .filter((r) => {
        if (!q) return true;
        return [r.name, r.email, r.clock_id, r.matric].some((v) => v.toLowerCase().includes(q));
      })
      .map((r) => ({
        id: r.id,
        name: r.name,
        email: r.email,
        matric: r.matric,
        clock_id: r.clock_id,
        status: r.status,
        registered_at: r.registered_at,
        location_name: r.location_id ? locMap[r.location_id] || null : null,
        device_bound: !r.device_token.startsWith("pending_"),
        last_in: lastMap[r.id] || null,
        approved: r.approved ?? false,
        profile_picture_url: r.profile_picture_url || null,
      }));
  });

export const setStudentStatus = createServerFn({ method: "POST" })
  .validator((d: { token: string; id: string; status: "active" | "suspended" }) => d)
  .handler(async ({ data }) => {
    const admin = await requireAdmin(data.token);
    const sb = getSupabase();
    const updated = await sb.from("oasis_students").update({ status: data.status }).eq("id", data.id);
    if (updated.error) throwSb(updated.error, "Could not update student");
    await audit(admin.admin_id, "set_status", `${data.id}:${data.status}`);
    return { ok: true };
  });

export const approveStudent = createServerFn({ method: "POST" })
  .validator((d: { token: string; id: string }) => d)
  .handler(async ({ data }) => {
    const admin = await requireAdmin(data.token);
    const sb = getSupabase();
    const updated = await sb.from("oasis_students").update({ approved: true }).eq("id", data.id);
    if (updated.error) throwSb(updated.error, "Could not approve student");
    await audit(admin.admin_id, "approve_student", data.id);
    return { ok: true };
  });

export const deleteStudent = createServerFn({ method: "POST" })
  .validator((d: { token: string; id: string }) => d)
  .handler(async ({ data }) => {
    const admin = await requireAdmin(data.token);
    const sb = getSupabase();
    const deleted = await sb.from("oasis_students").delete().eq("id", data.id);
    if (deleted.error) throwSb(deleted.error, "Could not delete student");
    await audit(admin.admin_id, "delete_student", data.id);
    return { ok: true };
  });

export const reassignDevice = createServerFn({ method: "POST" })
  .validator((d: { token: string; id: string }) => d)
  .handler(async ({ data }) => {
    const admin = await requireAdmin(data.token);
    const sb = getSupabase();
    const nextClock = newClockId();
    const placeholder = `pending_${newId("dev")}`;
    const updated = await sb
      .from("oasis_students")
      .update({
        device_token: placeholder,
        device_fp: "",
        device_ip: "",
        clock_id: nextClock,
      })
      .eq("id", data.id);
    if (updated.error) throwSb(updated.error, "Could not reassign device");
    await audit(admin.admin_id, "reassign_device", `${data.id} -> ${nextClock}`);
    return { clockId: nextClock };
  });

export const claimReassignedDevice = createServerFn({ method: "POST" })
  .validator((d: { clockId: string; deviceToken: string; deviceFp: string }) => d)
  .handler(async ({ data }) => {
    const clockId = data.clockId.trim().toUpperCase();
    const sb = getSupabase();
    const found = await sb.from("oasis_students").select("*").eq("clock_id", clockId).maybeSingle();
    const student = found.data as StudentRow | null;
    if (!student) throw new Error("Clock ID not found");
    if (!student.device_token.startsWith("pending_")) {
      throw new Error("This Clock ID is already bound to a device");
    }
    const updated = await sb
      .from("oasis_students")
      .update({
        device_token: data.deviceToken,
        device_fp: data.deviceFp || "",
        device_ip: clientIp(),
      })
      .eq("id", student.id);
    if (updated.error) throwSb(updated.error, "Could not bind device");
    return { studentId: student.id, clockId: student.clock_id, name: student.name };
  });

export const listAttendance = createServerFn({ method: "POST" })
  .validator((d: {
    token: string;
    from?: string;
    to?: string;
    locationId?: string;
    q?: string;
  }) => d)
  .handler(async ({ data }) => {
    await requireAdmin(data.token);
    const sb = getSupabase();
    const from = data.from || "2000-01-01";
    const to = data.to || "2100-01-01";
    const res = await sb
      .from("oasis_attendance")
      .select("id, day, student_id, location_id, clock_in_time, clock_out_time, clock_in_ip, clock_out_ip, status")
      .gte("day", from)
      .lte("day", to)
      .order("day", { ascending: false })
      .limit(400);
    if (res.error) throwSb(res.error, "Could not load attendance");
    const rows = (res.data || []) as {
      id: string;
      day: string;
      student_id: string;
      location_id: string | null;
      clock_in_time: string | null;
      clock_out_time: string | null;
      clock_in_ip: string | null;
      clock_out_ip: string | null;
      status: string;
    }[];
    const studentIds = [...new Set(rows.map((r) => r.student_id))];
    const locIds = [...new Set(rows.map((r) => r.location_id).filter(Boolean))] as string[];
    const studentMap: Record<string, { name: string; clock_id: string }> = {};
    const locMap: Record<string, string> = {};
    if (studentIds.length) {
      const srows = await sb.from("oasis_students").select("id, name, clock_id").in("id", studentIds);
      for (const row of (srows.data || []) as { id: string; name: string; clock_id: string }[]) {
        studentMap[row.id] = { name: row.name, clock_id: row.clock_id };
      }
    }
    if (locIds.length) {
      const lrows = await sb.from("oasis_locations").select("id, name").in("id", locIds);
      for (const row of (lrows.data || []) as { id: string; name: string }[]) locMap[row.id] = row.name;
    }
    const loc = data.locationId || "";
    const q = (data.q || "").trim().toLowerCase();
    return rows
      .map((r) => ({
        id: r.id,
        day: r.day,
        name: studentMap[r.student_id]?.name || "Student",
        clock_id: studentMap[r.student_id]?.clock_id || "",
        location_id: r.location_id,
        location_name: r.location_id ? locMap[r.location_id] || null : null,
        clock_in_time: r.clock_in_time,
        clock_out_time: r.clock_out_time,
        clock_in_ip: r.clock_in_ip,
        clock_out_ip: r.clock_out_ip,
        status: r.status,
      }))
      .filter((row) => {
        if (loc && row.location_id !== loc) return false;
        if (!q) return true;
        return row.name.toLowerCase().includes(q) || row.clock_id.toLowerCase().includes(q);
      });
  });

export const listAudit = createServerFn({ method: "POST" })
  .validator((d: { token: string }) => d)
  .handler(async ({ data }) => {
    await requireAdmin(data.token);
    const sb = getSupabase();
    const res = await sb
      .from("oasis_audit")
      .select("id, action, details, created_at")
      .order("created_at", { ascending: false })
      .limit(80);
    if (res.error) throwSb(res.error, "Could not load audit log");
    return (res.data || []) as { id: string; action: string; details: string; created_at: string }[];
  });

export const adjustAttendanceTime = createServerFn({ method: "POST" })
  .validator((d: {
    token: string;
    attendanceId: string;
    clockInTime?: string | null;
    clockOutTime?: string | null;
  }) => d)
  .handler(async ({ data }) => {
    const admin = await requireAdmin(data.token);
    const sb = getSupabase();
    
    // Fetch the current attendance record
    const current = await sb
      .from("oasis_attendance")
      .select("id, student_id, day, clock_in_time, clock_out_time")
      .eq("id", data.attendanceId)
      .maybeSingle();
    
    if (!current.data) throw new Error("Attendance record not found");
    
    const updates: { clock_in_time?: string | null; clock_out_time?: string | null } = {};
    
    if (data.clockInTime !== undefined) {
      updates.clock_in_time = data.clockInTime;
    }
    if (data.clockOutTime !== undefined) {
      updates.clock_out_time = data.clockOutTime;
    }
    
    if (Object.keys(updates).length === 0) {
      throw new Error("No time updates provided");
    }
    
    const updated = await sb
      .from("oasis_attendance")
      .update(updates)
      .eq("id", data.attendanceId);
    
    if (updated.error) throwSb(updated.error, "Could not update attendance time");
    
    // Get student name for audit log
    const studentData = await sb
      .from("oasis_students")
      .select("name, clock_id")
      .eq("id", current.data.student_id)
      .maybeSingle();
    
    const studentInfo = studentData.data as { name: string; clock_id: string } | null;
    const studentName = studentInfo?.name || "Unknown";
    const clockId = studentInfo?.clock_id || "Unknown";
    
    const details = `${studentName} (${clockId}) on ${current.data.day}: ${
      data.clockInTime !== undefined ? `In: ${data.clockInTime || "cleared"}` : ""
    }${data.clockInTime !== undefined && data.clockOutTime !== undefined ? ", " : ""}${
      data.clockOutTime !== undefined ? `Out: ${data.clockOutTime || "cleared"}` : ""
    }`;
    
    await audit(admin.admin_id, "adjust_time", details);
    
    return { ok: true };
  });

export const recoverClockId = createServerFn({ method: "POST" })
  .validator((d: { email: string }) => d)
  .handler(async ({ data }) => {
    const email = data.email.trim().toLowerCase();
    if (!email.includes("@")) throw new Error("Enter a valid email");
    
    const sb = getSupabase();
    const student = await sb
      .from("oasis_students")
      .select("clock_id, name")
      .eq("email", email)
      .maybeSingle();
    
    if (isMissingTable(student.error)) throw new Error("SCHEMA_MISSING");
    if (!student.data) throw new Error("No account found with this email");
    
    const result = student.data as { clock_id: string; name: string };
    
    return {
      clockId: result.clock_id,
      name: result.name,
    };
  });

// Helper to calculate grade and emoji
function calculateGrade(attendanceScore: number, projectScore: number): { total: number; grade: string; emoji: string } {
  const total = attendanceScore + projectScore;
  let grade = "F";
  let emoji = "😞";
  
  if (total >= 90) { grade = "A+"; emoji = "🌟"; }
  else if (total >= 85) { grade = "A"; emoji = "😊"; }
  else if (total >= 80) { grade = "B+"; emoji = "👍"; }
  else if (total >= 75) { grade = "B"; emoji = "🙂"; }
  else if (total >= 70) { grade = "C+"; emoji = "😐"; }
  else if (total >= 65) { grade = "C"; emoji = "😕"; }
  else if (total >= 60) { grade = "D"; emoji = "😟"; }
  else { grade = "F"; emoji = "😞"; }
  
  return { total, grade, emoji };
}

// Get current week range
function getCurrentWeekRange(): { start: string; end: string } {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
  const monday = new Date(now.setDate(diff));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  
  return {
    start: monday.toISOString().split('T')[0],
    end: sunday.toISOString().split('T')[0],
  };
}

export const gradeStudent = createServerFn({ method: "POST" })
  .validator((d: {
    token: string;
    studentId: string;
    attendanceScore: number;
    projectScore: number;
    comment?: string;
    weekStart?: string;
  }) => d)
  .handler(async ({ data }) => {
    const admin = await requireAdmin(data.token);
    const sb = getSupabase();
    
    const weekRange = data.weekStart 
      ? { start: data.weekStart, end: new Date(new Date(data.weekStart).getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] }
      : getCurrentWeekRange();
    
    const { total, grade, emoji } = calculateGrade(data.attendanceScore, data.projectScore);
    
    const id = newId("grd");
    const gradeData = {
      id,
      student_id: data.studentId,
      week_start: weekRange.start,
      week_end: weekRange.end,
      attendance_score: data.attendanceScore,
      project_score: data.projectScore,
      total_score: total,
      grade,
      emoji,
      admin_comment: data.comment || "",
      graded_by: admin.admin_id,
    };
    
    // Check if grade exists for this week
    const existing = await sb
      .from("oasis_student_grades")
      .select("id")
      .eq("student_id", data.studentId)
      .eq("week_start", weekRange.start)
      .maybeSingle();
    
    if (existing.data) {
      // Update existing
      const updated = await sb
        .from("oasis_student_grades")
        .update(gradeData)
        .eq("id", existing.data.id);
      if (updated.error) throwSb(updated.error, "Could not update grade");
    } else {
      // Insert new
      const inserted = await sb.from("oasis_student_grades").insert(gradeData);
      if (inserted.error) throwSb(inserted.error, "Could not save grade");
    }
    
    await audit(admin.admin_id, "grade_student", `${data.studentId}: ${grade} (${emoji})`);
    
    return { grade, emoji, total };
  });

export const getStudentGrade = createServerFn({ method: "POST" })
  .validator((d: { studentId: string; weekStart?: string }) => d)
  .handler(async ({ data }) => {
    const sb = getSupabase();
    const weekRange = data.weekStart 
      ? { start: data.weekStart, end: "" }
      : getCurrentWeekRange();
    
    const result = await sb
      .from("oasis_student_grades")
      .select("*")
      .eq("student_id", data.studentId)
      .eq("week_start", weekRange.start)
      .maybeSingle();
    
    if (isMissingTable(result.error)) return null;
    if (!result.data) return null;
    
    return result.data as {
      id: string;
      attendance_score: number;
      project_score: number;
      total_score: number;
      grade: string;
      emoji: string;
      admin_comment: string;
      week_start: string;
      week_end: string;
    };
  });

export const getRecentNotifications = createServerFn({ method: "POST" })
  .validator((d: { token: string; limit?: number }) => d)
  .handler(async ({ data }) => {
    await requireAdmin(data.token);
    const sb = getSupabase();
    
    const result = await sb
      .from("oasis_notifications")
      .select("id, student_id, action, message, created_at")
      .order("created_at", { ascending: false })
      .limit(data.limit || 50);
    
    if (isMissingTable(result.error)) return [];
    if (result.error) throwSb(result.error, "Could not load notifications");
    
    return (result.data || []) as {
      id: string;
      student_id: string;
      action: string;
      message: string;
      created_at: string;
    }[];
  });

export const listAllGrades = createServerFn({ method: "POST" })
  .validator((d: { token: string; weekStart?: string }) => d)
  .handler(async ({ data }) => {
    await requireAdmin(data.token);
    const sb = getSupabase();
    
    const weekRange = data.weekStart || getCurrentWeekRange().start;
    
    const result = await sb
      .from("oasis_student_grades")
      .select("*")
      .eq("week_start", weekRange)
      .order("total_score", { ascending: false });
    
    if (isMissingTable(result.error)) return [];
    if (result.error) throwSb(result.error, "Could not load grades");
    
    // Get student names
    const grades = (result.data || []) as any[];
    const studentIds = grades.map(g => g.student_id);
    
    if (studentIds.length === 0) return [];
    
    const students = await sb
      .from("oasis_students")
      .select("id, name, clock_id")
      .in("id", studentIds);
    
    const studentMap = new Map(
      (students.data || []).map((s: any) => [s.id, { name: s.name, clock_id: s.clock_id }])
    );
    
    return grades.map(g => ({
      ...g,
      student_name: studentMap.get(g.student_id)?.name || "Unknown",
      student_clock_id: studentMap.get(g.student_id)?.clock_id || "",
    }));
  });

export const getPendingClockIns = createServerFn({ method: "POST" })
  .validator((d: { token: string }) => d)
  .handler(async ({ data }) => {
    await requireAdmin(data.token);
    const sb = getSupabase();
    
    const day = todayIso();
    const result = await sb
      .from("oasis_attendance")
      .select("id, student_id, location_id, clock_in_time, distance_meters")
      .eq("day", day)
      .eq("status", "pending")
      .order("clock_in_time", { ascending: false });
    
    if (isMissingTable(result.error)) return [];
    if (result.error) throwSb(result.error, "Could not load pending clock-ins");
    
    const pending = (result.data || []) as {
      id: string;
      student_id: string;
      location_id: string | null;
      clock_in_time: string;
      distance_meters: number | null;
    }[];
    
    if (pending.length === 0) return [];
    
    // Get student names
    const studentIds = pending.map(p => p.student_id);
    const students = await sb
      .from("oasis_students")
      .select("id, name, clock_id")
      .in("id", studentIds);
    
    const studentMap = new Map(
      (students.data || []).map((s: any) => [s.id, { name: s.name, clock_id: s.clock_id }])
    );
    
    // Get location names
    const locationIds = pending.map(p => p.location_id).filter(Boolean) as string[];
    const locations = locationIds.length > 0
      ? await sb.from("oasis_locations").select("id, name").in("id", locationIds)
      : { data: [] };
    
    const locationMap = new Map(
      (locations.data || []).map((l: any) => [l.id, l.name])
    );
    
    return pending.map(p => ({
      id: p.id,
      student_id: p.student_id,
      student_name: studentMap.get(p.student_id)?.name || "Unknown",
      clock_id: studentMap.get(p.student_id)?.clock_id || "",
      location_name: p.location_id ? locationMap.get(p.location_id) || null : null,
      clock_in_time: p.clock_in_time,
      distance_meters: p.distance_meters,
    }));
  });

export const approveClockIn = createServerFn({ method: "POST" })
  .validator((d: { token: string; attendanceId: string }) => d)
  .handler(async ({ data }) => {
    const admin = await requireAdmin(data.token);
    const sb = getSupabase();
    
    const updated = await sb
      .from("oasis_attendance")
      .update({ status: "present" })
      .eq("id", data.attendanceId)
      .eq("status", "pending");
    
    if (updated.error) throwSb(updated.error, "Could not approve clock-in");
    
    await audit(admin.admin_id, "approve_clockin", data.attendanceId);
    return { ok: true };
  });

export const rejectClockIn = createServerFn({ method: "POST" })
  .validator((d: { token: string; attendanceId: string }) => d)
  .handler(async ({ data }) => {
    const admin = await requireAdmin(data.token);
    const sb = getSupabase();
    
    // Delete the attendance record
    const deleted = await sb
      .from("oasis_attendance")
      .delete()
      .eq("id", data.attendanceId)
      .eq("status", "pending");
    
    if (deleted.error) throwSb(deleted.error, "Could not reject clock-in");
    
    await audit(admin.admin_id, "reject_clockin", data.attendanceId);
    return { ok: true };
  });


// ==================
// PROFILE PICTURE UPLOAD
// ==================

export const uploadProfilePicture = createServerFn({ method: "POST" })
  .validator((d: { studentId: string; imageBase64: string; fileName: string }) => d)
  .handler(async ({ data }) => {
    const sb = getSupabase();
    
    // Verify student exists
    const studentRes = await sb
      .from("oasis_students")
      .select("id, clock_id, profile_picture_url")
      .eq("id", data.studentId)
      .maybeSingle();
    
    if (!studentRes.data) throw new Error("Student not found");
    const student = studentRes.data as { id: string; clock_id: string; profile_picture_url: string | null };
    
    // Extract base64 data (remove data:image/xxx;base64, prefix if present)
    const base64Data = data.imageBase64.includes(",") 
      ? data.imageBase64.split(",")[1] 
      : data.imageBase64;
    
    const buffer = Buffer.from(base64Data, "base64");
    
    // Validate file size (5MB max)
    if (buffer.length > 5 * 1024 * 1024) {
      throw new Error("Image must be less than 5MB");
    }
    
    // Generate unique filename
    const ext = data.fileName.split(".").pop()?.toLowerCase() || "jpg";
    if (!["jpg", "jpeg", "png", "webp"].includes(ext)) {
      throw new Error("Only JPG, PNG, and WebP images are allowed");
    }
    
    const fileName = `${student.clock_id}_${Date.now()}.${ext}`;
    
    // Upload to Supabase Storage
    const uploadResult = await sb.storage
      .from("profile-pictures")
      .upload(fileName, buffer, {
        contentType: `image/${ext === "jpg" ? "jpeg" : ext}`,
        upsert: true,
      });
    
    if (uploadResult.error) {
      console.error("Storage upload error:", uploadResult.error);
      throw new Error("Failed to upload image. Make sure the 'profile-pictures' bucket exists in Supabase Storage.");
    }
    
    // Get public URL
    const { data: urlData } = sb.storage
      .from("profile-pictures")
      .getPublicUrl(fileName);
    
    const publicUrl = urlData.publicUrl;
    
    // Delete old profile picture if exists
    if (student.profile_picture_url) {
      const oldFileName = student.profile_picture_url.split("/").pop();
      if (oldFileName) {
        await sb.storage.from("profile-pictures").remove([oldFileName]);
      }
    }
    
    // Update student record with new picture URL
    const updateResult = await sb
      .from("oasis_students")
      .update({ profile_picture_url: publicUrl })
      .eq("id", data.studentId);
    
    if (updateResult.error) {
      console.error("Database update error:", updateResult.error);
      throw new Error("Failed to update profile");
    }
    
    // Log the update
    await audit(null, "profile_picture_updated", `Student ${student.clock_id} updated profile picture`);
    
    return { url: publicUrl };
  });

export const getStudentProfile = createServerFn({ method: "POST" })
  .validator((d: { studentId: string }) => d)
  .handler(async ({ data }) => {
    const sb = getSupabase();
    const result = await sb
      .from("oasis_students")
      .select("id, name, email, matric, clock_id, profile_picture_url, status, registered_at")
      .eq("id", data.studentId)
      .maybeSingle();
    
    if (!result.data) throw new Error("Student not found");
    return result.data;
  });
