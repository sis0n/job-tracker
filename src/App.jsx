import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import { Briefcase, Sun, Moon, Plus, Close, Edit, Trash, MapPin, Notes, Search } from './lib/icons'
import Swal from 'sweetalert2'
import './App.css'

const toDB = (job) => ({
  id: job.id,
  created_at: job.createdAt,
  company: job.company,
  status: job.status,
  location: job.location,
  site: job.site,
  iom: job.iom,
  notes: job.notes,
})

const fromDB = (job) => ({
  id: job.id,
  createdAt: job.created_at,
  company: job.company,
  status: job.status,
  location: job.location,
  site: job.site,
  iom: job.iom,
  notes: job.notes,
})

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('job-tracker-theme')
    if (saved) return saved === 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  const [jobs, setJobs] = useState([])

  const [form, setForm] = useState({
    company: '',
    iom: false,
    status: 'pending',
    location: '',
    site: '',
    notes: ''
  })

  const [showForm, setShowForm] = useState(false)
  const [viewingJob, setViewingJob] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [showWelcome, setShowWelcome] = useState(() => !localStorage.getItem('job-tracker-welcomed'))
  const PER_PAGE = 12

  useEffect(() => {
    setPage(1)
  }, [search, statusFilter])

  useEffect(() => {
    const fetchJobs = async () => {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .order('id', { ascending: false })
      if (error) {
        console.error('Supabase fetch error:', error)
      }
      if (!error && data) {
        setJobs(data.map(fromDB))
        localStorage.setItem('job-tracker-jobs', JSON.stringify(data.map(fromDB)))
      } else {
        const saved = localStorage.getItem('job-tracker-jobs')
        if (saved) setJobs(JSON.parse(saved))
      }
    }
    fetchJobs()
  }, [])

  useEffect(() => {
    localStorage.setItem('job-tracker-theme', darkMode ? 'dark' : 'light')
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light')
  }, [darkMode])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const startEdit = (job) => {
    setForm({
      company: job.company,
      iom: job.iom,
      status: job.status,
      location: job.location,
      site: job.site,
      notes: job.notes,
    })
    setEditingId(job.id)
    setShowForm(true)
  }

  const cancelForm = () => {
    setForm({ company: '', iom: false, status: 'pending', location: '', site: '', notes: '' })
    setEditingId(null)
    setShowForm(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.company.trim()) return

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark'

    if (editingId) {
      const updated = { ...form, company: form.company.trim() }
      const { error } = await supabase.from('jobs').update(toDB(updated)).eq('id', editingId)
      if (error) {
        console.error('Supabase update error:', error)
        Swal.fire({
          icon: 'error',
          title: 'Update Failed',
          text: error.message || 'Failed to update job in Supabase.',
          background: isDark ? '#25253e' : '#ffffff',
          color: isDark ? '#d0d0e0' : '#4a4a4a',
        })
        return
      }
      setJobs(prev => prev.map(j => j.id === editingId ? { ...j, ...updated } : j))
      cancelForm()
    } else {
      const newJob = {
        ...form,
        id: Date.now(),
        company: form.company.trim(),
        createdAt: new Date().toISOString(),
      }
      const { error } = await supabase.from('jobs').insert(toDB(newJob))
      if (error) {
        console.error('Supabase insert error:', error)
        Swal.fire({
          icon: 'error',
          title: 'Save Failed',
          text: error.message || 'Failed to save job in Supabase.',
          background: isDark ? '#25253e' : '#ffffff',
          color: isDark ? '#d0d0e0' : '#4a4a4a',
        })
        return
      }
      setJobs(prev => [newJob, ...prev])
      cancelForm()
    }
  }

  const deleteJob = async (id, company) => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark'
    const result = await Swal.fire({
      title: 'Delete Application?',
      text: `Remove ${company} from your tracker?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e91e63',
      cancelButtonColor: '#a0a0b8',
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      background: isDark ? '#25253e' : '#ffffff',
      color: isDark ? '#d0d0e0' : '#4a4a4a',
      customClass: {
        popup: 'swal-popup',
        title: 'swal-title',
        htmlContainer: 'swal-text',
      },
    })
    if (!result.isConfirmed) return
    const { error } = await supabase.from('jobs').delete().eq('id', id)
    if (error) {
      console.error('Supabase delete error:', error)
      Swal.fire({
        icon: 'error',
        title: 'Delete Failed',
        text: error.message || 'Failed to delete job from Supabase.',
        background: isDark ? '#25253e' : '#ffffff',
        color: isDark ? '#d0d0e0' : '#4a4a4a',
      })
      return
    }
    setJobs(prev => prev.filter(job => job.id !== id))
  }

  const BASE_STATUSES = ['applied', 'pending', 'accepted', 'rejected']

  const STATUS_CONFIG = {
    applied: { label: 'Applied', bg: '#e3f2fd', color: '#1565c0', border: '#42a5f5', dot: '#1976d2' },
    pending: { label: 'Pending', bg: '#fff8e1', color: '#f57f17', border: '#ff9800', dot: '#f57f17' },
    accepted: { label: 'Accepted', bg: '#e8f5e9', color: '#2e7d32', border: '#4caf50', dot: '#2e7d32' },
    rejected: { label: 'Rejected', bg: '#fbe9e7', color: '#c62828', border: '#ef5350', dot: '#c62828' },
  }

  const getStatusStyle = (status) => {
    const key = (status || 'pending').toLowerCase()
    return STATUS_CONFIG[key] || { bg: '#f3e5f5', color: '#7b1fa2', border: '#ab47bc', dot: '#7b1fa2' }
  }

  const getStatusLabel = (status) => {
    if (!status) return 'Pending'
    const key = status.toLowerCase()
    if (STATUS_CONFIG[key]) return STATUS_CONFIG[key].label
    return status.charAt(0).toUpperCase() + status.slice(1)
  }

  const availableStatuses = Array.from(
    new Set([
      ...BASE_STATUSES,
      ...jobs.map(j => (j.status || '').toLowerCase()).filter(Boolean)
    ])
  )

  const statusCounts = availableStatuses.reduce((acc, status) => {
    acc[status] = jobs.filter(j => (j.status || 'pending').toLowerCase() === status).length
    return acc
  }, {})

  const filteredJobs = jobs.filter(j => {
    const matchesSearch = !search || j.company.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || (j.status || 'pending').toLowerCase() === statusFilter.toLowerCase()
    return matchesSearch && matchesStatus
  })

  const totalPages = Math.max(1, Math.ceil(filteredJobs.length / PER_PAGE))
  const currentPage = Math.min(page, totalPages)
  const startIndex = (currentPage - 1) * PER_PAGE
  const endIndex = startIndex + PER_PAGE
  const paginatedJobs = filteredJobs.slice(startIndex, endIndex)

  const openView = (job) => {
    setViewingJob(job)
  }

  const closeView = () => {
    setViewingJob(null)
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className={`app ${darkMode ? 'dark' : 'light'}`}>
      <header className="header">
        <div className="header-left">
          <span className="header-icon"><Briefcase /></span>
          <h1>Job Tracker</h1>
        </div>
        <div className="header-right">
          <span className="job-count">{jobs.length}</span>
          <button
            className="theme-toggle"
            onClick={() => setDarkMode(!darkMode)}
            aria-label="Toggle theme"
          >
            {darkMode ? <Sun /> : <Moon />}
          </button>
        </div>
      </header>

      <main className="main">
        <div className="search-bar">
          <span className="search-icon"><Search /></span>
          <input
            type="text"
            className="search-input"
            placeholder="Search company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="search-clear" onClick={() => setSearch('')}>
              <Close />
            </button>
          )}
        </div>

        <div className="filter-tabs">
          <button
            type="button"
            className={`filter-tab ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            <span>All</span>
            <span className="filter-tab-count">{jobs.length}</span>
          </button>
          {availableStatuses.map(status => {
            const count = statusCounts[status] || 0
            const style = getStatusStyle(status)
            const isActive = statusFilter === status
            return (
              <button
                key={status}
                type="button"
                className={`filter-tab ${isActive ? 'active' : ''}`}
                onClick={() => setStatusFilter(status)}
              >
                <span className="tab-dot" style={{ background: isActive ? 'white' : style.dot || style.color }}></span>
                <span>{getStatusLabel(status)}</span>
                <span className="filter-tab-count">{count}</span>
              </button>
            )
          })}
        </div>

        <button className="fab" onClick={() => showForm ? cancelForm() : setShowForm(true)}>
          {showForm ? <Close /> : <Plus />}
        </button>

        {showForm && (
          <div className="modal-overlay" onClick={cancelForm}>
            <form className="job-form modal-form" onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{editingId ? 'Edit Application' : 'New Application'}</h2>
                <button type="button" className="modal-close" onClick={cancelForm}>
                  <Close />
                </button>
              </div>

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
                  {availableStatuses.map(status => (
                    <option key={status} value={status}>
                      {getStatusLabel(status)}
                    </option>
                  ))}
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
                <button type="button" className="btn-cancel" onClick={cancelForm}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  {editingId ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        )}

        <section className="job-list">
          {filteredJobs.length === 0 ? (
              <div className="empty-state">
              <div className="empty-icon"><Search /></div>
              <h3>{search || statusFilter !== 'all' ? 'No results found' : 'No applications yet'}</h3>
              <p>
                {search
                  ? `No companies match "${search}"`
                  : statusFilter !== 'all'
                  ? `No applications with status "${getStatusLabel(statusFilter)}"`
                  : 'Tap the + button to start tracking your job applications!'}
              </p>
            </div>
          ) : (
            <div className="jobs-container">
              {paginatedJobs.map(job => {
                const s = getStatusStyle(job.status)
                return (
                  <div
                    key={job.id}
                    className="job-card"
                    onClick={() => openView(job)}
                  >
                    <div className="job-card-top">
                      <div className="job-company">
                        <div className="company-avatar">{job.company.charAt(0).toUpperCase()}</div>
                        <div>
                          <h3>{job.company}</h3>
                          <span className="job-site">{job.site || 'No site specified'}</span>
                        </div>
                      </div>
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
                        <span className="detail-icon"><MapPin /></span>
                        <span>{job.location || 'No location'}</span>
                      </div>
                    </div>

                    {job.notes && (
                      <div className="job-card-notes">
                        <span className="detail-icon"><Notes /></span>
                        <p>{job.notes}</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="page-btn"
                disabled={currentPage === 1}
                onClick={() => setPage(currentPage - 1)}
              >
                Prev
              </button>
              <div className="page-info">
                {currentPage} / {totalPages}
              </div>
              <button
                className="page-btn"
                disabled={currentPage === totalPages}
                onClick={() => setPage(currentPage + 1)}
              >
                Next
              </button>
            </div>
          )}
        </section>

        {viewingJob && (
          <div className="modal-overlay" onClick={closeView}>
            <div className="view-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{viewingJob.company}</h2>
                <button type="button" className="modal-close" onClick={closeView}>
                  <Close />
                </button>
              </div>

              <div className="view-modal-body">
                {(() => {
                  const vs = getStatusStyle(viewingJob.status)
                  return (
                    <>
                      <div className="view-row">
                        <span className="expanded-label">Status</span>
                        <span className="tag tag-status" style={{ background: vs.bg, color: vs.color, borderColor: vs.border }}>
                          {getStatusLabel(viewingJob.status)}
                        </span>
                      </div>
                      <div className="view-row">
                        <span className="expanded-label">Site</span>
                        <span>{viewingJob.site || 'Not specified'}</span>
                      </div>
                      <div className="view-row">
                        <span className="expanded-label">Location</span>
                        <span>{viewingJob.location || 'Not specified'}</span>
                      </div>
                      <div className="view-row">
                        <span className="expanded-label">IOM</span>
                        <span>{viewingJob.iom ? 'Available' : 'Not available'}</span>
                      </div>
                      {viewingJob.notes && (
                        <div className="view-row view-notes">
                          <span className="expanded-label">Notes</span>
                          <p>{viewingJob.notes}</p>
                        </div>
                      )}
                      <div className="view-row view-date">
                        <span className="expanded-label">Created</span>
                        <span>{formatDate(viewingJob.createdAt)}</span>
                      </div>
                    </>
                  )
                })()}
              </div>

              <div className="view-actions">
                <button
                  className="btn-action btn-action-edit"
                  onClick={() => { startEdit(viewingJob); closeView() }}
                >
                  <Edit /> Edit
                </button>
                <button
                  className="btn-action btn-action-delete"
                  onClick={() => { deleteJob(viewingJob.id, viewingJob.company); closeView() }}
                >
                  <Trash /> Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {showWelcome && (
          <div className="modal-overlay welcome-overlay" onClick={() => { localStorage.setItem('job-tracker-welcomed', 'true'); setShowWelcome(false) }}>
            <div className="welcome-modal" onClick={(e) => e.stopPropagation()}>
              <h2 className="welcome-title">Goodluck Baby</h2>
              <p className="welcome-text">U Got This</p>
              <button className="welcome-btn" onClick={() => { localStorage.setItem('job-tracker-welcomed', 'true'); setShowWelcome(false) }}>
                Start Tracking
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
