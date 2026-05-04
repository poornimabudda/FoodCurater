export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string;
          bio: string | null;
          city: string | null;
          curator_type: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name: string;
          bio?: string | null;
          city?: string | null;
          curator_type?: string | null;
          avatar_url?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      restaurants: {
        Row: {
          id: string;
          name: string;
          address: string | null;
          city: string | null;
          state: string | null;
          country: string | null;
          cuisine: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          address?: string | null;
          city?: string | null;
          state?: string | null;
          country?: string | null;
          cuisine?: string | null;
          created_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["restaurants"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "restaurants_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      dish_recommendations: {
        Row: {
          id: string;
          curator_id: string;
          restaurant_id: string;
          dish_name: string;
          description: string | null;
          rating: number | null;
          price_estimate: number | null;
          is_personally_tasted: boolean | null;
          is_vegetarian: boolean | null;
          spice_level: number | null;
          image_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          curator_id: string;
          restaurant_id: string;
          dish_name: string;
          description?: string | null;
          rating?: number | null;
          price_estimate?: number | null;
          is_personally_tasted?: boolean | null;
          is_vegetarian?: boolean | null;
          spice_level?: number | null;
          image_url?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["dish_recommendations"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "dish_recommendations_curator_id_fkey";
            columns: ["curator_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "dish_recommendations_restaurant_id_fkey";
            columns: ["restaurant_id"];
            isOneToOne: false;
            referencedRelation: "restaurants";
            referencedColumns: ["id"];
          }
        ];
      };
      taste_tags: {
        Row: {
          id: string;
          name: string;
        };
        Insert: {
          id?: string;
          name: string;
        };
        Update: {
          name?: string;
        };
        Relationships: [];
      };
      dish_recommendation_tags: {
        Row: {
          dish_recommendation_id: string;
          taste_tag_id: string;
        };
        Insert: {
          dish_recommendation_id: string;
          taste_tag_id: string;
        };
        Update: never;
        Relationships: [
          {
            foreignKeyName: "dish_recommendation_tags_dish_recommendation_id_fkey";
            columns: ["dish_recommendation_id"];
            isOneToOne: false;
            referencedRelation: "dish_recommendations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "dish_recommendation_tags_taste_tag_id_fkey";
            columns: ["taste_tag_id"];
            isOneToOne: false;
            referencedRelation: "taste_tags";
            referencedColumns: ["id"];
          }
        ];
      };
      dish_likes: {
        Row: {
          user_id: string;
          dish_recommendation_id: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          dish_recommendation_id: string;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          dish_recommendation_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "dish_likes_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "dish_likes_dish_recommendation_id_fkey";
            columns: ["dish_recommendation_id"];
            isOneToOne: false;
            referencedRelation: "dish_recommendations";
            referencedColumns: ["id"];
          }
        ];
      };
      saved_dishes: {
        Row: {
          user_id: string;
          dish_recommendation_id: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          dish_recommendation_id: string;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          dish_recommendation_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "saved_dishes_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "saved_dishes_dish_recommendation_id_fkey";
            columns: ["dish_recommendation_id"];
            isOneToOne: false;
            referencedRelation: "dish_recommendations";
            referencedColumns: ["id"];
          }
        ];
      };
      content_reports: {
        Row: {
          id: string;
          reporter_id: string | null;
          dish_recommendation_id: string | null;
          reason: string;
          status: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          reporter_id?: string | null;
          dish_recommendation_id?: string | null;
          reason: string;
          status?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          reporter_id?: string | null;
          dish_recommendation_id?: string | null;
          reason?: string;
          status?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "content_reports_reporter_id_fkey";
            columns: ["reporter_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "content_reports_dish_recommendation_id_fkey";
            columns: ["dish_recommendation_id"];
            isOneToOne: false;
            referencedRelation: "dish_recommendations";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      dish_feed: {
        Row: {
          id: string;
          dish_name: string;
          description: string | null;
          rating: number | null;
          price_estimate: number | null;
          is_personally_tasted: boolean | null;
          is_vegetarian: boolean | null;
          spice_level: number | null;
          image_url: string | null;
          created_at: string;
          restaurant_id: string | null;
          curator_id: string | null;
          restaurant_name: string | null;
          restaurant_city: string | null;
          cuisine: string | null;
          curator_name: string | null;
          curator_type: string | null;
          tags: string[] | null;
        };
        Relationships: [];
      };
    };
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type DishFeedItem = Database["public"]["Views"]["dish_feed"]["Row"];
export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
export type RestaurantRow = Database["public"]["Tables"]["restaurants"]["Row"];
export type TasteTagRow = Database["public"]["Tables"]["taste_tags"]["Row"];
