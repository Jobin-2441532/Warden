// @ts-nocheck
import { anthropic } from '@ai-sdk/anthropic';
import { streamText, tool } from 'ai';
import { z } from 'zod';
import { evaluateTransaction, failTransaction } from '@/lib/gate';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import Razorpay from 'razorpay';

export const maxDuration = 30;

const rateLimitMap = new Map<string, { count: number, timestamp: number }>();

const chatBodySchema = z.object({
  messages: z.array(z.any()),
  data: z.object({
    merchantId: z.string(),
    sessionId: z.string().nullable().optional()
  }).optional()
});

export async function POST(req: Request) {
  // Simple IP-based Rate Limiting (in-memory for prototype)
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  const now = Date.now();
  const windowMs = 60000; // 1 minute
  const limit = 15; // 15 requests per minute

  const record = rateLimitMap.get(ip) || { count: 0, timestamp: now };
  if (now - record.timestamp > windowMs) {
    record.count = 1;
    record.timestamp = now;
  } else {
    record.count += 1;
  }
  rateLimitMap.set(ip, record);

  if (record.count > limit) {
    return new Response('Rate limit exceeded', { status: 429 });
  }

  let body;
  try {
    body = chatBodySchema.parse(await req.json());
  } catch (e) {
    return new Response('Invalid request payload', { status: 400 });
  }

  const { messages, data } = body;
  const merchantId = data?.merchantId;

  if (!merchantId) {
    return new Response('Missing merchantId', { status: 400 });
  }

  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!, 
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // 1. Fetch catalog
  const { data: catalog } = await supabase
    .from('catalogs')
    .select('structured_json')
    .eq('merchant_id', merchantId)
    .single();

  const products = catalog?.structured_json || [];

  // 2. System prompt
  const systemPrompt = `You are a helpful AI shopping assistant representing a store. 
Here is the structured catalog of products available: 
${JSON.stringify(products.map((p:any) => ({ id: p.id, name: p.name, price: p.price_inr, desc: p.description, category: p.category, stock: p.stock_quantity })), null, 2)}

Your goal is to understand what the user wants, recommend 1-3 relevant products, and ask clarifying questions if needed.
When the user confirms they want to purchase a specific product, call the 'purchase' tool. Do NOT say you purchased it until the tool returns a success response.
If the tool returns a 'denied' or 'failed' status, apologize, explain the plain-English reason provided by the tool, and suggest an alternative (e.g., a cheaper item if they hit a limit).
`;

  const result = streamText({
    model: anthropic('claude-3-haiku-20240307'),
    system: systemPrompt,
    messages,
    tools: {
      purchase: tool({
        description: 'Initiate a purchase for a selected product.',
        parameters: z.object({
          productId: z.string().describe('The ID of the product to purchase'),
          amount: z.number().describe('The price in INR of the product'),
          category: z.string().describe('The category of the product'),
        }),
        execute: async ({ productId, amount, category }: { productId: string, amount: number, category: string }) => {
          // Fetch an active mandate for this merchant (for prototype, pick first active)
          const { data: mandate } = await supabase
            .from('mandates')
            .select('id')
            .eq('merchant_id', merchantId)
            .eq('is_active', true)
            .limit(1)
            .single();

          if (!mandate) {
            return { status: 'denied', reason: 'Denied: Store is not accepting AI purchases right now (no active mandate).' };
          }

          const sessionId = data?.sessionId;

          const gateResult = await evaluateTransaction(supabase, merchantId, mandate.id, amount, category, sessionId);

          if (gateResult.decision === 'denied') {
            return { status: 'denied', reason: gateResult.reason };
          }

          // Try Razorpay Order Creation
          try {
            if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
              // Mock success if no keys
              return { 
                status: 'approved', 
                reason: gateResult.reason, 
                orderId: 'order_mock_' + Math.random().toString(36).substring(7),
                amount
              };
            }

            const razorpay = new Razorpay({
              key_id: process.env.RAZORPAY_KEY_ID,
              key_secret: process.env.RAZORPAY_KEY_SECRET,
            });

            const order = await razorpay.orders.create({
              amount: amount * 100, // in paise
              currency: 'INR',
              receipt: `rcpt_${gateResult.transactionId}`,
            });

            return { 
              status: 'approved', 
              reason: gateResult.reason, 
              orderId: order.id,
              amount 
            };
          } catch (e: any) {
            if (gateResult.transactionId) {
              await failTransaction(supabase, gateResult.transactionId, e.message);
            }
            return { status: 'failed', reason: 'Payment failed after approval — no charge occurred, agent notified.' };
          }
        },
      }),
    },
  });

  return result.toDataStreamResponse();
}
