
"use client";

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function PlayersLandingPage() {
  // Mock list of sports - in a real app, this might come from an API or config
  const sports = [
    { name: 'Basketball', examplePlayer: 'Luka Doncic', examplePlayerSlug: 'Luka_Doncic', dataAiHint: 'basketball court' },
    { name: 'Baseball', examplePlayer: 'Shohei Ohtani', examplePlayerSlug: 'Shohei_Ohtani', dataAiHint: 'baseball field' },
    { name: 'Football', examplePlayer: 'Patrick Mahomes', examplePlayerSlug: 'Patrick_Mahomes', dataAiHint: 'football stadium' },
    { name: 'Hockey', examplePlayer: 'Connor McDavid', examplePlayerSlug: 'Connor_McDavid', dataAiHint: 'ice rink' },
  ];

  return (
    <div className="container mx-auto py-8 px-4">
      <header className="mb-8">
        <h1 className="text-4xl font-bold font-headline text-primary">Discover Players</h1>
        <p className="text-lg text-muted-foreground mt-2">
          Explore player profiles, stats, and discussions across various sports.
        </p>
      </header>

      <section>
        <h2 className="text-2xl font-semibold font-headline mb-4">Browse by Sport</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sports.map((sport) => (
            <Card key={sport.name} className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <CardTitle className="font-headline text-xl">{sport.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <img 
                  src={`https://placehold.co/400x200.png?text=${sport.name}`} 
                  alt={`${sport.name} placeholder image`} 
                  className="w-full h-32 object-cover rounded-md mb-4"
                  data-ai-hint={sport.dataAiHint}
                />
                <p className="text-sm text-muted-foreground mb-4">
                  Find player pages, news, and discussions for {sport.name}.
                </p>
                <Button asChild className="w-full font-headline">
                  <Link href={`/players/${sport.name}/${sport.examplePlayerSlug}`}>
                    View {sport.examplePlayer} (Example)
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold font-headline mb-4">More Coming Soon</h2>
        <p className="text-muted-foreground">
          We&apos;re constantly working to bring you more ways to discover and engage with player content, including advanced search, trending players, and more.
        </p>
      </section>
    </div>
  );
}
