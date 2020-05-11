import React, { Fragment, useState, useEffect, useRef } from 'react';
import Button from './Button'
import AppStyles from './AppStyles'
import RedisStats from './RedisStats'
import Modal from './Modal'
import { getJobs, deleteJob, cancelJob, addJob, getLogs, getMetrics } from './apiService'

function AddIcon ({ color = '#609' }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill={color}>
      <path d="M7.086 0.5L7.967 0.5 7.967 7.033 14.5 7.033 14.5 7.967 7.967 7.967 7.967 14.5 7.086 14.5 7.086 7.967 0.5 7.967 0.5 7.033 7.086 7.033z"/>
    </svg>
  )
}

function CloseIcon ({ color = '#9397A2' }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill={color}>
      <path fillRule="evenodd" d="M14.293 4.293l1.414 1.414L11.414 10l4.293 4.293-1.414 1.414L10 11.414l-4.293 4.293-1.414-1.414L8.586 10 4.293 5.707l1.414-1.414L10 8.586l4.293-4.293z"/>
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

function formatDuration (time) {
  const second = Math.floor(time / 1000)
  const minute = Math.floor(second / 60)
  const hour = Math.floor(minute / 60)
  return `${hour ? `${hour}h` : ''} ${minute - (hour * 60)}min ${second - (minute * 60)}s`
}

// from here: https://overreacted.io/making-setinterval-declarative-with-react-hooks/
function useInterval(callback, delay) {
  const savedCallback = useRef();

  // Remember the latest callback.
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval.
  useEffect(() => {
    function tick() {
      savedCallback.current();
    }
    if (delay !== null) {
      let id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}

function App() {
  const [metrics, setMetrics] = useState(null)
  const [jobs, setJobs] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [newUrl, setNewUrl] = useState("")
  const [logs, setLogs] = useState(null)
  const [pollDelay, setPollDelay] = useState(1000)
  const [selectedLogsId, setSelectedLogsId] = useState(null)

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

  async function fetchLogs (id) {
    const { logs } = await getLogs(id)
    setLogs(logs)
  }

  async function openLogs ({ id }) {
    await fetchLogs(id)
    setSelectedLogsId(id)
  }

  function closeLogs () {
    setSelectedLogsId(null)
    setLogs(null)
  }

  function onHidden () {
    setPollDelay(document.hidden ? null : 1000)
  }

  const someJobActive = jobs.some(j => !j.finishedOn)

  useEffect(() => {
    fetchJobs()
    fetchMetrics()
  }, [])

  useInterval(() => {
    fetchJobs()
    fetchMetrics()
    if (selectedLogsId) {
      fetchLogs(selectedLogsId)
    }
  }, someJobActive ? pollDelay : null)

  useEffect(() => {
    document.addEventListener('visibilitychange', onHidden, false)
    return () => {
      document.removeEventListener('visibilitychange', onHidden, false)
    }
  }, [])

  return (
    <AppStyles className="body-background">
      {logs && (
        <Modal onClose={closeLogs}>
          <header>
          <h2>Logs for job #{selectedLogsId}</h2>
            <Button title="Close" icon onClick={closeLogs}>
              <CloseIcon />
            </Button>
          </header>
          <main>
            <pre className="logs">
              <code>
                {logs.join('\n')}
              </code>
            </pre>
          </main>
        </Modal>
      )}
      <header className="container">
        <h1>Palomitas Transcoder</h1>
        <Button title="Add new job" icon onClick={toggleForm} className="add-btn">
          <AddIcon />
        </Button>
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
              <Button background="limegreen" onClick={() => openLogs(job)}>Logs</Button>
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
              <div className="job-date">
                <p><strong>Time waiting</strong></p>
                <p>{formatDuration(job.processedOn - job.timestamp)}</p>
              </div>
              {job.processedOn && (
                <Fragment>
                  <div className="job-date">
                    <p><strong>Started</strong></p>
                    <p>{formatDate(job.processedOn)}</p>
                  </div>
                  <div className="job-date">
                    <p><strong>Time processing</strong></p>
                    <p>{formatDuration((job.finishedOn || Date.now()) - job.processedOn)}</p>
                  </div>
                </Fragment>
              )}
              {job.finishedOn && (
                <Fragment>
                  <div className="job-date">
                    <p><strong>Finished</strong></p>
                    <p>{formatDate(job.finishedOn)}</p>
                  </div>
                  <div className="job-date">
                    <p><strong>Time total</strong></p>
                    <p>{formatDuration(job.finishedOn - job.timestamp)}</p>
                  </div>
                </Fragment>
              )}
            </div>
            <details>
              <summary>Input Data</summary>
              <pre>
                <code>{JSON.stringify(job.data, null, 2)}</code>
              </pre>
            </details>
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
