import {
  ImageResponse,
} from "next/og";

export const size = {
  width:
    180,

  height:
    180,
};

export const contentType =
  "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width:
            "100%",

          height:
            "100%",

          display:
            "flex",

          alignItems:
            "center",

          justifyContent:
            "center",

          background:
            "#09090b",
        }}
      >
        <div
          style={{
            width:
              "124px",

            height:
              "124px",

            display:
              "flex",

            alignItems:
              "center",

            justifyContent:
              "center",

            borderRadius:
              "32px",

            background:
              "linear-gradient(135deg, #d946ef, #a21caf)",

            color:
              "#ffffff",

            fontSize:
              "48px",

            fontWeight:
              800,

            letterSpacing:
              "-4px",
          }}
        >
          MT
        </div>
      </div>
    ),

    {
      ...size,
    }
  );
}