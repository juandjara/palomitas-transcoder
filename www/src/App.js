import React, { useState, useEffect } from 'react';
import styled from 'styled-components'

const AppStyles = styled.div`
  h1 {
    text-align: center;
    padding: 2rem;
    font-size: 48px;
    line-height: 50px;
  }

  main {
    padding: 1rem;
    border-radius: 1rem;
    background-color: white;
    margin-bottom: 3rem;
    color: #333;
  }

  footer {
    text-align: right;
    font-size: 12px;
    position: fixed;
    bottom: 0;
    right: 0;
    padding: 5px 12px 5px 12px;
    background-color: white;
    color: #747474;
    border-radius: 4px 0 0 0;
  }

  .container {
    margin: 0 auto;
    max-width: 960px;
    position: relative;
  }

  .job {
    margin-bottom: 2rem;

    header {
      display: flex;
      align-items: center;
      justify-content: space-between;

      .spacer {
        flex-grow: 1;
      }

      button {
        margin-left: 8px;
      }
    }

    summary {
      cursor: pointer;
    }
  }

  pre {
    overflow-x: scroll;
    max-width: 100%;
    background-color: #f2f2f2;
    border-radius: 1rem;
    padding: 8px;
    margin-top: 8px;
    margin-bottom: 0;
  }

  .no-data {
    text-align: center;
    font-weight: 500;
  }

  .add-btn {
    position: absolute;
    right: 0;
    bottom: 50%;
    transform: translateY(50%);
  }

  svg {
    display: block;
  }

  .add-form {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    margin-bottom: 1rem;

    input {
      flex-grow: 1;
      padding: 1px 4px;
      font-size: 12px;
      line-height: 22px;
    }

    button {
      border-radius: 0 4px 4px 0;
    }
  }

  .logs {
    max-height: 360px;
    overflow-y: auto;
  }
`

const Button = styled.button`
  border: none;
  background-color: #ccc;
  color: white;
  font-size: 12px;
  line-height: 16px;
  font-weight: 600;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 4px;
  background-color: ${props => props.background || 'white'};

  ${props => props.icon ? `
    padding: 8px;
  ` : ''}

  ${props => props.icontext ? `
    display: flex;
    align-items: center;
    justify-content: flex-start;
    padding-left: 8px;

    svg {
      margin-right: 4px;
    }
  ` : ''}

  &:hover {
    opacity: 0.8;
  }
`

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

function AddIcon ({ color = '#609' }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill={color}>
      <path d="M7.086 0.5L7.967 0.5 7.967 7.033 14.5 7.033 14.5 7.967 7.967 7.967 7.967 14.5 7.086 14.5 7.086 7.967 0.5 7.967 0.5 7.033 7.086 7.033z"/>
    </svg>
  )
}

function App() {
  const [jobs, setJobs] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [newUrl, setNewUrl] = useState("")

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
