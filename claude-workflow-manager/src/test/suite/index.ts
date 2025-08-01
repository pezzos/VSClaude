import * as path from 'path';
import { glob } from 'glob';

export function run(): Promise<void> {
    // Create the mocha test - import dynamically to avoid issues
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Mocha = require('mocha');
    
    const mocha = new Mocha({
        ui: 'tdd',
        color: true
    });

    const testsRoot = path.resolve(__dirname, '..');

    return new Promise((c, e) => {
        glob('**/**.test.js', { cwd: testsRoot })
            .then((files: string[]) => {
                // Add files to the test suite
                files.forEach((f: string) => mocha.addFile(path.resolve(testsRoot, f)));

                try {
                    // Run the mocha test
                    mocha.run((failures: number) => {
                        if (failures > 0) {
                            e(new Error(`${failures} tests failed.`));
                        } else {
                            c();
                        }
                    });
                } catch (err) {
                    console.error(err);
                    e(err);
                }
            })
            .catch((err: unknown) => {
                e(err);
            });
    });
}