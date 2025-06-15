import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import League from '@/models/League.model';

export async function GET() {
  await dbConnect();
  const leagues = await League.find({});
  return NextResponse.json(leagues);
}

export async function POST(req: NextRequest) {
  await dbConnect();
  const data = await req.json();
  const league = await League.create(data);
  return NextResponse.json(league, { status: 201 });
} 