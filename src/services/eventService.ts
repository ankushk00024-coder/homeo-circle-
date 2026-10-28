import { supabase, isSupabaseConfigured, getRequiredSupabase } from './supabaseClient';
import { Event, EventRegistration, UserProfile } from '../types';

export const eventService = {
  /**
   * Fetches published events with format category filtering.
   */
  async getEvents(formatFilter?: string): Promise<Event[]> {
    if (!isSupabaseConfigured || !supabase) return [];

    let query = supabase.from('events').select('*');

    if (formatFilter && formatFilter !== 'All' && formatFilter !== 'My Registered Events') {
      if (formatFilter === 'State Chapters') {
        query = query.eq('format', 'State Chapter CME');
      } else {
        query = query.ilike('format', `%${formatFilter.replace(/s$/, '')}%`);
      }
    }

    query = query.order('start_at', { ascending: true });

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching events:', error);
      return [];
    }
    return data || [];
  },

  /**
   * Creates a new event or webinar. Authorized to admins.
   */
  async createEvent(eventData: Partial<Event>): Promise<Event> {
    const client = getRequiredSupabase();

    const payload = {
      title: eventData.title?.trim() || '',
      summary: eventData.summary?.trim() || '',
      organizer: eventData.organizer?.trim() || 'Homeo Circle Clinical Committee',
      speaker: eventData.speaker?.trim() || '',
      speaker_title: eventData.speaker_title?.trim() || 'Senior Consultant',
      date_badge_day: eventData.date_badge_day || '15',
      date_badge_month: eventData.date_badge_month || 'NOV',
      time_display: eventData.time_display || '06:00 PM - 08:00 PM IST',
      start_at: eventData.start_at || new Date().toISOString(),
      format: eventData.format || 'Webinar',
      location: eventData.location?.trim() || 'Live Webinar',
      registration_url: eventData.registration_url?.trim() || '/events',
      source_url: eventData.source_url?.trim() || null,
      meeting_link: eventData.meeting_link?.trim() || null,
      status: eventData.status || 'published',
      attendees_count: 0
    };

    const { data, error } = await client
      .from('events')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Updates an existing event.
   */
  async updateEvent(id: string, updates: Partial<Event>): Promise<Event> {
    const client = getRequiredSupabase();

    const { data, error } = await client
      .from('events')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Registers a verified member for an event.
   * RLS and DB unique constraints prevent duplicate registrations.
   * DB trigger synchronizes attendees_count.
   */
  async registerForEvent(eventId: string, user: UserProfile): Promise<EventRegistration> {
    const client = getRequiredSupabase();

    const { data, error } = await client
      .from('event_registrations')
      .insert([{
        event_id: eventId,
        user_id: user.id,
        status: 'confirmed'
      }])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error('You are already registered for this event.');
      }
      throw error;
    }

    return {
      id: data.id,
      event_id: data.event_id,
      user_id: data.user_id,
      user_name: user.display_name || user.full_name,
      user_email: user.email,
      status: 'registered',
      registered_at: data.registered_at
    };
  },

  /**
   * Cancels a user's registration for an event.
   */
  async cancelEventRegistration(eventId: string, userId: string): Promise<void> {
    const client = getRequiredSupabase();
    const { error } = await client
      .from('event_registrations')
      .delete()
      .eq('event_id', eventId)
      .eq('user_id', userId);

    if (error) throw error;
  },

  /**
   * Fetches event registrations for the given user.
   */
  async getUserEventRegistrations(userId: string): Promise<EventRegistration[]> {
    if (!isSupabaseConfigured || !supabase || !userId) return [];

    const { data, error } = await supabase
      .from('event_registrations')
      .select(`
        *,
        user:profiles!user_id(display_name, full_name, email)
      `)
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching registrations:', error);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      event_id: row.event_id,
      user_id: row.user_id,
      user_name: row.user?.display_name || row.user?.full_name || 'Member',
      user_email: row.user?.email || '',
      status: 'registered',
      registered_at: row.registered_at
    }));
  }
};
