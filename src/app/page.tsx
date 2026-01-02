'use client'

import { useState } from 'react'

type Language = 'hu' | 'en' | 'de'

const content = {
  hu: {
    flag: 'HU',
    headline: 'Honlapunk megújul – hogy a vendégélmény már a foglalásnál kezdődjön!',
    description:
      'Hamarosan egy teljesen megújult weboldallal várjuk, ahol a Lillybeth vendégházakba történő foglalás gyors, egyszerű és kényelmes lesz. Célunk, hogy már az első kattintástól kezdve érezze: jó helyen jár.',
    bookingInfo:
      'Foglaljon közvetlenül nálunk, garantáltan a legjobb áron, rejtett költségek nélkül – közvetlen kapcsolatban a szállásadóval.',
    contactIntro: 'Addig is örömmel segítünk személyesen az alábbi elérhetőségeken:',
    tagline: 'Lillybeth Vendégházak – ahol a pihenés már a tervezésnél elkezdődik.',
    contact: 'Kapcsolat',
    comingSoon: 'Hamarosan'
  },
  en: {
    flag: 'EN',
    headline:
      'Our new website will launch soon – with new tools and a better, easy booking experience!',
    description:
      'Soon we will welcome you with a completely redesigned website, where booking your stay at Lillybeth Guesthouses will be fast, simple and convenient.',
    bookingInfo:
      'Book directly with us and enjoy the guaranteed best price, with no hidden fees and direct contact with the accommodation provider.',
    contactIntro:
      'Until then, we are happy to assist you personally via the following contact details:',
    tagline: 'Lillybeth Guesthouses – where relaxation begins already in the planning stage.',
    contact: 'Contact',
    comingSoon: 'Coming Soon'
  },
  de: {
    flag: 'DE',
    headline:
      'Unsere neu programmierte Website wird bald starten – mit neuen Tools und einem besseren, vereinfachten Buchungserlebnis!',
    description:
      "Schon bald begrüßen wir Sie mit einer komplett erneuerten Website, auf der die Buchung in den Lillybeth Gästehäusern noch schneller, einfacher und bequemer sein wird. Schon beim ersten Klick werden Sie spüren: 'Hier sind wir richtig!'",
    bookingInfo:
      'Buchen Sie direkt bei uns und sichern Sie sich den garantiert besten Preis – ohne versteckte Kosten durch direkten Kontakt zum Gastgeber.',
    contactIntro:
      'Bis dahin sind wir jederzeit persönlich unter folgenden Kontaktdaten für Sie da:',
    tagline: 'Lillybeth Gästehäuser – Premium Aufenthalt am Plattensee.',
    contact: 'Kontaktdaten',
    comingSoon: 'Demnächst verfügbar'
  }
}

