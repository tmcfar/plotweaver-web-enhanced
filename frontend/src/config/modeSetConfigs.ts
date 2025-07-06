export type ModeSetId = 'professional-writer' | 'ai-first' | 'editor' | 'hobbyist';

export interface PanelConfig {
  visible: boolean;
  defaultWidth?: number;
  defaultHeight?: number;
  minSize?: number;
  maxSize?: number;
  content?: string[];
  tabs?: string[];
  showAdvanced?: boolean;
}

export interface ModeSetConfig {
  panels: {
    left: PanelConfig;
    right: PanelConfig;
    bottom: PanelConfig;
  };
  features: Record<string, boolean>;
  editor: {
    showLineNumbers?: boolean;
    showMinimap?: boolean;
    wordWrap?: 'on' | 'off' | 'bounded';
    readOnly?: boolean;
    simplifiedToolbar?: boolean;
  };
}

export const MODE_SET_CONFIGS: Record<ModeSetId, ModeSetConfig> = {
  'professional-writer': {
    panels: {
      left: {
        visible: true,
        defaultWidth: 220,
        minSize: 200,
        maxSize: 400,
        content: ['file-tree', 'git-status'],
        showAdvanced: true
      },
      right: {
        visible: true,
        defaultWidth: 275,
        minSize: 250,
        maxSize: 500,
        content: ['context', 'agent-queue', 'stats']
      },
      bottom: {
        visible: true,
        defaultHeight: 175,
        minSize: 150,
        maxSize: 400,
        tabs: ['console', 'problems', 'git', 'terminal']
      }
    },
    features: {
      manualSave: true,
      gitOperations: true,
      advancedSearch: true,
      lockManagement: true,
      customShortcuts: true
    },
    editor: {
      showLineNumbers: true,
      showMinimap: true,
      wordWrap: 'on'
    }
  },
  
  'ai-first': {
    panels: {
      left: {
        visible: true,
        defaultWidth: 200,
        minSize: 180,
        maxSize: 300,
        content: ['simplified-tree'],
        showAdvanced: false
      },
      right: {
        visible: true,
        defaultWidth: 300,
        minSize: 280,
        maxSize: 450,
        content: ['ai-assistant', 'suggestions', 'pre-generated']
      },
      bottom: {
        visible: false
      }
    },
    features: {
      autoSave: true,
      autoGeneration: true,
      preGeneration: true,
      simplifiedUI: true,
      oneClickActions: true
    },
    editor: {
      showLineNumbers: false,
      showMinimap: false,
      wordWrap: 'on'
    }
  },
  
  'editor': {
    panels: {
      left: {
        visible: true,
        defaultWidth: 250,
        minSize: 200,
        maxSize: 400,
        content: ['manuscript-structure', 'annotations'],
        showAdvanced: false
      },
      right: {
        visible: true,
        defaultWidth: 350,
        minSize: 300,
        maxSize: 500,
        content: ['comments', 'review-tools', 'reports']
      },
      bottom: {
        visible: true,
        defaultHeight: 200,
        minSize: 150,
        maxSize: 350,
        tabs: ['notes', 'statistics', 'versions']
      }
    },
    features: {
      readOnly: true,
      annotations: true,
      commenting: true,
      trackChanges: true,
      exportTools: true
    },
    editor: {
      showLineNumbers: true,
      showMinimap: false,
      wordWrap: 'on',
      readOnly: true
    }
  },
  
  'hobbyist': {
    panels: {
      left: {
        visible: true,
        defaultWidth: 180,
        minSize: 150,
        maxSize: 250,
        content: ['simple-files', 'progress'],
        showAdvanced: false
      },
      right: {
        visible: false
      },
      bottom: {
        visible: false
      }
    },
    features: {
      autoSave: true,
      templates: true,
      achievements: true,
      prompts: true,
      budgetControls: true
    },
    editor: {
      showLineNumbers: false,
      showMinimap: false,
      wordWrap: 'on',
      simplifiedToolbar: true
    }
  }
};
