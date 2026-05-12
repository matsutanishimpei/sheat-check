import { IRoomRepository, RoomLayout } from './RoomRepository';

export class D1RoomRepository implements IRoomRepository {
  constructor(private db: D1Database) {}

  async listAll(): Promise<Omit<RoomLayout, 'grid'>[]> {
    const { results } = await this.db.prepare('SELECT id, name, supabase_url, supabase_anon_key, is_active FROM rooms').all<{
      id: string;
      name: string;
      supabase_url: string | null;
      supabase_anon_key: string | null;
      is_active: number | null;
    }>();

    return (results || []).map(r => ({
      id: r.id,
      name: r.name,
      supabaseUrl: r.supabase_url,
      supabaseAnonKey: r.supabase_anon_key,
      isActive: r.is_active !== 0,
    }));
  }

  async findById(id: string): Promise<RoomLayout | null> {
    const r = await this.db.prepare('SELECT id, name, layout_data, supabase_url, supabase_anon_key, is_active FROM rooms WHERE id = ?')
      .bind(id)
      .first<{
        id: string;
        name: string;
        layout_data: string;
        supabase_url: string | null;
        supabase_anon_key: string | null;
        is_active: number | null;
      }>();

    if (!r) return null;

    return {
      id: r.id,
      name: r.name,
      grid: JSON.parse(r.layout_data || '[]'),
      supabaseUrl: r.supabase_url,
      supabaseAnonKey: r.supabase_anon_key,
      isActive: r.is_active !== 0,
    };
  }

  async create(room: RoomLayout): Promise<void> {
    await this.db.prepare('INSERT INTO rooms (id, name, layout_data, supabase_url, supabase_anon_key, is_active) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(
        room.id,
        room.name,
        JSON.stringify(room.grid),
        room.supabaseUrl,
        room.supabaseAnonKey,
        room.isActive ? 1 : 0
      )
      .run();
  }

  async update(id: string, room: Omit<RoomLayout, 'id'>): Promise<void> {
    await this.db.prepare('UPDATE rooms SET name = ?, layout_data = ?, supabase_url = ?, supabase_anon_key = ?, is_active = ? WHERE id = ?')
      .bind(
        room.name,
        JSON.stringify(room.grid),
        room.supabaseUrl,
        room.supabaseAnonKey,
        room.isActive ? 1 : 0,
        id
      )
      .run();
  }

  async updateStatus(id: string, isActive: boolean): Promise<void> {
    await this.db.prepare('UPDATE rooms SET is_active = ? WHERE id = ?')
      .bind(isActive ? 1 : 0, id)
      .run();
  }

  async delete(id: string): Promise<void> {
    await this.db.prepare('DELETE FROM rooms WHERE id = ?')
      .bind(id)
      .run();
  }

  async exists(id: string): Promise<boolean> {
    const r = await this.db.prepare('SELECT 1 FROM rooms WHERE id = ?')
      .bind(id)
      .first();
    return r !== null;
  }
}
