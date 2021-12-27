export class Emitter<T> {

    callbacks: EmitterListenerCallback<T>[] = [];
    
    listen(cb: EmitterListenerCallback<T>) {
        if (this.callbacks.includes(cb)) return false;
        this.callbacks.push(cb);
        return true;
    }

    remove(cb: EmitterListenerCallback<T>) {
        const idx = this.callbacks.indexOf(cb);
        if (idx != -1) this.callbacks.splice(idx, 1);
    }

    emit(obj: T) {
        this.callbacks.forEach(cb => cb(obj));
    }
    
}

export type EmitterListenerCallback<T> = (obj: T) => any;
