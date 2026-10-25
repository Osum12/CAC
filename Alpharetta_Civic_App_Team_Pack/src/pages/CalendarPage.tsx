import { Link } from 'react-router-dom';
import { getDocuments, getMeetings } from '../services/civicData';
import { formatTime, meetingTypeLabel, todayIso } from '../services/format';
import { useAsync } from '../services/useAsync';
import { usePageTitle } from '../services/usePageTitle';
import { useUrlParams } from '../services/useUrlParams';
import { EmptyState, ErrorState, LoadingState } from '../components/States';
import { MeetingCard } from '../components/Cards';
import { agendaFor } from './CitywidePage';
import type { Meeting } from '../types/civic';
import { usePlaceHref } from '../services/placeContext';

export function meetingsForMonth(meetings: Meeting[], month: string, meetingType: string): Meeting[] {
  return meetings
    .filter((meeting) => meeting.date?.slice(0, 7) === month)
    .filter((meeting) => !meetingType || meeting.meetingType === meetingType)
    .sort((a, b) => (a.date ?? '').localeCompare(b.date ?? '') || (a.startTime ?? '').localeCompare(b.startTime ?? ''));
}

function monthLabel(month: string): string {
  return new Date(`${month}-01T12:00:00`).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function shiftMonth(month: string, amount: number): string {
  const date = new Date(`${month}-01T12:00:00`);
  date.setMonth(date.getMonth() + amount);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function validMonth(raw: string | null, meetings: Meeting[]): string {
  if (raw && /^\d{4}-(0[1-9]|1[0-2])$/.test(raw)) return raw;
  const current = todayIso().slice(0, 7);
  return meetings.some((meeting) => meeting.date?.startsWith(current)) ? current : meetings.find((meeting) => meeting.date)?.date?.slice(0, 7) ?? current;
}

function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function monthDays(month: string): { date: string; day: number; inMonth: boolean }[] {
  const [year, monthNumber] = month.split('-').map(Number);
  const first = new Date(year, monthNumber - 1, 1);
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(year, monthNumber - 1, 1 - first.getDay() + index);
    return { date: dateKey(date), day: date.getDate(), inMonth: date.getMonth() === monthNumber - 1 };
  });
}

export function CalendarPage() {
  usePageTitle('Meeting calendar');
  const href = usePlaceHref();
  const { params, setParam } = useUrlParams();
  const state = useAsync(() => Promise.all([getMeetings(), getDocuments()]), []);

  if (state.status === 'loading') return <div className="page"><LoadingState rows={5} /></div>;
  if (state.status === 'error') return <div className="page"><ErrorState onRetry={state.retry} /></div>;

  const [meetings, documents] = state.data;
  const month = validMonth(params.get('month'), meetings);
  const meetingType = params.get('type') ?? '';
  const types = Array.from(new Set(meetings.map((meeting) => meeting.meetingType))).sort();
  const visible = meetingsForMonth(meetings, month, meetingType);
  const previousMonth = shiftMonth(month, -1);
  const nextMonth = shiftMonth(month, 1);
  const days = monthDays(month);
  const meetingsByDate = new Map<string, Meeting[]>();
  visible.forEach((meeting) => {
    const entries = meetingsByDate.get(meeting.date!) ?? [];
    entries.push(meeting);
    meetingsByDate.set(meeting.date!, entries);
  });

  return (
    <div className="page calendar-page">
      <header className="page-header">
        <p className="eyebrow">Public meetings</p>
        <h1>Meeting calendar</h1>
        <p className="page-header__lede">Find upcoming and recent meetings, open their agendas, and follow the issues discussed.</p>
      </header>

      <div className="calendar-toolbar" aria-label="Calendar controls">
        <div className="calendar-toolbar__months">
          <button type="button" className="button button--ghost" onClick={() => setParam('month', previousMonth)} aria-label={`Show ${monthLabel(previousMonth)}`}>
            Previous
          </button>
          <strong aria-live="polite">{monthLabel(month)}</strong>
          <button type="button" className="button button--ghost" onClick={() => setParam('month', nextMonth)} aria-label={`Show ${monthLabel(nextMonth)}`}>
            Next
          </button>
        </div>
        <label className="calendar-toolbar__type">
          <span>Meeting type</span>
          <select value={meetingType} onChange={(event) => setParam('type', event.target.value)}>
            <option value="">All meeting types</option>
            {types.map((type) => <option key={type} value={type}>{meetingTypeLabel(type)}</option>)}
          </select>
        </label>
      </div>

      <p className="results-count" role="status" aria-live="polite">
        {visible.length} {visible.length === 1 ? 'meeting' : 'meetings'} in {monthLabel(month)}
      </p>

      <section className="month-calendar" aria-labelledby="month-calendar-heading">
        <h2 id="month-calendar-heading" className="visually-hidden">{monthLabel(month)} meetings</h2>
        <div className="month-calendar__weekdays" aria-hidden="true">
          {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((weekday) => <span key={weekday}>{weekday}</span>)}
        </div>
        <div className="month-calendar__grid" role="grid" aria-label={`${monthLabel(month)} meeting calendar`}>
          {days.map((day) => {
            const dayMeetings = meetingsByDate.get(day.date) ?? [];
            return (
              <div key={day.date} className={`month-calendar__day${day.inMonth ? '' : ' month-calendar__day--outside'}`} role="gridcell" aria-label={`${day.date}${dayMeetings.length ? `, ${dayMeetings.length} meeting${dayMeetings.length === 1 ? '' : 's'}` : ''}`}>
                <time className="month-calendar__number" dateTime={day.date}>{day.day}</time>
                <div className="month-calendar__events">
                  {dayMeetings.map((meeting) => (
                    <Link key={meeting.id} className="month-calendar__event" to={href(`/meetings/${encodeURIComponent(meeting.id)}`)}>
                      <span className="month-calendar__event-title">{meeting.title}</span>
                      {meeting.startTime && <span className="month-calendar__event-time">{formatTime(meeting.startTime)}</span>}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {visible.length ? (
        <section className="calendar-details" aria-labelledby="calendar-details-heading">
          <div className="section__head">
            <h2 id="calendar-details-heading">Meeting details</h2>
            <p className="section__source">Agendas and related records</p>
          </div>
          <ol className="stack calendar">
            {visible.map((meeting) => (
              <li key={meeting.id}>
                <MeetingCard meeting={meeting} agenda={agendaFor(meeting, documents)} headingLevel={3} />
              </li>
            ))}
          </ol>
        </section>
      ) : (
        <EmptyState title="No meetings match this calendar view.">
          <p>Try another month or choose all meeting types.</p>
          <Link className="button button--ghost" to={href('/calendar')}>Reset calendar</Link>
        </EmptyState>
      )}
    </div>
  );
}