"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface KanbanTask {
  id: string;
  title: string;
  description?: string;
  labels?: string[];
  assignee?: string;
}

export interface KanbanColumn {
  id: string;
  title: string;
  tasks: KanbanTask[];
}

export interface KanbanBoardProps {
  columns: KanbanColumn[];
  onColumnsChange?: (columns: KanbanColumn[]) => void;
  onTaskMove?: (taskId: string, fromColumnId: string, toColumnId: string) => void;
  onTaskAdd?: (columnId: string, title: string) => void;
  labelColors?: Record<string, string>;
  columnColors?: Record<string, string>;
  className?: string;
  allowAddTask?: boolean;
}

const defaultLabelColors: Record<string, string> = {
  research: "bg-pink-500",
  design: "bg-violet-500",
  frontend: "bg-blue-500",
  backend: "bg-emerald-500",
  devops: "bg-amber-500",
  docs: "bg-slate-500",
  urgent: "bg-red-500",
};

const defaultColumnColors: Record<string, string> = {
  backlog: "bg-slate-500",
  todo: "bg-blue-500",
  "in-progress": "bg-amber-500",
  review: "bg-violet-500",
  done: "bg-emerald-500",
};

export function KanbanBoard({
  columns: initialColumns,
  onColumnsChange,
  onTaskMove,
  onTaskAdd,
  labelColors = defaultLabelColors,
  columnColors = defaultColumnColors,
  className,
  allowAddTask = true,
}: KanbanBoardProps) {
  const [columns, setColumns] = React.useState(initialColumns);
  const [draggedTask, setDraggedTask] = React.useState<{
    task: KanbanTask;
    sourceColumnId: string;
  } | null>(null);
  const [dropTarget, setDropTarget] = React.useState<string | null>(null);
  const [addingCardTo, setAddingCardTo] = React.useState<string | null>(null);
  const [newCardTitle, setNewCardTitle] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (addingCardTo && inputRef.current) {
      inputRef.current.focus();
    }
  }, [addingCardTo]);

  React.useEffect(() => {
    setColumns(initialColumns);
  }, [initialColumns]);

  const handleDragStart = (task: KanbanTask, columnId: string) => {
    setDraggedTask({ task, sourceColumnId: columnId });
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    setDropTarget(columnId);
  };

  const handleDrop = (targetColumnId: string) => {
    if (!draggedTask || draggedTask.sourceColumnId === targetColumnId) {
      setDraggedTask(null);
      setDropTarget(null);
      return;
    }

    const newColumns = columns.map((col) => {
      if (col.id === draggedTask.sourceColumnId) {
        return { ...col, tasks: col.tasks.filter((t) => t.id !== draggedTask.task.id) };
      }
      if (col.id === targetColumnId) {
        return { ...col, tasks: [...col.tasks, draggedTask.task] };
      }
      return col;
    });

    setColumns(newColumns);
    onColumnsChange?.(newColumns);
    onTaskMove?.(draggedTask.task.id, draggedTask.sourceColumnId, targetColumnId);
    setDraggedTask(null);
    setDropTarget(null);
  };

  const handleAddCard = (columnId: string) => {
    if (!newCardTitle.trim()) return;

    const newTask: KanbanTask = {
      id: `task-${Date.now()}`,
      title: newCardTitle.trim(),
      labels: [],
    };

    const newColumns = columns.map((col) =>
      col.id === columnId ? { ...col, tasks: [...col.tasks, newTask] } : col
    );

    setColumns(newColumns);
    onColumnsChange?.(newColumns);
    onTaskAdd?.(columnId, newCardTitle.trim());
    setNewCardTitle("");
    setAddingCardTo(null);
  };

  const getColumnColor = (columnId: string) => columnColors[columnId] || "bg-slate-500";
  const getLabelColor = (label: string) => labelColors[label] || "bg-slate-500";

  return (
    <div className={cn("flex gap-4 overflow-x-auto p-4", className)}>
      {columns.map((column) => {
        const isDropActive = dropTarget === column.id && draggedTask?.sourceColumnId !== column.id;

        return (
          <div
            key={column.id}
            onDragOver={(e) => handleDragOver(e, column.id)}
            onDrop={() => handleDrop(column.id)}
            onDragLeave={() => setDropTarget(null)}
            className={cn(
              "min-w-[280px] max-w-[280px] rounded-xl p-3 transition-all duration-200",
              "bg-muted/50 border-2",
              isDropActive ? "border-primary/50 border-dashed bg-primary/5" : "border-transparent"
            )}
          >
            {/* Column Header */}
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={cn("h-2.5 w-2.5 rounded-full", getColumnColor(column.id))} />
                <h3 className="font-semibold text-foreground">{column.title}</h3>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  {column.tasks.length}
                </span>
              </div>
              <button className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <circle cx="8" cy="3" r="1.5" />
                  <circle cx="8" cy="8" r="1.5" />
                  <circle cx="8" cy="13" r="1.5" />
                </svg>
              </button>
            </div>

            {/* Tasks */}
            <div className="space-y-2">
              {column.tasks.map((task) => {
                const isDragging = draggedTask?.task.id === task.id;

                return (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={() => handleDragStart(task, column.id)}
                    onDragEnd={() => setDraggedTask(null)}
                    className={cn(
                      "cursor-grab rounded-lg border border-border bg-card p-3 shadow-sm transition-all duration-150",
                      "hover:-translate-y-0.5 hover:shadow-md active:cursor-grabbing",
                      isDragging && "rotate-2 opacity-50"
                    )}
                  >
                    {task.labels && task.labels.length > 0 && (
                      <div className="mb-2 flex flex-wrap gap-1.5">
                        {task.labels.map((label) => (
                          <span
                            key={label}
                            className={cn("h-1.5 w-8 rounded-full", getLabelColor(label))}
                          />
                        ))}
                      </div>
                    )}

                    <p className="text-sm font-medium text-card-foreground">{task.title}</p>

                    {task.description && (
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                        {task.description}
                      </p>
                    )}

                    {task.assignee && (
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                          {task.assignee.charAt(0).toUpperCase()}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Add Card */}
              {allowAddTask && (
                <>
                  {addingCardTo === column.id ? (
                    <div className="rounded-lg border border-border bg-card p-3 shadow-sm">
                      <input
                        ref={inputRef}
                        type="text"
                        value={newCardTitle}
                        onChange={(e) => setNewCardTitle(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAddCard(column.id)}
                        placeholder="Enter card title..."
                        className="mb-2 w-full border-none bg-transparent text-sm text-card-foreground outline-none placeholder:text-muted-foreground"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleAddCard(column.id)}
                          className="rounded bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                        >
                          Add Card
                        </button>
                        <button
                          onClick={() => {
                            setAddingCardTo(null);
                            setNewCardTitle("");
                          }}
                          className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          aria-label="Cancel"
                        >
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M4 4l8 8M12 4l-8 8" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setAddingCardTo(column.id)}
                      className="flex w-full items-center justify-center gap-1 rounded-lg p-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M8 3v10M3 8h10" />
                      </svg>
                      Add a card
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
