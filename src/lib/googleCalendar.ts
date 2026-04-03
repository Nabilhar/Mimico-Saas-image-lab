// src/lib/googleCalendar.ts

export async function createSmartSchedule(
    accessToken: string, 
    businessName: string, 
    slots: { date?: string; time: string }[], 
    strategy: string
  ) {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const results = [];
  
    // Determine if this should repeat on the calendar
    const isRecurring = ['daily', '2-day', '3-day', 'eod', 'weekly', '2-week'].includes(strategy);
  
    for (const slot of slots) {
      // If no date is picked (for recurring), use today as the starting point
      const datePart = slot.date || new Date().toISOString().split('T')[0];
      const startDateTime = new Date(`${datePart}T${slot.time}:00`);
  
      const event: any = {
        summary: `📱 Content Generation: ${businessName}`,
        description: `Strategy: ${strategy.toUpperCase()}\n\nOpen Dashboard: ${window.location.origin}/dashboard`,
        start: { 
          dateTime: startDateTime.toISOString(), 
          timeZone 
        },
        end: { 
          dateTime: new Date(startDateTime.getTime() + 20 * 60000).toISOString(), 
          timeZone 
        },
        reminders: { 
          useDefault: false, 
          overrides: [{ method: 'popup', minutes: 10 }] 
        },
      };
  
      // Apply Recurrence Rules
      if (isRecurring) {
        if (strategy === 'weekly') {
          event.recurrence = ['RRULE:FREQ=WEEKLY;BYDAY=MO']; // Every Monday
        } else if (strategy === 'eod') {
          event.recurrence = ['RRULE:FREQ=DAILY;INTERVAL=2']; // Every 2nd day
        } else if (strategy === '2-week') {
          event.recurrence = ['RRULE:FREQ=WEEKLY;BYDAY=TU,TH']; // Tue/Thu
        } else {
          event.recurrence = ['RRULE:FREQ=DAILY']; // Daily, 2-day, 3-day
        }
      }
  
      const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${accessToken}`, 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify(event),
      });
      results.push(res.ok);
    }
    return results.every(r => r === true);
  }