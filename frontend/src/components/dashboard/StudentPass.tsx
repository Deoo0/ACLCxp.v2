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
  const query = useQuery({
    queryKey: ["event-pass", user?.id],
    enabled: open,
    staleTime: 0,
    refetchInterval: 240000,
    queryFn: async ({ signal }) =>
      (
        await api.get<{ image: string; expires_at: string }>(
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
            Present this pass to the event facilitator. A confirmed registration
            is required.
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
                  Valid until{" "}
                  {new Date(query.data.expires_at).toLocaleTimeString()}.
                  Refreshes automatically.
                </p>
              </>
            )}
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
