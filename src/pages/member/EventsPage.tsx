import React, { useState, useEffect } from 'react';
import { dataService } from '../../lib/supabase';
import { Event } from '../../types';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Users, 
  ArrowRight, 
  CheckCircle2, 
  ExternalLink,
  X, 
  Video
} from 'lucide-react';

export const EventsPage: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [activeTab, setActiveTab] = useState('All');
  const [loading, setLoading] = useState(true);
  const [registeredIds, setRegisteredIds] = useState<Record<string, boolean>>({});
  const [activeEventModal, setActiveEventModal] = useState<Event | null>(null);

  const filterTabs = ['All', 'Webinars', 'Conferences', 'Workshops', 'State Chapters'];

  useEffect(() => {
    setLoading(true);
    dataService.getEvents(activeTab).then((res) => {
      setEvents(res);
      setLoading(false);
    });
  }, [activeTab]);

  const handleRegister = (e: React.MouseEvent, evt: Event) => {
    e.stopPropagation();
    setRegisteredIds(prev => ({ ...prev, [evt.id]: true }));
    setActiveEventModal(evt);
  };

  return (
    <div className="space-y-6">
      {/* Header matching Reference Bottom Center */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-brand-navy">
            Upcoming Events
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Webinars, conferences and workshops for homeopathic professionals.
          </p>
        </div>
      </div>

      {/* Filter Tabs matching Reference */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-brand-border/70">
        {filterTabs.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                isActive
                  ? 'bg-brand-teal text-white shadow-xs'
                  : 'bg-white text-brand-muted hover:bg-brand-ice/60 border border-brand-border/80'
              }`}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* Events List Cards matching Reference */}
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
          <h3 className="text-base font-bold text-brand-navy">No events found in this category</h3>
          <p className="text-xs text-slate-500">Check back soon for new webinar announcements.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((evt) => {
            const isRegistered = registeredIds[evt.id];
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
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-teal-300 mt-0.5">
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
                      <span className="text-[10px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                        {evt.format}
                      </span>
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
                    </div>
                  </div>
                </div>

                {/* Right Action Button */}
                <div className="w-full md:w-auto flex items-center justify-end gap-3 flex-shrink-0">
                  <button
                    onClick={(e) => handleRegister(e, evt)}
                    className={`w-full md:w-auto px-5 py-2.5 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 ${
                      isRegistered
                        ? 'bg-brand-soft-teal text-brand-teal border border-brand-teal/30'
                        : 'bg-brand-teal hover:bg-teal-800 text-white shadow-xs'
                    }`}
                  >
                    {isRegistered ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-brand-teal" />
                        <span>Registered</span>
                      </>
                    ) : (
                      <>
                        <span>Register</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
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
                  <span className="text-slate-500">Location:</span>
                  <span className="font-semibold text-brand-navy">{activeEventModal.location}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Organizer:</span>
                  <span className="font-semibold text-brand-navy">{activeEventModal.organizer}</span>
                </div>
              </div>

              {registeredIds[activeEventModal.id] && (
                <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-teal-800 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0" />
                  <span>You are confirmed for this session! A calendar invite has been sent.</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setActiveEventModal(null)}
                className="px-4 py-2 border border-slate-200 text-xs font-semibold text-slate-600 rounded-xl"
              >
                Close
              </button>
              {!registeredIds[activeEventModal.id] && (
                <button
                  onClick={(e) => handleRegister(e, activeEventModal)}
                  className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-semibold shadow"
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
