import { useEffect, useRef, useState } from "react";
import QrScanner from "qr-scanner";
import { X } from "lucide-react";

type QrScannerProps = {
  onScan: (result: string) => void;
  onClose: () => void;
};

export function QrScannerComponent({ onScan, onClose }: QrScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scanner, setScanner] = useState<QrScanner | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!videoRef.current) return;

    const qrScanner = new QrScanner(
      videoRef.current,
      (result) => {
        onScan(result.data);
        qrScanner.stop();
      },
      {
        returnDetailedScanResult: true,
        highlightScanRegion: true,
        highlightCodeOutline: true,
      }
    );

    setScanner(qrScanner);

    qrScanner
      .start()
      .catch((err) => {
        console.error("QR Scanner error:", err);
        setError("Camera access denied or not available");
      });

    return () => {
      qrScanner.stop();
      qrScanner.destroy();
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="relative max-w-md w-full bg-surface rounded-xl overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-line">
          <h2 className="font-display text-xl text-navy">Scan QR Code</h2>
          <button
            type="button"
            onClick={onClose}
            className="size-8 grid place-items-center rounded-md hover:bg-surface-2"
          >
            <X className="size-5" />
          </button>
        </div>
        
        <div className="relative aspect-square bg-black">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
          />
          {error ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-white p-4 text-center text-sm">
              {error}
            </div>
          ) : null}
        </div>
        
        <div className="p-4 text-center text-sm text-muted">
          Position the QR code within the camera view
        </div>
      </div>
    </div>
  );
}
