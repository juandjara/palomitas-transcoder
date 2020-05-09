import React, { useState, useEffect } from 'react';
import Button from './Button'
import AppStyles from './AppStyles'
import RedisStats from './RedisStats'

const API = 'http://localhost:4000'

function getJobs () {
  return fetch(`${API}/jobs`).then(res => res.json())
}

function deleteJob (id) {
  return fetch(`${API}/jobs/${id}`, {
    method: 'DELETE'
  }).then(res => res.json())
}

function addJob (url) {
  return fetch(`${API}/jobs`, {
    method: 'POST',
    body: JSON.stringify({ url }),
    headers: {
      'Content-Type': 'application/json'
    }
  }).then(res => res.json())
}

function getLogs (id) {
  return fetch(`${API}/jobs/${id}/logs`).then(res => res.json())
}

function getMetrics () {
  return fetch(`${API}/metrics`).then(res => res.json())
}

function AddIcon ({ color = '#609' }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill={color}>
      <path d="M7.086 0.5L7.967 0.5 7.967 7.033 14.5 7.033 14.5 7.967 7.967 7.967 7.967 14.5 7.086 14.5 7.086 7.967 0.5 7.967 0.5 7.033 7.086 7.033z"/>
    </svg>
  )
}

function App() {
  const [metrics, setMetrics] = useState(null)
  const [jobs, setJobs] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [newUrl, setNewUrl] = useState("")

  async function fetchMetrics () {
    const data = await getMetrics()
    setMetrics(data)
  }

  async function fetchJobs () {
    const data = await getJobs()
    setJobs(data)
  }

  async function onDelete(job) {
    await deleteJob(job.id)
    await fetchJobs()
  }

  async function onSubmit (ev) {
    ev.preventDefault()
    await addJob(newUrl)
    await fetchJobs()
    setShowForm(false)
  }

  function toggleForm () {
    setShowForm(!showForm)
  }

  async function fetchLogs ({ id }) {
    const { logs } = await getLogs(id)
    setJobs(jobs.map(job => {
      if (job.id === id) {
        job.logs = logs
      }
      return job
    }))
  }

  useEffect(() => {
    fetchJobs()
    fetchMetrics()
  }, [])

  return (
    <AppStyles className="body-background">
      <header className="container">
        <h1>Palomitas Transcoder</h1>
        <Button title="Add new job" icon onClick={toggleForm} className="add-btn"><AddIcon /></Button>
      </header>
      {showForm && (<form onSubmit={onSubmit} className="container add-form">
        <input 
          value={newUrl}
          onChange={ev => setNewUrl(ev.target.value)}
          placeholder="Video URL" />
        <Button icontext background="limegreen">
          <AddIcon color="white" />
          <span>Add video job</span>
        </Button>
      </form>)}
      {metrics && <RedisStats className="container" stats={metrics} />}
      <main className="container">
        {jobs.length === 0 && <p className="no-data">No jobs in the queue</p>}
        {jobs.map(job => (
          <div className="job" key={job.id}>
            <header>
              <h3>Job #{job.id}</h3>
              <Button background="#ccc" onClick={() => fetchJobs()}>Refresh</Button>
              <div className="spacer"></div>
              <Button background="limegreen" onClick={() => fetchLogs(job)}>Logs</Button>
              <Button background="indianred" onClick={() => onDelete(job)}>Remove</Button>
            </header>
            <p className="progress-label">Transcode progress</p>
            <div className="progress-wrapper">
              <p>{job.progress.toFixed(2)}%</p>
              <progress value={job.progress} max="100" />
            </div>
            {job.logs && (<details open>
              <summary>Logs</summary>
              <pre className="logs">
                <code>
                  {job.logs.join('\n')}
                </code>
              </pre>
            </details>)}
            <details>
              <summary>Full Data</summary>
              <pre>
                <code>{JSON.stringify(job, null, 2)}</code>
              </pre>
            </details>
          </div>
        ))}
      </main>
      <footer>
        <a href="https://juandjara.com">juandjara</a> 2020
      </footer>
    </AppStyles>
  );
}

export default App;
