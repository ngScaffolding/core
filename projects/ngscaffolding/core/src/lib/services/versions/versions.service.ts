import { Injectable } from '@angular/core';
import { LoggingService } from '../logging/logging.service';

export class SoftwareVersion {
    module: string;
    version: string;
    isAppModule: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class VersionsService {
    private versions: SoftwareVersion[];

    constructor(private logging: LoggingService) {
        this.versions = [];
    }
    addVersion(module: string, version: string, isAppModule = false) {
        this.logging.info(`Loading Module ${module} Version ${version} IsAppModule ${isAppModule}`);
        this.versions.push({
            module,
            version,
            isAppModule
        });
    }
    getVersions(): SoftwareVersion[] {
        return this.versions;
    }

    getVersion(moduleName: string): string {
        const foundModule = this.versions.find(v => v.module === moduleName);
        if (foundModule) {
            return foundModule.version;
        } else {
            return null;
        }
    }
}
