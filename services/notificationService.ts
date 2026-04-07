
import { Notification, SystemModule, NotificationPriority, Role } from '../types';

export const NotificationService = {
    /**
     * Cria uma nova notificação garantindo que não haja spam por consolidação
     */
    create: (
        prev: Notification[],
        data: Omit<Notification, 'id' | 'timestamp' | 'status'>
    ): Notification[] => {
        const now = Date.now();
        
        // Lógica de Consolidação: Se houver uma notificação similar não lida nos últimos 10 minutos, agrupa.
        const similarIndex = prev.findIndex(n => 
            n.status === 'UNREAD' && 
            n.originModule === data.originModule && 
            n.type === data.type &&
            n.targetUserId === data.targetUserId &&
            (now - n.timestamp) < 600000 // 10 minutos
        );

        if (similarIndex !== -1 && data.metadata?.consolidate) {
            const updated = [...prev];
            const old = updated[similarIndex];
            
            updated[similarIndex] = {
                ...old,
                timestamp: now,
                title: data.metadata.groupTitle || old.title,
                message: data.metadata.groupMessage || `Você tem novas atualizações em ${old.originModule}.`,
                priority: data.priority === 'HIGH' ? 'HIGH' : old.priority
            };
            return updated;
        }

        const newNotif: Notification = {
            ...data,
            id: `notif-${now}-${Math.random().toString(36).substr(2, 5)}`,
            timestamp: now,
            status: 'UNREAD'
        };

        return [newNotif, ...prev];
    },

    /**
     * Filtra notificações baseadas em tab selecionada
     */
    filterByTab: (list: Notification[], tab: string) => {
        const active = list.filter(n => n.status !== 'ARCHIVED');
        switch (tab) {
            case 'HIGH': return active.filter(n => n.priority === 'HIGH');
            case 'KANBAN': return active.filter(n => n.originModule === 'KANBAN');
            case 'FINANCE': return active.filter(n => n.originModule === 'FINANCE');
            case 'CRM': return active.filter(n => n.originModule === 'CRM');
            default: return active;
        }
    }
};
