// app/contact/page.tsx

'use client';

import { useState } from 'react';
import { SiteHeader } from '@/components/SiteHeader'; // Assuming you have this

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFeedback({ type: '', message: '' });

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject, message }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok.');
      }

      // Success
      setFeedback({ type: 'success', message: 'Thank you! Your message has been sent.' });
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');

    } catch (error) {
      setFeedback({ type: 'error', message: 'Something went wrong. Please try again later.' });
    } finally {
      setLoading(false);
    }
  };

  const isFormInvalid = !name || !email || !subject || !message;

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-4 sm:px-6 py-12 sm:py-20">
        <div className="text-center">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">Get in Touch</h1>
          <p className="mt-3 text-slate-500 text-lg">
            Have a question or feedback? We’d love to hear from you.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-12 bg-white p-6 sm:p-10 sm:rounded-3xl sm:border border-slate-200 sm:shadow-sm space-y-6">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="text-sm font-semibold text-slate-700">Full Name</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-cyan-500 outline-none transition"
                required
              />
            </div>
            <div>
              <label htmlFor="email" className="text-sm font-semibold text-slate-700">Email Address</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-cyan-500 outline-none transition"
                required
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="subject" className="text-sm font-semibold text-slate-700">Subject</label>
            <input
              id="subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="mt-1 w-full border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-cyan-500 outline-none transition"
              required
            />
          </div>

          <div>
            <label htmlFor="message" className="text-sm font-semibold text-slate-700">Message</label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              className="mt-1 w-full border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-cyan-500 outline-none transition"
              required
            />
          </div>
          
          {feedback.message && (
            <div className={`p-4 rounded-xl text-sm font-medium ${
              feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'
            }`}>
              {feedback.message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || isFormInvalid}
            className={`w-full font-bold py-4 rounded-2xl transition shadow-lg ${
              loading ? 'bg-slate-400 cursor-wait' 
              : isFormInvalid ? 'bg-slate-300 cursor-not-allowed'
              : 'bg-cyan-800 text-white hover:bg-cyan-900 active:scale-95'
            }`}
          >
            {loading ? 'Sending...' : 'Send Message'}
          </button>

        </form>
      </main>
    </>
  );
}