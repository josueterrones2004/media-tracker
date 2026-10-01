"use client";

export type MediaStatusOption = {
  value: string;
  label: string;
  destructive?: boolean;
};

interface MediaActionBarProps {
  primaryLabel: string;

  onPrimaryAction:
    () => void | Promise<void>;

  primaryDisabled?: boolean;

  statusOptions?: MediaStatusOption[];

  activeStatus?:
    string | null;

  onStatusChange?: (
    status: string | null
  ) =>
    void | Promise<void>;

  statusDisabled?: boolean;

  message?: string;
}

export default function MediaActionBar({
  primaryLabel,
  onPrimaryAction,
  primaryDisabled = false,
  statusOptions = [],
  activeStatus = null,
  onStatusChange,
  statusDisabled = false,
  message,
}: MediaActionBarProps) {
  return (
    <section>
      <div className="flex flex-col items-start gap-3 xl:flex-row xl:items-center">
        <button
          type="button"
          onClick={() => {
            void onPrimaryAction();
          }}
          disabled={primaryDisabled}
          className="h-11 rounded-xl bg-fuchsia-500 px-5 text-sm font-medium text-white transition hover:bg-fuchsia-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {primaryLabel}
        </button>

        {statusOptions.length > 0 &&
          onStatusChange && (
            <div className="flex max-w-full overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/70 p-1">
              {statusOptions.map(
                (option) => {
                  const active =
                    activeStatus ===
                    option.value;

                  const activeClass =
                    option.destructive
                      ? "bg-red-500/10 text-red-400 shadow-sm"
                      : "bg-fuchsia-500/15 text-fuchsia-300 shadow-sm";

                  return (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={active}
                      disabled={statusDisabled}
                      onClick={() => {
                        void onStatusChange(
                          active
                            ? null
                            : option.value
                        );
                      }}
                      className={`whitespace-nowrap rounded-lg px-3.5 py-2 text-sm transition ${
                        active
                          ? activeClass
                          : "text-zinc-500 hover:bg-zinc-800/70 hover:text-zinc-300"
                      } disabled:cursor-not-allowed disabled:opacity-50`}
                    >
                      {option.label}
                    </button>
                  );
                }
              )}
            </div>
          )}
      </div>

      {message && (
        <p className="mt-3 text-sm text-zinc-500">
          {message}
        </p>
      )}
    </section>
  );
}