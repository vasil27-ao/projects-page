import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'

type ProjectStatus = 'Новый' | 'В работе' | 'Завершён'

type Project = {
  id: number
  name: string
  description: string
  status: ProjectStatus
}

const initialProjects: Project[] = [
  {
    id: 1,
    name: 'Редизайн лендинга',
    description: 'Обновить структуру и визуальный стиль учебной промостраницы.',
    status: 'В работе',
  },
  {
    id: 2,
    name: 'Telegram-бот поддержки',
    description: 'Собрать прототип помощника для ответов на типовые вопросы.',
    status: 'Новый',
  },
  {
    id: 3,
    name: 'Автоматизация отчётов',
    description: 'Подготовить учебный сценарий формирования еженедельных сводок.',
    status: 'Завершён',
  },
]

const storageKey = 'projects-page:projects'

function loadProjects() {
  try {
    const savedProjects = localStorage.getItem(storageKey)
    if (!savedProjects) return initialProjects

    const parsedProjects: unknown = JSON.parse(savedProjects)
    if (!Array.isArray(parsedProjects)) return initialProjects

    return parsedProjects.filter((project): project is Project => {
      if (!project || typeof project !== 'object') return false
      const candidate = project as Partial<Project>
      return (
        typeof candidate.id === 'number' &&
        typeof candidate.name === 'string' &&
        typeof candidate.description === 'string' &&
        ['Новый', 'В работе', 'Завершён'].includes(candidate.status ?? '')
      )
    })
  } catch {
    return initialProjects
  }
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  )
}

function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m14.5 5.5 4 4M5 19l3.2-.7L18 8.5a1.4 1.4 0 0 0 0-2l-.5-.5a1.4 1.4 0 0 0-2 0l-9.8 9.8L5 19Z" />
    </svg>
  )
}

function DeleteIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5" />
    </svg>
  )
}

