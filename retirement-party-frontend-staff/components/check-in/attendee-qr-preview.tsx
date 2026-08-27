interface AttendeeQrPreviewProps {
  qrCodeDataUrl: string;
}

export function AttendeeQrPreview({ qrCodeDataUrl }: AttendeeQrPreviewProps) {
  return (
    <div className="mt-4 flex items-center gap-4 rounded-lg border border-border/60 p-3 bg-muted/10">
      <img
        src={qrCodeDataUrl}
        alt="Attendee QR Code"
        className="h-16 w-16 rounded border bg-white p-1 object-contain"
      />
      <div>
        <div className="text-sm font-bold text-muted-foreground">
          Digital Entry Pass Attached
        </div>
        <div className="text-xs font-semibold text-foreground">
          QR pass generated and registered in system
        </div>
      </div>
    </div>
  );
}
