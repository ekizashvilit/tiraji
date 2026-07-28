// Hand-maintained to match supabase/migrations/*.sql.
// Regenerate with the Supabase CLI later: `supabase gen types typescript`.

export type ListingType = "sale" | "swap" | "giveaway";
export type BookCondition = "new" | "like_new" | "good" | "worn";
export type ListingStatus = "active" | "closed" | "hidden";

type Timestamp = string;

export type ProfileRow = {
  id: string;
  display_name: string | null;
  city: string | null;
  phone: string | null;
  show_phone: boolean;
  avatar_path: string | null;
  is_admin: boolean;
  created_at: Timestamp;
}

export type ListingRow = {
  id: string;
  seller_id: string;
  listing_type: ListingType;
  title: string;
  author: string | null;
  description: string | null;
  condition: BookCondition | null;
  price: number | null;
  is_negotiable: boolean;
  swap_wanted: string | null;
  currency: string;
  city: string | null;
  book_language: string | null;
  genre_id: number | null;
  isbn: string | null;
  cover_image_paths: string[];
  cover_external_url: string | null;
  status: ListingStatus;
  created_at: Timestamp;
  updated_at: Timestamp;
  search_text: string;
}

export type BookAlertRow = {
  id: string;
  user_id: string;
  title: string | null;
  author: string | null;
  isbn: string | null;
  active: boolean;
  created_at: Timestamp;
}

export type ConversationRow = {
  id: string;
  listing_id: string | null;
  buyer_id: string;
  seller_id: string;
  created_at: Timestamp;
}

export type MessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  read_at: Timestamp | null;
  created_at: Timestamp;
}

export type NotificationRow = {
  id: string;
  user_id: string;
  type: string;
  payload: Record<string, unknown>;
  read_at: Timestamp | null;
  created_at: Timestamp;
}

export type FavoriteRow = {
  id: string;
  user_id: string;
  listing_id: string;
  created_at: Timestamp;
}

export type ReportRow = {
  id: string;
  reporter_id: string | null;
  listing_id: string;
  reason: string | null;
  created_at: Timestamp;
}

export type GenreRow = {
  id: number;
  slug: string;
  name_ka: string;
  name_en: string;
}

export type PublicSellerRow = {
  id: string;
  display_name: string | null;
  city: string | null;
  avatar_path: string | null;
  show_phone: boolean;
  phone: string | null;
  created_at: Timestamp;
}

type Table<Row, Insert = Partial<Row>, Update = Partial<Row>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      profiles: Table<
        ProfileRow,
        Pick<ProfileRow, "id"> & Partial<ProfileRow>
      >;
      listings: Table<
        ListingRow,
        Omit<
          ListingRow,
          | "id"
          | "created_at"
          | "updated_at"
          | "search_text"
          | "currency"
          | "is_negotiable"
          | "status"
          | "cover_image_paths"
        > &
          Partial<
            Pick<
              ListingRow,
              | "currency"
              | "is_negotiable"
              | "status"
              | "cover_image_paths"
            >
          >
      >;
      book_alerts: Table<
        BookAlertRow,
        Omit<BookAlertRow, "id" | "created_at" | "active"> &
          Partial<Pick<BookAlertRow, "active">>
      >;
      conversations: Table<
        ConversationRow,
        Omit<ConversationRow, "id" | "created_at">
      >;
      messages: Table<MessageRow, Omit<MessageRow, "id" | "created_at" | "read_at">>;
      notifications: Table<
        NotificationRow,
        Omit<NotificationRow, "id" | "created_at" | "read_at">
      >;
      favorites: Table<FavoriteRow, Omit<FavoriteRow, "id" | "created_at">>;
      reports: Table<ReportRow, Omit<ReportRow, "id" | "created_at">>;
      genres: Table<GenreRow>;
    };
    Views: {
      public_seller: { Row: PublicSellerRow; Relationships: [] };
    };
    Functions: {
      search_listings: {
        Args: {
          q?: string | null;
          p_type?: ListingType | null;
          p_city?: string | null;
          p_min_price?: number | null;
          p_max_price?: number | null;
          p_condition?: BookCondition | null;
          p_language?: string | null;
          p_genre?: number | null;
          p_sort?: string | null;
          p_limit?: number | null;
          p_offset?: number | null;
        };
        Returns: ListingRow[];
      };
      is_admin: { Args: Record<string, never>; Returns: boolean };
    };
    Enums: {
      listing_type: ListingType;
      book_condition: BookCondition;
      listing_status: ListingStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}
