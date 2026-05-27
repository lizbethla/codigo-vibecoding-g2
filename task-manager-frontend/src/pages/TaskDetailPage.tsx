import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { taskApi } from '../services/api';
import type { Task, CreateTaskInput } from '../types/Task';
import { Button } from '../components/ui/Button';
import { Dialog } from '../components/ui/Dialog';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Checkbox } from '../components/ui/Checkbox';
import { clsx } from 'clsx';

export function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [formData, setFormData] = useState<CreateTaskInput>({ title: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchTask = async () => {
    if (!id) return;
    try {
      const data = await taskApi.getById(id);
      setTask(data);
      setFormData({ title: data.title, description: data.description });
    } catch (error) {
      console.error('Error fetching task:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTask();
  }, [id]);

  const handleToggle = async (completed: boolean) => {
    if (!task) return;
    try {
      await taskApi.update(task.id, { completed });
      setTask({ ...task, completed });
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  };

  const handleOpenEdit = () => {
    setFormData({ title: task?.title || '', description: task?.description || '' });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.title.trim() || !task) return;
    setSubmitting(true);
    try {
      const updated = await taskApi.update(task.id, formData);
      setTask(updated);
      setDialogOpen(false);
    } catch (error) {
      console.error('Error updating task:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenDelete = () => {
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!task) return;
    setSubmitting(true);
    try {
      await taskApi.delete(task.id);
      navigate('/');
    } catch (error) {
      console.error('Error deleting task:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <p className="text-gray-500 mb-4">Tarea no encontrada</p>
        <Link to="/" className="text-indigo-600 hover:text-indigo-700">
          Volver a la lista
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-xl font-semibold text-gray-900 truncate">Detalle</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={handleOpenEdit}>
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Editar
            </Button>
            <Button variant="ghost" size="sm" onClick={handleOpenDelete}>
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Eliminar
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-start gap-4">
            <Checkbox
              checked={task.completed}
              onChange={(e) => handleToggle(e.target.checked)}
            />
            <div className="flex-1 min-w-0">
              <h2
                className={clsx(
                  'text-2xl font-semibold text-gray-900',
                  task.completed && 'line-through text-gray-500'
                )}
              >
                {task.title}
              </h2>
              {task.description && (
                <p
                  className={clsx(
                    'mt-4 text-gray-600 whitespace-pre-wrap',
                    task.completed && 'line-through text-gray-400'
                  )}
                >
                  {task.description}
                </p>
              )}
              <div className="mt-6 flex gap-6 text-sm text-gray-400">
                <p>
                  Creada:{' '}
                  {new Date(task.createdAt).toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
                {task.updatedAt !== task.createdAt && (
                  <p>
                    Actualizada:{' '}
                    {new Date(task.updatedAt).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="Editar tarea"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={submitting || !formData.title.trim()}>
              {submitting ? 'Guardando...' : 'Guardar'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Título"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="¿Qué necesitas hacer?"
          />
          <Textarea
            label="Descripción"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Añade más detalles (opcional)"
            rows={4}
          />
        </div>
      </Dialog>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        title="Eliminar tarea"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleDelete} disabled={submitting}>
              {submitting ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </>
        }
      >
        <p className="text-gray-600">
          ¿Estás seguro de que quieres eliminar la tarea{' '}
          <strong>"{task.title}"</strong>? Esta acción no se puede deshacer.
        </p>
      </Dialog>
    </div>
  );
}