'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useFrontendLanguage } from '@/contexts/FrontendLanguageContext';
import { siteConfig, getWhatsAppLink, getMailtoLink } from '@/config/site';

interface BuildingData {
  id: string;
  name: Record<string, string> | string;
  slug: string;
  description: Record<string, string> | string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  images: { id: string; url: string; order?: number }[];
}

// Minimal inline markdown renderer (no external deps)
// Supports: # h1, ## h2, ### h3, **bold**, *italic*, ![alt](url), - lists, blank-line paragraphs
function renderMarkdown(md: string): React.ReactNode[] {
  const lines = md.split('\n');
  const nodes: React.ReactNode[] = [];
  let listItems: string[] = [];
  let key = 0;

  const flushList = () => {
    if (listItems.length > 0) {
      nodes.push(
        <ul key={key++} className="list-disc pl-6 mb-4 space-y-1 text-stone-600">
          {listItems.map((item, i) => (
            <li key={i}>{inlineMarkdown(item)}</li>
          ))}
        </ul>
      );
      listItems = [];
    }
  };

  const inlineMarkdown = (text: string): React.ReactNode[] => {
    // Process **bold**, *italic*, ![alt](url)
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let i = 0;

    while (remaining.length > 0) {
      // Image: ![alt](url)
      const imgMatch = remaining.match(/^!\[([^\]]*)\]\(([^)]+)\)/);
      if (imgMatch) {
        parts.push(
          <span key={i++} className="block my-4">
            <Image
              src={imgMatch[2]}
              alt={imgMatch[1]}
              width={800}
              height={400}
              className="rounded-xl w-full object-cover max-h-80"
            />
          </span>
        );
        remaining = remaining.slice(imgMatch[0].length);
        continue;
      }

      // Bold: **text**
      const boldMatch = remaining.match(/^\*\*([^*]+)\*\*/);
      if (boldMatch) {
        parts.push(<strong key={i++}>{boldMatch[1]}</strong>);
        remaining = remaining.slice(boldMatch[0].length);
        continue;
      }

      // Italic: *text*
      const italicMatch = remaining.match(/^\*([^*]+)\*/);
      if (italicMatch) {
        parts.push(<em key={i++}>{italicMatch[1]}</em>);
        remaining = remaining.slice(italicMatch[0].length);
        continue;
      }

      // Plain char
      const nextSpecial = remaining.search(/\*|!\[/);
      if (nextSpecial === -1) {
        parts.push(remaining);
        remaining = '';
      } else if (nextSpecial === 0) {
        parts.push(remaining[0]);
        remaining = remaining.slice(1);
      } else {
        parts.push(remaining.slice(0, nextSpecial));
        remaining = remaining.slice(nextSpecial);
      }
    }
    return parts;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Headings
    if (line.startsWith('### ')) {
      flushList();
      nodes.push(
        <h3 key={key++} className="text-xl font-semibold text-stone-800 mt-6 mb-2">
          {line.slice(4)}
        </h3>
      );
      continue;
    }
    if (line.startsWith('## ')) {
      flushList();
      nodes.push(
        <h2 key={key++} className="font-serif text-3xl text-stone-800 mt-10 mb-3">
          {line.slice(3)}
        </h2>
      );
      continue;
    }
    if (line.startsWith('# ')) {
      flushList();
      nodes.push(
        <h1 key={key++} className="font-serif text-4xl text-stone-800 mb-4">
          {line.slice(2)}
        </h1>
      );
      continue;
    }

    // List item
    if (line.startsWith('- ') || line.startsWith('* ')) {
      listItems.push(line.slice(2));
      continue;
    }

    flushList();

    // Blank line = paragraph break (already handled by spacing)
    if (line.trim() === '') {
      continue;
    }

    // Paragraph
    nodes.push(
      <p key={key++} className="text-stone-600 leading-relaxed mb-4">
        {inlineMarkdown(line)}
      </p>
    );
  }

  flushList();
  return nodes;
}

