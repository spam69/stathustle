import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import PlayerModel from '@/models/Player.model';
import PlayerChatMessageModel from '@/models/PlayerChatMessage.model';
import UserModel from '@/models/User.model';
import IdentityModel from '@/models/Identity.model';

export async function GET(
  request: Request,
  { params }: { params: { sport: string; playerName: string } }
) {
  try {
    await dbConnect();
    const { sport, playerName } = params;

    const player = await PlayerModel.findOne({
      sport: { $regex: new RegExp(`^${sport}$`, 'i') },
      name: { $regex: new RegExp(`^${playerName.replace(/_/g, ' ')}$`, 'i') }
    });

    if (!player) {
      return NextResponse.json({ message: 'Player not found for chat' }, { status: 404 });
    }

    const messages = await PlayerChatMessageModel.find({ player: player._id })
      .populate('player')
      .populate('author')
      .sort({ createdAt: 1 })
      .lean();

    return NextResponse.json(messages);
  } catch (error) {
    console.error(`Get Player Chat API error for ${params.sport}/${params.playerName}:`, error);
    return NextResponse.json({ message: 'An unexpected error occurred' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { sport: string; playerName: string } }
) {
  try {
    await dbConnect();
    const { sport, playerName } = params;
    const { message, authorId } = await request.json();

    if (!message || !authorId) {
      return NextResponse.json({ message: 'Message and authorId are required' }, { status: 400 });
    }

    const player = await PlayerModel.findOne({
      sport: { $regex: new RegExp(`^${sport}$`, 'i') },
      name: { $regex: new RegExp(`^${playerName.replace(/_/g, ' ')}$`, 'i') }
    });

    if (!player) {
      return NextResponse.json({ message: 'Player not found for chat' }, { status: 404 });
    }

    let author = await UserModel.findById(authorId);
    let authorModel: 'User' | 'Identity' = 'User';

    if (!author) {
      author = await IdentityModel.findById(authorId);
      authorModel = 'Identity';
    }

    if (!author) {
      return NextResponse.json({ message: 'Author not found' }, { status: 404 });
    }

    const newChatMessage = await PlayerChatMessageModel.create({
      player: player._id,
      author: author._id,
      authorModel,
      message
    });

    const populatedMessage = await PlayerChatMessageModel.findById(newChatMessage._id)
      .populate('player')
      .populate('author')
      .lean();

    return NextResponse.json(populatedMessage, { status: 201 });
  } catch (error) {
    console.error(`Post Player Chat API error for ${params.sport}/${params.playerName}:`, error);
    return NextResponse.json({ message: 'An unexpected error occurred' }, { status: 500 });
  }
}

    