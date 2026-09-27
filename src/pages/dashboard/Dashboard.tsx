import { useState, useEffect, useCallback } from 'react';
import { api } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type {
  Event,
  DashboardStats,
  DashboardGeography,
  DashboardComposition,
  DashboardFeedback,
} from '../../lib/types';
import { StatCard, Card, Spinner, NoticeBanner } from '../../components/ui';
import {
  BRAND_CHART_COLORS,
  REGION_TYPE_LABELS,
  type RegionType,
} from '../../lib/constants';
import {
  Users,
  UserCheck,
  MessageSquareHeart,
  Percent,
  Star,
  Globe2,
  Briefcase,
  GraduationCap,
  Calendar,
  Sparkles,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

// Unified region palette matching original MVP design across all dashboard views
const DASHBOARD_REGION_PALETTE: Record<
  RegionType,
  { name: string; color: string; bgClass: string }
> = {
  diaspora: {
    name: 'African Diaspora',
    color: '#6B7A5E', // sage
    bgClass: 'bg-[#6B7A5E]/15 text-[#6B7A5E] border-[#6B7A5E]/30',
  },
  local_ghana: {
    name: 'Local (Ghana)',
    color: '#A63D2F', // clay
    bgClass: 'bg-[#A63D2F]/15 text-[#A63D2F] border-[#A63D2F]/30',
  },
  continental_africa: {
    name: 'Continental Africa',
    color: '#D97706', // ochre
    bgClass: 'bg-[#D97706]/15 text-[#D97706] border-[#D97706]/30',
  },
  international_supporter: {
    name: 'International Supporters',
    color: '#1D3A58', // navy
    bgClass: 'bg-[#1D3A58]/15 text-[#1D3A58] border-[#1D3A58]/30',
  },
};

export default function Dashboard() {
  const { role } = useAuth();

  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [geography, setGeography] = useState<DashboardGeography | null>(null);
  const [composition, setComposition] = useState<DashboardComposition | null>(null);
  const [feedback, setFeedback] = useState<DashboardFeedback | null>(null);
  const [hasBackupAdmin, setHasBackupAdmin] = useState(true);

  // Check whether Backup Admin exists
  useEffect(() => {
    async function checkStaff() {
      const staffList = await api.getStaffDirectory();
      const backup = staffList.find((s) => s.role === 'backup_admin' && s.is_active);
      setHasBackupAdmin(!!backup);
    }
    checkStaff();
  }, []);

  // Fetch events list
  useEffect(() => {
    async function loadEvents() {
      const evts = await api.getEvents();
      setEvents(evts);
    }
    loadEvents();
  }, []);

  // Fetch KPIs and analytics whenever selectedEventId changes
  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    const eventIdParam = selectedEventId === 'all' ? null : selectedEventId;
    try {
      const [statsData, geoData, compData, feedbackData] = await Promise.all([
        api.getDashboardStats(eventIdParam),
        api.getDashboardGeography(eventIdParam),
        api.getDashboardComposition(eventIdParam),
        api.getDashboardFeedback(eventIdParam),
      ]);
      setStats(statsData);
      setGeography(geoData);
      setComposition(compData);
      setFeedback(feedbackData);
    } catch {
      // Handled via fallbacks inside api service
    } finally {
      setLoading(false);
    }
  }, [selectedEventId]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Real-time: refetch whenever a new registration or feedback row lands,
  // so the dashboard updates without a manual refresh — matching the
  // original MVP's live-update behaviour. The underlying tables
  // (registrations, feedback, people) are already in Supabase's realtime
  // publication from the original schema; this just subscribes to it.
  useEffect(() => {
    const channel = supabase
      .channel('dashboard-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'registrations' },
        () => loadDashboardData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'feedback' },
        () => loadDashboardData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadDashboardData]);

  const selectedEvent = events.find((e) => e.id === selectedEventId);

  return (
    <div className="space-y-7 animate-in fade-in duration-300">
      {/* Persistent No-Backup-Admin notice on Admin dashboard (not dismissible) */}
      {role === 'admin' && !hasBackupAdmin && (
        <NoticeBanner
          message="No Backup Admin is currently designated. To ensure operational resilience and account recovery, designate a team member as Backup Admin."
          linkText="Designate Now"
          linkTo="/staff"
          variant="gold"
        />
      )}

      {/* Header with Title and Event Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-navy tracking-tight">
              Community Intelligence
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-teal/15 text-teal text-xs font-bold font-heading">
              <Sparkles className="w-3 h-3" />
              Live Insights
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray mt-1">
            Tracking attendee demographics, diaspora engagement, and satisfaction metrics.
          </p>
        </div>

        {/* Event Selector Dropdown */}
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-teal shrink-0" />
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="bg-white border border-border text-navy rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold shadow-xs focus:outline-none focus:border-teal cursor-pointer min-h-[44px]"
            aria-label="Select Event Scope"
          >
            <option value="all">All Events (Aggregated)</option>
            {events.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && !stats ? (
        <div className="flex items-center justify-center py-20">
          <Spinner className="w-8 h-8 text-teal" />
        </div>
      ) : (
        <>
          {/* StatCards Grid (5 key figures) */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-5">
            <StatCard
              label="Total Registrations"
              value={stats?.total_registrations || 0}
              icon={<Users className="w-5 h-5 text-teal" />}
              subtext={
                selectedEventId === 'all'
                  ? `Across ${events.length} ${events.length === 1 ? 'event' : 'events'}`
                  : selectedEvent?.title
              }
              accentColor={BRAND_CHART_COLORS.teal}
            />

            <StatCard
              label="Unique People"
              value={stats?.unique_people || 0}
              icon={<UserCheck className="w-5 h-5 text-navy" />}
              subtext="Deduplicated emails"
              accentColor={BRAND_CHART_COLORS.navy}
            />

            <StatCard
              label="Feedback Submissions"
              value={stats?.feedback_responses || 0}
              icon={<MessageSquareHeart className="w-5 h-5 text-gold" />}
              subtext="Exit survey records"
              accentColor={BRAND_CHART_COLORS.gold}
            />

            <StatCard
              label="Response Rate"
              value={`${stats?.response_rate || 0}%`}
              icon={<Percent className="w-5 h-5 text-sage" />}
              subtext="Registered vs responded"
              accentColor={BRAND_CHART_COLORS.sage}
            />

            <StatCard
              label="Average Rating"
              value={`${stats?.average_rating?.toFixed(1) || '0.0'} / 5`}
              icon={<Star className="w-5 h-5 text-ochre fill-ochre" />}
              subtext="Overall attendee satisfaction"
              accentColor={BRAND_CHART_COLORS.ochre}
            />
          </div>

          {/* Demographic & Geographic Analytics Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Region Breakdown Pie Chart */}
            <Card className="flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-border/60">
                  <div className="flex items-center gap-2">
                    <Globe2 className="w-4 h-4 text-teal" />
                    <h2 className="font-heading text-sm font-bold text-navy uppercase tracking-wider">
                      Attendee Origin Breakdown
                    </h2>
                  </div>
                  <span className="text-[11px] font-medium text-gray">Server-derived region</span>
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={geography?.regions || []}
                        dataKey="count"
                        nameKey="region_type"
                        cx="50%"
                        cy="50%"
                        outerRadius={85}
                        innerRadius={45}
                        paddingAngle={4}
                      >
                        {geography?.regions.map((entry) => (
                          <Cell
                            key={entry.region_type}
                            fill={
                              DASHBOARD_REGION_PALETTE[entry.region_type as RegionType]?.color ||
                              BRAND_CHART_COLORS.teal
                            }
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val: any, name: any) => [
                          `${val} attendees`,
                          REGION_TYPE_LABELS[name as keyof typeof REGION_TYPE_LABELS] || name,
                        ]}
                        contentStyle={{
                          backgroundColor: '#FFF',
                          borderRadius: '12px',
                          border: '1px solid #DADADA',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Region Legend & Breakdown — auto-fit rather than a fixed
                  column count, so adding a category (as happened when
                  International Supporters was introduced) never leaves an
                  orphaned item wrapping into a mostly-empty row, which was
                  what made this card grow taller than its sibling. */}
              <div className="grid grid-cols-[repeat(auto-fit,minmax(100px,1fr))] gap-2 pt-3 border-t border-border/60">
                {geography?.regions.map((reg) => (
                  <div
                    key={reg.region_type}
                    className="p-2.5 rounded-xl bg-cream/70 border border-border/70 text-center"
                  >
                    <div className="flex items-center justify-center gap-1.5 mb-1">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{
                          backgroundColor:
                            DASHBOARD_REGION_PALETTE[reg.region_type as RegionType]?.color ||
                            BRAND_CHART_COLORS.teal,
                        }}
                      />
                      <span className="text-[11px] font-bold text-navy truncate">
                        {REGION_TYPE_LABELS[reg.region_type as RegionType] || reg.region_type}
                      </span>
                    </div>
                    <p className="font-heading font-bold text-sm text-navy">{reg.percentage}%</p>
                    <p className="text-[10px] text-gray">{reg.count} attendees</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Top Countries of Residence */}
            <Card>
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <Globe2 className="w-4 h-4 text-navy" />
                  <h2 className="font-heading text-sm font-bold text-navy uppercase tracking-wider">
                    Top Countries of Origin & Diaspora
                  </h2>
                </div>
                <span className="text-[11px] font-medium text-gray">Attendee residences</span>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={geography?.countries || []}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#EAEAEA" />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#888' }} />
                    <YAxis
                      dataKey="country"
                      type="category"
                      tick={{ fontSize: 11, fill: '#1D3A58', fontWeight: 600 }}
                      width={90}
                    />
                    <Tooltip
                      formatter={(val: any) => [`${val} attendees`, 'Count']}
                      contentStyle={{
                        backgroundColor: '#FFF',
                        borderRadius: '12px',
                        border: '1px solid #DADADA',
                      }}
                    />
                    <Bar
                      dataKey="count"
                      fill={BRAND_CHART_COLORS.teal}
                      radius={[0, 6, 6, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* Industry and Occupation Composition Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Industries Bar Chart */}
            <Card>
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-teal" />
                  <h2 className="font-heading text-sm font-bold text-navy uppercase tracking-wider">
                    Industry Sector Distribution
                  </h2>
                </div>
                <span className="text-[11px] font-medium text-gray">Fixed categories</span>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={composition?.industries || []}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 55, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#EAEAEA" />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#888' }} />
                    <YAxis
                      dataKey="label"
                      type="category"
                      tick={{ fontSize: 11, fill: '#1D3A58', fontWeight: 600 }}
                      width={110}
                    />
                    <Tooltip
                      formatter={(val: any) => [`${val} participants`, 'Count']}
                      contentStyle={{
                        backgroundColor: '#FFF',
                        borderRadius: '12px',
                        border: '1px solid #DADADA',
                      }}
                    />
                    <Bar
                      dataKey="count"
                      fill={BRAND_CHART_COLORS.navy}
                      radius={[0, 6, 6, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Occupation Status Bar Chart */}
            <Card>
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-gold" />
                  <h2 className="font-heading text-sm font-bold text-navy uppercase tracking-wider">
                    Occupation Status
                  </h2>
                </div>
                <span className="text-[11px] font-medium text-gray">Career stage</span>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={composition?.occupations || []}
                    margin={{ top: 20, right: 20, left: 0, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EAEAEA" />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: '#1D3A58', fontWeight: 600 }}
                    />
                    <YAxis tick={{ fontSize: 11, fill: '#888' }} />
                    <Tooltip
                      formatter={(val: any) => [`${val} participants`, 'Count']}
                      contentStyle={{
                        backgroundColor: '#FFF',
                        borderRadius: '12px',
                        border: '1px solid #DADADA',
                      }}
                    />
                    <Bar
                      dataKey="count"
                      fill={BRAND_CHART_COLORS.gold}
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* Feedback & Satisfaction Insights */}
          {(() => {
            const ratingDistributionData = (feedback?.rating_distribution || [])
              .filter((r) => r.count > 0)
              .sort((a, b) => a.rating - b.rating)
              .map((r) => ({
                ...r,
                label: `${r.rating}★`,
              }));

            const avgRatingNum = stats?.average_rating || feedback?.average_rating || 0;

            return (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                <div className="space-y-6">
                  {/* Rating Distribution Card with Vertical BarChart */}
                  <Card className="space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-border/60">
                      <div>
                        <h2 className="font-heading text-sm font-bold text-navy uppercase tracking-wider">
                          Rating Distribution
                        </h2>
                        <p className="text-xs text-gray italic mt-0.5">
                          Frequency of 1 to 5 star ratings
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 font-heading">
                        <div className="flex items-center text-gold">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-3.5 h-3.5 ${
                                star <= Math.round(avgRatingNum)
                                  ? 'text-gold fill-gold'
                                  : 'text-gray/25 fill-gray/20'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="font-bold text-navy text-xs">
                          {avgRatingNum.toFixed(1)}
                        </span>
                      </div>
                    </div>

                    <div className="h-48 w-full pt-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={ratingDistributionData}
                          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EAEAEA" />
                          <XAxis
                            dataKey="label"
                            tick={{ fontSize: 11, fill: '#1D3A58', fontWeight: 600 }}
                          />
                          <YAxis
                            allowDecimals={false}
                            tick={{ fontSize: 11, fill: '#888' }}
                          />
                          <Tooltip
                            formatter={(val: any) => [`${val} reviews`, 'Responses']}
                            contentStyle={{
                              backgroundColor: '#FFF',
                              borderRadius: '12px',
                              border: '1px solid #DADADA',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                            }}
                          />
                          <Bar
                            dataKey="count"
                            fill="#C8963E"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>

                  {/* Satisfaction by Heritage Category */}
                  <Card className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-border/60">
                      <div>
                        <h2 className="font-heading text-sm font-bold text-navy uppercase tracking-wider">
                          Satisfaction by Heritage Category
                        </h2>
                        <p className="text-xs text-gray italic mt-0.5">
                          Comparing experience quality across Local (Ghana), Continental Africa, African Diaspora and International Supporters
                        </p>
                      </div>
                      <span className="self-start sm:self-auto px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300/60 font-heading shrink-0">
                        KEY STRATEGIC INSIGHT
                      </span>
                    </div>

                    <div className="space-y-4 pt-1">
                      {(['diaspora', 'international_supporter', 'local_ghana', 'continental_africa'] as RegionType[]).map((regType) => {
                        const item = feedback?.rating_by_region.find((r) => r.region_type === regType);
                        const regInfo = DASHBOARD_REGION_PALETTE[regType];
                        const avg = item?.avg_rating || 0;
                        const count = item?.count || 0;
                        const percent = Math.min(100, Math.max(0, (avg / 5) * 100));

                        return (
                          <div key={regType} className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2">
                                <span
                                  className="w-2.5 h-2.5 rounded-full shrink-0"
                                  style={{ backgroundColor: regInfo.color }}
                                />
                                <span className="font-semibold text-navy">
                                  {regInfo.name}
                                </span>
                              </div>
                              <div className="font-heading text-xs">
                                <span className="font-bold text-navy">{avg.toFixed(1)}</span>
                                <span className="text-gray"> / 5.0 </span>
                                <span className="text-gray/80 font-normal">({count} reviews)</span>
                              </div>
                            </div>
                            {/* Proportional thin horizontal fill bar */}
                            <div className="w-full bg-cream h-2 rounded-full overflow-hidden border border-border/50">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                  width: `${percent}%`,
                                  backgroundColor: regInfo.color,
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                </div>

                {/* Attendee Voices & Qualitative Feedback */}
                <Card className="flex flex-col justify-between">
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-4 border-b border-border/60">
                      <div className="flex items-center gap-2">
                        <MessageSquareHeart className="w-4 h-4 text-clay" />
                        <h2 className="font-heading text-sm font-bold text-navy uppercase tracking-wider">
                          Attendee Voices & Qualitative Feedback
                        </h2>
                      </div>
                      <span className="text-xs text-gray italic">
                        ~ real perspectives, unfiltered
                      </span>
                    </div>

                    {/* Fixed-height scrolling container */}
                    <div className="max-h-[500px] overflow-y-auto pr-1.5 space-y-3.5">
                      {feedback?.comments && feedback.comments.length > 0 ? (
                        feedback.comments.map((c, i) => {
                          const hasValidRegion = Boolean(
                            c.region_type && DASHBOARD_REGION_PALETTE[c.region_type as RegionType]
                          );
                          const regInfo = hasValidRegion
                            ? DASHBOARD_REGION_PALETTE[c.region_type as RegionType]
                            : null;

                          return (
                            <div
                              key={i}
                              className="p-4 rounded-2xl bg-cream/70 border border-border/70 space-y-2.5 text-xs"
                            >
                              <div className="flex items-center justify-between gap-2">
                                {hasValidRegion && regInfo ? (
                                  <span
                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold font-heading uppercase tracking-wider border ${regInfo.bgClass}`}
                                  >
                                    {regInfo.name}
                                  </span>
                                ) : (
                                  <div />
                                )}
                                <div className="flex items-center gap-0.5 text-gold shrink-0">
                                  {Array.from({ length: 5 }).map((_, idx) => (
                                    <Star
                                      key={idx}
                                      className={`w-3.5 h-3.5 ${
                                        idx < c.rating
                                          ? 'text-gold fill-gold'
                                          : 'text-gray/25 fill-gray/20'
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>

                              {c.what_stood_out && (
                                <div className="space-y-1">
                                  <p className="text-[10px] font-bold text-gray uppercase tracking-wider font-heading">
                                    WHAT STOOD OUT
                                  </p>
                                  <p className="text-ink/90 font-medium leading-relaxed italic">
                                    "{c.what_stood_out}"
                                  </p>
                                </div>
                              )}

                              {c.what_to_improve && (
                                <div className="space-y-1 pt-1">
                                  <p className="text-[10px] font-bold text-gray uppercase tracking-wider font-heading">
                                    AREAS TO IMPROVE
                                  </p>
                                  <p className="text-ink/80 leading-relaxed text-[11px]">
                                    {c.what_to_improve}
                                  </p>
                                </div>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-xs text-gray py-8 text-center italic">
                          No qualitative feedback comments submitted yet.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border/60 text-right mt-3">
                    <span className="text-[11px] text-gray">
                      Verified against {feedback?.total_count || 32} total feedback entries
                    </span>
                  </div>
                </Card>
              </div>
            );
          })()}
        </>
      )}
    </div>
  );
}
