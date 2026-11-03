export interface IStream {
  channel?: string;
  url: string;
  feed?: string;
  quality?: string;
  referrer?: string;
  user_agent?: string;
  status?: string;
  width?: number;
  height?: number;
  bitrate?: number;
  fps?: number;
}

export interface ILogo {
  channel: string;
  url: string;
  feed?: string;
}

export interface IChannel {
  id: string;
  name: string;
  native_name?: string;
  alt_names?: string[];
  network?: string;
  owners?: string[];
  country: string;
  subdivision?: string;
  city?: string;
  broadcast_area?: string[];
  languages?: string[];
  categories: string[];
  is_nsfw: boolean;
  score?: number;
  online?: boolean;
  launched?: string;
  closed?: string;
  replaced_by?: string;
  website?: string;
  logo?: string;
  is_verified?: boolean;
  streams: IStream[];
  updated_at?: Date | string;
}

export interface ICategory {
  id: string;
  name: string;
  count?: number;
}

export interface ICountry {
  name: string;
  code: string;
  languages?: string[];
  flag?: string;
  count?: number;
}

export interface IChannelFilterParams {
  search?: string;
  category?: string;
  country?: string;
  favorites?: string;
  page?: number;
  limit?: number;
}

export interface IChannelListResponse {
  channels: IChannel[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

export interface ITMDBMovie {
  id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  release_date: string;
  vote_average: number;
}

