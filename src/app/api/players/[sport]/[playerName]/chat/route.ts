
import { NextResponse } from 'next/server';
import { mockPlayerChatMessages, mockPlayers, mockUsers, mockIdentities } from '@/lib/mock-data';
import type { PlayerChatMessage, User, Identity } from '@/types';

export async function GET(
  request: Request,
  { params }: { params: { sport: string; playerName: string } }
) {
  try {
    const { sport, playerName } = params;
    await new Promise(resolve => setTimeout(resolve, 100));

    const player = mockPlayers.find(
      p => p.sport.toLowerCase() === sport.toLowerCase() && 
           p.name.toLowerCase().replace(/\s+/g, '_') === playerName.toLowerCase()
    );

    if (!player) {
      return NextResponse.json({ message: 'Player not found for chat' }, { status: 404 });
    }
    
    const messages = mockPlayerChatMessages
      .filter(msg => msg.player.id === player.id)
      .sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      
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
    const { sport, playerName } = params;
    const { message, authorId } = await request.json();

    if (!message || !authorId) {
      return NextResponse.json({ message: 'Message and authorId are required' }, { status: 400 });
    }

    const player = mockPlayers.find(
      p => p.sport.toLowerCase() === sport.toLowerCase() && 
           p.name.toLowerCase().replace(/\s+/g, '_') === playerName.toLowerCase()
    );
    if (!player) {
      return NextResponse.json({ message: 'Player not found for chat' }, { status: 404 });
    }

    let author: User | Identity | undefined = mockUsers.find(u => u.id === authorId);
    if (!author) {
      author = mockIdentities.find(i => i.id === authorId);
    }
    if (!author) {
      return NextResponse.json({ message: 'Author not found' }, { status: 404 });
    }
    
    const newChatMessage: PlayerChatMessage = {
      id: `chatmsg-${Date.now()}-${Math.random().toString(36).substring(2,7)}`,
      player,
      author,
      message,
      createdAt: new Date().toISOString(),
    };

    mockPlayerChatMessages.push(newChatMessage);
    return NextResponse.json(newChatMessage, { status: 201 });

  } catch (error) {
    console.error(`Post Player Chat API error for ${params.sport}/${params.playerName}:`, error);
    return NextResponse.json({ message: 'An unexpected error occurred' }, { status: 500 });
  }
}

    