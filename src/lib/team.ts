export type TeamMember = {
  name: string;
  handle: string;
  role: string;
  about: string;
  image?: string;
};

export const TEAM_MEMBERS: TeamMember[] = [];

export function memberInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toLocaleUpperCase('tr') ?? '')
    .join('');
}