export default function App() {
  const [projects, setProjects] = useState<Project[]>(loadProjects)
  const [query, setQuery] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingProjectId, setEditingProjectId] = useState<number | null>(null)
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<ProjectStatus>('Новый')
  const [nameError, setNameError] = useState('')
  const nameInputRef = useRef<HTMLInputElement>(null)
  const createButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(projects))
    } catch {
      // The page remains usable if browser storage is unavailable.
    }
  }, [projects])

  const filteredProjects = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('ru')
    if (!normalizedQuery) return projects

    return projects.filter((project) =>
      project.name.toLocaleLowerCase('ru').includes(normalizedQuery),
    )
  }, [projects, query])

  useEffect(() => {
    if (!isFormOpen) return
    nameInputRef.current?.focus()

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeForm()
    }

    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [isFormOpen])

  const resetForm = () => {
    setName('')
    setDescription('')
    setStatus('Новый')
    setNameError('')
    setEditingProjectId(null)
  }

  const openForm = () => {
    resetForm()
    setIsFormOpen(true)
  }

  const openEditForm = (project: Project) => {
    setEditingProjectId(project.id)
    setName(project.name)
    setDescription(project.description)
    setStatus(project.status)
    setNameError('')
    setIsFormOpen(true)
  }

  const closeForm = () => {
    setIsFormOpen(false)
    resetForm()
    requestAnimationFrame(() => createButtonRef.current?.focus())
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmedName = name.trim()

    if (!trimmedName) {
      setNameError('Введите название проекта')
      nameInputRef.current?.focus()
      return
    }

    if (editingProjectId !== null) {
      setProjects((currentProjects) =>
        currentProjects.map((project) =>
          project.id === editingProjectId
            ? { ...project, name: trimmedName, description: description.trim(), status }
            : project,
        ),
      )
    } else {
      setProjects((currentProjects) => [
        {
          id: Date.now(),
          name: trimmedName,
          description: description.trim(),
          status,
        },
        ...currentProjects,
      ])
    }
    closeForm()
  }

  const confirmDelete = () => {
    if (!projectToDelete) return
    setProjects((currentProjects) =>
      currentProjects.filter((project) => project.id !== projectToDelete.id),
    )
    setProjectToDelete(null)
  }

  return (
    <main className="page-shell">
      <section className="projects" aria-labelledby="page-title">
        <header className="page-header">
          <div>
            <p className="eyebrow">Рабочее пространство</p>
            <h1 id="page-title">Проекты</h1>
          </div>
          <span className="project-count" aria-label={`Всего проектов: ${projects.length}`}>
            {projects.length.toString().padStart(2, '0')}
          </span>
        </header>

        <div className="toolbar">
          <label className="search-field">
            <span className="sr-only">Поиск по названию проекта</span>
            <SearchIcon />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Найти проект"
            />
          </label>
          <button ref={createButtonRef} className="primary-button" type="button" onClick={openForm}>
            <PlusIcon />
            Создать проект
          </button>
        </div>

        <div className="results-meta" aria-live="polite">
          <span>{query.trim() ? `Найдено: ${filteredProjects.length}` : 'Все проекты'}</span>
          <span className="rule" />
        </div>

        {filteredProjects.length > 0 ? (
          <ul className="project-grid">
            {filteredProjects.map((project) => (
              <li className="project-card" key={project.id}>
                <div className="card-topline">
                  <span className={`status status--${project.status.replace(' ', '-').toLowerCase()}`}>
                    {project.status}
                  </span>
                  <span className="project-number">#{String(project.id).slice(-2).padStart(2, '0')}</span>
                </div>
                <h2>{project.name}</h2>
                <p className={project.description ? '' : 'muted'}>
                  {project.description || 'Описание не добавлено'}
                </p>
                <div className="card-actions">
                  <button className="card-action" type="button" onClick={() => openEditForm(project)}>
                    <EditIcon />
                    Изменить
                  </button>
                  <button className="card-action card-action--danger" type="button" onClick={() => setProjectToDelete(project)}>
                    <DeleteIcon />
                    Удалить
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="empty-state" role="status">
            <span>0 результатов</span>
            <h2>Проекты не найдены</h2>
            <p>Попробуйте изменить поисковый запрос.</p>
          </div>
        )}
      </section>

      {isFormOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) closeForm()
        }}>
          <section className="modal" role="dialog" aria-modal="true" aria-labelledby="form-title">
            <div className="modal-header">
              <div>
                <p className="eyebrow">{editingProjectId === null ? 'Новый проект' : 'Редактирование'}</p>
                <h2 id="form-title">{editingProjectId === null ? 'Создать проект' : 'Изменить проект'}</h2>
              </div>
              <button className="icon-button" type="button" onClick={closeForm} aria-label="Закрыть форму">
                <CloseIcon />
              </button>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              <label className="form-field">
                <span>Название <b aria-hidden="true">*</b></span>
                <input
                  ref={nameInputRef}
                  type="text"
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value)
                    if (nameError) setNameError('')
                  }}
                  aria-invalid={Boolean(nameError)}
                  aria-describedby={nameError ? 'name-error' : undefined}
                  placeholder="Например, Исследование аудитории"
                />
                {nameError && <small id="name-error" className="field-error">{nameError}</small>}
              </label>

              <label className="form-field">
                <span>Описание <em>необязательно</em></span>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Коротко опишите задачу проекта"
                  rows={4}
                />
              </label>

              <label className="form-field">
                <span>Статус</span>
                <select value={status} onChange={(event) => setStatus(event.target.value as ProjectStatus)}>
                  <option>Новый</option>
                  <option>В работе</option>
                  <option>Завершён</option>
                </select>
              </label>

              <div className="form-actions">
                <button className="secondary-button" type="button" onClick={closeForm}>Отмена</button>
                <button className="primary-button" type="submit">
                  {editingProjectId === null ? 'Сохранить проект' : 'Сохранить изменения'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {projectToDelete && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setProjectToDelete(null)
        }}>
          <section className="confirm-modal" role="alertdialog" aria-modal="true" aria-labelledby="delete-title" aria-describedby="delete-description">
            <span className="delete-mark"><DeleteIcon /></span>
            <h2 id="delete-title">Удалить проект?</h2>
            <p id="delete-description">
              «{projectToDelete.name}» будет удалён из списка. Это действие нельзя отменить.
            </p>
            <div className="confirm-actions">
              <button className="secondary-button" type="button" onClick={() => setProjectToDelete(null)}>Отмена</button>
              <button className="danger-button" type="button" onClick={confirmDelete}>Удалить проект</button>
            </div>
          </section>
        </div>
      )}
    </main>
  )
}
