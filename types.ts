
export enum ImageStyle {
  RUSTIC_DARK = 'Rustic/Dark',
  BRIGHT_MODERN = 'Bright/Modern',
  SOCIAL_MEDIA = 'Social Media',
}

export interface Dish {
  id: string;
  name: string;
  imageUrl: string | null;
  imageMimeType: string | null;
}
