import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { dataService } from '../../lib/supabase';
import { Event, EventRegistration } from '../../types';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Users, 
  ArrowRight, 
  CheckCircle2, 
  ExternalLink,
  X, 
  Video,
  AlertCircle,
  CalendarCheck
} from 'lucide-react';
import { useConfirm } from '../../components/feedback/ToastProvider';

export const EventsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const confirmAction = useConfirm();
  const [events, setEvents] = useState<Event[]>([]);
  const [activeTab, setActiveTab] = useState('All');
  const [loading, setLoading] = useState(true);
  const [userRegistrations, setUserRegistrations] = useState<EventRegistration[]>([]);
  const [activeEventModal, setActiveEventModal] = useState<Event | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'info'; text: string } | null>(null);

  const filterTabs = ['All', 'My Registered Events', 'Webinars', 'Conferences', 'Workshops', 'State Chapters'];

  const loadEventsAndRegistrations = async () => {
    setLoading(true);
    try {
      const allEvents = await dataService.getEvents();
      let regs: EventRegistration[] = [];
      if (currentUser) {
        regs = await dataService.getUserEventRegistrations(currentUser.id);
        setUserRegistrations(regs);
      }

      if (activeTab === 'My Registered Events') {
        const regIds = new Set(regs.map(r => r.event_id));
        setEvents(allEvents.filter(e => regIds.has(e.id)));
      } else if (activeTab === 'All') {
        setEvents(allEvents);
      } else {
        const filtered = await dataService.getEvents(activeTab);
        setEvents(filtered);
      }
    } catch (err) {
      console.error('Error loading events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEventsAndRegistrations();
  }, [activeTab, currentUser]);

  const isUserRegistered = (eventId: string) => {
    return userRegistrations.some(r => r.event_id === eventId);
  };

  const handleRegister = async (e: React.MouseEvent, evt: Event) => {
    e.stopPropagation();
    if (!currentUser) return;

    try {
      const reg = await dataService.registerForEvent(evt.id, currentUser);
      if (reg) {
        setUserRegistrations(prev => [...prev, reg]);
        setStatusMessage({
          type: 'success',
          text: `You have successfully registered for "${evt.title}". Access details are now available.`
        });
        setTimeout(() => setStatusMessage(null), 5000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancelRegistration = async (e: React.MouseEvent, evtId: string) => {
    e.stopPropagation();
    if (!currentUser) return;
    if (!(await confirmAction('Cancel your registration for this session?', { confirmLabel: 'Cancel registration', danger: true }))) return;

    try {
      await dataService.cancelEventRegistration(evtId, currentUser.id);
      setUserRegistrations(prev => prev.filter(r => r.event_id !== evtId));
      setStatusMessage({
        type: 'info',
        text: 'Your registration has been cancelled.'
      });
      setTimeout(() => setStatusMessage(null), 4000);
      if (activeTab === 'My Registered Events') {
        setEvents(prev => prev.filter(e => e.id !== evtId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-brand-navy">
            Webinars & Clinical Events
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Peer study circles, national conferences, and accredited continuing medical education.
          </p>
        </div>
      </div>

      {statusMessage && (
        <div className={`p-4 rounded-xl text-xs flex items-center justify-between animate-fade-in ${
          statusMessage.type === 'success' 
            ? 'bg-teal-50 border border-teal-200 text-teal-800' 
            : 'bg-slate-100 border border-slate-200 text-slate-800'
        }`}>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0" />
            <span>{statusMessage.text}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-slate-500 hover:text-slate-800">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-brand-border/70">
        {filterTabs.map((tab) => {
          const isActive = activeTab === tab;
          const isMyTab = tab === 'My Registered Events';
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
                isActive
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              {isMyTab && <CalendarCheck className="w-3.5 h-3.5" />}
              <span>{tab}</span>
              {isMyTab && userRegistrations.length > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[11px] ${
                  isActive ? 'bg-teal-800 text-teal-100' : 'bg-slate-100 text-slate-700'
                }`}>
                  {userRegistrations.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Events List Cards */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs animate-pulse space-y-3">
              <div className="h-5 bg-slate-200 rounded w-1/3"></div>
              <div className="h-4 bg-slate-100 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-3">
          <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-brand-navy">
            {activeTab === 'My Registered Events' ? 'No registered sessions yet' : 'No events found in this category'}
          </h3>
          <p className="text-xs text-slate-500">
            {activeTab === 'My Registered Events' 
              ? 'Browse the All tab to find upcoming CME webinars and save your seat.' 
              : 'Check back soon for new webinar announcements.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((evt) => {
            const registered = isUserRegistered(evt.id);
            return (
              <div
                key={evt.id}
                onClick={() => setActiveEventModal(evt)}
                className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-card hover:border-teal-300 transition flex flex-col md:flex-row items-start md:items-center justify-between gap-6 cursor-pointer group"
              >
                {/* Left: Date Badge + Image + Details */}
                <div className="flex items-start gap-5">
                  {/* Date Badge */}
                  <div className="w-16 h-16 rounded-2xl bg-[#0F1E36] text-white flex flex-col items-center justify-center flex-shrink-0 text-center shadow-xs">
                    <span className="text-xl font-bold leading-none">{evt.date_badge_day}</span>
                    <span className="text-[11px] uppercase tracking-wider font-semibold text-teal-300 mt-0.5">
                      {evt.date_badge_month}
                    </span>
                  </div>

                  {/* Thumbnail */}
                  {evt.image_url && (
                    <img
                      src={evt.image_url}
                      alt={evt.title}
                      className="w-20 h-16 rounded-xl object-cover hidden sm:block flex-shrink-0 ring-1 ring-slate-100"
                    />
                  )}

                  {/* Info */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                        {evt.format}
                      </span>
                      {registered && (
                        <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Seat Reserved</span>
                        </span>
                      )}
                      <span className="text-xs text-slate-400 font-medium">
                        {evt.time_display}
                      </span>
                    </div>

                    <h2 className="text-sm sm:text-base font-bold text-brand-navy group-hover:text-teal-800 transition">
                      {evt.title}
                    </h2>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span>Speaker: <strong className="text-slate-700">{evt.speaker}</strong></span>
                      <span>•</span>
                      <span>{evt.organizer}</span>
                      <span>•</span>
                      <span>{evt.location}</span>
                    </div>
                  </div>
                </div>

                {/* Right Action Buttons */}
                <div className="w-full md:w-auto flex items-center justify-end gap-2.5 flex-shrink-0">
                  {registered ? (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveEventModal(evt);
                        }}
                        className="px-4 py-2 rounded-xl text-xs font-semibold bg-teal-50 text-teal-800 hover:bg-teal-100 transition"
                      >
                        Join / Access Details
                      </button>
                      <button
                        onClick={(e) => handleCancelRegistration(e, evt.id)}
                        className="px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        title="Cancel registration"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={(e) => handleRegister(e, evt)}
                      className="w-full md:w-auto px-5 py-2.5 rounded-xl text-xs font-semibold bg-teal-700 hover:bg-teal-800 text-white shadow-xs transition flex items-center justify-center gap-1.5"
                    >
                      <span>Register Now</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Event Details / Registration Modal */}
      {activeEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">
                {activeEventModal.format} Details
              </span>
              <button onClick={() => setActiveEventModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <h2 className="text-lg font-serif font-bold text-brand-navy leading-snug">
                {activeEventModal.title}
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                {activeEventModal.summary}
              </p>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Speaker:</span>
                  <span className="font-semibold text-brand-navy">{activeEventModal.speaker} ({activeEventModal.speaker_title || 'Consultant'})</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Date & Timing:</span>
                  <span className="font-semibold text-brand-navy">{activeEventModal.time_display}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Location / Format:</span>
                  <span className="font-semibold text-brand-navy">{activeEventModal.location} ({activeEventModal.format})</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Organizer:</span>
                  <span className="font-semibold text-brand-navy">{activeEventModal.organizer}</span>
                </div>
              </div>

              {/* Verified link or meeting room info */}
              {isUserRegistered(activeEventModal.id) ? (
                <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl text-teal-900 text-xs space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-teal-800">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0" />
                    <span>Your Seat is Confirmed</span>
                  </div>
                  <p className="text-xs text-teal-800">
                    Meeting link: <a href="https://meet.homeocircle.in/cme-hall-1" target="_blank" rel="noopener noreferrer" className="font-semibold underline inline-flex items-center gap-0.5">https://meet.homeocircle.in/cme-hall-1 <ExternalLink className="w-3 h-3" /></a>
                  </p>
                  <p className="text-[11px] text-teal-700">
                    The video room opens 15 minutes before scheduled start time. Verification token is attached to your registered account.
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span>Session link and CME certificate credentials become accessible upon registration.</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setActiveEventModal(null)}
                className="px-4 py-2 border border-slate-200 text-xs font-semibold text-slate-600 rounded-xl hover:bg-slate-50"
              >
                Close
              </button>
              {isUserRegistered(activeEventModal.id) ? (
                <button
                  onClick={(e) => {
                    handleCancelRegistration(e, activeEventModal.id);
                    setActiveEventModal(null);
                  }}
                  className="px-4 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-xl text-xs font-semibold transition"
                >
                  Cancel Registration
                </button>
              ) : (
                <button
                  onClick={(e) => handleRegister(e, activeEventModal)}
                  className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-semibold shadow transition"
                >
                  Confirm Registration
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
