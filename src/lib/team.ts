export type TeamMember = {
  name: string;
  handle: string;
  role: string;
  about: string;
  image?: string;
};

export const TEAM_MEMBERS: TeamMember[] = [
  {
    name: 'Zehra',
    handle: '@zehra',
    role: 'Kayıt onayı',
    about: 'Öğrenci kimliğini kontrol eder ve kaydı açar. Onaydan önce kartın yanında olsun.',
  },
  {
    name: 'Léna',
    handle: '@lena',
    role: 'Şifre sıfırlama',
    about: 'Kod veya QR verir. Yeni şifreyi ancak kod doğrulandıktan sonra oluşturursun.',
  },
  {
    name: 'Tolga',
    handle: '@tolga',
    role: 'Etkinlik günü',
    about: 'Etkinlik gününde yoklamaya bakar. Ulaşılamazsan ekip güvenlik veya duyuru için yazar.',
  },
  {
    name: 'Ceren',
    handle: '@ceren',
    role: 'Başvurular',
    about: 'Açık ekip ilanına gelen başvuruları okur. Aynı ilana bir kez başvurabilirsin.',
  },
];

export function memberInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toLocaleUpperCase('tr') ?? '')
    .join('');
}
