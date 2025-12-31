export interface Achievement {
  id: string;
  name: string;
  icon: string;
  description: string;
  unlocked: boolean;
}

export interface PowerUp {
  id: string;
  name: string;
  icon: string;
  count: number;
  available: boolean;
  description: string;
}

export interface Checkpoint {
  position: number;
  icon: string;
  reached: boolean;
  current: boolean;
}

export interface Particle {
  x: number;
  y: number;
  delay: number;
  emoji?: string;
  color?: string;
}

export interface PowerupNotification {
  powerup: PowerUp;
  visible: boolean;
  message: string;
}
