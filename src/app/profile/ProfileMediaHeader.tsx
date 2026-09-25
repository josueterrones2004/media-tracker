import { ReactNode } from "react";

interface ProfileMediaHeaderProps {
  banner: ReactNode;
  avatar: ReactNode;

  bannerControls?: ReactNode;
  avatarControls?: ReactNode;

  children?: ReactNode;
}

export default function ProfileMediaHeader({
  banner,
  avatar,
  bannerControls,
  avatarControls,
  children,
}: ProfileMediaHeaderProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/60">
      <div className="grid">
        {/* BANNER */}
        <div className="relative col-start-1 row-start-1 aspect-[3/1] w-full overflow-hidden bg-gradient-to-br from-zinc-800 via-zinc-900 to-fuchsia-950/40">
          {banner}

          {bannerControls && (
            <div className="absolute bottom-[4%] right-[3%] z-20">
              {bannerControls}
            </div>
          )}
        </div>

        {/* AVATAR SOBRE EL BORDE DEL BANNER */}
        <div className="pointer-events-none relative z-30 col-start-1 row-start-1 flex self-end translate-y-1/2 px-[4%]">
          <div
            className="pointer-events-auto relative aspect-square shrink-0 overflow-hidden rounded-full border-zinc-950 bg-zinc-800 shadow-xl"
            style={{
              width: "clamp(48px, 20%, 128px)",
              borderWidth: "clamp(2px, 0.65vw, 4px)",
            }}
          >
            {avatar}

            {avatarControls}
          </div>
        </div>

        {/* CONTENIDO INFERIOR */}
        <div
          className="col-start-1 row-start-2 px-[4%] pb-[clamp(18px,4%,28px)]"
          style={{
            paddingTop:
              "clamp(40px, calc(10% + 16px), 80px)",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}