import mongoose, { Schema, Document, model } from 'mongoose';

export interface ILeague extends Document {
  name: string;
  platform: string;
  members: number;
  commissioner: string;
  teams: number;
  nextDraft: string;
  logo: string;
  sport: string;
  status: string;
}

const LeagueSchema: Schema = new Schema({
  name: { type: String, required: true },
  platform: { type: String, required: true },
  members: { type: Number, required: true },
  commissioner: { type: String, required: true },
  teams: { type: Number, required: true },
  nextDraft: { type: String, required: true },
  logo: { type: String, required: true },
  sport: { type: String, required: true },
  status: { type: String, required: true },
});

export default mongoose.models.League || model<ILeague>('League', LeagueSchema); 