import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import ChatMessage from '@/models/ChatMessage';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

async function getAuthUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return null;
  return verifyToken(token) as any;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  await dbConnect();

  const messages = await ChatMessage.find({ meetingId: id })
    .sort({ timestamp: 1 })
    .limit(200);

  return NextResponse.json({ success: true, messages });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { message, senderName } = await req.json();

  await dbConnect();

  const chatMessage = await ChatMessage.create({
    meetingId: id,
    senderId: user.id,
    senderName,
    message,
  });

  return NextResponse.json({ success: true, message: chatMessage }, { status: 201 });
}
