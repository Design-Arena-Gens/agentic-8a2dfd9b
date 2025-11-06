import { NextResponse } from 'next/server';
import { generateResponse } from '@/lib/responder';
import type { ResponsePayload } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<ResponsePayload> | undefined;

    if (!body || !body.messages || !body.settings) {
      return NextResponse.json(
        { error: 'Invalid payload' },
        { status: 400 }
      );
    }

    const reply = generateResponse({
      messages: body.messages,
      settings: body.settings
    });

    return NextResponse.json({ message: reply });
  } catch (error) {
    console.error('Respond API error', error);
    return NextResponse.json(
      { error: 'Something went wrong while composing a response.' },
      { status: 500 }
    );
  }
}
