import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import PlayerModel from '@/models/Player.model';

export async function GET(
  request: Request,
  { params }: { params: { sport: string; playerName: string } }
) {
  try {
    await dbConnect();
    const { sport, playerName } = params;
    
    const foundPlayer = await PlayerModel.findOne({
      sport: { $regex: new RegExp(`^${sport}$`, 'i') },
      name: { $regex: new RegExp(`^${playerName.replace(/_/g, ' ')}$`, 'i') }
    }).lean();

    if (foundPlayer) {
      return NextResponse.json(foundPlayer);
    } else {
      return NextResponse.json({ message: 'Player not found' }, { status: 404 });
    }
  } catch (error) {
    console.error(`Get Player API error for ${params.sport}/${params.playerName}:`, error);
    return NextResponse.json({ message: 'An unexpected error occurred' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { sport: string; playerName: string } }
) {
  try {
    await dbConnect();
    const { sport, playerName } = params;
    const updateData = await request.json();

    const updatedPlayer = await PlayerModel.findOneAndUpdate(
      {
        sport: { $regex: new RegExp(`^${sport}$`, 'i') },
        name: { $regex: new RegExp(`^${playerName.replace(/_/g, ' ')}$`, 'i') }
      },
      updateData,
      { new: true, runValidators: true }
    ).lean();

    if (updatedPlayer) {
      return NextResponse.json(updatedPlayer);
    } else {
      return NextResponse.json({ message: 'Player not found' }, { status: 404 });
    }
  } catch (error) {
    console.error(`Update Player API error for ${params.sport}/${params.playerName}:`, error);
    return NextResponse.json({ message: 'An unexpected error occurred' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { sport: string; playerName: string } }
) {
  try {
    await dbConnect();
    const { sport, playerName } = params;

    const deletedPlayer = await PlayerModel.findOneAndDelete({
      sport: { $regex: new RegExp(`^${sport}$`, 'i') },
      name: { $regex: new RegExp(`^${playerName.replace(/_/g, ' ')}$`, 'i') }
    }).lean();

    if (deletedPlayer) {
      return NextResponse.json({ message: 'Player deleted successfully' });
    } else {
      return NextResponse.json({ message: 'Player not found' }, { status: 404 });
    }
  } catch (error) {
    console.error(`Delete Player API error for ${params.sport}/${params.playerName}:`, error);
    return NextResponse.json({ message: 'An unexpected error occurred' }, { status: 500 });
  }
}

    