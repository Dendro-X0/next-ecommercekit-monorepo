import type * as React from "react"

/**
 * Order shipped transactional email template.
 */
interface OrderShippedEmailProps {
  readonly orderId: string
}

export const OrderShippedEmail: React.FC<Readonly<OrderShippedEmailProps>> = ({ orderId }) => (
  <div>
    <h1>Your order is on the way</h1>
    <p>
      Good news! Your order <strong>{orderId}</strong> has shipped.
    </p>
  </div>
)
