import { InferenceSession } from 'onnxruntime-web';
import { Environment } from '../../config/environment';

interface ModelSource {
  huggingFaceId: string;
  fallbackUrl: string;
  version: string;
  checksum: string;
}

interface ModelConfig {
  name: string;
  path: string;
  size: number;
  type: 'acoustic' | 'vocoder';
}

class ModelLoader {
  private static readonly MODELS: Record<string, ModelSource> = {
    'zonos-tts-base': {
      huggingFaceId: 'rebots/zonos-tts-base',
      fallbackUrl: `${Environment.API_URL}/models/zonos-tts-base.onnx`,
      version: '1.0.0',
      checksum: 'sha256-...' // TODO: Add actual checksum
    },
    // Add other models here
  };

  private static instance: ModelLoader;
  private loadedModels: Map<string, InferenceSession> = new Map();
  private loadingPromises: Map<string, Promise<InferenceSession>> = new Map();
  private modelConfigs: Map<string, ModelConfig> = new Map();

  private constructor() {
    // Initialize with default models
    this.registerModel({
      name: 'base_acoustic',
      path: '/models/base_acoustic.onnx',
      size: 25 * 1024 * 1024, // 25MB
      type: 'acoustic'
    });

    this.registerModel({
      name: 'base_vocoder',
      path: '/models/base_vocoder.onnx',
      size: 15 * 1024 * 1024, // 15MB
      type: 'vocoder'
    });
  }

  public static getInstance(): ModelLoader {
    if (!ModelLoader.instance) {
      ModelLoader.instance = new ModelLoader();
    }
    return ModelLoader.instance;
  }

  public registerModel(config: ModelConfig) {
    this.modelConfigs.set(config.name, config);
  }

  public async loadModel(name: string): Promise<InferenceSession> {
    // Check if model is already loaded
    if (this.loadedModels.has(name)) {
      return this.loadedModels.get(name)!;
    }

    // Check if model is currently loading
    if (this.loadingPromises.has(name)) {
      return this.loadingPromises.get(name)!;
    }

    const config = this.modelConfigs.get(name);
    if (!config) {
      throw new Error(`Model ${name} not registered`);
    }

    // Create loading promise
    const loadingPromise = this.createLoadingPromise(config);
    this.loadingPromises.set(name, loadingPromise);

    try {
      const session = await loadingPromise;
      this.loadedModels.set(name, session);
      this.loadingPromises.delete(name);
      return session;
    } catch (error) {
      this.loadingPromises.delete(name);
      throw error;
    }
  }

  private async createLoadingPromise(config: ModelConfig): Promise<InferenceSession> {
    // Try Hugging Face first
    try {
      const hfResponse = await fetch(
        `https://huggingface.co/${ModelLoader.MODELS[config.name].huggingFaceId}/resolve/main/model.onnx`,
        { cache: 'force-cache' }
      );
      
      if (hfResponse.ok) {
        const modelData = await hfResponse.arrayBuffer();
        if (await this.verifyChecksum(modelData, ModelLoader.MODELS[config.name].checksum)) {
          console.log(`Successfully loaded ${config.name} from Hugging Face`);
          return await this.createSession(modelData);
        }
      }
    } catch (error) {
      console.warn(`Failed to load ${config.name} from Hugging Face, falling back to server`, error);
    }

    // Fallback to our server
    try {
      const fallbackResponse = await fetch(ModelLoader.MODELS[config.name].fallbackUrl, { cache: 'force-cache' });
      if (!fallbackResponse.ok) {
        throw new Error(`Failed to load model from fallback server: ${fallbackResponse.statusText}`);
      }
      
      const modelData = await fallbackResponse.arrayBuffer();
      if (await this.verifyChecksum(modelData, ModelLoader.MODELS[config.name].checksum)) {
        console.log(`Successfully loaded ${config.name} from fallback server`);
        return await this.createSession(modelData);
      }
      throw new Error('Model checksum verification failed');
    } catch (error) {
      throw new Error(`Failed to load model ${config.name}: ${error.message}`);
    }
  }

  private async createSession(modelArrayBuffer: ArrayBuffer): Promise<InferenceSession> {
    // Create session options
    const options = {
      executionProviders: ['wasm'],
      graphOptimizationLevel: 'all',
    };

    // Create and return session
    return await InferenceSession.create(modelArrayBuffer, options);
  }

  private static async verifyChecksum(arrayBuffer: ArrayBuffer, expectedChecksum: string): Promise<boolean> {
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return `sha256-${hashHex}` === expectedChecksum;
  }

  public async preloadModels(types: ('acoustic' | 'vocoder')[] = ['acoustic', 'vocoder']) {
    const preloadPromises = Array.from(this.modelConfigs.values())
      .filter(config => types.includes(config.type))
      .map(config => this.loadModel(config.name));

    await Promise.all(preloadPromises);
  }

  public async unloadModel(name: string) {
    const session = this.loadedModels.get(name);
    if (session) {
      try {
        // Clean up ONNX session
        await session.release();
        this.loadedModels.delete(name);
      } catch (error) {
        console.error(`Error unloading model ${name}:`, error);
      }
    }
  }

  public getLoadedModels(): string[] {
    return Array.from(this.loadedModels.keys());
  }

  public getModelConfig(name: string): ModelConfig | undefined {
    return this.modelConfigs.get(name);
  }

  public isModelLoaded(name: string): boolean {
    return this.loadedModels.has(name);
  }

  public isModelLoading(name: string): boolean {
    return this.loadingPromises.has(name);
  }
}
