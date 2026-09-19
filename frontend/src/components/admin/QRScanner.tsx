import { useEffect, useId, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Notice } from "./ConsoleUI";
export default function QRScanner({
  onScan,
}: {
  onScan: (token: string) => void;
}) {
  const id = `scanner-${useId().replaceAll(":", "")}`;
  const [error, setError] = useState<unknown>(null);
  useEffect(() => {
    const scanner = new Html5Qrcode(id);
    let disposed = false;
    let scanned = false;
    const started = scanner
      .start(
        { facingMode: "environment" },
        { fps: 8, qrbox: { width: 240, height: 240 } },
        (value) => {
          if (!scanned && !disposed) {
            scanned = true;
            onScan(value);
          }
        },
        () => {},
      )
      .catch((err: unknown) => {
        if (!disposed)
          setError(
            err instanceof Error
              ? err
              : new Error(
                  "Camera unavailable. Allow camera access on HTTPS, or use manual check-in.",
                ),
          );
      });
    return () => {
      disposed = true;
      void started
        .then(async () => {
          if (scanner.isScanning) await scanner.stop();
          scanner.clear();
        })
        .catch(() => {});
    };
  }, [id, onScan]);
  return (
    <div className="space-y-3">
      <div id={id} className="overflow-hidden rounded-xl bg-black" />
      {error != null && <Notice error={error} />}
      <p className="text-xs text-neutral-500">
        Point the camera at the student's open event pass. Camera access
        requires HTTPS or localhost.
      </p>
    </div>
  );
}
