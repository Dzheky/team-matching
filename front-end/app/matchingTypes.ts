export interface Member {
  id?: number | string;
  name: string;
  role: string;
  criteria: { [key: string]: number };
  skills: string[];
  team_id?: string;
}

export interface RequiredMember
  extends Omit<Member, "team_id" | "skills" | "name"> {
  count: number;
  required_skills: string[];
}

export interface Team {
  id?: number | string;
  name: string;
  description: string;
  required_members: RequiredMember[];
  time_frame?: {
    start: string;
    end: string;
  };
  members: Member[];
}

export interface MatchingResult {
  teams: {
    [teamID: string]: {
      [role: string]: Member[];
    };
  };
}
