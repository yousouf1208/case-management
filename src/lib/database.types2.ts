export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          email: string;
          is_admin: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          is_admin?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          is_admin?: boolean;
          created_at?: string;
        };
      };
      forecasts: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string;
          forecast_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string;
          forecast_date: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string;
          forecast_date?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}
