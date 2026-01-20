export interface DashboardStats {
    services: {
        pending_assignment: number;
        pending_start: number;
        in_progress: number;
        completed_week: number;
    };
    resources_on_road: {
        drivers_active: number;
        drivers_total: number;
        tractors_active: number;
        tractors_total: number;
    };
    week_cycle: {
        start: string;
        end: string;
    };
}

export interface StatsCardsProps {
  stats: DashboardStats | null;
  onNavigate?: (route: string) => void;
  isLoading: boolean;
}