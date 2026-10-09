import { useState } from "react";
import { downloadBlob } from "../../services/download";
import * as Dialog from "@radix-ui/react-dialog";
import { useQuery } from "@tanstack/react-query";
import { X, RefreshCw, ShieldCheck } from "lucide-react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { button, Loading, Notice } from "../admin/ConsoleUI";
export default function StudentPass({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<unknown>(null);
  const query = useQuery({
    queryKey: ["event-pass", user?.id],
    enabled: open,
    staleTime: 0,
    queryFn: async ({ signal }) =>
      (
        await api.get<{ image: string; student: { full_name: string; student_id: string; house_name: string } }>(
          "/portal/event-pass/",
          { signal },
        )
      ).data,
  });
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(value) => {
        if (!value) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[80] bg-black/80 backdrop-blur" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[81] max-h-[95dvh] w-[calc(100%-24px)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl border border-white/15 bg-neutral-900 p-6 text-neutral-200 shadow-2xl">
          <div className="flex items-center justify-between">
            <Dialog.Title className="text-lg font-semibold text-white">
              My event pass
            </Dialog.Title>
            <Dialog.Close className={button} aria-label="Close event pass">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>
          <Dialog.Description className="mt-2 text-sm text-neutral-400">
            Download this pass before going offline. Staff verify your identity and event eligibility at check-in.
          </Dialog.Description>
          <div className="mt-6 border-t border-white/10 pt-5">
            <p className="text-lg font-semibold text-white">
              {user?.full_name}
            </p>
            <p className="mt-1 font-mono text-sm text-neutral-400">
              {user?.student_id}
            </p>
            {query.isPending ? (
              <Loading />
            ) : query.isError ? (
              <Notice error={query.error} retry={() => void query.refetch()} />
            ) : (
              <>
                <div className="mx-auto my-6 w-full max-w-68 rounded-2xl bg-white p-2">
                  <img
                    src={query.data.image}
                    alt="Your scannable student event pass"
                    className="aspect-square h-auto w-full"
                  />
                </div>
                <p className="text-center text-xs text-neutral-500">
                  Save your card to your phone for use without signing in. Staff scanning requires internet.
                </p>
              </>
            )}
            {query.data && <><p className="text-center text-sm text-neutral-300">{query.data.student.house_name}</p><button className={`${button} mt-5 w-full`} disabled={downloading} onClick={async () => {
              setDownloading(true); setDownloadError(null);
              try {
                const image = new Image(); image.src = query.data.image; await image.decode();
                const canvas = document.createElement("canvas"); canvas.width = 900; canvas.height = 1200;
                const ctx = canvas.getContext("2d"); if (!ctx) throw new Error("Unable to create QR card.");
                ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, 900, 1200); ctx.fillStyle = "#171717"; ctx.textAlign = "center";
                ctx.font = "bold 40px sans-serif"; ctx.fillText("ACLCxp · Student pass", 450, 70, 800);
                ctx.drawImage(image, 100, 110, 700, 700);
                ctx.font = "bold 36px sans-serif"; ctx.fillText(query.data.student.full_name || "Name unavailable", 450, 880, 800);
                ctx.font = "32px sans-serif"; ctx.fillText(query.data.student.student_id, 450, 940, 800); ctx.fillText(query.data.student.house_name, 450, 1000, 800);
                ctx.font = "24px sans-serif"; ctx.fillText("Staff: compare with the student and their school ID.", 450, 1090, 800); ctx.fillText("Keep private. Staff scanning requires internet.", 450, 1135, 800);
                const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error("Unable to save QR card.")), "image/png"));
                downloadBlob(blob, "ACLCxp-student-pass.png");
              } catch (error) { setDownloadError(error); } finally { setDownloading(false); }
            }}>{downloading ? "Preparing card…" : "Download QR card (PNG)"}</button></>}
            {downloadError != null && <Notice error={downloadError} />}
            <button
              className={`${button} mt-5 w-full`}
              disabled={query.isFetching}
              onClick={() => void query.refetch()}
            >
              <RefreshCw className="h-4 w-4" />
              Refresh pass
            </button>
            <p className="mt-4 flex items-center justify-center gap-2 text-xs text-neutral-500">
              <ShieldCheck className="h-4 w-4 text-amber-400" />
              Keep your pass private.
            </p>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
