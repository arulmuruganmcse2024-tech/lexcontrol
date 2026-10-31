import React from "react"

export const metadata = {
  title: "LexControl | NY UCC Article 12 CER Control, Safe-Harbor & Practice Trading Desk",
  description:
    "Autonomous NY UCC Article 12 Controllable Electronic Record Perfection-by-Control, 11 U.S.C. §§ 555/559/560 Safe-Harbor, and FRE 902(13)/(14) Evidentiary Desk powered by Chainlink CRE and RYO-CHAN MCP.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          backgroundColor: "#0B0F17",
          color: "#F1F5F9",
          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        }}
      >
        {children}
      </body>
    </html>
  )
}

