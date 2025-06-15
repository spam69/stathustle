import dbConnect from './dbConnect';
import PlayerModel from '@/models/Player.model';

const initialPlayers = [
  {
    name: 'Luka Doncic',
    sport: 'Basketball',
    profilePictureUrl: 'https://placehold.co/200x200.png',
    team: 'Dallas Mavericks',
    position: 'Guard',
  },
  {
    name: 'Shohei Ohtani',
    sport: 'Baseball',
    profilePictureUrl: 'https://placehold.co/200x200.png',
    team: 'Los Angeles Dodgers',
    position: 'Pitcher/Designated Hitter',
  },
  {
    name: 'Patrick Mahomes',
    sport: 'Football',
    profilePictureUrl: 'https://placehold.co/200x200.png',
    team: 'Kansas City Chiefs',
    position: 'Quarterback',
  },
  {
    name: 'Connor McDavid',
    sport: 'Hockey',
    profilePictureUrl: 'https://placehold.co/200x200.png',
    team: 'Edmonton Oilers',
    position: 'Center',
  },
];

async function seedPlayers() {
  try {
    await dbConnect();
    await PlayerModel.deleteMany({});
    await PlayerModel.insertMany(initialPlayers);
    console.log('Players seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding players:', error);
    process.exit(1);
  }
}

seedPlayers(); 