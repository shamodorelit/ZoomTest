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

// Update meeting status (admin only)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const { status } = await req.json();

    await dbConnect();
    const meeting = await Meeting.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!meeting) {
      return NextResponse.json({ message: 'Meeting not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, meeting });
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// Delete a meeting (admin only)
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { id } = await params;
    await dbConnect();
    await Meeting.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: 'Meeting deleted' });
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
