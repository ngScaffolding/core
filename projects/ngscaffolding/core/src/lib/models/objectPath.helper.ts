export class ObjectPathHelper {
    public static get(model: object, path: string) {
        if (!path.includes('.')) {
            return model[path];
        } else {
            return this.getNode(model, path);
        }
    }
    public static set(model: object, path: string, value: any) {
        if (!path.includes('.')) {
            model[path] = value;
        } else {
            let prop = this.getNode(model, path);
            prop = value;
        }
    }

    private static getNode(model: object, path: string) {
        const pathNodes = path.split('.');
        let pointer = model;
        pathNodes.forEach(nodeName => {
            pointer = pointer[nodeName];
        });
        return pointer;
    }
}
