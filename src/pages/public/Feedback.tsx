import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import type { Event, FeedbackFormData } from '../../lib/types';
import { Spinner, ErrorMessage, Button, Input, Textarea, Card, StarRating } from '../../components/ui';
import { Sparkles, Calendar, MapPin } from 'lucide-react';

const RATING_DESCRIPTIONS: Record<number, string> = {
  1: 'Needs Improvement',
  2: 'Fair Experience',
  3: 'Good & Inspiring',
  4: 'Very Memorable',
  5: 'Exceptional Gathering',
};

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function Feedback() {
  const { eventSlug } = useParams<{ eventSlug: string }>();
  const navigate = useNavigate();

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [formData, setFormData] = useState<FeedbackFormData>({
    email: '',
    rating: 0,
    what_stood_out: '',
    what_to_improve: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FeedbackFormData, string>>>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const emailRef = useRef<HTMLInputElement>(null);
  const ratingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchEvent() {
      try {
        const found = await api.getEventBySlug(eventSlug!);
        if (found) {
          setEvent(found);
        } else {
          setNotFound(true);
        }
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    fetchEvent();
  }, [eventSlug]);

  const validateField = useCallback(
    (name: keyof FeedbackFormData, value: string | number): string | undefined => {
      switch (name) {
        case 'email':
          if (!value) return 'Please enter your email address.';
          if (typeof value === 'string' && !validateEmail(value))
            return 'Please enter a valid email address.';
          break;
        case 'rating':
          if (!value || value === 0) return 'Please select a rating from 1 to 5 stars.';
          break;
      }
      return undefined;
    },
    []
  );

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, email: value }));
    if (touched.has('email')) {
      const error = validateField('email', value);
      setErrors((prev) => {
        const next = { ...prev };
        if (error) next.email = error;
        else delete next.email;
        return next;
      });
    }
  };

  const handleEmailBlur = () => {
    setTouched((prev) => new Set(prev).add('email'));
    const error = validateField('email', formData.email);
    setErrors((prev) => {
      const next = { ...prev };
      if (error) next.email = error;
      else delete next.email;
      return next;
    });
  };

  const handleRatingSelect = (rating: number) => {
    setFormData((prev) => ({ ...prev, rating }));
    setTouched((prev) => new Set(prev).add('rating'));
    setErrors((prev) => {
      const next = { ...prev };
      delete next.rating;
      return next;
    });
  };

  const handleSubmit = async () => {
    const newErrors: Partial<Record<keyof FeedbackFormData, string>> = {};

    const emailError = validateField('email', formData.email);
    if (emailError) newErrors.email = emailError;

    const ratingError = validateField('rating', formData.rating);
    if (ratingError) newErrors.rating = ratingError;

    setErrors(newErrors);
    setTouched(new Set(['email', 'rating']));

    if (Object.keys(newErrors).length > 0) {
      if (newErrors.email && emailRef.current) {
        emailRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        emailRef.current.focus();
      } else if (newErrors.rating && ratingRef.current) {
        ratingRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const result = await api.submitFeedback({
        p_event_slug: eventSlug!,
        p_email: formData.email.trim().toLowerCase(),
        p_rating: formData.rating,
        p_what_stood_out: formData.what_stood_out.trim() || null,
        p_what_to_improve: formData.what_to_improve.trim() || null,
      });

      navigate(`/feedback/${eventSlug}/done`, {
        state: {
          status: result.status,
          matched: result.matched,
          eventTitle: event?.title,
        },
      });
    } catch {
      setSubmitError('Failed to submit feedback. Please check your connection and retry.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Spinner className="h-8 w-8 text-teal" />
      </div>
    );
  }

  if (notFound || !event) {
    return (
      <Card className="text-center py-12">
        <h1 className="font-heading text-2xl font-bold text-navy mb-2">
          Event Not Found
        </h1>
        <p className="text-sm text-gray">
          Please check the exit QR code or ask a HACSA staff member.
        </p>
      </Card>
    );
  }

  const formattedDate = new Date(event.event_date).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <Card className="p-6 sm:p-10 shadow-sm border border-border">
      {/* Header */}
      <div className="mb-8 border-b border-border/80 pb-6 text-center">
        <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-teal/10 text-teal mb-2 font-heading">
          Exit Survey
        </span>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-navy tracking-tight mb-2">
          {event.title}
        </h1>
        <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-semibold text-gray">
          <span className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-clay" />
            {event.location}
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-teal" />
            {formattedDate}
          </span>
        </div>
      </div>

      {submitError && (
        <div className="mb-6">
          <ErrorMessage message={submitError} onRetry={handleSubmit} />
        </div>
      )}

      <div className="space-y-6">
        {/* Email identification */}
        <Input
          ref={emailRef}
          label="Your Email Address *"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="Enter the email you registered with"
          value={formData.email}
          onChange={handleEmailChange}
          onBlur={handleEmailBlur}
          error={errors.email}
          helperText="Used to connect your feedback with your attendee profile."
          required
        />

        {/* 1-5 Star Rating */}
        <div ref={ratingRef} className="space-y-2">
          <label className="block text-sm font-semibold text-ink font-body">
            How would you rate your experience? *
          </label>
          <div className="p-4 rounded-2xl bg-cream border border-border/80 flex flex-col items-center justify-center gap-2">
            <StarRating
              value={formData.rating}
              onChange={handleRatingSelect}
              size="lg"
            />
            {formData.rating > 0 && (
              <span className="text-xs font-bold text-navy font-heading animate-in fade-in">
                {RATING_DESCRIPTIONS[formData.rating]}
              </span>
            )}
          </div>
          {errors.rating && (
            <p className="text-xs font-medium text-clay" role="alert">
              {errors.rating}
            </p>
          )}
        </div>

        {/* What stood out (capped at 500) */}
        <Textarea
          label="What stood out to you? (Optional)"
          placeholder="Which discussions, exhibits, or moments made the greatest impression?"
          value={formData.what_stood_out}
          onChange={(e) => setFormData((prev) => ({ ...prev, what_stood_out: e.target.value }))}
          maxLength={500}
          showCount
          rows={3}
        />

        {/* What to improve (capped at 500) */}
        <Textarea
          label="What could we improve for future gatherings? (Optional)"
          placeholder="Logistics, session topics, venue amenities, or digital access..."
          value={formData.what_to_improve}
          onChange={(e) => setFormData((prev) => ({ ...prev, what_to_improve: e.target.value }))}
          maxLength={500}
          showCount
          rows={3}
        />

        <div className="pt-2">
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            loading={submitting}
            variant="primary"
            className="w-full cursor-pointer flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-white" />
            <span>Submit Your Feedback</span>
          </Button>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-border/60 text-center">
        <p className="font-aside text-teal text-base font-bold">
          ~ medaase for helping us build stronger heritage connections
        </p>
      </div>
    </Card>
  );
}
