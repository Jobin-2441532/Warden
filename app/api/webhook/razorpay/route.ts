import { createClient } from "@/lib/supabase/server";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature");
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!signature || !secret) {
      return new Response("Missing signature or secret", { status: 400 });
    }

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");

    if (expectedSignature !== signature) {
      return new Response("Invalid signature", { status: 401 });
    }

    const event = JSON.parse(rawBody);

    // Depending on the event, we can update the transaction record.
    // In our gate logic, we save the transaction on initial check. 
    // Razorpay webhook is the source of truth for payment success/failure.
    
    if (event.event === "payment.failed") {
      const orderId = event.payload.payment.entity.order_id;
      // Ideally we would map orderId to our transactionId. 
      // For now, this is standard implementation scaffold.
    }

    return new Response("Webhook received", { status: 200 });
  } catch (err: any) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }
}
