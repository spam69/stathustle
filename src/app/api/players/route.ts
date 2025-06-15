import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import PlayerModel from '@/models/Player.model';

export async function GET() {
  try {
    await dbConnect();
    const players = await PlayerModel.find().sort({ name: 1 }).lean();
    return NextResponse.json(players);
  } catch (error) {
    console.error('Get Players API error:', error);
    return NextResponse.json({ message: 'An unexpected error occurred' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const playerData = await request.json();
    
    const newPlayer = await PlayerModel.create(playerData);
    return NextResponse.json(newPlayer, { status: 201 });
  } catch (error) {
    console.error('Create Player API error:', error);
    return NextResponse.json({ message: 'An unexpected error occurred' }, { status: 500 });
  }
} 