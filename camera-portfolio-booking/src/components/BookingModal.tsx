'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Service } from '@/types';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check, ArrowRight, MessageCircle } from 'lucide-react';

interface Props {
  service: Service;
  onClose: () => void;
}

// Today's date as YYYY-MM-DD in the user's local time (not UTC)
function todayLocal(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// "+91 98765 43210" / "098765 43210" -> "9876543210"
function normalizePhone(raw: string): string {
  let digits = raw.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  return digits;
}

export default function BookingModal({ service, onClose }: Props) {
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [shootDate, setShootDate] = useState('');
  const [utrNumber, setUtrNumber] = useState('');
  const [bookedDates, setBookedDates] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const upiId = (process.env.NEXT_PUBLIC_UPI_ID || 'yourname@upi').trim();
  const ownerName = process.env.NEXT_PUBLIC_OWNER_NAME || 'Photographer';
  const whatsapp = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '').replace(/\D/g, '');

  const needsPayment = service.advance_amount > 0;

  const upiLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(ownerName)}&am=${service.advance_amount}&cu=INR&tn=${encodeURIComponent('Token for ' + service.title)}`;

  const loadBookedDates = async () => {
    const { data } = await supabase.rpc('booked_dates');
    if (data) setBookedDates(data as string[]);
  };

  useEffect(() => {
    loadBookedDates();
  }, []);

  const today = todayLocal();
  const upcomingTaken = bookedDates.filter((d) => d >= today).slice(0, 12);

  const handleCopyUpi = async () => {
    try {
      await navigator.clipboard.writeText(upiId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setErrorMsg('Could not copy. Please select and copy the UPI ID manually.');
    }
  };

  const handleDateChange = (value: string) => {
    setShootDate(value);
    if (bookedDates.includes(value)) {
      setErrorMsg('This date is already booked. Please choose another date.');
    } else {
      setErrorMsg('');
    }
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const phone = normalizePhone(clientPhone);
    const utr = utrNumber.replace(/\s/g, '');

    if (!/^[6-9]\d{9}$/.test(phone)) {
      setErrorMsg('Please enter a valid 10-digit Indian mobile number.');
      return;
    }
    if (needsPayment && !/^\d{12}$/.test(utr)) {
      setErrorMsg('UTR / UPI reference must be exactly 12 digits.');
      return;
    }
    if (shootDate < today) {
      setErrorMsg('Please choose a future date.');
      return;
    }
    if (bookedDates.includes(shootDate)) {
      setErrorMsg('This date is already booked. Please choose another date.');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.rpc('create_booking', {
        p_name: clientName.trim(),
        p_phone: phone,
        p_date: shootDate,
        p_service_id: service.id,
        p_utr: needsPayment ? utr : '',
      });

      if (error) {
        if (error.code === '23505') {
          if (error.message.includes('unique_utr')) {
            setErrorMsg('This UTR number has already been used for a booking.');
          } else {
            setErrorMsg('Sorry, this date was just booked by someone else. Please pick another date.');
            await loadBookedDates();
          }
        } else {
          setErrorMsg(error.message || 'Something went wrong. Please try again.');
        }
        return;
      }

      setIsSuccess(true);
    } catch {
      setErrorMsg('Network error. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const whatsappLink = whatsapp
    ? `https://wa.me/${whatsapp}?text=${encodeURIComponent(
        `Hi, I just booked "${service.title}" for ${shootDate}.${needsPayment ? ` UTR: ${utrNumber}.` : ''} Name: ${clientName}.`
      )}`
    : '';

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-panel border border-line w-full max-w-lg rounded-2xl p-6 max-h-[90vh] overflow-y-auto shadow-[0_0_80px_-20px_rgba(255,179,71,0.3)] animate-pop">
        <div className="flex justify-between items-center pb-4 border-b border-zinc-800 mb-4">
          <h3 className="font-display text-xl text-ivory">Book: {service.title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-zinc-400 hover:text-white text-sm"
          >
            ✕
          </button>
        </div>

        {isSuccess ? (
          <div className="text-center py-8 space-y-4">
            <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-6 h-6" />
            </div>
            <h4 className="text-xl font-bold text-white">Booking Request Received!</h4>
            <p className="text-sm text-zinc-400">
              Your date <span className="text-emerald-400 font-semibold">{shootDate}</span> is on hold.
              {needsPayment ? (
                <>It will be <span className="text-white font-semibold">confirmed once your ₹{service.advance_amount} payment is verified</span>.</>
              ) : (
                <>It will be <span className="text-white font-semibold">confirmed by the studio</span> shortly.</>
              )}
            </p>
            <div className="flex flex-col items-center gap-3 pt-2">
              {whatsappLink && (
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-black font-semibold text-sm px-5 py-2.5 rounded-lg"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Message us on WhatsApp</span>
                </a>
              )}
              <button
                type="button"
                onClick={onClose}
                className="bg-white text-black font-semibold text-sm px-6 py-2.5 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleBookingSubmit} className="space-y-4">
            {errorMsg && (
              <div className="p-3 text-xs bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg">
                {errorMsg}
              </div>
            )}

            <div>
              <label className="text-xs text-zinc-400 block mb-1">Your Full Name</label>
              <input
                type="text"
                required
                minLength={2}
                maxLength={80}
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="text-xs text-zinc-400 block mb-1">Phone / WhatsApp Number</label>
              <input
                type="tel"
                required
                placeholder="10-digit mobile number"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="text-xs text-zinc-400 block mb-1">Select Shoot Date</label>
              <input
                type="date"
                required
                min={today}
                value={shootDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm"
              />
              {upcomingTaken.length > 0 && (
                <div className="mt-2">
                  <span className="text-[10px] text-zinc-500 block mb-1">Already booked (unavailable):</span>
                  <div className="flex flex-wrap gap-1.5">
                    {upcomingTaken.map((d) => (
                      <span
                        key={d}
                        className="text-[10px] font-mono bg-zinc-800 border border-zinc-700 text-zinc-400 px-2 py-0.5 rounded"
                      >
                        {d}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {needsPayment ? (
            <>
            {/* UPI Section */}
            <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-400">Total Price:</span>
                <span className="font-semibold">₹{service.total_price}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-400">Advance Token to Confirm:</span>
                <span className="font-bold text-emerald-400">₹{service.advance_amount}</span>
              </div>

              <div className="pt-2">
                <span className="text-xs text-zinc-500 block mb-1">Owner UPI ID</span>
                <div className="flex items-center justify-between bg-zinc-900 border border-zinc-800 px-3 py-2 rounded-lg">
                  <span className="text-xs font-mono text-zinc-200 select-all">{upiId}</span>
                  <button
                    type="button"
                    onClick={handleCopyUpi}
                    className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center pt-2">
                <div className="bg-white p-2 rounded-lg mb-2">
                  <QRCodeSVG value={upiLink} size={128} />
                </div>
                <a href={upiLink} className="text-xs text-blue-400 hover:underline flex items-center gap-1">
                  <span>Open directly in GPay / PhonePe / Paytm</span>
                  <ArrowRight className="w-3 h-3" />
                </a>
              </div>
            </div>

            <div>
              <label className="text-xs text-zinc-400 block mb-1">UPI Transaction ID / UTR Number</label>
              <input
                type="text"
                required
                inputMode="numeric"
                maxLength={14}
                placeholder="12-digit UPI reference number"
                value={utrNumber}
                onChange={(e) => setUtrNumber(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 text-white font-mono rounded-lg px-3 py-2 text-sm"
              />
              <span className="text-[10px] text-zinc-500 mt-1 block">
                Found in your payment app receipt after paying. Your date is confirmed once we verify the payment.
              </span>
            </div>

            </>
            ) : (
              <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Total Price:</span>
                  <span className="font-semibold">₹{service.total_price}</span>
                </div>
                <p className="text-xs text-emerald-400">No advance needed. Submit to request this date, and the studio will confirm it.</p>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-gradient-to-r from-tungsten to-orange-400 hover:brightness-110 disabled:opacity-60 text-ink font-bold py-3 rounded-xl text-sm transition"
            >
              {submitting ? 'Submitting...' : needsPayment ? `I've Paid ₹${service.advance_amount} - Submit Booking` : 'Request This Date'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
