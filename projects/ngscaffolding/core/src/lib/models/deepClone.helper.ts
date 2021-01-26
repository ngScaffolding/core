export class DeepCloneHelper {
    public static getDeepCopy(obj) {
        let copy;

        // Call to string here to remove immutability
        if(obj instanceof String){
            return obj.toString();
        }
        // Handle the 3 simple types, and null or undefined
        // tslint:disable-next-line: triple-equals
        if (null == obj || 'object' != typeof obj) {
            return obj;
        }

        // Handle Date
        if (obj instanceof Date) {
            copy = new Date();
            copy.setTime(obj.getTime());
            return copy;
        }

        // Handle Array
        if (obj instanceof Array) {
            copy = [];
            for (let i = 0, len = obj.length; i < len; i++) {
                copy[i] = DeepCloneHelper.getDeepCopy(obj[i]);
            }
            return copy;
        }

        // Handle Object
        if (obj instanceof Object) {
            copy = {};
            for (let attr in obj) {
                if (attr !== 'component' && obj.hasOwnProperty(attr)) {
                    copy[attr] = DeepCloneHelper.getDeepCopy(obj[attr]);
                }
            }
            return copy;
        }

        throw new Error('Unable to copy obj! Its type is not supported.');
    }
}
