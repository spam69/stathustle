
import { NextResponse } from 'next/server';
import { mockPlayers } from '@/lib/mock-data';

export async function GET(
  request: Request,
  { params }: { params: { sport: string; playerName: string } }
) {
  try {
    const { sport, playerName } = params;
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const foundPlayer = mockPlayers.find(
      p => p.sport.toLowerCase() === sport.toLowerCase() && 
           p.name.toLowerCase().replace(/\s+/g, '_') === playerName.toLowerCase()
    );

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

    