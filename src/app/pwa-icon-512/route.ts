import {
  ImageResponse,
} from "next/og";

import {
  createElement,
} from "react";

export const dynamic =
  "force-static";

export function GET() {
  return new ImageResponse(
    createElement(
      "div",
      {
        style: {
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
        },
      },

      createElement(
        "div",
        {
          style: {
            width:
              "352px",

            height:
              "352px",

            display:
              "flex",

            alignItems:
              "center",

            justifyContent:
              "center",

            borderRadius:
              "92px",

            background:
              "linear-gradient(135deg, #d946ef, #a21caf)",

            color:
              "#ffffff",

            fontSize:
              "140px",

            fontWeight:
              800,

            letterSpacing:
              "-10px",
          },
        },

        "MT"
      )
    ),

    {
      width:
        512,

      height:
        512,
    }
  );
}