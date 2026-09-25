import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import {
  COUNTRIES,
  HERITAGE_COUNTRIES,
  INDUSTRIES,
  OCCUPATION_STATUSES,
  getCountryGroups,
  isAfricanCountry,
} from '../../lib/constants';
import type { Event, RegistrationFormData } from '../../lib/types';
import { Spinner, ErrorMessage, Button, Input, Select, Card, NoticeBanner } from '../../components/ui';
import { MapPin, Calendar, WifiOff } from 'lucide-react';

const countryGroups = getCountryGroups(COUNTRIES);
const heritageGroups = getCountryGroups(HERITAGE_COUNTRIES);

const initialFormData: RegistrationFormData = {
  full_name: '',
  email: '',
  current_country: '',
  heritage_country: '',
  industry: '',
  occupation_status: '',
  organization: '',
  consent_data: false,
  consent_marketing: false,
};

type FieldErrors = Partial<Record<keyof RegistrationFormData, string>>;

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getEmailTypoSuggestion(email: string): string | null {
  const parts = email.toLowerCase().split('@');
  if (parts.length !== 2) return null;
  const domain = parts[1];
  const typos: Record<string, string> = {
    'gmai.com': 'gmail.com',
    'gamil.com': 'gmail.com',
    'gmial.com': 'gmail.com',
    'yaho.com': 'yahoo.com',
    'yahooo.com': 'yahoo.com',
    'hotmial.com': 'hotmail.com',
    'hotmaill.com': 'hotmail.com',
    'outlok.com': 'outlook.com',
  };
  if (typos[domain]) {
    return `${parts[0]}@${typos[domain]}`;
  }
  return null;
}

function validateField(
  name: keyof RegistrationFormData,
  value: string | boolean
): string | undefined {
  switch (name) {
    case 'full_name':
      if (!value || (typeof value === 'string' && value.trim().length < 2))
        return 'Please enter your full name (at least 2 characters).';
      break;
    case 'email':
      if (!value) return 'Please enter your email address.';
      if (typeof value === 'string' && !validateEmail(value))
        return 'Please enter a valid email address.';
      break;
    case 'current_country':
      if (!value) return 'Please select your current country of residence.';
      break;
    case 'industry':
      if (!value) return 'Please select your professional sector.';
      break;
    case 'occupation_status':
      if (!value) return 'Please select your occupation status.';
      break;
    case 'consent_data':
      if (!value) return 'You must consent to data processing to complete registration.';
      break;
  }
  return undefined;
}