export function AboutPage() {
  const { t, language } = useFrontendLanguage();
  const [markdownContent, setMarkdownContent] = useState<string>('');
  const [buildings, setBuildings] = useState<BuildingData[]>([]);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mdLoading, setMdLoading] = useState(true);

  // Fetch markdown content
  useEffect(() => {
    setMdLoading(true);
    fetch(`/content/about-${language}.md`)
      .then((r) => {
        if (!r.ok) return fetch('/content/about-en.md');
        return r;
      })
      .then((r) => r.text())
      .then((text) => {
        setMarkdownContent(text);
      })
      .catch(() => setMarkdownContent(''))
      .finally(() => setMdLoading(false));
  }, [language]);

  // Fetch buildings
  useEffect(() => {
    fetch('/api/frontend/buildings')
      .then((r) => r.json())
      .then((data: BuildingData[]) => {
        setBuildings(data);
        if (data.length > 0) setSelectedBuildingId(data[0].id);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const getLocalizedText = (field: Record<string, string> | string | null | undefined): string => {
    if (!field) return '';
    if (typeof field === 'string') return field;
    return field[language] || field['en'] || Object.values(field)[0] || '';
  };

  const selectedBuilding = buildings.find((b) => b.id === selectedBuildingId);

  const getMapEmbedUrl = () => {
    if (selectedBuilding?.latitude && selectedBuilding?.longitude) {
      const name = getLocalizedText(selectedBuilding.name);
      return `https://maps.google.com/maps?q=${selectedBuilding.latitude},${selectedBuilding.longitude}&t=m&z=15&output=embed&iwloc=near&q=${encodeURIComponent(name)}`;
    }
    const first = buildings.find((b) => b.latitude && b.longitude);
    if (first?.latitude && first?.longitude) {
      return `https://maps.google.com/maps?q=${first.latitude},${first.longitude}&t=m&z=15&output=embed`;
    }
    return `https://maps.google.com/maps?q=46.85,17.85&t=m&z=11&output=embed`;
  };

  const getDirectionsUrl = (b: BuildingData) => {
    if (b.latitude && b.longitude) {
      return `https://www.google.com/maps/dir/?api=1&destination=${b.latitude},${b.longitude}`;
    }
    return '#';
  };

  return (
    <div className="bg-white">
      {/* Hero */}
      <div className="bg-stone-900 py-20 px-4 text-center">
        <h1 className="font-serif text-5xl text-white mb-4">{t.aboutPage.title}</h1>
        <p className="text-stone-400 text-lg max-w-xl mx-auto">{t.hero.subtitle}</p>
      </div>

      {/* Markdown Content */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          {mdLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-2 border-stone-300 border-t-stone-600 rounded-full animate-spin" />
            </div>
          ) : markdownContent ? (
            <div>{renderMarkdown(markdownContent)}</div>
          ) : (
            <p className="text-stone-500 text-center py-12">{t.aboutPage.noContent}</p>
          )}
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-stone-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-serif text-3xl text-stone-800 text-center mb-10">{t.aboutPage.contactTitle}</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Phone */}
            <a
              href={`tel:${siteConfig.contact.phone.replace(/\s/g, '')}`}
              className="flex flex-col items-center gap-3 p-6 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow text-center group"
            >
              <div className="w-12 h-12 flex items-center justify-center rounded-full bg-stone-100 group-hover:bg-stone-800 transition-colors">
                <svg className="w-6 h-6 text-stone-600 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-stone-400 uppercase tracking-wide mb-1">Phone</p>
                <p className="text-stone-700 font-medium text-sm">{siteConfig.contact.phone}</p>
              </div>
            </a>

            {/* WhatsApp */}
            <a
              href={getWhatsAppLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-3 p-6 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow text-center group"
            >
              <div className="w-12 h-12 flex items-center justify-center rounded-full bg-stone-100 group-hover:bg-green-500 transition-colors">
                <svg className="w-6 h-6 text-stone-600 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </div>
              <div>
                <p className="text-xs text-stone-400 uppercase tracking-wide mb-1">WhatsApp</p>
                <p className="text-stone-700 font-medium text-sm">{siteConfig.contact.phone}</p>
              </div>
            </a>

            {/* Email */}
            <a
              href={getMailtoLink()}
              className="flex flex-col items-center gap-3 p-6 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow text-center group"
            >
              <div className="w-12 h-12 flex items-center justify-center rounded-full bg-stone-100 group-hover:bg-stone-800 transition-colors">
                <svg className="w-6 h-6 text-stone-600 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-stone-400 uppercase tracking-wide mb-1">Email</p>
                <p className="text-stone-700 font-medium text-sm break-all">{siteConfig.contact.email}</p>
              </div>
            </a>

            {/* Social */}
            <div className="flex flex-col items-center gap-3 p-6 bg-white rounded-2xl shadow-sm text-center">
              <div className="flex gap-3">
                {siteConfig.social.facebook && (
                  <a
                    href={siteConfig.social.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 flex items-center justify-center rounded-full bg-stone-100 hover:bg-blue-600 transition-colors group"
                  >
                    <svg className="w-5 h-5 text-stone-600 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </a>
                )}
                {siteConfig.social.instagram && (
                  <a
                    href={siteConfig.social.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 flex items-center justify-center rounded-full bg-stone-100 hover:bg-pink-500 transition-colors group"
                  >
                    <svg className="w-5 h-5 text-stone-600 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </a>
                )}
              </div>
              <div>
                <p className="text-xs text-stone-400 uppercase tracking-wide">Social</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="font-serif text-3xl text-stone-800 mb-2">{t.aboutPage.mapTitle}</h2>
            <p className="text-stone-500">{t.aboutPage.mapSubtitle}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Map iframe */}
            <div className="lg:col-span-2">
              <div className="relative aspect-[16/10] rounded-2xl overflow-hidden shadow-lg bg-stone-100">
                {isLoading ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-10 h-10 border-2 border-stone-300 border-t-stone-600 rounded-full animate-spin" />
                  </div>
                ) : (
                  <iframe
                    key={selectedBuildingId}
                    src={getMapEmbedUrl()}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Location Map"
                    className="absolute inset-0"
                  />
                )}
              </div>
            </div>

            {/* Building list */}
            <div className="space-y-3">
              <h3 className="font-serif text-xl text-stone-800 mb-4">{t.aboutPage.buildingsTitle}</h3>
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {buildings.map((building) => {
                  const isSelected = building.id === selectedBuildingId;
                  const name = getLocalizedText(building.name);
                  const firstImage = building.images?.[0];

                  return (
                    <div
                      key={building.id}
                      onClick={() => setSelectedBuildingId(building.id)}
                      className={`
                        group cursor-pointer rounded-xl p-4 transition-all duration-300
                        ${isSelected
                          ? 'bg-stone-800 text-white shadow-lg scale-[1.02]'
                          : 'bg-stone-50 hover:bg-stone-100 text-stone-800'
                        }
                      `}
                    >
                      <div className="flex items-start gap-3">
                        {firstImage ? (
                          <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0">
                            <Image src={firstImage.url} alt={name} fill className="object-cover" />
                          </div>
                        ) : (
                          <div className={`w-14 h-14 rounded-lg flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-white/20' : 'bg-stone-200'}`}>
                            <svg className={`w-6 h-6 ${isSelected ? 'text-white' : 'text-stone-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className={`font-medium truncate ${isSelected ? 'text-white' : 'text-stone-800'}`}>
                            {name}
                          </h4>
                          {building.address && (
                            <p className={`text-sm mt-0.5 ${isSelected ? 'text-white/80' : 'text-stone-500'}`}>
                              {building.address}
                            </p>
                          )}
                          <div className="flex items-center gap-3 mt-2">
                            {building.latitude && building.longitude && (
                              <a
                                href={getDirectionsUrl(building)}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className={`inline-flex items-center gap-1 text-xs font-medium transition-colors ${isSelected ? 'text-white/90 hover:text-white' : 'text-stone-600 hover:text-stone-800'}`}
                              >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                {t.map.getDirections}
                              </a>
                            )}
                            <Link
                              href={`/frontend/${t.routes.accommodation}/${building.slug}`}
                              onClick={(e) => e.stopPropagation()}
                              className={`inline-flex items-center gap-1 text-xs font-medium transition-colors ${isSelected ? 'text-white/90 hover:text-white' : 'text-stone-600 hover:text-stone-800'}`}
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                              </svg>
                              {t.buildings.viewDetails}
                            </Link>
                          </div>
                        </div>
                        {isSelected && (
                          <div className="flex-shrink-0">
                            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                {!isLoading && buildings.length === 0 && (
                  <p className="text-stone-500 text-sm text-center py-4">{t.common.loading}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Buildings Cards Grid */}
      {buildings.length > 0 && (
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-stone-50">
          <div className="max-w-7xl mx-auto">
            <h2 className="font-serif text-3xl text-stone-800 text-center mb-10">{t.aboutPage.buildingsTitle}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {buildings.map((building, index) => {
                const name = getLocalizedText(building.name);
                const description = getLocalizedText(building.description);
                const firstImage = building.images?.[0]?.url || null;

                return (
                  <Link
                    key={building.id}
                    href={`/frontend/${t.routes.accommodation}/${building.slug}`}
                    className="group block bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="relative aspect-[4/3] overflow-hidden">
                      {firstImage ? (
                        <Image
                          src={firstImage}
                          alt={name}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-110"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-stone-100 to-stone-200 flex items-center justify-center">
                          <svg className="w-16 h-16 text-stone-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-40 group-hover:opacity-100 transition-opacity duration-500" />
                      <div className="absolute inset-0 flex items-end justify-center pb-6 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-4 group-hover:translate-y-0">
                        <span className="px-6 py-2.5 bg-white text-stone-800 text-sm font-medium rounded-full shadow-lg">
                          {t.buildings.viewDetails}
                        </span>
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="font-serif text-xl text-stone-800 group-hover:text-stone-600 transition-colors duration-300">
                        {name}
                      </h3>
                      {building.address && (
                        <p className="mt-1 text-stone-400 text-xs flex items-center gap-1">
                          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {building.address}
                        </p>
                      )}
                      {description && (
                        <p className="mt-2 text-stone-500 text-sm line-clamp-2 group-hover:text-stone-600 transition-colors duration-300">
                          {description}
                        </p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
