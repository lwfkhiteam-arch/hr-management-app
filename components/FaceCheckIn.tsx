"use client";
import { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import { supabase } from "@/lib/supabase";
import { OFFICE, currentPosition, distanceM } from "@/lib/geo";

type Today = { id: string; status: string; timestamp: string; check_out_at: string | null } | null;

export default function FaceCheckIn({ userId, today, onDone }: { userId: string; today: Today; onDone: () => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const [face, setFace] = useState(false);
  const [dist, setDist] = useState<number | null>(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const inside = dist !== null && dist <= OFFICE.radius;

  useEffect(() => {
    let stream: MediaStream, timer: ReturnType<typeof setInterval>;
    (async () => {
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
        if (video.current) { video.current.srcObject = stream; await video.current.play(); }
        timer = setInterval(async () => {
          if (!video.current) return;
          const det = await faceapi.detectSingleFace(video.current, new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.6 }));
          setFace(!!det);
        }, 700);
      } catch { setMsg("Camera unavailable — allow camera permission."); }
      try { setDist(Math.round(distanceM(await currentPosition(), OFFICE))); }
      catch { setMsg("Location unavailable — allow location permission."); }
    })();
    return () => { clearInterval(timer); stream?.getTracks().forEach((t) => t.stop()); };
  }, []);

  async function act() {
    setBusy(true); setMsg("");
    const pos = await currentPosition();
    const d = distanceM(pos, OFFICE);
    if (d > OFFICE.radius) { setBusy(false); return setMsg(`You are ${Math.round(d)} m from the office.`); }
    const res = today
      ? await supabase.from("attendance").update({ check_out_at: new Date().toISOString() }).eq("id", today.id)
      : await supabase.from("attendance").insert({
          user_id: userId, face_verification_status: "verified", verified_at: new Date().toISOString(),
          location_coords: `(${pos.lat},${pos.lng})`,
        }); // status 'present'/'late' + warning are set by DB triggers
    setBusy(false);
    if (res.error) return setMsg(res.error.message);
    onDone();
  }

  const done = today?.check_out_at;
  return (
    <div className="card space-y-4">
      <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-primary">
        <video ref={video} playsInline muted className="h-full w-full object-cover -scale-x-100" />
        <div className={`absolute inset-[18%] rounded-[50%] border-4 ${face ? "border-success" : "border-white/50"}`} />
      </div>
      <ul className="text-sm space-y-1">
        <li className={inside ? "text-success" : "text-warning"}>● {dist === null ? "Checking location…" : inside ? `Inside office (${dist} m)` : `Outside office (${dist} m)`}</li>
        <li className={face ? "text-success" : "text-warning"}>● {face ? "Face detected" : "Look at the camera"}</li>
      </ul>
      {msg && <p className="text-sm text-danger">{msg}</p>}
      <button className="btn-primary w-full" disabled={!face || !inside || busy || !!done} onClick={act}>
        {done ? "Shift complete" : today ? "Check out" : "Check in"}
      </button>
    </div>
  );
}
