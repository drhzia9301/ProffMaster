import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

const STORAGE_KEY_HAPTICS = 'supersix_haptics_enabled';

class HapticsService {
    private static instance: HapticsService;
    private isEnabled: boolean = true;

    private constructor() {
        this.loadSettings();
    }

    public static getInstance(): HapticsService {
        if (!HapticsService.instance) {
            HapticsService.instance = new HapticsService();
        }
        return HapticsService.instance;
    }

    private loadSettings() {
        const stored = localStorage.getItem(STORAGE_KEY_HAPTICS);
        this.isEnabled = stored !== null ? JSON.parse(stored) : true;
    }

    public getEnabled(): boolean {
        return this.isEnabled;
    }

    public toggle(enabled: boolean) {
        this.isEnabled = enabled;
        localStorage.setItem(STORAGE_KEY_HAPTICS, JSON.stringify(enabled));
        if (enabled) {
            this.impact(ImpactStyle.Light);
        }
    }

    public async impact(style: ImpactStyle = ImpactStyle.Light) {
        if (!this.isEnabled) return;
        try {
            await Haptics.impact({ style });
        } catch (e) {
            // Ignore errors (e.g. on web)
        }
    }

    public async notification(type: NotificationType) {
        if (!this.isEnabled) return;
        try {
            await Haptics.notification({ type });
        } catch (e) {
            // Ignore errors
        }
    }

    public async vibrate() {
        if (!this.isEnabled) return;
        try {
            await Haptics.vibrate();
        } catch (e) {
            // Ignore errors
        }
    }
}

export const hapticsService = HapticsService.getInstance();
export { ImpactStyle, NotificationType };
