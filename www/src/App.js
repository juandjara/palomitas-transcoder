import React, { useState, useEffect } from 'react';
import Button from './Button'
import AppStyles from './AppStyles'
import RedisStats from './RedisStats'
import { getJobs, deleteJob, cancelJob, addJob, getLogs, getMetrics } from './apiService'

function AddIcon ({ color = '#609' }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill={color}>
      <path d="M7.086 0.5L7.967 0.5 7.967 7.033 14.5 7.033 14.5 7.967 7.967 7.967 7.967 14.5 7.086 14.5 7.086 7.967 0.5 7.967 0.5 7.033 7.086 7.033z"/>
    </svg>
  )
}

function formatDate (str) {
  return new Date(str).toLocaleString('es-ES', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    minute: '2-digit',
    hour: '2-digit'
  })
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
    setJobs(data.sort((a, b) => b.timestamp - a.timestamp))
  }

  async function onCancel(job) {
    await cancelJob(job.id)
    await fetchJobs()
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
          placeholder="Enter video URL here" />
        <Button icontext background="limegreen">
          <AddIcon color="white" />
          <span>Add job</span>
        </Button>
      </form>)}
      {metrics && <RedisStats className="container" stats={metrics} />}
      <main className="container">
        {jobs.length === 0 && <p className="no-data">No jobs in the queue</p>}
        {jobs.map(job => (
          <div className="job" key={job.id}>
            <header>
              <h3>Job #{job.id}</h3>
              {!job.finishedOn && (<Button background="silver" onClick={() => fetchJobs()}>Refresh</Button>)}
              <div className="spacer"></div>
              <Button background="limegreen" onClick={() => fetchLogs(job)}>Logs</Button>
              {job.finishedOn ? (
                <Button background="indianred" onClick={() => onDelete(job)}>Remove</Button>
              ) : (
                <Button background="darkred" onClick={() => onCancel(job)}>Cancel</Button>
              )}
            </header>
            <p className="progress-label">Transcode progress</p>
            <div className="progress-wrapper">
              <p>{job.progress.toFixed(2)}%</p>
              <progress value={job.progress} max="100" />
            </div>
            <div className="job-dates">
              <div className="job-date">
                <p><strong>Created</strong></p>
                <p>{formatDate(job.timestamp)}</p>
              </div>
              {job.processedOn && (
                <div className="job-date">
                  <p><strong>Processed</strong></p>
                  <p>{formatDate(job.processedOn)}</p>
                </div>
              )}
              {job.finishedOn && (
                <div className="job-date">
                  <p><strong>Finished</strong></p>
                  <p>{formatDate(job.finishedOn)}</p>
                </div>
              )}
            </div>
            {job.failedReason && (
              <details>
                <summary><strong>Error:</strong> {job.failedReason}</summary>
                <pre>
                  <code>
                    {job.stacktrace.join()}
                  </code>
                </pre>
              </details>
            )}
            <details>
              <summary>Input Data</summary>
              <pre>
                <code>{JSON.stringify(job.data, null, 2)}</code>
              </pre>
            </details>
            {job.logs && (<details open>
              <summary>Logs</summary>
              <pre className="logs">
                <code>
                  {job.logs.join('\n')}
                </code>
              </pre>
            </details>)}
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
