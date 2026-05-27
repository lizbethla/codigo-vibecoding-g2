import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { taskApi, authApi } from '../services/api';
import type { Task, CreateTaskInput } from '../types/Task';
import { TaskList } from '../components/TaskList';
import { Button } from '../components/ui/Button';
import { Dialog } from '../components/ui/Dialog';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { getUser, clearAuth } from '../lib/auth';

export function HomePage() {
  const navigate = useNavigate();
  const user = getUser();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState<CreateTaskInput>({ title: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchTasks = async () => {
    try {
      const data = await taskApi.getAll();
      setTasks(data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // token may already be invalid — proceed anyway
    }
    clearAuth();
    navigate('/login', { replace: true });
  };

  const handleOpenCreate = () => {
    setSelectedTask(null);
    setFormData({ title: '', description: '' });
    setDialogOpen(true);
  };

  const handleOpenEdit = (task: Task) => {
    setSelectedTask(task);
    setFormData({ title: task.title, description: task.description });
    setDialogOpen(true);
  };

  const handleOpenDelete = (task: Task) => {
    setSelectedTask(task);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) return;
    setSubmitting(true);
    try {
      if (selectedTask) {
        await taskApi.update(selectedTask.id, formData);
      } else {
        await taskApi.create(formData);
      }
      setDialogOpen(false);
      fetchTasks();
    } catch (error) {
      console.error('Error saving task:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (id: string, completed: boolean) => {
    try {
      await taskApi.update(id, { completed });
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, completed } : t))
      );
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  };

  const handleDelete = async () => {
    if (!selectedTask) return;
    setSubmitting(true);
    try {
      await taskApi.delete(selectedTask.id);
      setDeleteDialogOpen(false);
      setTasks((prev) => prev.filter((t) => t.id !== selectedTask.id));
    } catch (error) {
      console.error('Error deleting task:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Tareas</h1>
            {user && (
              <p className="text-xs text-gray-400">{user.name} {user.lastname}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleOpenCreate}>
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nueva
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout} title="Cerrar sesión">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <TaskList
          tasks={tasks}
          loading={loading}
          onToggle={handleToggle}
          onEdit={handleOpenEdit}
          onDelete={handleOpenDelete}
        />
      </main>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={selectedTask ? 'Editar tarea' : 'Nueva tarea'}
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
            autoFocus
          />
          <Textarea
            label="Descripción"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Añade más detalles (opcional)"
            rows={3}
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
          <strong>"{selectedTask?.title}"</strong>? Esta acción no se puede deshacer.
        </p>
      </Dialog>
    </div>
  );
}
