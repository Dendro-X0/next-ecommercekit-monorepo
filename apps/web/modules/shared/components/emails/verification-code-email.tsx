import type * as React from "react"

interface VerificationCodeEmailProps {
  validationCode: string
}

export const VerificationCodeEmail: React.FC<Readonly<VerificationCodeEmailProps>> = ({
  validationCode,
}) => (
  <div>
    <h1>Verify your email address</h1>
    <p>
      Your verification link is below. Please note that for security reasons, Better Auth uses a
      verification URL instead of a code.
    </p>
    <p>
      <a href={validationCode}>Click here to verify</a>
    </p>
  </div>
)
