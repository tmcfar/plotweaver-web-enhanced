import {
  Project,
  SceneSpec,
  PreGeneratedScene,
  GeneratedScene,
  UsabilityScores,
  SceneContext
} from '../../types/preGeneration';
import { agentAPI } from '../api/agents';

type EventCallback = (...args: unknown[]) => void;

class SimpleEventEmitter {
  private events: Map<string, EventCallback[]> = new Map();

  on(event: string, callback: EventCallback) {
    const callbacks = this.events.get(event) || [];
    callbacks.push(callback);
    this.events.set(event, callbacks);
  }

  emit(event: string, ...args: unknown[]) {
    const callbacks = this.events.get(event) || [];
    callbacks.forEach(callback => callback(...args));
  }
}

export class PreGenerationManager extends SimpleEventEmitter {
  private queue: SceneSpec[] = [];
  private isProcessing = false;
  private cache = new Map<string, PreGeneratedScene>();

  constructor(private project: Project) {
    super();
  }

  start() {
    this.analyzeUpcomingScenes();
    this.startProcessing();
  }

  stop() {
    this.queue = [];
    this.isProcessing = false;
  }

  private analyzeUpcomingScenes() {
    const currentSceneIndex = this.project.getCurrentSceneIndex();
    const upcomingScenes = this.project.getScenes().slice(
      currentSceneIndex + 1,
      currentSceneIndex + 4 // Pre-generate next 3 scenes
    );

    upcomingScenes.forEach(scene => {
      if (!scene.content && !this.cache.has(scene.id)) {
        this.queue.push(scene);
      }
    });
  }

  private async startProcessing() {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;

    while (this.queue.length > 0) {
      const spec = this.queue.shift()!;

      try {
        const generated = await this.generateScene(spec);
        const validated = await this.validateScene(generated);

        if (validated.scores.overall >= 0.7) {
          this.cache.set(spec.id, validated);
          this.emit('scene-ready', validated);
        }
      } catch (error) {
        console.error('Pre-generation failed:', error);
      }

      // Rate limiting - wait 5 seconds between generations
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    this.isProcessing = false;
  }

  private async generateScene(spec: SceneSpec): Promise<GeneratedScene> {
    const context = await this.buildContext(spec);
    const response = await agentAPI.generateScene({
      ...spec,
      context,
      mode: 'pre-generation'
    });

    return {
      id: spec.id,
      title: spec.title,
      content: response.content,
      summary: response.summary,
      generatedAt: new Date()
    };
  }

  private async validateScene(scene: GeneratedScene): Promise<PreGeneratedScene> {
    const scores = await this.calculateScores();

    return {
      ...scene,
      scores,
      preview: scene.content.substring(0, 500) + '...'
    };
  }

  private async buildContext(spec: SceneSpec): Promise<SceneContext> {
    const previousScenes = await this.project.getScenesBefore(spec.id, 3);
    const characters = await this.project.getCharactersInScene(spec.id);
    const setting = await this.project.getSceneSetting(spec.id);

    return {
      previousScenes,
      characters,
      setting,
      plotPoint: spec.plotPoint,
      emotionalTone: spec.emotionalTone
    };
  }

  private async calculateScores(): Promise<UsabilityScores> {
    const [plotAlignment, characterConsistency, contextRelevance] = await Promise.all([
      this.checkPlotAlignment(),
      this.checkCharacterConsistency(),
      this.checkContextRelevance()
    ]);

    const overall = (plotAlignment + characterConsistency + contextRelevance) / 3;

    return {
      plotAlignment,
      characterConsistency,
      contextRelevance,
      overallQuality: overall,
      overall
    };
  } private async checkPlotAlignment(): Promise<number> {
    // Mock implementation - in real app this would call an API
    return 0.8;
  }

  private async checkCharacterConsistency(): Promise<number> {
    // Mock implementation - in real app this would call an API
    return 0.75;
  }

  private async checkContextRelevance(): Promise<number> {
    // Mock implementation - in real app this would call an API
    return 0.85;
  }

  getCache(): Map<string, PreGeneratedScene> {
    return this.cache;
  }
}