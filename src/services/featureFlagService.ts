// Feature Flag Service für sichere, schrittweise Aktivierung neuer Features
export interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  enabledFor?: string[]; // Specific user IDs or roles
  rolloutPercentage?: number; // For gradual rollout
  dependencies?: string[]; // Other feature flags this depends on
}

// Phoenix Engine Feature Flags
export const PHOENIX_FEATURES = {
  GENESIS_EYE: 'phoenix_genesis_eye',
  GENESIS_EYE_AR: 'phoenix_genesis_eye_ar',
  GENESIS_EYE_AI_VISION: 'phoenix_genesis_eye_ai_vision',
  AUTONOMY_CORE: 'phoenix_autonomy_core',
  AUTONOMY_CORE_RESOURCES: 'phoenix_autonomy_core_resources',
  AUTONOMY_CORE_DIGITAL_FOREMAN: 'phoenix_autonomy_core_digital_foreman',
  ORACLE: 'phoenix_oracle',
  ORACLE_PROFIT_ANALYSIS: 'phoenix_oracle_profit_analysis',
  ORACLE_DAMAGE_AI: 'phoenix_oracle_damage_ai',
  ORACLE_MARKETPLACE: 'phoenix_oracle_marketplace'
};

class FeatureFlagService {
  private flags: Map<string, FeatureFlag> = new Map();
  private userId: string | null = null;

  constructor() {
    this.initializeFlags();
    this.loadFromStorage();
  }

  private initializeFlags() {
    // Phoenix Engine Features - Defaultmäßig deaktiviert
    const phoenixFlags: FeatureFlag[] = [
      {
        id: PHOENIX_FEATURES.GENESIS_EYE,
        name: 'Genesis-Auge Basis',
        description: 'Basis-Modul für KI-gestützte Projekterfassung',
        enabled: false
      },
      {
        id: PHOENIX_FEATURES.GENESIS_EYE_AR,
        name: 'Genesis-Auge AR',
        description: 'AR-Scanning für Raumerfassung',
        enabled: false,
        dependencies: [PHOENIX_FEATURES.GENESIS_EYE]
      },
      {
        id: PHOENIX_FEATURES.GENESIS_EYE_AI_VISION,
        name: 'Genesis-Auge AI Vision',
        description: 'GPT-4 Vision Integration für Objekterkennung',
        enabled: false,
        dependencies: [PHOENIX_FEATURES.GENESIS_EYE]
      },
      {
        id: PHOENIX_FEATURES.AUTONOMY_CORE,
        name: 'Autonomie-Kern Basis',
        description: 'Basis-Modul für autonome Auftragsverwaltung',
        enabled: false
      },
      {
        id: PHOENIX_FEATURES.AUTONOMY_CORE_RESOURCES,
        name: 'Autonomie-Kern Ressourcen',
        description: 'Automatische Ressourcenplanung und Materialbeschaffung',
        enabled: false,
        dependencies: [PHOENIX_FEATURES.AUTONOMY_CORE]
      },
      {
        id: PHOENIX_FEATURES.AUTONOMY_CORE_DIGITAL_FOREMAN,
        name: 'Digitaler Vorarbeiter',
        description: 'Mission-basierte Mitarbeiterführung',
        enabled: false,
        dependencies: [PHOENIX_FEATURES.AUTONOMY_CORE]
      },
      {
        id: PHOENIX_FEATURES.ORACLE,
        name: 'Orakel Basis',
        description: 'Basis-Modul für Finanzen und Analyse',
        enabled: false
      },
      {
        id: PHOENIX_FEATURES.ORACLE_PROFIT_ANALYSIS,
        name: 'Orakel Profit-Analyse',
        description: 'Echtzeit-Profitabilitäts-Dashboard',
        enabled: false,
        dependencies: [PHOENIX_FEATURES.ORACLE]
      },
      {
        id: PHOENIX_FEATURES.ORACLE_DAMAGE_AI,
        name: 'Orakel Schadens-KI',
        description: 'Automatisierte Schadensregulierung',
        enabled: false,
        dependencies: [PHOENIX_FEATURES.ORACLE]
      },
      {
        id: PHOENIX_FEATURES.ORACLE_MARKETPLACE,
        name: 'Orakel Marktplatz',
        description: 'Automatischer Wiederverkauf von Gegenständen',
        enabled: false,
        dependencies: [PHOENIX_FEATURES.ORACLE]
      }
    ];

    phoenixFlags.forEach(flag => this.flags.set(flag.id, flag));
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem('featureFlags');
      if (stored) {
        const parsed = JSON.parse(stored);
        Object.entries(parsed).forEach(([id, enabled]) => {
          const flag = this.flags.get(id);
          if (flag && typeof enabled === 'boolean') {
            flag.enabled = enabled;
          }
        });
      }
    } catch (error) {
      console.error('Failed to load feature flags:', error);
    }
  }

  private saveToStorage() {
    try {
      const toStore: Record<string, boolean> = {};
      this.flags.forEach((flag, id) => {
        toStore[id] = flag.enabled;
      });
      localStorage.setItem('featureFlags', JSON.stringify(toStore));
    } catch (error) {
      console.error('Failed to save feature flags:', error);
    }
  }

  setUserId(userId: string | null) {
    this.userId = userId;
  }

  isEnabled(featureId: string): boolean {
    const flag = this.flags.get(featureId);
    if (!flag) return false;

    // Check if dependencies are met
    if (flag.dependencies) {
      for (const dep of flag.dependencies) {
        if (!this.isEnabled(dep)) {
          return false;
        }
      }
    }

    // Check basic enabled state
    if (!flag.enabled) return false;

    // Check user-specific enabling
    if (flag.enabledFor && this.userId) {
      return flag.enabledFor.includes(this.userId);
    }

    // Check rollout percentage
    if (flag.rolloutPercentage !== undefined && flag.rolloutPercentage < 100) {
      // Simple hash-based rollout
      const hash = this.hashUserId(this.userId || 'anonymous');
      const percentage = (hash % 100) + 1;
      return percentage <= flag.rolloutPercentage;
    }

    return true;
  }

  private hashUserId(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  enableFeature(featureId: string, enabled: boolean = true) {
    const flag = this.flags.get(featureId);
    if (flag) {
      flag.enabled = enabled;
      this.saveToStorage();
      
      // Emit event for UI updates
      window.dispatchEvent(new CustomEvent('featureFlagChanged', {
        detail: { featureId, enabled }
      }));
    }
  }

  getAllFlags(): FeatureFlag[] {
    return Array.from(this.flags.values());
  }

  getPhoenixFlags(): FeatureFlag[] {
    return this.getAllFlags().filter(flag => flag.id.startsWith('phoenix_'));
  }

  // Check if any Phoenix features are enabled
  isPhoenixEnabled(): boolean {
    return this.getPhoenixFlags().some(flag => flag.enabled);
  }

  // Enable/disable all Phoenix features
  setPhoenixEnabled(enabled: boolean) {
    this.getPhoenixFlags().forEach(flag => {
      this.enableFeature(flag.id, enabled);
    });
  }

  // Get feature status for debugging
  getFeatureStatus(): Record<string, boolean> {
    const status: Record<string, boolean> = {};
    this.flags.forEach((flag, id) => {
      status[id] = this.isEnabled(id);
    });
    return status;
  }
}

export const featureFlagService = new FeatureFlagService();