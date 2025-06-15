import dbConnect from './dbConnect';
import League from '@/models/League.model';
import { leagues } from './mock-leagues';

async function seedLeagues() {
  await dbConnect();
  await League.deleteMany({});
  await League.insertMany(leagues);
  console.log('Leagues seeded!');
  process.exit(0);
}

seedLeagues().catch((err) => {
  console.error(err);
  process.exit(1);
}); 