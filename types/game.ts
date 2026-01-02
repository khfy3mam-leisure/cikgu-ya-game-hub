export type GameStatus = 'waiting' | 'role_assignment' | 'word_distribution' | 'discussion' | 'voting' | 'round_end' | 'game_end';
export type RoundStatus = 'setup' | 'discussion' | 'voting' | 'completed';
export type RoundWinner = 'non_imposters' | 'imposter';
export type ClueEnteredBy = 'player' | 'game_master';

export interface User {
  id: string;
  username: string;
  profile_picture_url: string | null;
  created_at: string;
}

export interface Game {
  id: string;
  game_master_id: string;
  invite_code: string;
  total_rounds: number;
  current_round: number;
  status: GameStatus;
  created_at: string;
  updated_at: string;
}

export interface GamePlayer {
  id: string;
  game_id: string;
  user_id: string;
  total_points: number;
  joined_at: string;
  user?: User;
}

export interface Round {
  id: string;
  game_id: string;
  round_number: number;
  secret_word: string;
  bonus_hint: string;
  imposter_id: string; // Keep for backward compatibility
  imposter_ids?: string[]; // Array of imposter IDs
  spotlight_player_id: string | null;
  status: RoundStatus;
  winner: RoundWinner | null;
  created_at: string;
}

export interface Vote {
  id: string;
  round_id: string;
  voter_id: string;
  voted_for_id: string | null;
  created_at: string;
}

export interface ImposterGuess {
  id: string;
  round_id: string;
  imposter_id: string;
  guessed_word: string;
  is_correct: boolean;
  created_at: string;
}

export interface PlayerClue {
  id: string;
  round_id: string;
  player_id: string;
  clue_word: string | null;
  entered_by: ClueEnteredBy;
  created_at: string;
  updated_at: string;
}

