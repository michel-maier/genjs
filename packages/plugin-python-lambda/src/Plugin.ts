import {IGenerator, IPlugin} from '@genjs/genjs';
import Package from './Package';

export default class Plugin implements IPlugin {
    register(generator: IGenerator): void {
        generator.registerPackager('python-lambda', cfg => new Package(cfg));
    }
}