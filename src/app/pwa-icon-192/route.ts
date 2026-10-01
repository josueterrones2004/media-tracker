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
              "132px",

            height:
              "132px",

            display:
              "flex",

            alignItems:
              "center",

            justifyContent:
              "center",

            borderRadius:
              "34px",

            background:
              "linear-gradient(135deg, #d946ef, #a21caf)",

            color:
              "#ffffff",

            fontSize:
              "52px",

            fontWeight:
              800,

            letterSpacing:
              "-4px",
          },
        },

        "MT"
      )
    ),

    {
      width:
        192,

      height:
        192,
    }
  );
}