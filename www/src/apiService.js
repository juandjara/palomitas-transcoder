export const API = process.env.REACT_APP_API_URL || 'http://localhost:4000'

console.log('API is', API)

export function getJobs () {
  return fetch(`${API}/jobs`).then(res => res.json())
  .catch(err => {
    console.error('[apiService.js] Error fetching jobs', err)
    return []
  })
}

export function cancelJob (id) {
  return fetch(`${API}/jobs/${id}/cancel`, {
    method: 'PUT'
  }).then(res => res.json())
  .catch(err => console.error('[apiService.js] Error canceling job', err))
}

export function deleteJob (id) {
  return fetch(`${API}/jobs/${id}`, {
    method: 'DELETE'
  }).then(res => res.json())
  .catch(err => console.error('[apiService.js] Error deleting job', err))
}

export function addJob (url) {
  return fetch(`${API}/jobs`, {
    method: 'POST',
    body: JSON.stringify({ url }),
    headers: {
      'Content-Type': 'application/json'
    }
  }).then(res => res.json())
  .catch(err => console.error('[apiService.js] Error creating job', err))
}

export function getLogs (id) {
  return fetch(`${API}/jobs/${id}/logs`).then(res => res.json())
  .catch(err => console.error('[apiService.js] Error fetching logs', err))
}

export function getMetrics () {
  return fetch(`${API}/metrics`).then(res => res.json())
  .catch(err => {
    console.error('[apiService.js] Error fetching metrics', err)
    return { error: true }
  })
}