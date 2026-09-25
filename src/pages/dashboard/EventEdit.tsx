import { useState, useEffect, useId } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { Button, Input, Textarea, Card, ErrorMessage, Spinner } from '../../components/ui';
import { ArrowLeft, Lock, Save } from 'lucide-react';

export default function EventEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const publishedToggleId = useId();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [isPublished, setIsPublished] = useState(true);

  useEffect(() => {
    async function loadEvent() {
      try {
        const found = await api.getEventById(id!);
        if (found) {
          setTitle(found.title);
          setSlug(found.slug);
          setDescription(found.description || '');
          setLocation(found.location);
          setEventDate(found.event_date.split('T')[0]);
          setIsPublished(found.is_published);
        } else {
          setError('Event not found.');
        }
      } catch {
        setError('Failed to load event details.');
      } finally {
        setLoading(false);
      }
    }
    loadEvent();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !location.trim() || !eventDate) {
      setError('Please provide event title, location, and date.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await api.updateEvent(id!, {
        title: title.trim(),
        description: description.trim() || null,
        location: location.trim(),
        event_date: eventDate,
        is_published: isPublished,
      });

      navigate(`/events/${id}`);
    } catch (err: any) {
      setError(err?.message || 'Failed to update event. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner className="w-8 h-8 text-teal" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center gap-3 pb-2 border-b border-border/60">
        <Link
          to={`/events/${id}`}
          className="p-2 rounded-xl text-gray hover:text-navy hover:bg-black/5 transition-colors"
          title="Back to Event Details"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="font-heading text-2xl font-bold text-navy tracking-tight">
            Edit Event
          </h1>
          <p className="text-xs text-gray mt-0.5">
            Modify event information, venue location, or scheduled dates.
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
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          {/* Fixed Slug on Edit with Lock Icon */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-ink font-body">
              Public Link URL Slug
            </label>
            <div className="flex items-center justify-between p-3 bg-cream rounded-xl border border-locked-outline text-xs text-ink/70 font-mono">
              <span className="truncate">/register/{slug}</span>
              <div className="flex items-center gap-1 text-gray shrink-0 pl-2">
                <Lock className="w-3.5 h-3.5 text-gray" />
                <span className="text-[11px] font-sans font-medium">Locked</span>
              </div>
            </div>
            <p className="text-[11px] text-gray">
              The slug is fixed and cannot be changed, since public registration and feedback QR codes depend on it.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id="event-date"
              label="Event Date *"
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              helperText="Date can be rescheduled at any time"
              required
            />

            <Input
              id="event-location"
              label="Venue & City *"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
            />
          </div>

          <Textarea
            label="Event Description (Optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
          />

          {/* Published Toggle */}
          <div className="pt-2">
            <label htmlFor={publishedToggleId} className="flex items-center justify-between p-4 rounded-xl bg-cream border border-border/80 cursor-pointer">
              <div>
                <p className="text-sm font-bold text-navy font-heading">Event Visibility</p>
                <p className="text-xs text-gray">
                  {isPublished
                    ? 'Currently published and accessible to public check-in.'
                    : 'Currently hidden as draft.'}
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
            <Link to={`/events/${id}`}>
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              variant="primary"
              loading={saving}
              className="inline-flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
