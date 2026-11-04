import { NextRequest, NextResponse } from 'next/server';
import { contactMessagesCollection } from '@/lib/db';
import { rateLimit, clientIp } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  const limit = await rateLimit('contact', clientIp(req.headers), 5, 60 * 60);
  if (!limit.allowed) {
    return NextResponse.json({ error: 'Too many messages. Please try again later.' }, { status: 429 });
  }

  try {
    const formData = await req.formData();
    const name = String(formData.get('name') || '').trim();
    const email = String(formData.get('email') || '').trim();
    const subject = String(formData.get('subject') || '').trim();
    const message = String(formData.get('message') || '').trim();

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const messages = await contactMessagesCollection();
    await messages.insertOne({
      name,
      email,
      subject: subject || '(no subject)',
      message,
      read: false,
      createdAt: new Date(),
    });

    return NextResponse.redirect(new URL('/thank-you', req.url), {
      status: 303,
    });
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json({ error: 'Failed to submit form' }, { status: 500 });
  }
}
