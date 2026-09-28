import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import { PUBLIC_BASE_URL } from '../../lib/publicUrl';

import type { Event, EventDeleteImpact } from '../../lib/types';
import {
  Button,
  Card,
  Input,
  Spinner,
  ConfirmDialog,
  ErrorMessage,
} from '../../components/ui';
import {
  Calendar,
  MapPin,
  Edit,
  Trash2,
  Sparkles,
  QrCode,
  Users,
  MessageSquare,
  ArrowLeft,
  AlertTriangle,
  Lightbulb,
  Download,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Delete Event with Impact States
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteImpact, setDeleteImpact] = useState<EventDeleteImpact | null>(null);
  const [confirmTitleInput, setConfirmTitleInput] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [impactLoading, setImpactLoading] = useState(false);

  const loadEvent = useCallback(async () => {
    try {
      const found = await api.getEventById(id!);
      if (found) {
        setEvent(found);
      } else {
        setError('Event not found.');
      }
    } catch {
      setError('Failed to load event.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadEvent();
  }, [loadEvent]);

  // Real-time: refetch when a registration or feedback row for THIS event
  // changes, matching the MVP's "Live Attendance" / "Live Feedback" badges
  // — filtered to this event_id so activity on other events doesn't
  // trigger unnecessary refetches here.
  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`event-detail-${id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'registrations', filter: `event_id=eq.${id}` },
        () => loadEvent()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'feedback', filter: `event_id=eq.${id}` },
        () => loadEvent()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, loadEvent]);

  const handleGenerateSummary = async () => {
    if (!event) return;
    setGeneratingSummary(true);
    try {
      const summary = await api.generateAiSummary(event.id);
      setEvent({ ...event, ai_summary: summary });
    } catch {
      setError('Could not generate AI summary. Please try again.');
    } finally {
      setGeneratingSummary(false);
    }
  };

  const handleOpenDelete = async () => {
    if (!event) return;
    setConfirmTitleInput('');
    setImpactLoading(true);
    setDeleteModalOpen(true);
    try {
      const impact = await api.getEventDeleteImpact(event.id);
      setDeleteImpact(impact);
    } catch {
      setDeleteImpact({ registrations: 0, feedback: 0 });
    } finally {
      setImpactLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!event) return;
    if (confirmTitleInput.trim() !== event.title.trim()) return;

    setDeleting(true);
    try {
      await api.deleteEvent(event.id);
      setDeleteModalOpen(false);
      navigate('/events');
    } catch {
      setError('Failed to delete event.');
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner className="w-8 h-8 text-teal" />
      </div>
    );
  }

  if (!event) {
    return (
      <Card className="text-center py-16">
        <h2 className="font-heading text-xl font-bold text-navy">Event Not Found</h2>
        <p className="text-xs text-gray mt-1 mb-4">The requested event could not be found.</p>
        <Link to="/events">
          <Button variant="secondary">Back to Events</Button>
        </Link>
      </Card>
    );
  }

  const formattedDate = new Date(event.event_date).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const registerUrl = `${PUBLIC_BASE_URL}/register/${event.slug}`;
  const feedbackUrl = `${PUBLIC_BASE_URL}/feedback/${event.slug}`;

  const downloadQrPng = (elementId: string, filename: string) => {
    const svg = document.getElementById(elementId) as SVGElement | null;
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, 256, 256);
      ctx.drawImage(img, 0, 0, 256, 256);
      URL.revokeObjectURL(url);

      const pngUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = pngUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    };
    img.src = url;
  };

  return (
    <div className="space-y-7 animate-in fade-in duration-300">
      {/* Top Navigation & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div className="flex items-center gap-3">
          <Link
            to="/events"
            className="p-2 rounded-xl text-gray hover:text-navy hover:bg-black/5 transition-colors"
            title="Back to Events"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-heading text-2xl sm:text-3xl font-bold text-navy tracking-tight">
                {event.title}
              </h1>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase font-heading ${
                  event.is_published
                    ? 'bg-teal/15 text-teal border border-teal/30'
                    : 'bg-gray/15 text-gray border border-gray/30'
                }`}
              >
                {event.is_published ? 'Published' : 'Draft'}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-gray mt-1">
              <span className="flex items-center gap-1.5 font-medium">
                <Calendar className="w-3.5 h-3.5 text-teal" />
                {formattedDate}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5 font-medium">
                <MapPin className="w-3.5 h-3.5 text-clay" />
                {event.location}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <Link to={`/events/${event.id}/edit`}>
            <Button variant="secondary" className="inline-flex items-center gap-1.5">
              <Edit className="w-4 h-4" />
              <span>Edit Event</span>
            </Button>
          </Link>
        </div>
      </div>

      {error && <ErrorMessage message={error} />}

      {/* Programme Overview & Top Stats Cards */}
      <Card className="space-y-4">
        <h2 className="font-heading text-sm font-bold text-navy uppercase tracking-wider">
          Programme Overview
        </h2>
        <p className="text-sm text-ink/80 leading-relaxed font-body">
          {event.description || 'No detailed description provided for this programme.'}
        </p>

        {/* Top stats cards row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-border/60">
          <div className="p-4 bg-cream/70 rounded-xl border border-border/70 flex items-center gap-3.5">
            <div className="p-2.5 rounded-lg bg-teal/15 text-teal">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs uppercase font-bold text-gray tracking-wider">Total Registrations</p>
              <p className="font-heading font-bold text-2xl text-navy">
                {event.registration_count ?? 0}
              </p>
            </div>
          </div>

          <div className="p-4 bg-cream/70 rounded-xl border border-border/70 flex items-center gap-3.5">
            <div className="p-2.5 rounded-lg bg-gold/15 text-gold">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs uppercase font-bold text-gray tracking-wider">Feedback Responses</p>
              <p className="font-heading font-bold text-2xl text-navy">{event.feedback_count ?? 0}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* QR Codes Section - Full-width 2-column row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Attendee Registration QR */}
        <Card className="space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-navy/10 text-navy text-[11px] font-bold font-heading uppercase tracking-wider">
                <QrCode className="w-3.5 h-3.5" />
                <span>Entrance Placement</span>
              </span>
            </div>

            <div>
              <h3 className="font-heading text-lg font-bold text-navy">
                Attendee Registration QR
              </h3>
              <p className="text-xs text-gray mt-0.5">
                Print on entrance posters and reception check-in desks
              </p>
            </div>

            {/* Padded white container */}
            <div className="p-4 bg-cream/50 rounded-2xl border border-border/60 flex items-center justify-center">
              <div className="p-3.5 bg-white rounded-xl shadow-xs border border-border/50 inline-flex items-center justify-center">
                <QRCodeSVG
                  id="qr-registration-code"
                  value={registerUrl}
                  size={190}
                  level="H"
                  includeMargin={true}
                />
              </div>
            </div>

            {/* Monospace URL */}
            <p className="text-[11px] text-gray font-mono break-all text-center select-all">
              {registerUrl}
            </p>
          </div>

          {/* Dark Navy Download Button */}
          <button
            type="button"
            onClick={() => downloadQrPng('qr-registration-code', `${event.slug}-registration-qr.png`)}
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-navy text-white text-xs font-semibold hover:bg-navy/90 active:scale-[0.99] transition-all cursor-pointer shadow-xs min-h-[44px]"
          >
            <Download className="w-4 h-4" />
            <span>Download Printable PNG (256x256)</span>
          </button>
        </Card>

        {/* Right Column: Attendee Feedback QR */}
        <Card className="space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal/15 text-teal text-[11px] font-bold font-heading uppercase tracking-wider">
                <QrCode className="w-3.5 h-3.5" />
                <span>Exit Placement</span>
              </span>
            </div>

            <div>
              <h3 className="font-heading text-lg font-bold text-navy">
                Attendee Feedback QR
              </h3>
              <p className="text-xs text-gray mt-0.5">
                Display near exits, on tables, and on closing event slides
              </p>
            </div>

            {/* Padded white container */}
            <div className="p-4 bg-cream/50 rounded-2xl border border-border/60 flex items-center justify-center">
              <div className="p-3.5 bg-white rounded-xl shadow-xs border border-border/50 inline-flex items-center justify-center">
                <QRCodeSVG
                  id="qr-feedback-code"
                  value={feedbackUrl}
                  size={190}
                  level="H"
                  includeMargin={true}
                />
              </div>
            </div>

            {/* Monospace URL */}
            <p className="text-[11px] text-gray font-mono break-all text-center select-all">
              {feedbackUrl}
            </p>
          </div>

          {/* Teal Download Button */}
          <button
            type="button"
            onClick={() => downloadQrPng('qr-feedback-code', `${event.slug}-feedback-qr.png`)}
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-teal text-white text-xs font-semibold hover:bg-teal/90 active:scale-[0.99] transition-all cursor-pointer shadow-xs min-h-[44px]"
          >
            <Download className="w-4 h-4" />
            <span>Download Printable PNG (256x256)</span>
          </button>
        </Card>
      </div>

      {/* AI Insights Panel */}
      <Card className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gold/15 text-gold border border-gold/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-heading text-lg font-bold text-navy tracking-tight">
                AI Insights
              </h2>
              <p className="text-xs text-gray italic">
                AI-generated from real event data — verify against the stats above before presenting.
              </p>
            </div>
          </div>

          <Button
            variant={event.ai_summary ? 'secondary' : 'primary'}
            loading={generatingSummary}
            onClick={handleGenerateSummary}
            className="inline-flex items-center gap-2 cursor-pointer shrink-0"
          >
            <Sparkles className="w-4 h-4 text-current" />
            <span>{event.ai_summary ? 'Regenerate' : 'Generate Summary'}</span>
          </Button>
        </div>

        {generatingSummary ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3">
            <Spinner className="w-8 h-8 text-teal" />
            <p className="text-xs font-medium text-navy font-heading">
              Analyzing attendee records and synthesizing themes...
            </p>
          </div>
        ) : event.ai_summary ? (
          <div className="space-y-5">
            {/* Plain text summary paragraph */}
            <p className="text-sm text-ink/90 leading-relaxed font-body">
              {event.ai_summary.summary}
            </p>

            {/* KEY THEMES: rounded tags/pills with light background, dark text, no bullets */}
            {event.ai_summary.key_themes && event.ai_summary.key_themes.length > 0 && (
              <div className="space-y-2">
                <p className="font-heading text-xs font-bold text-gray uppercase tracking-wider">
                  KEY THEMES
                </p>
                <div className="flex flex-wrap gap-2">
                  {event.ai_summary.key_themes.map((theme, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center px-3 py-1 rounded-full bg-cream text-navy border border-border/80 text-xs font-medium font-body"
                    >
                      {theme}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* RECOMMENDATIONS: each item in a row preceded by an icon */}
            {event.ai_summary.recommendations && event.ai_summary.recommendations.length > 0 && (
              <div className="space-y-2.5">
                <p className="font-heading text-xs font-bold text-gray uppercase tracking-wider">
                  RECOMMENDATIONS
                </p>
                <div className="space-y-2">
                  {event.ai_summary.recommendations.map((rec, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2.5 p-3 rounded-xl bg-cream/50 border border-border/60 text-xs text-ink/90"
                    >
                      <Lightbulb className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer timestamp */}
            <div className="pt-2 border-t border-border/40 text-xs text-gray italic">
              Last generated{' '}
              {new Date(event.ai_summary.generated_at).toLocaleString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          </div>
        ) : (
          <div className="py-8 text-center space-y-2">
            <Sparkles className="w-8 h-8 text-gray/40 mx-auto" />
            <p className="font-heading font-bold text-sm text-navy">
              No Summary Generated Yet
            </p>
            <p className="text-xs text-gray max-w-sm mx-auto">
              Click 'Generate Summary' to automatically analyze attendee backgrounds, sectors, and survey reflections.
            </p>
          </div>
        )}
      </Card>

      {/* Danger Zone: Cascading Delete Event */}
      <div className="pt-6 border-t border-border/60">
        <div className="p-5 rounded-2xl bg-clay/5 border border-clay/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-heading font-bold text-sm text-clay flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              <span>Danger Zone</span>
            </h3>
            <p className="text-xs text-gray mt-0.5 max-w-md">
              Permanently delete this event and all associated check-in records and feedback responses.
            </p>
          </div>

          <Button
            type="button"
            variant="danger"
            onClick={handleOpenDelete}
            className="inline-flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Event</span>
          </Button>
        </div>
      </div>

      {/* Cascading Deletion Confirmation Dialog with Impact Check & Title Confirmation */}
      <ConfirmDialog
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Permanently Delete Event?"
        confirmLabel="Permanently Delete"
        confirmVariant="danger"
        loading={deleting}
        disabled={confirmTitleInput.trim() !== event.title.trim() || impactLoading}
        onConfirm={handleConfirmDelete}
        description={
          <div className="space-y-4">
            {impactLoading ? (
              <div className="py-4 text-center">
                <Spinner className="w-6 h-6 text-clay mx-auto mb-2" />
                <p className="text-xs text-gray">Calculating cascading impact...</p>
              </div>
            ) : (
              <>
                <p className="text-sm font-semibold text-clay">
                  This will permanently delete{' '}
                  <strong>
                    {deleteImpact?.registrations ?? 0} registrations
                  </strong>{' '}
                  and{' '}
                  <strong>
                    {deleteImpact?.feedback ?? 0} feedback responses
                  </strong>
                  .
                </p>
                <p className="text-xs text-gray">
                  This action is irreversible and immediately wipes all attendee data collected for this event.
                </p>

                <div className="space-y-1.5 pt-2">
                  <label className="block text-xs font-bold text-navy font-heading">
                    Type <strong>"{event.title}"</strong> to confirm:
                  </label>
                  <Input
                    label=""
                    type="text"
                    placeholder={event.title}
                    value={confirmTitleInput}
                    onChange={(e) => setConfirmTitleInput(e.target.value)}
                    autoComplete="off"
                  />
                </div>
              </>
            )}
          </div>
        }
      />
    </div>
  );
}
