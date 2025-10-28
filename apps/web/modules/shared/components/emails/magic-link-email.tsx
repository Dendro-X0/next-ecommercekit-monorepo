import type * as React from "react"

interface MagicLinkEmailProps {
  url: string
}

export const MagicLinkEmail: React.FC<Readonly<MagicLinkEmailProps>> = ({ url }) => (
  <div>
    <h1>Log in to your account</h1>
    <p>
      <a href={url}>Click here to log in</a>
    </p>
  </div>
)
