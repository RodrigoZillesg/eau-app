import React, { useState, useEffect } from 'react';
import { Clock, Calendar, MapPin, Video } from 'lucide-react';

interface EventCountdownProps {
  startDate: string;
  eventTitle: string;
  locationName?: string;
  virtualLink?: string;
  locationType?: 'physical' | 'virtual' | 'hybrid';
}

export function EventCountdown({ 
  startDate, 
  eventTitle, 
  locationName,
  virtualLink,
  locationType = 'physical'
}: EventCountdownProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isLive: false,
    isPast: false
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const eventTime = new Date(startDate).getTime();
      const difference = eventTime - now;

      if (difference < 0) {
        // Event has started
        const hoursSinceStart = Math.abs(difference) / (1000 * 60 * 60);
        if (hoursSinceStart < 2) {
          // Event is live (within 2 hours of start)
          setTimeLeft({
            days: 0,
            hours: 0,
            minutes: 0,
            seconds: 0,
            isLive: true,
            isPast: false
          });
        } else {
          // Event is past
          setTimeLeft({
            days: 0,
            hours: 0,
            minutes: 0,
            seconds: 0,
            isLive: false,
            isPast: true
          });
        }
      } else {
        // Event is in the future
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft({
          days,
          hours,
          minutes,
          seconds,
          isLive: false,
          isPast: false
        });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [startDate]);

  if (timeLeft.isPast) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
        <div className="flex items-center justify-center space-x-2 text-gray-600">
          <Calendar className="h-5 w-5" />
          <p className="text-lg font-medium">This event has ended</p>
        </div>
      </div>
    );
  }

  if (timeLeft.isLive) {
    return (
      <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-lg p-6 text-white animate-pulse">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="h-3 w-3 bg-white rounded-full animate-pulse"></div>
            <p className="text-2xl font-bold">EVENT IS LIVE NOW!</p>
            <div className="h-3 w-3 bg-white rounded-full animate-pulse"></div>
          </div>
          
          {virtualLink && (locationType === 'virtual' || locationType === 'hybrid') && (
            <a
              href={virtualLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 bg-white text-red-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
            >
              <Video className="h-5 w-5" />
              <span>Join Virtual Event</span>
            </a>
          )}
          
          {locationName && (locationType === 'physical' || locationType === 'hybrid') && (
            <div className="mt-4 flex items-center justify-center space-x-2">
              <MapPin className="h-5 w-5" />
              <span className="text-lg">{locationName}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-500 to-teal-500 rounded-lg p-6 text-white">
      <div className="text-center mb-4">
        <div className="flex items-center justify-center space-x-2 mb-2">
          <Clock className="h-5 w-5" />
          <p className="text-lg font-semibold">Event Starts In</p>
        </div>
        <p className="text-sm opacity-90">{eventTitle}</p>
      </div>
      
      <div className="grid grid-cols-4 gap-4">
        <div className="text-center">
          <div className="bg-white/20 rounded-lg p-3 backdrop-blur">
            <div className="text-3xl font-bold">{String(timeLeft.days).padStart(2, '0')}</div>
            <div className="text-xs uppercase opacity-90 mt-1">Days</div>
          </div>
        </div>
        
        <div className="text-center">
          <div className="bg-white/20 rounded-lg p-3 backdrop-blur">
            <div className="text-3xl font-bold">{String(timeLeft.hours).padStart(2, '0')}</div>
            <div className="text-xs uppercase opacity-90 mt-1">Hours</div>
          </div>
        </div>
        
        <div className="text-center">
          <div className="bg-white/20 rounded-lg p-3 backdrop-blur">
            <div className="text-3xl font-bold">{String(timeLeft.minutes).padStart(2, '0')}</div>
            <div className="text-xs uppercase opacity-90 mt-1">Minutes</div>
          </div>
        </div>
        
        <div className="text-center">
          <div className="bg-white/20 rounded-lg p-3 backdrop-blur">
            <div className="text-3xl font-bold">{String(timeLeft.seconds).padStart(2, '0')}</div>
            <div className="text-xs uppercase opacity-90 mt-1">Seconds</div>
          </div>
        </div>
      </div>
      
      <div className="mt-4 text-center">
        <p className="text-sm opacity-90">
          {new Date(startDate).toLocaleDateString('en-AU', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </p>
      </div>
    </div>
  );
}