import { Type } from '@angular/core';
import { Injectable, Injector } from '@angular/core';
import { createCustomElement } from '@angular/elements';

@Injectable({
    providedIn: 'root'
})
export class ComponentLoaderService {
    private componentRegistry = {
        'lazy-component': {
            modulePath: './lazy-components/lazy-components.module#LazyComponentsModule',
            moduleRef: null
        }
    };

    constructor(private injector: Injector) {}

    registerComponent(name: string, component: Type<any>, modulePath: string = null) {
        const existing = customElements.get(name);
        if (!existing) {
            customElements.define(name, createCustomElement(component, { injector: this.injector }));

            if (!this.componentRegistry[name]) {
                this.componentRegistry[name] = {
                    modulePath,
                    moduleRef: null
                };
            }
        }
    }

    loadComponent(componentTag: string): Promise<HTMLElement> {
        const cmpRegistryEntry = this.componentRegistry[componentTag];
        if (!cmpRegistryEntry) {
            throw new Error(`Unrecognized component "${componentTag}". Make sure it is registered in the component registry`);
        }

        // No path so simple Angular Element already webpacked
        return new Promise((resolve, reject) => {
            const componentInstance = document.createElement(componentTag);
            resolve(componentInstance);
        });
    }
}