export default function Home() {
  const [lang, setLang] = useState<Language>('en')
  const t = content[lang]

  return (
    <main className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-amber-50/30">
      {/* Decorative background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-amber-100/40 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-20 w-60 h-60 bg-stone-100/60 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 right-1/4 w-72 h-72 bg-amber-50/50 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen max-md:pt-40 px-4 py-12 sm:px-6 lg:px-8">
        {/* Language Switcher */}
        <div className="absolute top-6 right-6 sm:top-8 sm:right-8">
          <div className="flex gap-1 p-1 bg-white/80 backdrop-blur-sm rounded-full shadow-lg shadow-stone-200/50 border border-stone-100">
            {(['hu', 'en', 'de'] as Language[]).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-300 ${
                  lang === l
                    ? 'bg-stone-800 text-white shadow-md'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                {content[l].flag}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content Card */}
        <div className="w-full max-w-2xl">
          {/* Logo / Brand */}
          <div className="text-center mb-10">
            <div className="inline-block">
              <h1 className="font-[family-name:var(--font-playfair)] text-4xl sm:text-5xl lg:text-6xl font-semibold text-stone-800 tracking-tight">
                Lillybeth
              </h1>
              <div className="mt-2 flex items-center justify-center gap-3 text-stone-500">
                <span className="h-px w-8 bg-gradient-to-r from-transparent to-stone-300" />
                <span className="text-xs uppercase tracking-[0.25em] font-medium">Guesthouses</span>
                <span className="h-px w-8 bg-gradient-to-l from-transparent to-stone-300" />
              </div>
            </div>
          </div>

          {/* Content Card */}
          <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-xl shadow-stone-200/50 border border-white/80 p-8 sm:p-10 lg:p-12 transition-all duration-500">
            {/* Coming Soon Badge */}
            <div className="flex justify-center mb-8">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-50 to-amber-100/80 text-amber-800 text-sm font-medium border border-amber-200/50 shadow-sm">
                <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                {t.comingSoon}
              </span>
            </div>

            {/* Headline */}
            <h2 className="font-[family-name:var(--font-playfair)] text-2xl sm:text-3xl text-stone-800 text-center leading-relaxed mb-6">
              {t.headline}
            </h2>

            {/* Description */}
            <p className="text-stone-600 text-center leading-relaxed mb-6">{t.description}</p>

            {/* Booking Info */}
            <div className="bg-gradient-to-r from-stone-50 to-stone-100/50 rounded-2xl p-6 mb-8 border border-stone-100">
              <p className="text-stone-700 text-center font-medium leading-relaxed">
                {t.bookingInfo}
              </p>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4 my-8">
              <span className="flex-1 h-px bg-gradient-to-r from-transparent via-stone-200 to-transparent" />
              <span className="text-stone-400 text-xs uppercase tracking-widest">{t.contact}</span>
              <span className="flex-1 h-px bg-gradient-to-r from-transparent via-stone-200 to-transparent" />
            </div>

            {/* Contact Intro */}
            <p className="text-stone-600 text-center mb-6">{t.contactIntro}</p>

            {/* Contact Details */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
              <a
                href="mailto:info@lillybeth.hu"
                className="group flex items-center gap-3 px-6 py-3 bg-white rounded-2xl shadow-lg shadow-stone-200/50 border border-stone-100 hover:shadow-xl hover:border-stone-200 hover:-translate-y-0.5 transition-all duration-300"
              >
                <span className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-amber-100 to-amber-200/80 rounded-xl text-amber-700 group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </span>
                <span className="text-stone-700 font-medium">info@lillybeth.hu</span>
              </a>

              <a
                href="https://wa.me/36705316016"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 px-6 py-3 bg-white rounded-2xl shadow-lg shadow-stone-200/50 border border-stone-100 hover:shadow-xl hover:border-stone-200 hover:-translate-y-0.5 transition-all duration-300"
              >
                <span className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-green-100 to-green-200/80 rounded-xl text-green-700 group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                </span>
                <span className="text-stone-700 font-medium">+36 70 531 6016</span>
              </a>
            </div>
          </div>

          {/* Tagline */}
          <div className="mt-10 text-center">
            <p className="font-[family-name:var(--font-playfair)] text-lg sm:text-xl text-stone-600 italic">
              {t.tagline}
            </p>
          </div>

          {/* Property Names */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-4 text-stone-400 text-sm">
            <span className="px-4 py-2 rounded-full bg-white/60 backdrop-blur-sm border border-stone-100 shadow-sm">
              Villa Lillybeth
            </span>
            <span className="px-4 py-2 rounded-full bg-white/60 backdrop-blur-sm border border-stone-100 shadow-sm">
              Lillybeth Garden Rooms
            </span>
            <span className="px-4 py-2 rounded-full bg-white/60 backdrop-blur-sm border border-stone-100 shadow-sm">
              Lillybeth Lakeside
            </span>
          </div>
        </div>

        {/* Footer */}
        <footer className="absolute bottom-6 left-0 right-0 text-center text-stone-400 text-xs">
          <p>&copy; {new Date().getFullYear()} Lillybeth Guesthouses. All rights reserved.</p>
        </footer>
      </div>
    </main>
  )
}
