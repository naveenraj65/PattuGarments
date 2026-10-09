import React, { useState } from 'react';
import { ArrowUpRight, MapPin, Mail, Phone, Send } from 'lucide-react';

const directionsUrl = 'https://maps.app.goo.gl/47UGFEFeJ5S5cPbQ7';
const email = 'pattugarments@gmail.com';
const phones = ['9791502558', '9965956495'];

const mapTiles = [
  'https://tile.openstreetmap.org/13/5908/3800.png',
  'https://tile.openstreetmap.org/13/5909/3800.png',
  'https://tile.openstreetmap.org/13/5910/3800.png',
  'https://tile.openstreetmap.org/13/5908/3801.png',
  'https://tile.openstreetmap.org/13/5909/3801.png',
  'https://tile.openstreetmap.org/13/5910/3801.png',
  'https://tile.openstreetmap.org/13/5908/3802.png',
  'https://tile.openstreetmap.org/13/5909/3802.png',
  'https://tile.openstreetmap.org/13/5910/3802.png',
];

const inputClass =
  'w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-black focus:ring-1 focus:ring-black';

const Contact: React.FC = () => {
  const [form, setForm] = useState({ name: '', phone: '', email: '', message: '' });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = `Enquiry from ${form.name}`;
    const body = `Name: ${form.name}\nPhone: ${form.phone}\nEmail: ${form.email}\n\n${form.message}`;
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
      <div className="mb-8 max-w-2xl sm:mb-12">
        <p className="mb-3 text-sm font-semibold uppercase text-gray-500">Pattu Garments</p>
        <h1 className="text-3xl font-bold text-gray-900 sm:text-5xl">Contact Us</h1>
        <p className="mt-4 text-base leading-relaxed text-gray-600 sm:text-lg">
          Visit our store, call us, or send an enquiry below.
        </p>
      </div>

      <section className="grid gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(16rem,0.8fr)] lg:items-stretch">
        {/* Clickable map */}
        <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-gray-200 bg-gray-100 sm:aspect-[16/9] lg:aspect-auto lg:min-h-[26rem]">
          <a
            href={directionsUrl}
            target="_blank"
            rel="noreferrer"
            aria-label="Open Pattu Garments location in Google Maps"
            className="group absolute inset-0 block cursor-pointer"
          >
            <div
              className="absolute left-1/2 top-1/2 grid aspect-square -translate-x-1/2 -translate-y-1/2 grid-cols-3 grid-rows-3"
              style={{ width: 'max(100%, 768px)' }}
            >
              {mapTiles.map((tile) => (
                <img key={tile} src={tile} alt="" className="h-full w-full" />
              ))}
              <MapPin
                className="absolute left-[46.3%] top-[49.9%] h-9 w-9 -translate-x-1/2 -translate-y-full fill-red-600 text-red-600 drop-shadow-md"
                aria-hidden="true"
              />
            </div>
            <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-gray-900 shadow transition group-hover:bg-black group-hover:text-white">
              Open in Google Maps
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
          </a>
          {/* Kept outside the main link to avoid nested anchors */}
          <a
            href="https://www.openstreetmap.org/copyright"
            target="_blank"
            rel="noreferrer"
            className="absolute bottom-2 right-2 z-10 rounded bg-white/90 px-2 py-1 text-xs text-gray-700"
          >
            © OpenStreetMap contributors
          </a>
        </div>

        {/* Contact details */}
        <div className="flex flex-col justify-between gap-8 border-t border-gray-200 py-6 lg:border-l lg:border-t-0 lg:pl-8 lg:py-2">
          <div className="space-y-6">
            <div>
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-gray-100">
                <MapPin className="h-5 w-5 text-gray-900" aria-hidden="true" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Store Location</h2>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">12.8452° N, 79.6901° E</p>
            </div>

            <div className="flex items-start gap-3">
              <Phone className="mt-0.5 h-5 w-5 text-gray-900" aria-hidden="true" />
              <div className="flex flex-col text-sm text-gray-700">
                {phones.map((p) => (
                  <a key={p} href={`tel:+91${p}`} className="font-medium hover:underline">
                    +91 {p}
                  </a>
                ))}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Mail className="mt-0.5 h-5 w-5 text-gray-900" aria-hidden="true" />
              <a href={`mailto:${email}`} className="break-all text-sm font-medium text-gray-700 hover:underline">
                {email}
              </a>
            </div>
          </div>

          <a
            href={directionsUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-black px-5 py-3 font-semibold text-white transition-colors hover:bg-gray-800"
          >
            Open in Google Maps
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
      </section>

      Enquiry form
      <section className="mt-12 rounded-xl border border-gray-200 p-6 sm:p-8">
        <h2 className="text-2xl font-bold text-gray-900">Send an Enquiry</h2>
        <p className="mt-1 text-sm text-gray-600">Fill in the details and we'll get back to you.</p>

        {/* <form onSubmit={handleSubmit} className="mt-6 grid gap-4 sm:grid-cols-2">
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            placeholder="Your Name"
            className={inputClass}
          />
          <input
            name="phone"
            type="tel"
            value={form.phone}
            onChange={handleChange}
            required
            pattern="[0-9]{10}"
            title="Enter a 10-digit phone number"
            placeholder="Phone Number"
            className={inputClass}
          />
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Email (optional)"
            className={`${inputClass} sm:col-span-2`}
          />
          <textarea
            name="message"
            value={form.message}
            onChange={handleChange}
            required
            rows={5}
            placeholder="Your Enquiry"
            className={`${inputClass} sm:col-span-2`}
          />
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-black px-6 py-3 font-semibold text-white transition-colors hover:bg-gray-800 sm:col-span-2 sm:w-fit"
          >
            <Send className="h-4 w-4" aria-hidden="true" />
            Send Enquiry
          </button>
        </form> */}
      </section>
    </div>
  );
};

export default Contact;