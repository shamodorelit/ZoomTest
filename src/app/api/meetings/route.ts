import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Meeting from '@/models/Meeting';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

async function getAuthUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return null;
  return verifyToken(token) as any;
}

// Get all meetings
export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  await dbConnect();

  let meetings;
  if (user.role === 'admin') {
    meetings = await Meeting.find().sort({ createdAt: -1 });
  } else {
    meetings = await Meeting.find({ status: 'active' }).sort({ createdAt: -1 });
  }

  return NextResponse.json({ success: true, meetings });
}

// Create a new meeting (admin only)
export async function POST(req: Request) {
  const user = await getAuthUser();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { title, description, meetingId, startTime } = await req.json();

    if (!title || !meetingId || !startTime) {
      return NextResponse.json({ message: 'Please provide all required fields' }, { status: 400 });
    }

    await dbConnect();

    const existingMeeting = await Meeting.findOne({ meetingId: meetingId.toUpperCase() });
    if (existingMeeting) {
      return NextResponse.json({ message: 'Meeting ID already exists' }, { status: 400 });
    }

    const meeting = await Meeting.create({
      title,
      description,
      meetingId,
      startTime: new Date(startTime),
      status: 'scheduled',
      createdBy: user.id,
    });

    return NextResponse.json({ success: true, meeting }, { status: 201 });
  } catch (error) {
    console.error('Create Meeting Error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
