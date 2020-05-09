export const API = 'http://localhost:4000'

export function getJobs () {
  return fetch(`${API}/jobs`).then(res => res.json())
}

export function deleteJob (id) {
  return fetch(`${API}/jobs/${id}`, {
    method: 'DELETE'
  }).then(res => res.json())
}

export function addJob (url) {
  return fetch(`${API}/jobs`, {
    method: 'POST',
    body: JSON.stringify({ url }),
    headers: {
      'Content-Type': 'application/json'
    }
  }).then(res => res.json())
}

export function getLogs (id) {
  return fetch(`${API}/jobs/${id}/logs`).then(res => res.json())
}

export function getMetrics () {
  return fetch(`${API}/metrics`).then(res => res.json())
}