import type * as React from "react"

interface OrderShippedEmailProps {
  readonly orderId: string
}

export default function OrderShippedEmail({
  orderId,
}: Readonly<OrderShippedEmailProps>): React.ReactElement {
  return (
    <div>
      <h1>Your order is on the way</h1>
      <p>
        Good news! Your order <strong>{orderId}</strong> has shipped.
      </p>
    </div>
  )
}
