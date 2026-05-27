import { Link } from 'react-router-dom';
import type { Task } from '../types/Task';
import { Checkbox } from './ui/Checkbox';
import { clsx } from 'clsx';

interface TaskCardProps {
  task: Task;
  onToggle: (id: string, completed: boolean) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

export function TaskCard({ task, onToggle, onEdit, onDelete }: TaskCardProps) {
  return (
    <div
      className={clsx(
        'p-4 bg-white border rounded-lg transition-shadow hover:shadow-md',
        task.completed && 'opacity-60'
      )}
    >
      <div className="flex items-start gap-3">
        <Checkbox
          checked={task.completed}
          onChange={(e) => onToggle(task.id, e.target.checked)}
        />
        <Link to={`/tasks/${task.id}`} className="flex-1 min-w-0 group">
          <h3
            className={clsx(
              'font-medium text-gray-900 truncate group-hover:text-indigo-600 transition-colors',
              task.completed && 'line-through text-gray-500'
            )}
          >
            {task.title}
          </h3>
          {task.description && (
            <p
              className={clsx(
                'mt-1 text-sm text-gray-500 line-clamp-2',
                task.completed && 'line-through'
              )}
            >
              {task.description}
            </p>
          )}
        </Link>
        <div className="flex gap-1">
          <button
            onClick={() => onEdit(task)}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            title="Editar"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </button>
          <button
            onClick={() => onDelete(task)}
            className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
            title="Eliminar"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>
      <p className="mt-2 text-xs text-gray-400 ml-7">
        {new Date(task.createdAt).toLocaleDateString('es-ES', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })}
      </p>
    </div>
  );
}