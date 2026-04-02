export type Friend = {
  id: string;
  name: string;
  avatar?: string;
  rating?: number;
  status?: "online" | "playing" | "offline";
};