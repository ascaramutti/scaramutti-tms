import type { Service } from './services.interface';

export interface ServiceCardProps {
    service: Service;
    variant?: 'pending' | 'pending_start' | 'in_progress';
    onAction?: (id: number) => void;
    onViewDetail?: (id: number) => void;
}