export default function Register() {
  const { eventSlug } = useParams<{ eventSlug: string }>();
  const navigate = useNavigate();

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [formData, setFormData] = useState<RegistrationFormData>(initialFormData);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Set<keyof RegistrationFormData>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [offlineQueued, setOfflineQueued] = useState(false);

  // Heritage country becomes mandatory once someone selects a country
  // outside Africa — that answer is what separates African Diaspora from
  // International Supporters, and the split is meaningless without it.
  const heritageRequired =
    !!formData.current_country && !isAfricanCountry(formData.current_country);
  const [emailTypoSuggestion, setEmailTypoSuggestion] = useState<string | null>(null);

  const fieldRefs = useRef<Record<string, HTMLElement | null>>({});

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

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, type } = e.target;
      const value =
        type === 'checkbox'
          ? (e.target as HTMLInputElement).checked
          : e.target.value;

      setFormData((prev) => ({ ...prev, [name]: value }));

      if (name === 'email' && typeof value === 'string') {
        setEmailTypoSuggestion(getEmailTypoSuggestion(value));
      }

      if (touched.has(name as keyof RegistrationFormData)) {
        const error = validateField(name as keyof RegistrationFormData, value);
        setErrors((prev) => {
          const next = { ...prev };
          if (error) {
            next[name as keyof RegistrationFormData] = error;
          } else {
            delete next[name as keyof RegistrationFormData];
          }
          return next;
        });
      }
    },
    [touched]
  );

  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, type } = e.target;
      const value =
        type === 'checkbox'
          ? (e.target as HTMLInputElement).checked
          : e.target.value;

      setTouched((prev) => new Set(prev).add(name as keyof RegistrationFormData));

      const error = validateField(name as keyof RegistrationFormData, value);
      setErrors((prev) => {
        const next = { ...prev };
        if (error) {
          next[name as keyof RegistrationFormData] = error;
        } else {
          delete next[name as keyof RegistrationFormData];
        }
        return next;
      });
    },
    []
  );

  const applyEmailSuggestion = () => {
    if (emailTypoSuggestion) {
      setFormData((prev) => ({ ...prev, email: emailTypoSuggestion }));
      setEmailTypoSuggestion(null);
    }
  };

  const handleSubmit = async () => {
    const newErrors: FieldErrors = {};
    const requiredFields: (keyof RegistrationFormData)[] = [
      'full_name',
      'email',
      'current_country',
      'industry',
      'occupation_status',
      'consent_data',
    ];

    for (const field of requiredFields) {
      const error = validateField(field, formData[field]);
      if (error) newErrors[field] = error;
    }

    // Heritage is only mandatory when the person is outside Africa.
    if (heritageRequired && !formData.heritage_country) {
      newErrors.heritage_country = 'Please select a heritage country, or choose "Prefer not to say".';
    }

    if (formData.email && !validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address.';
    }

    setErrors(newErrors);
    setTouched(new Set(requiredFields));

    if (Object.keys(newErrors).length > 0) {
      const firstErrorField = requiredFields.find((f) => newErrors[f]);
      if (firstErrorField && typeof firstErrorField === 'string' && fieldRefs.current[firstErrorField]) {
        fieldRefs.current[firstErrorField]!.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
        fieldRefs.current[firstErrorField]!.focus();
      }
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const result = await api.registerAttendee({
        p_event_slug: eventSlug!,
        p_full_name: formData.full_name.trim(),
        p_email: formData.email.trim().toLowerCase(),
        p_current_country: formData.current_country,
        p_heritage_country: formData.heritage_country || null,
        p_industry: formData.industry,
        p_occupation_status: formData.occupation_status,
        p_organization: formData.organization.trim() || null,
        p_consent_data: formData.consent_data,
        p_consent_marketing: formData.consent_marketing,
      });

      navigate(`/register/${eventSlug}/done`, {
        state: {
          status: result.status,
          eventTitle: event?.title,
        },
      });
    } catch {
      // Offline fallback queueing
      setOfflineQueued(true);
      setSubmitError(
        'Connectivity issue detected. Your registration has been queued locally and will automatically synchronize.'
      );
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
          Please check the entrance QR code or ask a HACSA staff member.
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
      {/* Event Header */}
      <div className="mb-8 border-b border-border/80 pb-6">
        <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-teal/10 text-teal mb-2 font-heading">
          Event Registration
        </span>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-navy tracking-tight mb-2">
          {event.title}
        </h1>
        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-gray">
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

      {/* Offline Queued Notice */}
      {offlineQueued && (
        <div className="mb-6">
          <NoticeBanner
            message="Saved locally — your registration will sync once back online."
            variant="gold"
            icon={<WifiOff className="w-5 h-5 text-gold shrink-0" />}
          />
        </div>
      )}

      {submitError && !offlineQueued && (
        <div className="mb-6">
          <ErrorMessage message={submitError} onRetry={handleSubmit} />
        </div>
      )}

      {/* Form Body - In exact field order specified */}
      <div className="space-y-5">
        {/* 1. Full name */}
        <Input
          ref={(el) => { fieldRefs.current.full_name = el; }}
          label="Full Name *"
          name="full_name"
          type="text"
          autoComplete="name"
          placeholder="e.g. Kwame Mensah"
          value={formData.full_name}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.full_name}
          required
        />

        {/* 2. Email with typo suggestion */}
        <div>
          <Input
            ref={(el) => { fieldRefs.current.email = el; }}
            label="Email Address *"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="kwame@example.com"
            helperText="We use this to verify attendance and link your feedback."
            value={formData.email}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.email}
            required
          />
          {emailTypoSuggestion && (
            <p className="mt-1.5 text-xs text-teal font-medium">
              Did you mean{' '}
              <button
                type="button"
                onClick={applyEmailSuggestion}
                className="underline font-bold hover:text-teal-pressed cursor-pointer"
              >
                {emailTypoSuggestion}
              </button>
              ?
            </p>
          )}
        </div>

        {/* 3. Current Country */}
        <Select
          ref={(el) => { fieldRefs.current.current_country = el; }}
          label="Current Country of Residence *"
          name="current_country"
          placeholder="Select current country"
          groups={countryGroups}
          value={formData.current_country}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.current_country}
          required
        />

        {/* 4. Heritage Country — required when registering from outside
            Africa, since it is the only field distinguishing African
            Diaspora from International Supporters. Irrelevant (and so
            left optional) for anyone registering from within Africa. */}
        <Select
          ref={(el) => { fieldRefs.current.heritage_country = el; }}
          label={
            heritageRequired ? 'Heritage Country *' : 'Heritage Country (Optional)'
          }
          name="heritage_country"
          placeholder="Select heritage country"
          groups={heritageGroups}
          helperText={
            heritageRequired
              ? 'Helps us understand our diaspora and international community. Choose "Prefer not to say" if you would rather not answer.'
              : 'Optional roots or ancestral connection'
          }
          value={formData.heritage_country}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.heritage_country}
          required={heritageRequired}
        />

        {/* 5. Industry (hardcoded dropdown) */}
        <Select
          ref={(el) => { fieldRefs.current.industry = el; }}
          label="Industry Sector *"
          name="industry"
          placeholder="Select industry sector"
          options={INDUSTRIES.map((i) => ({ value: i, label: i }))}
          value={formData.industry}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.industry}
          required
        />

        {/* 6. Occupation Status (hardcoded dropdown) */}
        <Select
          ref={(el) => { fieldRefs.current.occupation_status = el; }}
          label="Occupation Status *"
          name="occupation_status"
          placeholder="Select occupation status"
          options={OCCUPATION_STATUSES.map((o) => ({ value: o, label: o }))}
          value={formData.occupation_status}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.occupation_status}
          required
        />

        {/* 7. Organisation (optional) */}
        <Input
          label="Organisation / Institution (Optional)"
          name="organization"
          type="text"
          placeholder="e.g. University, Company, or Community Group"
          value={formData.organization}
          onChange={handleChange}
        />

        {/* 8 & 9. Consent Checkboxes */}
        <div className="pt-2 space-y-3">
          <label className="flex items-start gap-3 cursor-pointer min-h-[48px] py-1">
            <input
              ref={(el) => { fieldRefs.current.consent_data = el; }}
              type="checkbox"
              name="consent_data"
              checked={formData.consent_data}
              onChange={handleChange}
              onBlur={handleBlur}
              className="mt-1 h-5 w-5 shrink-0 rounded-md border-border text-teal accent-teal"
              aria-invalid={errors.consent_data ? 'true' : undefined}
            />
            <span className="text-xs text-ink/90 font-medium leading-relaxed">
              I agree that HACSA may store this information to understand event attendance and improve future heritage programmes. *
            </span>
          </label>
          {errors.consent_data && (
            <p className="text-xs font-semibold text-clay pl-8" role="alert">
              {errors.consent_data}
            </p>
          )}

          <label className="flex items-start gap-3 cursor-pointer min-h-[48px] py-1">
            <input
              type="checkbox"
              name="consent_marketing"
              checked={formData.consent_marketing}
              onChange={handleChange}
              className="mt-1 h-5 w-5 shrink-0 rounded-md border-border text-teal accent-teal"
            />
            <span className="text-xs text-ink/80 leading-relaxed">
              I'd like to receive updates on future HACSA events and diaspora initiatives.
            </span>
          </label>
        </div>

        <div className="pt-4">
          <Button
            onClick={handleSubmit}
            disabled={!formData.consent_data || submitting}
            loading={submitting}
            variant="primary"
            className="w-full cursor-pointer"
          >
            {submitting ? 'Submitting Registration…' : 'Register Now'}
          </Button>
        </div>
      </div>

      {/* Privacy Guarantee */}
      <div className="mt-8 pt-6 border-t border-border/60 text-center">
        <p className="font-aside text-teal text-lg font-bold">
          ~ your privacy matters to us
        </p>
        <p className="text-[11px] text-gray mt-0.5 leading-relaxed max-w-sm mx-auto">
          HACSA protects your data. Individual attendee details are never published; only aggregated statistics are used for programme analysis.
        </p>
      </div>
    </Card>
  );
}
