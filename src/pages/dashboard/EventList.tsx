import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import type { Event } from '../../lib/types';
import { Button, Card, Spinner } from '../../components/ui';
import {
  CalendarDays,
  Plus,
  MapPin,
  Calendar,
  Users,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

export default function EventList() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  const loadEvents = useCallback(async () => {
    try {
      const data = await api.getEvents();
      setEvents(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // Real-time: check-in counts on each card update as registrations and
  // feedback arrive, without needing a page refresh — matching the
  // behaviour of the dashboard and event detail pages. Also watches
  // `events` itself so a new or deleted event appears or disappears.
  useEffect(() => {
    const channel = supabase
      .channel('event-list-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'registrations' }, () =>
        loadEvents()
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'feedback' }, () =>
        loadEvents()
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () =>
        loadEvents()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadEvents]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-teal/15 text-teal border border-teal/30">
            <CalendarDays className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-heading text-2xl font-bold text-navy tracking-tight">
              Events & Summits
            </h1>
            <p className="text-xs text-gray mt-0.5">
              Conferences, symposia, and cultural galas hosted by the HACSA Foundation.
            </p>
          </div>
        </div>

        <Link to="/events/new">
          <Button variant="primary" className="inline-flex items-center gap-2">
            <Plus className="w-4 h-4" />
            <span>New Event</span>
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner className="w-8 h-8 text-teal" />
        </div>
      ) : events.length === 0 ? (
        <Card className="text-center py-16">
          <CalendarDays className="w-12 h-12 text-gray/40 mx-auto mb-3" />
          <h2 className="font-heading text-lg font-bold text-navy">No Events Scheduled</h2>
          <p className="text-xs text-gray max-w-sm mx-auto mt-1 mb-6">
            Get started by creating your first heritage summit or symposium.
          </p>
          <Link to="/events/new">
            <Button variant="primary" className="inline-flex items-center gap-2">
              <Plus className="w-4 h-4" />
              <span>Create Event</span>
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {events.map((event) => {
            const formattedDate = new Date(event.event_date).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            });

            return (
              <Link
                key={event.id}
                to={`/events/${event.id}`}
                className="group block"
              >
                <Card className="h-full flex flex-col justify-between hover:border-teal/60 hover:shadow-md transition-all duration-200 p-5">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider font-heading ${
                          event.is_published
                            ? 'bg-teal/15 text-teal border border-teal/30'
                            : 'bg-gray/15 text-gray border border-gray/30'
                        }`}
                      >
                        {event.is_published ? 'Published' : 'Draft'}
                      </span>
                      {event.ai_summary && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-ochre bg-gold/15 px-2 py-0.5 rounded-full border border-gold/30">
                          <Sparkles className="w-2.5 h-2.5" />
                          <span>AI Brief</span>
                        </span>
                      )}
                    </div>

                    <h2 className="font-heading text-base font-bold text-navy group-hover:text-teal transition-colors line-clamp-2">
                      {event.title}
                    </h2>

                    {event.description && (
                      <p className="text-xs text-gray line-clamp-2 leading-relaxed">
                        {event.description}
                      </p>
                    )}
                  </div>

                  <div className="pt-4 mt-4 border-t border-border/60 space-y-2">
                    <div className="flex items-center justify-between text-xs text-ink/80">
                      <span className="flex items-center gap-1.5 text-gray truncate pr-2">
                        <MapPin className="w-3.5 h-3.5 text-clay shrink-0" />
                        <span className="truncate">{event.location}</span>
                      </span>
                      <span className="flex items-center gap-1.5 text-teal shrink-0 font-medium">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{formattedDate}</span>
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-navy font-heading">
                        <Users className="w-3.5 h-3.5 text-teal" />
                        <span>{event.registration_count ?? 0} check-{event.registration_count === 1 ? "in" : "ins"}</span>
                      </span>

                      <span className="text-xs font-semibold text-teal group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                        <span>Details</span>
                        <ChevronRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
