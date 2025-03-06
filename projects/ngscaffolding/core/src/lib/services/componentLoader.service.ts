import { Component, ComponentRef, Type, ViewContainerRef } from '@angular/core';
import { Injectable, Injector } from '@angular/core';


@Injectable({
    providedIn: 'root'
})
export class ComponentLoaderService {
    private componentRegistry = {
        'lazy-component': {
            modulePath: './lazy-components/lazy-components.module#LazyComponentsModule',
        moduleRef: null as any
        }
    };

    constructor(private injector: Injector, ) {}

    getComponentType(componentTag: string): Type<any> {
      return (this.componentRegistry as any)[componentTag];
        }

    registerComponent(name: string, component: Type<any>, modulePath: string = '') {
        // const existing = customElements.get(name);
        // if (!existing) {
        //     customElements.define(name, createCustomElement(component, { injector: this.injector }));

        //     if (!this.componentRegistry[name]) {
        //         this.componentRegistry[name] = {
        //             modulePath,
        //             moduleRef: null
        //         };
        //     }
        // }
        (this.componentRegistry as any)[name] = component;
    }

    loadComponent(componentTag: string, vrc: ViewContainerRef): Promise<ComponentRef<any>> {
        const cmpRegistryEntry = (this.componentRegistry as any)[componentTag];
        if (!cmpRegistryEntry) {
            throw new Error(`Unrecognized component "${componentTag}". Make sure it is registered in the component registry`);
        }

        // No path so simple Angular Element already webpacked
        // return new Promise((resolve, reject) => {
        //     const componentInstance = document.createElement(componentTag);
        //     resolve(componentInstance);
        // });

        return new Promise((resolve, reject) => {
            const newComponent = vrc.createComponent(cmpRegistryEntry);

            resolve(newComponent);
        });
    }
}
