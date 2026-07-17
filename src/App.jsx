import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('job-tracker-theme')
    if (saved) return saved === 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  const [jobs, setJobs] = useState(() => {
    const saved = localStorage.getItem('job-tracker-jobs')
    return saved ? JSON.parse(saved) : []
  })

  const [form, setForm] = useState({
    company: '',
    iom: false,
    status: 'pending',
    location: '',
    site: '',
    notes: ''
  })

  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    localStorage.setItem('job-tracker-jobs', JSON.stringify(jobs))
  }, [jobs])

  useEffect(() => {
    localStorage.setItem('job-tracker-theme', darkMode ? 'dark' : 'light')
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light')
  }, [darkMode])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.company.trim()) return
    setJobs(prev => [{ ...form, id: Date.now(), company: form.company.trim() }, ...prev])
    setForm({ company: '', iom: false, status: 'pending', location: '', site: '', notes: '' })
    setShowForm(false)
  }

  const deleteJob = (id) => {
    setJobs(prev => prev.filter(job => job.id !== id))
  }

  const getStatusStyle = (status) => {
    switch(status) {
      case 'accepted': return { bg: '#e8f5e9', color: '#2e7d32', border: '#4caf50' }
      case 'rejected': return { bg: '#fbe9e7', color: '#c62828', border: '#ef5350' }
      default: return { bg: '#fff8e1', color: '#f57f17', border: '#ff9800' }
    }
  }

  const getStatusLabel = (status) => {
    switch(status) {
      case 'accepted': return 'Accepted'
      case 'rejected': return 'Rejected'
      default: return 'Pending'
    }
  }

  return (
    <div className={`app ${darkMode ? 'dark' : 'light'}`}>
      <header className="header">
        <div className="header-left">
          <span className="header-icon">💼</span>
          <h1>Job Tracker</h1>
        </div>
        <div className="header-right">
          <span className="job-count">{jobs.length}</span>
          <button
            className="theme-toggle"
            onClick={() => setDarkMode(!darkMode)}
            aria-label="Toggle theme"
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      <main className="main">
        <button className="fab" onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕' : '+'}
        </button>

        {showForm && (
          <form className="job-form" onSubmit={handleSubmit}>
            <h2>New Application</h2>

            <div className="form-group">
              <label>Company Name <span className="required">*</span></label>
              <input
                type="text"
                name="company"
                value={form.company}
                onChange={handleChange}
                placeholder="e.g. Google, Meta..."
                required
              />
            </div>

            <div className="form-group">
              <label>Status</label>
              <select name="status" value={form.status} onChange={handleChange}>
                <option value="pending">⏳ Pending</option>
                <option value="accepted">✅ Accepted</option>
                <option value="rejected">❌ Rejected</option>
              </select>
            </div>

            <div className="form-group">
              <label>Location</label>
              <input
                type="text"
                name="location"
                value={form.location}
                onChange={handleChange}
                placeholder="e.g. Remote, Manila..."
              />
            </div>

            <div className="form-group">
              <label>Site / App Used</label>
              <input
                type="text"
                name="site"
                value={form.site}
                onChange={handleChange}
                placeholder="e.g. LinkedIn, Indeed..."
              />
            </div>

            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="iom"
                  checked={form.iom}
                  onChange={handleChange}
                />
                <span className="checkbox-custom"></span>
                IOM Available
              </label>
            </div>

            <div className="form-group">
              <label>Notes / Remarks</label>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                placeholder="Any notes about this application..."
                rows="3"
              />
            </div>

            <div className="form-actions">
              <button type="button" className="btn-cancel" onClick={() => setShowForm(false)}>
                Cancel
              </button>
              <button type="submit" className="btn-submit">
                Save
              </button>
            </div>
          </form>
        )}

        <section className="job-list">
          {jobs.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🌸</div>
              <h3>No applications yet</h3>
              <p>Tap the + button to start tracking your job applications!</p>
            </div>
          ) : (
            <div className="jobs-container">
              {jobs.map(job => {
                const s = getStatusStyle(job.status)
                return (
                  <div key={job.id} className="job-card">
                    <div className="job-card-top">
                      <div className="job-company">
                        <div className="company-avatar">{job.company.charAt(0).toUpperCase()}</div>
                        <div>
                          <h3>{job.company}</h3>
                          <span className="job-site">{job.site || 'No site specified'}</span>
                        </div>
                      </div>
                      <button
                        className="btn-delete"
                        onClick={() => deleteJob(job.id)}
                        aria-label="Delete"
                      >
                        🗑️
                      </button>
                    </div>

                    <div className="job-card-tags">
                      <span className="tag tag-status" style={{ background: s.bg, color: s.color, borderColor: s.border }}>
                        {getStatusLabel(job.status)}
                      </span>
                      <span className={`tag tag-iom ${job.iom ? 'tag-iom-yes' : 'tag-iom-no'}`}>
                        {job.iom ? 'IOM ✓' : 'No IOM'}
                      </span>
                    </div>

                    <div className="job-card-details">
                      <div className="detail">
                        <span className="detail-icon">📍</span>
                        <span>{job.location || 'No location'}</span>
                      </div>
                    </div>

                    {job.notes && (
                      <div className="job-card-notes">
                        <span className="detail-icon">📝</span>
                        <p>{job.notes}</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

export default App
