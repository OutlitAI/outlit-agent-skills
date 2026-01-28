// webhooks/stripe.ts
import { Request, Response } from 'express'
import Stripe from 'stripe'
import { outlit } from '@/lib/outlit'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function handleStripeWebhook(req: Request, res: Response) {
  const sig = req.headers['stripe-signature'] as string

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return res.status(400).send('Webhook Error')
  }

  try {
    await processStripeEvent(event)
    res.json({ received: true })
  } catch (error) {
    console.error('Error processing webhook:', error)
    res.status(500).send('Internal Server Error')
  }
}

async function processStripeEvent(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription
  const customer = await stripe.customers.retrieve(subscription.customer as string)
  const email = (customer as Stripe.Customer).email

  if (!email) {
    console.warn('No email found for customer:', subscription.customer)
    return
  }

  switch (event.type) {
    case 'customer.subscription.created':
      outlit.customer.trialing({
        email,
        stripeCustomerId: subscription.customer as string,
        properties: {
          plan: subscription.items.data[0]?.price.lookup_key,
          trial_ends: subscription.trial_end
            ? new Date(subscription.trial_end * 1000).toISOString()
            : null
        }
      })
      break

    case 'customer.subscription.updated':
      if (subscription.status === 'active') {
        outlit.customer.paid({
          email,
          stripeCustomerId: subscription.customer as string,
          properties: {
            plan: subscription.items.data[0]?.price.lookup_key,
            mrr: (subscription.items.data[0]?.price.unit_amount ?? 0) / 100
          }
        })
      }
      break

    case 'customer.subscription.deleted':
      outlit.customer.churned({
        email,
        stripeCustomerId: subscription.customer as string,
        properties: {
          reason: subscription.cancellation_details?.reason,
          churned_at: new Date().toISOString()
        }
      })
      break

    case 'invoice.payment_succeeded':
      const invoice = event.data.object as Stripe.Invoice
      const invoiceCustomer = await stripe.customers.retrieve(invoice.customer as string)
      const invoiceEmail = (invoiceCustomer as Stripe.Customer).email

      if (invoiceEmail) {
        outlit.track({
          email: invoiceEmail,
          eventName: 'payment_succeeded',
          properties: {
            amount: invoice.amount_paid / 100,
            currency: invoice.currency,
            invoice_id: invoice.id
          }
        })
      }
      break
  }

  await outlit.flush()
}
