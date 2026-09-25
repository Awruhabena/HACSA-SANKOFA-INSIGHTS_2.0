import { useState, useId } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { Button, Input, Textarea, Card, ErrorMessage } from '../../components/ui';
import { ArrowLeft, Sparkles, Link2 } from 'lucide-react';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function EventNew() {
  const navigate = useNavigate();
  const publishedToggleId = useId();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [isPublished, setIsPublished] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const slug = slugify(title);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !location.trim() || !eventDate) {
      setError('Please provide event title, location, and date.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const created = await api.createEvent({
        title: title.trim(),
        slug: slug || `event-${Date.now()}`,
        description: description.trim() || null,
        location: location.trim(),
        event_date: eventDate,
        is_published: isPublished,
      });

      navigate(`/events/${created.id}`);
    } catch (err: any) {
      setError(err?.message || 'Failed to create event. Please check your inputs and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center gap-3 pb-2 border-b border-border/60">
        <Link
          to="/events"
          className="p-2 rounded-xl text-gray hover:text-navy hover:bg-black/5 transition-colors"
          title="Back to Events"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="font-heading text-2xl font-bold text-navy tracking-tight">
            Create New Event
          </h1>
          <p className="text-xs text-gray mt-0.5">
            Set up an event to enable entrance check-in and post-event survey collection.
          </p>
        </div>
      </div>

      {error && <ErrorMessage message={error} />}

      <Card className="p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            id="event-title"
            label="Event Title *"
            type="text"
            placeholder="e.g. HACSA Sankofa Summit 2026"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          {/* Auto-generated read-only slug preview */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-ink font-body">
              Public Link URL Slug
            </label>
            <div className="flex items-center gap-2 p-3 bg-cream rounded-xl border border-border text-xs text-gray font-mono">
              <Link2 className="w-4 h-4 text-teal shrink-0" />
              <span>/register/{slug || 'your-event-slug'}</span>
            </div>
            <p className="text-[11px] text-gray">
              Auto-generated from title. Public attendees scan QR codes pointing to this address.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id="event-date"
              label="Event Date *"
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              required
            />

            <Input
              id="event-location"
              label="Venue & City *"
              type="text"
              placeholder="e.g. Accra, Ghana"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
            />
          </div>

          <Textarea
            label="Event Description (Optional)"
            placeholder="Briefly describe the conference theme, keynote topics, or schedule..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
          />

          {/* Published Toggle */}
          <div className="pt-2">
            <label htmlFor={publishedToggleId} className="flex items-center justify-between p-4 rounded-xl bg-cream border border-border/80 cursor-pointer">
              <div>
                <p className="text-sm font-bold text-navy font-heading">Publish Immediately</p>
                <p className="text-xs text-gray">
                  Published events are visible to attendees scanning check-in QR codes.
                </p>
              </div>
              <input
                id={publishedToggleId}
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="h-5 w-5 rounded-md border-border text-teal accent-teal cursor-pointer"
              />
            </label>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-border/60">
            <Link to="/events">
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              variant="primary"
              loading={loading}
              className="inline-flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Create Event</span>
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
