'use strict'

import { cacheGet, cacheSet } from './cacheService'

function buildQuery(params) {
  const parts = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
  return parts.length ? '?' + parts.join('&') : ''
}

async function fetchCached(url) {
  const cached = await cacheGet(url)
  if (cached) return cached
  const res = await fetch(url)
  const json = await res.json()
  cacheSet(url, json)
  return json
}

export async function fetchTrending({ type, providers } = {}) {
  const qs = buildQuery({ type: type !== 'all' ? type : undefined, providers })
  const data = await fetchCached('/api/trending' + qs)
  return data.results || []
}

export async function fetchNew({ type, providers } = {}) {
  const qs = buildQuery({ type: type !== 'all' ? type : undefined, providers })
  const data = await fetchCached('/api/new' + qs)
  return data.results || []
}

export async function fetchBrowse({ page = 1, type, providers, decade, sortBy } = {}) {
  const qs = buildQuery({ page, type: type !== 'all' ? type : undefined, providers, decade: decade || undefined, sortBy: sortBy !== 'popularity' ? sortBy : undefined })
  const data = await fetchCached('/api/browse' + qs)
  return data.results || []
}

export async function fetchTop10({ type } = {}) {
  const qs = buildQuery({ type: type !== 'all' ? type : undefined })
  const data = await fetchCached('/api/top10' + qs)
  return data.results || []
}

// Search is intentionally not cached — results change frequently
export async function fetchSearch(query, { providers } = {}) {
  if (!query.trim()) return []
  const qs = buildQuery({ query, providers })
  const res = await fetch('/api/search' + qs)
  const data = await res.json()
  return data.results || []
}

export async function fetchComingSoon({ type } = {}) {
  const qs = buildQuery({ type: type !== 'all' ? type : undefined })
  const data = await fetchCached('/api/coming-soon' + qs)
  return data.results || []
}

// Random is not cached — intentionally returns a different result each call
export async function fetchRandom({ type, providers, decade } = {}) {
  const qs = buildQuery({ type: type !== 'all' ? type : undefined, providers, decade: decade || undefined })
  const res = await fetch('/api/random' + qs)
  const data = await res.json()
  return data.result || null
}

// Detail uses server-side cache; not cached client-side
export async function fetchDetail(mediaType, id) {
  const res = await fetch(`/api/detail/${mediaType}/${id}`)
  return res.json()
}
