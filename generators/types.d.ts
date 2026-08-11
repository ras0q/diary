export type Post = {
  title: string;
  url: string;
  redirectURL?: string;
  tags: string[];
  date: Date;
  content?: string;
  thumbnail?: string;
  unlisted?: boolean;
};
