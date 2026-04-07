import { Task } from '../types';

export interface KanbanMetrics {
    inProgress: number;
    overdue: number;
    completed: number;
    pending: number;
    archived: number;
    bottlenecks: number;
}

export const calculateKanbanMetrics = (tasks: Task[], userId?: string | 'ALL', squadId?: string | 'ALL'): KanbanMetrics => {
    const today = new Date().toISOString().split('T')[0];
    
    const baseTasks = tasks.filter(t => {
        const isSquadMatch = !squadId || squadId === 'ALL' || t.squadId === squadId;
        const isUserMatch = !userId || userId === 'ALL' || t.assigneeIds.includes(userId);
        return isSquadMatch && isUserMatch;
    });

    return {
        inProgress: baseTasks.filter(t => t.status !== 'BACKLOG' && t.status !== 'DONE' && !t.archived).length,
        overdue: baseTasks.filter(t => t.dueDate < today && t.status !== 'DONE' && !t.archived).length,
        completed: baseTasks.filter(t => t.status === 'DONE' && !t.archived).length,
        pending: baseTasks.filter(t => t.status === 'BACKLOG' && !t.archived).length,
        archived: baseTasks.filter(t => t.archived).length,
        bottlenecks: baseTasks.filter(t => {
            const realHours = t.timeLogs.reduce((s, l) => s + (l.duration || 0), 0) / 3600;
            return t.estimatedTime > 0 && realHours > t.estimatedTime;
        }).length
    };
};
